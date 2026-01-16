import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import {
  Users, Building2, ClipboardList, TrendingUp, TrendingDown,
  Activity, Award, Target, Zap, Clock, CheckCircle2, AlertCircle,
  Calendar, Eye, Download, Filter, RefreshCcw, ArrowUpRight,
  ArrowDownRight, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Crown, Timer
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analyticsService';
import { usersService } from '@/services/usersService';
import { useAuth } from '@/components/Auth/AuthProvider';

export default function DashboardOverview() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [viewMode, setViewMode] = useState<'overview' | 'analytics' | 'performance'>('overview');
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 5;
  const [departmentPage, setDepartmentPage] = useState(1);
  const departmentsPerPage = 5;

  // Auto refresh is now handled by React Query's refetchInterval
  // No need for manual refreshTime updates

  // Fetch backend analytics overview and calculate advanced metrics
  const { currentUser } = useAuth();

  const { data: overviewData, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['analytics', 'overview', timeRange, currentUser?.companyId],
    queryFn: async () => {
      try {
        const params: any = { timeRange };
        // For non super-admin users, request company-scoped data
        if (currentUser && currentUser.role !== 'super_admin' && currentUser.companyId) {
          params.companyId = currentUser.companyId;
        }
        const res: any = await analyticsService.getOverview(params);
        return res?.data || null;
      } catch (e) {
        return null;
      }
    },
    enabled: !!currentUser, // wait for auth initialization
    staleTime: 1000 * 2, // Consider data fresh for 2 seconds
    refetchInterval: liveUpdatesEnabled ? 30000 : false, // Refetch every 30 seconds when live updates enabled
    refetchIntervalInBackground: false, // Don't refetch in background to improve performance
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true // Always refetch on component mount
  });

  // Fetch company-scoped user stats to ensure totalEmployees is correct
  const { data: userStatsData, isLoading: isUserStatsLoading } = useQuery({
    queryKey: ['users', 'stats', currentUser?.companyId],
    queryFn: async () => {
      try {
        const params: any = {};
        if (currentUser && currentUser.role !== 'super_admin' && currentUser.companyId) params.companyId = currentUser.companyId;
        const res: any = await usersService.getStats(params);
        return res?.stats || null;
      } catch (e) {
        return null;
      }
    },
    enabled: !!currentUser,
    staleTime: 1000 * 2, // Consider data fresh for 2 seconds
    refetchInterval: liveUpdatesEnabled ? 30000 : false, // Refetch every 30 seconds when live updates enabled
    refetchIntervalInBackground: false, // Don't refetch in background to improve performance
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true // Always refetch on component mount
  });

  // Fetch active tasks (recent, in-progress, not overdue)
  const { data: activeTasksData, isLoading: isActiveTasksLoading } = useQuery({
    queryKey: ['analytics', 'active-tasks', currentUser?.companyId],
    queryFn: async () => {
      try {
        const params: any = {};
        if (currentUser && currentUser.role !== 'super_admin' && currentUser.companyId) {
          params.companyId = currentUser.companyId;
        }
        const res: any = await analyticsService.getActiveTasks(params);
        return res?.data || null;
      } catch (e) {
        return null;
      }
    },
    enabled: !!currentUser,
    staleTime: 1000 * 2, // Consider data fresh for 2 seconds
    refetchInterval: liveUpdatesEnabled ? 30000 : false, // Refetch every 30 seconds when live updates enabled
    refetchIntervalInBackground: false, // Don't refetch in background to improve performance
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true // Always refetch on component mount
  });

  // Fetch task status distribution with backend filtering
  const { data: taskStatusDistributionData, isLoading: isTaskStatusLoading } = useQuery({
    queryKey: ['analytics', 'task-status-distribution', currentUser?.companyId],
    queryFn: async () => {
      try {
        const params: any = {
          statusFilter: 'all',
          excludeOverdue: true, // Always exclude overdue from assigned and in-progress counts
          includeOverdue: true
        };
        if (currentUser && currentUser.role !== 'super_admin' && currentUser.companyId) {
          params.companyId = currentUser.companyId;
        }
        const res: any = await analyticsService.getTaskStatusDistribution(params);
        return res?.data || null;
      } catch (e) {
        return null;
      }
    },
    enabled: !!currentUser,
    staleTime: 1000 * 2, // Consider data fresh for 2 seconds
    refetchInterval: liveUpdatesEnabled ? 30000 : false, // Refetch every 30 seconds when live updates enabled
    refetchIntervalInBackground: false, // Don't refetch in background to improve performance
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true // Always refetch on component mount
  });

  const totalUsers = Number(userStatsData?.total ?? overviewData?.usersCount ?? 0);
  const totalDepartments = overviewData?.byDepartment ? overviewData.byDepartment.length : 0;
  const totalTasks = overviewData?.totalTasks ?? 0;
  const completedTasks = Number(overviewData?.tasksByStatus?.completed ?? 0);
  // Use active tasks data for in-progress count instead of all in-progress tasks
  const inProgressTasks = Number(activeTasksData?.total ?? overviewData?.tasksByStatus?.in_progress ?? overviewData?.tasksByStatus?.['in progress'] ?? 0);
  const blockedTasks = overviewData?.tasksByStatus?.blocked ?? 0;
  const normalizeTaskStatus = (value: any) =>
    String(value ?? '')
      .toLowerCase()
      .replace(/[_\s-]+/g, ' ')
      .trim();
  const normalizePriority = (value: any) => String(value ?? '').toLowerCase().trim();
  const getEndOfDay = (date: Date) => (
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
  );
  const resolveDueDate = (value: any) => {
    if (!value) return null;
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return null;
      if (value.getHours() === 0 && value.getMinutes() === 0 && value.getSeconds() === 0 && value.getMilliseconds() === 0) {
        return getEndOfDay(value);
      }
      return new Date(value.getTime());
    }

    if (typeof value === 'string') {
      const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateOnlyMatch) {
        const year = Number(dateOnlyMatch[1]);
        const month = Number(dateOnlyMatch[2]) - 1;
        const day = Number(dateOnlyMatch[3]);
        return new Date(year, month, day, 23, 59, 59, 999);
      }

      const midnightMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})T00:00(?::00(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?$/);
      if (midnightMatch) {
        const year = Number(midnightMatch[1]);
        const month = Number(midnightMatch[2]) - 1;
        const day = Number(midnightMatch[3]);
        return new Date(year, month, day, 23, 59, 59, 999);
      }

      const parsed = new Date(value);
      if (isNaN(parsed.getTime())) return null;
      if (parsed.getHours() === 0 && parsed.getMinutes() === 0 && parsed.getSeconds() === 0 && parsed.getMilliseconds() === 0) {
        return getEndOfDay(parsed);
      }
      return parsed;
    }

    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return null;
    if (parsed.getHours() === 0 && parsed.getMinutes() === 0 && parsed.getSeconds() === 0 && parsed.getMilliseconds() === 0) {
      return getEndOfDay(parsed);
    }
    return parsed;
  };
  const isTaskOverdue = (task: any) => {
    const due = resolveDueDate(task?.dueDate);
    return !!due && due.getTime() < Date.now();
  };
  // Calculate urgent tasks that are not overdue, blocked, or completed
  const urgentTasks = (() => {
    // First try to get from backend data if available
    if (activeTasksData?.tasks?.length > 0) {
      return activeTasksData.tasks.filter(task =>
        (normalizePriority(task.priority) === 'urgent' || normalizePriority(task.priority) === 'high') &&
        normalizeTaskStatus(task.status) !== 'completed' &&
        normalizeTaskStatus(task.status) !== 'blocked' &&
        !isTaskOverdue(task)
      ).length;
    }

    // Fallback to overview data with proper filtering
    if (overviewData?.tasksList?.length > 0) {
      return overviewData.tasksList.filter(task =>
        (normalizePriority(task.priority) === 'urgent' || normalizePriority(task.priority) === 'high') &&
        normalizeTaskStatus(task.status) !== 'completed' &&
        normalizeTaskStatus(task.status) !== 'blocked' &&
        !isTaskOverdue(task)
      ).length;
    }

    return 0;
  })();

  // Calculate time-based metrics
  const overdueTasks = overviewData?.overdue ?? 0;
  const todayTasks = overviewData?.todayTasks ?? 0;

  // Performance metrics
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activeEmployees = userStatsData?.active ?? 0;
  const pendingLeaves = Number(overviewData?.leavesByStatus?.pending ?? 0);
  const approvedLeaves = overviewData?.leavesByStatus?.approved ?? 0;

  // Productivity score calculation - handle division by zero and NaN cases
  const productivityScore = (() => {
    try {
      const completionComponent = completionRate * 0.4;
      const attendanceComponent = totalUsers > 0 ? ((totalUsers - pendingLeaves) / totalUsers * 100 * 0.3) : 0;
      const timelinessComponent = totalTasks > 0 ? (Math.max(0, 100 - (overdueTasks / totalTasks) * 100) * 0.3) : 0;

      const score = completionComponent + attendanceComponent + timelinessComponent;

      // Return 0 if score is NaN, Infinity, or negative
      return isNaN(score) || !isFinite(score) || score < 0 ? 0 : Math.round(score);
    } catch (error) {
      return 0;
    }
  })();

  const stats = [
    {
      title: 'Total Employees',
      value: totalUsers,
      previousValue: totalUsers - 2,
      icon: Users,
      description: `${activeEmployees} active employees`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      trend: totalUsers > (totalUsers - 2) ? 'up' : 'down',
      trendValue: '+2.3%'
    },
    {
      title: 'Departments',
      value: totalDepartments,
      previousValue: totalDepartments,
      icon: Building2,
      description: 'Active departments',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/50',
      trend: 'up',
      trendValue: '0%'
    },
    {
      title: 'Task Completion',
      value: `${completionRate}%`,
      previousValue: completionRate - 5,
      icon: Target,
      description: `${completedTasks}/${totalTasks} completed`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
      trend: completionRate > (completionRate - 5) ? 'up' : 'down',
      trendValue: '+5.2%'
    },
    {
      title: 'Productivity Score',
      value: `${productivityScore}%`,
      previousValue: Math.max(0, productivityScore - 3),
      icon: Award,
      description: 'Overall performance',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/50',
      trend: productivityScore > Math.max(0, productivityScore - 3) ? 'up' : 'down',
      trendValue: '+3.1%'
    },
    {
      title: 'Active Tasks',
      value: inProgressTasks,
      previousValue: inProgressTasks + 3,
      icon: Activity,
      description: 'Currently in progress',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      trend: inProgressTasks < (inProgressTasks + 3) ? 'down' : 'up',
      trendValue: '-12.5%'
    },
    {
      title: 'Urgent Tasks',
      value: urgentTasks,
      previousValue: urgentTasks + 2,
      icon: Zap,
      description: 'Need immediate attention',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50',
      trend: urgentTasks < (urgentTasks + 2) ? 'down' : 'up',
      trendValue: '-25%'
    },
    {
      title: 'Overdue Tasks',
      value: overdueTasks,
      previousValue: overdueTasks + 1,
      icon: Timer,
      description: 'Past deadline',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50',
      trend: overdueTasks < (overdueTasks + 1) ? 'down' : 'up',
      trendValue: '-33%'
    },
    {
      title: 'Leave Requests',
      value: pendingLeaves,
      previousValue: pendingLeaves + 1,
      icon: Calendar,
      description: 'Pending approval',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/50',
      trend: pendingLeaves < (pendingLeaves + 1) ? 'down' : 'up',
      trendValue: '-20%'
    }
  ];

  const normalizeStatus = (value: string) =>
    String(value ?? '')
      .toLowerCase()
      .replace(/[_\s-]+/g, ' ')
      .trim();

  const overdueFallbackValue = Number(overviewData?.overdue ?? overviewData?.tasksByStatus?.overdue ?? 0);

  // Chart data - use backend filtered data if available, otherwise use overview data
  const taskStatusData = (() => {
    if (taskStatusDistributionData && taskStatusDistributionData.taskStatusData && Array.isArray(taskStatusDistributionData.taskStatusData)) {
      const mapped = taskStatusDistributionData.taskStatusData.map((item: any) => ({
        name: item.name,
        value: item.value,
        color: item.color || (normalizeStatus(item.name) === 'completed' ? '#22c55e' :
          normalizeStatus(item.name) === 'in progress' ? '#3b82f6' :
            normalizeStatus(item.name) === 'assigned' ? '#f59e0b' :
              normalizeStatus(item.name) === 'overdue' ? '#dc2626' : '#ef4444')
      }));

      const hasOverdue = mapped.some((item: any) => normalizeStatus(item.name) === 'overdue');
      if (!hasOverdue && overdueFallbackValue > 0) {
        mapped.push({ name: 'Overdue', value: overdueFallbackValue, color: '#dc2626' });
      }

      return mapped;
    }

    if (overviewData) {
      const fallback = [
        { name: 'Completed', value: completedTasks, color: '#22c55e' },
        { name: 'In Progress', value: inProgressTasks, color: '#3b82f6' },
        { name: 'Assigned', value: overviewData?.tasksByStatus?.assigned ?? 0, color: '#f59e0b' },
        { name: 'Blocked', value: blockedTasks, color: '#ef4444' }
      ];

      if (overdueFallbackValue > 0) {
        fallback.push({ name: 'Overdue', value: overdueFallbackValue, color: '#dc2626' });
      }

      return fallback;
    }

    return [];
  })();

  // Time range helper
  const getCutoffDate = () => {
    if (timeRange === 'all') return null;
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);
    return cutoff;
  };

  const cutoffDate = getCutoffDate();
  const tasksForRange = cutoffDate
    ? (overviewData?.tasksList || []).filter((t: any) => new Date(t.createdAt) >= cutoffDate)
    : (overviewData?.tasksList || []);

  const departmentPerformance = overviewData?.byDepartment
    ? overviewData.byDepartment.map((d: any) => ({
      name: d.name && d.name.length > 8 ? d.name.substring(0, 8) + '...' : (d.name || d.departmentName || d.departmentId),
      fullName: d.name || d.departmentName || d.departmentId,
      completed: d.completed || d.completedTasks || 0,
      total: d.total || d.count || 0,
      rate: d.completionRate ? Math.round(Number(d.completionRate)) : (d.total && d.total > 0 ? Math.round(((d.completed || 0) / d.total) * 100) : 0),
      members: d.members || d.memberCount || 0
    })).sort((a, b) => {
      // Sort by completion rate (descending), then by completed tasks (descending), then by total tasks (descending)
      if (b.rate !== a.rate) {
        return b.rate - a.rate;
      }
      if (b.completed !== a.completed) {
        return b.completed - a.completed;
      }
      return b.total - a.total;
    })
    : [];

  // Performance trend data (simulated)
  const performanceTrend = [
    { date: '1 Week', tasks: 45, completion: 78, productivity: 82 },
    { date: '2 Weeks', tasks: 52, completion: 81, productivity: 85 },
    { date: '3 Weeks', tasks: 48, completion: 85, productivity: 88 },
    { date: '1 Month', tasks: 61, completion: 89, productivity: 92 },
    { date: 'Current', tasks: completedTasks, completion: completionRate, productivity: productivityScore }
  ];

  const normalizeTask = (task: any) => {
    const dueDate = task?.dueDate ? new Date(task.dueDate) : new Date();
    const createdAt = task?.createdAt ? new Date(task.createdAt) : new Date();
    const assignedTo = task?.assignedUser?.name
      || task?.assignedTo?.name
      || task?.assignedTo
      || task?.assignedBy?.name
      || 'Unassigned';
    const department = task?.department?.name
      || task?.departmentName
      || task?.department
      || 'Unknown';

    return {
      id: task?.id || task?._id || task?.taskId || `${task?.title || 'task'}-${createdAt.getTime()}`,
      title: task?.title || 'Untitled Task',
      status: task?.status || 'assigned',
      priority: task?.priority || 'medium',
      dueDate,
      createdAt,
      assignedTo,
      department
    };
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'U';
  };

  // Use active tasks from backend if available, otherwise use overview data
  // Show only tasks that are: not completed, not overdue, not blocked
  const recentTasksSource = activeTasksData?.tasks?.length > 0
    ? activeTasksData.tasks
    : (Array.isArray(overviewData?.recentTasks) && overviewData.recentTasks.length > 0
      ? overviewData.recentTasks
      : tasksForRange.filter((t: any) => {
        const status = normalizeTaskStatus(t.status);
        const isNotCompleted = status !== 'completed' && status !== 'done' && status !== 'closed';
        const isNotBlocked = status !== 'blocked';
        const isNotOverdue = !isTaskOverdue(t);
        return isNotCompleted && isNotBlocked && isNotOverdue;
      }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));

  const recentTasks = recentTasksSource.map(normalizeTask);

  const topPerformers = overviewData?.topPerformers
    ? (overviewData.topPerformers as any[]).map((p, idx) => ({
      id: p.user?._id || p.userId || `user-${idx}`,
      name: p.user?.name || `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim() || p.name || `User ${idx + 1}`,
      completionRate: Math.round(Number(p.completionRate || (p.completed && p.total ? (p.completed / p.total) * 100 : 0))),
      totalTasks: p.total || p.totalTasks || 0,
      completedTasks: p.completed || 0,
      role: p.user?.role || 'member'
    })).sort((a, b) => {
      // Sort by completion rate (descending), then by completed tasks (descending), then by total tasks (descending)
      if (b.completionRate !== a.completionRate) {
        return b.completionRate - a.completionRate;
      }
      if (b.completedTasks !== a.completedTasks) {
        return b.completedTasks - a.completedTasks;
      }
      return b.totalTasks - a.totalTasks;
    }).slice(0, 5)
    : [];

  // Use actual department data from backend only
  const departmentOverview = overviewData?.byDepartment?.length > 0
    ? overviewData.byDepartment.map((dept: any, index: number) => ({
      id: String(dept.departmentId || dept._id || dept.id || dept.name || dept.departmentName || `dept-${index}`),
      name: dept.name || dept.departmentName || 'Unknown Department',
      memberCount: dept.members || dept.memberCount || 0,
      color: '#3b82f6' // Default color for backend departments
    })).sort((a, b) => {
      // Find matching performance data for sorting
      const aPerf = departmentPerformance.find(d => d.fullName === a.name);
      const bPerf = departmentPerformance.find(d => d.fullName === b.name);
      const aRate = aPerf?.rate || 0;
      const bRate = bPerf?.rate || 0;

      // Sort by completion rate (descending), then by completed tasks (descending), then by total tasks (descending)
      if (bRate !== aRate) {
        return bRate - aRate;
      }
      if (bPerf?.completed !== aPerf?.completed) {
        return (bPerf?.completed || 0) - (aPerf?.completed || 0);
      }
      return (bPerf?.total || 0) - (aPerf?.total || 0);
    })
    : [];

  const departmentPerformanceSummary = (() => {
    if (!departmentPerformance.length) {
      return {
        averageRate: 0,
        totalCompleted: 0,
        totalTasks: 0,
        topDepartment: null as null | typeof departmentPerformance[number],
        lowDepartment: null as null | typeof departmentPerformance[number]
      };
    }

    const totals = departmentPerformance.reduce((acc, dept) => {
      acc.totalCompleted += dept.completed || 0;
      acc.totalTasks += dept.total || 0;
      acc.rateSum += dept.rate || 0;
      return acc;
    }, { totalCompleted: 0, totalTasks: 0, rateSum: 0 });

    const topDepartment = departmentPerformance.reduce((best, dept) => (
      dept.rate > best.rate ? dept : best
    ), departmentPerformance[0]);

    const lowDepartment = departmentPerformance.reduce((worst, dept) => (
      dept.rate < worst.rate ? dept : worst
    ), departmentPerformance[0]);

    return {
      averageRate: Math.round(totals.rateSum / departmentPerformance.length),
      totalCompleted: totals.totalCompleted,
      totalTasks: totals.totalTasks,
      topDepartment,
      lowDepartment
    };
  })();

  const departmentRankingLimit = Math.min(5, departmentPerformance.length);
  const departmentBarSize = departmentPerformance.length > 10 ? 18 : departmentPerformance.length > 6 ? 24 : 28;

  // Skeleton Components
  const StatsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const RecentTasksSkeleton = () => (
    <Card className="group overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 via-blue-50/70 to-white border-b border-slate-200 dark:border-slate-800">
        <CardTitle className="flex items-center gap-3 text-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
            <ClipboardList className="h-5 w-5 text-blue-600" />
          </div>
          Recent Tasks
        </CardTitle>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-8" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="w-2 h-2 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const TopPerformersSkeleton = () => (
    <Card className="group overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 via-indigo-50/70 to-white border-b border-slate-200 dark:border-slate-800">
        <CardTitle className="flex items-center gap-3 text-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
            <Crown className="h-5 w-5 text-indigo-600" />
          </div>
          Top Performers
        </CardTitle>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-8" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-8 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const DepartmentStatusSkeleton = () => (
    <Card className="group overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 via-emerald-50/70 to-white border-b border-slate-200 dark:border-slate-800">
        <CardTitle className="flex items-center gap-3 text-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
            <Building2 className="h-5 w-5 text-emerald-600" />
          </div>
          Department Status
        </CardTitle>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-8" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-28 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-8 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const ChartSkeleton = () => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-80 w-full" />
      </CardContent>
    </Card>
  );

  // Loading state - show skeleton only when actually loading and no data is available
  const isInitialLoading = (isOverviewLoading && !overviewData) ||
    (isTaskStatusLoading && !taskStatusDistributionData) ||
    (isActiveTasksLoading && !activeTasksData);

  // Component-specific loading states
  const isStatsLoading = (isOverviewLoading || isUserStatsLoading) && !overviewData && !userStatsData;
  const isTasksLoading = isActiveTasksLoading && !activeTasksData;
  const isChartsLoading = isTaskStatusLoading && !taskStatusDistributionData;

  // Real-time update indicator
  const isRefreshing = liveUpdatesEnabled && (
    (overviewData && isOverviewLoading) ||
    (taskStatusDistributionData && isTaskStatusLoading) ||
    (activeTasksData && isActiveTasksLoading)
  );

  // Pagination logic for Recent Tasks
  const totalRecentTasks = recentTasks.length;
  const totalPages = Math.ceil(totalRecentTasks / tasksPerPage);
  const startIndex = (currentPage - 1) * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const paginatedTasks = recentTasks.slice(startIndex, endIndex);

  // Pagination logic for Department Status
  const totalDepartmentsCount = departmentOverview.length;
  const totalDepartmentPages = Math.ceil(totalDepartmentsCount / departmentsPerPage);
  const departmentStartIndex = (departmentPage - 1) * departmentsPerPage;
  const departmentEndIndex = departmentStartIndex + departmentsPerPage;
  const paginatedDepartments = departmentOverview.slice(departmentStartIndex, departmentEndIndex);

  // Reset to first page when tasks change
  useEffect(() => {
    setCurrentPage(1);
  }, [recentTasks.length]);

  // Reset to first page when departments change
  useEffect(() => {
    setDepartmentPage(1);
  }, [departmentOverview.length]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Real-time insights and company performance metrics
          </p>
        </div>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:gap-3">
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d' | 'all') => setTimeRange(value)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 px-2 py-1 rounded-md border">
              <span className="text-xs text-muted-foreground hidden sm:inline">Live Updates</span>
              <span className="text-xs text-muted-foreground sm:hidden">Live</span>
              <Switch checked={liveUpdatesEnabled} onCheckedChange={setLiveUpdatesEnabled} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>

            <Badge variant={liveUpdatesEnabled ? 'outline' : 'secondary'} className="px-2 py-1 text-xs">
              <Activity className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">
                {liveUpdatesEnabled ? (isRefreshing ? 'Updating...' : 'Live') : 'Paused'}
              </span>
              <span className="sm:hidden">
                {liveUpdatesEnabled ? (isRefreshing ? '...' : '●') : '○'}
              </span>
            </Badge>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(value: 'overview' | 'analytics') => setViewMode(value)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Advanced Stats Grid */}
          {isStatsLoading ? (
            <StatsSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight;
                return (
                  <Card
                    key={stat.title}
                    className="group relative overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className={cn("absolute inset-x-0 top-0 h-1", stat.bgColor)} />
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", stat.bgColor)}>
                            <Icon className={cn("h-5 w-5", stat.color)} />
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              {stat.title}
                            </p>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                              {stat.value}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {stat.description}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "h-6 px-2 text-[10px] font-semibold",
                            stat.trend === 'up'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                          )}
                        >
                          <TrendIcon className="w-3 h-3 mr-1" />
                          {stat.trendValue}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Recent Tasks */}
            {isTasksLoading ? (
              <RecentTasksSkeleton />
            ) : (
              <Card className="group overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 shadow-sm transition-all duration-300 hover:shadow-lg">
                <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 bg-gradient-to-r from-slate-50 via-blue-50/70 to-white dark:from-slate-900/50 dark:via-blue-900/20 dark:to-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                  <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    Recent Tasks
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-white/70 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200">{totalRecentTasks}</Badge>
                    <Badge variant="outline" className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300 text-xs">
                      <span className="hidden sm:inline">
                        {timeRange === 'all' ? 'All time' : (timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 90 days')}
                      </span>
                      <span className="sm:hidden">
                        {timeRange === 'all' ? 'All' : (timeRange === '7d' ? '7d' : timeRange === '30d' ? '30d' : '90d')}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {paginatedTasks.map((task, index) => (
                      <div
                        key={task.id}
                        className="group flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/70 hover:shadow-md transition-all duration-200 overflow-hidden"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' :
                            task.status === 'in_progress' ? 'bg-blue-500' :
                              task.status === 'blocked' ? 'bg-red-500' : 'bg-gray-400'
                            }`}></div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors text-gray-900 dark:text-gray-100 line-clamp-2 break-words">
                              {task.title}
                            </h4>
                            <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:gap-3 sm:space-y-0 mt-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span className="hidden sm:inline">Due: </span>
                                {task.dueDate.toLocaleDateString()}
                              </p>
                              <Badge
                                variant={task.priority === 'urgent' ? 'destructive' : 'outline'}
                                className="text-xs w-fit"
                              >
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            task.status === 'completed' ? 'default' :
                              task.status === 'in_progress' ? 'secondary' :
                                task.status === 'blocked' ? 'destructive' : 'outline'
                          }
                          className="ml-0 sm:ml-2 w-fit shrink-0"
                        >
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                    {totalRecentTasks === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ClipboardList className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-lg font-medium">No recent tasks found</p>
                        <p className="text-sm mt-1">Tasks will appear here once they are created</p>
                      </div>
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mt-4 pt-4 border-t border-blue-100 dark:border-blue-800">
                      <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                        Showing {startIndex + 1}-{Math.min(endIndex, totalRecentTasks)} of {totalRecentTasks} tasks
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowUpRight className="h-4 w-4 rotate-180" />
                        </Button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="h-8 w-8 p-0 text-xs"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Top Performers */}
            {isStatsLoading ? (
              <TopPerformersSkeleton />
            ) : (
              <Card className="group overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 shadow-sm transition-all duration-300 hover:shadow-lg">
                <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 bg-gradient-to-r from-slate-50 via-indigo-50/70 to-white dark:from-slate-900/50 dark:via-indigo-900/20 dark:to-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                  <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                      <Crown className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                    </div>
                    Top Performers
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-white/70 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200">{topPerformers.length}</Badge>
                    <Badge variant="outline" className="border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 text-xs">
                      <span className="hidden sm:inline">
                        {timeRange === 'all' ? 'All time' : (timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 90 days')}
                      </span>
                      <span className="sm:hidden">
                        {timeRange === 'all' ? 'All' : (timeRange === '7d' ? '7d' : timeRange === '30d' ? '30d' : '90d')}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {topPerformers.map((user, index) => {
                      const rankColor = index === 0 ? 'bg-amber-500' :
                        index === 1 ? 'bg-slate-400' :
                          index === 2 ? 'bg-orange-500' : 'bg-slate-500';
                      return (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/70 hover:shadow-md transition-all duration-200"
                        >
                          <div className="relative">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white text-xs">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${rankColor}`}>
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-700">
                                {user.role}
                              </Badge>
                              <span>{user.completedTasks}/{user.totalTasks} tasks</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{user.completionRate}%</div>
                            <div className="text-xs text-muted-foreground">Completion</div>
                          </div>
                        </div>
                      );
                    })}
                    {topPerformers.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Crown className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-lg font-medium">No performance data available</p>
                        <p className="text-sm mt-1">User performance will appear here once tasks are completed</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Department Overview */}
            {isStatsLoading ? (
              <DepartmentStatusSkeleton />
            ) : (
              <Card className="group overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 shadow-sm transition-all duration-300 hover:shadow-lg">
                <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 bg-gradient-to-r from-slate-50 via-emerald-50/60 to-white dark:from-slate-900/50 dark:via-emerald-900/20 dark:to-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                  <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                      <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                    </div>
                    Department Status
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-white/70 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200">{departmentOverview.length}</Badge>
                    <Badge variant="outline" className="border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 text-xs">
                      <span className="hidden sm:inline">
                        {timeRange === 'all' ? 'All time' : (timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 90 days')}
                      </span>
                      <span className="sm:hidden">
                        {timeRange === 'all' ? 'All' : (timeRange === '7d' ? '7d' : timeRange === '30d' ? '30d' : '90d')}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {paginatedDepartments.map((dept, index) => {
                      // Find matching performance data - try multiple matching strategies
                      const deptPerf = departmentPerformance.find(d =>
                        d.fullName === dept.name ||
                        d.name === dept.name ||
                        d.fullName?.includes(dept.name) ||
                        dept.name?.includes(d.fullName)
                      );

                      const performanceColor = (deptPerf?.rate || 0) >= 80 ? 'text-green-600 dark:text-green-400' :
                        (deptPerf?.rate || 0) >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
                      const progressColor = (deptPerf?.rate || 0) >= 80 ? 'bg-green-500' :
                        (deptPerf?.rate || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500';

                      return (
                        <div
                          key={dept.id}
                          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-3 hover:bg-slate-50 dark:hover:bg-slate-900/70 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold">
                                {departmentStartIndex + index + 1}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{dept.name}</h4>
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                  <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-700">
                                    {dept.memberCount} members
                                  </Badge>
                                  <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-700">
                                    {deptPerf?.completed || 0}/{deptPerf?.total || 0} tasks
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-center sm:text-right">
                              <div className={`text-sm font-bold ${performanceColor}`}>{deptPerf?.rate || 0}%</div>
                              <div className="text-xs text-muted-foreground">Completion</div>
                            </div>
                          </div>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className={cn("h-1.5 rounded-full", progressColor)}
                              style={{ width: `${Math.min(deptPerf?.rate || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {departmentOverview.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-lg font-medium">No departments found</p>
                        <p className="text-sm mt-1">Departments will appear here once they are created</p>
                      </div>
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {totalDepartmentPages > 1 && (
                    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mt-4 pt-4 border-t border-blue-100 dark:border-blue-800">
                      <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                        Showing {departmentStartIndex + 1}-{Math.min(departmentEndIndex, totalDepartmentsCount)} of {totalDepartmentsCount} departments
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDepartmentPage(prev => Math.max(prev - 1, 1))}
                          disabled={departmentPage === 1}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowUpRight className="h-4 w-4 rotate-180" />
                        </Button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(totalDepartmentPages, 5) }, (_, i) => {
                            let pageNum;
                            if (totalDepartmentPages <= 5) {
                              pageNum = i + 1;
                            } else if (departmentPage <= 3) {
                              pageNum = i + 1;
                            } else if (departmentPage >= totalDepartmentPages - 2) {
                              pageNum = totalDepartmentPages - 4 + i;
                            } else {
                              pageNum = departmentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={departmentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setDepartmentPage(pageNum)}
                                className="h-8 w-8 p-0 text-xs"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDepartmentPage(prev => Math.min(prev + 1, totalDepartmentPages))}
                          disabled={departmentPage === totalDepartmentPages}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {/* Task Status Distribution - Full Width */}
          {isChartsLoading ? (
            <ChartSkeleton />
          ) : (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                  <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Task Status Distribution</span>
                  <span className="sm:hidden">Task Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {taskStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350} className="sm:h-[450px]">
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        className="sm:outerRadius={160}"
                        dataKey="value"
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-60 sm:h-80 flex items-center justify-center text-muted-foreground">
                    <div className="text-center p-4">
                      <PieChartIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-50" />
                      <p className="text-base sm:text-lg font-medium">No task data available</p>
                      <p className="text-xs sm:text-sm">Task status distribution will appear here once tasks are created</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Department Performance - Full Width */}
          {isStatsLoading ? (
            <ChartSkeleton />
          ) : (
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-950/30 dark:via-blue-950/30 dark:to-cyan-950/30 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Department Performance</span>
                    <span className="sm:hidden">Dept Performance</span>
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-white/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200">
                      {departmentPerformance.length} Depts
                    </Badge>
                    <Badge variant="outline" className="border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                      Avg {departmentPerformanceSummary.averageRate}%
                    </Badge>
                    {departmentPerformanceSummary.topDepartment && (
                      <Badge variant="outline" className="border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                        Top: {departmentPerformanceSummary.topDepartment.fullName || departmentPerformanceSummary.topDepartment.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Completion rate and throughput by department</p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {departmentPerformance.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3">
                          <p className="text-xs text-muted-foreground">Average completion</p>
                          <div className="mt-1 flex items-end justify-between">
                            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                              {departmentPerformanceSummary.averageRate}%
                            </span>
                            <Badge variant="secondary" className="text-[10px]">Overall</Badge>
                          </div>
                          <Progress value={departmentPerformanceSummary.averageRate} className="h-1.5 mt-3" />
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3">
                          <p className="text-xs text-muted-foreground">Tasks completed</p>
                          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {departmentPerformanceSummary.totalCompleted}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {departmentPerformanceSummary.totalTasks} total tasks
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                            Top department
                          </p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span
                              className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate"
                              title={departmentPerformanceSummary.topDepartment?.fullName || departmentPerformanceSummary.topDepartment?.name || 'N/A'}
                            >
                              {departmentPerformanceSummary.topDepartment?.fullName || departmentPerformanceSummary.topDepartment?.name || 'N/A'}
                            </span>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {departmentPerformanceSummary.topDepartment?.rate ?? 0}%
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {departmentPerformanceSummary.topDepartment?.completed ?? 0}/{departmentPerformanceSummary.topDepartment?.total ?? 0} tasks
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingDown className="h-3.5 w-3.5 text-amber-600" />
                            Needs attention
                          </p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span
                              className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate"
                              title={departmentPerformanceSummary.lowDepartment?.fullName || departmentPerformanceSummary.lowDepartment?.name || 'N/A'}
                            >
                              {departmentPerformanceSummary.lowDepartment?.fullName || departmentPerformanceSummary.lowDepartment?.name || 'N/A'}
                            </span>
                            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                              {departmentPerformanceSummary.lowDepartment?.rate ?? 0}%
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {departmentPerformanceSummary.lowDepartment?.completed ?? 0}/{departmentPerformanceSummary.lowDepartment?.total ?? 0} tasks
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Department Rankings</h4>
                          <Badge variant="secondary" className="text-[10px]">Top {departmentRankingLimit}</Badge>
                        </div>
                        <div className="space-y-3">
                          {departmentPerformance.slice(0, departmentRankingLimit).map((dept, index) => {
                            const performanceColor = dept.rate >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                              dept.rate >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

                            return (
                              <div key={`${dept.fullName || dept.name}-${index}`} className="flex items-start gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                                  {index + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100" title={dept.fullName || dept.name}>
                                      {dept.fullName || dept.name}
                                    </p>
                                    <span className={`text-sm font-semibold ${performanceColor}`}>{dept.rate}%</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                    <span>{dept.completed}/{dept.total} tasks</span>
                                    <span>•</span>
                                    <span>{dept.members} members</span>
                                  </div>
                                  <Progress value={Math.min(dept.rate, 100)} className="h-1.5 mt-2" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="xl:col-span-7">
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/70 dark:to-slate-900/40 p-4 sm:p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                              <Activity className="w-4 h-4" />
                              Performance Comparison
                            </h4>
                            <p className="text-[11px] text-muted-foreground">Completion rate by department</p>
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            <Badge variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                              Avg {departmentPerformanceSummary.averageRate}%
                            </Badge>
                            {departmentPerformanceSummary.topDepartment && (
                              <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
                                Top {departmentPerformanceSummary.topDepartment.rate}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={360}>
                          <BarChart data={departmentPerformance} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="2 6" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 12, fill: '#64748b' }}
                              axisLine={false}
                              tickLine={false}
                              interval={0}
                              angle={-25}
                              textAnchor="end"
                              height={50}
                            />
                            <YAxis
                              tick={{ fontSize: 12, fill: '#64748b' }}
                              axisLine={false}
                              tickLine={false}
                              unit="%"
                            />
                            <Tooltip
                              cursor={{ fill: '#e2e8f0', opacity: 0.4 }}
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                                border: '1px solid rgba(226, 232, 240, 0.8)',
                                borderRadius: '10px',
                                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                                padding: '12px'
                              }}
                            />
                            <Bar
                              dataKey="rate"
                              name="Completion Rate"
                              radius={[10, 10, 6, 6]}
                              barSize={departmentBarSize}
                              background={{ fill: 'rgba(148, 163, 184, 0.2)', radius: [10, 10, 6, 6] }}
                            >
                              {departmentPerformance.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    entry.rate >= 80 ? '#22c55e' :
                                      entry.rate >= 60 ? '#eab308' :
                                        '#ef4444'
                                  }
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-60 sm:h-80 flex items-center justify-center text-muted-foreground">
                    <div className="text-center p-4">
                      <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-50" />
                      <p className="text-base sm:text-lg font-medium">No department data available</p>
                      <p className="text-xs sm:text-sm">Department performance will appear here once departments are created</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}
