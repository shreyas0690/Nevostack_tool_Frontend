import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ClipboardList,
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Filter,
  CheckCircle2,
  Target,
  User as UserIcon,
  CalendarDays,
  Timer,
  Paperclip,
  File,
  Crown,
  Shield,
  UserCheck,
  Edit3,
  Eye,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { mockUsers, mockDepartments, mockTasks } from '@/data/mockData';
import { Task, User, Department, TaskStatus, TaskPriority } from '@/types/company';
import { taskService } from '@/services/taskService';
import { userService } from '@/services/userService';
import { departmentService } from '@/services/departmentService';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/Auth/AuthProvider';
import MeetingDialog from './MeetingDialog';
import AssignTaskDialog from './AssignTaskDialog';

export default function HRTasksManagement() {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('recent');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const { toast } = useToast();

  // Update current time every 1 second for a smooth, stable countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second for stable countdown

    return () => clearInterval(timer);
  }, []);

  // Fetch tasks from API (same as admin panel, backend handles company filtering)
  const { data: tasks = [], isLoading, refetch: refetchTasks, error: tasksError } = useQuery({
    queryKey: ['tasks', 'hr'],
    queryFn: async () => {
      try {
        console.log('HR Tasks: Fetching tasks...');
        console.log('HR Tasks: Current user:', currentUser);
        console.log('HR Tasks: Auth token available:', !!localStorage.getItem('accessToken'));
        
        const response = await taskService.getTasks();
        console.log('HR Tasks: API Response:', response);
        console.log('HR Tasks: Response data:', response.data);
        console.log('HR Tasks: Response success:', response.success);
        
        if (!response.success) {
          throw new Error(`API Error: ${response.error || 'Unknown error'}`);
        }
        
        return response.data || [];
      } catch (error) {
        console.error('HR Tasks: Error fetching tasks:', error);
        console.error('HR Tasks: Error details:', error);
        throw error; // Don't return mock data, let the error show
      }
    }
  });

  // Fetch users for task assignment (same as admin panel)
  const { data: users = [] } = useQuery({
    queryKey: ['users', 'hr'],
    queryFn: async () => {
      try {
        const response = await userService.getUsers();
        return response.data || [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return mockUsers;
      }
    }
  });

  // Fetch departments for filtering (same as admin panel)
  const { data: departments = [] } = useQuery({
    queryKey: ['departments', 'hr'],
    queryFn: async () => {
      try {
        const response = await departmentService.getDepartments();
        return response.data || [];
      } catch (error) {
        console.error('Error fetching departments:', error);
        return mockDepartments;
      }
    }
  });

  // Filter tasks by tab
  const recentTasks = tasks.filter(task => {
    // Exclude completed, blocked, and overdue tasks
    if (task.status === 'completed' || (task as any).status === 'blocked') {
      return false;
    }
    
    // Exclude overdue tasks
    if (task.dueDate && new Date(task.dueDate) < new Date()) {
      return false;
    }
    
    // Include all other active tasks
    return true;
  });
  
  const completedTasks = tasks.filter(task => task.status === 'completed');
  
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date() && task.status !== 'completed' && (task as any).status !== 'blocked';
  });
  
  const blockedTasks = tasks.filter(task => (task as any).status === 'blocked');

  // Get current tab tasks
  const getCurrentTabTasks = () => {
    switch (activeTab) {
      case 'recent':
        return recentTasks;
      case 'completed':
        return completedTasks;
      case 'overdue':
        return overdueTasks;
      case 'blocked':
        return blockedTasks;
      default:
        return tasks;
    }
  };

  const currentTabTasks = getCurrentTabTasks();

  const filteredTasks = currentTabTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesDepartment = departmentFilter === 'all' || (task as any).departmentId === departmentFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, departmentFilter, activeTab]);

  const getUser = (userId: string): any => {
    return users.find(user => user.id === userId || (user as any)._id === userId);
  };

  // Resolve user-like values (id string or object) to a display object { id, name }
  const resolveUserDisplay = (userField: any) => {
    if (!userField) return null;
    if (typeof userField === 'object') {
      const id = (userField as any)._id || (userField as any).id || null;
      const name = (userField as any).name || (userField as any).fullName || (((userField as any).firstName || '') + ' ' + ((userField as any).lastName || '')).trim() || (userField as any).email || (userField as any).username || null;
      return { id, name };
    }
    if (typeof userField === 'string') {
      const u = users.find(u => String(u.id) === String(userField) || String((u as any)._id) === String(userField));
      if (u) {
        const name = (u as any).name || (u as any).fullName || (((u as any).firstName || '') + ' ' + ((u as any).lastName || '')).trim() || (u as any).email || (u as any).username;
        return { id: u.id || (u as any)._id, name };
      }
      return { id: userField, name: userField };
    }
    return null;
  };

  const getStatusColor = (status: any) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: any) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'review':
        return <AlertCircle className="w-4 h-4" />;
      case 'blocked':
        return <XCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Helper functions for admin panel design
  const getTimeRemaining = (dueDate: any) => {
    if (!dueDate) return { text: 'No due date', color: 'text-muted-foreground', isOverdue: false };
    
    const now = currentTime;
    const due = normalizeDate(dueDate);
    const diffMs = due.getTime() - now.getTime();

    const pad = (n: number) => String(n).padStart(2, '0');

    if (diffMs <= 0) {
      const overdueMs = Math.abs(diffMs);
      const totalSeconds = Math.floor(overdueMs / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const text = days > 0
        ? `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s overdue`
        : hours > 0
          ? `${hours}h ${pad(minutes)}m ${pad(seconds)}s overdue`
          : minutes > 0
            ? `${minutes}m ${pad(seconds)}s overdue`
            : `Overdue ${seconds}s`;
      return { text, color: 'text-red-600', isOverdue: true, days, hours, minutes, seconds };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const text = days > 0
      ? `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
      : hours > 0
        ? `${hours}h ${pad(minutes)}m ${pad(seconds)}s`
        : minutes > 0
          ? `${minutes}m ${pad(seconds)}s`
          : `${seconds}s`;

    // color thresholds
    let color = 'text-green-600';
    if (days > 7) color = 'text-green-600';
    else if (days > 2) color = 'text-yellow-600';
    else if (days > 0) color = 'text-orange-600';
    else if (hours > 2) color = 'text-red-500';
    else if (hours > 0) color = 'text-red-600';
    else if (minutes > 0) color = 'text-red-600';
    else color = 'text-red-600';

    return { text, color, isOverdue: false, days, hours, minutes, seconds };
  };

  const getCreatedDate = (createdAt: any) => {
    if (!createdAt) return 'Unknown';
    const date = new Date(createdAt);
    return date.toLocaleDateString();
  };

  const normalizeDate = (date: any) => {
    if (!date) return new Date();
    return new Date(date);
  };

  const getAssignedByIcon = (role: any) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-red-600" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'hr_manager':
        return <UserCheck className="h-4 w-4 text-purple-600" />;
      case 'hr':
        return <UserCheck className="h-4 w-4 text-purple-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAssignedByColor = (role: any) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'hr_manager':
        return 'bg-purple-100 text-purple-800';
      case 'hr':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAssignedByRole = (role: any) => {
    if (!role) return 'Unknown';
    return role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const getUserDisplayName = (ref: any) => {
    if (!ref) return null;
    if (typeof ref === 'string') {
      const user = users.find((u: any) => (u.id || u._id) == ref);
      return user ? ((user as any).name || (user as any).fullName || user.email) : ref;
    }
    if (typeof ref === 'object') {
      return ref.name || ref.fullName || ref.email || 'Unknown';
    }
    return null;
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      await refetchTasks();
      toast({
        title: "Task Deleted",
        description: "Task has been successfully deleted.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAssignTask = async (taskData: any) => {
    // After a task is created we want to ensure we show the latest version (with attachments)
    try {
      if (refetchTasks) await refetchTasks();
    } catch (e) { /* ignore */ }
  };

  // Function to update task status
  const updateTaskStatus = (taskId: string, newStatus: string) => {
    if (!taskId) {
      console.warn('updateTaskStatus called without taskId, aborting');
      return;
    }

    // persist to backend
    (async () => {
      try {
        await taskService.updateTaskStatus(taskId, newStatus as any);
        // refetch tasks to ensure canonical server state
        if (refetchTasks) await refetchTasks();
        toast({
          title: "Status Updated",
          description: "Task status has been successfully updated.",
        });
      } catch (err) {
        console.error('Failed to persist task status change', err);
        toast({
          title: "Error",
          description: "Failed to update task status. Please try again.",
          variant: "destructive",
        });
        // rollback on error: refetch tasks
        if (refetchTasks) await refetchTasks();
      }
    })();
  };

  const handleUpdateTask = async (taskId: string, updates: any) => {
    try {
      await taskService.updateTask(taskId, updates);
      await refetchTasks();
      toast({
        title: "Task Updated",
        description: "Task has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };


  // Debug logging
  console.log('HR Tasks Management - Render State:', {
    isLoading,
    tasksCount: tasks.length,
    tasksError,
    currentUser: currentUser?.email,
    companyId: currentUser?.companyId,
    userRole: currentUser?.role,
    tasks: tasks.slice(0, 2) // Show first 2 tasks for debugging
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (tasksError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Error Loading Tasks</h3>
            <p className="text-muted-foreground mb-4">
              {tasksError instanceof Error ? tasksError.message : 'Failed to load tasks'}
            </p>
            <Button onClick={() => refetchTasks()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Tasks Management</h1>
          <p className="text-muted-foreground">Manage and monitor tasks across your company</p>
        </div>
        <Button onClick={() => setShowAssignDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Assign Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Tasks</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{recentTasks.length}</div>
            <p className="text-xs text-muted-foreground">Active tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
            <p className="text-xs text-muted-foreground">Completed tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
            <p className="text-xs text-muted-foreground">Overdue tasks</p>
              </CardContent>
            </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{blockedTasks.length}</div>
            <p className="text-xs text-muted-foreground">Blocked tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setDepartmentFilter('all');
                }}
              >
              <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
                      </div>
                    </CardContent>
                  </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Tasks ({recentTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed ({completedTasks.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Overdue ({overdueTasks.length})
          </TabsTrigger>
          <TabsTrigger value="blocked" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Blocked ({blockedTasks.length})
          </TabsTrigger>
        </TabsList>

        {/* Tasks List */}
        <TabsContent value={activeTab} className="mt-6">
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || departmentFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first task'
                }
              </p>
              <Button onClick={() => setShowAssignDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Assign Task
              </Button>
                  </CardContent>
                </Card>
        ) : (
          <div className="space-y-4">
            {paginatedTasks.map((task) => {
              const assignedUser = resolveUserDisplay(task.assignedTo);
              const assignedByUser = resolveUserDisplay(task.assignedBy);
              const timeRemaining = getTimeRemaining(task.dueDate);
              const createdDate = getCreatedDate(task.createdAt);
              
              // Get department info
              const taskDeptId = typeof (task as any).departmentId === 'string'
                ? (task as any).departmentId
                : ((task as any).departmentId && ((task as any).departmentId.id || (task as any).departmentId._id)) || null;
              
              const departmentObj = departments.find((d: any) => ((d.id || (d as any)._id) == taskDeptId)) || null;
              const departmentName = departmentObj ? (departmentObj.name || (departmentObj as any).title) : null;
              const departmentColor = departmentObj ? (departmentObj.color || '#6B7280') : '#6B7280';
              
              return (
                <Card key={task.id} className={`hover:shadow-md transition-shadow ${
                  task.status === 'completed'
                    ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
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
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                          <Badge className={`text-xs flex items-center gap-1 ${getStatusColor(task.status)}`}>
                            {getStatusIcon(task.status)}
                            {task.status.replace('_', ' ')}
                          </Badge>
                          {departmentName && (
                            <Badge className="text-xs" style={{ backgroundColor: departmentColor, color: 'white' }}>
                              {departmentName}
                              </Badge>
                          )}
                        </div>
                        <p className={`text-sm mb-4 ${task.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          {task.description}
                        </p>
                      </div>
                      
                      {/* Status Selector */}
                      <div className="flex items-center gap-2 ml-4">
                        <Select
                          value={task.status}
                          onValueChange={(value) => updateTaskStatus(task.id || (task as any)._id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="blocked">Blocked</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={() => {
                          console.log('Edit button clicked for task:', task);
                          const taskId = task.id || (task as any)._id;
                          console.log('Task ID:', taskId);
                          setEditForm({
                            id: taskId,
                            title: task.title || '',
                            description: task.description || '',
                            priority: task.priority || 'low',
                            status: task.status || 'assigned',
                            dueDate: task.dueDate ? (function(){ const d = normalizeDate(task.dueDate); const yyyy = d.getFullYear(); const mm = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0'); return `${yyyy}-${mm}-${dd}` })() : '' ,
                            assignedTo: task.assignedTo && (typeof task.assignedTo === 'object' ? ((task.assignedTo as any)?.id || (task.assignedTo as any)?._id || task.assignedTo) : task.assignedTo) || ''
                          });
                          setEditModalOpen(true);
                        }}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Assigned to:</p>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                {(getUserDisplayName(task.assignedTo) || 'UN').split(' ').map((n: string) => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            <span>{typeof assignedUser === 'string' ? assignedUser : (assignedUser?.name || 'Unknown')}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                              <div>
                          <p className="font-medium">Created:</p>
                          <p className="text-muted-foreground">{createdDate}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                        <Timer className={`h-4 w-4 ${task.status === 'completed' ? 'text-muted-foreground' : timeRemaining.color}`} />
                        <div>
                          <p className="font-medium">Due Date:</p>
                          <div className="flex items-center gap-1">
                            <p className="text-muted-foreground">{normalizeDate(task.dueDate).toLocaleDateString()}</p>
                            {task.status !== 'completed' && activeTab !== 'blocked' && (
                            <Badge
                              variant={timeRemaining.isOverdue ? "destructive" : "outline"}
                              className={`text-xs ${timeRemaining.color}`}
                            >
                              {activeTab === 'overdue' 
                                ? '🚨 Overdue' 
                                : timeRemaining.isOverdue 
                                  ? `🚨 ${timeRemaining.text}` 
                                  : `⏰ ${timeRemaining.text}`}
                              </Badge>
                            )}
                          </div>
                        </div>
                            </div>

                            <div className="flex items-center gap-2">
                        {getAssignedByIcon((task as any).assignedByRole || 'member')}
                              <div>
                          <p className="font-medium">Assigned by:</p>
                          <div className="flex items-center gap-2">
                            <p className="text-muted-foreground">{typeof assignedByUser === 'string' ? assignedByUser : (assignedByUser as any)?.name || 'Unknown'}</p>
                            <Badge className={`text-xs ${getAssignedByColor((task as any).assignedByRole || 'member')}`}>
                              {formatAssignedByRole((task as any).assignedByRole || 'member')}
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
                          {task.attachments.map((attachment: any) => (
                            <div
                              key={attachment.id}
                              className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md border text-xs"
                            >
                              <File className="h-3 w-3 text-muted-foreground" />
                              {attachment.type && attachment.type.startsWith('image/') ? (
                                <img src={attachment.url} alt={attachment.name} className="h-6 w-6 object-cover rounded" />
                              ) : null}
                              <a href={attachment.url} target="_blank" rel="noreferrer" className="truncate max-w-32 text-sm text-blue-600 hover:underline">
                                {attachment.name}
                              </a>
                              <span className="text-muted-foreground">
                                ({Math.round((attachment.size || 0) / 1024)}KB)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Footer with Updated and View Details */}
                    <div className="flex items-center justify-between pt-4 border-t mt-4">
                      <div className="text-xs text-muted-foreground">
                        Updated: {normalizeDate(task.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedTask(task)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <ClipboardList className="h-5 w-5" />
                                Task Details
                              </DialogTitle>
                            </DialogHeader>
                            {selectedTask && (
                              <div className="space-y-4">
                                <div>
                                  <h3 className="font-semibold text-lg">{selectedTask.title}</h3>
                                  <p className="text-sm text-muted-foreground mt-1">{selectedTask.description}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="font-medium">Status</p>
                                    <Badge className={`text-xs ${getStatusColor(selectedTask.status)}`}>
                                      {selectedTask.status.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="font-medium">Priority</p>
                                    <Badge className={`text-xs ${getPriorityColor(selectedTask.priority)}`}>
                                      {selectedTask.priority}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="font-medium">Assigned to</p>
                                    <p className="text-sm">{getUserDisplayName(selectedTask.assignedTo) || 'Unknown'}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Department</p>
                                    <p className="text-sm">{departmentName || 'Unknown'}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Due Date</p>
                                    <p className="text-sm">{normalizeDate(selectedTask.dueDate).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Created</p>
                                    <p className="text-sm">{normalizeDate(selectedTask.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>

                                {/* Attachments in Detail View */}
                                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                                  <div>
                                    <p className="font-medium mb-2">Attachments</p>
                                    <div className="space-y-2">
                                      {selectedTask.attachments.map((attachment: any) => (
                                        <div
                                          key={attachment.id}
                                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
                                        >
                                          <File className="h-4 w-4 text-muted-foreground" />
                                          <div className="flex-1">
                                            <p className="text-sm font-medium">{attachment.name}</p>
                                            <p className="text-xs text-muted-foreground">{Math.round((attachment.size || 0) / 1024)}KB • Uploaded {attachment.uploadedAt ? normalizeDate(attachment.uploadedAt).toLocaleDateString() : 'Unknown'}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex justify-end">
                                  <Button variant="outline">
                                    Close
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination Controls - Only show when there are tasks */}
        {filteredTasks.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing {startIndex + 1}-{Math.min(endIndex, filteredTasks.length)} of {filteredTasks.length} tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                      className={currentPage === pageNum
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                        : "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600"
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
            </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Recent: {recentTasks.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Completed: {completedTasks.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Overdue: {overdueTasks.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Blocked: {blockedTasks.length}</span>
            </div>
          </div>
          <div className="text-xs">
            Total Tasks: {tasks.length}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AssignTaskDialog
        open={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        onAssignTask={handleAssignTask}
        departmentMembers={users as any}
        currentUser={currentUser}
      />

      {/* Edit Task Modal */}
      <Dialog open={editModalOpen} onOpenChange={(open) => { if (!open) { setEditModalOpen(false); setEditForm(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input value={editForm.title} onChange={(e:any) => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea value={editForm.description} onChange={(e:any) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input type="date" value={editForm.dueDate || ''} onChange={(e:any) => setEditForm({ ...editForm, dueDate: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setEditModalOpen(false); setEditForm(null); }}>Cancel</Button>
                <Button onClick={async () => {
                  setSavingEdit(true);
                  try {
                    console.log('Saving edit for task ID:', editForm.id);
                    const payload:any = {
                      title: editForm.title,
                      description: editForm.description,
                      priority: editForm.priority,
                      status: editForm.status,
                      dueDate: editForm.dueDate || undefined
                    };
                    console.log('Update payload:', payload);
                    await taskService.updateTask(editForm.id, payload);
                    if (refetchTasks) await refetchTasks();
                    setEditModalOpen(false);
                    setEditForm(null);
                    toast({
                      title: "Task Updated",
                      description: "Task has been successfully updated.",
                    });
                  } catch (e) {
                    console.error('Failed saving edit', e);
                    toast({
                      title: "Error",
                      description: "Failed to save task edit. Please try again.",
                      variant: "destructive",
                    });
                  } finally {
                    setSavingEdit(false);
                  }
                }}>{savingEdit ? 'Saving...' : 'Save'}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MeetingDialog
        open={showMeetingDialog}
        onClose={() => {
          setShowMeetingDialog(false);
          setSelectedTask(null);
        }}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              "{selectedTask?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setSelectedTask(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedTask) {
                  handleDeleteTask(selectedTask.id);
                  setShowDeleteDialog(false);
                  setSelectedTask(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}