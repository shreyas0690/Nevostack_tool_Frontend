import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant, SubscriptionPlan, SaaSConfig } from '@/types/saas';
import { workspaceService, Workspace } from '@/services/workspaceService';

interface TenantContextType {
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  availablePlans: SubscriptionPlan[];
  saasConfig: SaaSConfig;
  isTenantActive: boolean;
  getTenantFromSubdomain: (subdomain: string) => Promise<Tenant | null>;
  updateTenantUsage: (usage: Partial<Tenant>) => void;
  getSystemName: () => string;
  getSystemBranding: () => { name: string; shortName: string; tagline: string; cleanName: string; systemName: string };
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  refreshWorkspace: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Default SaaS configuration
const defaultSaaSConfig: SaaSConfig = {
  appName: 'NevoStack',
  appUrl: 'https://nevostack.com',
  supportEmail: 'support@nevostack.com',
  defaultPlan: 'starter',
  trialDays: 14,
  maxSubdomainLength: 20,
  allowedDomains: ['nevostack.com', 'localhost']
};

// Available subscription plans
const defaultPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    billingCycle: 'monthly',
    maxUsers: 10,
    features: [
      'Basic User Management',
      'Attendance Tracking',
      'Leave Management',
      'Task Management',
      'Basic Reports',
      'Email Support'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    billingCycle: 'monthly',
    maxUsers: 50,
    features: [
      'Everything in Starter',
      'Advanced Analytics',
      'Department Management',
      'Meeting Management',
      'Advanced Reports',
      'Priority Support',
      'Custom Branding'
    ],
    isPopular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    billingCycle: 'monthly',
    maxUsers: 200,
    features: [
      'Everything in Professional',
      'Unlimited Users',
      'Advanced Security',
      'API Access',
      'Custom Integrations',
      'Dedicated Support',
      'White-label Solution'
    ]
  }
];

export function TenantProvider({ children }: { children: ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [availablePlans] = useState<SubscriptionPlan[]>(defaultPlans);
  const [saasConfig] = useState<SaaSConfig>(defaultSaaSConfig);

  useEffect(() => {
    // Load tenant from localStorage on app start
    const storedTenant = localStorage.getItem('nevostack_tenant');
    if (storedTenant) {
      try {
        const tenant = JSON.parse(storedTenant);
        setCurrentTenant(tenant);
        
        // Try to load workspace if we have tenant info
        if (tenant.workspaceId) {
          loadWorkspace(tenant.workspaceId);
        }
      } catch (error) {
        console.error('Error parsing stored tenant:', error);
        localStorage.removeItem('nevostack_tenant');
      }
    }
  }, []);

  const loadWorkspace = async (workspaceId: string) => {
    try {
      const response = await workspaceService.getWorkspaceById(workspaceId);
      if (response.success && response.data) {
        setCurrentWorkspace(response.data);
      }
    } catch (error) {
      console.error('Error loading workspace:', error);
    }
  };

  const getTenantFromSubdomain = async (subdomain: string): Promise<Tenant | null> => {
    try {
      const response = await workspaceService.getWorkspaceBySubdomain(subdomain);

      if (response.success && response.workspace) {
        const workspace = response.workspace;

        // Convert workspace to tenant format
        const tenant: Tenant = {
          id: workspace._id,
          companyName: workspace.name,
          subdomain: workspace.subdomain,
          domain: workspace.domain,
          email: '', // This would come from company data
          phone: '', // This would come from company data
          address: '', // This would come from company data
          website: '', // This would come from company data
          industry: '', // This would come from company data
          employeeCount: '', // This would come from company data
          description: '', // This would come from company data
          status: workspace.status === 'active' || workspace.status === 'trial' ? 'active' : 'suspended',
          subscriptionPlan: {
            id: workspace.plan,
            name: workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1),
            price: workspace.plan === 'starter' ? 29 : workspace.plan === 'professional' ? 79 : 199,
            billingCycle: workspace.billing?.interval || 'monthly',
            maxUsers: workspace.limits?.maxUsers || 10,
            features: getPlanFeatures(workspace.plan)
          },
          subscriptionStatus: workspace.status === 'trial' ? 'trial' : 
                            workspace.status === 'active' ? 'active' : 'expired',
          trialEndsAt: workspace.trialEndsAt,
          subscriptionEndsAt: workspace.subscriptionEndDate,
          maxUsers: workspace.limits?.maxUsers || 10,
          currentUsers: workspace.usage?.currentUsers || 1,
          features: getPlanFeatures(workspace.plan),
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
          adminUser: {
            id: workspace.ownerId,
            name: '', // This would come from user data
            email: '', // This would come from user data
            username: '' // This would come from user data
          }
        };

        return tenant;
      }
    } catch (error) {
      console.error('Error getting tenant from subdomain:', error);
    }
    return null;
  };

  const getPlanFeatures = (plan: string): string[] => {
    const planFeatures = defaultPlans.find(p => p.id === plan);
    return planFeatures ? planFeatures.features : [];
  };

  const updateTenantUsage = (usage: Partial<Tenant>) => {
    if (currentTenant) {
      const updatedTenant = { ...currentTenant, ...usage, updatedAt: new Date() };
      setCurrentTenant(updatedTenant);
      localStorage.setItem('nevostack_tenant', JSON.stringify(updatedTenant));
    }
  };

  const refreshWorkspace = async () => {
    if (currentWorkspace) {
      try {
        const response = await workspaceService.getWorkspaceById(currentWorkspace.id);
        if (response.success && response.data) {
          setCurrentWorkspace(response.data);
        }
      } catch (error) {
        console.error('Error refreshing workspace:', error);
      }
    }
  };

  const getSystemName = (): string => {
    if (currentTenant) {
      return `${currentTenant.companyName} Management System`;
    }
    return saasConfig.appName;
  };

  const getSystemBranding = () => {
    if (currentTenant) {
      return {
        name: `${currentTenant.companyName} Management System`,
        shortName: currentTenant.companyName,
        tagline: `Complete ${currentTenant.companyName} Management Solution`,
        cleanName: currentTenant.companyName,
        systemName: `${currentTenant.companyName} Management System`
      };
    }
    return {
      name: saasConfig.appName,
      shortName: saasConfig.appName,
      tagline: 'Complete Organization Management Solution',
      cleanName: saasConfig.appName,
      systemName: `${saasConfig.appName} Management System`
    };
  };

  const isTenantActive = currentTenant?.status === 'active' &&
    (currentTenant.subscriptionStatus === 'active' ||
     (currentTenant.subscriptionStatus === 'trial' &&
      currentTenant.trialEndsAt &&
      new Date(currentTenant.trialEndsAt) > new Date()));

  return (
    <TenantContext.Provider value={{
      currentTenant,
      setCurrentTenant,
      availablePlans,
      saasConfig,
      isTenantActive,
      getTenantFromSubdomain,
      updateTenantUsage,
      getSystemName,
      getSystemBranding,
      currentWorkspace,
      setCurrentWorkspace,
      refreshWorkspace
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    // Return a default context instead of throwing an error during initial render
    console.warn('useTenant called outside of TenantProvider, returning default context');
    return {
      currentTenant: null,
      setCurrentTenant: () => {},
      availablePlans: [],
      saasConfig: defaultSaaSConfig,
      isTenantActive: true,
      getTenantFromSubdomain: async () => null,
      updateTenantUsage: () => {},
      getSystemName: () => 'NevoStack',
      getSystemBranding: () => ({
        name: 'NevoStack',
        shortName: 'NevoStack',
        tagline: 'Complete Organization Management Solution',
        cleanName: 'NevoStack',
        systemName: 'NevoStack Management System'
      }),
      currentWorkspace: null,
      setCurrentWorkspace: () => {},
      refreshWorkspace: async () => {}
    };
  }
  return context;
}
