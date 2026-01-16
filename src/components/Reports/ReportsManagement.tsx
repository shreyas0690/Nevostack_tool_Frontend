import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  // New state for explicit date range
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load report data when filters change
  useEffect(() => {
    generateReportData();
  }, [dateRange, reportCategory, reportType, currentUser?.companyId]);

  // Component mounted
  useEffect(() => {
    console.log('🚀 ReportsManagement component mounted');
  }, []);

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
        // Return range from 3 months ago to NOW (covering the last 3 months)
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
            range.end.toISOString(),
            currentUser?.companyId
          );
          console.log('📊 Overview data received:', data);
          break;
        case 'tasks':
          console.log('📋 Calling generateTasksReport...');
          data = await reportsService.generateTasksReport(
            reportType,
            range.start.toISOString(),
            range.end.toISOString(),
            currentUser?.companyId
          );
          console.log('📋 Tasks data received:', data);
          break;
        case 'departments':
          console.log('🏢 Calling generateDepartmentsReport...');
          data = await reportsService.generateDepartmentsReport(
            reportType,
            range.start.toISOString(),
            range.end.toISOString(),
            currentUser?.companyId
          );
          console.log('🏢 Departments data received:', data);
          break;
        case 'users':
          console.log('👥 Calling generateUsersReport...');
          data = await reportsService.generateUsersReport(
            reportType,
            range.start.toISOString(),
            range.end.toISOString(),
            currentUser?.companyId
          );
          console.log('👥 Users data received:', data);
          break;
        case 'leave':
          console.log('📅 Calling generateLeaveReport...');
          data = await reportsService.generateLeaveReport(
            reportType,
            range.start.toISOString(),
            range.end.toISOString(),
            currentUser?.companyId
          );
          console.log('📅 Leave data received:', data);
          break;
        default:
          console.log('📊 Calling default generateOverviewReport...');
          data = await reportsService.generateOverviewReport(
            reportType,
            range.start.toISOString(),
            range.end.toISOString(),
            currentUser?.companyId
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

      // Show empty state - no mock data
      setReportData(null);
      return null;
    } finally {
      setIsLoadingData(false);
    }
  };

  const downloadReport = async (fileFormat: 'json' | 'csv' | 'pdf') => {
    setIsGenerating(true);
    try {
      // Use the explicit dateRange state
      const range = dateRange;

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

  const StatCard = ({ label, value, variant = 'default', icon: Icon }: { label: string, value: string | number, variant?: 'default' | 'outline' | 'secondary' | 'destructive', icon?: any }) => {
    const accentClass = variant === 'secondary'
      ? 'bg-blue-500/70'
      : variant === 'destructive'
      ? 'bg-red-500/70'
      : variant === 'outline'
      ? 'bg-slate-400/60'
      : 'bg-red-500/70';

    return (
      <div className={cn(
        "relative overflow-hidden p-4 rounded-xl border transition-all duration-200 flex flex-col items-start gap-3 group shadow-sm hover:shadow-md hover:-translate-y-0.5 h-full",
        variant === 'default' && "bg-white/90 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700",
        variant === 'secondary' && "bg-blue-50/40 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/70",
        variant === 'destructive' && "bg-red-50/40 dark:bg-red-900/10 border-red-100 dark:border-red-800/70",
        variant === 'outline' && "bg-slate-50/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
      )}>
        <div className={cn("absolute inset-x-0 top-0 h-0.5", accentClass)} />
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ring-1 ring-white/70 dark:ring-slate-900/60",
          variant === 'default' && "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-red-100 group-hover:text-red-600 dark:group-hover:bg-red-900/30 dark:group-hover:text-red-400",
          variant === 'secondary' && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
          variant === 'destructive' && "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
          variant === 'outline' && "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
        )}>
          {Icon ? <Icon className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
        </div>

        <div className="w-full">
          <span className={cn(
            "text-xl sm:text-2xl font-bold tracking-tight block break-words",
            variant === 'default' && "text-slate-900 dark:text-slate-100",
            variant === 'secondary' && "text-blue-700 dark:text-blue-300",
            variant === 'destructive' && "text-red-700 dark:text-red-300",
            variant === 'outline' && "text-slate-700 dark:text-slate-300"
          )}>
            {value}
          </span>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 break-words leading-snug">
            {label}
          </p>
        </div>
      </div>
    );
  };

  const renderOverviewStats = (data: OverviewReport) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 auto-rows-fr">
      <StatCard label="Total Tasks" value={data.tasks?.total || 0} icon={ClipboardList} />
      <StatCard label="Completed" value={data.tasks?.completed || 0} variant="secondary" />
      <StatCard label="Total Users" value={data.users?.length || 0} icon={Users} />
      <StatCard label="Departments" value={data.departments?.length || 0} icon={Building2} />
      <StatCard label="Leave Requests" value={data.leave?.total || 0} icon={CalendarDays} />
    </div>
  );

  const renderTasksStats = (data: TasksReport) => {
    const totalTasks = data.total || 0;
    const completedTasks = data.byStatus?.completed || 0;
    const inProgressTasks = data.byStatus?.inProgress || 0;
    const urgentTasks = data.byPriority?.urgent || 0;
    const topPerformersCount = data.topPerformers?.length || 0;

    return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 auto-rows-fr">
        <StatCard label="Total Tasks" value={totalTasks} icon={ClipboardList} />
        <StatCard label="Completed" value={completedTasks} variant="secondary" />
        <StatCard label="In Progress" value={inProgressTasks} variant="outline" />
        <StatCard label="Urgent" value={urgentTasks} variant="destructive" />
        <StatCard label="Top Performers" value={topPerformersCount} icon={TrendingUp} />
      </div>
    );
  };

  const renderDepartmentsStats = (data: DepartmentsReport) => {
    const totalDepartments = data.summary?.totalDepartments || 0;
    const totalMembers = data.summary?.totalMembers || 0;
    const totalTasks = data.summary?.totalTasks || 0;
    const totalCompleted = data.summary?.totalCompleted || 0;
    const averageCompletionRate = data.summary?.averageCompletionRate || 0;

    return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 auto-rows-fr">
        <StatCard label="Departments" value={totalDepartments} icon={Building2} />
        <StatCard label="Total Members" value={totalMembers} icon={Users} />
        <StatCard label="Total Tasks" value={totalTasks} icon={ClipboardList} />
        <StatCard label="Completed" value={totalCompleted} variant="secondary" />
        <StatCard label="Avg Completion" value={`${averageCompletionRate.toFixed(1)}%`} variant="outline" />
      </div>
    );
  };

  const renderUsersStats = (data: UsersReport) => {
    const totalUsers = data.summary?.totalUsers || 0;
    const activeUsers = data.summary?.activeUsers || 0;
    const usersWithTasks = data.summary?.usersWithTasks || 0;
    const totalTasks = data.summary?.totalTasks || 0;
    const averageCompletionRate = data.summary?.averageCompletionRate || 0;

    return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 auto-rows-fr">
        <StatCard label="Total Users" value={totalUsers} icon={Users} />
        <StatCard label="Active Users" value={activeUsers} variant="secondary" />
        <StatCard label="With Tasks" value={usersWithTasks} variant="outline" />
        <StatCard label="Total Tasks" value={totalTasks} icon={ClipboardList} />
        <StatCard label="Avg Completion" value={`${averageCompletionRate.toFixed(1)}%`} variant="outline" />
      </div>
    );
  };

  const renderLeaveStats = (data: LeaveReport) => {
    const totalRequests = data.summary?.total || 0;
    const approved = data.summary?.approved || 0;
    const pending = data.summary?.pending || 0;
    const totalDays = data.summary?.totalDays || 0;
    const topUsersCount = data.topUsers?.length || 0;

    return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 auto-rows-fr">
        <StatCard label="Total Requests" value={totalRequests} icon={CalendarDays} />
        <StatCard label="Approved" value={approved} variant="secondary" />
        <StatCard label="Pending" value={pending} variant="outline" />
        <StatCard label="Total Days" value={totalDays} icon={CalendarIcon} />
        <StatCard label="Top Users" value={topUsersCount} icon={Users} />
      </div>
    );
  };
  const quickDateSelect = (option: string) => {
    const dateOption = quickDateOptions.find(opt => opt.value === option);
    if (dateOption) {
      const range = getDateRange(option);
      setSelectedDate(range.start);
      setDateRange(range);
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
              <CardContent className="p-3 sm:p-4 lg:p-8 space-y-6 sm:space-y-8">
                {/* Quick Date Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                        Time Period
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Select reporting period</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                    {quickDateOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant="outline"
                        onClick={() => quickDateSelect(option.value)}
                        className="h-auto py-2 sm:py-3 flex flex-col gap-1 border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-all duration-200"
                      >
                        <span className="text-xs sm:text-sm font-medium">{option.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Date Selection */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Report Type</label>
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
                        <SelectTrigger className="h-10 sm:h-12 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">📅 Weekly Report</SelectItem>
                          <SelectItem value="monthly">📊 Monthly Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-10 sm:h-12 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50",
                              !selectedDate && "text-slate-500 dark:text-slate-400"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-slate-200 dark:border-slate-700 shadow-xl">
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
                            className="rounded-xl"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Report Category */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                        Report Category
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Choose data source</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {reportCategories.map((category) => {
                      const Icon = category.icon;
                      const isSelected = reportCategory === category.id;
                      return (
                        <div
                          key={category.id}
                          className={cn(
                            "p-3 sm:p-4 border rounded-xl cursor-pointer transition-all duration-200 relative overflow-hidden group",
                            isSelected
                              ? "border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10 shadow-sm"
                              : "border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          )}
                          onClick={() => setReportCategory(category.id as typeof reportCategory)}
                        >
                          <div className="flex items-start gap-3 sm:gap-4 relative z-10">
                            <div className={cn(
                              "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center transition-colors shrink-0",
                              isSelected
                                ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-red-500 dark:group-hover:text-red-400"
                            )}>
                              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-semibold text-sm sm:text-base",
                                  isSelected ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"
                                )}>{category.label}</span>
                                {isSelected && (
                                  <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-[10px] px-1.5 py-0 h-5">
                                    Selected
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                {category.description}
                              </p>
                            </div>
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
              <CardHeader className="p-3 sm:p-4 lg:p-6 pb-0">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                  <Download className="h-4 w-4 text-slate-500" />
                  Export Data
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    onClick={() => downloadReport('json')}
                    disabled={isGenerating}
                    variant="outline"
                    className="h-auto py-3 sm:py-4 flex flex-col gap-2 border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50/50 dark:hover:bg-red-900/10"
                  >
                    <FileText className="h-5 w-5 text-slate-500" />
                    <div className="text-center">
                      <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">JSON</span>
                      <span className="block text-xs text-slate-500">Raw data format</span>
                    </div>
                  </Button>

                  <Button
                    onClick={() => downloadReport('csv')}
                    disabled={isGenerating}
                    variant="outline"
                    className="h-auto py-3 sm:py-4 flex flex-col gap-2 border-slate-200 dark:border-slate-700 hover:border-green-200 dark:hover:border-green-800 hover:bg-green-50/50 dark:hover:bg-green-900/10"
                  >
                    <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-500" />
                    <div className="text-center">
                      <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">CSV</span>
                      <span className="block text-xs text-slate-500">Spreadsheet format</span>
                    </div>
                  </Button>

                  <Button
                    onClick={() => downloadReport('pdf')}
                    disabled={isGenerating}
                    variant="outline"
                    className="h-auto py-3 sm:py-4 flex flex-col gap-2 border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50/50 dark:hover:bg-red-900/10"
                  >
                    <FileImage className="h-5 w-5 text-red-600 dark:text-red-500" />
                    <div className="text-center">
                      <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">PDF</span>
                      <span className="block text-xs text-slate-500">Document format</span>
                    </div>
                  </Button>
                </div>
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
                      {format(dateRange.start, 'MMM dd, yyyy')} - {format(dateRange.end, 'MMM dd, yyyy')}
                    </p>
                  </div>

                  {/* Quick Stats Preview */}
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 flex items-center justify-center shadow-sm shadow-red-500/30">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                          Quick Analysis
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Snapshot for selected period</p>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-gradient-to-br from-white via-white to-red-50/70 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-red-900/20 shadow-sm">
                      <div className="min-h-[200px] p-4 sm:p-5">
                        {isLoadingData ? (
                          <div className="flex flex-col items-center justify-center py-8">
                            <div className="relative mb-4">
                              <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin border-t-red-600"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                              </div>
                            </div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Analyzing data...</p>
                          </div>
                        ) : reportData ? (
                          <div className="space-y-4">
                            {renderQuickStats()}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <BarChart3 className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No Data Available</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try selecting a different date range</p>
                          </div>
                        )}
                      </div>
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
