import { useState, useEffect } from 'react';
import { mockUsers } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  ClipboardList, 
  Search, 
  Plus,
  Calendar,
  User as UserIcon,
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
  BarChart3,
  MessageCircle,
  Trash2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/Auth/AuthProvider';
import { mockDepartments } from '@/data/mockData';
import toast from 'react-hot-toast';
import AssignTaskDialog from './AssignTaskDialog';
import TaskDiscussionDialog from './TaskDiscussionDialog';
import { useQuery } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { userService } from '@/services/userService';
import { departmentService } from '@/services/departmentService';

export default function SuperAdminTasksManagement() {
  const { currentUser } = useAuth();
  const { data: tasksData = [], isLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', currentUser?.companyId],
    queryFn: async () => {
      const res = await taskService.getTasks();
      return (res as any).tasks || (res as any).data || res?.data || [];
    },
    enabled: !!currentUser
  });
  const [tasksState, setTasksState] = useState<any[]>([]);
  useEffect(() => {
    setTasksState(Array.isArray(tasksData) ? tasksData.map(normalizeTask) : []);
  }, [tasksData]);
  // Ensure tasks have stable `id` field (normalize _id -> id) to avoid key collisions
  const normalizeTask = (t: any) => ({ ...t, id: t.id || t._id });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('recent');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [showViewDetailsDialog, setShowViewDetailsDialog] = useState(false);
  const [showDiscussionDialog, setShowDiscussionDialog] = useState(false);
  const [discussionTask, setDiscussionTask] = useState<any>(null);

  // Real data state (fetch from backend and override mocks)
  const [usersState, setUsersState] = useState<any[]>([]);
  const [departmentsState, setDepartmentsState] = useState<any[]>([]);
  const [selectedAssignedUserState, setSelectedAssignedUserState] = useState<any>(null);
  const [selectedAssignedByUserState, setSelectedAssignedByUserState] = useState<any>(null);

  // Helper to resolve a user reference (id string, object with id, or full user object)
  const resolveUserRef = (ref: any) => {
    const allUsers = usersState.length ? usersState : mockUsers;
    if (!ref) return null;
    if (typeof ref === 'string') return allUsers.find((u: any) => (u.id || u._id) == ref) || null;
    if (typeof ref === 'object') {
      if (ref.name) return ref;
      const id = ref.id || ref._id;
      if (id) return allUsers.find((u: any) => (u.id || u._id) == id) || ref;
    }
    return null;
  };

  const getUserDisplayName = (ref: any) => {
    if (!ref) return null;
    if (Array.isArray(ref)) {
      const names = ref.map(r => getUserDisplayName(r)).filter(Boolean);
      return names.join(', ');
    }
    // if resolveUserRef returns object with name
    const resolved = resolveUserRef(ref);
    if (resolved && resolved.name) return resolved.name;
    // if ref is object with firstName/lastName or name fields
    if (typeof ref === 'object') {
      if (ref.firstName || ref.lastName) return `${ref.firstName || ''} ${ref.lastName || ''}`.trim();
      if (ref.fullName) return ref.fullName;
      if (ref.name) return ref.name;
    }
    // if ref is id string, attempt to find in usersState
    if (typeof ref === 'string') {
      const fromLocal = (usersState.length ? usersState : mockUsers).find((u:any) => (u.id||u._id) == ref);
      if (fromLocal) return fromLocal.name;
    }
    // other common task fields
    if (ref.assignedToName) return ref.assignedToName;
    if (ref.assignedByName) return ref.assignedByName;
    return null;
  };

  useEffect(() => {
    const fetchTasksAndUsers = async () => {
      try {
        if (!currentUser) return;
        // fetch tasks
        const tasksRes = await (await import('@/services/taskService')).taskService.getTasks();
        const tasksList = (tasksRes as any).tasks || (tasksRes as any).data || (tasksRes as any).data?.tasks || [];
        if (Array.isArray(tasksList) && tasksList.length) {
          setTasksState(tasksList.map(normalizeTask));
        }

        // fetch users
        const usersParams: any = { companyId: currentUser.companyId, limit: 1000 };
        const usersRes = await (await import('@/services/userService')).userService.getUsers(usersParams);
        const usersList = (usersRes as any).users || (usersRes as any).data || (usersRes as any).data?.users || [];
        if (Array.isArray(usersList) && usersList.length) setUsersState(usersList);
      } catch (err) {
        console.warn('Failed to fetch real tasks/users:', err);
      }
    };

    fetchTasksAndUsers();
  }, [currentUser]);

  // when user opens task details, attempt to fetch assigned/assignedBy users if not present locally
  useEffect(() => {
    let cancelled = false;
    const fetchMissingUsers = async () => {
      if (!selectedTask) {
        setSelectedAssignedUserState(null);
        setSelectedAssignedByUserState(null);
        return;
      }

      const tryResolve = (ref: any) => {
        if (!ref) return null;
        if (typeof ref === 'string') return ref;
        if (typeof ref === 'object') return ref.id || ref._id || null;
        return null;
      };

      const assignedToId = tryResolve(selectedTask.assignedTo);
      const assignedById = tryResolve(selectedTask.assignedBy);

      // resolve from local cache first
      if (assignedToId) {
        const local = usersState.find((u:any) => (u.id||u._id) == assignedToId) || mockUsers.find((u:any) => (u.id||u._id) == assignedToId) || null;
        if (local) setSelectedAssignedUserState(local);
        else {
          try {
            const res = await userService.getUserById(assignedToId);
            const userObj = (res as any).data || (res as any).user || res;
            if (!cancelled) setSelectedAssignedUserState(userObj || null);
          } catch (e) {
            if (!cancelled) setSelectedAssignedUserState(null);
          }
        }
      }

      if (assignedById) {
        const localBy = usersState.find((u:any) => (u.id||u._id) == assignedById) || mockUsers.find((u:any) => (u.id||u._id) == assignedById) || null;
        if (localBy) setSelectedAssignedByUserState(localBy);
        else {
          try {
            const res = await userService.getUserById(assignedById);
            const userObj = (res as any).data || (res as any).user || res;
            if (!cancelled) setSelectedAssignedByUserState(userObj || null);
          } catch (e) {
            if (!cancelled) setSelectedAssignedByUserState(null);
          }
        }
      }
    };

    fetchMissingUsers();
    return () => { cancelled = true; };
  }, [selectedTask, usersState]);

  // fetch departments for mapping ids to names
  const { data: departmentsData = [], refetch: refetchDepartments } = useQuery({
    queryKey: ['departments', currentUser?.companyId],
    queryFn: async () => {
      const res = await departmentService.getDepartments({ limit: 1000 });
      return (res as any).data || (res as any).departments || [];
    },
    enabled: !!currentUser
  });

  useEffect(() => {
    setDepartmentsState(Array.isArray(departmentsData) ? departmentsData : []);
  }, [departmentsData]);

  // Update current time every 1 second for a smooth, stable countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second for stable countdown

    return () => clearInterval(timer);
  }, []);

  // Helper function to calculate time remaining with real-time countdown
  const normalizeDate = (d: any) => {
    if (!d) return new Date(0);
    if (d instanceof Date) return d;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? new Date(0) : parsed;
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

  const getTimeRemaining = (dueDate: any) => {
    const now = currentTime;
    const due = resolveDueDate(dueDate);
    if (!due) {
      return { text: 'No due date', color: 'text-slate-500', isOverdue: false, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
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

  // Helper function to get formatted creation date
  const getCreatedDate = (createdAt: any) => {
    // Always show the actual creation date (no relative strings)
    const created = normalizeDate(createdAt);
    return created.toLocaleDateString();
  };

  // Function to update task status
  const updateTaskStatus = (taskId: string, newStatus: string) => {
    if (!taskId) {
      console.warn('updateTaskStatus called without taskId, aborting');
      return;
    }

    const task = tasksState.find(t => String(t.id) === String(taskId));

    // optimistic UI update (compare as strings to avoid undefined === undefined)
    setTasksState(prevTasks => 
      prevTasks.map(task => 
        String(task.id) === String(taskId)
          ? { ...task, status: newStatus as any, updatedAt: new Date() }
          : task
      )
    );

    // persist to backend
    (async () => {
      try {
        await taskService.updateTaskStatus(taskId, newStatus as any);
        // refetch tasks to ensure canonical server state
        if (refetchTasks) await refetchTasks();
        toast.success(`Task "${task?.title}" status updated to ${newStatus.replace('_', ' ')}! 🔄`);
      } catch (err) {
        console.error('Failed to persist task status change', err);
        toast.error("Failed to update task status. Please try again.");
        // rollback on error: refetch tasks
        if (refetchTasks) await refetchTasks();
      }
    })();
  };

  // Function to delete task
  const deleteTask = async (taskId: string) => {
    try {
      const task = tasksState.find(t => String(t.id) === String(taskId));
      await taskService.deleteTask(taskId);
      if (refetchTasks) await refetchTasks();
      setShowDeleteDialog(false);
      setTaskToDelete(null);
      toast.success(`Task "${task?.title}" deleted successfully! 🗑️`);
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error("Failed to delete task. Please try again.");
    }
  };

  // Function to add new task
  const handleAssignTask = async (taskData: any) => {
    try {
      const createdTasks = Array.isArray(taskData)
        ? (taskData.filter(Boolean))
        : (taskData ? [taskData] : []);

      // After a task is created we want to ensure we show the latest version (with attachments)
      if (refetchTasks) await refetchTasks();

      setShowAssignDialog(false);
      if (createdTasks.length === 0) {
        toast.success('Tasks created successfully! 🎉');
      } else if (createdTasks.length === 1) {
        toast.success(`Task "${createdTasks[0]?.title || 'Task'}" created successfully! 🎉`);
      } else {
        toast.success(`Task "${createdTasks[0]?.title || 'Task'}" assigned to ${createdTasks.length} team members! 🎉`);
      }
    } catch (err) {
      console.error('Failed to create task:', err);
      toast.error("Failed to create task. Please try again.");
    }
  };

  // Get all system tasks (super admin sees everything)
  const allTasks = tasksState;

  // Get all users across all departments for super admin
  const allUsers = usersState.length ? usersState : mockUsers;

  // Get tasks by category
  const recentTasks = allTasks.filter(t => t.status !== 'completed' && t.status !== 'blocked' && !getTimeRemaining(t.dueDate).isOverdue);
  const completedTasks = allTasks.filter(t => t.status === 'completed');
  const overviewTasks = allTasks; // kept for compatibility
  // ensure overdueTasks is defined once (exclude completed and blocked tasks)
  const overdueTasksList = allTasks.filter(t => getTimeRemaining(t.dueDate).isOverdue && t.status !== 'completed' && t.status !== 'blocked');
  const blockedTasks = allTasks.filter(t => t.status === 'blocked');

  // Get current tab tasks
  const getCurrentTabTasks = () => {
    switch (activeTab) {
      case 'recent': return recentTasks;
      case 'completed': return completedTasks;
      case 'overdue': return overdueTasksList;
      case 'blocked': return blockedTasks;
      default: return recentTasks;
    }
  };

  // Filter tasks based on current tab
  const filteredTasks = getCurrentTabTasks().filter(task => {
    const searchValue = searchTerm.toLowerCase();
    const matchesSearch = String(task.title || '').toLowerCase().includes(searchValue) ||
                         String(task.description || '').toLowerCase().includes(searchValue);
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    // Handle department filtering - departmentId can be an object (populated) or string
    let matchesDepartment = true;
    if (departmentFilter !== 'all') {
      const taskDept = task.departmentId;
      if (taskDept) {
        // If departmentId is populated (object), check the _id field
        const deptId = typeof taskDept === 'object' ? taskDept._id : taskDept;
        matchesDepartment = deptId === departmentFilter;
      } else {
        // Fallback to category if no departmentId
        matchesDepartment = task.category === departmentFilter;
      }
    }

    return matchesSearch && matchesPriority && matchesDepartment;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  // Reset to first page when filters or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, priorityFilter, departmentFilter, activeTab]);

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
      case 'department_head': return <Shield className="h-4 w-4" />;
      case 'manager': return <UserCheck className="h-4 w-4" />;
      default: return <UserIcon className="h-4 w-4" />;
    }
  };

  const getAssignedByColor = (assignedByRole?: string) => {
    switch (assignedByRole) {
      case 'super_admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'department_head': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'manager': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatAssignedByRole = (assignedByRole?: string) => {
    switch (assignedByRole) {
      case 'admin': return 'Admin';
      case 'department_head': return 'HOD';
      case 'manager': return 'Manager';
      default: return 'Unknown';
    }
  };

  // Statistics
  const totalTasks = allTasks.length;
  const completedTasksCount = completedTasks.length;
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = allTasks.filter(t => t.status === 'assigned').length;
  const overdueTasksCount = overdueTasksList.length;
  const blockedTasksCount = blockedTasks.length;

  const stats = [
    {
      title: 'Total Tasks',
      value: totalTasks,
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50'
    },
    {
      title: 'Recent Tasks',
      value: recentTasks.length,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50'
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
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/50'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header with Department-style Design */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent rounded-xl"></div>
          <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-lg shadow-red-500/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 dark:from-red-400 dark:via-red-500 dark:to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Task Management</h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Comprehensive task management across all departments and system</p>
                {/* <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>System Active</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Crown className="h-3 w-3" />
                    <span>Super Admin Access</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Shield className="h-3 w-3" />
                    <span>Full System Control</span>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
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
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Loading Tasks</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Fetching your task data...</p>
            <div className="flex justify-center space-x-1 mt-4">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Department-style Design */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent rounded-xl"></div>
        <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg shadow-red-500/5">
          <div className="flex flex-col space-y-3 sm:space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 dark:from-red-400 dark:via-red-500 dark:to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25 hidden sm:flex">
                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  <span className="hidden sm:inline">Task Management</span>
                  <span className="sm:hidden">Task Management</span>
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base">
                  <span className="hidden sm:inline">Comprehensive task management across all departments and system</span>
                  <span className="sm:hidden">Comprehensive task management across all departments</span>
                </p>
                  </div>
                  </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                onClick={() => setShowAssignDialog(true)}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25 text-sm sm:text-base"
              >
                <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Assign Task</span>
                <span className="sm:hidden">Assign</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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
        {/* Mobile: Horizontal scrollable tabs */}
        <div className="overflow-x-auto scrollbar-hide sm:hidden">
          <TabsList className="inline-flex w-full min-w-max h-auto p-1 bg-muted/50">
            <TabsTrigger 
              value="recent" 
              className="flex items-center gap-1 text-xs px-2 py-2 whitespace-nowrap min-w-0 flex-1"
            >
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span>Recent</span>
              <span className="ml-1 text-xs font-medium">({recentTasks.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="flex items-center gap-1 text-xs px-2 py-2 whitespace-nowrap min-w-0 flex-1"
            >
              <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
              <span>Done</span>
              <span className="ml-1 text-xs font-medium">({completedTasksCount})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="overdue" 
              className="flex items-center gap-1 text-xs px-2 py-2 whitespace-nowrap min-w-0 flex-1"
            >
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              <span>Late</span>
              <span className="ml-1 text-xs font-medium">({overdueTasksCount})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="blocked" 
              className="flex items-center gap-1 text-xs px-2 py-2 whitespace-nowrap min-w-0 flex-1"
            >
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              <span>Blocked</span>
              <span className="ml-1 text-xs font-medium">({blockedTasksCount})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Desktop/Tablet: Original grid layout */}
        <TabsList className="hidden sm:grid w-full grid-cols-4">
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
            <AlertCircle className="h-4 w-4" />
            Blocked ({blockedTasksCount})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-4 sm:mt-6">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">
              {activeTab === 'recent' && 'Recent System Tasks'}
              {activeTab === 'completed' && 'Completed System Tasks'}
              {activeTab === 'overdue' && 'Overdue System Tasks'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

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

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departmentsState.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: dept.color || '#6B7280' }}
                        />
                        {dept.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tasks List */}
            <TabsContent value={activeTab} className="mt-0">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading tasks...</p>
                  </div>
                ) : (
                  paginatedTasks.map((task) => {
                  const allUsers = usersState.length ? usersState : mockUsers;

                  const resolveUserRef = (ref: any) => {
                    if (!ref) return null;
                    // string id
                    if (typeof ref === 'string') {
                      return allUsers.find((u: any) => (u.id || u._id) == ref) || null;
                    }
                    // object: { id/_id } or full user object
                    if (typeof ref === 'object') {
                      if (ref.name) return ref;
                      const id = ref.id || ref._id;
                      if (id) return allUsers.find((u: any) => (u.id || u._id) == id) || ref;
                    }
                    return null;
                  };

                  const assignedUser = resolveUserRef(task.assignedTo);
                  const assignedNames = Array.isArray(task.assignedToList) && task.assignedToList.length
                    ? task.assignedToList.map((a: any) => getUserDisplayName(a)).filter(Boolean).join(', ')
                    : (assignedUser?.name || selectedAssignedUserState?.name || getUserDisplayName(task.assignedTo));
                  const assignedByUser = resolveUserRef(task.assignedBy);
                  // Resolve role from multiple possible fields and log for debugging
                  const resolvedAssignedByRole = (() => {
                    if (task && (task.assignedByRole || task.assignedByRole === '')) return task.assignedByRole;
                    const sourceUser = assignedByUser || selectedAssignedByUserState;
                    const roleCandidates = [
                      sourceUser?.role,
                      sourceUser?.userRole,
                      sourceUser?.roleName,
                      sourceUser?.user_role,
                      sourceUser?.role?.name
                    ];
                    const found = roleCandidates.find(r => r !== undefined && r !== null && r !== '');
                    return found || undefined;
                  })();
                  // Debug info to console to help trace missing roles
                  try {
                    // keep logs minimal but informative
                    // eslint-disable-next-line no-console
                    console.debug('task.assigner.resolve', { taskId: task.id, taskAssignedByRole: task.assignedByRole, assignedByUser, selectedAssignedByUserState, resolvedAssignedByRole });
                  } catch (e) { /* ignore */ }
                  const isDialogOpen = showViewDetailsDialog && selectedTask?.id === task.id;
                  // Resolve department id/name from task (handles string id, nested object, or different shapes)
                  let taskDeptId;
                  if (task.departmentId) {
                    // If departmentId is populated (object), use the _id field
                    taskDeptId = typeof task.departmentId === 'object' ? task.departmentId._id : task.departmentId;
                  } else {
                    // Fallback to category if no departmentId
                    taskDeptId = task.category || null;
                  }
                  const taskDeptNameFallback = task.department && (task.department.name || task.department.title || task.department.departmentName) || null;

                  const departmentObj = departmentsState.find((d: any) => ((d.id || (d as any)._id) == taskDeptId))
                    || mockDepartments.find(d => (d.id || (d as any)._id) == taskDeptId)
                    || null;

                  const departmentName = departmentObj
                    ? (departmentObj.name || departmentObj.title || departmentObj.departmentName || departmentObj.deptName || departmentObj.label)
                    : taskDeptNameFallback;

                  const departmentColor = departmentObj ? (departmentObj.color || departmentObj.hex || '#6B7280') : '#6B7280';
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
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className={`font-semibold text-base sm:text-lg ${task.status === 'completed' ? 'text-green-700 dark:text-green-300' : ''} truncate`}>
                                {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 inline mr-1" />}
                                {task.title}
                              </h3>
                              <div className="flex flex-wrap gap-1 sm:gap-2">
                              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                                {task.priority}
                              </Badge>
                              <Badge variant={getStatusColor(task.status)} className="text-xs flex items-center gap-1">
                                {getStatusIcon(task.status)}
                                  <span className="hidden sm:inline">{task.status.replace('_', ' ')}</span>
                                  <span className="sm:hidden">{task.status.replace('_', ' ').split(' ')[0]}</span>
                              </Badge>
                              {departmentName && (
                                <Badge className="text-xs" style={{ backgroundColor: departmentColor, color: 'white' }}>
                                    <span className="hidden sm:inline">{departmentName}</span>
                                    <span className="sm:hidden">{departmentName.substring(0, 8)}...</span>
                                </Badge>
                              )}
                            </div>
                            </div>
                            <p className={`text-sm mb-4 ${task.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'} line-clamp-2`}>
                              {task.description}
                            </p>
                          </div>
                          
                          {/* Status Selector */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-4">
                            <Select
                              value={task.status}
                              onValueChange={(value) => updateTaskStatus(task.id, value)}
                            >
                              <SelectTrigger className="w-full sm:w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="blocked">Blocked</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => {
                              setEditForm({
                                id: task.id,
                                title: task.title || '',
                                description: task.description || '',
                                priority: task.priority || 'low',
                                status: task.status || 'assigned',
                                dueDate: task.dueDate ? (function(){ const d = normalizeDate(task.dueDate); const yyyy = d.getFullYear(); const mm = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0'); return `${yyyy}-${mm}-${dd}` })() : '' ,
                                assignedTo: task.assignedTo && (typeof task.assignedTo === 'object' ? (task.assignedTo.id || task.assignedTo._id || task.assignedTo) : task.assignedTo) || ''
                              });
                              setEditModalOpen(true);
                            }}>
                                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline ml-1">Edit</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setTaskToDelete(task);
                                setShowDeleteDialog(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline ml-1">Delete</span>
                            </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Assigned to:</p>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {(Array.isArray(task.assignedToList) && task.assignedToList.length
                                      ? getUserDisplayName(task.assignedToList[0])
                                      : assignedNames || 'UN')?.split(' ').map((n: string) => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{assignedNames || 'Unknown'}</span>
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
                            <Timer className={`h-4 w-4 ${task.status === 'completed' || task.status === 'blocked' ? 'text-muted-foreground' : timeRemaining.color}`} />
                            <div>
                              <p className="font-medium">Due Date:</p>
                              <div className="flex items-center gap-1">
                                <p className="text-muted-foreground">{normalizeDate(task.dueDate).toLocaleDateString()}</p>
                                {task.status !== 'completed' && task.status !== 'blocked' && (
                                <Badge
                                  variant={timeRemaining.isOverdue ? "destructive" : "outline"}
                                  className={`text-xs ${timeRemaining.color}`}
                                >
                                  {timeRemaining.isOverdue ? '🚨 Overdue' : `⏰ ${timeRemaining.text}`}
                                </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {getAssignedByIcon(resolvedAssignedByRole)}
                            <div>
                              <p className="font-medium">Assigned by:</p>
                              <div className="flex items-center gap-2">
                                <p className="text-muted-foreground">{assignedByUser?.name || selectedAssignedByUserState?.name || getUserDisplayName(task.assignedBy) || 'Unknown'}</p>
                                <Badge className={`text-xs ${getAssignedByColor(resolvedAssignedByRole)}`}>
                                  {formatAssignedByRole(resolvedAssignedByRole)}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {task.attachments.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md border text-xs"
                                >
                                  <File className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  {attachment.type && attachment.type.startsWith('image/') ? (
                                    <img src={attachment.url} alt={attachment.name} className="h-6 w-6 object-cover rounded flex-shrink-0" />
                                  ) : null}
                                  <div className="min-w-0 flex-1">
                                    <a href={attachment.url} target="_blank" rel="noreferrer" className="truncate block text-sm text-blue-600 hover:underline">
                                    {attachment.name}
                                  </a>
                                    <span className="text-muted-foreground text-xs">
                                    ({Math.round((attachment.size || 0) / 1024)}KB)
                                  </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pt-4 border-t mt-4">
                          <div className="text-xs text-muted-foreground">
                            Updated: {normalizeDate(task.updatedAt).toLocaleDateString()}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => {
                                setDiscussionTask(task);
                                setShowDiscussionDialog(true);
                              }}
                              className="flex items-center gap-1"
                            >
                              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">Discussion</span>
                              <span className="sm:hidden">Chat</span>
                            </Button>
                            <Dialog open={isDialogOpen} onOpenChange={setShowViewDetailsDialog}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => {
                                  setSelectedTask(task);
                                  setShowViewDetailsDialog(true);
                                }} className="w-full sm:w-auto">
                                  <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="hidden sm:inline">View Details</span>
                                  <span className="sm:hidden">View</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div>
                                        <p className="font-medium">Status</p>
                                        <Badge variant={getStatusColor(selectedTask.status)}>
                                          {selectedTask.status.replace('_', ' ')}
                                        </Badge>
                                      </div>
                                      <div>
                                        <p className="font-medium">Priority</p>
                                        <Badge variant={getPriorityColor(selectedTask.priority)}>
                                          {selectedTask.priority}
                                        </Badge>
                                      </div>
                                      {(() => {
                                        // resolve assigned user and department for the selected task
                                        const selAssignedUser = usersState.find((u: any) => (u.id || u._id) == selectedTask.assignedTo) || mockUsers.find((u:any) => (u.id||u._id) == selectedTask.assignedTo) || null;
                                        const selTaskDeptId = typeof selectedTask.departmentId === 'string'
                                          ? selectedTask.departmentId
                                          : (selectedTask.departmentId && (selectedTask.departmentId.id || selectedTask.departmentId._id)) || null;
                                        const selDeptObj = departmentsState.find((d:any) => (d.id||d._id) == selTaskDeptId) || mockDepartments.find((d:any) => (d.id||d._id) == selTaskDeptId) || null;
                                        const selDeptName = selDeptObj ? (selDeptObj.name || selDeptObj.title || selDeptObj.departmentName) : (selectedTask.department && (typeof selectedTask.department === 'string' ? selectedTask.department : (selectedTask.department.name || selectedTask.department.title))) || 'Unknown';

                                        return (
                                          <>
                                      <div>
                                        <p className="font-medium">Assigned to</p>
                                                <p className="text-sm">{getUserDisplayName(selectedTask.assignedTo) || selectedAssignedUserState?.name || selAssignedUser?.name || 'Unknown'}</p>
                                      </div>
                                      <div>
                                        <p className="font-medium">Department</p>
                                                <p className="text-sm">{selDeptName}</p>
                                      </div>
                                          </>
                                        );
                                      })()}
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
                                          {selectedTask.attachments.map((attachment) => (
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
                                      <Button variant="outline" onClick={() => {
                                        setShowViewDetailsDialog(false);
                                        setSelectedTask(null);
                                      }}>
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
                }) )}
              </div>

              {/* Edit Task Modal */}
              <Dialog open={editModalOpen} onOpenChange={(open) => { if (!open) { setEditModalOpen(false); setEditForm(null); } }}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="blocked">Blocked</SelectItem>
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
                            const payload:any = {
                              title: editForm.title,
                              description: editForm.description,
                              priority: editForm.priority,
                              status: editForm.status,
                              dueDate: editForm.dueDate || undefined
                            };
                            await taskService.updateTask(editForm.id, payload);
                            if (refetchTasks) await refetchTasks();
                            setEditModalOpen(false);
                            setEditForm(null);
                            toast.success(`Task "${editForm.title}" updated successfully! ✅`);
                          } catch (e) {
                            console.error('Failed saving edit', e);
                            toast.error("Failed to update task. Please try again.");
                          } finally {
                            setSavingEdit(false);
                          }
                        }}>{savingEdit ? 'Saving...' : 'Save'}</Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4 sm:mt-6">
                  <Pagination>
                    <PaginationContent className="flex-wrap">
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                          className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {/* Page Numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current page
                        const shouldShow = 
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1);
                        
                        if (!shouldShow) {
                          // Show ellipsis for gaps
                          if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        }
                        
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                              }}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                          className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              {filteredTasks.length === 0 && (
                <div className="text-center py-8 sm:py-12">
                  {activeTab === 'recent' && <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />}
                  {activeTab === 'completed' && <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />}
                  {activeTab === 'overdue' && <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />}
                  <h3 className="text-base sm:text-lg font-medium mb-2">
                    {activeTab === 'recent' && 'No recent tasks found'}
                    {activeTab === 'completed' && 'No completed tasks found'}
                    {activeTab === 'overview' && 'No tasks found'}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground px-4">
                    {searchTerm || priorityFilter !== 'all' || departmentFilter !== 'all'
                      ? 'Try adjusting your search filters' 
                      : activeTab === 'recent' 
                        ? 'No active tasks in the system'
                        : activeTab === 'completed'
                          ? 'No tasks have been completed yet'
                          : 'No tasks in the system - create your first task'}
                  </p>
                  {activeTab !== 'completed' && (
                    <Button className="mt-4" onClick={() => setShowAssignDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Create First Task</span>
                      <span className="sm:hidden">Create Task</span>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      {/* Assign Task Dialog - Super Admin can assign to anyone across all departments */}
      <AssignTaskDialog
        open={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        onAssignTask={handleAssignTask}
        departmentMembers={allUsers} // Super admin can assign to all users
        currentUser={currentUser}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              "{taskToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setTaskToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (taskToDelete) {
                  deleteTask(taskToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TaskDiscussionDialog
        open={showDiscussionDialog}
        task={discussionTask}
        onClose={() => {
          setShowDiscussionDialog(false);
          setDiscussionTask(null);
        }}
        currentUserId={currentUser?.id}
        currentUserRole={currentUser?.role}
      />
    </div>
  );
}
