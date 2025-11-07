import { apiService } from './apiService';
import { API_CONFIG } from '@/config/api';

export interface Company {
  id: string;
  name: string;
  domain: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  logo?: string;
  status: 'active' | 'inactive' | 'suspended';
  subscription: {
    plan: 'basic' | 'pro' | 'enterprise';
    status: 'active' | 'inactive' | 'suspended' | 'cancelled';
    startDate: Date;
    endDate?: Date;
    features: string[];
    billingCycle: 'monthly' | 'quarterly' | 'yearly';
    amount: number;
    currency: string;
  };
  settings: {
    theme: 'default' | 'dark' | 'custom';
    timezone: string;
    language: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    security: {
      twoFactorRequired: boolean;
      passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
      };
      sessionTimeout: number;
      maxLoginAttempts: number;
      lockoutDuration: number;
    };
    features: {
      attendance: boolean;
      leaveManagement: boolean;
      taskManagement: boolean;
      meetingScheduler: boolean;
      deviceTracking: boolean;
      reports: boolean;
      notifications: boolean;
    };
  };
  limits: {
    maxUsers: number;
    maxDepartments: number;
    maxDevicesPerUser: number;
    storageLimit: number;
    apiRateLimit: number;
  };
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalDepartments: number;
    lastActivity: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateCompanyData {
  name?: string;
  domain?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  logo?: string;
  settings?: Partial<Company['settings']>;
}

class CompanyService {
  // Get company by ID
  async getCompanyById(id: string) {
    try {
      const response = await apiService.get<any>(
        API_CONFIG.ENDPOINTS.COMPANIES.BY_ID(id)
      );
      
      // Handle backend response format: {success: true, company: {...}}
      if (response.success && response.company) {
        console.log('✅ Company data loaded from API:', response.company.name);
        return { data: response.company };
      }
      
      // Fallback to direct data if response format is different
      return { data: response };
    } catch (error) {
      console.warn('Company API not available, using mock data:', error.message);
      // Return mock data when API is not available
      return this.getMockCompanyData(id);
    }
  }

  // Mock company data for development
  private getMockCompanyData(id: string): { data: Company } {
    const mockCompany: Company = {
      id: id || 'mock-company-123',
      name: 'Acme Corporation',
      domain: 'acme.com',
      email: 'info@acme.com',
      phone: '+1 (555) 123-4567',
      address: {
        street: '123 Business Street',
        city: 'San Francisco',
        state: 'California',
        country: 'United States',
        zipCode: '94107'
      },
      logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
      status: 'active',
      subscription: {
        plan: 'pro',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        features: ['attendance', 'leaveManagement', 'taskManagement', 'meetingScheduler', 'reports'],
        billingCycle: 'monthly',
        amount: 99,
        currency: 'USD'
      },
      settings: {
        theme: 'default',
        timezone: 'America/New_York',
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        security: {
          twoFactorRequired: false,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false
          },
          sessionTimeout: 30,
          maxLoginAttempts: 5,
          lockoutDuration: 30
        },
        features: {
          attendance: true,
          leaveManagement: true,
          taskManagement: true,
          meetingScheduler: true,
          deviceTracking: true,
          reports: true,
          notifications: true
        }
      },
      limits: {
        maxUsers: 100,
        maxDepartments: 20,
        maxDevicesPerUser: 5,
        storageLimit: 1024, // MB
        apiRateLimit: 1000
      },
      stats: {
        totalUsers: 25,
        activeUsers: 23,
        totalDepartments: 5,
        lastActivity: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return { data: mockCompany };
  }

  // Update company
  async updateCompany(id: string, companyData: UpdateCompanyData) {
    try {
      const response = await apiService.put<any>(
        API_CONFIG.ENDPOINTS.COMPANIES.BY_ID(id),
        companyData
      );
      
      // Handle backend response format: {success: true, company: {...}}
      if (response.success && response.company) {
        return { data: response.company };
      }
      
      // Fallback to direct data if response format is different
      return { data: response };
    } catch (error) {
      console.error('Update company error:', error);
      // Return mock updated data when API is not available
      return this.getMockUpdatedCompanyData(id, companyData);
    }
  }

  // Mock updated company data for development
  private getMockUpdatedCompanyData(id: string, companyData: UpdateCompanyData): { data: Company } {
    const currentMockData = this.getMockCompanyData(id);
    const updatedCompany: Company = {
      ...currentMockData.data,
      ...companyData,
      address: {
        ...currentMockData.data.address,
        ...companyData.address
      },
      settings: {
        ...currentMockData.data.settings,
        ...companyData.settings
      },
      updatedAt: new Date()
    };

    return { data: updatedCompany };
  }

  // Upload company logo
  async uploadLogo(companyId: string, logoFile: File) {
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/companies/${companyId}/logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload logo error:', error);
      // Return mock URL for development
      return {
        success: true,
        logoUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop'
      };
    }
  }

  // Get company statistics
  async getCompanyStats(id: string) {
    try {
      const response = await apiService.get<any>(
        `${API_CONFIG.ENDPOINTS.COMPANIES.BY_ID(id)}/stats`
      );
      return response;
    } catch (error) {
      console.error('Get company stats error:', error);
      throw error;
    }
  }

  // Get company users
  async getCompanyUsers(id: string, params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  } = {}) {
    try {
      const response = await apiService.getPaginated<any>(
        `${API_CONFIG.ENDPOINTS.COMPANIES.BY_ID(id)}/users`,
        params
      );
      return response;
    } catch (error) {
      console.error('Get company users error:', error);
      throw error;
    }
  }
}

export const companyService = new CompanyService();
export default companyService;
