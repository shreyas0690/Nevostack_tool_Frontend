import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, X } from 'lucide-react';
import MemberHeader from '@/components/Layout/MemberHeader';
import MemberSidebar from '@/components/Layout/MemberSidebar';
import MemberDashboard from '@/components/Dashboard/MemberDashboard';
import MemberMyTasks from '@/components/Tasks/MemberMyTasks';
import MemberProfile from '@/components/Profile/MemberProfile';
import MemberLeaveRequests from '@/components/Leave/MemberLeaveRequests';
import MemberMeetings from '@/components/Meetings/MemberMeetings';

const MemberIndex = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Show welcome modal when Member logs in
  useEffect(() => {
    // Check if modal was already shown today
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('member_welcome_shown');
    
    if (lastShown !== today) {
      // Show modal after a short delay
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
        localStorage.setItem('member_welcome_shown', today);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <MemberDashboard onNavigate={setActiveTab} />;
      case 'my-tasks':
        return <MemberMyTasks />;
      case 'profile':
        return <MemberProfile />;
      case 'leave':
        return <MemberLeaveRequests />;
      case 'meetings':
        return <MemberMeetings />;
      default:
        return <MemberDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MemberHeader onNavigate={setActiveTab} />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <MemberSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Welcome Modal */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={() => setShowWelcomeModal(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 text-white p-6">
              <div className="text-center">
                <Star className="h-12 w-12 mx-auto mb-4 animate-bounce" />
                <h2 className="text-3xl font-bold mb-2">🌟 Welcome, Team Member! 🌟</h2>
                <p className="text-blue-100 text-lg">
                  Your Personal Workspace
                </p>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-8 bg-gradient-to-b from-blue-50 to-indigo-50">
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-blue-300">
                  <div className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 text-white p-6 text-center">
                    <h1 className="text-4xl font-bold mb-2">⭐ Member Dashboard ⭐</h1>
                    <h2 className="text-2xl font-semibold">Personal Productivity Hub</h2>
                    <p className="text-blue-100 mt-2">Track, Achieve, and Grow</p>
                  </div>
                  
                  <div className="p-8 text-center bg-gradient-to-b from-blue-50 to-indigo-50">
                    {/* Decorative Elements */}
                    <div className="flex justify-center space-x-8 mb-8">
                      <div className="text-4xl">📋</div>
                      <div className="text-4xl">📊</div>
                      <div className="text-4xl">⏰</div>
                      <div className="text-4xl">🎯</div>
                      <div className="text-4xl">👥</div>
                    </div>
                    
                    {/* Features Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                      <div className="bg-white/70 p-4 rounded-lg border border-blue-200">
                        <div className="text-2xl mb-2">📝</div>
                        <p className="text-sm font-semibold text-blue-800">My Tasks</p>
                        <p className="text-xs text-blue-600">Track your work</p>
                      </div>
                      <div className="bg-white/70 p-4 rounded-lg border border-blue-200">
                        <div className="text-2xl mb-2">📈</div>
                        <p className="text-sm font-semibold text-blue-800">Performance</p>
                        <p className="text-xs text-blue-600">View your progress</p>
                      </div>
                      <div className="bg-white/70 p-4 rounded-lg border border-blue-200">
                        <div className="text-2xl mb-2">🏖️</div>
                        <p className="text-sm font-semibold text-blue-800">Leave Requests</p>
                        <p className="text-xs text-blue-600">Plan your time off</p>
                      </div>
                      <div className="bg-white/70 p-4 rounded-lg border border-blue-200">
                        <div className="text-2xl mb-2">💼</div>
                        <p className="text-sm font-semibold text-blue-800">Meetings</p>
                        <p className="text-xs text-blue-600">Stay connected</p>
                      </div>
                      <div className="bg-white/70 p-4 rounded-lg border border-blue-200">
                        <div className="text-2xl mb-2">👤</div>
                        <p className="text-sm font-semibold text-blue-800">Profile</p>
                        <p className="text-xs text-blue-600">Manage your info</p>
                      </div>
                      <div className="bg-white/70 p-4 rounded-lg border border-blue-200">
                        <div className="text-2xl mb-2">⏱️</div>
                        <p className="text-sm font-semibold text-blue-800">Time Tracking</p>
                        <p className="text-xs text-blue-600">Log your hours</p>
                      </div>
                    </div>
                    
                    {/* Motivational Message */}
                    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-6 rounded-xl border-2 border-blue-300">
                      <h3 className="text-xl font-bold text-blue-800 mb-2">🚀 Ready to Excel!</h3>
                      <p className="text-blue-700 mb-4">
                        Your personal workspace is designed to help you stay organized, 
                        track your achievements, and collaborate effectively with your team.
                      </p>
                      <div className="flex justify-center">
                        <Button 
                          onClick={() => setShowWelcomeModal(false)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                        >
                          ✨ Let's Get Started! ✨
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 text-white p-4 text-center">
                    <p className="text-lg font-semibold">
                      🎉 Welcome to Your Member Dashboard! 🎉
                    </p>
                    <p className="text-sm text-blue-100 mt-1">
                      Your productivity journey starts here
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberIndex;
