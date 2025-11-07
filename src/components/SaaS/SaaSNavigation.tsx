import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Building2, Users, Settings, BarChart3, CreditCard, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SaaSNavigation = () => {
  const navigate = useNavigate();

  const handleSaaSLogin = () => {
    navigate('/saas/login');
  };

  const handleSuperAdminLogin = () => {
    navigate('/saas/super-admin/login');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
            <Globe className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-2">SaaS Platform Management</h1>
        <p className="text-muted-foreground text-lg">
          Access the platform administration panel for managing multiple companies and subscriptions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Company Management</CardTitle>
                <CardDescription>Manage all companies and workspaces</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-lg">User Management</CardTitle>
                <CardDescription>Manage users across all companies</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Subscriptions</CardTitle>
                <CardDescription>Manage subscription plans and billing</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Platform Analytics</CardTitle>
                <CardDescription>View platform-wide analytics and insights</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-900/30 rounded-lg">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Platform Settings</CardTitle>
                <CardDescription>Configure platform-wide settings</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="text-center space-y-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">Access SaaS Admin Panel</CardTitle>
            <CardDescription>
              Login with your SaaS administrator credentials to access the platform management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleSaaSLogin} className="w-full" size="lg">
              <Globe className="w-5 h-5 mr-2" />
              Go to SaaS Login
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            
            <Button onClick={handleSuperAdminLogin} variant="outline" className="w-full" size="lg">
              <Shield className="w-5 h-5 mr-2" />
              Super Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          <strong>Note:</strong> SaaS Admin Panel is only accessible to platform administrators with proper credentials.
        </p>
        <p className="mt-2">
          Default credentials: <code className="bg-muted px-2 py-1 rounded">admin@demo.com</code>
        </p>
      </div>
    </div>
  );
};

export default SaaSNavigation;
