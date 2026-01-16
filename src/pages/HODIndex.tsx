import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, X } from 'lucide-react';
import HODHeader from '@/components/Layout/HODHeader';
import HODSidebar from '@/components/Layout/HODSidebar';
import HODDashboardOverview from '@/components/Dashboard/HODDashboardOverview';
import HODMyTasks from '@/components/Tasks/HODMyTasks';
import { useTenant } from '@/components/SaaS/TenantProvider';

import HODTasksManagement from '@/components/Tasks/HODTasksManagement';
import HODTeamManagement from '@/components/Users/HODTeamManagement';
import HODAnalytics from '@/components/Analytics/HODAnalytics';
import HODMeetingsManagement from '@/components/Meetings/HODMeetingsManagement';
import HODLeaveManagement from '@/components/Leave/HODLeaveManagement';
import HODProfile from '@/components/Profile/HODProfile';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';


const HODIndex = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showRakshaBandhanModal, setShowRakshaBandhanModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getSystemBranding } = useTenant();
  const branding = getSystemBranding();
  const { hasFeature, hasAnyFeature } = useFeatureAccess();

  // Handle tab changes and redirect deprecated 'department' to 'team'
  const handleTabChange = (tab: string) => {
    if (tab === 'department') {
      setActiveTab('team'); // Redirect to team management
    } else {
      setActiveTab(tab);
    }
    // Close mobile menu on navigation
    setMobileMenuOpen(false);
  };

  // Show Raksha Bandhan modal when HOD logs in
  useEffect(() => {
    // Check if modal was already shown today
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('hod_raksha_bandhan_shown');

    if (lastShown !== today) {
      // Show modal after a short delay
      const timer = setTimeout(() => {
        setShowRakshaBandhanModal(true);
        localStorage.setItem('hod_raksha_bandhan_shown', today);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <HODDashboardOverview onTabChange={setActiveTab} />;
      case 'my-tasks':
        return <HODMyTasks />;
      case 'tasks':
        if (!hasFeature('taskManagement')) {
          return <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Task Management Not Available</h3>
              <p className="text-gray-600 dark:text-gray-400">This feature is not enabled for your company.</p>
            </div>
          </div>;
        }
        return <HODTasksManagement />;
      case 'team':
        return <HODTeamManagement />;
      case 'meetings':
        if (!hasAnyFeature(['meetings', 'meetingScheduler'])) {
          return <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Meetings Not Available</h3>
              <p className="text-gray-600 dark:text-gray-400">This feature is not enabled for your company.</p>
            </div>
          </div>;
        }
        return <HODMeetingsManagement />;
      case 'leave':
        if (!hasFeature('leaveManagement')) {
          return <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Leave Management Not Available</h3>
              <p className="text-gray-600 dark:text-gray-400">This feature is not enabled for your company.</p>
            </div>
          </div>;
        }
        return <HODLeaveManagement />;
      case 'analytics':
        if (!hasFeature('analytics')) {
          return <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Analytics Not Available</h3>
              <p className="text-gray-600 dark:text-gray-400">This feature is not enabled for your company.</p>
            </div>
          </div>;
        }
        return <HODAnalytics />;
      case 'profile':
        return <HODProfile />;
      default:
        return <HODDashboardOverview onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <HODHeader
        onNavigate={setActiveTab}
        onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
      <div className="flex">
        <HODSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
        <main className="flex-1 p-4 md:p-6 w-full max-w-[100vw] overflow-x-hidden">
          {renderContent()}
        </main>
      </div>

      {/* Raksha Bandhan Welcome Modal for HOD */}
      <Dialog open={showRakshaBandhanModal} onOpenChange={setShowRakshaBandhanModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <div className="relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRakshaBandhanModal(false)}
              className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white/90 rounded-full w-8 h-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white p-6">
              <div className="text-center">
                <Gift className="h-12 w-12 mx-auto mb-4 animate-bounce" />
                <h2 className="text-3xl font-bold mb-2">🎉 Welcome, HOD! 🎉</h2>
                <p className="text-blue-100 text-lg">
                  {branding.shortName} - Special Raksha Bandhan Greetings for Our Department Head
                </p>
              </div>
            </div>

            {/* Raksha Bandhan Poster */}
            <div className="p-8 bg-gradient-to-b from-orange-50 to-red-50">
              <div className="max-w-2xl mx-auto">
                {/* Custom Raksha Bandhan Poster Design for HOD */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-orange-300">
                  {/* Poster Header */}
                  <div className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 text-white p-6 text-center">
                    <h1 className="text-4xl font-bold mb-2">🪷 राखी का त्योहार 🪷</h1>
                    <h2 className="text-2xl font-semibold">Raksha Bandhan</h2>
                    <p className="text-orange-100 mt-2">{branding.shortName} - HOD Panel Special Celebration</p>
                  </div>

                  {/* Main Poster Content */}
                  <div className="p-8 text-center bg-gradient-to-b from-yellow-50 to-orange-50">
                    {/* Decorative Elements */}
                    <div className="flex justify-center items-center mb-6">
                      <div className="text-6xl">🧵</div>
                      <div className="text-8xl mx-4">🪬</div>
                      <div className="text-6xl">🧵</div>
                    </div>

                    {/* Special HOD Message */}
                    <div className="space-y-4 mb-6">
                      <h3 className="text-2xl font-bold text-blue-800">
                        🎯 Dear Department Head 🎯
                      </h3>
                      <p className="text-lg text-red-700">
                        आपके नेतृत्व में हमारा विभाग आगे बढ़ता रहे
                      </p>
                      <p className="text-base text-gray-700">
                        May your leadership bring success and prosperity to our department
                      </p>
                      <div className="flex justify-center space-x-4 text-3xl my-6">
                        <span>👑</span>
                        <span>🛡️</span>
                        <span>❤️</span>
                        <span>🙏</span>
                      </div>
                    </div>

                    {/* Festival Details */}
                    <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-orange-200">
                      <h4 className="text-xl font-semibold text-orange-800 mb-4">
                        🌟 Raksha Bandhan Blessings 🌟
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-left">
                          <p className="font-semibold text-red-600">🎯 Leadership:</p>
                          <p className="text-gray-700">Guiding with wisdom</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-red-600">🛡️ Protection:</p>
                          <p className="text-gray-700">Safeguarding team goals</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-red-600">🤝 Bond:</p>
                          <p className="text-gray-700">Team unity & trust</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-red-600">🎊 Success:</p>
                          <p className="text-gray-700">Achieving milestones</p>
                        </div>
                      </div>
                    </div>

                    {/* Decorative Bottom */}
                    <div className="mt-6 flex justify-center space-x-2 text-2xl">
                      <span>🌺</span>
                      <span>🪔</span>
                      <span>🌸</span>
                      <span>🪔</span>
                      <span>🌺</span>
                    </div>
                  </div>

                  {/* Poster Footer */}
                  <div className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white p-4 text-center">
                    <p className="text-lg font-semibold">
                      🎊 Happy Raksha Bandhan, Dear HOD! 🎊
                    </p>
                    <p className="text-sm text-blue-100 mt-1">
                      Wishing you success in all your endeavors
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-center">
              <Button
                onClick={() => setShowRakshaBandhanModal(false)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-2 rounded-full font-semibold shadow-lg"
              >
                🙏 Thank You & Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HODIndex;

