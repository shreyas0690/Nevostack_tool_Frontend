import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Filter,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { mockUsers, mockDepartments } from '@/data/mockData';
import { User, Department, TaskStatus, TaskPriority } from '@/types/company';
import { taskService, type Task } from '@/services/taskService';
import { departmentService } from '@/services/departmentService';
import { useQuery } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import toast from 'react-hot-toast';
import AddTaskDialog from './AddTaskDialog';
import EditTaskDialog from './EditTaskDialog';
import MeetingDialog from './MeetingDialog';

export default function TasksManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch tasks from API
  const { data: tasks = [], isLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await taskService.getTasks();
      return response.data || [];
    }
  });

  // Fetch departments from API
  const { data: departmentsData = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentService.getDepartments({ limit: 1000 });
      return response.data || [];
    }
  });

  const filteredTasks = tasks.filter(task => {
    const searchValue = searchTerm.toLowerCase();
    const matchesSearch = String(task.title || '').toLowerCase().includes(searchValue) ||
      String(task.description || '').toLowerCase().includes(searchValue);
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    // Handle department filtering - departmentId can be an object (populated) or string
    let matchesDepartment = true;
    if (departmentFilter !== 'all') {
      const taskDept = (task as any).departmentId;
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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, priorityFilter, departmentFilter]);

  const getUser = (userId: string): User | undefined => {
    return mockUsers.find(user => user.id === userId);
  };

  // Resolve user-like values (id string, object, or array) to a display object { id, name }
  const resolveUserDisplay = (userField: any) => {
    if (!userField) return null;
    if (Array.isArray(userField)) {
      const resolved = userField.map(resolveUserDisplay).filter(Boolean) as Array<{ id: any; name: string | null }>;
      if (!resolved.length) return null;
      const names = resolved.map(r => r?.name).filter(Boolean).join(', ');
      return { id: resolved[0]?.id, name: names || resolved[0]?.name };
    }
    if (typeof userField === 'object') {
      const id = (userField as any)._id || (userField as any).id || null;
      const name = (userField as any).name || (userField as any).fullName || (((userField as any).firstName || '') + ' ' + ((userField as any).lastName || '')).trim() || (userField as any).email || (userField as any).username || null;
      return { id, name };
    }
    if (typeof userField === 'string') {
      const u = mockUsers.find(u => String(u.id) === String(userField) || String((u as any)._id) === String(userField));
      if (u) return { id: u.id || (u as any)._id, name: u.name || (u as any).fullName || u.email };
      return { id: userField, name: userField };
    }
    return null;
  };

  const formatAssignedByRole = (role?: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'manager': return 'Manager';
      default: return role || 'Unknown';
    }
  };

  const getDepartment = (deptId: string): Department | undefined => {
    // Use real departments from backend, fallback to mock data
    const realDept = departmentsData.find(dept => dept.id === deptId);
    if (realDept) return realDept;
    return mockDepartments.find(dept => dept.id === deptId);
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

  const isTaskOverdue = (task: Task) => {
    const due = resolveDueDate(task.dueDate);
    return !!due && due.getTime() < Date.now();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'blocked': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-orange-600" />;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const addTask = async (taskData: any) => {
    try {
      await taskService.createTask({
        title: taskData.title,
        description: taskData.description,
        assignedTo: taskData.assignedTo,
        priority: taskData.priority,
        category: taskData.category || 'General',
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : undefined
      });
      refetchTasks();
      toast.success(`Task "${taskData.title}" created successfully! 🎉`);
    } catch (error) {
      toast.error("Failed to create task. Please try again.");
    }
  };

  const editTask = async (id: string, taskData: any) => {
    try {
      await taskService.updateTask(id, {
        title: taskData.title,
        description: taskData.description,
        assignedTo: taskData.assignedTo,
        priority: taskData.priority,
        status: taskData.status,
        category: taskData.category || 'General',
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : undefined
      });
      refetchTasks();
      toast.success(`Task "${taskData.title}" updated successfully! ✅`);
    } catch (error) {
      toast.error("Failed to update task. Please try again.");
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      await taskService.deleteTask(id);
      refetchTasks();
      toast.success(`Task "${task?.title}" deleted successfully! 🗑️`);
    } catch (error) {
      toast.error("Failed to delete task. Please try again.");
    }
  };

  const quickUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      await taskService.updateTask(taskId, { status: newStatus as any });
      refetchTasks();
      toast.success(`Task "${task?.title}" status updated to ${newStatus.replace('_', ' ')}! 🔄`);
    } catch (error) {
      toast.error("Failed to update task status. Please try again.");
    }
  };

  const stats = [
    {
      title: 'Total Tasks',
      value: tasks.length,
      icon: ClipboardList,
      color: 'text-blue-600'
    },
    {
      title: 'In Progress',
      value: tasks.filter(t => t.status === 'in_progress').length,
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'Completed',
      value: tasks.filter(t => t.status === 'completed').length,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Overdue',
      value: tasks.filter(t => isTaskOverdue(t) && t.status !== 'completed').length,
      icon: AlertCircle,
      color: 'text-red-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Loading Header */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent rounded-xl"></div>
            <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-lg shadow-red-500/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 dark:from-red-400 dark:via-red-500 dark:to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                  <ClipboardList className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Task Management</h1>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Manage and track team tasks and assignments</p>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent rounded-xl"></div>
          <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-lg shadow-red-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 dark:from-red-400 dark:via-red-500 dark:to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                  <ClipboardList className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Task Management</h1>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Manage and track team tasks and assignments</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>System Active</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <TrendingUp className="h-3 w-3" />
                      <span>Real-time Updates</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowMeetingDialog(true)}
                  className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-red-300 dark:hover:border-red-600 rounded-lg font-medium transition-all duration-200"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </Button>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="group border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
              <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <Filter className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Filter Tasks</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Search and filter your tasks</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400"
                />
              </div>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">🟢 Low</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departmentsData.map((dept) => (
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
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
              <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <ClipboardList className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">All Tasks</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Manage and track your team's tasks</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {paginatedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  {searchTerm || priorityFilter !== 'all' || departmentFilter !== 'all'
                    ? 'No tasks match your filters'
                    : 'No tasks found'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
                  {searchTerm || priorityFilter !== 'all' || departmentFilter !== 'all'
                    ? 'Try adjusting your search criteria or filters'
                    : 'Get started by creating your first task'}
                </p>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
            ) : (
              paginatedTasks.map((task) => {
                const assignedUserResolved = resolveUserDisplay((task as any).assignedToList && (task as any).assignedToList.length ? (task as any).assignedToList : task.assignedTo);
                const assignedByUserResolved = resolveUserDisplay(task.assignedBy);
                const taskDept = (task as any).departmentId;
                let taskDeptId;
                if (taskDept) {
                  // If departmentId is populated (object), use the _id field
                  taskDeptId = typeof taskDept === 'object' ? taskDept._id : taskDept;
                } else {
                  // Fallback to category if no departmentId
                  taskDeptId = task.category;
                }
                const department = getDepartment(taskDeptId);
                const isOverdue = isTaskOverdue(task) && task.status !== 'completed' && task.status !== 'cancelled';

                return (
                  <Card key={task.id} className={`group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4 hover:shadow-md transition-shadow duration-200 overflow-hidden ${isOverdue ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : ''}`}>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                  {getStatusIcon(task.status as any)}
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                    {task.title}
                                  </h3>
                                  {isOverdue && (
                                    <Badge variant="destructive" className="text-xs mt-1">
                                      Overdue
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 ml-11 leading-relaxed">
                                {task.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Delete Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowDeleteDialog(true);
                                }}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-background border shadow-md">
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedTask(task);
                                    setShowEditDialog(true);
                                  }}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit Task
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => quickUpdateStatus(task.id, 'completed' as any)} disabled={task.status === 'completed'}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark Complete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              <Badge variant="outline">
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </div>

                            {department && (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: department.color }}
                                />
                                <span className="text-muted-foreground">{department.name}</span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm bg-muted/20 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <div>
                                <span className="text-blue-600 font-medium" style={{ fontSize: '12px' }}>
                                  Assigned: {new Date(task.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <span className={`${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`} style={{ fontSize: '12px' }}>
                                  Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                                </span>
                              </div>
                            </div>

                            {assignedByUserResolved && (
                              <div className="flex items-center gap-2">
                                <Avatar className="w-4 h-4">
                                  <AvatarFallback className="text-xs">
                                    {(assignedByUserResolved.name || '').charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-green-600 font-medium" style={{ fontSize: '12px' }}>
                                    By: {assignedByUserResolved.name}
                                  </div>
                                  <div className="text-muted-foreground text-xs">
                                    {formatAssignedByRole('admin')}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>


                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-4">
                              {assignedUserResolved && (
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="text-xs">
                                      {assignedUserResolved.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">
                                    Assigned to: <span className="font-medium">{assignedUserResolved.name}</span>
                                  </span>
                                </div>
                              )}

                              {assignedByUserResolved && (
                                <span className="text-xs text-muted-foreground">
                                  by {assignedByUserResolved.name}
                                </span>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Select value={task.status} onValueChange={(value: string) => quickUpdateStatus(task.id, value)}>
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="assigned">Assigned</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="blocked">Blocked</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent>
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

          {/* Dialogs */}
          <AddTaskDialog
            open={showAddDialog}
            onClose={() => setShowAddDialog(false)}
            onAdd={addTask as any}
            currentUserId="1"
          />

          <EditTaskDialog
            open={showEditDialog}
            task={selectedTask as any}
            onClose={() => {
              setShowEditDialog(false);
              setSelectedTask(null);
            }}
            onSave={editTask as any}
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
                      deleteTask(selectedTask.id);
                    }
                    setShowDeleteDialog(false);
                    setSelectedTask(null);
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <MeetingDialog
            open={showMeetingDialog}
            onClose={() => setShowMeetingDialog(false)}
          />
      </div>
      );
}
