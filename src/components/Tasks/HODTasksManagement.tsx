import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TaskCard from './TaskCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ClipboardList, 
  Search, 
  Plus,
  Calendar,
  User,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Target,
  Crown,
  Shield,
  UserCheck,
  Timer,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Eye,
  UserPlus,
  Paperclip,
  File,
  XCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/Auth/AuthProvider';
import { mockUsers, mockDepartments } from '@/data/mockData';
import useHODManagement from '@/hooks/useHODManagement';
import { taskService } from '@/services/taskService';
import { userService } from '@/services/userService';
import { hodService } from '@/services/api/hodService';
import { useQuery } from '@tanstack/react-query';
import AssignTaskDialog from './AssignTaskDialog';

export default function HODTasksManagement() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedByFilter, setAssignedByFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('recent');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // Update current time every 30 seconds for more accurate countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(timer);
  }, []);

  // Normalize dates coming from mocks or API
  const normalizeDate = (d: any) => {
    if (!d) return new Date(0);
    if (d instanceof Date) return d;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? new Date(0) : parsed;
  };

  // Helper function to calculate time remaining with real-time countdown (accepts string/Date/null)
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

  // Helper function to get formatted creation date (accepts string or Date)
  const getCreatedDate = (createdAt: any) => {
    const created = normalizeDate(createdAt);
      return created.toLocaleDateString();
  };

  // Function to update task status (optimistic + persist to backend)
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    if (!taskId) {
      console.warn('updateTaskStatus called with empty taskId');
      try { alert('Unable to update task: missing task id'); } catch(e){}
      return;
    }

    // Set loading state
    setUpdatingTaskId(taskId);

    // keep snapshot for rollback
    const prev = [...tasks];

    // optimistic UI update (compare by either id or _id)
    setTasks(prevTasks => 
      prevTasks.map(task => 
        (String(task.id || task._id) === String(taskId))
          ? { ...task, status: newStatus as any, updatedAt: new Date() }
          : task
      )
    );

    try {
      const res: any = await taskService.updateTaskStatus(taskId, newStatus as any);

      // If backend returns the updated task, replace it in local state
      const updatedTask = res?.task || res?.data || res?.data?.task || null;
      if (updatedTask) {
        setTasks(prevTasks => prevTasks.map(t => (String(t.id || t._id) === String(updatedTask.id || updatedTask._id) ? ({
          ...t,
          ...updatedTask,
          dueDate: updatedTask.dueDate ? new Date(updatedTask.dueDate) : t.dueDate,
          createdAt: updatedTask.createdAt ? new Date(updatedTask.createdAt) : (t.createdAt ? new Date(t.createdAt) : new Date()),
          updatedAt: updatedTask.updatedAt ? new Date(updatedTask.updatedAt) : new Date()
        } as any) : t)));
      } else {
        // fallback: refetch department tasks to ensure consistency
        if (typeof refetchDeptTasks === 'function') await refetchDeptTasks();
      }
    } catch (err) {
      console.error('Failed to persist task status change:', err);
      // rollback optimistic update
      setTasks(prev);
      // surface error to user
      try { alert('Failed to update task status. Please try again.'); } catch(e){}
    } finally {
      // Clear loading state
      setUpdatingTaskId(null);
    }
  };

  // Function to add new task
  const handleAssignTask = (taskData: any) => {
    setTasks(prevTasks => [...prevTasks, taskData]);
    setShowAssignDialog(false);
  };

  // Find user's department id (support multiple shapes)
  // Support multiple possible shapes for department identifier on currentUser
  const userDeptId = currentUser?.departmentId ?? currentUser?.departmentId ?? (currentUser as any)?.deptId ?? (currentUser as any)?.department_id;
  // Prefer department data from HOD management hook (real backend) but fall back to mock data
  const {
    departmentUsers: hodDepartmentUsers,
    department: hodDepartment,
    isLoading: hodLoading,
    isLoadingUsers: hodLoadingUsers,
    isLoadingTasks: hodLoadingTasks
  } = useHODManagement(userDeptId);
  const userDepartment = hodDepartment || (userDeptId ? mockDepartments.find(d => String(d.id) === String(userDeptId)) : null);

  // Fetch department tasks from backend and filter by multiple possible department fields
  const { data: deptTasksData = [], refetch: refetchDeptTasks, error: deptError, isLoading: deptLoading, isFetching: deptFetching } = useQuery({
    queryKey: ['hod', 'departmentTasks', userDeptId],
    queryFn: async () => {
      if (!userDeptId) return [];
      // use HOD-specific service to request department tasks from backend
      const res = await hodService.getDepartmentTasks(String(userDeptId));
      console.log('HODTasksManagement - raw response from hodService.getDepartmentTasks:', res);
      // normalize many possible backend shapes: res could be { success, tasks: [...] } or { success, data: [...] } or raw array
      let tasksArr: any[] = [];
      if (Array.isArray(res)) tasksArr = res;
      else if (Array.isArray((res as any).tasks)) tasksArr = (res as any).tasks;
      else if (Array.isArray((res as any).data)) tasksArr = (res as any).data;
      else if (Array.isArray((res as any).data?.tasks)) tasksArr = (res as any).data.tasks;
      else tasksArr = [];

      // Normalize the tasks data
      try {
        const normalized = tasksArr.map((t: any) => ({
          ...t,
          id: t.id || t._id,
          assignedTo: typeof t.assignedTo === 'string' ? t.assignedTo : (t.assignedTo && (t.assignedTo._id || t.assignedTo.id)),
          assignedBy: typeof t.assignedBy === 'string' ? t.assignedBy : (t.assignedBy && (t.assignedBy._id || t.assignedBy.id)),
          departmentId: typeof (t.departmentId || t.department) === 'string' ? (t.departmentId || t.department) : ((t.departmentId && (t.departmentId._id || t.departmentId.id)) || (t.department && (t.department._id || t.department.id)) || null),
          dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date()
        }));
        return normalized;
      } catch (e) {
        console.warn('Failed to normalize tasksArr in queryFn', e);
        return tasksArr;
      }
    },
    enabled: !!userDeptId
  });

  // Update tasks state when data changes
  useEffect(() => {
    if (Array.isArray(deptTasksData)) {
      setTasks(deptTasksData);
    }
  }, [deptTasksData]);

  // Console-log fetched payload and normalized tasks for debugging
  useEffect(() => {
    try {
      console.log('HODTasksManagement: raw deptTasksData:', deptTasksData);
      console.log('HODTasksManagement: normalized tasks state:', tasks);
    } catch (e) {
      console.warn('HODTasksManagement: failed to log fetched tasks', e);
    }
  }, [deptTasksData, tasks]);

  // ensure we attempt a fresh fetch when dept id becomes available
  useEffect(() => {
    if (userDeptId && typeof refetchDeptTasks === 'function') {
      refetchDeptTasks();
    }
  }, [userDeptId, refetchDeptTasks]);

  // Debug: show fetched tasks info
  const fetchedCount = Array.isArray(deptTasksData) ? deptTasksData.length : 0;
  const firstSample = fetchedCount > 0 ? JSON.stringify(deptTasksData[0], null, 2) : 'no-sample';

  // Get department tasks: prefer fetched department tasks (tasks state) when available,
  // otherwise fall back to filtering by mock department metadata.
  const departmentTasks = Array.isArray(deptTasksData) && deptTasksData.length > 0
    ? tasks
    : (userDepartment ? tasks.filter(t => {
        const tidRaw = t.departmentId ?? t.department ?? t.deptId ?? t.department_id;
        const tid = typeof tidRaw === 'string' ? tidRaw : (tidRaw && (tidRaw._id || tidRaw.id));
        return String(tid) === String(userDepartment.id);
      }) : []);

  // Get department members for manager filtering - prefer fetched HOD users
  const departmentMembers = (hodDepartmentUsers && hodDepartmentUsers.length > 0)
    ? hodDepartmentUsers
    : (userDepartment ? mockUsers.filter(u => (userDepartment.memberIds || []).includes(u.id)) : []);

  // Fetch company users for resolving assignedBy names
  const { data: companyUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', currentUser?.companyId],
    queryFn: async () => {
      if (!currentUser) return [];
      const res = await userService.getUsers({ companyId: currentUser.companyId, limit: 1000 });
      return (res as any).users || (res as any).data || (res as any).data?.users || [];
    },
    enabled: !!currentUser
  });

  // Resolve assignedBy roles for tasks after we have user data
  const resolvedTasksWithRoles = departmentTasks.map((task: any) => {
    if (!task.assignedByRole && task.assignedBy) {
      const assignedById = typeof task.assignedBy === 'string' ? task.assignedBy : (task.assignedBy && (task.assignedBy._id || task.assignedBy.id));
      if (assignedById) {
        // Try to find the user in department members or company users to get their role
        const foundUser = departmentMembers.find((m: any) => String(m.id) === String(assignedById) || String((m as any)._id) === String(assignedById)) ||
                         companyUsers.find((m: any) => String(m.id) === String(assignedById) || String((m as any)._id) === String(assignedById));
        if (foundUser) {
          return { ...task, assignedByRole: foundUser.role };
        } else if (task.assignedBy && typeof task.assignedBy === 'object') {
          // If assignedBy is an object, get role from there
          return { ...task, assignedByRole: task.assignedBy.role };
        }
      }
    }
    return task;
  });

  // Filter out tasks assigned TO the current HOD - these should only appear in HODMyTasks, not in department management
  const resolvedTasks = resolvedTasksWithRoles.filter((task: any) => {
    const assignedToId = typeof task.assignedTo === 'string' ? task.assignedTo : (task.assignedTo && (task.assignedTo._id || task.assignedTo.id));
    return String(assignedToId) !== String(currentUser?.id);
  });

  // Get tasks by category
  const recentTasks = resolvedTasks.filter(t => t.status !== 'completed' && !getTimeRemaining(t.dueDate).isOverdue);
  const completedTasks = resolvedTasks.filter(t => t.status === 'completed');
  const overdueTasks = resolvedTasks.filter(t => getTimeRemaining(t.dueDate).isOverdue && t.status !== 'completed' && t.status !== 'blocked');
  const blockedTasks = resolvedTasks.filter(t => t.status === 'blocked');

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
                             (assignedByFilter === 'hod' && task.assignedByRole === 'department_head') ||
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


  // Resolve user-like values (id string or object) to a display object { id, name }
  const resolveUserDisplay = (userField: any) => {
    if (!userField) return null;
    if (typeof userField === 'object') {
      const id = userField._id || userField.id || null;
      const name = userField.name || userField.fullName || ((userField.firstName || '') + ' ' + (userField.lastName || '')).trim() || userField.email || userField.username || null;
      return { id, name };
    }
    if (typeof userField === 'string') {
      // Try to find user in department members first
      const foundInDept = departmentMembers.find((m: any) => String(m.id) === String(userField) || String((m as any)._id) === String(userField));
      if (foundInDept) {
        return {
          id: foundInDept.id || (foundInDept as any)._id,
          name: foundInDept.name || (foundInDept as any).fullName || foundInDept.email
        };
      }
      
      // Fallback to mock users
      const foundInMock = mockUsers.find((m: any) => String(m.id) === String(userField) || String((m as any)._id) === String(userField));
      if (foundInMock) {
        return {
          id: foundInMock.id || (foundInMock as any)._id,
          name: foundInMock.name || (foundInMock as any).fullName || foundInMock.email
        };
      }
      
      return { id: userField, name: userField };
    }
    return null;
  };


  const getAssignedByName = (assignedBy: any) => {
    if (!assignedBy) return 'Unknown';
    // If assignedBy is an object from the task
    if (typeof assignedBy === 'object') {
      return assignedBy.name || assignedBy.fullName ||
        (assignedBy.firstName && assignedBy.lastName ? `${assignedBy.firstName} ${assignedBy.lastName}` : null) ||
        assignedBy.email || assignedBy.username || 'Unknown';
    }
  }


  

  // Statistics
  const totalTasks = resolvedTasks.length;
  const completedTasksCount = completedTasks.length;
  const inProgressTasks = resolvedTasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = resolvedTasks.filter(t => t.status === 'assigned').length;
  const blockedTasksCount = resolvedTasks.filter(t => t.status === 'blocked').length;
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
      value: blockedTasksCount,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50'
    }
  ];

  // Show loading state while data is being fetched
  const isLoading = hodLoading || hodLoadingUsers || hodLoadingTasks || deptLoading || deptFetching;
  const hasAnyData = resolvedTasks.length > 0 || departmentMembers.length > 0;

  if (isLoading || (!hasAnyData && userDeptId)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Loading Department Tasks</p>
            <p className="text-muted-foreground">
              {hodLoadingUsers && !hodLoadingTasks && !deptLoading && 'Loading team members...'}
              {!hodLoadingUsers && hodLoadingTasks && !deptLoading && 'Loading department tasks...'}
              {!hodLoadingUsers && !hodLoadingTasks && deptLoading && 'Fetching task data...'}
              {hodLoadingUsers && hodLoadingTasks && deptLoading && 'Loading department data...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state when no tasks data is available yet
  if (!deptTasksData && !departmentTasks.length && userDeptId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Preparing Department Tasks</p>
            <p className="text-muted-foreground">Setting up your task management dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug info: remove in production */}
      {/* <div className="text-sm text-muted-foreground">Detected dept id: {String(userDeptId || 'none')} — Fetching: {String(deptFetching)} {deptError ? ` — Error: ${String((deptError as any).message || deptError)}` : ''}</div>
      <div className="text-sm text-muted-foreground">Fetched tasks count: {fetchedCount} — Sample: <pre className="whitespace-pre-wrap">{firstSample}</pre></div> */}
      {/* debug UI removed */}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
          <p className="text-muted-foreground">
            Manage tasks for {userDepartment?.name} department
          </p>
        </div>
        <Button onClick={() => setShowAssignDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Assign Task
        </Button>
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
            <Target className="h-4 w-4" />
            Blocked ({blockedTasks.length})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              {activeTab === 'recent' && 'Recent Department Tasks'}
              {activeTab === 'completed' && 'Completed Department Tasks'}
              {activeTab === 'overdue' && 'Overdue Department Tasks'}
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
                  <SelectItem value="hod">HOD</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tasks List */}
            <TabsContent value={activeTab} className="mt-0">
              <div className="space-y-4">
                {filteredTasks.map((task) => {
                  const assignedUserResolved = resolveUserDisplay(task.assignedTo);
                  const assignedByResolved = resolveUserDisplay(task.assignedBy);
                  const timeRemaining = getTimeRemaining(task.dueDate);
                  const createdDate = getCreatedDate(task.createdAt);
                  
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdateStatus={updateTaskStatus}
                      updatingTaskId={updatingTaskId}
                      departmentMembers={departmentMembers}
                      companyUsers={companyUsers}
                    />
                  );
                })}
              </div>

              {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                  {activeTab === 'recent' && <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                  {activeTab === 'completed' && <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                  {activeTab === 'overdue' && <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                  <h3 className="text-lg font-medium mb-2">
                    {activeTab === 'recent' && 'No recent tasks found'}
                    {activeTab === 'completed' && 'No completed tasks found'}
                    {activeTab === 'overdue' && 'No overdue tasks found'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || assignedByFilter !== 'all'
                      ? 'Try adjusting your search filters' 
                      : activeTab === 'recent' 
                        ? 'No active tasks in your department'
                        : activeTab === 'completed'
                          ? 'No tasks have been completed yet'
                          : 'No overdue tasks - great job!'}
                  </p>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      {/* Assign Task Dialog */}
      <AssignTaskDialog
        open={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        onAssignTask={handleAssignTask}
        departmentMembers={departmentMembers}
        restrictToDepartmentMembers={true}
        currentUser={currentUser}
      />
    </div>
  );
}
