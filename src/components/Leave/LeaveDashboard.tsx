import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, BarChart3, Settings } from 'lucide-react';
import LeaveRequestForm from './LeaveRequestForm';
import LeaveBalance from './LeaveBalance';
import LeaveManagement from './LeaveManagement';
import LeaveCalendar from './LeaveCalendar';
import { currentUser } from '@/data/mockData';

export default function LeaveDashboard() {
  const [activeTab, setActiveTab] = useState('apply');

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="apply" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Apply Leave
          </TabsTrigger>
          <TabsTrigger value="balance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            My Balance
          </TabsTrigger>
          {canManageLeaves && (
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manage Requests
            </TabsTrigger>
          )}
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Team Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apply" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LeaveRequestForm />
            </div>
            <div>
              <LeaveBalance />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="balance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LeaveBalance />
            <Card>
              <CardHeader>
                <CardTitle>Leave History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Leave history will be displayed here
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {canManageLeaves && (
          <TabsContent value="manage" className="space-y-6">
            <LeaveManagement />
          </TabsContent>
        )}

        <TabsContent value="calendar" className="space-y-6">
          <LeaveCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}