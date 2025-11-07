import { useDeviceActivity } from '@/hooks/useDeviceActivity';
import { API_CONFIG } from '@/config/api';

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId?: string;
    avatar?: string;
    status: string;
  };
  device: {
    id: string;
    deviceId: string;
    deviceName: string;
    deviceType: string;
    browser: string;
    os: string;
    isTrusted: boolean;
    firstLogin: string;
    loginCount: number;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

interface Device {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  ipAddress: string;
  isActive: boolean;
  isTrusted: boolean;
  lastActive: string;
  loginCount: number;
  status: string;
  location?: {
    country?: string;
    city?: string;
  };
}

class AuthService {
  private baseURL = API_CONFIG.BASE_URL;

  // Login user - STRICT MODE: Only succeed if backend explicitly returns success
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    console.log('🔐 authService.login called with:', credentials);

    // CRITICAL: Clear any existing auth data before attempting login
    console.log('🧹 Clearing any existing auth data before login attempt');
    localStorage.removeItem('nevostack_auth');
    localStorage.removeItem('nevostack_user');
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('device');
    localStorage.removeItem('deviceId');

    try {
      const deviceInfo = this.getDeviceInfo();
      console.log('📡 Making API call to:', `${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`);

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

      console.log('📡 API Response status:', response.status);

      const data = await response.json();
      console.log('📡 API Response data:', data);

      if (!response.ok) {
        console.log('❌ API returned error, throwing:', data.error || data.message);
        throw new Error(data.error || data.message || 'Login failed');
      }

      // Double-check that we have valid user data
      if (!data.success || !data.user) {
        console.log('❌ API returned success but no valid user data');
        throw new Error('Invalid response from server');
      }

      // Store tokens
      this.setTokens(data.tokens);

      // Store user info
      console.log('Storing user data during login:', data.user, 'Avatar:', data.user.avatar);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('device', JSON.stringify(data.device));

      console.log('✅ authService.login successful, returning data');
      return data;
    } catch (error) {
      console.error('❌ authService.login failed:', error);
      console.log('💥 Throwing error, NO fallback to mock data EVER');

      // Ensure auth data is cleared on failure
      localStorage.removeItem('nevostack_auth');
      localStorage.removeItem('nevostack_user');
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('device');
      localStorage.removeItem('deviceId');

      // Re-throw the error - NO FALLBACK TO MOCK DATA
      throw error;
    }
  }

  // Try real login first, then fallback to mock
  private async tryRealLogin(credentials: LoginCredentials): Promise<LoginResponse | null> {
    try {
      const deviceInfo = this.getDeviceInfo();
      
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials, // Use the actual login credentials provided
          deviceInfo
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Real login successful:', data.user.email);
        return data;
      }
      return null;
    } catch (error) {
      console.log('⚠️ Real login failed, using mock data');
      return null;
    }
  }

  // Mock login data method REMOVED - no more fallback to mock data

  // Logout user
  async logout(logoutAll: boolean = false): Promise<void> {
    try {
      const deviceId = localStorage.getItem('deviceId');
      const device = localStorage.getItem('device');
      let currentDeviceId = deviceId;
      
      // Try to get device ID from stored device info if not in localStorage
      if (!currentDeviceId && device) {
        try {
          const deviceData = JSON.parse(device);
          currentDeviceId = deviceData.deviceId;
        } catch (e) {
          console.warn('Failed to parse device data for logout:', e);
        }
      }

      console.log('Logging out with:', {
        logoutAll,
        deviceId: currentDeviceId,
        hasAccessToken: !!this.getAccessToken()
      });
      
      await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.LOGOUT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify({ logoutAll, deviceId: currentDeviceId })
      });

      // Clear local storage
      this.clearTokens();
      localStorage.removeItem('user');
      localStorage.removeItem('device');
      localStorage.removeItem('deviceId');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear tokens even if API call fails
      this.clearTokens();
    }
  }

  // Refresh access token
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const refreshToken = this.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const deviceId = localStorage.getItem('deviceId');
      const device = localStorage.getItem('device');
      let currentDeviceId = deviceId;
      
      // Try to get device ID from stored device info if not in localStorage
      if (!currentDeviceId && device) {
        try {
          const deviceData = JSON.parse(device);
          currentDeviceId = deviceData.deviceId;
        } catch (e) {
          console.warn('Failed to parse device data:', e);
        }
      }

      console.log('Refreshing token with:', {
        hasRefreshToken: !!refreshToken,
        deviceId: currentDeviceId,
        endpoint: `${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`
      });

      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          refreshToken,
          deviceId: currentDeviceId
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
      console.error('Token refresh error:', error);
      // Clear tokens but don't reload page - let auth provider handle logout
      this.clearTokens();
      localStorage.removeItem('user');
      localStorage.removeItem('device');
      localStorage.removeItem('deviceId');
      localStorage.removeItem('nevostack_auth');
      localStorage.removeItem('nevostack_user');
      
      // Instead of reloading page, just throw error so AuthProvider can handle
      console.log('🔄 Refresh token failed - AuthProvider will handle logout');
      throw error;
    }
  }

  // Get user devices
  async getDevices(): Promise<{ devices: Device[]; total: number; active: number }> {
    try {
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.DEVICES.BASE}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch devices');
      }

      return data;
    } catch (error) {
      console.error('Get devices error:', error);
      throw error;
    }
  }

  // Perform device action (trust, lock, logout, etc.)
  async performDeviceAction(deviceId: string, action: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.DEVICES.BASE}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify({ deviceId, action })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Device action failed');
      }
    } catch (error) {
      console.error('Device action error:', error);
      throw error;
    }
  }

  // Delete device
  async deleteDevice(deviceId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.DEVICES.BASE}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify({ deviceId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete device');
      }
    } catch (error) {
      console.error('Delete device error:', error);
      throw error;
    }
  }

  // Get device activity
  async getDeviceActivity(limit: number = 50, offset: number = 0): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.DEVICES.ACTIVITY}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify({ limit, offset })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch device activity');
      }

      return data;
    } catch (error) {
      console.error('Get device activity error:', error);
      throw error;
    }
  }

  // Get device settings
  async getDeviceSettings(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.DEVICES.SETTINGS}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch device settings');
      }

      return data;
    } catch (error) {
      console.error('Get device settings error:', error);
      throw error;
    }
  }

  // Update device settings
  async updateDeviceSettings(settings: any): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.DEVICES.SETTINGS}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update device settings');
      }
    } catch (error) {
      console.error('Update device settings error:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to change password');
      }

      return result;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  // Get current user
  getCurrentUser(): any {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      console.log('👤 Current user from localStorage:', userData.email, 'Company ID:', userData.companyId);
      return userData;
    }

    console.log('⚠️ No user in localStorage, returning null');
    return null; // Don't create mock user automatically
  }

  // Update current user in localStorage
  updateCurrentUser(updatedUserData: any): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updatedUserData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('👤 Updated user in localStorage:', updatedUser.email, 'Avatar:', updatedUser.avatar, 'Mobile:', updatedUser.mobileNumber);
    }
  }

  // Get current device
  getCurrentDevice(): any {
    const device = localStorage.getItem('device');
    return device ? JSON.parse(device) : null;
  }

  // Get access token
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  // Set tokens
  private setTokens(tokens: { accessToken: string; refreshToken: string }): void {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  // Clear tokens
  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Get device information
  private getDeviceInfo(): any {
    if (typeof window === 'undefined') return {};

    return {
      deviceName: `${navigator.platform} - ${navigator.userAgent.split(' ').pop()}`,
      touchSupport: 'ontouchstart' in window,
      webGLSupport: !!window.WebGLRenderingContext,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === '1',
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1
    };
  }

  // Create authenticated fetch wrapper
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getAccessToken();
    
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });

    // If token is expired, try to refresh
    if (response.status === 401) {
      try {
        await this.refreshToken();
        const newToken = this.getAccessToken();
        
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`
          }
        });
      } catch (error) {
        // Refresh failed, clear all auth data and reload
        this.clearTokens();
        localStorage.removeItem('user');
        localStorage.removeItem('device');
        localStorage.removeItem('deviceId');
        localStorage.removeItem('nevostack_auth');
        localStorage.removeItem('nevostack_user');
        window.location.reload();
        throw error;
      }
    }

    return response;
  }
}

// Create singleton instance
export const authService = new AuthService();
export default authService;



