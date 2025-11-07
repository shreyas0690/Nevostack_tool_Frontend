export interface Tenant {
  id: string;
  companyName: string;
  subdomain: string;
  domain?: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  industry: string;
  employeeCount: string;
  description?: string;
  status: 'active' | 'suspended' | 'pending' | 'cancelled';
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'cancelled';
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  maxUsers: number;
  currentUsers: number;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
  adminUser: {
    id: string;
    name: string;
    email: string;
    username: string;
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  maxUsers: number;
  features: string[];
  isPopular?: boolean;
  isCustom?: boolean;
}

export interface BillingInfo {
  id: string;
  tenantId: string;
  planId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  billingDate: Date;
  dueDate: Date;
  paidAt?: Date;
  invoiceUrl?: string;
}

export interface UsageMetrics {
  tenantId: string;
  date: Date;
  activeUsers: number;
  totalUsers: number;
  storageUsed: number;
  apiCalls: number;
  featuresUsed: string[];
}

export interface SaaSConfig {
  appName: string;
  appUrl: string;
  supportEmail: string;
  defaultPlan: string;
  trialDays: number;
  maxSubdomainLength: number;
  allowedDomains: string[];
}












