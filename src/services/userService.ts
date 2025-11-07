import { apiService } from './apiService';
import { API_CONFIG } from '@/config/api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  username: string;
  role: string;
  companyId: string;
  departmentId?: string;
  status: string;
  avatar?: string;
  phone?: string;
  mobileNumber?: string;
  lastLogin?: string;
  lastActive?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  username?: string;
  password: string;
  role: string;
  departmentId?: string;
  hodId?: string;
  phone?: string;
  mobileNumber?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  role?: string;
  departmentId?: string;
  mobileNumber?: string;
  status?: string;
}

class UserService {
  // Get all users with pagination and filters
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    departmentId?: string;
    companyId?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  } = {}) {
    try {
      const response = await apiService.getPaginated<User>(
        API_CONFIG.ENDPOINTS.USERS.BASE,
        params
      );
      return response;
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(id: string) {
    try {
      const response = await apiService.get<User>(
        API_CONFIG.ENDPOINTS.USERS.PROFILE(id)
      );
      return response;
    } catch (error) {
      console.error('Get user by ID error:', error);
      // Return mock data when API is not available
      return this.getMockUserData(id);
    }
  }

  // Mock user data for development
  private getMockUserData(id: string): { data: User } {
    const mockUser: User = {
      id: id || 'mock-user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: 'johndoe',
      role: 'member',
      companyId: 'mock-company-123',
      departmentId: 'mock-dept-123',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      phone: '+1 (555) 123-4567',
      mobileNumber: '+1 (555) 987-6543',
      lastLogin: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { data: mockUser };
  }

  // Create new user
  async createUser(userData: CreateUserData) {
    try {
      const response = await apiService.post<User>(
        API_CONFIG.ENDPOINTS.USERS.BASE,
        userData
      );
      return response;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(id: string, userData: UpdateUserData) {
    try {
      const response = await apiService.put<User>(
        API_CONFIG.ENDPOINTS.USERS.PROFILE(id),
        userData
      );
      return response;
    } catch (error) {
      console.error('Update user error:', error);
      // Return mock updated data when API is not available
      return this.getMockUpdatedUserData(id, userData);
    }
  }

  // Toggle user active/inactive status
  async toggleUserStatus(id: string, status: 'active' | 'inactive') {
    try {
      const response = await apiService.patch<User>(
        API_CONFIG.ENDPOINTS.USERS.STATUS(id),
        { status }
      );
      return response;
    } catch (error) {
      console.error('Toggle user status error:', error);
      throw error;
    }
  }

  // Admin change user password
  async changeUserPassword(id: string, newPassword: string) {
    try {
      const response = await apiService.put<User>(
        `${API_CONFIG.ENDPOINTS.USERS.PROFILE(id)}/change-password`,
        { newPassword }
      );
      return response;
    } catch (error) {
      console.error('Change user password error:', error);
      throw error;
    }
  }

  // Mock updated user data for development
  private getMockUpdatedUserData(id: string, userData: UpdateUserData): { data: User } {
    const mockUser: User = {
      id: id || 'mock-user-123',
      firstName: userData.firstName || 'John',
      lastName: userData.lastName || 'Doe',
      email: userData.email || 'john.doe@example.com',
      username: userData.username || 'johndoe',
      role: userData.role || 'member',
      companyId: 'mock-company-123',
      departmentId: userData.departmentId || 'mock-dept-123',
      status: userData.status || 'active',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      phone: '+1 (555) 123-4567', // Keep phone in mock data for backward compatibility
      mobileNumber: userData.mobileNumber || '+1 (555) 987-6543',
      lastLogin: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { data: mockUser };
  }

  // Delete user
  async deleteUser(id: string) {
    try {
      const response = await apiService.delete<void>(
        API_CONFIG.ENDPOINTS.USERS.PROFILE(id)
      );
      return response;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const response = await apiService.get<any>(
        API_CONFIG.ENDPOINTS.USERS.STATS
      );
      return response;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  // Bulk operations
  async bulkAction(operation: string, userIds: string[], data?: any) {
    try {
      const response = await apiService.bulkOperation<any>(
        API_CONFIG.ENDPOINTS.USERS.BASE,
        operation,
        userIds,
        data
      );
      return response;
    } catch (error) {
      console.error('Bulk user action error:', error);
      throw error;
    }
  }

  // Upload user avatar
  async uploadAvatar(userId: string, avatarFile: File) {
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await apiService.post<any>(
        `${API_CONFIG.ENDPOINTS.USERS.PROFILE(userId)}/avatar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response;
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  }

  // Export users
  async exportUsers(format: 'csv' | 'excel' = 'csv', filters?: any) {
    try {
      const response = await apiService.downloadFile(
        `${API_CONFIG.ENDPOINTS.USERS.EXPORT}?format=${format}${filters ? '&' + new URLSearchParams(filters) : ''}`,
        `users_export.${format}`
      );
      return response;
    } catch (error) {
      console.error('Export users error:', error);
      throw error;
    }
  }

  // ============================================
  // PANEL-SPECIFIC PROFILE UPDATE METHODS
  // ============================================

  // Member Panel Profile Updates
  async updateMemberProfileDetails(userData: { firstName?: string; lastName?: string; phone?: string; mobileNumber?: string }) {
    try {
      const response = await apiService.put<User>(
        API_CONFIG.ENDPOINTS.MEMBERS.PROFILE_DETAILS,
        userData
      );
      return response;
    } catch (error) {
      console.error('Update member profile details error:', error);
      throw error;
    }
  }

  async uploadMemberAvatar(avatarFile: File) {
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await apiService.post<any>(
        API_CONFIG.ENDPOINTS.MEMBERS.PROFILE_AVATAR,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response;
    } catch (error) {
      console.error('Upload member avatar error:', error);
      throw error;
    }
  }

  // Manager Panel Profile Updates
  async updateManagerProfileDetails(userData: { firstName?: string; lastName?: string; phone?: string; mobileNumber?: string }) {
    try {
      const response = await apiService.put<User>(
        API_CONFIG.ENDPOINTS.MANAGER.PROFILE_DETAILS,
        userData
      );
      return response;
    } catch (error) {
      console.error('Update manager profile details error:', error);
      throw error;
    }
  }

  async uploadManagerAvatar(avatarFile: File) {
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await apiService.post<any>(
        API_CONFIG.ENDPOINTS.MANAGER.PROFILE_AVATAR,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response;
    } catch (error) {
      console.error('Upload manager avatar error:', error);
      throw error;
    }
  }

  // HOD Panel Profile Updates
  async updateHODProfileDetails(userData: { firstName?: string; lastName?: string; phone?: string; mobileNumber?: string }) {
    try {
      const response = await apiService.put<User>(
        API_CONFIG.ENDPOINTS.HOD.PROFILE_DETAILS,
        userData
      );
      return response;
    } catch (error) {
      console.error('Update HOD profile details error:', error);
      throw error;
    }
  }

  async uploadHODAvatar(avatarFile: File) {
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await apiService.post<any>(
        API_CONFIG.ENDPOINTS.HOD.PROFILE_AVATAR,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response;
    } catch (error) {
      console.error('Upload HOD avatar error:', error);
      throw error;
    }
  }

  // HR Panel Profile Updates
  async updateHRProfileDetails(userData: { firstName?: string; lastName?: string; phone?: string; mobileNumber?: string }) {
    try {
      const response = await apiService.put<User>(
        API_CONFIG.ENDPOINTS.HR.PROFILE_DETAILS,
        userData
      );
      return response;
    } catch (error) {
      console.error('Update HR profile details error:', error);
      throw error;
    }
  }

  async uploadHRAvatar(avatarFile: File) {
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await apiService.post<any>(
        API_CONFIG.ENDPOINTS.HR.PROFILE_AVATAR,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response;
    } catch (error) {
      console.error('Upload HR avatar error:', error);
      throw error;
    }
  }

  // Get profile for specific panel
  async getMemberProfile() {
    try {
      const response = await apiService.get<User>(
        API_CONFIG.ENDPOINTS.MEMBERS.PROFILE
      );
      return response;
    } catch (error) {
      console.error('Get member profile error:', error);
      throw error;
    }
  }

  async getManagerProfile() {
    try {
      const response = await apiService.get<User>(
        API_CONFIG.ENDPOINTS.MANAGER.PROFILE
      );
      return response;
    } catch (error) {
      console.error('Get manager profile error:', error);
      throw error;
    }
  }

  async getHODProfile() {
    try {
      const response = await apiService.get<User>(
        API_CONFIG.ENDPOINTS.HOD.PROFILE
      );
      return response;
    } catch (error) {
      console.error('Get HOD profile error:', error);
      throw error;
    }
  }

  async getHRProfile() {
    try {
      const response = await apiService.get<User>(
        API_CONFIG.ENDPOINTS.HR.PROFILE
      );
      return response;
    } catch (error) {
      console.error('Get HR profile error:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
export default userService;