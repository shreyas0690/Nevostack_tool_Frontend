import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Clock,
  AlertCircle,
  BarChart3,
  Zap,
  Activity,
  Timer,
  Crown,
  UserCheck,
  CheckCircle2,
  Wifi,
  Building2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useManager } from '@/hooks/useManager';
import useHODManagement from '@/hooks/useHODManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ManagerDashboardOverviewProps {
  onNavigate?: (tab: string) => void;
}

export default function ManagerDashboardOverview({ onNavigate }: ManagerDashboardOverviewProps) {
  const { currentUser } = useAuth();

  // Use HOD management to get department users, then filter for manager's team
  const { departmentUsers, department: userDepartment, isLoading: hodLoading, error: hodError } = useHODManagement(currentUser?.departmentId);

  // Get dashboard data from manager hook
  const {
    dashboardData,
    isLoading: managerLoading,
    dashboardError,
    refreshData
  } = useManager();

  // Filter department users to get only this manager's team members
  const managerTeamMembers = departmentUsers?.filter(user =>
    user.managerId === currentUser?.id || user.managerId === (currentUser as any)?._id
  ) || [];

  // Combine manager + team members for display
  const allTeamMembers = currentUser ? [currentUser, ...managerTeamMembers] : managerTeamMembers;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTaskTab, setActiveTaskTab] = useState('all');

  // Update current time every minute for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(timer);
  }, []);

    // Helper function to calculate time remaining with real-time countdown
  const getTimeRemaining = (dueDate: Date) => {
    const now = currentTime;
    const diff = dueDate.getTime() - now.getTime();

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
    const diff = now.getTime() - createdAt.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return createdAt.toLocaleDateString();
    }
  };

  // Function to handle task status update (would need backend integration)
  const updateTaskStatus = (taskId: string, newStatus: string) => {
    // TODO: Implement backend task status update
    console.log(`Task ${taskId} status update to ${newStatus} - backend integration needed`);
  };
  
  // Create combined team tasks (manager + team members)
  const createTeamTasks = () => {
    const allTasks = [];
    
    // Add manager's tasks (if any from backend)
    if (dashboardData?.recentTasks) {
      const managerTasks = dashboardData.recentTasks.filter(task => 
        task.assignedTo._id === currentUser?.id || task.assignedTo._id === (currentUser as any)?._id
      );
      allTasks.push(...managerTasks);
    }
    
    // Add team members' tasks (if any from backend)
    if (dashboardData?.recentTasks) {
      const teamMemberTasks = dashboardData.recentTasks.filter(task => {
        const isNotManagerTask = task.assignedTo._id !== currentUser?.id && task.assignedTo._id !== (currentUser as any)?._id;
        const isTeamMemberTask = managerTeamMembers.some(member => {
          const memberId = (member as any)._id || member.id;
          const taskAssignedTo = task.assignedTo._id;
          return memberId === taskAssignedTo;
        });
        return isNotManagerTask && isTeamMemberTask;
      });
      allTasks.push(...teamMemberTasks);
    }
    
    // Filter tasks to show only active tasks (not completed, not blocked, not overdue)
    const activeTasks = allTasks.filter(task => {
      const isNotCompleted = task.status !== 'completed';
      const isNotBlocked = task.status !== 'blocked';
      const isNotOverdue = !task.dueDate || new Date(task.dueDate) >= currentTime;
      return isNotCompleted && isNotBlocked && isNotOverdue;
    });
    
    // Sort by creation date (most recent first)
    return activeTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const teamTasks = createTeamTasks();
  
  // Calculate team-wide statistics from backend data
  const teamSize = managerTeamMembers.length + 1; // +1 for manager
  const totalTeamTasks = teamTasks.length; // Use actual filtered task count
  const teamCompletionRate = dashboardData?.completionRate || 0;
  const completedTeamTasks = Math.round((totalTeamTasks * teamCompletionRate) / 100);
  const urgentTeamTasks = dashboardData?.urgent?.count || 0;
  const overdueTeamTasks = dashboardData?.overdue?.count || 0;

  // Use backend data and team members count
  const stats = [
    {
      title: 'Team Members',
      value: teamSize,
      total: teamSize,
      icon: Users,
      description: `Manager + ${managerTeamMembers.length} team members`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50'
    },
    {
      title: 'Team Tasks',
      value: teamTasks.length,
      total: teamTasks.length,
      icon: Activity,
      description: 'All active tasks in team',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/50'
    },
    {
      title: 'Completion Rate',
      value: `${teamCompletionRate}%`,
      total: completedTeamTasks,
      icon: BarChart3,
      description: `Team completed ${completedTeamTasks} of ${totalTeamTasks} tasks`,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/50'
    },
    {
      title: 'Urgent Tasks',
      value: urgentTeamTasks,
      total: totalTeamTasks,
      icon: Zap,
      description: 'Team urgent tasks needing attention',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50'
    },
    {
      title: 'Overdue',
      value: overdueTeamTasks,
      total: totalTeamTasks,
      icon: Timer,
      description: 'Team tasks past deadline',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50'
    }
  ];

  // Per-member breakdown for Team Overview (manager + team members from department)
  const perMemberStats = allTeamMembers?.map(member => ({
    member: {
      id: (member as any)._id || member.id,
      name: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email,
      email: member.email,
      role: member.role,
      departmentId: (member.departmentId as any)?._id || member.departmentId,
      isActive: member.isActive !== undefined ? member.isActive : true
    },
    total: 0, // TODO: Get task stats from backend
    completed: 0,
    urgent: 0,
    overdue: 0,
    completionRate: 0
  })) || [];

  console.log('Manager Dashboard - Per Member Stats:', perMemberStats);

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

  // Show loading state
  if (hodLoading || managerLoading) {
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

  // Show error state
  if (dashboardError || hodError) {
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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, {currentUser?.name}! 👋
            </h1>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Team Performance Dashboard - Managing {teamSize} team members
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
                Team Tasks
              {managerLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              )}
                <Badge variant="outline" className="ml-2">
                {teamTasks.length}
              </Badge>
              {teamTasks.filter(t => t.status === 'completed').length > 0 && (
                <Badge variant="outline" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {teamTasks.filter(t => t.status === 'completed').length} completed
                </Badge>
              )}
              </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('tasks');
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
                  if (onNavigate) {
                    onNavigate('tasks');
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
              {teamTasks.length > 0 ? teamTasks.map((task) => {
                const assignedUser = {
                  name: `${task.assignedTo.firstName} ${task.assignedTo.lastName}`,
                  email: task.assignedTo.email
                };
                const timeRemaining = getTimeRemaining(new Date(task.dueDate));
                const isManagerTask = task.assignedTo._id === currentUser?.id;
                const isTeamMemberTask = !isManagerTask && managerTeamMembers.some(member => 
                  (member as any)._id === task.assignedTo._id || (member as any).id === task.assignedTo._id
                );
                const createdDate = new Date(task.createdAt).toLocaleDateString();
                
                
                return (
                  <div key={task._id} className={`p-4 rounded-lg border ${
                    task.status === 'completed'
                      ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800 opacity-75'
                      : isManagerTask 
                        ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                        : isTeamMemberTask 
                          ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                          : timeRemaining.isOverdue 
                            ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
                            : 'bg-gray-50/30 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800'
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
                          {isManagerTask && (
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300 flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              Manager
                            </Badge>
                          )}
                          {isTeamMemberTask && (
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Team Member
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
                          <div className={`w-2 h-2 rounded-full ${
                            task.status === 'completed' ? 'bg-green-500' :
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
                        <Calendar className="h-3 w-3 text-muted-foreground" />
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
              }) : teamTasks.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No active team tasks found</h3>
                  <p className="text-muted-foreground mb-4">
                    No recent active tasks found for you or your team members. 
                    Tasks that are completed, blocked, or overdue are not shown here.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate('tasks');
                      }
                    }}
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
                ) : allTeamMembers.slice(0, 5).map((member: any) => {
                  const isManager = member.id === currentUser?.id || member._id === currentUser?.id;
                  return (
                    <div key={member.id || member._id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                          {member.name ? member.name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{member.name || `${member.firstName} ${member.lastName}`}</p>
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
                {allTeamMembers.length > 5 && (
                  <div className="text-center pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('team');
                        }
                      }}
                    >
                      View All {allTeamMembers.length} Members
                  </Button>
                  </div>
                )}
                {allTeamMembers.length === 0 && (
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
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('meetings');
                    }
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Schedule Meeting</div>
                    <div className="text-xs text-muted-foreground">Plan team discussions</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-3 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('tasks');
                    }
                  }}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Create Task</div>
                    <div className="text-xs text-muted-foreground">Assign new work</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-3 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('team');
                    }
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Team Review</div>
                    <div className="text-xs text-muted-foreground">Check team performance</div>
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
              Team Productivity
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
                  <Progress value={dashboardData?.completionRate || 0} className="w-20 h-2" />
                  <span className="text-sm font-medium">{dashboardData?.completionRate || 0}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">On-Time Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={Math.max(0, 100 - ((dashboardData?.overdue?.count || 0) / Math.max(dashboardData?.teamTasks || 1, 1)) * 100)} className="w-20 h-2" />
                  <span className="text-sm font-medium">
                    {Math.round(Math.max(0, 100 - ((dashboardData?.overdue?.count || 0) / Math.max(dashboardData?.teamTasks || 1, 1)) * 100))}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Team Utilization</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={(dashboardData?.teamMembers || 0) > 0 ? ((dashboardData?.teamTasks || 0) / (dashboardData?.teamMembers || 1)) * 10 : 0} className="w-20 h-2" />
                  <span className="text-sm font-medium">
                    {(dashboardData?.teamMembers || 0) > 0 ? Math.round(((dashboardData?.teamTasks || 0) / (dashboardData?.teamMembers || 1)) * 10) : 0}%
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
              {(dashboardData?.teamTasks || 0) > 0 && (
                <div className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Team Tasks Active</p>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData?.teamTasks || 0} task{(dashboardData?.teamTasks || 0) > 1 ? 's' : ''} in progress
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
              )}

              {(dashboardData?.urgent?.count || 0) > 0 && (
                <div className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Urgent Tasks Pending</p>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData?.urgent?.count || 0} urgent task{(dashboardData?.urgent?.count || 0) > 1 ? 's' : ''} need attention
                    </p>
                  </div>
                  <span className="text-xs text-red-600">Action Required</span>
                </div>
              )}

              {(dashboardData?.overdue?.count || 0) > 0 && (
                <div className="flex items-center gap-3 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Overdue Tasks</p>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData?.overdue?.count || 0} task{(dashboardData?.overdue?.count || 0) > 1 ? 's' : ''} past deadline
                    </p>
                  </div>
                  <span className="text-xs text-orange-600">Overdue</span>
                </div>
              )}

              {/* If no activity, show placeholder */}
              {(dashboardData?.teamTasks || 0) === 0 && (dashboardData?.urgent?.count || 0) === 0 && (dashboardData?.overdue?.count || 0) === 0 && (
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


