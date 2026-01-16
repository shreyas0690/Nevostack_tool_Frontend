
import { useState, useEffect } from 'react';
import Header from '@/components/Layout/Header';
import Sidebar from '@/components/Layout/Sidebar';
import DashboardOverview from '@/components/Dashboard/DashboardOverview';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

import LeaveDashboard from '@/components/Leave/LeaveDashboard';
import DepartmentsManagement from '@/components/Departments/DepartmentsManagement';
import TasksManagement from '@/components/Tasks/TasksManagement';
import SuperAdminTasksManagement from '@/components/Tasks/SuperAdminTasksManagement';
import EventsManagement from '@/components/Events/EventsManagement';
import AnalyticsDashboard from '@/components/Analytics/AnalyticsDashboard';
import ReportsManagement from '@/components/Reports/ReportsManagement';
import SettingsPage from '@/components/Settings/SettingsPage';
import UserManagement from '@/components/Users/UserManagement';
import MeetingsManagement from '@/components/Meetings/MeetingsManagement';
import AttendanceManagement from '@/components/Attendance/AttendanceManagement';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { features, hasFeature, hasAnyFeature, isLoading } = useFeatureAccess();

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debug logging
  console.log('🔍 Index - Current features:', features);
  console.log('🔍 Index - Active tab:', activeTab);
  console.log('🔍 Index - Task management feature:', hasFeature('taskManagement'));
  console.log('🔍 Index - Leave management feature:', hasFeature('leaveManagement'));

  const renderContent = () => {
    // Check feature access for each section
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'tasks':
        if (!hasFeature('taskManagement')) {
          return <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Task Management Not Available</h3>
              <p className="text-gray-600 dark:text-gray-400">This feature is not enabled for your company.</p>
            </div>
          </div>;
        }
        return <SuperAdminTasksManagement />;
      case 'departments':
        return <DepartmentsManagement />;
      case 'users':
        return <UserManagement />;
      case 'meetings':
        if (!hasAnyFeature(['meetings', 'meetingScheduler'])) {
          return <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Meetings Not Available</h3>
              <p className="text-gray-600 dark:text-gray-400">This feature is not enabled for your company.</p>
            </div>
          </div>;
        }
        return <MeetingsManagement />;
      case 'leave':
        if (!hasFeature('leaveManagement')) {
          return <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Leave Management Not Available</h3>
              <p className="text-gray-600 dark:text-gray-400">This feature is not enabled for your company.</p>
            </div>
          </div>;
        }
        return <LeaveDashboard />;
      case 'attendance':
        if (!hasFeature('attendance')) {
          return <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Attendance Not Available</h3>
              <p className="text-gray-600 dark:text-gray-400">This feature is not enabled for your company.</p>
            </div>
          </div>;
        }
        return <AttendanceManagement />;
      case 'analytics':
        if (!hasFeature('analytics')) {
          return <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Analytics Not Available</h3>
              <p className="text-gray-600 dark:text-gray-400">This feature is not enabled for your company.</p>
            </div>
          </div>;
        }
        return <AnalyticsDashboard />;
      case 'reports':
        if (!hasFeature('reports')) {
          return <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Reports Not Available</h3>
              <p className="text-gray-600 dark:text-gray-400">This feature is not enabled for your company.</p>
            </div>
          </div>;
        }
        return <ReportsManagement />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onTabChange={setActiveTab}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isMobile={isMobile}
      />

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex relative">
        {/* Sidebar */}
        <div className={`
          ${isMobile
            ? `fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`
            : 'relative'
          }
        `}>
          <Sidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              if (isMobile) {
                setSidebarOpen(false);
              }
            }}
            isMobile={isMobile}
          />
        </div>

        {/* Main Content */}
        <main className={`
          flex-1 transition-all duration-300 ease-in-out
          ${isMobile ? 'w-full' : 'ml-0'}
          ${!isMobile ? 'lg:ml-0' : ''}
        `}>
          <div className="p-2 sm:p-4 lg:p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
