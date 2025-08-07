
import { useState } from 'react';
import Header from '@/components/Layout/Header';
import Sidebar from '@/components/Layout/Sidebar';
import DashboardOverview from '@/components/Dashboard/DashboardOverview';
import ComprehensiveManagement from '@/components/Departments/ComprehensiveManagement';
import LeaveDashboard from '@/components/Leave/LeaveDashboard';
import DepartmentsManagement from '@/components/Departments/DepartmentsManagement';
import TasksManagement from '@/components/Tasks/TasksManagement';
import EventsManagement from '@/components/Events/EventsManagement';
import AnalyticsDashboard from '@/components/Analytics/AnalyticsDashboard';
import ReportsManagement from '@/components/Reports/ReportsManagement';
import SettingsPage from '@/components/Settings/SettingsPage';
import UserManagement from '@/components/Users/UserManagement';
import MeetingsManagement from '@/components/Meetings/MeetingsManagement';
import AttendanceManagement from '@/components/Attendance/AttendanceManagement';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'comprehensive':
        return <ComprehensiveManagement />;
      case 'tasks':
        return <TasksManagement />;
      case 'departments':
        return <DepartmentsManagement />;
      case 'users':
        return <UserManagement />;
      case 'meetings':
        return <MeetingsManagement />;
      case 'events':
        return <EventsManagement />;
      case 'leave':
        return <LeaveDashboard />;
      case 'attendance':
        return <AttendanceManagement />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'reports':
        return <ReportsManagement />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
