import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Settings } from 'lucide-react';
import LeaveManagement from './LeaveManagement';
import LeaveCalendar from './LeaveCalendar';
import { currentUser } from '@/data/mockData';

export default function LeaveDashboard() {
  const [activeTab, setActiveTab] = useState('manage');

  // Show different tabs based on user role
  const canManageLeaves = ['manager', 'department_head', 'admin', 'super_admin'].includes(currentUser.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Leave Management System</h2>
          <p className="text-muted-foreground">
            Manage leave requests, track balances, and view team availability
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${currentUser.role === 'super_admin' ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {canManageLeaves && (
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manage Requests
            </TabsTrigger>
          )}
          {currentUser.role !== 'super_admin' && (
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Team Calendar
            </TabsTrigger>
          )}
        </TabsList>


        {/* 'My Balance' content removed per request */}

        {canManageLeaves && (
          <TabsContent value="manage" className="space-y-6">
            <LeaveManagement />
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