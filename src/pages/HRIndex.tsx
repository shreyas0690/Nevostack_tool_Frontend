import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, UserCheck } from 'lucide-react';
import HRHeader from '@/components/Layout/HRHeader';
import HRSidebar from '@/components/Layout/HRSidebar';
import HRDashboard from '@/components/Dashboard/HRDashboard';
import DepartmentsManagement from '@/components/Departments/DepartmentsManagement';
import AnalyticsDashboard from '@/components/Analytics/AnalyticsDashboard';
import HRTasksManagement from '@/components/Tasks/HRTasksManagement';
import HRMeetingsManagement from '@/components/Meetings/HRMeetingsManagement';
import HRLeaveManagement from '@/components/Leave/HRLeaveManagement';
import HRProfile from '@/components/Profile/HRProfile';

const HRIndex = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Show welcome modal when HR logs in
  useEffect(() => {
    // Check if modal was already shown today
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('hr_welcome_shown');
    
    if (lastShown !== today) {
      // Show modal after a short delay
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
        localStorage.setItem('hr_welcome_shown', today);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <HRDashboard />;
      case 'departments':
        return <DepartmentsManagement />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'tasks':
        return <HRTasksManagement />;
      case 'meetings':
        return <HRMeetingsManagement />;
      case 'leave':
        return <HRLeaveManagement />;
      case 'profile':
        return <HRProfile />;
      default:
        return <HRDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <HRHeader onNavigate={setActiveTab} />
      <div className="flex">
        <HRSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>

      {/* Welcome Modal for HR */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <div className="relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWelcomeModal(false)}
              className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white/90 rounded-full w-8 h-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 text-white p-6">
              <div className="text-center">
                <UserCheck className="h-12 w-12 mx-auto mb-4 animate-bounce" />
                <h2 className="text-3xl font-bold mb-2">🎉 Welcome, HR Team! 🎉</h2>
                <p className="text-blue-100 text-lg">
                  Human Resources Management Hub
                </p>
              </div>
            </div>

            {/* Welcome Content */}
            <div className="p-8 bg-gradient-to-b from-blue-50 to-indigo-50">
              <div className="max-w-2xl mx-auto">
                {/* HR Welcome Panel */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-blue-300">
                  {/* Panel Header */}
                  <div className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 text-white p-6 text-center">
                    <h1 className="text-4xl font-bold mb-2">👥 HR Dashboard 👥</h1>
                    <h2 className="text-2xl font-semibold">Human Resources Panel</h2>
                    <p className="text-blue-100 mt-2">Managing People & Operations</p>
                  </div>

                  {/* Main Content */}
                  <div className="p-8 text-center bg-gradient-to-b from-blue-50 to-indigo-50">
                    {/* Decorative Elements */}
                    <div className="flex justify-center items-center mb-6">
                      <div className="text-6xl">🏢</div>
                      <div className="text-8xl mx-4">👥</div>
                      <div className="text-6xl">📊</div>
                    </div>

                    {/* HR Features */}
                    <div className="space-y-4 mb-6">
                      <h3 className="text-2xl font-bold text-blue-800">
                        🎯 HR Panel Features 🎯
                      </h3>
                      <p className="text-lg text-indigo-700">
                        Your comprehensive human resources management solution
                      </p>
                      <div className="flex justify-center space-x-4 text-3xl my-6">
                        <span>👑</span>
                        <span>📈</span>
                        <span>🤝</span>
                        <span>⚡</span>
                      </div>
                    </div>

                    {/* Features Grid */}
                    <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-200">
                      <h4 className="text-xl font-semibold text-blue-800 mb-4">
                        🌟 HR Management Tools 🌟
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-left">
                          <p className="font-semibold text-blue-600">🏢 Departments:</p>
                          <p className="text-gray-700">Manage all departments</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-blue-600">📊 Analytics:</p>
                          <p className="text-gray-700">Company-wide insights</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-blue-600">📋 Tasks:</p>
                          <p className="text-gray-700">Task management</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-blue-600">🏖️ Leave:</p>
                          <p className="text-gray-700">Leave management</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-blue-600">📈 Reports:</p>
                          <p className="text-gray-700">Detailed reporting</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-blue-600">👥 People:</p>
                          <p className="text-gray-700">Employee management</p>
                        </div>
                      </div>
                    </div>

                    {/* Decorative Bottom */}
                    <div className="mt-6 flex justify-center space-x-2 text-2xl">
                      <span>🌟</span>
                      <span>👥</span>
                      <span>📊</span>
                      <span>👥</span>
                      <span>🌟</span>
                    </div>
                  </div>

                  {/* Panel Footer */}
                  <div className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 text-white p-4 text-center">
                    <p className="text-lg font-semibold">
                      🎊 Welcome to Your HR Dashboard! 🎊
                    </p>
                    <p className="text-sm text-blue-100 mt-1">
                      Empowering you to manage the company's human resources
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-center">
              <Button
                onClick={() => setShowWelcomeModal(false)}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-8 py-2 rounded-full font-semibold shadow-lg"
              >
                🚀 Start Managing HR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRIndex;











































































































