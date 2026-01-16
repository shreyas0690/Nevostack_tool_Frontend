import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Download, FileText, Calendar as CalendarIcon, Filter,
  BarChart3, Users, ClipboardList, CalendarDays, Building2,
  TrendingUp, FileSpreadsheet, FileImage
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { mockUsers, mockDepartments, mockTasks } from '@/data/mockData';
import { mockLeaveRequests } from '@/data/leaveData';
import { toast } from '@/hooks/use-toast';
import { reportsService, type OverviewReport } from '@/services/reportsService';
import { useAuth } from '@/components/Auth/AuthProvider';

export default function HRReports() {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('monthly');
  const [reportCategory, setReportCategory] = useState<string>('overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<OverviewReport | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // New state for explicit date range
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

  // Load report data when date range changes
  useEffect(() => {
    generateReportData();
  }, [dateRange]);

  const reportCategories = [
    { id: 'overview', label: 'HR Overview Report', icon: BarChart3, description: 'Complete HR overview with all metrics' },
    { id: 'tasks', label: 'Tasks Report', icon: ClipboardList, description: 'Detailed task analysis and performance' },
    { id: 'users', label: 'Employee Report', icon: Users, description: 'Employee performance and statistics' },
    { id: 'departments', label: 'Departments Report', icon: Building2, description: 'Department-wise analysis' },
    { id: 'leave', label: 'Leave Report', icon: CalendarDays, description: 'Leave requests and balance analysis' },
  ];

  const quickDateOptions = [
    { label: 'This Week', value: 'thisWeek', type: 'weekly' as const },
    { label: 'Last Week', value: 'lastWeek', type: 'weekly' as const },
    { label: 'This Month', value: 'thisMonth', type: 'monthly' as const },
    { label: 'Last Month', value: 'lastMonth', type: 'monthly' as const },
    { label: 'Last 3 Months', value: 'last3Months', type: 'monthly' as const },
  ];

  const getDateRange = (option: string) => {
    const now = new Date();
    switch (option) {
      case 'thisWeek':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'lastWeek':
        return { start: startOfWeek(subWeeks(now, 1)), end: endOfWeek(subWeeks(now, 1)) };
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'lastMonth':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'last3Months':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      default:
        return { start: now, end: now };
    }
  };

  const generateReportData = async () => {
    try {
      setIsLoadingData(true);
      // Use the explicit dateRange state
      const range = dateRange;

      const data = await reportsService.generateOverviewReport(
        reportType,
        range.start.toISOString(),
        range.end.toISOString(),
        currentUser?.companyId
      );

      setReportData(data);
      return data;
    } catch (error) {
      console.error('Error generating HR report data:', error);
      toast({
        title: "Error",
        description: "Failed to load HR report data from server. Using fallback data.",
        variant: "destructive",
      });

      // Fallback to mock data if backend fails
      const fallbackData = generateFallbackData();
      setReportData(fallbackData);
      return fallbackData;
    } finally {
      setIsLoadingData(false);
    }
  };

  const generateFallbackData = () => {
    const range = reportType === 'weekly'
      ? { start: startOfWeek(selectedDate), end: endOfWeek(selectedDate) }
      : { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };

    // Tasks data
    const tasksData = {
      total: mockTasks.length,
      completed: mockTasks.filter(t => t.status === 'completed').length,
      inProgress: mockTasks.filter(t => t.status === 'in_progress').length,
      assigned: mockTasks.filter(t => t.status === 'assigned').length,
      blocked: mockTasks.filter(t => t.status === 'blocked').length,
      byPriority: {
        urgent: mockTasks.filter(t => t.priority === 'urgent').length,
        high: mockTasks.filter(t => t.priority === 'high').length,
        medium: mockTasks.filter(t => t.priority === 'medium').length,
        low: mockTasks.filter(t => t.priority === 'low').length,
      }
    };

    // Departments data
    const departmentsData = mockDepartments.map(dept => {
      const deptTasks = mockTasks.filter(t => t.departmentId === dept.id);
      const completedTasks = deptTasks.filter(t => t.status === 'completed').length;
      return {
        name: dept.name,
        totalTasks: deptTasks.length,
        completedTasks,
        completionRate: deptTasks.length > 0 ? Math.round((completedTasks / deptTasks.length) * 100) : 0,
        members: dept.memberCount
      };
    });

    // Users data
    const usersData = mockUsers.map(user => {
      const userTasks = mockTasks.filter(t => t.assignedTo === user.id);
      const completedTasks = userTasks.filter(t => t.status === 'completed').length;
      return {
        name: user.name,
        email: user.email,
        department: mockDepartments.find(d => d.id === user.departmentId)?.name || 'No Department',
        totalTasks: userTasks.length,
        completedTasks,
        completionRate: userTasks.length > 0 ? Math.round((completedTasks / userTasks.length) * 100) : 0
      };
    });

    // Leave data
    const leaveData = {
      total: mockLeaveRequests.length,
      approved: mockLeaveRequests.filter(l => l.status === 'approved').length,
      pending: mockLeaveRequests.filter(l => l.status === 'pending').length,
      rejected: mockLeaveRequests.filter(l => l.status === 'rejected').length,
      cancelled: mockLeaveRequests.filter(l => l.status === 'cancelled').length,
      byType: {
        annual: mockLeaveRequests.filter(l => l.leaveType === 'annual').length,
        sick: mockLeaveRequests.filter(l => l.leaveType === 'sick').length,
        compensatory: mockLeaveRequests.filter(l => l.leaveType === 'compensatory').length,
        emergency: mockLeaveRequests.filter(l => l.leaveType === 'emergency').length,
      }
    };

    return {
      tasks: tasksData,
      departments: departmentsData,
      users: usersData,
      leave: leaveData
    };
  };

  const downloadReport = async (fileFormat: 'json' | 'csv' | 'pdf') => {
    setIsGenerating(true);
    try {
      // Use the explicit dateRange state
      const range = dateRange;

      await reportsService.downloadReport({
        reportType,
        reportCategory: 'overview',
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
        companyId: currentUser?.companyId
      }, fileFormat);

      toast({
        title: "Report Downloaded",
        description: `HR ${reportCategory} report has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('Error downloading HR report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const setQuickDate = (option: string) => {
    const range = getDateRange(option);
    setSelectedDate(range.start);
    setDateRange(range);
    const optionConfig = quickDateOptions.find(opt => opt.value === option);
    if (optionConfig) {
      setReportType(optionConfig.type);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Reports Management</h1>
          <p className="text-muted-foreground">
            Generate comprehensive HR reports and analytics
          </p>
        </div>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    reportCategory === category.id
                      ? "ring-2 ring-primary border-primary"
                      : "hover:border-primary/50"
                  )}
                  onClick={() => setReportCategory(category.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">{category.label}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Date and Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Period</label>
              <Select
                value={reportType}
                onValueChange={(value: 'weekly' | 'monthly') => {
                  setReportType(value);
                  const range = value === 'weekly'
                    ? { start: startOfWeek(selectedDate), end: endOfWeek(selectedDate) }
                    : { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };
                  setDateRange(range);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly Report</SelectItem>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        const range = reportType === 'weekly'
                          ? { start: startOfWeek(date), end: endOfWeek(date) }
                          : { start: startOfMonth(date), end: endOfMonth(date) };
                        setDateRange(range);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Options</label>
              <Select onValueChange={setQuickDate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quick date" />
                </SelectTrigger>
                <SelectContent>
                  {quickDateOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Report Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Tasks</p>
                        <p className="text-2xl font-bold">
                          {isLoadingData ? '...' : (reportData?.tasks?.total || mockTasks.length)}
                        </p>
                      </div>
                      <ClipboardList className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Users</p>
                        <p className="text-2xl font-bold">
                          {isLoadingData ? '...' : (reportData?.users?.length || mockUsers.length)}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Departments</p>
                        <p className="text-2xl font-bold">
                          {isLoadingData ? '...' : (reportData?.departments?.length || mockDepartments.length)}
                        </p>
                      </div>
                      <Building2 className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Leave Requests</p>
                        <p className="text-2xl font-bold">
                          {isLoadingData ? '...' : (reportData?.leave?.total || mockLeaveRequests.length)}
                        </p>
                      </div>
                      <CalendarDays className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Task Completion Rate</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-semibold">
                          {isLoadingData ? '...' : (reportData?.tasks?.total ?
                            Math.round((reportData.tasks.completed / reportData.tasks.total) * 100) :
                            Math.round((mockTasks.filter(t => t.status === 'completed').length / mockTasks.length) * 100))}%
                        </p>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Users</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-semibold">
                          {isLoadingData ? '...' : (reportData?.users ?
                            reportData.users.length :
                            mockUsers.length)}
                        </p>
                        <Badge variant="outline">
                          {isLoadingData ? '...' : (reportData?.users?.length ?
                            100 :
                            100)}%
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Tasks per User</p>
                      <p className="text-xl font-semibold">
                        {isLoadingData ? '...' : (reportData?.users?.length ?
                          Math.round((reportData.tasks?.total || 0) / reportData.users.length) :
                          Math.round(mockTasks.length / mockUsers.length))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tasks by Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { status: 'completed', count: mockTasks.filter(t => t.status === 'completed').length, color: 'bg-green-500' },
                      { status: 'in_progress', count: mockTasks.filter(t => t.status === 'in_progress').length, color: 'bg-blue-500' },
                      { status: 'assigned', count: mockTasks.filter(t => t.status === 'assigned').length, color: 'bg-yellow-500' },
                      { status: 'blocked', count: mockTasks.filter(t => t.status === 'blocked').length, color: 'bg-red-500' },
                    ].map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="capitalize">{item.status.replace('_', ' ')}</span>
                        </div>
                        <Badge variant="outline">{item.count}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tasks by Priority</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { priority: 'urgent', count: mockTasks.filter(t => t.priority === 'urgent').length, color: 'bg-red-500' },
                      { priority: 'high', count: mockTasks.filter(t => t.priority === 'high').length, color: 'bg-orange-500' },
                      { priority: 'medium', count: mockTasks.filter(t => t.priority === 'medium').length, color: 'bg-yellow-500' },
                      { priority: 'low', count: mockTasks.filter(t => t.priority === 'low').length, color: 'bg-green-500' },
                    ].map((item) => (
                      <div key={item.priority} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="capitalize">{item.priority}</span>
                        </div>
                        <Badge variant="outline">{item.count}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">User Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockUsers.slice(0, 5).map((user) => {
                      const userTasks = mockTasks.filter(t => t.assignedTo === user.id);
                      const completionRate = userTasks.length > 0
                        ? Math.round((userTasks.filter(t => t.status === 'completed').length / userTasks.length) * 100)
                        : 0;

                      return (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {mockDepartments.find(d => d.id === user.departmentId)?.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{completionRate}%</p>
                            <p className="text-sm text-muted-foreground">{userTasks.length} tasks</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="departments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Department Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockDepartments.map((dept) => {
                      const deptTasks = mockTasks.filter(t => t.departmentId === dept.id);
                      const completionRate = deptTasks.length > 0
                        ? Math.round((deptTasks.filter(t => t.status === 'completed').length / deptTasks.length) * 100)
                        : 0;

                      return (
                        <div key={dept.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{dept.name}</p>
                            <p className="text-sm text-muted-foreground">{dept.memberCount} members</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{completionRate}%</p>
                            <p className="text-sm text-muted-foreground">{deptTasks.length} tasks</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Download Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => downloadReport('json')}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Download JSON
            </Button>
            <Button
              onClick={() => downloadReport('csv')}
              disabled={isGenerating}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download CSV
            </Button>
            <Button
              onClick={() => downloadReport('pdf')}
              disabled={isGenerating}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileImage className="h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {isGenerating && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Generating report...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}










































































