import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTenant } from './TenantProvider';
import { useAuth } from '../Auth/AuthProvider';
import { 
  Building2, 
  Users, 
  Calendar, 
  CreditCard, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function SaaSDashboard() {
  const { currentTenant, updateTenantUsage, getSystemBranding } = useTenant();
  const { currentUser } = useAuth();

  const branding = getSystemBranding();

  if (!currentTenant) {
    return (
      <div className="p-6">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground dark:text-gray-400">No tenant information available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSubscriptionStatusColor = () => {
    switch (currentTenant.subscriptionStatus) {
      case 'trial':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSubscriptionStatusIcon = () => {
    switch (currentTenant.subscriptionStatus) {
      case 'trial':
        return <Clock className="w-4 h-4" />;
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getDaysRemaining = () => {
    if (currentTenant.subscriptionStatus === 'trial' && currentTenant.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(currentTenant.trialEndsAt);
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    return null;
  };

  const userUsagePercentage = (currentTenant.currentUsers / currentTenant.maxUsers) * 100;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{branding.name}</h1>
          <p className="text-sm sm:text-base text-muted-foreground dark:text-gray-400">
            Workspace: {currentTenant.subdomain}.nevostack.com
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={getSubscriptionStatusColor()}>
            {getSubscriptionStatusIcon()}
            <span className="ml-1 capitalize text-xs sm:text-sm">{currentTenant.subscriptionStatus}</span>
          </Badge>
          <Button variant="outline" size="sm" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm">
            <Settings className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sm:hidden">Settings</span>
          </Button>
        </div>
      </div>

      {/* Subscription Status */}
      {currentTenant.subscriptionStatus === 'trial' && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Trial Period Active
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {getDaysRemaining()} days remaining in your trial
                  </p>
                </div>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
                <CreditCard className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">Current Plan</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground dark:text-gray-400 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{currentTenant.subscriptionPlan.name}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              ${currentTenant.subscriptionPlan.price}/month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground dark:text-gray-400 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{currentTenant.currentUsers}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              of {currentTenant.maxUsers} max users
            </p>
            <Progress value={userUsagePercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground dark:text-gray-400 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {new Date(currentTenant.createdAt).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              {Math.floor((Date.now() - new Date(currentTenant.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground dark:text-gray-400 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold capitalize text-gray-900 dark:text-gray-100">{currentTenant.status}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              Last updated: {new Date(currentTenant.updatedAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Features */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-sm sm:text-base text-gray-900 dark:text-gray-100">Plan Features</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Features included in your {currentTenant.subscriptionPlan.name} plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {currentTenant.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">Industry</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{currentTenant.industry || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">Company Size</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{currentTenant.employeeCount || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">Email</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{currentTenant.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">Phone</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{currentTenant.phone}</p>
            </div>
            {currentTenant.website && (
              <div>
                <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">Website</label>
                <p className="text-sm">
                  <a href={currentTenant.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                    {currentTenant.website}
                  </a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Admin Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">Admin Name</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{currentTenant.adminUser.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">Admin Email</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{currentTenant.adminUser.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">Username</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{currentTenant.adminUser.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">Current User</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{currentUser?.name || 'Not logged in'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-sm sm:text-base text-gray-900 dark:text-gray-100">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Button variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm">
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Manage Users</span>
              <span className="sm:hidden">Users</span>
            </Button>
            <Button variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm">
              <CreditCard className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Billing & Subscription</span>
              <span className="sm:hidden">Billing</span>
            </Button>
            <Button variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm">
              <Settings className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Workspace Settings</span>
              <span className="sm:hidden">Settings</span>
            </Button>
            <Button variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">View Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
