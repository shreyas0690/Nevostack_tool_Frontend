import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  Users,
  ClipboardList,
  Calendar,
  Target,
  Award,
  Clock,
  PieChart,
  Activity,
  Zap,
  Timer,
  Filter,
  Download
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { mockUsers, mockDepartments, mockTasks } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analyticsService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';

export default function HODAnalytics() {
  const { currentUser } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const currentUserId = currentUser?.id ? String(currentUser.id) : '';
  const shouldExcludeHod = currentUser?.role === 'department_head' && !!currentUserId;

  const getSafeId = (value: any) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object') return String(value.id || value._id || value.userId || '');
    return '';
  };

  const collectAssigneeIds = (value: any): string[] => {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) {
      return value.flatMap(collectAssigneeIds);
    }
    if (typeof value === 'object') {
      const id = getSafeId(value);
      if (id) return [id];
      if (value.email) return [String(value.email)];
      return [];
    }
    return [String(value)];
  };

  const isTaskAssignedToUser = (task: any, userId: string) => {
    if (!userId) return false;
    const ids = [
      ...collectAssigneeIds(task?.assignedTo),
      ...collectAssigneeIds(task?.assignedToList)
    ];
    return ids.some((id) => id === userId);
  };

  // Debounced filters to prevent too many API calls
  const [debouncedTimeRange, setDebouncedTimeRange] = useState(timeRange);
  const [debouncedStatusFilter, setDebouncedStatusFilter] = useState(statusFilter);

  // Debounce time range changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTimeRange(timeRange);
    }, 500);
    return () => clearTimeout(timer);
  }, [timeRange]);

  // Debounce status filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStatusFilter(statusFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [statusFilter]);

  // Fetch HOD analytics data from backend with better caching
  const { data: analyticsResponse, isLoading, isError, error } = useQuery({
    queryKey: ['hod', 'analytics', currentUser?.companyId, currentUser?.departmentId, debouncedTimeRange, debouncedStatusFilter],
    queryFn: async () => {
      try {
        const params: any = { timeRange: debouncedTimeRange, statusFilter: debouncedStatusFilter };
        if (currentUser && currentUser.role !== 'super_admin' && currentUser.companyId) {
          params.companyId = currentUser.companyId;
        }
        if (currentUser?.departmentId) {
          params.departmentId = currentUser.departmentId;
        }
        if (shouldExcludeHod) {
          params.excludeSelf = true;
          params.excludeUserId = currentUserId;
        }
        const res: any = await analyticsService.getHODAnalytics(params);
        return res?.data || null;
      } catch (e) {
        console.error('Failed to fetch HOD analytics:', e);
        return null;
      }
    },
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 2, // Reduced from 5 minutes to 2 minutes for more frequent updates
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch on component mount if data is fresh
    retry: 2, // Retry failed requests 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential backoff
  });

  // Fallback to mock data if backend fails
  const userDepartment = analyticsResponse?.department || (currentUser?.departmentId ?
    mockDepartments.find(d => d.id === currentUser.departmentId) : null);

  const responseMembers = (analyticsResponse as any)?.departmentMembers || (analyticsResponse as any)?.members || [];
  const fallbackMembers = userDepartment ? mockUsers.filter(u => userDepartment.memberIds.includes(u.id)) : [];
  const filteredFallbackMembers = shouldExcludeHod
    ? fallbackMembers.filter(member => getSafeId(member.id) !== currentUserId)
    : fallbackMembers;
  const departmentMembers = Array.isArray(responseMembers) && responseMembers.length > 0
    ? (shouldExcludeHod ? responseMembers.filter((member: any) => getSafeId(member.id || member._id) !== currentUserId) : responseMembers)
    : filteredFallbackMembers;

  const getFilteredTasks = () => {
    const baseTasks = userDepartment ? mockTasks.filter(t => t.departmentId === userDepartment.id) : [];
    let filteredTasks = shouldExcludeHod
      ? baseTasks.filter(task => !isTaskAssignedToUser(task, currentUserId))
      : baseTasks;

    if (timeRange !== 'all') {
      const days = parseInt(timeRange.replace('d', ''));
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filteredTasks = filteredTasks.filter(t => t.createdAt >= cutoffDate);
    }

    if (statusFilter !== 'all') {
      filteredTasks = filteredTasks.filter(t => t.status === statusFilter);
    }

    return filteredTasks;
  };

  const fallbackTasks = getFilteredTasks();

  // Use backend data or calculate from mock data
  const summary = analyticsResponse?.summary;
  const rawRoleData = analyticsResponse?.charts?.roleData;
  const hasHeadInRoleData = Array.isArray(rawRoleData)
    ? rawRoleData.some((entry: any) => String(entry?.name || '').toLowerCase() === 'head' && (entry?.value || 0) > 0)
    : false;
  const shouldAdjustSummaryForHod = shouldExcludeHod && hasHeadInRoleData;
  const totalMembers = summary?.totalMembers ?? departmentMembers.length;
  const activeMembers = summary?.activeMembers ?? departmentMembers.filter(m => m.isActive).length;
  const adjustedTotalMembers = shouldAdjustSummaryForHod ? Math.max(totalMembers - 1, 0) : totalMembers;
  const adjustedActiveMembers = shouldAdjustSummaryForHod ? Math.max(activeMembers - 1, 0) : activeMembers;
  const totalTasks = summary?.totalTasks ?? fallbackTasks.length;
  const completedTasks = summary?.completedTasks ?? fallbackTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = summary?.inProgressTasks ?? fallbackTasks.filter(t => t.status === 'in_progress').length;
  const assignedTasks = summary?.assignedTasks ?? fallbackTasks.filter(t => t.status === 'assigned').length;
  const blockedTasks = summary?.blockedTasks ?? fallbackTasks.filter(t => t.status === 'blocked').length;
  const completionRate = summary?.completionRate ?? (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);
  const avgTasksPerMember = summary?.avgTasksPerMember && !shouldAdjustSummaryForHod
    ? summary.avgTasksPerMember
    : (adjustedTotalMembers > 0 ? Math.round(totalTasks / adjustedTotalMembers) : 0);
  const urgentTasks = summary?.urgentTasks ?? fallbackTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;

  // Chart colors
  const COLORS = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    cyan: '#06B6D4',
    pink: '#EC4899',
    indigo: '#6366F1'
  };

  // Use backend chart data or generate from mock data
  const taskStatusData = analyticsResponse?.charts?.taskStatusData || [
    { name: 'Completed', value: completedTasks, color: COLORS.success },
    { name: 'In Progress', value: inProgressTasks, color: COLORS.primary },
    { name: 'Assigned', value: assignedTasks, color: COLORS.warning },
    { name: 'Blocked', value: blockedTasks, color: COLORS.danger }
  ];

  const priorityData = analyticsResponse?.charts?.priorityData || [
    {
      name: 'Urgent',
      value: fallbackTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
      color: COLORS.danger
    },
    {
      name: 'High',
      value: fallbackTasks.filter(t => t.priority === 'high').length,
      color: COLORS.warning
    },
    {
      name: 'Medium',
      value: fallbackTasks.filter(t => t.priority === 'medium').length,
      color: COLORS.primary
    },
    {
      name: 'Low',
      value: fallbackTasks.filter(t => t.priority === 'low').length,
      color: COLORS.success
    }
  ];

  // Task creation trend data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const taskTrendData = analyticsResponse?.charts?.taskTrendData || last7Days.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const tasksCreated = fallbackTasks.filter(task =>
      task.createdAt.toISOString().split('T')[0] === dateStr
    ).length;
    const tasksCompleted = fallbackTasks.filter(task =>
      task.updatedAt.toISOString().split('T')[0] === dateStr && task.status === 'completed'
    ).length;

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      created: tasksCreated,
      completed: tasksCompleted,
      fullDate: dateStr
    };
  });

  // Team role distribution
  const adjustedRoleDataFromCharts = shouldExcludeHod && Array.isArray(rawRoleData)
    ? rawRoleData
        .map((entry: any) => {
          if (String(entry?.name || '').toLowerCase() === 'head') {
            return { ...entry, value: Math.max((entry?.value || 0) - 1, 0) };
          }
          return entry;
        })
        .filter((entry: any) => (entry?.value || 0) > 0)
    : rawRoleData;

  const roleData = adjustedRoleDataFromCharts || [
    {
      name: 'Head',
      value: departmentMembers.filter(m => m.role === 'department_head').length,
      color: COLORS.purple
    },
    {
      name: 'Managers',
      value: departmentMembers.filter(m => m.role === 'manager').length,
      color: COLORS.primary
    },
    {
      name: 'Members',
      value: departmentMembers.filter(m => m.role === 'member').length,
      color: COLORS.success
    }
  ];

  // Performance metrics over time
  const performanceData = analyticsResponse?.charts?.performanceData || last7Days.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const dayTasks = fallbackTasks.filter(task =>
      task.updatedAt.toISOString().split('T')[0] <= dateStr
    );
    const dayCompleted = dayTasks.filter(t => t.status === 'completed').length;
    const dayTotal = dayTasks.length;
    const efficiency = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      efficiency,
      productivity: Math.min(100, Math.round((dayCompleted / Math.max(1, departmentMembers.length)) * 20)),
      engagement: Math.round((adjustedActiveMembers / Math.max(1, adjustedTotalMembers)) * 100)
    };
  });

  const analytics = [
    {
      title: 'Team Performance',
      value: `${completionRate}%`,
      description: 'Task completion rate',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/50'
    },
    {
      title: 'Total Tasks',
      value: totalTasks,
      description: 'Department tasks',
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50'
    },
    {
      title: 'Active Members',
      value: `${adjustedActiveMembers}/${adjustedTotalMembers}`,
      description: 'Team availability',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50'
    },
    {
      title: 'Completed Tasks',
      value: completedTasks,
      description: 'Successfully finished',
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/50'
    },
    {
      title: 'In Progress',
      value: inProgressTasks,
      description: 'Currently active',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/50'
    },
    {
      title: 'Urgent Tasks',
      value: urgentTasks,
      description: 'High priority items',
      icon: Zap,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50'
    }
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Department Analytics</h1>
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    console.error('HOD Analytics Error:', error);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Department Analytics</h1>
          <p className="text-muted-foreground">
            Performance insights for {userDepartment?.name || 'your'} department
            {(analyticsResponse?.summary || analyticsResponse?.charts) && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Live Data
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d' | 'all') => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {(analyticsResponse?.summary || analyticsResponse?.charts) && (
            <Badge variant="outline" className="px-3 py-1">
              <BarChart3 className="w-4 h-4 mr-2" />
              Live Data
            </Badge>
          )}
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {analytics.map((analytic) => {
          const Icon = analytic.icon;
          return (
            <Card key={analytic.title} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`absolute inset-0 ${analytic.bgColor} opacity-30`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium">
                  {analytic.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${analytic.color}`} />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{analytic.value}</div>
                <p className="text-xs text-muted-foreground">
                  {analytic.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Task Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  dataKey="value"
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Priority Analysis */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Task Priority Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.primary}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Creation vs Completion Trend */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Task Trends (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={taskTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  name="Created"
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke={COLORS.success}
                  strokeWidth={2}
                  name="Completed"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Team Role Distribution */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  dataKey="value"
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>



      {/* Performance Metrics Over Time */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Metrics Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorProductivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="efficiency"
                stroke={COLORS.primary}
                fillOpacity={1}
                fill="url(#colorEfficiency)"
                name="Efficiency %"
              />
              <Area
                type="monotone"
                dataKey="productivity"
                stroke={COLORS.success}
                fillOpacity={1}
                fill="url(#colorProductivity)"
                name="Productivity %"
              />
              <Area
                type="monotone"
                dataKey="engagement"
                stroke={COLORS.warning}
                fillOpacity={1}
                fill="url(#colorEngagement)"
                name="Engagement %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Key Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/50 dark:bg-gray-900/50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900 dark:text-green-100">
                  Completion Rate
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                {completionRate}% task completion rate shows {analyticsResponse?.insights?.completionRate?.status || (completionRate >= 80 ? 'excellent' : completionRate >= 60 ? 'good' : 'needs improvement')} performance.
              </p>
            </div>

            <div className="bg-white/50 dark:bg-gray-900/50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  Team Engagement
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {analyticsResponse?.insights?.teamEngagement?.message || `${Math.round((adjustedActiveMembers / Math.max(1, adjustedTotalMembers)) * 100)}% of team members are actively engaged in current projects.`}
              </p>
            </div>

            <div className="bg-white/50 dark:bg-gray-900/50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-900 dark:text-orange-100">
                  Task Load
                </span>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Average of {avgTasksPerMember} tasks per member indicates {analyticsResponse?.insights?.taskLoad?.status || (avgTasksPerMember <= 3 ? 'optimal' : avgTasksPerMember <= 5 ? 'moderate' : 'high')} workload distribution.
              </p>
            </div>

            <div className="bg-white/50 dark:bg-gray-900/50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-900 dark:text-red-100">
                  Priority Focus
                </span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                {analyticsResponse?.insights?.priorityFocus?.message || `${urgentTasks} high-priority tasks need immediate attention.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
