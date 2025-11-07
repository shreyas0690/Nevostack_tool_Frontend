export interface Plan {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  price: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };
  limits: {
    maxUsers: number;
    maxDepartments: number;
    storageGB: number;
  };
  features: {
    taskManagement: boolean;
    leaveManagement: boolean;
    meetings: boolean;
    analytics: boolean;
    reports: boolean;
    attendance: boolean;
    apiAccess: boolean;
    customBranding: boolean;
  };
  trialDays: number;
  isActive: boolean;
  isPopular?: boolean;
  createdAt: string;
}
