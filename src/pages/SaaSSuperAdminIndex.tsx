import { useState } from 'react';
import SaaSSuperAdminHeader from '@/components/Layout/SaaSSuperAdminHeader';
import SaaSSuperAdminSidebar from '@/components/Layout/SaaSSuperAdminSidebar';
import SaaSSuperAdminDashboard from '@/components/SaaS/SaaSSuperAdminDashboard';
import SaaSCompaniesManagement from '@/components/SaaS/SaaSCompaniesManagement';
import SaaSAllUsersManagement from '@/components/SaaS/SaaSAllUsersManagement';
import SaaSSubscriptionManagement from '@/components/SaaS/SaaSSubscriptionManagement';
import SaaSGamesManagement from '@/components/SaaS/SaaSGamesManagement';
import SaaSPlatformAnalytics from '@/components/SaaS/SaaSPlatformAnalytics';
import SaaSAuditLogs from '@/components/SaaS/SaaSAuditLogs';
import SaaSPlatformSettings from '@/components/SaaS/SaaSPlatformSettings';

const SaaSSuperAdminIndex = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

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

export default SaaSSuperAdminIndex;
