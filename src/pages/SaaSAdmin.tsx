import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saasAuthService } from '@/services/saasAuthService';
import SaaSSuperAdminHeader from '@/components/Layout/SaaSSuperAdminHeader';
import SaaSSuperAdminSidebar from '@/components/Layout/SaaSSuperAdminSidebar';
import SaaSSuperAdminDashboard from '@/components/SaaS/SaaSSuperAdminDashboard';
import SaaSCompaniesManagement from '@/components/SaaS/SaaSCompaniesManagement';
import SaaSAllUsersManagement from '@/components/SaaS/SaaSAllUsersManagement';
import SaaSSubscriptionManagement from '@/components/SaaS/SaaSSubscriptionManagement';
import SaaSGamesManagement from '@/components/SaaS/SaaSGamesManagement';
import SaaSPlatformAnalytics from '@/components/SaaS/SaaSPlatformAnalytics';
import SaaSPlatformSettings from '@/components/SaaS/SaaSPlatformSettings';
import SaaSAuditLogs from '@/components/SaaS/SaaSAuditLogs';

const SaaSAdmin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if SaaS admin is authenticated
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authenticated = saasAuthService.isSaaSAuthenticated();
        const user = saasAuthService.getSaaSUser();
        
        console.log('🔍 SaaSAdmin - Auth check:', { authenticated, user: user?.email });
        
        setIsAuthenticated(authenticated);
        setCurrentUser(user);
        setIsLoading(false);

        if (!authenticated) {
          console.log('❌ SaaS admin not authenticated, redirecting to login');
          // Clear any stale auth data
          localStorage.removeItem('saas_access_token');
          localStorage.removeItem('saas_refresh_token');
          localStorage.removeItem('saas_user');
          localStorage.removeItem('saas_device');
          navigate('/saas/login');
          return;
        }

        console.log('✅ SaaS admin authenticated:', user?.email);
      } catch (error) {
        console.error('❌ Error checking SaaS auth:', error);
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsLoading(false);
        navigate('/saas/login');
      }
    };

    checkAuth();
  }, [navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <SaaSSuperAdminDashboard />;
      case 'companies':
        return <SaaSCompaniesManagement />;
      case 'users':
        return <SaaSAllUsersManagement />;
      case 'subscriptions':
        return <SaaSSubscriptionManagement />;
      case 'games':
        return <SaaSGamesManagement />;
      case 'analytics':
        return <SaaSPlatformAnalytics />;
      case 'audit-logs':
        return <SaaSAuditLogs />;
      case 'settings':
        return <SaaSPlatformSettings />;
      default:
        return <SaaSSuperAdminDashboard />;
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking SaaS admin access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, the useEffect will redirect, but show loading state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SaaSSuperAdminHeader onTabChange={setActiveTab} />
      
      <div className="flex h-[calc(100vh-4.5rem)]">
        <SaaSSuperAdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SaaSAdmin;





