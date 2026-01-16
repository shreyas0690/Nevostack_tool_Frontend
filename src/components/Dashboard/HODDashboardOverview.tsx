import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  ClipboardList,
  TrendingUp,
  Calendar,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Building2,
  Target,
  Crown,
  Timer,
  CalendarDays,
  Activity,
  BarChart3,
  Zap,
  Edit3,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Wallet,
  UserMinus,
  Briefcase
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/Auth/AuthProvider';
import { analyticsService } from '@/services/analyticsService';
import { taskService } from '@/services/taskService';
import { hodService } from '@/services/api/hodService';
import { useToast } from '@/hooks/use-toast';
import { mockUsers, mockDepartments, mockTasks } from '@/data/mockData';
import { mockMeetings } from '@/data/meetingsData';
import { mockLeaveRequests } from '@/data/leaveData';

interface HODDashboardOverviewProps {
  onTabChange?: (tab: string) => void;
}

export default function HODDashboardOverview({ onTabChange }: HODDashboardOverviewProps) {
  const { currentUser } = useAuth();

  // State management - matching admin panel features
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [viewMode, setViewMode] = useState<'overview' | 'analytics' | 'performance'>('overview');
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(true);

  const [tasks, setTasks] = useState(mockTasks);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [minimumLoadTimePassed, setMinimumLoadTimePassed] = useState(false);
  const { toast } = useToast();

  // Fetch HOD overview data (department info, basic stats) - Real-time updates
  const { data: hodOverviewData, isLoading: hodOverviewLoading, error: hodOverviewError } = useQuery({
    queryKey: ['hod', 'overview', currentUser?.companyId, currentUser?.departmentId],
    queryFn: async () => {
      try {
        const params: any = {};
        if (currentUser?.companyId) params.companyId = currentUser.companyId;
        if (currentUser?.departmentId) params.departmentId = currentUser.departmentId;

        console.log('HOD Dashboard: Fetching overview with params:', params);
        const res: any = await analyticsService.getHODOverview(params);
        console.log('HOD Dashboard: Overview response:', res);
        return res?.data || null;
      } catch (e) {
        console.error('HOD Dashboard: Overview error:', e);
        return null;
      }
    },
    enabled: !!currentUser,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
    refetchOnWindowFocus: true, // Update when user returns to tab
    refetchIntervalInBackground: false // Don't refetch when tab is not active
  });

  // Fetch HOD personal tasks - Real-time updates
  const { data: hodPersonalTasksData, isLoading: hodTasksLoading, error: hodTasksError, refetch: refetchHodTasks } = useQuery({
    queryKey: ['hod', 'tasks', currentUser?.id],
    queryFn: async () => {
      try {
        const params: any = {};
        if (currentUser?.companyId) params.companyId = currentUser.companyId;

        console.log('HOD Dashboard: Fetching personal tasks with params:', params);
        const res: any = await analyticsService.getHODTasks(params);
        console.log('HOD Dashboard: Personal tasks response:', res);
        return res?.data || null;
      } catch (e) {
        console.error('HOD Dashboard: Personal tasks error:', e);
        return null;
      }
    },
    enabled: !!currentUser,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false
  });

  // Fetch department tasks - Real-time updates
  const { data: hodDepartmentTasksData, isLoading: hodDeptTasksLoading, error: hodDeptTasksError, refetch: refetchHodDeptTasks } = useQuery({
    queryKey: ['hod', 'department', 'tasks', currentUser?.companyId, currentUser?.departmentId],
    queryFn: async () => {
      try {
        const params: any = {};
        if (currentUser?.companyId) params.companyId = currentUser.companyId;
        if (currentUser?.departmentId) params.departmentId = currentUser.departmentId;

        console.log('HOD Dashboard: Fetching department tasks with params:', params);
        const res: any = await analyticsService.getHODDepartmentTasks(params);
        console.log('HOD Dashboard: Department tasks response:', res);
        return res?.data || null;
      } catch (e) {
        console.error('HOD Dashboard: Department tasks error:', e);
        return null;
      }
    },
    enabled: !!currentUser,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false
  });

  // Fetch department members - Real-time updates
  const { data: hodMembersData, isLoading: hodMembersLoading, error: hodMembersError } = useQuery({
    queryKey: ['hod', 'department', 'members', currentUser?.companyId, currentUser?.departmentId],
    queryFn: async () => {
      try {
        const departmentId = currentUser?.departmentId;

        if (!departmentId) {
          console.log('HOD Dashboard: No department ID available');
          return [];
        }

        console.log('HOD Dashboard: Fetching department members for department:', departmentId);
        const res: any = await hodService.getDepartmentUsers(departmentId);
        console.log('HOD Dashboard: Department members response:', res);

        if (res?.success && res?.data) {
          return res.data;
        } else {
          console.warn('HOD Dashboard: API call failed, using mock data');
          // Fallback to mock data
          const mockData = mockUsers.filter(u => String(u.departmentId) === String(departmentId));
          return mockData;
        }
      } catch (e) {
        console.error('HOD Dashboard: Department members error:', e);
        // Fallback to mock data on error
        const mockData = mockUsers.filter(u => String(u.departmentId) === String(currentUser?.departmentId));
        return mockData;
      }
    },
    enabled: !!currentUser?.departmentId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes (members change less frequently)
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false
  });

  // Update current time every minute for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(timer);
  }, []);

  // Ensure minimum loading time for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumLoadTimePassed(true);
    }, 800); // Show skeleton for at least 800ms

    return () => clearTimeout(timer);
  }, []);

  const normalizeTaskStatus = (value: any) =>
    String(value ?? '')
      .toLowerCase()
      .replace(/[_\s-]+/g, ' ')
      .trim();

  const normalizePriority = (value: any) => String(value ?? '').toLowerCase().trim();

  const normalizeId = (value: any) => {
    if (value === null || value === undefined) return null;
    return String(value);
  };

  const getUserId = (user: any) => {
    if (!user) return null;
    if (typeof user === 'string' || typeof user === 'number') return String(user);
    return normalizeId(user.id || user._id || user.userId || user.employeeId);
  };

  const getAssignedIds = (task: any) => {
    if (!task) return [];
    const raw = (task.assignedToList && task.assignedToList.length)
      ? task.assignedToList
      : task.assignedTo;
    const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    return list.map((entry) => {
      if (!entry) return null;
      if (typeof entry === 'string' || typeof entry === 'number') return String(entry);
      return getUserId(entry);
    }).filter(Boolean) as string[];
  };

  const isTaskAssignedTo = (task: any, user: any) => {
    const userId = getUserId(user);
    if (!userId) return false;
    return getAssignedIds(task).some((id) => id === userId);
  };

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
    return !!due && due.getTime() < currentTime.getTime();
  };

  // Helper function to calculate time remaining with real-time countdown
  const getTimeRemaining = (dueDate: any) => {
    const now = currentTime;
    const date = resolveDueDate(dueDate);
    if (!date) {
      return { text: 'No due date', color: 'text-slate-500', isOverdue: false };
    }
    const diff = date.getTime() - now.getTime();

    if (diff <= 0) {
      const overdueDiff = Math.abs(diff);
      const overdueDays = Math.floor(overdueDiff / (1000 * 60 * 60 * 24));
      const overdueHours = Math.floor((overdueDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (overdueDays > 0) {
        return { text: `${overdueDays}d overdue`, color: 'text-red-600', isOverdue: true };
      } else if (overdueHours > 0) {
        return { text: `${overdueHours}h overdue`, color: 'text-red-600', isOverdue: true };
      } else {
        return { text: 'Overdue', color: 'text-red-600', isOverdue: true };
      }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 7) {
      return { text: `${days} days`, color: 'text-green-600', isOverdue: false };
    } else if (days > 2) {
      return { text: `${days} days`, color: 'text-yellow-600', isOverdue: false };
    } else if (days > 0) {
      return { text: `${days}d ${hours}h`, color: 'text-orange-600', isOverdue: false };
    } else if (hours > 2) {
      return { text: `${hours}h ${minutes}m`, color: 'text-red-500', isOverdue: false };
    } else if (hours > 0) {
      return { text: `${hours}h ${minutes}m`, color: 'text-red-600', isOverdue: false };
    } else if (minutes > 0) {
      return { text: `${minutes}m`, color: 'text-red-600', isOverdue: false };
    } else {
      return { text: '< 1m', color: 'text-red-600', isOverdue: false };
    }
  };

  // Helper function to get formatted creation date
  const getCreatedDate = (createdAt: any) => {
    const now = currentTime;
    const date = createdAt ? new Date(createdAt) : new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Function to update task status (optimistic + persist to backend)
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    if (!taskId) {
      console.warn('updateTaskStatus called without taskId');
      return;
    }

    const id = String(taskId);
    const previous = [...tasks];
    const task = previous.find(t => String(t.id || t._id) === id);

    setTasks(prevTasks =>
      prevTasks.map(t =>
        String(t.id || t._id) === id
          ? { ...t, status: newStatus as any, updatedAt: new Date() }
          : t
      )
    );

    try {
      await taskService.updateTaskStatus(id, newStatus as any);
      if (typeof refetchHodTasks === 'function') refetchHodTasks();
      if (typeof refetchHodDeptTasks === 'function') refetchHodDeptTasks();
    } catch (error) {
      console.error('Failed to update task status:', error);
      setTasks(previous);
    }

    if (task && newStatus === 'completed') {
      console.log(`Task "${task.title}" marked as completed!`);
    }
  };

  // Quick Actions Handlers
  const handleScheduleMeeting = () => {
    console.log('Schedule Meeting clicked');
    if (onTabChange) {
      onTabChange('meetings');
      toast({
        title: '📅 Navigating to Meetings',
        description: 'Opening meetings management section',
      });
    }
  };

  const handleCreateTask = () => {
    console.log('Create Task clicked');
    if (onTabChange) {
      onTabChange('tasks');
      toast({
        title: '📋 Navigating to Tasks',
        description: 'Opening task management section',
      });
    }
  };

  const handleTeamReview = () => {
    console.log('Team Review clicked');
    if (onTabChange) {
      onTabChange('team');
      toast({
        title: '👥 Navigating to Team',
        description: 'Opening team management section',
      });
    }
  };

  const handleViewAnalytics = () => {
    console.log('View Analytics clicked');
    if (onTabChange) {
      onTabChange('analytics');
      toast({
        title: '📊 Navigating to Analytics',
        description: 'Opening analytics dashboard',
      });
    }
  };

  // Use real department data from backend
  const userDepartment = hodOverviewData?.department || null;

  // Use real department members from backend
  const departmentMembers = hodMembersData || [];

  const currentUserId = getUserId(currentUser);
  const teamMembers = departmentMembers.filter(member => {
    const memberId = getUserId(member);
    if (!memberId || !currentUserId) return true;
    return String(memberId) !== String(currentUserId);
  });

  const teamMemberIds = teamMembers.map(getUserId).filter(Boolean) as string[];

  // Use real department tasks from backend
  const departmentTasks = hodDepartmentTasksData || [];

  const teamTasks = departmentTasks.filter(task => {
    const assignedIds = getAssignedIds(task);
    return assignedIds.some(id => teamMemberIds.includes(String(id)));
  });
  const teamCompletedTasks = teamTasks.filter(t => normalizeTaskStatus(t.status) === 'completed').length;

  // Use real personal tasks from backend
  const myTasks = hodPersonalTasksData || [];

  // Get department hierarchy from backend data
  const departmentHead = userDepartment?.head || null;
  const departmentManagers = userDepartment?.managers || [];
  const departmentHeadId = getUserId(userDepartment?.head);
  const departmentManagerIds = departmentManagers.map(getUserId).filter(Boolean) as string[];
  const regularMembers = departmentMembers.filter(u => {
    const memberId = getUserId(u);
    return memberId !== departmentHeadId && !departmentManagerIds.includes(String(memberId));
  });

  // Get department meetings
  const departmentId = normalizeId(userDepartment?.id || userDepartment?._id);
  const departmentMeetings = mockMeetings.filter(m => {
    const deptMatch = !!departmentId && (m.departments || []).some(id => String(id) === String(departmentId));
    const attendeeMatch = (m.attendees || []).some(id =>
      departmentMembers.some(member => String(getUserId(member)) === String(id))
    );
    return deptMatch || attendeeMatch;
  });

  // Get leave requests for department
  const departmentLeaveRequests = mockLeaveRequests.filter(request =>
    departmentMembers.some(member => String(getUserId(member)) === String(request.employeeId))
  );

  // --- Data Preparation for New Sections ---

  // 1. Who is Away Today
  const today = new Date();
  const absentMembers = departmentMembers.filter(member => {
    const memberId = getUserId(member);
    const activeLeave = departmentLeaveRequests.find(req => {
      if (String(req.employeeId) !== String(memberId) || req.status !== 'approved') return false;
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      return today >= start && today <= end;
    });
    return !!activeLeave;
  }).map(member => {
    const memberId = getUserId(member);
    const leave = departmentLeaveRequests.find(req =>
      String(req.employeeId) === String(memberId) &&
      req.status === 'approved' &&
      new Date(req.startDate) <= today &&
      new Date(req.endDate) >= today
    );
    return {
      ...member,
      returnDate: leave ? new Date(leave.endDate) : new Date()
    };
  });

  // 2. Department Goals (Mock Data)
  const departmentGoals = [
    { id: 1, title: 'Q4 Project Delivery', progress: 75, status: 'On Track', color: 'bg-green-500' },
    { id: 2, title: 'Team Skill Upgradation', progress: 40, status: 'At Risk', color: 'bg-yellow-500' },
    { id: 3, title: 'Reduce Tech Debt', progress: 20, status: 'Behind', color: 'bg-red-500' },
  ];

  // 3. Budget Tracking (Mock Data)
  const departmentBudget = {
    total: 50000,
    used: 32500,
    currency: '$'
  };
  const budgetPercentage = (departmentBudget.used / departmentBudget.total) * 100;


  // Calculate stats using backend data
  const totalMembers = teamMembers.length;
  const activeMembers = teamMembers.filter(m => m.isActive !== false).length;

  // Use backend task stats if available, otherwise calculate from department tasks
  const overviewTasks = hodOverviewData?.tasks;
  const totalTasks = Number(overviewTasks?.total ?? departmentTasks.length);
  const completedTasks = Number(overviewTasks?.completed ?? departmentTasks.filter(t => normalizeTaskStatus(t.status) === 'completed').length);
  const hasOverviewPending = overviewTasks && (overviewTasks.in_progress !== undefined || overviewTasks.assigned !== undefined);
  const pendingTasks = hasOverviewPending
    ? Number(overviewTasks?.in_progress ?? 0) + Number(overviewTasks?.assigned ?? 0)
    : departmentTasks.filter(t => {
      const status = normalizeTaskStatus(t.status);
      return status === 'assigned' || status === 'in progress';
    }).length;
  const pendingLeaveRequests = hodOverviewData?.leaves?.pending ?? departmentLeaveRequests.filter(r => r.status === 'pending').length;
  const todayMeetings = Number(hodOverviewData?.meetings?.today ?? departmentMeetings.filter(m => {
    const today = new Date();
    const meetingDate = m.date ? new Date(m.date) : new Date();
    return meetingDate.toDateString() === today.toDateString();
  }).length);
  const superAdminTasks = hodOverviewData?.hodTasks?.fromSuperAdmin ?? departmentTasks.filter(t => t.assignedBy?.role === 'super_admin').length;

  // Get tasks assigned TO the current HOD user (exclude completed tasks from dashboard)
  const myPendingTasks = myTasks.filter(t => {
    const status = normalizeTaskStatus(t.status);
    return status === 'assigned' || status === 'in progress';
  });
  const mySuperAdminTasks = myTasks.filter(t => t.assignedBy?.role === 'super_admin');

  // For dashboard display - hide completed and blocked tasks
  const myTasksForDashboard = myTasks.filter(t => {
    const status = normalizeTaskStatus(t.status);
    return status !== 'completed' && status !== 'blocked';
  });
  const mySuperAdminTasksForDashboard = myTasksForDashboard.filter(t => t.assignedBy?.role === 'super_admin');

  // Additional calculations for enhanced stats
  const urgentTasks = teamTasks.filter(t =>
    normalizePriority(t.priority) === 'urgent' && normalizeTaskStatus(t.status) !== 'completed'
  ).length;
  const teamOverdueTasks = teamTasks.filter(t =>
    isTaskOverdue(t) && normalizeTaskStatus(t.status) !== 'completed' && normalizeTaskStatus(t.status) !== 'blocked'
  ).length;
  const myOverdueTasks = myTasks.filter(t =>
    isTaskOverdue(t) && normalizeTaskStatus(t.status) !== 'completed' && normalizeTaskStatus(t.status) !== 'blocked'
  ).length;
  const overviewOverdue = Number(overviewTasks?.overdue ?? overviewTasks?.overdueTasks ?? NaN);
  const overdueTasks = Number.isFinite(overviewOverdue)
    ? Math.max(0, overviewOverdue - myOverdueTasks)
    : teamOverdueTasks;
  const completionRate = teamTasks.length > 0
    ? Math.round((teamCompletedTasks / teamTasks.length) * 100)
    : 0;
  const todayCreatedTasks = Number(overviewTasks?.todayCreated ?? departmentTasks.filter(t => {
    const today = new Date();
    const taskCreatedDate = t.createdAt ? new Date(t.createdAt) : new Date();
    return taskCreatedDate.toDateString() === today.toDateString();
  }).length);

  // Filter out completed and blocked tasks from recent tasks display using backend data
  const recentTasksForDashboard = hodDepartmentTasksData?.filter((t: any) => {
    const status = normalizeTaskStatus(t.status);
    return status !== 'completed' && status !== 'blocked';
  }) || departmentTasks.filter(t => {
    const status = normalizeTaskStatus(t.status);
    return status !== 'completed' && status !== 'blocked';
  });
  const recentTasksSource = Array.isArray(overviewTasks?.recent)
    ? overviewTasks?.recent
    : recentTasksForDashboard;
  const recentTasks = recentTasksSource.filter(task => {
    const assignedIds = getAssignedIds(task);
    const assignedToTeam = assignedIds.some(id => teamMemberIds.includes(String(id)));
    if (!assignedToTeam) return false;
    if (!currentUserId) return true;
    return !assignedIds.some(id => String(id) === String(currentUserId));
  }).slice(0, 5);

  // Calculate recent tasks count for stats
  const activeTasksCount = recentTasks.length;

  const stats = [
    {
      title: 'Team Members',
      value: activeMembers,
      total: totalMembers,
      icon: Users,
      description: 'Active team members',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50'
    },
    {
      title: 'Active Tasks',
      value: activeTasksCount,
      total: totalTasks,
      icon: Activity,
      description: 'Recent active tasks',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/50'
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      total: completedTasks,
      icon: BarChart3,
      description: 'Tasks completed',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/50'
    },
    {
      title: 'Urgent Tasks',
      value: urgentTasks,
      total: totalTasks,
      icon: Zap,
      description: 'Need attention',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50'
    },
    {
      title: 'Overdue',
      value: overdueTasks,
      total: totalTasks,
      icon: Timer,
      description: 'Past deadline',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50'
    }
  ];
  const recentLeaveRequests = Array.isArray(hodOverviewData?.leaves?.recent)
    ? hodOverviewData?.leaves?.recent
    : departmentLeaveRequests.slice(0, 3);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'blocked': return 'destructive';
      case 'assigned': return 'outline';
      default: return 'outline';
    }
  };

  // Show loading state if any critical data is loading
  const isLoading = hodOverviewLoading || hodTasksLoading || hodDeptTasksLoading || hodMembersLoading;
  const hasAnyData = hodOverviewData || hodPersonalTasksData || hodDepartmentTasksData || hodMembersData;

  // Show skeleton loading when:
  // 1. Any data is loading, OR
  // 2. No data has been loaded yet (initial state), OR
  // 3. Critical overview data is still loading, OR
  // 4. Minimum loading time hasn't passed yet
  if (isLoading || !hasAnyData || hodOverviewLoading || !minimumLoadTimePassed) {
    return (
      <div className="space-y-6">
        {/* Welcome Header Skeleton */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 bg-blue-200 dark:bg-blue-800 rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-blue-100 dark:bg-blue-900 rounded w-48 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-gray-800/60 rounded-lg border">
                <div className="w-4 h-4 bg-green-200 dark:bg-green-800 rounded animate-pulse"></div>
                <div className="h-3 bg-green-200 dark:bg-green-800 rounded w-8 animate-pulse"></div>
              </div>
              <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900 opacity-50" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent className="relative">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Tasks Skeleton */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                      </div>
                      <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="space-y-1">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Sidebar Skeleton */}
          <div className="space-y-6">
            {/* Team Overview Skeleton */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Skeleton */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Productivity Metrics Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="w-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
            <p className="text-xs text-muted-foreground mt-2">Fetching department information, tasks, and team data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Update Indicator */}
      {isLoading && hasAnyData && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-blue-700 dark:text-blue-300">Updating dashboard data...</span>
          </div>
        </div>

      )}

      {/* Error Display */}
      {(hodOverviewError || hodTasksError || hodDeptTasksError || hodMembersError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
          <h3 className="font-bold text-red-800 mb-2">⚠️ Some data could not be loaded:</h3>
          <div className="text-xs text-red-700 space-y-1">
            {hodOverviewError && <div>• Department overview: {hodOverviewError.message}</div>}
            {hodTasksError && <div>• Personal tasks: {hodTasksError.message}</div>}
            {hodDeptTasksError && <div>• Department tasks: {hodDeptTasksError.message}</div>}
            {hodMembersError && <div>• Team members: {hodMembersError.message}</div>}
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, {currentUser?.name}! 👋
            </h1>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Head of {userDepartment?.name || 'Department'}
            </p>
            <div className="text-sm text-blue-600 dark:text-blue-400 mt-2">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Real-time Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-green-200 dark:border-green-800">
              <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">Live</span>
            </div>

            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: userDepartment?.color || '#3B82F6' }}
            >
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <div className={`absolute inset-0 ${stat.bgColor} opacity-30`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks - Compact Design */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Recent Tasks
              {hodDeptTasksLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              )}
              <Badge variant="outline" className="ml-2">
                {recentTasksForDashboard.length}
              </Badge>
              {departmentTasks.filter(t => t.status === 'completed').length > 0 && (
                <Badge variant="outline" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {departmentTasks.filter(t => t.status === 'completed').length} completed
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onTabChange) {
                    onTabChange('tasks');
                    toast({
                      title: '📋 Navigating to Task Management',
                      description: 'Opening task management section',
                    });
                  }
                }}
                className="hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
              >
                Add Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onTabChange) {
                    onTabChange('tasks');
                    toast({
                      title: '📋 Navigating to Task Management',
                      description: 'Opening task management section',
                    });
                  }
                }}
                className="hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.length > 0 ? recentTasks.map((task: any) => {
                const assignedUser = hodMembersData?.find((u: any) => u.id === task.assignedTo?.id) || { name: task.assignedTo?.name || 'Unknown' };
                const timeRemaining = getTimeRemaining(task.dueDate);
                const createdDate = getCreatedDate(task.createdAt);

                return (
                  <div key={task.id} className={`p-4 rounded-lg border ${task.status === 'completed'
                    ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800 opacity-75'
                    : task.assignedByRole === 'super_admin'
                      ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                      : timeRemaining.isOverdue
                        ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
                        : 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                    } hover:shadow-md transition-all duration-200 ${task.status === 'completed' ? 'line-through' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className={`font-semibold ${task.status === 'completed' ? 'text-green-700 dark:text-green-300' : ''}`}>
                            {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500 inline mr-1" />}
                            {task.title}
                          </h4>
                          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                            {task.priority}
                          </Badge>
                          {task.assignedByRole === 'super_admin' && (
                            <Badge variant="destructive" className="text-xs flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              SA
                            </Badge>
                          )}
                          {task.status === 'completed' && (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              ✓ Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                          {task.description}
                        </p>
                      </div>

                      {/* Status Display */}
                      <div className="flex items-center gap-2 ml-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' :
                            task.status === 'in_progress' ? 'bg-blue-500' :
                              task.status === 'assigned' ? 'bg-yellow-500' :
                                task.status === 'blocked' ? 'bg-red-500' :
                                  'bg-gray-400'
                            }`}></div>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-xs">Assigned to:</p>
                          <p className="text-muted-foreground text-xs">{assignedUser?.name || 'Unknown'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <UserCheck className="h-3 w-3 text-blue-500" />
                        <div>
                          <p className="font-medium text-xs">Assigned by:</p>
                          <p className="text-muted-foreground text-xs">
                            {task.assignedBy?.name || task.assignedBy?.firstName + ' ' + task.assignedBy?.lastName || 'Unknown'}
                          </p>
                          {task.assignedBy?.role && (
                            <Badge
                              variant="outline"
                              className="text-xs px-2 py-0 mt-1 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                            >
                              {task.assignedBy.role.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-xs">Created:</p>
                          <p className="text-muted-foreground text-xs">{createdDate}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Timer className={`h-3 w-3 ${timeRemaining.color}`} />
                        <div>
                          <p className="font-medium text-xs">Due:</p>
                          <div className="flex items-center gap-1">
                            <p className="text-muted-foreground text-xs">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</p>
                            {task.status !== 'completed' && (
                              <Badge
                                variant={timeRemaining.isOverdue ? "destructive" : "outline"}
                                className={`text-xs ${timeRemaining.color} px-1 py-0`}
                              >
                                {timeRemaining.isOverdue ? '🚨 Overdue' : `⏰ ${timeRemaining.text}`}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }) : departmentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                  <p className="text-muted-foreground mb-4">No tasks found for your department</p>
                  <Button variant="outline">
                    Create First Task
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-green-600">All department tasks completed! 🎉</h3>
                  <p className="text-muted-foreground mb-2">
                    {departmentTasks.filter(t => t.status === 'completed').length} completed task{departmentTasks.filter(t => t.status === 'completed').length > 1 ? 's' : ''} moved to Department Tasks → Complete tab
                  </p>
                  <Button variant="outline">
                    Create New Task
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Overview & Quick Actions */}
        <div className="space-y-6">
          {/* Team Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Overview
                {hodMembersLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {hodMembersLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading team members...</p>
                  </div>
                ) : teamMembers.slice(0, 5).map((member: any) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {member.name ? member.name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name || `${member.firstName} ${member.lastName}`}</p>
                      <p className="text-xs text-muted-foreground">{member.role?.replace('_', ' ') || 'Member'}</p>
                    </div>
                    <div className="flex items-center">
                      {member.isActive ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
                {teamMembers.length > 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                    onClick={() => {
                      if (onTabChange) {
                        onTabChange('team');
                        toast({
                          title: '👥 Navigating to Team Management',
                          description: 'Opening team management section',
                        });
                      }
                    }}
                  >
                    View All ({teamMembers.length} members)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="justify-start h-auto p-3 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                  onClick={handleScheduleMeeting}
                >
                  <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Schedule Meeting</div>
                    <div className="text-xs text-muted-foreground">Plan team discussions</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto p-3 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                  onClick={handleCreateTask}
                >
                  <ClipboardList className="h-4 w-4 mr-2 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Create Task</div>
                    <div className="text-xs text-muted-foreground">Assign new work</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto p-3 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
                  onClick={handleTeamReview}
                >
                  <Users className="h-4 w-4 mr-2 text-purple-600" />
                  <div className="text-left">
                    <div className="font-medium">Team Review</div>
                    <div className="text-xs text-muted-foreground">Check team performance</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto p-3 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors"
                  onClick={handleViewAnalytics}
                >
                  <BarChart3 className="h-4 w-4 mr-2 text-orange-600" />
                  <div className="text-left">
                    <div className="font-medium">View Analytics</div>
                    <div className="text-xs text-muted-foreground">Department analytics</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Dashboard Elements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Productivity Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Task Completion Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={completionRate} className="w-20 h-2" />
                  <span className="text-sm font-medium">{completionRate}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">On-Time Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={Math.max(0, 100 - (overdueTasks / totalTasks) * 100)} className="w-20 h-2" />
                  <span className="text-sm font-medium">
                    {Math.round(Math.max(0, 100 - (overdueTasks / totalTasks) * 100))}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Team Efficiency</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={(activeMembers / totalMembers) * 100} className="w-20 h-2" />
                  <span className="text-sm font-medium">
                    {Math.round((activeMembers / totalMembers) * 100)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Priority Tasks Handled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={urgentTasks > 0 ? ((totalTasks - urgentTasks) / totalTasks) * 100 : 100}
                    className="w-20 h-2"
                  />
                  <span className="text-sm font-medium">
                    {urgentTasks > 0 ? Math.round(((totalTasks - urgentTasks) / totalTasks) * 100) : 100}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Generate some activity based on today's tasks */}
              {todayCreatedTasks > 0 && (
                <div className="flex items-center gap-3 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New Tasks Created</p>
                    <p className="text-xs text-muted-foreground">
                      {todayCreatedTasks} new task{todayCreatedTasks > 1 ? 's' : ''} added today
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">Today</span>
                </div>
              )}

              {completedTasks > 0 && (
                <div className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Tasks Completed</p>
                    <p className="text-xs text-muted-foreground">
                      {completedTasks} task{completedTasks > 1 ? 's' : ''} finished this period
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">Recent</span>
                </div>
              )}

              {urgentTasks > 0 && (
                <div className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Urgent Tasks Pending</p>
                    <p className="text-xs text-muted-foreground">
                      {urgentTasks} urgent task{urgentTasks > 1 ? 's' : ''} need{urgentTasks === 1 ? 's' : ''} attention
                    </p>
                  </div>
                  <span className="text-xs text-red-600">Action Required</span>
                </div>
              )}

              {todayMeetings > 0 && (
                <div className="flex items-center gap-3 p-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Meetings Today</p>
                    <p className="text-xs text-muted-foreground">
                      {todayMeetings} meeting{todayMeetings > 1 ? 's' : ''} scheduled for today
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">Today</span>
                </div>
              )}

              {overdueTasks > 0 && (
                <div className="flex items-center gap-3 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Overdue Tasks</p>
                    <p className="text-xs text-muted-foreground">
                      {overdueTasks} task{overdueTasks > 1 ? 's' : ''} past deadline
                    </p>
                  </div>
                  <span className="text-xs text-orange-600">Overdue</span>
                </div>
              )}

              {/* If no activity, show placeholder */}
              {todayCreatedTasks === 0 && completedTasks === 0 && urgentTasks === 0 && todayMeetings === 0 && overdueTasks === 0 && (
                <div className="text-center py-6">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
