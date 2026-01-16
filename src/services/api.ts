import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG, HTTP_STATUS, ERROR_MESSAGES } from '../config/api';

// Token storage utilities
const TOKEN_STORAGE_KEY = 'nevostack_tokens';
const DEVICE_ID_KEY = 'nevostack_device_id';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.DEFAULT_HEADERS,
      withCredentials: true, // Important for cookies
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token to requests
    this.api.interceptors.request.use(
      (config) => {
        const tokens = this.getStoredTokens();
        const deviceId = this.getDeviceId();
        
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        
        if (deviceId) {
          config.headers['X-Device-Id'] = deviceId;
        }
        
        if (tokens?.refreshToken) {
          config.headers['X-Refresh-Token'] = tokens.refreshToken;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle token refresh
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        // Check if server sent new tokens in headers
        const newAccessToken = response.headers['x-new-access-token'];
        const newRefreshToken = response.headers['x-new-refresh-token'];
        const tokenRefreshed = response.headers['x-token-refreshed'];

        if (tokenRefreshed === 'true' && newAccessToken && newRefreshToken) {
          console.log('🔄 Tokens automatically refreshed by server');
          this.storeTokens({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes from now
          });
        }

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 errors (token expired)
        if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.api(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const tokens = this.getStoredTokens();
            const deviceId = this.getDeviceId();

            if (!tokens?.refreshToken || !deviceId) {
              throw new Error('No refresh token or device ID available');
            }

            console.log('🔄 Attempting automatic token refresh...');
            
            // Call refresh endpoint
            const refreshResponse = await axios.post(
              `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
              {
                refreshToken: tokens.refreshToken,
                deviceId: deviceId
              },
              {
                withCredentials: true,
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );

            if (refreshResponse.data.success) {
              const newTokens = refreshResponse.data.tokens;
              
              // Store new tokens
              this.storeTokens({
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken,
                expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes from now
              });

              console.log('✅ Tokens refreshed successfully');

              // Update the original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              }

              // Process queued requests
              this.processQueue(null);

              // Retry the original request
              return this.api(originalRequest);
            } else {
              throw new Error('Token refresh failed');
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            
            // Clear stored tokens
            this.clearStoredTokens();
            
            // Process queued requests with error
            this.processQueue(refreshError);
            
            // Redirect to login or show login modal
            this.handleAuthFailure();
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
    
    this.failedQueue = [];
  }

  private handleAuthFailure() {
    // Clear all stored data
    this.clearStoredTokens();
    
    // Dispatch custom event for auth failure
    window.dispatchEvent(new CustomEvent('auth:failed', {
      detail: { message: 'Session expired. Please login again.' }
    }));
    
    // Optionally redirect to login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // Token storage methods
  private getStoredTokens(): TokenData | null {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        const tokens = JSON.parse(stored);
        // Return stored tokens even if access token expiry passed so the client
        // can still send the refresh token to the server to obtain new tokens.
        // We keep the tokens object intact (it contains accessToken, refreshToken and expiresAt).
        return tokens;
      }
    } catch (error) {
      console.error('Error reading stored tokens:', error);
      this.clearStoredTokens();
    }
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      if (accessToken && refreshToken) {
        return {
          accessToken,
          refreshToken,
          expiresAt: Date.now() + (15 * 60 * 1000)
        };
      }
    } catch (error) {
      console.error('Error reading legacy tokens:', error);
    }
    return null;
  }

  private storeTokens(tokens: TokenData) {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  private clearStoredTokens() {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  private getDeviceId(): string | null {
    try {
      return localStorage.getItem(DEVICE_ID_KEY);
    } catch (error) {
      console.error('Error reading device ID:', error);
      return null;
    }
  }

  public setDeviceId(deviceId: string) {
    try {
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    } catch (error) {
      console.error('Error storing device ID:', error);
    }
  }

  public setTokens(tokens: { accessToken: string; refreshToken: string }) {
    this.storeTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes from now
    });
  }

  public clearAuth() {
    this.clearStoredTokens();
    localStorage.removeItem(DEVICE_ID_KEY);
  }

  public isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    return !!(tokens?.accessToken && tokens?.refreshToken);
  }

  public getStoredTokensPublic(): TokenData | null {
    return this.getStoredTokens();
  }

  // HTTP Methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.patch<T>(url, data, config);
    return response.data;
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }

  // Upload method with progress
  public async upload<T = any>(
    url: string, 
    formData: FormData, 
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const response = await this.api.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
export { ApiService };
