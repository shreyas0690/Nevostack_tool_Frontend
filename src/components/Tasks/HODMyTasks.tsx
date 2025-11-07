import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { userService } from '@/services/userService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  Search, 
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Crown,
  Shield,
  UserCheck,
  Timer,
  CalendarDays,
  CheckCircle2,
  Paperclip,
  File
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { mockUsers } from '@/data/mockData';

export default function HODMyTasks() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [usersState, setUsersState] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedByFilter, setAssignedByFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('recent');
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // Update current time every 30 seconds for more accurate countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(timer);
  }, []);

    // Helper: normalize various date shapes into Date
  const normalizeDate = (d: any) => {
    if (!d) return new Date(0);
    if (d instanceof Date) return d;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? new Date(0) : parsed;
  };

    // Helper function to calculate time remaining with real-time countdown
  const getTimeRemaining = (dueDate: any) => {
    const now = currentTime;
    const due = normalizeDate(dueDate);
    const diff = due.getTime() - now.getTime();

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

  // Helper function to get formatted creation date — always show actual date to avoid ambiguity
  const getCreatedDate = (createdAt: any) => {
    const created = normalizeDate(createdAt);
    return created.toLocaleDateString();
  };

  // Function to update task status (optimistic update + persist to backend)
  const { toast } = useToast();

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    if (!taskId) {
      console.warn('updateTaskStatus called without taskId — aborting to avoid updating all tasks');
      return;
    }

    const idStr = String(taskId);
    const previous = tasks;

    // Set loading state
    setUpdatingTaskId(idStr);

    // Optimistic update
    setTasks(prevTasks =>
      prevTasks.map(task =>
        String(task.id || task._id) === idStr
          ? { ...task, status: newStatus as any, updatedAt: new Date() }
          : task
      )
    );

    try {
      await taskService.updateTaskStatus(idStr, newStatus as any);
      // refresh from server
      if (typeof refetchTasks === 'function') refetchTasks();
      toast({ title: 'Status updated', description: 'Task status updated successfully.' });
    } catch (err: any) {
      // rollback optimistic update
      setTasks(previous);
      console.error('Failed to update task status', err);
      toast({ title: 'Update failed', description: err?.message || 'Failed to update task status', variant: 'destructive' });
    } finally {
      // Clear loading state
      setUpdatingTaskId(null);
    }
  };

  // Update by object reference (safe when tasks may not have stable id fields)
  const updateTaskStatusByRef = (targetTask: any, newStatus: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => task === targetTask ? { ...task, status: newStatus as any, updatedAt: new Date() } : task)
    );
  };

  // Get tasks assigned TO the current HOD user (filter applied server-side)
  const { data: tasksData = [], isLoading: isLoadingTasks, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', 'my', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      const res = await taskService.getTasks(1, 1000, { assignedTo: currentUser.id });
      return (res as any).tasks || (res as any).data || (res as any).data?.tasks || [];
    },
    enabled: !!currentUser
  });

  useEffect(() => {
    setTasks(Array.isArray(tasksData) ? tasksData : []);
  }, [tasksData]);

  // fetch users for resolving assignedBy names
  const { data: usersData = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', currentUser?.companyId],
    queryFn: async () => {
      if (!currentUser) return [];
      const res = await userService.getUsers({ companyId: currentUser.companyId, limit: 1000 });
      return (res as any).users || (res as any).data || (res as any).data?.users || [];
    },
    enabled: !!currentUser
  });

  useEffect(() => { setUsersState(Array.isArray(usersData) ? usersData : []); }, [usersData]);

  // local helper to resolve assignedBy user from fetched users
  const resolveAssignedByUser = (id: any) => usersState.find((u:any) => (u.id || u._id) == id) || mockUsers.find((u:any) => u.id == id) || null;

  // Helper to get a display name for the assignedBy field (handles id, object, and various name properties)
  const getAssignedByName = (assignedBy: any) => {
    if (!assignedBy) return 'Unknown';
    // If assignedBy is an object from the task
    if (typeof assignedBy === 'object') {
      return assignedBy.name || assignedBy.fullName ||
        (assignedBy.firstName && assignedBy.lastName ? `${assignedBy.firstName} ${assignedBy.lastName}` : null) ||
        assignedBy.email || assignedBy.username || 'Unknown';
    }

    // If assignedBy is an id
    const user = resolveAssignedByUser(assignedBy);
    if (user) {
      return user.name || user.fullName ||
        (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null) ||
        user.email || user.username || 'Unknown';
    }

    return 'Unknown';
  };

  // Show loading state while data is being fetched
  if (isLoadingTasks || isLoadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Loading My Tasks</p>
            <p className="text-muted-foreground">
              {isLoadingTasks && !isLoadingUsers && 'Fetching your tasks...'}
              {!isLoadingTasks && isLoadingUsers && 'Loading team information...'}
              {isLoadingTasks && isLoadingUsers && 'Loading tasks and team data...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state when no tasks data is available yet
  if (!tasksData && !tasks.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Preparing Your Tasks</p>
            <p className="text-muted-foreground">Setting up your task dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Get tasks assigned TO the current HOD user
  const myTasks = tasks.filter(t => {
    const assignedToId = typeof t.assignedTo === 'string' ? t.assignedTo : (t.assignedTo && (t.assignedTo.id || t.assignedTo._id));
    return String(assignedToId) === String(currentUser?.id);
  });

  // Get tasks by category
  const recentTasks = myTasks.filter(t => t.status !== 'completed' && t.status !== 'blocked' && !getTimeRemaining(t.dueDate).isOverdue);
  const completedTasks = myTasks.filter(t => t.status === 'completed');
  const overdueTasks = myTasks.filter(t => getTimeRemaining(t.dueDate).isOverdue && t.status !== 'completed' && t.status !== 'blocked');
  const blockedTasks = myTasks.filter(t => t.status === 'blocked');

  // Get current tab tasks
  const getCurrentTabTasks = () => {
    switch (activeTab) {
      case 'recent': return recentTasks;
      case 'completed': return completedTasks;
      case 'overdue': return overdueTasks;
      case 'blocked': return blockedTasks;
      default: return recentTasks;
    }
  };

  // Filter tasks based on current tab
  const filteredTasks = getCurrentTabTasks().filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesAssignedBy = assignedByFilter === 'all' || 
                             (assignedByFilter === 'super_admin' && task.assignedByRole === 'super_admin') ||
                             (assignedByFilter === 'admin' && task.assignedByRole === 'admin') ||
                             (assignedByFilter === 'manager' && task.assignedByRole === 'manager');

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignedBy;
  });

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'blocked': return <AlertCircle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getAssignedByIcon = (assignedByRole?: string) => {
    switch (assignedByRole) {
      case 'super_admin': return <Crown className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'manager': return <UserCheck className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getAssignedByColor = (assignedByRole?: string) => {
    switch (assignedByRole) {
      case 'super_admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'manager': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatAssignedByRole = (assignedByRole?: string) => {
    switch (assignedByRole) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'manager': return 'Manager';
      default: return 'Unknown';
    }
  };

  // Statistics
  const totalTasks = myTasks.length;
  const completedTasksCount = completedTasks.length;
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = myTasks.filter(t => t.status === 'assigned').length;
  const superAdminTasks = myTasks.filter(t => t.assignedByRole === 'super_admin').length;
  const overdueTasksCount = overdueTasks.length;

  const stats = [
    {
      title: 'Recent Tasks',
      value: recentTasks.length,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50'
    },
    {
      title: 'Completed',
      value: completedTasksCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/50'
    },
    {
      title: 'Overdue',
      value: overdueTasksCount,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50'
    },
    {
      title: 'Blocked',
      value: myTasks.filter(t => t.status === 'blocked').length,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-8 w-8 text-purple-600" />
            My Tasks
          </h1>
          <p className="text-muted-foreground">
            Tasks assigned directly to you as Head of Department
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Target className="w-4 h-4 mr-2" />
          {totalTasks} Personal Tasks
        </Badge>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Tasks ({recentTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed ({completedTasksCount})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Overdue ({overdueTasksCount})
          </TabsTrigger>
          <TabsTrigger value="blocked" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Blocked ({blockedTasks.length})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              {activeTab === 'recent' && 'Recent Tasks'}
              {activeTab === 'completed' && 'Completed Tasks'}
              {activeTab === 'overdue' && 'Overdue Tasks'}
              {activeTab === 'blocked' && 'Blocked Tasks'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={assignedByFilter} onValueChange={setAssignedByFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by assigned by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignments</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tasks List */}
            <TabsContent value={activeTab} className="mt-0">
              <div className="space-y-4">
                {filteredTasks.map((task) => {
                  const assignedByUser = resolveAssignedByUser(task.assignedBy);
                  const timeRemaining = getTimeRemaining(task.dueDate);
                  const createdDate = getCreatedDate(task.createdAt);
                  
                  return (
                    <Card key={task.id} className={`hover:shadow-md transition-shadow ${
                      task.status === 'completed'
                        ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                        : task.assignedByRole === 'super_admin' 
                          ? 'border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50/50 to-orange-50/50 dark:from-red-950/10 dark:to-orange-950/10' 
                          : timeRemaining.isOverdue
                            ? 'border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50/50 to-red-50/50 dark:from-orange-950/10 dark:to-red-950/10'
                            : ''
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className={`font-semibold text-lg ${task.status === 'completed' ? 'text-green-700 dark:text-green-300' : ''}`}>
                                {task.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500 inline mr-1" />}
                                {task.title}
                              </h3>
                              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                                {task.priority}
                              </Badge>
                              <Badge variant={getStatusColor(task.status)} className="text-xs flex items-center gap-1">
                                {getStatusIcon(task.status)}
                                {task.status.replace('_', ' ')}
                              </Badge>
                              {task.assignedByRole === 'super_admin' && (
                                <Badge className={`text-xs flex items-center gap-1 ${getAssignedByColor(task.assignedByRole)}`}>
                                  {getAssignedByIcon(task.assignedByRole)}
                                  Super Admin Task
                                </Badge>
                              )}
                              {task.status === 'completed' && (
                                <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  ✓ Completed
                                </Badge>
                              )}
                            </div>
                            <p className={`text-sm mb-4 ${task.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                              {task.description}
                            </p>
                          </div>
                          
                          {/* Status Selector */}
                          <div className="flex items-center gap-2 ml-4">
                            {updatingTaskId === String(task.id || task._id) ? (
                              <div className="flex items-center gap-2 w-32 px-3 py-2 border rounded-md bg-muted">
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                                <span className="text-xs text-muted-foreground">Updating...</span>
                              </div>
                            ) : (
                              <Select
                                value={task.status}
                                onValueChange={(value) => updateTaskStatus(String(task.id || task._id), value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="assigned">Assigned</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="blocked">Blocked</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            {/* Edit button intentionally removed for HOD My Tasks */}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Created:</p>
                              <p className="text-muted-foreground">{createdDate}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Timer className={`h-4 w-4 ${timeRemaining.color}`} />
                            <div>
                              <p className="font-medium">Due Date:</p>
                              <div className="flex items-center gap-2">
                                <p className="text-muted-foreground">{normalizeDate(task.dueDate).toLocaleDateString()}</p>
                                <Badge 
                                  variant={timeRemaining.isOverdue ? "destructive" : "outline"} 
                                  className={`text-xs ${timeRemaining.color}`}
                                >
                                  {timeRemaining.isOverdue ? '🚨 Overdue' : `⏰ ${timeRemaining.text}`}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getAssignedByIcon(task.assignedByRole)}
                            <div>
                              <p className="font-medium">Assigned by:</p>
                              <div className="flex items-center gap-2">
                                <p className="text-muted-foreground">{getAssignedByName(task.assignedBy) || assignedByUser?.name || 'Unknown'}</p>
                                <Badge className={`text-xs ${getAssignedByColor(task.assignedByRole)}`}>
                                  {formatAssignedByRole(task.assignedByRole)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Attachments Section */}
                        {task.attachments && task.attachments.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center gap-2 mb-2">
                              <Paperclip className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium text-sm">Attachments ({task.attachments.length})</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {task.attachments.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md border text-xs"
                                >
                                  <File className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate max-w-32">{attachment.name}</span>
                                  <span className="text-muted-foreground">
                                    ({Math.round(attachment.size / 1024)}KB)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                  {activeTab === 'recent' && <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                  {activeTab === 'completed' && <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                  {activeTab === 'overdue' && <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                  {activeTab === 'blocked' && <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                  <h3 className="text-lg font-medium mb-2">
                    {activeTab === 'recent' && 'No recent tasks found'}
                    {activeTab === 'completed' && 'No completed tasks found'}
                    {activeTab === 'overdue' && 'No overdue tasks found'}
                    {activeTab === 'blocked' && 'No blocked tasks found'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || assignedByFilter !== 'all'
                      ? 'Try adjusting your search filters'
                      : activeTab === 'recent'
                        ? 'You have no active tasks assigned to you'
                        : activeTab === 'completed'
                          ? 'You have not completed any tasks yet'
                          : activeTab === 'overdue'
                            ? 'You have no overdue tasks - great job!'
                            : 'You have no blocked tasks'}
                  </p>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
