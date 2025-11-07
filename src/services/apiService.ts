import { API_CONFIG, HTTP_STATUS, ERROR_MESSAGES, type ApiResponse, type ApiError, type RequestOptions } from '@/config/api';
import { authService } from './authService';

class ApiService {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.defaultHeaders = API_CONFIG.DEFAULT_HEADERS;
  }

  // Generic request method with retry logic
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = API_CONFIG.TIMEOUT,
      retries = API_CONFIG.RETRY.attempts,
      retryDelay = API_CONFIG.RETRY.delay,
      ...fetchOptions
    } = options;

    // Defensive: ensure endpoint is a string and not undefined to avoid requests to `${baseURL}undefined`
    endpoint = endpoint ?? '';
    if (endpoint && !endpoint.startsWith('/')) endpoint = `/${endpoint}`;
    const url = `${this.baseURL}${endpoint}`;
    
    // Prepare headers
    const headers = {
      ...this.defaultHeaders,
      ...fetchOptions.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    // If body is FormData, remove Content-Type so browser sets boundary automatically
    if (fetchOptions && fetchOptions.body instanceof FormData) {
      if (headers['Content-Type']) delete headers['Content-Type'];
    }

    // Add auth token if available
    const token = authService.getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const requestConfig: RequestInit = {
      ...fetchOptions,
      headers
    };

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...requestConfig,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
          await this.handleHttpError(response);
          // If handleHttpError returns (e.g. after token refresh), retry the request
          // without attempting to read the same response body again.
          continue;
        }

        const data: ApiResponse<T> = await response.json();
        return data;

      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (this.shouldNotRetry(error as Error)) {
          throw this.createApiError((error as Error) || new Error(ERROR_MESSAGES.UNKNOWN));
        }

        // Wait before retry (except on last attempt)
        if (attempt < retries) {
          await this.delay(retryDelay * (attempt + 1));
        }
      }
    }

    throw this.createApiError(lastError || new Error(ERROR_MESSAGES.UNKNOWN));
  }

  // Handle HTTP errors
  private async handleHttpError(response: Response): Promise<void> {
    let errorData: ApiError;
    
    try {
      // Use a clone so callers can still read the original body if needed
      errorData = await response.clone().json();
    } catch {
      errorData = {
        error: ERROR_MESSAGES.UNKNOWN,
        message: `HTTP ${response.status}`,
        statusCode: response.status,
        timestamp: new Date().toISOString()
      };
    }

    // Handle specific status codes
    switch (response.status) {
      case HTTP_STATUS.UNAUTHORIZED:
        console.log('API: 401 Unauthorized, attempting token refresh...');
        // Try to refresh token
        const refreshToken = authService.getRefreshToken();
        if (refreshToken) {
          console.log('API: Refresh token found, attempting refresh...');
          try {
            await authService.refreshToken();
            console.log('API: Token refresh successful');
            return; // Token refreshed, let the request retry
          } catch (refreshError) {
            console.error('API: Token refresh failed:', refreshError);
            // Refresh failed, logout user but don't reload page
            authService.logout();
            localStorage.removeItem('nevostack_auth');
            localStorage.removeItem('nevostack_user');
            console.log('🔄 API: Token refresh failed - clearing auth state');
            // Let the auth provider handle the state change instead of reloading
          }
        } else {
          console.log('API: No refresh token found, clearing auth state');
          authService.logout();
          localStorage.removeItem('nevostack_auth');
          localStorage.removeItem('nevostack_user');
          console.log('🔄 API: No refresh token - clearing auth state');
          // Let the auth provider handle the state change instead of reloading
        }
        break;
        
      case HTTP_STATUS.FORBIDDEN:
        errorData.error = ERROR_MESSAGES.FORBIDDEN;
        break;
        
      case HTTP_STATUS.NOT_FOUND:
        errorData.error = ERROR_MESSAGES.NOT_FOUND;
        break;
        
      case HTTP_STATUS.UNPROCESSABLE_ENTITY:
        errorData.error = ERROR_MESSAGES.VALIDATION_ERROR;
        break;
        
      case HTTP_STATUS.TOO_MANY_REQUESTS:
        errorData.error = 'Too many requests. Please wait and try again.';
        break;
        
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        errorData.error = ERROR_MESSAGES.SERVER_ERROR;
        break;
    }

    throw new Error(errorData.message || errorData.error);
  }

  // Check if error should not be retried
  private shouldNotRetry(error: Error): boolean {
    // Don't retry on authentication errors
    if (error.message.includes('401') || error.message.includes('403')) {
      return true;
    }
    
    // Don't retry on validation errors
    if (error.message.includes('400') || error.message.includes('422')) {
      return true;
    }
    
    return false;
  }

  // Create standardized API error
  private createApiError(error: Error | undefined): Error {
    if (!error) {
      return new Error(ERROR_MESSAGES.UNKNOWN);
    }

    if (error.name === 'AbortError') {
      return new Error(ERROR_MESSAGES.TIMEOUT);
    }

    if (error.message && error.message.includes('fetch')) {
      return new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }

    return error;
  }

  // Delay utility for retries
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // HTTP Methods
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET'
    });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    // If caller passed a FormData, forward as-is (don't stringify and let request handler remove content-type)
    if (data instanceof FormData) {
      return this.request<T>(endpoint, {
        ...options,
        method: 'POST',
        body: data
      });
    }

    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }

  // File upload method
  async upload<T>(endpoint: string, file: File, data?: Record<string, any>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it
        Authorization: authService.getAccessToken() ? `Bearer ${authService.getAccessToken()}` : ''
      }
    });
  }

  // Download file method
  async downloadFile(endpoint: string, filename?: string): Promise<Blob> {
    const token = authService.getAccessToken();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // If filename provided, trigger download
    if (filename) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }

    return blob;
  }

  // Paginated request method
  async getPaginated<T>(
    endpoint: string, 
    params: {
      page?: number;
      limit?: number;
      search?: string;
      sort?: string;
      order?: 'asc' | 'desc';
      filters?: Record<string, any>;
    } = {}
  ): Promise<ApiResponse<T[]>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'filters' && typeof value === 'object') {
          Object.entries(value).forEach(([filterKey, filterValue]) => {
            if (filterValue !== undefined && filterValue !== null) {
              searchParams.append(filterKey, String(filterValue));
            }
          });
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    const url = searchParams.toString() ? `${endpoint}?${searchParams}` : endpoint;
    return this.get<T[]>(url);
  }

  // Bulk operations
  async bulkOperation<T>(
    endpoint: string,
    operation: string,
    ids: string[],
    data?: any
  ): Promise<ApiResponse<T>> {
    return this.post<T>(`${endpoint}/bulk`, {
      operation,
      ids,
      ...data
    });
  }
}

// Create singleton instance
export const apiService = new ApiService();
export default apiService;
