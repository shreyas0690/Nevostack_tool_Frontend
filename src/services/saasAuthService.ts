import { API_CONFIG } from '@/config/api';

interface SaaSLoginCredentials {
  email: string;
  password: string;
}

interface SaaSLoginResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
    avatar?: string;
  };
  device: {
    id: string;
    deviceId: string;
    deviceName: string;
    deviceType: string;
    browser: string;
    os: string;
    isTrusted: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

class SaaSAuthService {
  private baseURL = API_CONFIG.BASE_URL;

  // SaaS Admin Login
  async login(credentials: SaaSLoginCredentials): Promise<SaaSLoginResponse> {
    try {
      const deviceInfo = this.getDeviceInfo();

      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          deviceInfo
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Login failed');
      }

      // Validate SaaS admin access
      if (data.user.role !== 'super_admin') {
        throw new Error('Access denied. Only SaaS Super Administrators can access this panel.');
      }

      // Store SaaS admin tokens and user data
      this.setTokens(data.tokens);
      this.setSaaSUser(data.user);
      this.setSaaSDevice(data.device);

      console.log('✅ SaaS Admin login successful:', data.user.email);
      return data;
    } catch (error) {
      console.error('❌ SaaS Admin login error:', error);
      throw error;
    }
  }

  // SaaS Admin Logout
  async logout(): Promise<void> {
    try {
      const deviceId = this.getSaaSDevice()?.deviceId;

      await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.LOGOUT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify({
          logoutAll: false,
          deviceId
        })
      });

      // Clear SaaS admin data
      this.clearSaaSAuth();
      console.log('✅ SaaS Admin logout successful');
    } catch (error) {
      console.error('❌ SaaS Admin logout error:', error);
      // Clear tokens even if API call fails
      this.clearSaaSAuth();
    }
  }

  // Check if SaaS admin is authenticated
  isSaaSAuthenticated(): boolean {
    const token = this.getAccessToken();
    const user = this.getSaaSUser();

    if (!token || !user) return false;

    // Validate SaaS admin role
    if (user.role !== 'super_admin') {
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  // Get current SaaS admin user
  getSaaSUser(): any {
    const user = localStorage.getItem('saas_user');
    return user ? JSON.parse(user) : null;
  }

  // Get SaaS device info
  getSaaSDevice(): any {
    const device = localStorage.getItem('saas_device');
    return device ? JSON.parse(device) : null;
  }

  // Get access token
  getAccessToken(): string | null {
    return localStorage.getItem('saas_access_token');
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem('saas_refresh_token');
  }

  // Refresh promise to handle concurrent refresh requests
  private refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

  // Refresh SaaS admin token
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    if (this.refreshPromise) {
      console.log('🔄 SaaS Token refresh already in progress, reusing promise');
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken();
        const deviceId = this.getSaaSDevice()?.deviceId;

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken,
            deviceId
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Token refresh failed');
        }

        // Update tokens
        this.setTokens(data.tokens);
        return data.tokens;
      } catch (error) {
        console.error('❌ SaaS token refresh error:', error);
        // Clear tokens and force re-login
        this.clearSaaSAuth();
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Authenticated fetch for SaaS API calls
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getAccessToken();

    // Ensure we use the full URL including backend base
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;

    console.log('🔍 SaaS Authenticated Fetch - URL:', fullUrl);
    console.log('🔍 SaaS Authenticated Fetch - Token available:', !!token);
    console.log('🔍 SaaS Authenticated Fetch - Token preview:', token?.substring(0, 20) + '...');

    if (!token) {
      throw new Error('No SaaS access token available');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('🔍 SaaS Authenticated Fetch - Headers:', { ...headers, 'Authorization': `Bearer ${token.substring(0, 20)}...` });

    const response = await fetch(fullUrl, {
      ...options,
      headers
    });

    // If token is expired, try to refresh
    if (response.status === 401) {
      try {
        await this.refreshToken();
        const newToken = this.getAccessToken();

        return fetch(fullUrl, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        // Refresh failed, clear auth and throw
        this.clearSaaSAuth();
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  }

  // Private helper methods
  private setTokens(tokens: { accessToken: string; refreshToken: string }): void {
    localStorage.setItem('saas_access_token', tokens.accessToken);
    localStorage.setItem('saas_refresh_token', tokens.refreshToken);
  }

  private setSaaSUser(user: any): void {
    localStorage.setItem('saas_user', JSON.stringify(user));
  }

  private setSaaSDevice(device: any): void {
    localStorage.setItem('saas_device', JSON.stringify(device));
  }

  private clearSaaSAuth(): void {
    localStorage.removeItem('saas_access_token');
    localStorage.removeItem('saas_refresh_token');
    localStorage.removeItem('saas_user');
    localStorage.removeItem('saas_device');
  }

  private getDeviceInfo(): any {
    if (typeof window === 'undefined') return {};

    return {
      deviceName: `${navigator.platform} - SaaS Admin`,
      touchSupport: 'ontouchstart' in window,
      webGLSupport: !!window.WebGLRenderingContext,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === '1',
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1
    };
  }
}

// Create singleton instance
export const saasAuthService = new SaaSAuthService();
export default saasAuthService;
