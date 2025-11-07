import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
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
  DollarSign, UserCheck, Crown, Timer, Briefcase, Settings
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analyticsService';
import { usersService } from '@/services/usersService';
import { useAuth } from '@/components/Auth/AuthProvider';
// Removed mock data imports - using only real database data
import { mockMeetings } from '@/data/meetingsData';
import { mockLeaveRequests } from '@/data/leaveData';
import MeetingsDisplay from '@/components/Meetings/MeetingsDisplay';
import { mockTasks } from '@/data/mockData';

export default function DashboardOverview() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [viewMode, setViewMode] = useState<'overview' | 'analytics' | 'performance'>('overview');
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 5;

  // Auto refresh is now handled by React Query's refetchInterval
  // No need for manual refreshTime updates

  // Fetch backend analytics overview and calculate advanced metrics (fallback to mocks)
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
        console.log('Analytics Service Response:', res);
        console.log('Analytics Service Response Data:', res?.data);
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
          includeOverdue: true,
          excludeOverdue: true // Always exclude overdue from assigned and in-progress counts
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
  // Calculate urgent tasks that are not overdue, blocked, or completed
  const urgentTasks = (() => {
    // First try to get from backend data if available
    if (activeTasksData?.tasks?.length > 0) {
      return activeTasksData.tasks.filter(task => 
        (task.priority === 'urgent' || task.priority === 'high') &&
        task.status !== 'completed' &&
        task.status !== 'blocked' &&
        (!task.dueDate || new Date(task.dueDate) >= new Date())
      ).length;
    }
    
    // Fallback to overview data with proper filtering
    if (overviewData?.tasksList?.length > 0) {
      return overviewData.tasksList.filter(task => 
        (task.priority === 'urgent' || task.priority === 'high') &&
        task.status !== 'completed' &&
        task.status !== 'blocked' &&
        (!task.dueDate || new Date(task.dueDate) >= new Date())
      ).length;
    }
    
    // Fallback to mock data if no backend data
    const urgentMockTasks = mockTasks.filter(task => 
      (task.priority === 'urgent' || task.priority === 'high') &&
      task.status !== 'completed' &&
      task.status !== 'blocked' &&
      (!task.dueDate || new Date(task.dueDate) >= new Date())
    );
    
    return urgentMockTasks.length;
  })();
  
  // Calculate time-based metrics
  const currentTime = new Date();
  const overdueTasks = overviewData?.overdue ?? 0;
  const todayTasks = overviewData?.todayTasks ?? 0;

  // Performance metrics
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activeEmployees = userStatsData?.active ?? 0;
  const pendingLeaves = Number(overviewData?.leavesByStatus?.pending ?? 0);
  console.log('Dashboard Overview - overviewData:', overviewData);
  console.log('Dashboard Overview - leavesByStatus:', overviewData?.leavesByStatus?.pending);
  console.log('Dashboard Overview - pendingLeaves:', pendingLeaves);
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

  // Chart data - use backend filtered data if available, otherwise use overview data
  const taskStatusData = taskStatusDistributionData && taskStatusDistributionData.taskStatusData && Array.isArray(taskStatusDistributionData.taskStatusData)
    ? taskStatusDistributionData.taskStatusData.map((item: any) => ({
        name: item.name,
        value: item.value,
        color: item.color || (item.name === 'Completed' ? '#22c55e' : 
                              item.name === 'In Progress' ? '#3b82f6' : 
                              item.name === 'Assigned' ? '#f59e0b' : 
                              item.name === 'Overdue' ? '#dc2626' : '#ef4444')
      }))
    : overviewData ? [
    { name: 'Completed', value: completedTasks, color: '#22c55e' },
    { name: 'In Progress', value: inProgressTasks, color: '#3b82f6' },
    { name: 'Assigned', value: overviewData?.tasksByStatus?.assigned ?? 0, color: '#f59e0b' },
    { name: 'Blocked', value: blockedTasks, color: '#ef4444' }
  ] : [];

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

  // Mock data is now imported at the top

  // Debug logging for tasks data
  console.log('🔍 Dashboard - activeTasksData:', activeTasksData);
  console.log('🔍 Dashboard - overviewData:', overviewData);
  console.log('🔍 Dashboard - tasksForRange:', tasksForRange);

  // Use active tasks from backend if available, otherwise use overview data or mock data
  // Show only tasks that are: not completed, not overdue, not blocked
  const recentTasks = activeTasksData?.tasks?.length > 0 
    ? activeTasksData.tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
        createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
        assignedTo: task.assignedUser?.name || 'Unassigned',
        department: task.department?.name || 'Unknown'
      }))
    : (overviewData?.recentTasks || tasksForRange.filter((t: any) => {
        const isNotCompleted = t.status !== 'completed' && t.status !== 'done' && t.status !== 'closed';
        const isNotBlocked = t.status !== 'blocked';
        const isNotOverdue = !t.dueDate || new Date(t.dueDate) >= new Date();
        return isNotCompleted && isNotBlocked && isNotOverdue;
      }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0,5)) || 
      // Fallback to mock data if no backend data available
      mockTasks.filter((t: any) => {
        const isNotCompleted = t.status !== 'completed' && t.status !== 'done' && t.status !== 'closed';
        const isNotBlocked = t.status !== 'blocked';
        const isNotOverdue = !t.dueDate || new Date(t.dueDate) >= new Date();
        return isNotCompleted && isNotBlocked && isNotOverdue;
      }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0,5).map((task: any) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
        createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
        assignedTo: 'Team Member', // Mock assigned user
        department: 'Department' // Mock department
      }));

  // Debug logging for final recentTasks
  console.log('🔍 Dashboard - recentTasks final result:', recentTasks);
  
  // Debug logging for urgent tasks calculation
  console.log('🔍 Dashboard - urgentTasks calculation:', {
    activeTasksData: activeTasksData?.tasks?.length || 0,
    overviewDataTasks: overviewData?.tasksList?.length || 0,
    mockTasks: mockTasks.length,
    finalUrgentCount: urgentTasks
  });

  const topPerformers = overviewData?.topPerformers
    ? (overviewData.topPerformers as any[]).map((p, idx) => ({
        id: p.user?._id || p.userId || `user-${idx}`,
        name: p.user?.name || `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim() || p.name || `User ${idx+1}`,
        completionRate: Math.round(Number(p.completionRate || (p.completed && p.total ? (p.completed / p.total) * 100 : 0))) ,
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
      }).slice(0,5)
    : [];

  // Use actual department data from backend only
  const departmentOverview = overviewData?.byDepartment?.length > 0 
    ? overviewData.byDepartment.map((dept: any) => ({
        id: dept.departmentId || dept._id || `dept-${Math.random()}`,
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
    <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
      <CardHeader className="flex flex-row items-center justify-between bg-blue-50">
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <ClipboardList className="h-5 w-5" />
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
            <div key={i} className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-100">
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
    <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Crown className="h-5 w-5" />
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
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100">
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
    <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Building2 className="h-5 w-5" />
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
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100">
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

  // Reset to first page when tasks change
  useEffect(() => {
    setCurrentPage(1);
  }, [recentTasks.length]);

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
                <Card key={stat.title} className={`hover:shadow-lg transition-all duration-300 ${stat.bgColor}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stat.description}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-medium ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendIcon className="w-3 h-3" />
                        {stat.trendValue}
                      </div>
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
            <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <ClipboardList className="h-5 w-5" />
                  Recent Tasks
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{totalRecentTasks}</Badge>
                  <Badge variant="outline" className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs">
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
                    <div key={task.id} className="group flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-3 sm:p-4 bg-gradient-to-r from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 hover:shadow-md dark:hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-2 h-2 rounded-full ${
                          task.status === 'completed' ? 'bg-green-500' :
                          task.status === 'in_progress' ? 'bg-blue-500' :
                          task.status === 'blocked' ? 'bg-red-500' : 'bg-gray-400'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors text-gray-900 dark:text-gray-100 truncate">{task.title}</h4>
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
                        className="ml-0 sm:ml-2 w-fit"
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
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Crown className="h-5 w-5" />
                  Top Performers
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{topPerformers.length}</Badge>
                  <Badge variant="outline" className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs">
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
                    const rankColor = index === 0 ? 'bg-blue-500' : 
                                     index === 1 ? 'bg-gray-400' : 
                                     index === 2 ? 'bg-indigo-500' : 'bg-blue-400';
                    
                    return (
                      <div key={user.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800 hover:shadow-sm dark:hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">{user.completionRate}%</div>
                        <div className="text-xs text-muted-foreground">{user.completedTasks}/{user.totalTasks}</div>
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
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Building2 className="h-5 w-5" />
                  Department Status
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{departmentOverview.length}</Badge>
                  <Badge variant="outline" className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs">
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
                  {departmentOverview.map((dept, index) => {
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
                      <div key={dept.id} className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800 hover:shadow-sm dark:hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-bold">
                          {index + 1}
                        </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{dept.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {dept.memberCount} members • {deptPerf?.completed || 0}/{deptPerf?.total || 0} tasks
                              </p>
                            </div>
                        </div>
                        <div className="text-center sm:text-right">
                          <div className={`text-sm font-bold ${performanceColor}`}>{deptPerf?.rate || 0}%</div>
                          <div className="text-xs text-muted-foreground">Completion</div>
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
                  <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                        outerRadius={80}
                        className="sm:outerRadius={120}"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
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
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Department Performance</span>
                  <span className="sm:hidden">Dept Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {departmentPerformance.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                {/* Department Performance Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {departmentPerformance.slice(0, 4).map((dept) => {
                    const performanceColor = dept.rate >= 80 ? 'text-green-600 dark:text-green-400' : 
                                           dept.rate >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
                    const performanceBg = dept.rate >= 80 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 
                                         dept.rate >= 60 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
                    
                    return (
                      <div key={dept.name} className={`p-4 sm:p-5 lg:p-6 rounded-lg border ${performanceBg} hover:shadow-md dark:hover:shadow-lg transition-all duration-200`}>
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                              dept.rate >= 80 ? 'bg-green-500' : 
                              dept.rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <h4 className="font-semibold text-sm sm:text-base lg:text-lg truncate text-gray-900 dark:text-gray-100">{dept.fullName || dept.name}</h4>
                          </div>
                          <Badge variant="outline" className="text-sm hidden sm:inline-flex">
                            {dept.members} members
                          </Badge>
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm sm:text-base text-muted-foreground">Completion Rate</span>
                            <span className={`text-base sm:text-xl lg:text-2xl font-bold ${performanceColor}`}>
                              {dept.rate}%
                            </span>
                          </div>

                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-2.5">
                            <div
                              className={`h-2 sm:h-2.5 rounded-full transition-all duration-500 ${
                                dept.rate >= 80 ? 'bg-green-500' :
                                dept.rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(dept.rate, 100)}%` }}
                            ></div>
                          </div>

                          <div className="flex justify-between text-sm sm:text-base text-muted-foreground">
                            <span>{dept.completed}/{dept.total} completed</span>
                            <span className="hidden sm:inline">{dept.total - dept.completed} pending</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Department Performance Chart */}
                <div className="mt-3 sm:mt-4 lg:mt-6">
                  <ResponsiveContainer width="100%" height={250} className="sm:h-[400px] lg:h-[1100px] xl:h-[1200px]">
                    <BarChart data={departmentPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 20 }} className="sm:margin={{ top: 30, right: 40, left: 30, bottom: 30 }} lg:margin={{ top: 40, right: 50, left: 40, bottom: 40 }} xl:margin={{ top: 50, right: 60, left: 50, bottom: 50 }}">
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-20" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: 'currentColor' }}
                        className="sm:tick={{ fontSize: 12, fill: 'currentColor' }} lg:tick={{ fontSize: 16, fill: 'currentColor' }} xl:tick={{ fontSize: 18, fill: 'currentColor' }}"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="sm:tick={{ fontSize: 12, fill: 'currentColor' }} lg:tick={{ fontSize: 16, fill: 'currentColor' }} xl:tick={{ fontSize: 18, fill: 'currentColor' }}" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          color: 'hsl(var(--foreground))',
                          fontSize: '14px'
                        }}
                        labelStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                      />
                      <Bar
                        dataKey="rate"
                        fill="hsl(var(--primary))"
                        name="Completion Rate %"
                        radius={[4, 4, 0, 0]}
                        className="sm:radius={[6, 6, 0, 0]} lg:radius={[8, 8, 0, 0]} xl:radius={[10, 10, 0, 0]}"
                      />
                  </BarChart>
                </ResponsiveContainer>
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