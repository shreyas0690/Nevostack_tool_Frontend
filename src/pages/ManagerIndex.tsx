import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, X } from 'lucide-react';
import ManagerHeader from '@/components/Layout/ManagerHeader';
import ManagerSidebar from '@/components/Layout/ManagerSidebar';
import ManagerDashboardOverview from '@/components/Dashboard/ManagerDashboardOverview';
import ManagerMyTasks from '@/components/Tasks/ManagerMyTasks';
import ManagerTasksManagement from '@/components/Tasks/ManagerTasksManagement';
import ManagerTeamManagement from '@/components/Users/ManagerTeamManagement';
import ManagerMeetingsManagement from '@/components/Meetings/ManagerMeetingsManagement';
import ManagerLeaveManagement from '@/components/Leave/ManagerLeaveManagement';
import ManagerProfile from '@/components/Profile/ManagerProfile';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

const ManagerIndex = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const { hasFeature, hasAnyFeature } = useFeatureAccess();

  // Show welcome modal when Manager logs in
  useEffect(() => {
    // Check if modal was already shown today
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('manager_welcome_shown');
    
    if (lastShown !== today) {
      // Show modal after a short delay
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
        localStorage.setItem('manager_welcome_shown', today);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ManagerDashboardOverview onNavigate={setActiveTab} />;
      case 'my-tasks':
        return <ManagerMyTasks />;
      case 'tasks':
        if (!hasFeature('taskManagement')) {
          return <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Task Management Not Available</h3>
              <p className="text-gray-600 dark:text-gray-400">This feature is not enabled for your company.</p>
            </div>
          </div>;
        }
        return <ManagerTasksManagement />;
      case 'team':
        return <ManagerTeamManagement onNavigate={setActiveTab} />;
      case 'meetings':
        if (!hasAnyFeature(['meetings', 'meetingScheduler'])) {
          return <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Meetings Not Available</h3>
              <p className="text-gray-600 dark:text-gray-400">This feature is not enabled for your company.</p>
            </div>
          </div>;
        }
        return <ManagerMeetingsManagement />;
      case 'leave':
        if (!hasFeature('leaveManagement')) {
          return <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Leave Management Not Available</h3>
              <p className="text-gray-600 dark:text-gray-400">This feature is not enabled for your company.</p>
            </div>
          </div>;
        }
        return <ManagerLeaveManagement />;
      case 'profile':
        return <ManagerProfile />;
      default:
        return <ManagerDashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ManagerHeader onNavigate={setActiveTab} />
      <div className="flex">
        <ManagerSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>

      {/* Welcome Modal for Manager */}
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
                <Trophy className="h-12 w-12 mx-auto mb-4 animate-bounce" />
                <h2 className="text-3xl font-bold mb-2">🎉 Welcome, Manager! 🎉</h2>
                <p className="text-blue-100 text-lg">
                  Team Management Excellence
                </p>
              </div>
            </div>

            {/* Welcome Content */}
            <div className="p-8 bg-gradient-to-b from-blue-50 to-indigo-50">
              <div className="max-w-2xl mx-auto">
                {/* Manager Welcome Panel */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-blue-300">
                  {/* Panel Header */}
                  <div className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 text-white p-6 text-center">
                    <h1 className="text-4xl font-bold mb-2">🏆 Manager Dashboard 🏆</h1>
                    <h2 className="text-2xl font-semibold">Team Leadership Panel</h2>
                    <p className="text-blue-100 mt-2">Leading Teams to Success</p>
                  </div>

                  {/* Main Content */}
                  <div className="p-8 text-center bg-gradient-to-b from-blue-50 to-indigo-50">
                    {/* Decorative Elements */}
                    <div className="flex justify-center items-center mb-6">
                      <div className="text-6xl">📊</div>
                      <div className="text-8xl mx-4">🎯</div>
                      <div className="text-6xl">👥</div>
                    </div>

                    {/* Manager Features */}
                    <div className="space-y-4 mb-6">
                      <h3 className="text-2xl font-bold text-blue-800">
                        🎯 Manager Panel Features 🎯
                      </h3>
                      <p className="text-lg text-indigo-700">
                        Your comprehensive team management solution
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
                        🌟 Management Tools 🌟
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-left">
                          <p className="font-semibold text-blue-600">📋 Tasks:</p>
                          <p className="text-gray-700">Assign & track tasks</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-blue-600">👥 Team:</p>
                          <p className="text-gray-700">Manage team members</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-blue-600">🏖️ Leave:</p>
                          <p className="text-gray-700">Approve leave requests</p>
                        </div>
                      </div>
                    </div>

                    {/* Decorative Bottom */}
                    <div className="mt-6 flex justify-center space-x-2 text-2xl">
                      <span>🌟</span>
                      <span>🎯</span>
                      <span>📈</span>
                      <span>🎯</span>
                      <span>🌟</span>
                    </div>
                  </div>

                  {/* Panel Footer */}
                  <div className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 text-white p-4 text-center">
                    <p className="text-lg font-semibold">
                      🎊 Welcome to Your Manager Dashboard! 🎊
                    </p>
                    <p className="text-sm text-blue-100 mt-1">
                      Empowering you to lead your team effectively
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
                🚀 Start Managing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerIndex;
