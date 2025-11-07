# NevoStack SaaS Platform

## Overview

NevoStack has been transformed into a full-featured SaaS (Software as a Service) platform that allows multiple companies to register and manage their organizations independently. Each company gets its own workspace with a unique subdomain and **their company name becomes the system name** throughout their workspace.

## 🚀 Key Features

### Multi-Tenant Architecture
- **Subdomain-based Workspaces**: Each company gets a unique subdomain (e.g., `company.nevostack.com`)
- **Isolated Data**: Each tenant's data is completely separated
- **Custom Branding**: Companies can customize their workspace appearance
- **Company-Name System**: The company name becomes the system name (e.g., "ABC Corp Management System")

### Subscription Management
- **Three Pricing Tiers**:
  - **Starter** ($29/month): Up to 10 users, basic features
  - **Professional** ($79/month): Up to 50 users, advanced features (Most Popular)
  - **Enterprise** ($199/month): Up to 200 users, unlimited features
- **14-Day Free Trial**: No credit card required to start
- **Flexible Billing**: Monthly and yearly payment options

### User Management
- **Role-based Access Control**:
  - Super Admin: Full system access
  - Department Head (HOD): Department management
  - Manager: Team management
  - HR Manager: HR operations
  - HR: HR tasks
  - Member: Basic user access

## 🏗️ Architecture

### Frontend Components
```
src/
├── components/
│   ├── SaaS/
│   │   ├── TenantProvider.tsx      # Multi-tenant state management
│   │   ├── SaaSLoginPage.tsx       # Enhanced login with subdomain support
│   │   ├── SaaSCompanyRegistration.tsx # Company registration flow
│   │   ├── PricingPlans.tsx        # Subscription plan selection
│   │   └── SaaSDashboard.tsx       # Tenant dashboard
│   ├── Auth/
│   │   └── AuthProvider.tsx        # Authentication management
│   └── Company/
│       └── CompanyProvider.tsx     # Company data management
├── types/
│   └── saas.ts                     # SaaS-specific TypeScript interfaces
└── App.tsx                         # Main application with SaaS integration
```

### Data Models

#### Tenant
```typescript
interface Tenant {
  id: string;
  companyName: string;              // This becomes the system name
  subdomain: string;
  email: string;
  phone: string;
  status: 'active' | 'suspended' | 'pending' | 'cancelled';
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'cancelled';
  trialEndsAt?: Date;
  maxUsers: number;
  currentUsers: number;
  features: string[];
  adminUser: {
    id: string;
    name: string;
    email: string;
    username: string;
  };
}
```

#### SubscriptionPlan
```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  maxUsers: number;
  features: string[];
  isPopular?: boolean;
}
```

## 🚀 Getting Started

### 1. Installation
```bash
cd tiny-typer-tool-09
npm install
```

### 2. Development
```bash
npm run dev
```

### 3. Building for Production
```bash
npm run build
```

## 📋 Usage Guide

### For Companies (Tenants)

#### 1. Company Registration
1. Visit the main application
2. Click "Create New Workspace"
3. Fill in company information
   - **Company Name**: This will become your system name (e.g., "ABC Corp Management System")
4. Choose a unique subdomain
5. Select a subscription plan
6. Create admin account
7. Start your 14-day free trial

#### 2. Accessing Your Workspace
- **Direct URL**: `https://yourcompany.nevostack.com`
- **Login Page**: Enter your subdomain to access your workspace
- **System Name**: Your company name will appear as the system name throughout the interface
- **Admin Access**: Use the credentials created during registration

#### 3. Managing Your Organization
- **User Management**: Add, edit, and manage team members
- **Department Management**: Organize your company structure
- **Attendance Tracking**: Monitor employee attendance
- **Leave Management**: Handle leave requests and approvals
- **Task Management**: Assign and track tasks
- **Reports**: Generate insights and analytics

### Example: Company Name Integration

When a company registers with the name "Tech Solutions Inc.":

- **System Name**: "Tech Solutions Inc. Management System"
- **Login Page**: Shows "Tech Solutions Inc." as the main title
- **Dashboard**: Displays "Tech Solutions Inc. Management System" as the header
- **Document Title**: Browser tab shows "Tech Solutions Inc. Management System"
- **Tagline**: "Complete Tech Solutions Inc. Management Solution"

### For Developers

#### Adding New SaaS Features

1. **Create New Components**:
```typescript
// src/components/SaaS/NewFeature.tsx
import { useTenant } from './TenantProvider';

export default function NewFeature() {
  const { currentTenant, updateTenantUsage, getSystemBranding } = useTenant();
  const branding = getSystemBranding();
  
  return (
    <div>
      <h1>{branding.name}</h1>
      <p>{branding.tagline}</p>
    </div>
  );
}
```

2. **Update Tenant Types**:
```typescript
// src/types/saas.ts
export interface Tenant {
  // ... existing properties
  newFeature?: string;
}
```

3. **Add to Provider**:
```typescript
// src/components/SaaS/TenantProvider.tsx
const updateNewFeature = (feature: string) => {
  updateTenantUsage({ newFeature: feature });
};
```

#### Subscription Plan Management

1. **Add New Plans**:
```typescript
// In TenantProvider.tsx
const newPlans: SubscriptionPlan[] = [
  {
    id: 'premium',
    name: 'Premium',
    price: 149,
    billingCycle: 'monthly',
    maxUsers: 100,
    features: [
      'Everything in Professional',
      'Advanced Security',
      'Custom Integrations'
    ]
  }
];
```

2. **Update Features**:
```typescript
const features = [
  'Basic User Management',
  'Advanced Analytics',
  'Custom Branding',
  // Add new features here
];
```

## 🔧 Configuration

### SaaS Configuration
```typescript
const saasConfig: SaaSConfig = {
  appName: 'NevoStack',
  appUrl: 'https://nevostack.com',
  supportEmail: 'support@nevostack.com',
  defaultPlan: 'professional',
  trialDays: 14,
  maxSubdomainLength: 20,
  allowedDomains: ['nevostack.com', 'localhost']
};
```

### Environment Variables
```env
# Add to your .env file
VITE_SAAS_APP_NAME=NevoStack
VITE_SAAS_APP_URL=https://nevostack.com
VITE_SAAS_SUPPORT_EMAIL=support@nevostack.com
```

## 🛡️ Security Features

- **Multi-tenant Isolation**: Complete data separation between tenants
- **Role-based Access Control**: Granular permissions system
- **Subdomain Validation**: Prevents reserved subdomain usage
- **Trial Period Management**: Automatic trial expiration handling
- **Subscription Status Tracking**: Real-time subscription monitoring

## 📊 Analytics & Monitoring

### Usage Metrics
- Active users per tenant
- Feature usage tracking
- Subscription status monitoring
- Trial conversion rates

### Dashboard Features
- Real-time subscription status
- User usage statistics
- Plan feature overview
- Company information display

## 🔄 Migration from Single-tenant

The application has been designed to maintain backward compatibility with existing single-tenant installations. Existing company data will be automatically migrated to the new SaaS structure.

## 🚀 Deployment

### Production Setup
1. **Domain Configuration**: Set up wildcard DNS for subdomain support
2. **SSL Certificates**: Configure SSL for all subdomains
3. **Database**: Set up multi-tenant database architecture
4. **Backend API**: Implement tenant-aware API endpoints

### Environment Variables
```env
# Production configuration
VITE_SAAS_APP_URL=https://yourdomain.com
VITE_SAAS_SUPPORT_EMAIL=support@yourdomain.com
VITE_SAAS_TRIAL_DAYS=14
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@nevostack.com
- Documentation: [Link to docs]
- Issues: [GitHub Issues]

---

**NevoStack SaaS Platform** - Transform your organization management into a scalable, multi-tenant solution where each company gets their own branded management system.
