import apiService from './api';
import { API_CONFIG } from '../config/api';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: {
    deviceName?: string;
    touchSupport?: boolean;
    webGLSupport?: boolean;
    cookieEnabled?: boolean;
    doNotTrack?: string | boolean;
    screenResolution?: string;
    colorDepth?: number;
    pixelRatio?: number;
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string;
  avatar?: string;
  status: string;
  departmentId?: string;
  managedMemberIds?: string[];
}

export interface Device {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  browser: string;
  os: string;
  isTrusted: boolean;
  firstLogin: string;
  loginCount: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  device: Device;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId?: string;
  departmentId?: string;
}

export interface CompanyRegistrationData {
  companyName: string;
  companyEmail: string;
  companyPhone?: string;
  domain: string;
  address?: any;
  industry?: string;
  employeeCount?: string;
  adminName: string;
  adminEmail: string;
  adminUsername: string;
  adminPassword: string;
}

class AuthService {
  private currentUser: User | null = null;

  // Login
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiService.post<LoginResponse>(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      if (response.success) {
        // Store tokens and device info
        apiService.setTokens(response.tokens);
        apiService.setDeviceId(response.device.deviceId);
        
        // Store user info
        this.currentUser = response.user;
        this.storeUserInfo(response.user);

        console.log('✅ Login successful:', response.user.email);
        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  }

  // Register
  async register(data: RegisterData): Promise<any> {
    try {
      const response = await apiService.post(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER,
        data
      );

      if (response.success) {
        console.log('✅ Registration successful:', response.user.email);
        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    }
  }

  // Register Company
  async registerCompany(data: CompanyRegistrationData): Promise<any> {
    try {
      const response = await apiService.post(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER_COMPANY,
        data
      );

      if (response.success) {
        console.log('✅ Company registration successful:', data.companyName);
        return response;
      } else {
        throw new Error(response.message || 'Company registration failed');
      }
    } catch (error: any) {
      console.error('❌ Company registration error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Company registration failed');
    }
  }

  // Logout
  async logout(logoutAll: boolean = false): Promise<void> {
    try {
      const deviceId = apiService.getDeviceId();
      const tokens = apiService.getStoredTokensPublic();
      
      // Try to logout from server
      try {
        await apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
          deviceId,
          logoutAll
        });
        console.log('✅ Server logout successful');
      } catch (serverError: any) {
        console.warn('⚠️ Server logout failed, continuing with local logout:', serverError.message);
        // Continue with local logout even if server request fails
      }
    } catch (error: any) {
      console.error('❌ Logout error:', error);
    } finally {
      // Always clear local data regardless of server response
      this.clearAuth();
      console.log('✅ Local logout completed');
    }
  }

  // Get current user profile
  async getProfile(): Promise<User> {
    try {
      const response = await apiService.get<{ success: boolean; user: User }>(
        API_CONFIG.ENDPOINTS.AUTH.PROFILE
      );

      if (response.success) {
        this.currentUser = response.user;
        this.storeUserInfo(response.user);
        return response.user;
      } else {
        throw new Error('Failed to get profile');
      }
    } catch (error: any) {
      console.error('❌ Get profile error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get profile');
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await apiService.post(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        currentPassword,
        newPassword
      });

      if (response.success) {
        console.log('✅ Password changed successfully');
      } else {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error: any) {
      console.error('❌ Change password error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Password change failed');
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return apiService.isAuthenticated() && !!this.getCurrentUser();
  }

  // Get current user
  getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to get from localStorage
    const stored = this.getStoredUserInfo();
    if (stored) {
      this.currentUser = stored;
      return stored;
    }

    return null;
  }

  // Clear authentication data
  clearAuth(): void {
    this.currentUser = null;
    apiService.clearAuth();
    this.clearStoredUserInfo();
    
    // Dispatch logout event
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  // Store user info in localStorage
  private storeUserInfo(user: User): void {
    try {
      localStorage.setItem('nevostack_user', JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user info:', error);
    }
  }

  // Get stored user info
  private getStoredUserInfo(): User | null {
    try {
      const stored = localStorage.getItem('nevostack_user');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading stored user info:', error);
      return null;
    }
  }

  // Clear stored user info
  private clearStoredUserInfo(): void {
    try {
      localStorage.removeItem('nevostack_user');
    } catch (error) {
      console.error('Error clearing stored user info:', error);
    }
  }

  // Initialize auth state (call on app startup)
  async initializeAuth(): Promise<boolean> {
    try {
      if (this.isAuthenticated()) {
        // Try to get fresh profile data
        await this.getProfile();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Auth initialization failed:', error);
      this.clearAuth();
      return false;
    }
  }

  // Get user role
  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user?.role || null;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  // Get company ID
  getCompanyId(): string | null {
    const user = this.getCurrentUser();
    return user?.companyId || null;
  }

  // Get department ID
  getDepartmentId(): string | null {
    const user = this.getCurrentUser();
    return user?.departmentId || null;
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
export { AuthService };
