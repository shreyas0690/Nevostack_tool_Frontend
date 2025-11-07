import { saasAuthService } from './saasAuthService';
import { API_CONFIG } from '@/config/api';

// SaaS Dashboard Types
export interface SaaSDashboardStats {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  trialCompanies: number;
  totalUsers: number;
  activeUsers: number;
  activeUsersToday: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  newSignups: {
    today: number;
    week: number;
    month: number;
  };
  growth: {
    companies: number;
    users: number;
    revenue: number;
  };
  planDistribution: {
    free: number;
    basic: number;
    premium: number;
    enterprise: number;
  };
  systemHealth: {
    totalTasks: number;
    totalMeetings: number;
    totalLeaves: number;
    storageUsed: number;
  };
  recentActivities: {
    companies: Array<any>;
    payments: Array<any>;
    tickets: Array<any>;
  };
  monthlyTrends: Array<{
    month: string;
    companies: number;
    users: number;
    revenue: number;
  }>;
  alerts: {
    expiringSoon: number;
    paymentFailures: number;
    securityAlerts: number;
  };
}

interface SaaSCompany {
  _id: string;
  companyName: string;
  subdomain: string;
  email: string;
  industry?: string;
  employeeCount?: string;
  status: 'active' | 'inactive' | 'suspended';
  subscriptionPlan: 'Starter' | 'Professional' | 'Enterprise';
  subscriptionStatus: 'active' | 'trial' | 'cancelled' | 'expired';
  currentUsers: number;
  maxUsers: number;
  revenue: number;
  lastLogin?: Date;
  createdAt: Date;
}

interface SaasPlatformAnalytics {
  subscriptionDistribution: Array<{ plan: string; count: number; percentage: number }>;
  revenueByPlan: Array<{ plan: string; revenue: number; percentage: number }>;
  statusDistribution: Array<{ status: string; count: number; percentage: number }>;
}

interface SaaSRecentActivity {
  _id: string;
  type: 'user_registered' | 'company_registered' | 'subscription_upgraded' | 'subscription_cancelled';
  description: string;
  companyName: string;
  domain: string;
  timestamp: Date;
  metadata: any;
}

class SaaSService {
  private baseURL = API_CONFIG.BASE_URL;

  // Get dashboard statistics
  async getDashboardStats(): Promise<SaaSDashboardStats> {
    try {
      const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.SAAS.DASHBOARD_STATS}`;
      console.log('🔍 Fetching dashboard stats from:', url);
      const response = await saasAuthService.authenticatedFetch(url);

      console.log('📡 Dashboard stats response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Dashboard stats error response:', errorText);
        throw new Error(`Failed to fetch dashboard stats: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Dashboard stats loaded:', data);
      return data.data; // Backend returns stats in 'data' property
    } catch (error) {
      console.error('❌ Dashboard stats error:', error);
      throw error;
    }
  }

  // Get all companies with filters
  async getCompanies(filters?: {
    status?: string;
    plan?: string;
    search?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ companies: SaaSCompany[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.plan) params.append('plan', filters.plan);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.skip) params.append('skip', filters.skip.toString());

      const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.SAAS.COMPANIES}${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🔍 Fetching companies from:', url);
      
      const response = await saasAuthService.authenticatedFetch(url);

      console.log('📡 Companies response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Companies error response:', errorText);
        throw new Error(`Failed to fetch companies: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Companies API Response:', data);
      console.log('📊 Companies data structure:', {
        success: data.success,
        companiesCount: data.data?.companies?.length || 0,
        hasData: !!data.data,
        hasPagination: !!data.data?.pagination
      });
      
      // Return the data in the format expected by the component
      return {
        companies: data.data?.companies || [],
        total: data.data?.pagination?.totalCompanies || 0,
        pagination: data.data?.pagination
      };
    } catch (error) {
      console.error('❌ Companies fetch error:', error);
      throw error;
    }
  }

  // Update company status
  async updateCompanyStatus(companyId: string, status: 'active' | 'inactive' | 'suspended'): Promise<SaaSCompany> {
    try {
      const response = await saasAuthService.authenticatedFetch(
        `${this.baseURL}/api/saas/companies/${companyId}/status`,
        {
          method: 'PUT',
          body: JSON.stringify({ status })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update company status: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Company status updated:', data.company.companyName, status);
      return data.company;
    } catch (error) {
      console.error('❌ Company status update error:', error);
      throw error;
    }
  }

  // Update company subscription
  async updateCompanySubscription(companyId: string, subscription: {
    plan: 'Starter' | 'Professional' | 'Enterprise';
    status: 'active' | 'trial' | 'cancelled' | 'expired';
  }): Promise<SaaSCompany> {
    try {
      const response = await saasAuthService.authenticatedFetch(
        `${this.baseURL}/api/saas/companies/${companyId}/subscription`,
        {
          method: 'PUT',
          body: JSON.stringify({ subscription })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update company subscription: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Company subscription updated:', data.company.companyName, subscription.plan);
      return data.company;
    } catch (error) {
      console.error('❌ Company subscription update error:', error);
      throw error;
    }
  }

  // Get platform analytics
  async getPlatformAnalytics(): Promise<SaasPlatformAnalytics> {
    try {
      const response = await saasAuthService.authenticatedFetch(
        `${this.baseURL}/api/saas/analytics`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch platform analytics: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Platform analytics loaded:', data);
      return data.analytics;
    } catch (error) {
      console.error('❌ Platform analytics error:', error);
      throw error;
    }
  }

  // Get recent activity
  async getRecentActivity(limit = 10): Promise<SaaSRecentActivity[]> {
    try {
      const response = await saasAuthService.authenticatedFetch(
        `${this.baseURL}/api/saas/activity?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch recent activity: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Recent activity loaded:', data.activities.length, 'items');
      return data.activities;
    } catch (error) {
      console.error('❌ Recent activity error:', error);
      throw error;
    }
  }

  // Get monthly trends data (last 1 month - daily data)
  async getMonthlyTrends(): Promise<Array<{
    day: number;
    month: string;
    date: string;
    companies: number;
    users: number;
    revenue: number;
  }>> {
    try {
      const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.SAAS.MONTHLY_TRENDS}`;
      console.log('🔍 Fetching monthly trends from:', url);
      const response = await saasAuthService.authenticatedFetch(url);

      console.log('📡 Monthly trends response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Monthly trends error response:', errorText);
        throw new Error(`Failed to fetch monthly trends: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Monthly trends loaded:', data.data.length, 'days');
      return data.data;
    } catch (error) {
      console.error('❌ Monthly trends error:', error);
      throw error;
    }
  }

  // Get company by ID
  async getCompanyById(companyId: string): Promise<SaaSCompany> {
    try {
      const response = await saasAuthService.authenticatedFetch(
        `${this.baseURL}/api/saas/companies/${companyId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch company: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Company loaded:', data.company.companyName);
      return data.company;
    } catch (error) {
      console.error('❌ Company fetch error:', error);
      throw error;
    }
  }

  // Delete/suspend company
  async deleteCompany(companyId: string): Promise<void> {
    try {
      const response = await saasAuthService.authenticatedFetch(
        `${this.baseURL}/api/saas/companies/${companyId}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete company: ${response.statusText}`);
      }

      console.log('✅ Company deleted successfully');
    } catch (error) {
      console.error('❌ Company delete error:', error);
      throw error;
    }
  }

  // Get all platform users across companies
  async getAllUsers(filters?: {
    companyId?: string;
    role?: string;
    status?: string;
    search?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ users: any[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.companyId) params.append('companyId', filters.companyId);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.skip) params.append('skip', filters.skip.toString());

      const url = `${this.baseURL}/api/saas/users${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await saasAuthService.authenticatedFetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Platform users loaded:', data.users.length);
      return data;
    } catch (error) {
      console.error('❌ Users fetch error:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const saasService = new SaaSService();
export default saasService;
export type { SaaSDashboardStats, SaaSCompany, SaasPlatformAnalytics, SaaSRecentActivity };