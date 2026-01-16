import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Clock, AlertCircle,
  Target, Award, BarChart3, PieChart as PieChartIcon,
  LineChart as LineChartIcon, Activity as ActivityIcon
} from 'lucide-react';
import { analyticsService } from '@/services/analyticsService';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function AnalyticsDashboard() {
  const [performancePeriod, setPerformancePeriod] = useState<'week' | 'month' | 'year'>('week');
  // Fixed values for task status distribution
  const taskStatusFilter = 'all';
  const includeOverdue = true;

  // Beautiful Loading Component
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin border-t-red-600"></div>
        {/* Inner ring */}
        <div className="absolute top-2 left-2 w-12 h-12 border-4 border-slate-100 dark:border-slate-600 rounded-full animate-spin border-t-red-400" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        {/* Center dot */}
        <div className="absolute top-6 left-6 w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Loading Analytics</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">Fetching your performance data...</p>
        <div className="flex justify-center space-x-1 mt-4">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
  // Fetch real analytics from backend
  const { data: overviewData, isLoading, error: overviewError } = useQuery({
    queryKey: ['analytics','overview'],
    queryFn: async () => {
      const res: any = await analyticsService.getOverview({});
      return res?.data || null;
    },
    staleTime: 1000 * 60 * 5
  });

  // Fetch task status distribution with filtering
  const { data: taskStatusData, isLoading: taskStatusLoading, error: taskStatusError } = useQuery({
    queryKey: ['analytics', 'task-status-distribution', taskStatusFilter, includeOverdue],
    queryFn: async () => {
      const res: any = await analyticsService.getTaskStatusDistribution({
        statusFilter: taskStatusFilter,
        includeOverdue: includeOverdue,
        excludeOverdue: true // Always exclude overdue from assigned and in-progress counts
      });
      return res?.data || null;
    },
    staleTime: 1000 * 60 * 5
  });

  const formatStatusLabel = (value: string) => {
    if (!value) return 'Unknown';
    return value
      .toString()
      .replace(/[_-]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const normalizeStatus = (value: string) =>
    String(value ?? '')
      .toLowerCase()
      .replace(/[_\s-]+/g, ' ')
      .trim();

  // Process task status data with backend filtering
  const processTaskStatusData = () => {
    // Use backend filtered data if available, otherwise fallback to overview data
    if (taskStatusData && taskStatusData.taskStatusData && Array.isArray(taskStatusData.taskStatusData)) {
      return taskStatusData.taskStatusData.map((item: any) => ({
        name: formatStatusLabel(item.name),
        value: item.value,
        color: item.color || (normalizeStatus(item.name) === 'completed' ? '#22c55e' : 
                              normalizeStatus(item.name) === 'in progress' ? '#3b82f6' : 
                              normalizeStatus(item.name) === 'assigned' ? '#f59e0b' : 
                              normalizeStatus(item.name) === 'overdue' ? '#dc2626' : '#ef4444')
      }));
    }
    
    // Fallback to overview data if backend filtering is not available
    if (!overviewData?.tasksByStatus) return [];
    
    let filteredData = Object.entries(overviewData.tasksByStatus).map(([k, v]) => ({ 
      name: formatStatusLabel(k), 
      value: v as number, 
      color: normalizeStatus(k) === 'completed' ? '#22c55e' : normalizeStatus(k) === 'in progress' ? '#3b82f6' : normalizeStatus(k) === 'assigned' ? '#f59e0b' : '#ef4444' 
    }));
    
    // Apply status filter
    const normalizedFilter = normalizeStatus(taskStatusFilter);
    if (normalizedFilter !== 'all') {
      filteredData = filteredData.filter(item => normalizeStatus(item.name) === normalizedFilter);
    }
    
    // Add overdue tasks if requested
    if (includeOverdue && overviewData.overdue) {
      const hasOverdue = filteredData.some(item => normalizeStatus(item.name) === 'overdue');
      if (!hasOverdue) {
        filteredData.push({
          name: formatStatusLabel('overdue'),
          value: overviewData.overdue,
          color: '#dc2626'
        });
      }
    }
    
    return filteredData;
  };

  const tasksByStatus = processTaskStatusData();

  // Prefer backend priority breakdown if provided
  const tasksByPriority = overviewData && overviewData.tasksByPriority
    ? Object.entries(overviewData.tasksByPriority).map(([k, v]) => ({ name: k, value: v as number, color: k === 'low' ? '#6b7280' : k === 'medium' ? '#f59e0b' : k === 'high' ? '#f97316' : '#dc2626' }))
    : [];

  // Department Performance - Sorted by ranking (completion rate)
  // use only backend data; do not fall back to mock data
  const departmentData = overviewData && Array.isArray(overviewData.byDepartment)
    ? (overviewData.byDepartment as any[]).map(d => ({
        name: d.name || d.departmentName || (d.departmentId ? String(d.departmentId) : '—'),
        totalTasks: d.total || d.count || 0,
        completedTasks: d.completed || 0,
        // show integer percentage (no long decimal tails)
        completionRate: d.completionRate ? Math.round(Number(d.completionRate)) : 0,
        members: d.members || 0
      })).sort((a, b) => {
        // Sort by completion rate (descending) - highest first for ranking
        if (b.completionRate !== a.completionRate) {
          return b.completionRate - a.completionRate;
        }
        // If completion rate is same, sort by completed tasks (descending)
        if (b.completedTasks !== a.completedTasks) {
          return b.completedTasks - a.completedTasks;
        }
        // If both are same, sort by total tasks (descending)
        return b.totalTasks - a.totalTasks;
      })
    : [];

  // User Performance - Sorted by ranking (completion rate)
  // Top performers: prefer backend `topPerformers` if provided
  const userPerformance = overviewData && Array.isArray(overviewData.topPerformers)
    ? (overviewData.topPerformers as any[]).map((p, idx) => ({
        name: p.user?.name || `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim() || `User ${idx+1}`,
        totalTasks: p.total || p.totalTasks || 0,
        completedTasks: p.completed || 0,
        // show integer percentage (no fractional digits)
        completionRate: Number.isFinite(p.completionRate) ? Math.round(Number(p.completionRate)) : Math.round((p.completionRate || 0)),
        department: p.departmentName || 'Unknown'
      })).sort((a, b) => {
        // Sort by completion rate (descending) - highest first for ranking
        if (b.completionRate !== a.completionRate) {
          return b.completionRate - a.completionRate;
        }
        // If completion rate is same, sort by completed tasks (descending)
        if (b.completedTasks !== a.completedTasks) {
          return b.completedTasks - a.completedTasks;
        }
        // If both are same, sort by total tasks (descending)
        return b.totalTasks - a.totalTasks;
      })
    : [];

  // Fetch tasks timeseries for Performance Trend when possible
  const { data: tasksSeries, isLoading: tasksSeriesLoading, error: tasksSeriesError } = useQuery({
    queryKey: ['analytics','tasksSeries', performancePeriod],
    queryFn: async () => {
      // map performancePeriod to groupBy
      const groupBy = performancePeriod === 'week' ? 'day' : performancePeriod === 'month' ? 'day' : 'month';
      const res: any = await analyticsService.getTasksTimeseries({ groupBy });
      return res?.data || [];
    },
    enabled: true,
    staleTime: 1000 * 60 * 5
  });

  // Map backend timeseries (expects { date, total, completed }) into chart shape
  const trendData = tasksSeries && tasksSeries.length > 0
    ? tasksSeries.map((r: any) => ({ period: new Date(r.date).toLocaleDateString(), tasks: r.total || r.count || 0, completed: r.completed || 0 }))
    : [];

  // Key Metrics
  // Key metrics derived from backend overview when available
  const totalTasksCount = overviewData?.totalTasks || 0;
  const completedCount = overviewData?.tasksByStatus?.completed || 0;
  // Use backend-provided completion rate if available, otherwise compute
  const totalCompletionRate = overviewData?.completionRate ? Math.round(Number(overviewData.completionRate)) : (totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0);
  const avgTasksPerUser = overviewData?.avgTasksPerUser ? Math.round(Number(overviewData.avgTasksPerUser)) : (overviewData?.usersCount && overviewData.usersCount > 0 ? Math.round(totalTasksCount / overviewData.usersCount) : 0);
  // Calculate urgent tasks that are not overdue, blocked, or completed
  const urgentTasks = (() => {
    if (overviewData?.tasksList?.length > 0) {
      return overviewData.tasksList.filter(task => 
        (task.priority === 'urgent' || task.priority === 'high') &&
        task.status !== 'completed' &&
        task.status !== 'blocked' &&
        (!task.dueDate || new Date(task.dueDate) >= new Date())
      ).length;
    }
    return overviewData?.tasksByPriority?.urgent || overviewData?.urgentTasks || 0;
  })();
  const overdueTasks = overviewData?.overdue || 0;

  type KeyMetric = {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    change?: string | null;
    trend?: 'up' | 'down';
  };

  const keyMetrics: KeyMetric[] = [
    {
      title: 'Overall Completion Rate',
      value: `${totalCompletionRate}%`,
      icon: Target,
      color: 'text-green-600'
    },
    {
      title: 'Avg Tasks per User',
      value: avgTasksPerUser,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Urgent Tasks',
      value: urgentTasks,
      icon: AlertCircle,
      color: 'text-red-600'
    },
    {
      title: 'Overdue Tasks',
      value: overdueTasks,
      icon: Clock,
      color: 'text-orange-600'
    }
  ];

  // Show loading state
  if (isLoading || taskStatusLoading) {
    return <LoadingSpinner />;
  }

  const hasErrors = Boolean(overviewError) || Boolean(taskStatusError) || Boolean(tasksSeriesError);
  const showErrorState = (Boolean(overviewError) || Boolean(taskStatusError)) && !overviewData && !taskStatusData;

  if (showErrorState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Analytics load failed</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Please try again or check your connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent rounded-xl"></div>
        <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
                <span className="hidden sm:inline">Analytics Dashboard</span>
                <span className="sm:hidden">Analytics</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                <span className="hidden sm:inline">Comprehensive insights into team performance and productivity</span>
                <span className="sm:hidden">Team performance and productivity</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {hasErrors && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/20 p-3 sm:p-4 text-amber-900 dark:text-amber-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p className="text-xs sm:text-sm">Analytics data could not be fully loaded. Some charts may be incomplete.</p>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map((metric) => {
          const Icon = metric.icon;
          const hasChange = metric.change != null && metric.trend != null;
          const TrendIcon = metric.trend === 'down' ? TrendingDown : TrendingUp;
          return (
            <Card key={metric.title} className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {metric.title}
                </CardTitle>
                <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Icon className={`h-4 w-4 text-red-600 dark:text-red-400`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{metric.value}</div>
                {hasChange && (
                  <div className="flex items-center text-xs text-slate-600 dark:text-slate-400 mt-1">
                    <TrendIcon className={`h-3 w-3 mr-1 ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                    {metric.change} from last month
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400">Overview</TabsTrigger>
          <TabsTrigger value="departments" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400">Departments</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Status Distribution */}
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-6">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm sm:text-base lg:text-lg">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <PieChartIcon className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="hidden sm:inline">Task Status Distribution</span>
                  <span className="sm:hidden">Task Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="h-56 sm:h-[300px]">
                  {tasksByStatus.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      No status data available.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tasksByStatus}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={45}
                          outerRadius={90}
                          paddingAngle={2}
                        >
                          {tasksByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={32}
                          wrapperStyle={{ fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-6">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm sm:text-base lg:text-lg">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="hidden sm:inline">Task Priority Distribution</span>
                  <span className="sm:hidden">Priority Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="h-56 sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tasksByPriority}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]}>
                      {tasksByPriority.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Performance Trend */}
            <Card className="lg:col-span-2 border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-6">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm sm:text-base lg:text-lg">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <LineChartIcon className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="hidden sm:inline">Performance Trend</span>
                    <span className="sm:hidden">Trend</span>
                  </CardTitle>
                <div className="flex gap-1.5 sm:gap-2">
                  <Button
                    variant={performancePeriod === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPerformancePeriod('week')}
                    className={performancePeriod === 'week' ? 'bg-red-600 hover:bg-red-700 text-white h-8 px-3' : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 h-8 px-3'}
                  >
                    1 Week
                  </Button>
                  <Button
                    variant={performancePeriod === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPerformancePeriod('month')}
                    className={performancePeriod === 'month' ? 'bg-red-600 hover:bg-red-700 text-white h-8 px-3' : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 h-8 px-3'}
                  >
                    1 Month
                  </Button>
                  <Button
                    variant={performancePeriod === 'year' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPerformancePeriod('year')}
                    className={performancePeriod === 'year' ? 'bg-red-600 hover:bg-red-700 text-white h-8 px-3' : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 h-8 px-3'}
                  >
                    1 Year
                  </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="h-56 sm:h-[300px]">
                  {tasksSeriesLoading ? (
                    <div className="flex h-full items-center justify-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Loading trend data...
                    </div>
                  ) : trendData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      No trend data available for this period.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Area type="monotone" dataKey="tasks" stackId="1" stroke="#ef4444" fill="#ef4444" name="Total Tasks" />
                        <Area type="monotone" dataKey="completed" stackId="1" stroke="#10b981" fill="#10b981" name="Completed Tasks" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          {/* Department Performance Chart */}
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm sm:text-base lg:text-lg">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="hidden sm:inline">Department Performance Comparison</span>
                <span className="sm:hidden">Dept Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="h-64 sm:h-80 lg:h-[500px] xl:h-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }} className="sm:margin={{ top: 20, right: 30, left: 20, bottom: 5 }}">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                      tick={{ fontSize: 10 }}
                      className="sm:tick={{ fontSize: 12 }}"
                    angle={-45}
                    textAnchor="end"
                      height={60}
                      className="sm:height={80}"
                  />
                    <YAxis tick={{ fontSize: 10 }} className="sm:tick={{ fontSize: 12 }}" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="totalTasks" 
                    fill="#ef4444" 
                    name="Total Tasks"
                      radius={[2, 2, 0, 0]}
                      className="sm:radius={[4, 4, 0, 0]}"
                  />
                  <Bar 
                    dataKey="completedTasks" 
                    fill="#10b981" 
                    name="Completed Tasks"
                      radius={[2, 2, 0, 0]}
                      className="sm:radius={[4, 4, 0, 0]}"
                  />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Department Performance Table */}
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm sm:text-base lg:text-lg">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <ActivityIcon className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="hidden sm:inline">Detailed Department Metrics</span>
                <span className="sm:hidden">Dept Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left p-3 font-semibold text-slate-900 dark:text-slate-100">Rank</th>
                      <th className="text-left p-3 font-semibold text-slate-900 dark:text-slate-100">Department</th>
                      <th className="text-center p-3 font-semibold text-slate-900 dark:text-slate-100">Members</th>
                      <th className="text-center p-3 font-semibold text-slate-900 dark:text-slate-100">Total Tasks</th>
                      <th className="text-center p-3 font-semibold text-slate-900 dark:text-slate-100">Completed</th>
                      <th className="text-center p-3 font-semibold text-slate-900 dark:text-slate-100">Pending</th>
                      <th className="text-center p-3 font-semibold text-slate-900 dark:text-slate-100">Completion Rate</th>
                      <th className="text-center p-3 font-semibold text-slate-900 dark:text-slate-100">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentData.map((dept, index) => {
                      const performanceLevel = dept.completionRate >= 80 ? 'Excellent' : 
                                              dept.completionRate >= 60 ? 'Good' : 'Needs Improvement';
                      const performanceColor = dept.completionRate >= 80 ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20' : 
                                              dept.completionRate >= 60 ? 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20' : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20';
                      const rankColor = index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-red-500';
                      
                      return (
                        <tr key={dept.name} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 ${rankColor} text-white rounded-full text-xs font-bold flex items-center justify-center`}>
                                {index + 1}
                              </div>
                              {index < 3 && <Award className="h-4 w-4 text-yellow-500" />}
                            </div>
                          </td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{dept.name}</td>
                          <td className="p-3 text-center text-slate-700 dark:text-slate-300">{dept.members}</td>
                          <td className="p-3 text-center font-semibold text-red-600 dark:text-red-400">{dept.totalTasks}</td>
                          <td className="p-3 text-center font-semibold text-green-600 dark:text-green-400">{dept.completedTasks}</td>
                          <td className="p-3 text-center font-semibold text-orange-600 dark:text-orange-400">{dept.totalTasks - dept.completedTasks}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">{dept.completionRate}%</span>
                              <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    dept.completionRate >= 80 ? 'bg-green-500' : 
                                    dept.completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(dept.completionRate, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Badge className={`${performanceColor} border-0 font-medium`}>
                              {performanceLevel}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-3">
                {departmentData.map((dept, index) => {
                  const performanceLevel = dept.completionRate >= 80 ? 'Excellent' : 
                                          dept.completionRate >= 60 ? 'Good' : 'Needs Improvement';
                  const performanceColor = dept.completionRate >= 80 ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20' : 
                                          dept.completionRate >= 60 ? 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20' : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20';
                  const rankColor = index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-red-500';
                  
                  return (
                    <div key={dept.name} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:shadow-sm transition-shadow">
                      {/* Header with Rank and Department */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 ${rankColor} text-white rounded-full text-xs font-bold flex items-center justify-center`}>
                            {index + 1}
                          </div>
                          {index < 3 && <Award className="h-4 w-4 text-yellow-500" />}
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{dept.name}</h3>
                        </div>
                        <Badge className={`${performanceColor} border-0 font-medium text-xs`}>
                          {performanceLevel}
                        </Badge>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Tasks</div>
                          <div className="font-semibold text-red-600 dark:text-red-400 text-sm">{dept.totalTasks}</div>
                        </div>
                        <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Completed</div>
                          <div className="font-semibold text-green-600 dark:text-green-400 text-sm">{dept.completedTasks}</div>
                        </div>
                        <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Pending</div>
                          <div className="font-semibold text-orange-600 dark:text-orange-400 text-sm">{dept.totalTasks - dept.completedTasks}</div>
                        </div>
                        <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Members</div>
                          <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{dept.members}</div>
                        </div>
                      </div>

                      {/* Completion Rate */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-600 dark:text-slate-400">Completion Rate</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{dept.completionRate}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              dept.completionRate >= 80 ? 'bg-green-500' : 
                              dept.completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(dept.completionRate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* User Performance Table */}
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm sm:text-base lg:text-lg">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <ActivityIcon className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="hidden sm:inline">Detailed User Metrics</span>
                <span className="sm:hidden">User Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left p-3 font-semibold text-slate-900 dark:text-slate-100">Rank</th>
                      <th className="text-left p-3 font-semibold text-slate-900 dark:text-slate-100">User</th>
                      <th className="text-center p-3 font-semibold text-slate-900 dark:text-slate-100">Department</th>
                      <th className="text-center p-3 font-semibold text-slate-900 dark:text-slate-100">Total Tasks</th>
                      <th className="text-center p-3 font-semibold text-slate-900 dark:text-slate-100">Completed</th>
                      <th className="text-center p-3 font-semibold text-slate-900 dark:text-slate-100">Pending</th>
                      <th className="text-center p-3 font-semibold text-slate-900 dark:text-slate-100">Completion Rate</th>
                      <th className="text-center p-3 font-semibold text-slate-900 dark:text-slate-100">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userPerformance.slice(0, 15).map((user, index) => {
                      const performanceLevel = user.completionRate >= 90 ? 'Excellent' : 
                                              user.completionRate >= 70 ? 'Good' : 'Needs Improvement';
                      const performanceColor = user.completionRate >= 90 ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20' : 
                                              user.completionRate >= 70 ? 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20' : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20';
                      const rankColor = index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-red-500';
                      
                      return (
                        <tr key={user.name} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 ${rankColor} text-white rounded-full text-xs font-bold flex items-center justify-center`}>
                        {index + 1}
                      </div>
                              {index < 3 && <Award className="h-4 w-4 text-yellow-500" />}
                            </div>
                          </td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{user.name}</td>
                          <td className="p-3 text-center text-sm text-slate-600 dark:text-slate-400">{user.department}</td>
                          <td className="p-3 text-center font-semibold text-red-600 dark:text-red-400">{user.totalTasks}</td>
                          <td className="p-3 text-center font-semibold text-green-600 dark:text-green-400">{user.completedTasks}</td>
                          <td className="p-3 text-center font-semibold text-orange-600 dark:text-orange-400">{user.totalTasks - user.completedTasks}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">{user.completionRate}%</span>
                              <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    user.completionRate >= 90 ? 'bg-green-500' : 
                                    user.completionRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(user.completionRate, 100)}%` }}
                                ></div>
                      </div>
                    </div>
                          </td>
                          <td className="p-3 text-center">
                            <Badge className={`${performanceColor} border-0 font-medium`}>
                              {performanceLevel}
                      </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-3">
                {userPerformance.slice(0, 15).map((user, index) => {
                  const performanceLevel = user.completionRate >= 90 ? 'Excellent' : 
                                          user.completionRate >= 70 ? 'Good' : 'Needs Improvement';
                  const performanceColor = user.completionRate >= 90 ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20' : 
                                          user.completionRate >= 70 ? 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20' : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20';
                  const rankColor = index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-red-500';
                  
                  return (
                    <div key={user.name} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:shadow-sm transition-shadow">
                      {/* Header with Rank and User */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 ${rankColor} text-white rounded-full text-xs font-bold flex items-center justify-center`}>
                            {index + 1}
                          </div>
                          {index < 3 && <Award className="h-4 w-4 text-yellow-500" />}
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{user.name}</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{user.department}</p>
                          </div>
                        </div>
                        <Badge className={`${performanceColor} border-0 font-medium text-xs`}>
                          {performanceLevel}
                        </Badge>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Tasks</div>
                          <div className="font-semibold text-red-600 dark:text-red-400 text-sm">{user.totalTasks}</div>
                        </div>
                        <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Completed</div>
                          <div className="font-semibold text-green-600 dark:text-green-400 text-sm">{user.completedTasks}</div>
                        </div>
                        <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Pending</div>
                          <div className="font-semibold text-orange-600 dark:text-orange-400 text-sm">{user.totalTasks - user.completedTasks}</div>
                        </div>
                        <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Rate</div>
                          <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{user.completionRate}%</div>
                        </div>
                      </div>

                      {/* Completion Rate Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-600 dark:text-slate-400">Completion Rate</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{user.completionRate}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              user.completionRate >= 90 ? 'bg-green-500' : 
                              user.completionRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(user.completionRate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* User Performance Chart - Hidden on Small Devices */}
          <Card className="hidden lg:block border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                User Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={userPerformance.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="totalTasks" 
                    fill="#ef4444" 
                    name="Total Tasks"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="completedTasks" 
                    fill="#10b981" 
                    name="Completed Tasks"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Analysis tab removed per request */}
      </Tabs>
    </div>
  );
}
