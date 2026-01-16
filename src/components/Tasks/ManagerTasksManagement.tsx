import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  AlertTriangle,
  Target,
  Crown,
  Shield,
  Timer,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Eye,
  UserPlus,
  Paperclip,
  File,
  MessageCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AssignTaskDialog from './AssignTaskDialog';
import { useAuth } from '@/components/Auth/AuthProvider';
import { mockTasks, mockUsers, mockDepartments } from '@/data/mockData';
import { taskService } from '@/services/taskService';
import { useQuery } from '@tanstack/react-query';
import useHODManagement from '@/hooks/useHODManagement';
import TaskDiscussionDialog from './TaskDiscussionDialog';

export default function ManagerTasksManagement() {
  const { currentUser } = useAuth();
  const userDeptId = currentUser?.departmentId;
  const { departmentUsers = [], isLoading } = useHODManagement(userDeptId);
  // Helper to extract the assignedTo id from a task whether populated or string
  const getAssignedToId = (task: any) => {
    if (!task) return '';
    const a = task.assignedTo;
    if (!a) return '';
    if (typeof a === 'string') return a;
    // populated object might have _id or id
    if (typeof a === 'object') return String(a._id || a.id || '');
    return '';
  };
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskDetailsDialog, setShowTaskDetailsDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDiscussionDialog, setShowDiscussionDialog] = useState(false);
  const [discussionTask, setDiscussionTask] = useState<any>(null);

  // Update current time every 30 seconds for more accurate countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(timer);
  }, []);

  // Helper function to calculate time remaining with real-time countdown
  const getTimeRemaining = (dueDate: any) => {
    const now = currentTime;

    // Handle undefined or invalid dueDate
    if (!dueDate) {
      return { text: 'No due date', color: 'text-gray-500', isOverdue: false };
    }

    // Convert to Date if it's a string
    const due = dueDate instanceof Date ? dueDate : new Date(dueDate);

    // Check if date is valid
    if (isNaN(due.getTime())) {
      return { text: 'Invalid date', color: 'text-gray-500', isOverdue: false };
    }

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

  // Helper function to safely format dates
  const formatDate = (date: any, fallback: string = 'N/A') => {
    if (!date) return fallback;

    try {
      // Handle different input types
      const dateObj = date instanceof Date ? date : new Date(date);

      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }

      return dateObj.toLocaleDateString();
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Helper function to get formatted creation date
  const getCreatedDate = (createdAt: any) => formatDate(createdAt);

  // Function to update task status (persist to backend and update local lists)
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      // Optimistic UI update for local tasks and teamTasks
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, status: newStatus as any, updatedAt: new Date() }
            : task
        )
      );

      setTeamTasks(prevTasks =>
        prevTasks.map(task =>
          (String(task.id) === String(taskId))
            ? { ...task, status: newStatus as any, updatedAt: new Date() }
            : task
        )
      );

      // Persist change to backend
      await taskService.updateTaskStatus(String(taskId), newStatus as any);

      // After successful update, re-fetch team tasks to ensure consistency
      if (usedMemberIds && usedMemberIds.length > 0) {
        try {
          const res: any = await taskService.getTasksByAssignedToList(usedMemberIds, 1, 1000, { populate: 'assignedTo,assignedBy' } as any);
          let arr: any[] = [];
          if (Array.isArray(res)) arr = res;
          else if (Array.isArray(res?.data)) arr = res.data;
          else if (Array.isArray(res?.tasks)) arr = res.tasks;

          const processedTasks = arr.map((t: any) => {
            const assignedToId = getAssignedToId(t);
            const assignedById = typeof t.assignedBy === 'string' ? t.assignedBy : (t.assignedBy?._id || t.assignedBy?.id);
            return {
              ...t,
              id: t.id || t._id,
              dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
              createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
              updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
              assignedTo: assignedToId,
              assignedBy: assignedById,
              assignedToUser: t.assignedTo && typeof t.assignedTo === 'object' ? t.assignedTo : null,
              assignedByUser: t.assignedBy && typeof t.assignedBy === 'object' ? t.assignedBy : null,
            };
          });

          setTeamTasks(processedTasks);
        } catch (e) {
          console.warn('ManagerTasksManagement: Failed to re-fetch team tasks after status update', e);
        }
      }
    } catch (error) {
      console.error('Failed to update task status', error);
    }
  };

  // Function to add new task
  const handleAssignTask = (taskData: any) => {
    const createdTasks = Array.isArray(taskData)
      ? taskData.filter(Boolean)
      : (taskData ? [taskData] : []);
    if (createdTasks.length) {
      setTasks(prevTasks => [...prevTasks, ...createdTasks]);
    }
    setShowAssignDialog(false);
  };

  // Find user's department
  const userDepartment = currentUser?.departmentId ?
    mockDepartments.find(d => d.id === currentUser.departmentId) : null;





  // Normalize local tasks created/edited in this view
  const normalizedLocalTasks = tasks.map((task: any) => ({
    ...task,
    id: task.id || task._id,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    createdAt: task.createdAt ? new Date(task.createdAt) : undefined,
    updatedAt: task.updatedAt ? new Date(task.updatedAt) : undefined,
    // Ensure assignedTo and assignedBy are strings for lookup
    assignedTo: getAssignedToId(task),
    assignedBy: typeof task.assignedBy === 'string' ? task.assignedBy : (task.assignedBy?._id || task.assignedBy?.id),
    // Store populated user data if available
    assignedToUser: task.assignedTo && typeof task.assignedTo === 'object' ? task.assignedTo : null,
    assignedByUser: task.assignedBy && typeof task.assignedBy === 'object' ? task.assignedBy : null,
  }));

  // State for team tasks
  const [teamTasks, setTeamTasks] = useState<any[]>([]);

  // Compute managed member ids for team fetch and include in deps so effect re-runs when ids change
  const managedIds: string[] = Array.isArray((currentUser as any)?.managedMemberIds) ? (currentUser as any).managedMemberIds : [];
  // Prefer department users from useHODManagement as fallback (they arrive after login)
  const departmentMemberIds = Array.isArray(departmentUsers) && departmentUsers.length > 0
    ? departmentUsers.filter((u: any) => String(u.managerId) === String(currentUser?.id)).map((u: any) => String(u.id || u._id))
    : [];
  // Last-resort fallback to mockUsers (local dev data)
  const mockFallbackIds = mockUsers.filter(u => String(u.managerId) === String(currentUser?.id)).map(u => String(u.id));

  // Use managedIds if present, otherwise department members, otherwise mock data
  const usedMemberIds = (managedIds && managedIds.length > 0)
    ? managedIds.map(String)
    : (departmentMemberIds.length > 0 ? departmentMemberIds : mockFallbackIds);

  // Fetch team tasks
  useEffect(() => {
    const fetchTeamTasks = async () => {
      console.log('ManagerTasksManagement: Fetching team tasks for user:', currentUser?.id);
      console.log('ManagerTasksManagement: Used member IDs:', usedMemberIds);

      if (usedMemberIds.length === 0) {
        console.log('ManagerTasksManagement: No managed members found, setting empty team tasks');
        setTeamTasks([]);
        return;
      }

      try {
        const res: any = await taskService.getTasksByAssignedToList(usedMemberIds, 1, 1000, { populate: 'assignedTo,assignedBy' } as any);
        let arr: any[] = [];
        if (Array.isArray(res)) arr = res;
        else if (Array.isArray(res?.data)) arr = res.data;
        else if (Array.isArray(res?.tasks)) arr = res.tasks;

        console.log('ManagerTasksManagement: Received team tasks response:', arr.length, 'tasks');

        const processedTasks = arr.map((t: any) => {
          // Extract user information from populated objects or IDs
          const assignedToId = getAssignedToId(t);
          const assignedById = typeof t.assignedBy === 'string' ? t.assignedBy : (t.assignedBy?._id || t.assignedBy?.id);

          return {
            ...t,
            id: t.id || t._id,
            dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
            createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
            updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
            // Ensure assignedTo and assignedBy are strings for lookup
            assignedTo: assignedToId,
            assignedBy: assignedById,
            // Store populated user data if available
            assignedToUser: t.assignedTo && typeof t.assignedTo === 'object' ? t.assignedTo : null,
            assignedByUser: t.assignedBy && typeof t.assignedBy === 'object' ? t.assignedBy : null,
          }
        });

        console.log('ManagerTasksManagement: Processed team tasks:', processedTasks.length);
        setTeamTasks(processedTasks);
      } catch (e) {
        console.warn('ManagerTasksManagement: Failed to fetch team tasks', e);
        setTeamTasks([]);
      }
    };

    if (currentUser) {
      fetchTeamTasks();
    } else {
      setTeamTasks([]);
    }
  }, [currentUser?.id, (currentUser as any)?.managedMemberIds?.join(','), departmentUsers.length, activeTab]);

  // Combine team tasks with locally created/edited tasks (team-only)
  const allTasks = (() => {
    const map = new Map<string, any>();
    const noId: any[] = [];

    const addTask = (task: any) => {
      const id = task?.id || task?._id;
      if (!id) {
        noId.push(task);
        return;
      }
      map.set(String(id), task);
    };

    teamTasks.forEach(addTask);
    normalizedLocalTasks.forEach(addTask);

    return [...map.values(), ...noId];
  })();

  // Get team members for manager filtering - prefer actual department users filtered by managerId
  const teamMembers = Array.isArray(departmentUsers) && departmentUsers.length > 0
    ? departmentUsers.filter((user: any) => String(user.managerId) === String(currentUser?.id))
    : mockUsers.filter(user => user.managerId === currentUser?.id);

  // Get tasks by category (from both department and team tasks)
  const recentTasks = allTasks.filter(t => t.status !== 'completed' && t.status !== 'blocked' && !getTimeRemaining(t.dueDate).isOverdue);
  const completedTasks = allTasks.filter(t => t.status === 'completed');
  const overdueTasks = allTasks.filter(t => getTimeRemaining(t.dueDate).isOverdue && t.status !== 'completed' && t.status !== 'blocked');
  const blockedTasks = allTasks.filter(t => t.status === 'blocked');

  // Debug logging for task counts
  console.log('ManagerTasksManagement - Task counts:', {
    allTasks: allTasks.length,
    recentTasks: recentTasks.length,
    completedTasks: completedTasks.length,
    overdueTasks: overdueTasks.length,
    blockedTasks: blockedTasks.length,
    activeTab
  });

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
    const matchesAssignedTo = assignedToFilter === 'all' ||
      (typeof task.assignedTo === 'string' ? task.assignedTo === assignedToFilter : (task.assignedTo?.id === assignedToFilter || task.assignedTo?._id === assignedToFilter));

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignedTo;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, assignedToFilter, activeTab]);

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

  // Resolve user reference(s) into a display object (supports arrays)
  const resolveUserDisplay = (userField: any): { id: any; name: string | null } | null => {
    if (!userField) return null;
    if (Array.isArray(userField)) {
      const resolved = userField.map(resolveUserDisplay).filter(Boolean) as Array<{ id: any; name: string | null }>;
      if (!resolved.length) return null;
      const names = resolved.map(r => r?.name).filter(Boolean).join(', ');
      return { id: resolved[0]?.id, name: names || resolved[0]?.name || null };
    }
    if (typeof userField === 'object') {
      const id = (userField as any)._id || (userField as any).id || null;
      const name = (userField as any).name || (userField as any).fullName || (((userField as any).firstName || '') + ' ' + ((userField as any).lastName || '')).trim() || (userField as any).email || (userField as any).username || null;
      return { id, name };
    }
    if (typeof userField === 'string') {
      const found = mockUsers.find(u => String(u.id) === String(userField) || String((u as any)._id) === String(userField));
      if (found) return { id: found.id || (found as any)._id, name: found.name || (found as any).fullName || found.email };
      return { id: userField, name: userField };
    }
    return null;
  };

  const getAssignedByIcon = (assignedByRole?: string) => {
    switch (assignedByRole) {
      case 'super_admin': return <Crown className="h-4 w-4" />;
      case 'department_head': return <Shield className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'manager': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getAssignedByColor = (assignedByRole?: string) => {
    switch (assignedByRole) {
      case 'super_admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'department_head': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'admin': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'manager': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatAssignedByRole = (assignedByRole?: string) => {
    switch (assignedByRole) {
      case 'super_admin': return 'Super Admin';
      case 'department_head': return 'HOD';
      case 'admin': return 'Admin';
      case 'manager': return 'Manager';
      default: return 'Unknown';
    }
  };

  // Statistics (from combined department and team tasks)
  const totalTasks = allTasks.length;
  const completedTasksCount = completedTasks.length;
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = allTasks.filter(t => t.status === 'assigned').length;
  const superAdminTasks = allTasks.filter(t => t.assignedByRole === 'super_admin').length;
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
      value: blockedTasks.length,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/50'
    }
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Task Management</h1>
            <p className="text-muted-foreground">
              Manage tasks assigned to your team members
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium mb-2">Loading Team Tasks</h3>
          <p className="text-muted-foreground">Please wait while we fetch your team tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Task Management</h1>
          <p className="text-muted-foreground">
            Manage tasks assigned to your team members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAssignDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Assign Task
          </Button>
        </div>
      </div>

      {/* Assign Task Dialog */}
      <AssignTaskDialog
        open={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        onAssignTask={(task) => handleAssignTask(task)}
        departmentMembers={departmentUsers}
        currentUser={currentUser}
      />

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
            <AlertTriangle className="h-4 w-4" />
            Blocked ({blockedTasks.length})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              {activeTab === 'recent' && 'Recent Team Tasks'}
              {activeTab === 'completed' && 'Completed Team Tasks'}
              {activeTab === 'overdue' && 'Overdue Team Tasks'}
              {activeTab === 'blocked' && 'Blocked Team Tasks'}
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

              <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All User</SelectItem>
                  {teamMembers
                    .filter((member: any) => String(member.id || member._id) !== String(currentUser?.id))
                    .map((member: any) => (
                      <SelectItem key={member.id || member._id} value={member.id || member._id}>
                        {member.name || member.fullName || member.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tasks List */}
            <TabsContent value={activeTab} className="mt-0">
              <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12">
                    {activeTab === 'recent' && <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                    {activeTab === 'completed' && <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                    {activeTab === 'overdue' && <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                    {activeTab === 'blocked' && <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                    <h3 className="text-lg font-medium mb-2">
                      {activeTab === 'recent' && 'No recent tasks found'}
                      {activeTab === 'completed' && 'No completed tasks found'}
                      {activeTab === 'overdue' && 'No overdue tasks found'}
                      {activeTab === 'blocked' && 'No blocked tasks found'}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || assignedToFilter !== 'all'
                        ? 'Try adjusting your search filters'
                        : activeTab === 'recent'
                          ? 'No active tasks assigned to your team'
                          : activeTab === 'completed'
                            ? 'No tasks have been completed yet'
                            : activeTab === 'overdue'
                              ? 'No overdue tasks - great job!'
                              : activeTab === 'blocked'
                                ? 'No blocked tasks - great job!'
                                : ''}
                    </p>
                  </div>
                ) : (
                  currentTasks.map((task) => {
                    // Use populated user data if available, otherwise lookup in mockUsers
                    const assignedUsersResolved = resolveUserDisplay(
                      (task as any).assignedToList && (task as any).assignedToList.length
                        ? (task as any).assignedToList
                        : (task.assignedToUser || task.assignedTo)
                    );

                    const assignedByUser = resolveUserDisplay(task.assignedByUser || task.assignedBy) ||
                      resolveUserDisplay(mockUsers.find(u => u.id === task.assignedBy)) ||
                      null;
                    const assignedByLabel = assignedByUser?.name || (task.assignedByRole ? formatAssignedByRole(task.assignedByRole) : 'Unknown');

                    const timeRemaining = getTimeRemaining(task.dueDate);
                    const createdDate = getCreatedDate(task.createdAt);

                    return (
                      <Card key={task.id} className={`hover:shadow-md transition-shadow ${task.status === 'completed'
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
                                {/* Removed duplicate green "✓ Completed" badge to keep only status badge */}
                              </div>
                              <p className={`text-sm mb-4 ${task.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                {task.description}
                              </p>
                            </div>

                            {/* Status Selector */}
                            <div className="flex items-center gap-2 ml-4">
                              <Select
                                value={task.status}
                                onValueChange={(value) => updateTaskStatus(task.id, value)}
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
                              {/* Show edit button only if current user created this task */}
                              {task.assignedBy === currentUser?.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingTask(task);
                                    setShowEditDialog(true);
                                  }}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">Assigned to:</p>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {(() => {
                                        const name = assignedUsersResolved?.name || 'UN';
                                        // If multiple users (comma separated), take the first one
                                        const firstName = name.split(',')[0].trim();
                                        return firstName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                                      })()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{assignedUsersResolved?.name || 'Unknown'}</span>
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
                                  <p className="text-muted-foreground">{formatDate(task.dueDate)}</p>
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
                              {getAssignedByIcon(task.assignedByRole)}
                              <div>
                                <p className="font-medium">Assigned by:</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-muted-foreground">{assignedByLabel}</p>
                                  <Badge className={`text-xs ${getAssignedByColor(task.assignedByRole)}`}>
                                    {formatAssignedByRole(task.assignedByRole)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Attachments Section */}
                          {
                            task.attachments && task.attachments.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="flex items-center gap-2 mb-2">
                                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                                  <p className="font-medium text-sm">Attachments ({task.attachments.length})</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {task.attachments.map((attachment) => (
                                    <a
                                      key={attachment.id}
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md border text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                    >
                                      <File className="h-3 w-3 text-muted-foreground" />
                                      <span className="truncate max-w-32">{attachment.name}</span>
                                      <span className="text-muted-foreground">
                                        ({Math.round(attachment.size / 1024)}KB)
                                      </span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )
                          }

                          <div className="flex items-center justify-between pt-4 border-t mt-4">
                            <div className="text-xs text-muted-foreground">
                              Updated: {formatDate(task.updatedAt)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setDiscussionTask(task);
                                  setShowDiscussionDialog(true);
                                }}
                                className="flex items-center gap-1"
                              >
                                <MessageCircle className="h-4 w-4" />
                                <span className="hidden sm:inline">Discussion</span>
                                <span className="sm:hidden">Chat</span>
                              </Button>
                              <Dialog open={showTaskDetailsDialog && selectedTask?.id === task.id} onOpenChange={setShowTaskDetailsDialog}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => {
                                    setSelectedTask(task);
                                    setShowTaskDetailsDialog(true);
                                  }}>
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
                                        <div>
                                          <p className="font-medium">Assigned to</p>
                                          <p className="text-sm">
                                            {selectedTask.assignedToUser?.name ||
                                              mockUsers.find(u => u.id === selectedTask.assignedTo)?.name ||
                                              'Unknown'}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="font-medium">Due Date</p>
                                          <p className="text-sm">{formatDate(selectedTask.dueDate)}</p>
                                        </div>
                                      </div>

                                      <div className="flex justify-end">
                                        <Button variant="outline" onClick={() => {
                                          setShowTaskDetailsDialog(false);
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
                        </CardContent >
                      </Card >
                    );
                  })
                )}
              </div>

              {/* Pagination Controls */}
              {filteredTasks.length > itemsPerPage && (
                <div className="flex items-center justify-between border-t pt-4 mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTasks.length)} of {filteredTasks.length} tasks
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent >
          </CardContent >
        </Card >
      </Tabs >

      {/* Edit Task Dialog */}
      < Dialog open={showEditDialog} onOpenChange={setShowEditDialog} >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edit Task
            </DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Task Title</label>
                <Input
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={editingTask.priority}
                    onValueChange={(value) => setEditingTask({ ...editingTask, priority: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={editingTask.dueDate ? (() => {
                      // Fix timezone issue by using local date
                      const date = new Date(editingTask.dueDate);
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    })() : ''}
                    onChange={(e) => {
                      // Create date in local timezone
                      const dateValue = e.target.value;
                      if (dateValue) {
                        const [year, month, day] = dateValue.split('-').map(Number);
                        const localDate = new Date(year, month - 1, day);
                        setEditingTask({ ...editingTask, dueDate: localDate });
                      } else {
                        setEditingTask({ ...editingTask, dueDate: null });
                      }
                    }}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      setIsUpdating(true);

                      // Prepare update data
                      const updateData = {
                        title: editingTask.title,
                        description: editingTask.description,
                        priority: editingTask.priority,
                        dueDate: editingTask.dueDate ? (() => {
                          // Send date in local timezone format
                          const date = new Date(editingTask.dueDate);
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          return `${year}-${month}-${day}`;
                        })() : null
                      };

                      // Call backend API to update task
                      await taskService.updateTask(editingTask.id, updateData);

                      // Update local state
                      setTasks(prev => prev.map(t =>
                        t.id === editingTask.id ? { ...t, ...updateData } : t
                      ));

                      // Close dialog
                      setShowEditDialog(false);
                      setEditingTask(null);

                      console.log('Task updated successfully');
                    } catch (error) {
                      console.error('Failed to update task:', error);
                      // You could add a toast notification here
                    } finally {
                      setIsUpdating(false);
                    }
                  }}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog >
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
    </div >
  );
}
