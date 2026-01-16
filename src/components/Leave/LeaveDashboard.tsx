import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, CalendarDays, Settings, Users, Plus } from 'lucide-react';
import LeaveManagement from './LeaveManagement';
import LeaveCalendar from './LeaveCalendar';
import { currentUser } from '@/data/mockData';
import NewLeaveDialogContent from './NewLeaveDialogContent';

export default function LeaveDashboard() {
  const [activeTab, setActiveTab] = useState('manage');
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [totalRequests, setTotalRequests] = useState(0);

  // Show different tabs based on user role
  const canManageLeaves = ['manager', 'department_head', 'admin', 'super_admin'].includes(currentUser.role);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-50/80 via-red-50/40 to-transparent dark:from-red-900/20 dark:via-red-900/10 dark:to-transparent rounded-xl"></div>
        <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg shadow-red-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 dark:from-red-400 dark:via-red-500 dark:to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                  <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 bg-green-500 rounded-full border-2 sm:border-3 border-white dark:border-slate-800 flex items-center justify-center">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                  <span className="hidden sm:inline">Leave Management</span>
                  <span className="sm:hidden">Leave Management</span>
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400">
                  <span className="hidden sm:inline">Manage leave requests, track balances, and view team availability</span>
                  <span className="sm:hidden">Manage leave requests and track balances</span>
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                  <div className="flex items-center gap-1 sm:gap-2 text-xs text-slate-500 dark:text-slate-500">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full"></div>
                    <span className="hidden sm:inline">System Active</span>
                    <span className="sm:hidden">Active</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 text-xs text-slate-500 dark:text-slate-500">
                    <Users className="h-3 w-3" />
                    <span className="hidden sm:inline">{totalRequests} Total Requests</span>
                    <span className="sm:hidden">{totalRequests} Requests</span>
                  </div>
                </div>
              </div>
            </div>
            {canManageLeaves && (
              <div className="flex items-center justify-end">
                <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => setShowNewRequestDialog(true)}
                      className="group relative px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
                      <span>New Request</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <NewLeaveDialogContent onClose={() => setShowNewRequestDialog(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${currentUser.role === 'super_admin' ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {canManageLeaves && (
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manage Request
            </TabsTrigger>
          )}
          {currentUser.role !== 'super_admin' && (
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Team Calender
            </TabsTrigger>
          )}
        </TabsList>


        {/* 'My Balance' content removed per request */}

        {canManageLeaves && (
          <TabsContent value="manage" className="space-y-6">
            <LeaveManagement showHeader={false} onTotalRequestsChange={setTotalRequests} />
          </TabsContent>
        )}

        {currentUser.role !== 'super_admin' && (
          <TabsContent value="calendar" className="space-y-6">
            <LeaveCalendar />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
