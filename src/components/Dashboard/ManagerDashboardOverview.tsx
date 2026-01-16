import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Crown,
  Timer,
  CalendarDays,
  Activity,
  BarChart3,
  Zap,
  RefreshCw,
  Wifi,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useManager } from '@/hooks/useManager';
import useHODManagement from '@/hooks/useHODManagement';
import { useToast } from '@/hooks/use-toast';

interface ManagerDashboardOverviewProps {
  onNavigate?: (tab: string) => void;
}

export default function ManagerDashboardOverview({ onNavigate }: ManagerDashboardOverviewProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [minimumLoadTimePassed, setMinimumLoadTimePassed] = useState(false);

  // Use HOD management to get department users, then filter for manager's team
  const { departmentUsers, department: userDepartment, isLoading: hodLoading, error: hodError } = useHODManagement(currentUser?.departmentId);

  // Get dashboard data from manager hook
  const {
    dashboardData,
    teamMembers: managerTeamMembersData, // This has the stats we need
    teamLeaves,
    teamAttendance,
    isLoading: managerLoading,
    dashboardError,
    refreshData
  } = useManager();

  // Filter department users to get only this manager's team members (fallback if managerTeamMembersData is empty)
  const managerTeamMembers = useMemo(() => {
    console.log('[Manager Dashboard] managerTeamMembersData from useManager:', managerTeamMembersData);
    console.log('[Manager Dashboard] departmentUsers from useHODManagement:', departmentUsers);

    if (managerTeamMembersData && managerTeamMembersData.length > 0) {
      console.log('[Manager Dashboard] ✅ Using managerTeamMembersData (has taskStats)');
      return managerTeamMembersData;
    }

    console.log('[Manager Dashboard] ⚠️ Falling back to departmentUsers (NO taskStats) - this is why stats are zero!');
    return departmentUsers?.filter(user =>
      user.managerId === currentUser?.id || user.managerId === (currentUser as any)?._id
    ) || [];
  }, [managerTeamMembersData, departmentUsers, currentUser]);

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

  // Helper function to calculate time remaining with real-time countdown
  const getTimeRemaining = (dueDate?: Date | string | null) => {
    if (!dueDate) {
      return null;
    }

    const dueDateValue = new Date(dueDate);
    if (Number.isNaN(dueDateValue.getTime())) {
      return null;
    }

    const now = currentTime;
    const diff = dueDateValue.getTime() - now.getTime();

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
  const getCreatedDate = (createdAt: Date) => {
    const now = currentTime;
    const diff = now.getTime() - new Date(createdAt).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return new Date(createdAt).toLocaleDateString();
    }
  };

  // Recent team tasks (exclude manager tasks)
  const teamTasks = useMemo(() => {
    if (!dashboardData?.recentTasks) {
      return [];
    }

    const managerId = currentUser?.id || (currentUser as any)?._id;
    const tasks = dashboardData.recentTasks.filter(task => {
      const assignedId = task.assignedTo?._id;
      if (!assignedId || !managerId) {
        return true;
      }
      return assignedId !== managerId;
    });

    // Sort by creation date (most recent first)
    return tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [dashboardData, currentUser]);

  const recentTasks = useMemo(() => {
    return teamTasks.filter(task => {
      if (task.status === 'completed') {
        return false;
      }

      if (!task.dueDate) {
        return true;
      }

      const dueDate = new Date(task.dueDate);
      if (Number.isNaN(dueDate.getTime())) {
        return true;
      }

      return dueDate >= currentTime;
    });
  }, [teamTasks, currentTime]);

  // Use dashboardData if available (it has accurate aggregate stats)
  const aggregatedStats = useMemo(() => {
    console.log('[Manager Dashboard] Dashboard Data:', dashboardData);
    console.log('[Manager Dashboard] Team Members:', managerTeamMembers.length);

    if (dashboardData?.taskCounts) {
      const stats = {
        total: dashboardData.taskCounts.total || 0,
        completed: dashboardData.taskCounts.completed || 0,
        inProgress: dashboardData.taskCounts.inProgress || 0,
        urgent: dashboardData.taskCounts.urgent || 0,
        overdue: dashboardData.taskCounts.overdue || 0,
        assigned: dashboardData.taskCounts.assigned || 0,
        active: dashboardData.taskCounts.active || 0
      };

      console.log('[Manager Dashboard] ✅ Using dashboardData.taskCounts for stats:', stats);
      return stats;
    }

    if (dashboardData && dashboardData.teamTasks !== undefined) {
      console.log('[Manager Dashboard] ✅ Using dashboardData for stats');

      const totalTasks = dashboardData.teamTasks || 0;
      const completionRate = dashboardData.completionRate || 0;
      const completedTasks = totalTasks > 0
        ? Math.round((totalTasks * completionRate) / 100)
        : 0;
      const clampedCompleted = Math.min(Math.max(completedTasks, 0), totalTasks);
      const activeTasks = Math.max(totalTasks - clampedCompleted, 0);

      const stats = {
        total: totalTasks,
        completed: clampedCompleted,
        inProgress: activeTasks,
        urgent: dashboardData.urgent?.count || 0,
        overdue: dashboardData.overdue?.count || 0,
        assigned: 0,
        active: activeTasks
      };

      console.log('[Manager Dashboard] Stats from dashboardData:', stats);
      return stats;
    }

    const hasTaskStats = managerTeamMembers.length > 0 && managerTeamMembers.some((m: any) => m.taskStats);

    if (hasTaskStats) {
      console.log('[Manager Dashboard] Using taskStats from team members');
      const stats = managerTeamMembers.reduce((acc: any, member: any) => {
        if (member.taskStats) {
          acc.total += member.taskStats.total || 0;
          acc.completed += member.taskStats.completed || 0;
          acc.inProgress += member.taskStats.inProgress || 0;
          acc.urgent += member.taskStats.urgent || 0;
          acc.overdue += member.taskStats.overdue || 0;
          acc.assigned += member.taskStats.assigned || 0;
        }
        return acc;
      }, { total: 0, completed: 0, inProgress: 0, urgent: 0, overdue: 0, assigned: 0, active: 0 });

      stats.active = stats.inProgress + stats.assigned;

      console.log('[Manager Dashboard] Aggregated from taskStats:', stats);
      return stats;
    }

    console.log('[Manager Dashboard] ⚠️ Last resort: Calculating from teamTasks');
    const stats = {
      total: teamTasks.length,
      completed: teamTasks.filter(t => t.status === 'completed').length,
      inProgress: teamTasks.filter(t => t.status === 'in_progress').length,
      urgent: teamTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
      overdue: teamTasks.filter(t => {
        const dueDate = t.dueDate ? new Date(t.dueDate) : null;
        return dueDate && dueDate < currentTime && t.status !== 'completed';
      }).length,
      assigned: teamTasks.filter(t => t.status === 'assigned').length,
      active: 0
    };

    stats.active = stats.inProgress + stats.assigned;

    console.log('[Manager Dashboard] Calculated from teamTasks:', stats);
    return stats;
  }, [dashboardData, managerTeamMembers, teamTasks, currentTime]);

  const teamSize = managerTeamMembers.length; // Exclude manager

  // Calculate metrics from aggregated stats
  const activeMemberTasks = aggregatedStats.active ?? (aggregatedStats.inProgress + aggregatedStats.assigned);
  const completedMemberTasks = aggregatedStats.completed;
  const totalMemberTasks = aggregatedStats.total;

  const memberCompletionRate = totalMemberTasks > 0
    ? Math.round((completedMemberTasks / totalMemberTasks) * 100)
    : 0;

  const urgentMemberTasks = aggregatedStats.urgent;
  const overdueMemberTasks = aggregatedStats.overdue;

  console.log('[Manager Dashboard] Final Calculated Stats (MEMBERS ONLY):', {
    teamSize,
    activeMemberTasks,
    completedMemberTasks,
    totalMemberTasks,
    memberCompletionRate,
    urgentMemberTasks,
    overdueMemberTasks
  });

  // Use backend data and team members count
  const stats = [
    {
      title: 'Team Members',
      value: teamSize,
      total: teamSize,
      icon: Users,
      description: `${managerTeamMembers.length} team members`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      trend: '',
      trendUp: true
    },
    {
      title: 'Active Tasks',
      value: activeMemberTasks,
      total: totalMemberTasks,
      icon: Activity,
      description: 'Team active tasks',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/50',
      trend: '',
      trendUp: true
    },
    {
      title: 'Completion Rate',
      value: `${memberCompletionRate}%`,
      total: completedMemberTasks,
      icon: BarChart3,
      description: `Team completed ${completedMemberTasks} tasks`,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/50',
      trend: '',
      trendUp: true
    },
    {
      title: 'Urgent Tasks',
      value: urgentMemberTasks,
      total: totalMemberTasks,
      icon: Zap,
      description: 'Team urgent tasks',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50',
      trend: '',
      trendUp: false
    },
    {
      title: 'Overdue',
      value: overdueMemberTasks,
      total: totalMemberTasks,
      icon: Timer,
      description: 'Team overdue tasks',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50',
      trend: '',
      trendUp: true
    }
  ];

    const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  // Quick Actions Handlers
  const handleScheduleMeeting = () => {
    if (onNavigate) {
      onNavigate('meetings');
      toast({
        title: '📅 Navigating to Meetings',
        description: 'Opening meetings management section',
      });
    }
  };

  const handleCreateTask = () => {
    if (onNavigate) {
      onNavigate('tasks');
      toast({
        title: '📋 Navigating to Tasks',
        description: 'Opening task management section',
      });
    }
  };

  const handleTeamReview = () => {
    if (onNavigate) {
      onNavigate('team');
      toast({
        title: '👥 Navigating to Team',
        description: 'Opening team management section',
      });
    }
  };

  const handleViewAnalytics = () => {
    // Manager might not have a dedicated analytics tab yet, but we can point to reports
    if (onNavigate) {
      onNavigate('reports');
      toast({
        title: '📊 Navigating to Reports',
        description: 'Opening reports section',
      });
    }
  };

  // Show loading state
  const hasError = Boolean(dashboardError || hodError);
  const isLoading = hodLoading || managerLoading || !minimumLoadTimePassed;
  const hasAnyData = Boolean(dashboardData || managerTeamMembers.length > 0);

  if (hasError && !isLoading && !hasAnyData) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">
              Failed to Load Dashboard
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {dashboardError || hodError || 'Unable to load team data'}
            </p>
            <Button onClick={refreshData} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-blue-200 dark:bg-blue-800 rounded w-64 animate-pulse mb-2"></div>
              <div className="h-4 bg-blue-100 dark:bg-blue-900 rounded w-96 animate-pulse"></div>
            </div>
            <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Loading stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 animate-pulse mb-2"></div>
                <div className="h-3 bg-muted rounded w-24 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!hasAnyData) {
    return (
      <div className="space-y-6">
        <div className="bg-muted/30 p-6 rounded-lg border border-muted">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Team Data Yet</h2>
            <p className="text-muted-foreground mb-4">
              Add team members or assign tasks to see dashboard stats.
            </p>
            <Button onClick={refreshData} variant="outline">
              Refresh
            </Button>
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

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, {currentUser?.name}! 👋
            </h1>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Team Performance Dashboard - Managing {teamSize} team members
            </p>
            <div className="text-sm text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
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
            <Card key={stat.title} className="relative overflow-hidden hover:shadow-md transition-all duration-200">
              <div className={`absolute inset-0 ${stat.bgColor} opacity-30`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className={`flex items-center text-xs font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {stat.trend}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
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
              {managerLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              )}
              <Badge variant="outline" className="ml-2">
                {recentTasks.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate && onNavigate('tasks')}
                className="hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
              >
                Add Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate && onNavigate('tasks')}
                className="hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.length > 0 ? recentTasks.slice(0, 5).map((task) => {
                const assignedUser = {
                  name: `${task.assignedTo.firstName} ${task.assignedTo.lastName}`,
                  email: task.assignedTo.email
                };
                const timeRemaining = getTimeRemaining(task.dueDate);
                const timeColor = timeRemaining?.color || 'text-muted-foreground';
                const isManagerTask = task.assignedTo._id === currentUser?.id;
                const createdDate = getCreatedDate(task.createdAt);

                return (
                  <div key={task._id} className={`p-4 rounded-lg border ${isManagerTask
                    ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                    : 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                    } hover:shadow-md transition-all duration-200`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className={`font-semibold ${task.status === 'completed' ? 'text-green-700 dark:text-green-300' : ''}`}>
                            {task.title}
                          </h4>
                          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                            {task.priority}
                          </Badge>
                          {isManagerTask && (
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300 flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              Manager
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
                          <p className="text-muted-foreground text-xs">{assignedUser.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <UserCheck className="h-3 w-3 text-blue-500" />
                        <div>
                          <p className="font-medium text-xs">Assigned by:</p>
                          <p className="text-muted-foreground text-xs">
                            {task.assignedBy?.name || `${task.assignedBy?.firstName} ${task.assignedBy?.lastName}` || 'Unknown'}
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
                        <Timer className={`h-3 w-3 ${timeColor}`} />
                        <div>
                          <p className="font-medium text-xs">Due:</p>
                          <div className="flex items-center gap-1">
                            <p className="text-muted-foreground text-xs">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</p>
                            {timeRemaining && !timeRemaining.isOverdue && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${timeRemaining.color} px-1 py-0`}
                              >
                                ⏰ {timeRemaining.text}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }) : recentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No active team tasks found</h3>
                  <p className="text-muted-foreground mb-4">
                    No recent active tasks found for you or your team members.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => onNavigate && onNavigate('tasks')}
                  >
                    Create First Task
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Loading team tasks...</h3>
                  <p className="text-muted-foreground mb-4">Please wait while we fetch your team tasks</p>
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
                {managerLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {managerLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading team members...</p>
                  </div>
                ) : managerTeamMembers.slice(0, 5).map((member: any) => {
                  const isManager = member.id === currentUser?.id || member._id === currentUser?.id;
                  return (
                    <div key={member.id || member._id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {member.firstName ? member.firstName[0] + (member.lastName ? member.lastName[0] : '') : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{member.firstName} {member.lastName}</p>
                          {isManager && (
                            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                              <Crown className="w-3 h-3 mr-1" />
                              Manager
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{member.role?.replace('_', ' ') || 'Member'}</p>
                      </div>
                      <div className="flex items-center">
                        {member.isActive !== false ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
                {managerTeamMembers.length > 5 && (
                  <div className="text-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => onNavigate && onNavigate('team')}
                    >
                      View All {managerTeamMembers.length} Members
                    </Button>
                  </div>
                )}
                {managerTeamMembers.length === 0 && (
                  <div className="text-center py-6">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No team members found</p>
                  </div>
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
                    <div className="font-medium">View Reports</div>
                    <div className="text-xs text-muted-foreground">Team analytics</div>
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
                  <Progress value={memberCompletionRate} className="w-20 h-2" />
                  <span className="text-sm font-medium">{memberCompletionRate}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">On-Time Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={Math.max(0, 100 - (overdueMemberTasks / Math.max(totalMemberTasks, 1)) * 100)} className="w-20 h-2" />
                  <span className="text-sm font-medium">
                    {Math.round(Math.max(0, 100 - (overdueMemberTasks / Math.max(totalMemberTasks, 1)) * 100))}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Team Efficiency</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={75} className="w-20 h-2" />
                  <span className="text-sm font-medium">75%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Priority Tasks Handled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={urgentMemberTasks > 0 ? ((totalMemberTasks - urgentMemberTasks) / totalMemberTasks) * 100 : 100}
                    className="w-20 h-2"
                  />
                  <span className="text-sm font-medium">
                    {urgentMemberTasks > 0 ? Math.round(((totalMemberTasks - urgentMemberTasks) / totalMemberTasks) * 100) : 100}%
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
              {/* Generate some activity based on recent tasks */}
              {teamTasks.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString()).length > 0 && (
                <div className="flex items-center gap-3 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New Tasks Created</p>
                    <p className="text-xs text-muted-foreground">
                      {teamTasks.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString()).length} new tasks added today
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">Today</span>
                </div>
              )}

              {completedMemberTasks > 0 && (
                <div className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Tasks Completed</p>
                    <p className="text-xs text-muted-foreground">
                      {completedMemberTasks} tasks finished this period
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">Recent</span>
                </div>
              )}

              {urgentMemberTasks > 0 && (
                <div className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Urgent Tasks Pending</p>
                    <p className="text-xs text-muted-foreground">
                      {urgentMemberTasks} urgent tasks need attention
                    </p>
                  </div>
                  <span className="text-xs text-red-600">Action Required</span>
                </div>
              )}

              {overdueMemberTasks > 0 && (
                <div className="flex items-center gap-3 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Overdue Tasks</p>
                    <p className="text-xs text-muted-foreground">
                      {overdueMemberTasks} tasks past deadline
                    </p>
                  </div>
                  <span className="text-xs text-orange-600">Overdue</span>
                </div>
              )}

              {/* If no activity, show placeholder */}
              {teamTasks.length === 0 && (
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
