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
import { reportsService, type OverviewReport, type TasksReport, type DepartmentsReport, type UsersReport, type LeaveReport } from '@/services/reportsService';
import { useAuth } from '@/components/Auth/AuthProvider';

export default function ReportsManagement() {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('monthly');
  const [reportCategory, setReportCategory] = useState<'overview' | 'tasks' | 'departments' | 'users' | 'leave'>('overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<OverviewReport | TasksReport | DepartmentsReport | UsersReport | LeaveReport | null>(null);

  // Debug function to test fallback data generation
  const checkIfDataIsEmpty = (data: any, category: string): boolean => {
    if (!data) return true;

    switch (category) {
      case 'tasks':
        return !data.total || data.total === 0;
      case 'departments':
        return !data.departments || data.departments.length === 0;
      case 'users':
        return !data.users || data.users.length === 0;
      case 'leave':
        return !data.summary || data.summary.total === 0;
      case 'overview':
        return (!data.tasks || data.tasks.total === 0) &&
               (!data.departments || data.departments.length === 0) &&
               (!data.users || data.users.length === 0) &&
               (!data.leave || data.leave.total === 0);
      default:
        return true;
    }
  };

  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load report data when component mounts or parameters change
  useEffect(() => {
    generateReportData();
  }, [selectedDate, reportType]);

  // Load report data when category changes
  useEffect(() => {
    console.log('📊 Report category changed to:', reportCategory);
    generateReportData();
  }, [reportCategory]);

  // Component mounted
  useEffect(() => {
    console.log('🚀 ReportsManagement component mounted');

    // If no data is loaded after initial attempt, force fallback
    setTimeout(() => {
      if (!reportData) {
        console.log('⚠️ No data loaded, forcing fallback...');
        const fallbackData = generateFallbackData();
        setReportData(fallbackData);
      }
    }, 2000);
  }, []);

  // Force fallback data if reportData remains null after loading attempts
  useEffect(() => {
    if (!reportData && !isLoadingData) {
      console.log('⚠️ No report data available, auto-loading fallback...');
      const fallbackData = generateFallbackData();
      setReportData(fallbackData);
    }
  }, [reportData, isLoadingData, reportCategory]);

  const reportCategories = [
    { id: 'overview', label: 'Overview Report', icon: BarChart3, description: 'Complete company overview with all metrics' },
    { id: 'tasks', label: 'Tasks Report', icon: ClipboardList, description: 'Detailed task analysis and performance' },
    { id: 'users', label: 'Users Report', icon: Users, description: 'Employee performance and statistics' },
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
    const range = reportType === 'weekly' 
      ? { start: startOfWeek(selectedDate), end: endOfWeek(selectedDate) }
      : { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };

      console.log('📊 Generating report data for category:', reportCategory);
      console.log('📅 Date range:', range);

      let data;
      console.log('🎯 Calling service method for category:', reportCategory);

      switch (reportCategory) {
        case 'overview':
          console.log('📊 Calling generateOverviewReport...');
          data = await reportsService.generateOverviewReport(
            reportType,
            range.start.toISOString(),
            range.end.toISOString()
          );
          console.log('📊 Overview data received:', data);
          break;
        case 'tasks':
          console.log('📋 Calling generateTasksReport...');
          data = await reportsService.generateTasksReport(
            reportType,
            range.start.toISOString(),
            range.end.toISOString()
          );
          console.log('📋 Tasks data received:', data);
          break;
        case 'departments':
          console.log('🏢 Calling generateDepartmentsReport...');
          data = await reportsService.generateDepartmentsReport(
            reportType,
            range.start.toISOString(),
            range.end.toISOString()
          );
          console.log('🏢 Departments data received:', data);
          break;
        case 'users':
          console.log('👥 Calling generateUsersReport...');
          data = await reportsService.generateUsersReport(
            reportType,
            range.start.toISOString(),
            range.end.toISOString()
          );
          console.log('👥 Users data received:', data);
          break;
        case 'leave':
          console.log('📅 Calling generateLeaveReport...');
          data = await reportsService.generateLeaveReport(
            reportType,
            range.start.toISOString(),
            range.end.toISOString()
          );
          console.log('📅 Leave data received:', data);
          break;
        default:
          console.log('📊 Calling default generateOverviewReport...');
          data = await reportsService.generateOverviewReport(
            reportType,
            range.start.toISOString(),
            range.end.toISOString()
          );
          console.log('📊 Default overview data received:', data);
      }

      console.log('✅ Report data received from backend:', data);
      setReportData(data);

      toast({
        title: "Report Data Loaded",
        description: `Successfully loaded ${reportCategory} data from backend.`,
      });

      return data;
    } catch (error) {
      console.error('❌ Error generating report data:', error);
      toast({
        title: "Backend Error",
        description: `Failed to load ${reportCategory} data from server. Check console for details.`,
        variant: "destructive",
      });

      // Only use fallback for overview report, others should show error
      if (reportCategory === 'overview') {
        console.log('🔄 Generating fallback data for overview report...');
        const fallbackData = generateFallbackData();
        setReportData(fallbackData);
        return fallbackData;
      } else {
        // For other reports, show empty state instead of mock data
        setReportData(null);
        return null;
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  const generateFallbackData = () => {
    const range = reportType === 'weekly'
      ? { start: startOfWeek(selectedDate), end: endOfWeek(selectedDate) }
      : { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };

    switch (reportCategory) {
      case 'overview':
        return generateOverviewFallbackData();
      case 'tasks':
        return generateTasksFallbackData();
      case 'departments':
        return generateDepartmentsFallbackData();
      case 'users':
        return generateUsersFallbackData();
      case 'leave':
        return generateLeaveFallbackData();
      default:
        return generateOverviewFallbackData();
    }
  };

  const generateOverviewFallbackData = (): OverviewReport => {
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

  const generateTasksFallbackData = (): TasksReport => {
    console.log('🔄 Generating Tasks fallback data...');
    console.log('📊 Mock tasks count:', mockTasks.length);
    console.log('📋 Sample tasks:', mockTasks.slice(0, 3).map(t => ({ id: t.id, status: t.status, priority: t.priority })));

    const total = mockTasks.length;
    const completed = mockTasks.filter(t => t.status === 'completed').length;
    const inProgress = mockTasks.filter(t => t.status === 'in_progress').length;
    const assigned = mockTasks.filter(t => t.status === 'assigned').length;
    const blocked = mockTasks.filter(t => t.status === 'blocked').length;

    console.log('📈 Tasks status breakdown:', { total, completed, inProgress, assigned, blocked });

    // Double-check with manual counting
    let manualCompleted = 0, manualInProgress = 0, manualAssigned = 0, manualBlocked = 0;
    mockTasks.forEach(task => {
      switch (task.status) {
        case 'completed': manualCompleted++; break;
        case 'in_progress': manualInProgress++; break;
        case 'assigned': manualAssigned++; break;
        case 'blocked': manualBlocked++; break;
      }
    });
    console.log('🔍 Manual count verification:', { manualCompleted, manualInProgress, manualAssigned, manualBlocked });

    // Top performers based on completed tasks
    const topPerformers = mockUsers
      .map(user => {
        const userTasks = mockTasks.filter(t => t.assignedTo === user.id);
        const completedTasks = userTasks.filter(t => t.status === 'completed').length;
        return {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          totalTasks: userTasks.length,
          completedTasks,
          completionRate: userTasks.length > 0 ? Math.round((completedTasks / userTasks.length) * 100) : 0
        };
      })
      .sort((a, b) => b.completedTasks - a.completedTasks)
      .slice(0, 5);

    console.log('🏆 Top performers:', topPerformers);

    const result = {
      total,
      byStatus: {
        completed,
        inProgress,
        assigned,
        blocked
      },
      byPriority: {
        urgent: mockTasks.filter(t => t.priority === 'urgent').length,
        high: mockTasks.filter(t => t.priority === 'high').length,
        medium: mockTasks.filter(t => t.priority === 'medium').length,
        low: mockTasks.filter(t => t.priority === 'low').length
      },
      topPerformers
    };

    console.log('✅ Tasks fallback data generated:', result);
    return result;
  };

  const generateDepartmentsFallbackData = (): DepartmentsReport => {
    console.log('🔄 Generating Departments fallback data...');
    console.log('🏢 Mock departments count:', mockDepartments.length);

    const departments = mockDepartments.map(dept => {
      const deptTasks = mockTasks.filter(t => t.departmentId === dept.id);
      const completedTasks = deptTasks.filter(t => t.status === 'completed').length;
      const inProgressTasks = deptTasks.filter(t => t.status === 'in_progress').length;
      const pendingTasks = deptTasks.filter(t => t.status === 'assigned' || t.status === 'blocked').length;
      const members = dept.memberCount;
      const activeMembers = Math.floor(members * 0.8); // Assume 80% are active

      return {
        name: dept.name,
        description: dept.description || `Department for ${dept.name}`,
        totalTasks: deptTasks.length,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        members,
        activeMembers,
        completionRate: deptTasks.length > 0 ? Math.round((completedTasks / deptTasks.length) * 100) : 0,
        productivity: members > 0 ? Math.round((completedTasks / members) * 100) : 0
      };
    });

    const totalMembers = departments.reduce((sum, dept) => sum + dept.members, 0);
    const totalTasks = departments.reduce((sum, dept) => sum + dept.totalTasks, 0);
    const totalCompleted = departments.reduce((sum, dept) => sum + dept.completedTasks, 0);

    const result = {
      departments,
      summary: {
        totalDepartments: departments.length,
        totalMembers,
        totalTasks,
        totalCompleted,
        averageCompletionRate: departments.length > 0
          ? Math.round(departments.reduce((sum, dept) => sum + dept.completionRate, 0) / departments.length)
          : 0
      }
    };

    console.log('✅ Departments fallback data generated:', result);
    return result;
  };

  const generateUsersFallbackData = (): UsersReport => {
    console.log('🔄 Generating Users fallback data...');
    console.log('👥 Mock users count:', mockUsers.length);

    const users = mockUsers.map(user => {
      const userTasks = mockTasks.filter(t => t.assignedTo === user.id);
      const completedTasks = userTasks.filter(t => t.status === 'completed').length;
      const inProgressTasks = userTasks.filter(t => t.status === 'in_progress').length;
      const overdueTasks = userTasks.filter(t =>
        (t.status === 'in_progress' || t.status === 'assigned') &&
        new Date(t.dueDate) < new Date()
      ).length;

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        department: mockDepartments.find(d => d.id === user.departmentId)?.name || 'No Department',
        totalTasks: userTasks.length,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate: userTasks.length > 0 ? Math.round((completedTasks / userTasks.length) * 100) : 0
      };
    });

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const totalTasks = users.reduce((sum, u) => sum + u.totalTasks, 0);
    const totalCompleted = users.reduce((sum, u) => sum + u.completedTasks, 0);

    const result = {
      users,
      summary: {
        totalUsers,
        activeUsers,
        totalTasks,
        totalCompleted,
        averageCompletionRate: users.length > 0
          ? Math.round(users.reduce((sum, u) => sum + u.completionRate, 0) / users.length)
          : 0,
        usersWithTasks: users.filter(u => u.totalTasks > 0).length
      }
    };

    console.log('✅ Users fallback data generated:', result);
    return result;
  };

  const generateLeaveFallbackData = (): LeaveReport => {
    console.log('🔄 Generating Leave fallback data...');
    console.log('📅 Mock leave requests count:', mockLeaveRequests.length);

    const total = mockLeaveRequests.length;
    const approved = mockLeaveRequests.filter(l => l.status === 'approved').length;
    const pending = mockLeaveRequests.filter(l => l.status === 'pending').length;
    const rejected = mockLeaveRequests.filter(l => l.status === 'rejected').length;
    const cancelled = mockLeaveRequests.filter(l => l.status === 'cancelled').length;
    const totalDays = mockLeaveRequests.reduce((sum, l) => sum + l.totalDays, 0);

    // Group by month
    const byMonth = mockLeaveRequests.reduce((acc, leave) => {
      const month = new Date(leave.startDate).toISOString().substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { count: 0, totalDays: 0 };
      }
      acc[month].count++;
      acc[month].totalDays += leave.totalDays;
      return acc;
    }, {} as Record<string, { count: number; totalDays: number }>);

    // Top users by leave days
    const topUsers = mockUsers
      .map(user => {
        const userLeaves = mockLeaveRequests.filter(l => l.employeeId === user.id);
        const totalLeaveDays = userLeaves.reduce((sum, l) => sum + l.totalDays, 0);
        return {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          department: mockDepartments.find(d => d.id === user.departmentId)?.name || 'No Department',
          totalLeaveDays,
          leaveRequests: userLeaves.length
        };
      })
      .sort((a, b) => b.totalLeaveDays - a.totalLeaveDays)
      .slice(0, 5);

    // Recent leave requests
    const recentRequests = mockLeaveRequests
      .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())
      .slice(0, 10)
      .map(leave => {
        const user = mockUsers.find(u => u.id === leave.employeeId);
        return {
          id: leave.id,
          type: leave.leaveType,
          status: leave.status,
          startDate: leave.startDate.toISOString(),
          endDate: leave.endDate.toISOString(),
          days: leave.totalDays,
          reason: leave.reason,
          createdAt: leave.appliedDate.toISOString(),
          employee: user ? {
            id: user.id,
            name: user.name,
            email: user.email
          } : null
        };
      });

    const result = {
      summary: {
        total,
        approved,
        pending,
        rejected,
        cancelled,
        totalDays
      },
      byType: {
        annual: mockLeaveRequests.filter(l => l.leaveType === 'annual').length,
        sick: mockLeaveRequests.filter(l => l.leaveType === 'sick').length,
        compensatory: mockLeaveRequests.filter(l => l.leaveType === 'compensatory').length,
        emergency: mockLeaveRequests.filter(l => l.leaveType === 'emergency').length
      },
      byMonth: Object.entries(byMonth).map(([month, data]) => ({
        date: month,
        count: data.count,
        totalDays: data.totalDays
      })),
      topUsers,
      recentRequests
    };

    console.log('✅ Leave fallback data generated:', result);
    return result;
  };

  const downloadReport = async (fileFormat: 'json' | 'csv' | 'pdf') => {
    setIsGenerating(true);
    try {
      const range = reportType === 'weekly'
        ? { start: startOfWeek(selectedDate), end: endOfWeek(selectedDate) }
        : { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };

      await reportsService.downloadReport({
        reportType,
        reportCategory,
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
        companyId: currentUser?.companyId
      }, fileFormat);

      toast({
        title: "Report Downloaded",
        description: `${reportCategory} report has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };


  const renderQuickStats = () => {
    console.log('🎯 Rendering quick stats for category:', reportCategory);
    console.log('📊 Current report data:', reportData);
    console.log('📊 Report data type:', typeof reportData);
    console.log('📊 Report data keys:', reportData ? Object.keys(reportData) : 'No data');

    if (!reportData) {
      console.log('⚠️ No report data available for rendering');
      return (
        <div className="text-center py-4">
          <p className="text-muted-foreground">No data available from backend</p>
          <p className="text-sm text-muted-foreground mt-1">Please check if the backend server is running</p>
        </div>
      );
    }

    switch (reportCategory) {
      case 'overview':
        console.log('📊 Rendering overview stats');
        return renderOverviewStats(reportData as OverviewReport);
      case 'tasks':
        console.log('📋 Rendering tasks stats with data structure:', reportData);
        return renderTasksStats(reportData as TasksReport);
      case 'departments':
        console.log('🏢 Rendering departments stats with data structure:', reportData);
        return renderDepartmentsStats(reportData as DepartmentsReport);
      case 'users':
        console.log('👥 Rendering users stats with data structure:', reportData);
        return renderUsersStats(reportData as UsersReport);
      case 'leave':
        console.log('📅 Rendering leave stats with data structure:', reportData);
        return renderLeaveStats(reportData as LeaveReport);
      default:
        console.log('📊 Rendering default overview stats');
        return renderOverviewStats(reportData as OverviewReport);
    }
  };

  const renderFallbackStats = () => {
    switch (reportCategory) {
      case 'overview':
        return renderOverviewFallbackStats();
      case 'tasks':
        return renderTasksFallbackStats();
      case 'departments':
        return renderDepartmentsFallbackStats();
      case 'users':
        return renderUsersFallbackStats();
      case 'leave':
        return renderLeaveFallbackStats();
      default:
        return renderOverviewFallbackStats();
    }
  };

  const renderOverviewStats = (data: OverviewReport) => (
    <>
      <div className="flex justify-between">
        <span>Total Tasks:</span>
        <Badge variant="outline">{data.tasks?.total || 0}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Completed:</span>
        <Badge variant="default">{data.tasks?.completed || 0}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Total Users:</span>
        <Badge variant="outline">{data.users?.length || 0}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Departments:</span>
        <Badge variant="outline">{data.departments?.length || 0}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Leave Requests:</span>
        <Badge variant="outline">{data.leave?.total || 0}</Badge>
      </div>
    </>
  );

  const renderTasksStats = (data: TasksReport) => {
    console.log('📊 Rendering Tasks stats with data:', data);
    console.log('📈 Tasks data breakdown:', {
      total: data.total,
      completed: data.byStatus?.completed,
      inProgress: data.byStatus?.inProgress,
      urgent: data.byPriority?.urgent,
      topPerformers: data.topPerformers?.length
    });

    const totalTasks = data.total || 0;
    const completedTasks = data.byStatus?.completed || 0;
    const inProgressTasks = data.byStatus?.inProgress || 0;
    const urgentTasks = data.byPriority?.urgent || 0;
    const topPerformersCount = data.topPerformers?.length || 0;

    console.log('📊 Final values to display:', {
      totalTasks, completedTasks, inProgressTasks, urgentTasks, topPerformersCount
    });

    return (
      <>
        <div className="flex justify-between">
          <span>Total Tasks:</span>
          <Badge variant="outline">{totalTasks}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Completed:</span>
          <Badge variant="default">{completedTasks}</Badge>
        </div>
        <div className="flex justify-between">
          <span>In Progress:</span>
          <Badge variant="secondary">{inProgressTasks}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Urgent:</span>
          <Badge variant="destructive">{urgentTasks}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Top Performers:</span>
          <Badge variant="outline">{topPerformersCount}</Badge>
        </div>
      </>
    );
  };

  const renderDepartmentsStats = (data: DepartmentsReport) => {
    console.log('🏢 Rendering departments stats with data:', data);

    const totalDepartments = data.summary?.totalDepartments || 0;
    const totalMembers = data.summary?.totalMembers || 0;
    const totalTasks = data.summary?.totalTasks || 0;
    const totalCompleted = data.summary?.totalCompleted || 0;
    const averageCompletionRate = data.summary?.averageCompletionRate || 0;

    console.log('🏢 Final departments values:', {
      totalDepartments, totalMembers, totalTasks, totalCompleted, averageCompletionRate
    });

    return (
      <>
        <div className="flex justify-between">
          <span>Total Departments:</span>
          <Badge variant="outline">{totalDepartments}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Total Members:</span>
          <Badge variant="default">{totalMembers}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Total Tasks:</span>
          <Badge variant="outline">{totalTasks}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Completed Tasks:</span>
          <Badge variant="secondary">{totalCompleted}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Avg Completion:</span>
          <Badge variant="outline">{averageCompletionRate.toFixed(1)}%</Badge>
        </div>
      </>
    );
  };

  const renderUsersStats = (data: UsersReport) => {
    console.log('👥 Rendering users stats with data:', data);

    const totalUsers = data.summary?.totalUsers || 0;
    const activeUsers = data.summary?.activeUsers || 0;
    const usersWithTasks = data.summary?.usersWithTasks || 0;
    const totalTasks = data.summary?.totalTasks || 0;
    const averageCompletionRate = data.summary?.averageCompletionRate || 0;

    console.log('👥 Final users values:', {
      totalUsers, activeUsers, usersWithTasks, totalTasks, averageCompletionRate
    });

    return (
      <>
        <div className="flex justify-between">
          <span>Total Users:</span>
          <Badge variant="outline">{totalUsers}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Active Users:</span>
          <Badge variant="default">{activeUsers}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Users with Tasks:</span>
          <Badge variant="secondary">{usersWithTasks}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Total Tasks:</span>
          <Badge variant="outline">{totalTasks}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Avg Completion:</span>
          <Badge variant="outline">{averageCompletionRate.toFixed(1)}%</Badge>
        </div>
      </>
    );
  };

  const renderLeaveStats = (data: LeaveReport) => {
    console.log('📅 Rendering leave stats with data:', data);

    const totalRequests = data.summary?.total || 0;
    const approved = data.summary?.approved || 0;
    const pending = data.summary?.pending || 0;
    const totalDays = data.summary?.totalDays || 0;
    const topUsersCount = data.topUsers?.length || 0;

    console.log('📅 Final leave values:', {
      totalRequests, approved, pending, totalDays, topUsersCount
    });

    return (
      <>
        <div className="flex justify-between">
          <span>Total Requests:</span>
          <Badge variant="outline">{totalRequests}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Approved:</span>
          <Badge variant="default">{approved}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Pending:</span>
          <Badge variant="secondary">{pending}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Total Days:</span>
          <Badge variant="outline">{totalDays}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Top Users:</span>
          <Badge variant="outline">{topUsersCount}</Badge>
        </div>
      </>
    );
  };

  const renderOverviewFallbackStats = () => (
    <>
      <div className="flex justify-between">
        <span>Total Tasks:</span>
        <Badge variant="outline">{mockTasks.length}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Completed:</span>
        <Badge variant="default">{mockTasks.filter(t => t.status === 'completed').length}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Total Users:</span>
        <Badge variant="outline">{mockUsers.length}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Departments:</span>
        <Badge variant="outline">{mockDepartments.length}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Leave Requests:</span>
        <Badge variant="outline">{0}</Badge>
      </div>
    </>
  );

  const renderTasksFallbackStats = () => (
    <>
      <div className="flex justify-between">
        <span>Total Tasks:</span>
        <Badge variant="outline">{mockTasks.length}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Completed:</span>
        <Badge variant="default">{mockTasks.filter(t => t.status === 'completed').length}</Badge>
      </div>
      <div className="flex justify-between">
        <span>In Progress:</span>
        <Badge variant="secondary">{mockTasks.filter(t => t.status === 'in_progress').length}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Urgent:</span>
        <Badge variant="destructive">{mockTasks.filter(t => t.priority === 'urgent').length}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Mock Data:</span>
        <Badge variant="outline">Ready</Badge>
      </div>
    </>
  );

  const renderDepartmentsFallbackStats = () => (
    <>
      <div className="flex justify-between">
        <span>Departments:</span>
        <Badge variant="outline">{mockDepartments.length}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Total Members:</span>
        <Badge variant="default">{mockDepartments.reduce((sum, dept) => sum + dept.memberCount, 0)}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Total Tasks:</span>
        <Badge variant="outline">{mockTasks.length}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Completed Tasks:</span>
        <Badge variant="secondary">{mockTasks.filter(t => t.status === 'completed').length}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Mock Data:</span>
        <Badge variant="outline">Ready</Badge>
      </div>
    </>
  );

  const renderUsersFallbackStats = () => (
    <>
      <div className="flex justify-between">
        <span>Total Users:</span>
        <Badge variant="outline">{mockUsers.length}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Active Users:</span>
        <Badge variant="default">{mockUsers.filter(u => u.isActive).length}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Users with Tasks:</span>
        <Badge variant="secondary">{mockUsers.filter(u => mockTasks.some(t => t.assignedTo === u.id)).length}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Total Tasks:</span>
        <Badge variant="outline">{mockTasks.length}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Mock Data:</span>
        <Badge variant="outline">Ready</Badge>
      </div>
    </>
  );

  const renderLeaveFallbackStats = () => (
    <>
      <div className="flex justify-between">
        <span>Total Requests:</span>
        <Badge variant="outline">{mockLeaveRequests.length}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Approved:</span>
        <Badge variant="default">{mockLeaveRequests.filter(l => l.status === 'approved').length}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Pending:</span>
        <Badge variant="secondary">{mockLeaveRequests.filter(l => l.status === 'pending').length}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Total Days:</span>
        <Badge variant="outline">{mockLeaveRequests.reduce((sum, l) => sum + l.totalDays, 0)}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Mock Data:</span>
        <Badge variant="outline">Ready</Badge>
      </div>
    </>
  );

  const quickDateSelect = (option: string) => {
    const dateOption = quickDateOptions.find(opt => opt.value === option);
    if (dateOption) {
      const range = getDateRange(option);
      setSelectedDate(range.start);
      setReportType(dateOption.type);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent rounded-xl"></div>
          <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-3 sm:p-4 lg:p-6 shadow-lg shadow-red-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 dark:from-red-400 dark:via-red-500 dark:to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    <span className="hidden sm:inline">Reports Management</span>
                    <span className="sm:hidden">Reports</span>
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
                    <span className="hidden sm:inline">Generate and download comprehensive company reports</span>
                    <span className="sm:hidden">Generate company reports</span>
                  </p>
                  <div className="flex items-center gap-2 sm:gap-4 mt-2">
                    <div className="flex items-center gap-1 sm:gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="hidden sm:inline">System Active</span>
                      <span className="sm:hidden">Active</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <TrendingUp className="h-3 w-3" />
                      <span className="hidden sm:inline">Real-time Data</span>
                      <span className="sm:hidden">Live</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card className="group border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:border-red-200 dark:hover:border-red-800">
            <CardHeader className="relative bg-gradient-to-r from-red-50/80 to-slate-50/80 dark:from-red-900/20 dark:to-slate-800/80 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent dark:from-red-400/5 rounded-t-xl"></div>
              <CardTitle className="relative flex items-center gap-2 sm:gap-3 lg:gap-4 text-slate-900 dark:text-slate-100">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold">
                    <span className="hidden sm:inline">Report Configuration</span>
                    <span className="sm:hidden">Configuration</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                    <span className="hidden sm:inline">Customize your report parameters and settings</span>
                    <span className="sm:hidden">Customize report settings</span>
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Quick Date Selection */}
              <div className="bg-gradient-to-r from-slate-50 to-red-50/30 dark:from-slate-800/50 dark:to-red-900/10 rounded-2xl p-3 sm:p-4 lg:p-6 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-900 dark:text-slate-100">
                    <span className="hidden sm:inline">Quick Date Selection</span>
                    <span className="sm:hidden">Quick Dates</span>
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3 sm:mb-4">
                  <span className="hidden sm:inline">Choose from predefined time periods for faster report generation</span>
                  <span className="sm:hidden">Choose predefined time periods</span>
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {quickDateOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant="outline"
                      size="sm"
                      onClick={() => quickDateSelect(option.value)}
                      className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 hover:text-red-700 dark:hover:text-red-300 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Date Selection */}
              <div className="bg-gradient-to-r from-slate-50 to-red-50/30 dark:from-slate-800/50 dark:to-red-900/10 rounded-2xl p-3 sm:p-4 lg:p-6 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-900 dark:text-slate-100">
                    <span className="hidden sm:inline">Custom Date Selection</span>
                    <span className="sm:hidden">Custom Dates</span>
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3 sm:mb-4 lg:mb-6">
                  <span className="hidden sm:inline">Configure specific date ranges and report types for detailed analysis</span>
                  <span className="sm:hidden">Configure date ranges and report types</span>
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 block">Report Type</label>
                    <Select value={reportType} onValueChange={(value: 'weekly' | 'monthly') => setReportType(value)}>
                      <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400 rounded-xl h-10 sm:h-12 bg-white dark:bg-slate-800 shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">📅 Weekly Report</SelectItem>
                        <SelectItem value="monthly">📊 Monthly Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 block">Select Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-slate-200 dark:border-slate-600 hover:border-red-300 dark:hover:border-red-600 rounded-xl h-10 sm:h-12 bg-white dark:bg-slate-800 shadow-sm text-xs sm:text-sm",
                            !selectedDate && "text-slate-500 dark:text-slate-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-slate-200 dark:border-slate-700 shadow-xl">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          initialFocus
                          className="rounded-xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Report Category */}
              <div className="bg-gradient-to-r from-slate-50 to-red-50/30 dark:from-slate-800/50 dark:to-red-900/10 rounded-2xl p-3 sm:p-4 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-900 dark:text-slate-100">
                    <span className="hidden sm:inline">Report Category</span>
                    <span className="sm:hidden">Category</span>
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3 sm:mb-4 lg:mb-6">
                  <span className="hidden sm:inline">Select the type of report you want to generate and analyze</span>
                  <span className="sm:hidden">Select report type to generate</span>
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                  {reportCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <div
                        key={category.id}
                        className={cn(
                          "p-2 sm:p-3 border rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg group relative overflow-hidden",
                          reportCategory === category.id
                            ? "border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 shadow-lg shadow-red-500/10"
                            : "border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-600 hover:bg-gradient-to-br hover:from-slate-50 hover:to-red-50/30 dark:hover:from-slate-800/50 dark:hover:to-red-900/10"
                        )}
                        onClick={() => setReportCategory(category.id as typeof reportCategory)}
                      >
                        {/* Background gradient overlay */}
                        <div className={cn(
                          "absolute inset-0 opacity-0 transition-opacity duration-300",
                          reportCategory === category.id
                            ? "opacity-100 bg-gradient-to-br from-red-500/5 to-transparent"
                            : "group-hover:opacity-100 bg-gradient-to-br from-red-500/5 to-transparent"
                        )}></div>
                        
                        <div className="relative">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                            <div className={cn(
                              "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm",
                              reportCategory === category.id
                                ? "bg-gradient-to-br from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 shadow-lg shadow-red-500/25"
                                : "bg-slate-100 dark:bg-slate-700 group-hover:bg-gradient-to-br group-hover:from-red-100 group-hover:to-red-200 dark:group-hover:from-red-900/30 dark:group-hover:to-red-800/20"
                            )}>
                              <Icon className={cn(
                                "h-4 w-4 sm:h-5 sm:w-5 transition-colors",
                                reportCategory === category.id
                                  ? "text-white"
                                  : "text-slate-600 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400"
                              )} />
                            </div>
                            <div>
                              <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{category.label}</span>
                              {reportCategory === category.id && (
                                <div className="flex items-center gap-1 mt-1">
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></div>
                                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">Selected</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{category.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download Options */}
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-slate-900 dark:text-slate-100">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-sm sm:text-base lg:text-lg">
                  <span className="hidden sm:inline">Download Options</span>
                  <span className="sm:hidden">Download</span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                <Button
                  onClick={() => downloadReport('json')}
                  disabled={isGenerating}
                  className="flex items-center gap-1 sm:gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Download JSON</span>
                  <span className="sm:hidden">JSON</span>
                </Button>
                <Button
                  onClick={() => downloadReport('csv')}
                  disabled={isGenerating}
                  className="flex items-center gap-1 sm:gap-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-red-300 dark:hover:border-red-600 rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                  variant="outline"
                >
                  <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Download CSV</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
                <Button
                  onClick={() => downloadReport('pdf')}
                  disabled={isGenerating}
                  className="flex items-center gap-1 sm:gap-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-red-300 dark:hover:border-red-600 rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                  variant="outline"
                >
                  <FileImage className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">PDF</span>
                </Button>
              </div>

              {/* Data Source & Testing section removed as requested */}
            </CardContent>
          </Card>
        </div>

        {/* Report Preview */}
        <div>
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-slate-900 dark:text-slate-100">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-sm sm:text-base lg:text-lg">
                  <span className="hidden sm:inline">Report Preview</span>
                  <span className="sm:hidden">Preview</span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">Report Type:</p>
                  <Badge variant="outline" className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">{reportType}</Badge>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">Category:</p>
                  <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 text-xs sm:text-sm">{reportCategory}</Badge>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">Period:</p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    {reportType === 'weekly' 
                      ? `${format(startOfWeek(selectedDate), 'MMM dd')} - ${format(endOfWeek(selectedDate), 'MMM dd, yyyy')}`
                      : `${format(startOfMonth(selectedDate), 'MMM dd')} - ${format(endOfMonth(selectedDate), 'MMM dd, yyyy')}`
                    }
                  </p>
                </div>
                
                {/* Quick Stats Preview */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 sm:pt-4 lg:pt-6">
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 sm:mb-3 lg:mb-4">
                    <span className="hidden sm:inline">Quick Stats:</span>
                    <span className="sm:hidden">Stats:</span>
                  </p>
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    {isLoadingData ? (
                      <div className="text-center py-4 sm:py-6">
                        <div className="relative mx-auto mb-3 sm:mb-4">
                          {/* Outer ring */}
                          <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin border-t-red-600"></div>
                          {/* Inner ring */}
                          <div className="absolute top-1 left-1 w-4 h-4 sm:w-6 sm:h-6 border-4 border-slate-100 dark:border-slate-600 rounded-full animate-spin border-t-red-400" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                          {/* Center dot */}
                          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-600 rounded-full animate-pulse"></div>
                        </div>
                        <span className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">Loading data...</span>
                      </div>
                    ) : reportData ? (
                      <>{renderQuickStats()}</>
                    ) : (
                      <>{renderFallbackStats()}</>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}