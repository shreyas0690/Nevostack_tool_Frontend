import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  UserCheck,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Activity,
  Filter,
  ArrowUpDown,
  Eye,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Crown,
  Shield,
  Trophy,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  List
} from 'lucide-react';
import { mockUsers, mockTasks } from '@/data/mockData';
import { departmentService } from '@/services/departmentService';
import { userService } from '@/services/userService';
import { taskService } from '@/services/taskService';
import { useQuery } from '@tanstack/react-query';
import { mockLeaveRequests } from '@/data/leaveData';
import { Department, User } from '@/types/company';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import AddDepartmentDialog from './AddDepartmentDialog';
import EditDepartmentDialog from './EditDepartmentDialog';
import EnhancedManageMembersDialog from './EnhancedManageMembersDialog';
import DepartmentHierarchy from './DepartmentHierarchy';
import DepartmentTaskDetails from './DepartmentTaskDetails';

export default function DepartmentsManagement() {
  const [searchTerm, setSearchTerm] = useState('');


  // Fetch departments from API
  const { data: departments = [], isLoading: departmentsLoading, refetch: refetchDepartments, error: departmentsError } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      try {
        const response = await departmentService.getDepartments();
        // Backend now returns data property consistently
        const departments = response.data || [];

        // Transform dates from strings to proper format for frontend
        return departments.map(dept => ({
          ...dept,
          createdAt: typeof dept.createdAt === 'string' ? dept.createdAt : new Date(dept.createdAt || new Date()).toISOString(),
          updatedAt: typeof dept.updatedAt === 'string' ? dept.updatedAt : new Date(dept.updatedAt || new Date()).toISOString(),
          // Ensure member/manager arrays exist on frontend department object
          managerIds: Array.isArray(dept.managerIds) ? dept.managerIds : [],
          memberIds: Array.isArray(dept.memberIds) ? dept.memberIds : []
        }));
      } catch (error) {
        throw error;
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch users from API - get all users for department head selection
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => {
      const response = await userService.getUsers({
        page: 1,
        limit: 10000 // Get all users
      });
      return response.data || [];
    }
  });

  // Fetch all tasks once for department-level aggregation (limit safely high)
  const { data: allTasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['allTasks', 'departments'],
    queryFn: async () => {
      try {
        const res: any = await taskService.getTasks(1, 1000, {});
        let arr: any[] = [];
        if (Array.isArray(res)) arr = res;
        else if (Array.isArray(res?.tasks)) arr = res.tasks;
        else if (Array.isArray(res?.data)) arr = res.data;
        else if (Array.isArray(res?.data?.tasks)) arr = res.data.tasks;
        else arr = [];

        // normalize shallow fields used below
        return arr.map((t) => ({
          ...t,
          departmentId: t.departmentId && (t.departmentId.id || t.departmentId._id) ? (t.departmentId.id || t.departmentId._id) : t.departmentId,
        }));
      } catch (e) {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showHierarchyDialog, setShowHierarchyDialog] = useState(false);
  const [showTaskDetailsDialog, setShowTaskDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  // Advanced filtering and sorting states
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [performanceFilter, setPerformanceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'cards'>('cards');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  const isLoading = departmentsLoading || usersLoading || tasksLoading;

  // Helper functions
  const getDepartmentHead = (headId?: string): User | undefined => {
    return users.find(user => user.id === headId);
  };

  const getDepartmentMembers = (deptId: string): User[] => {
    const department = departments.find(d => d.id === deptId);
    if (!department) return [];
    const memberIds = Array.isArray(department.memberIds) ? department.memberIds : [];
    return users.filter(user => memberIds.includes(user.id));
  };

  const getDepartmentManagers = (deptId: string): User[] => {
    const department = departments.find(d => d.id === deptId);
    if (!department) return [];
    const managerIds = Array.isArray(department.managerIds) ? department.managerIds : [];
    return users.filter(user => managerIds.includes(user.id));
  };

  // Advanced department analytics with memoization
  const departmentAnalytics = useMemo(() => {

    try {
      return departments.map(dept => {
        const members = getDepartmentMembers(dept.id) || [];
        const managers = getDepartmentManagers(dept.id) || [];
        const head = getDepartmentHead(dept.headId);

        // Task performance with error handling - use real tasks if available
        const deptTasks = (allTasks || mockTasks || []).filter(t => {
          try {
            const did = typeof t.departmentId === 'string' ? t.departmentId : (t.departmentId && (t.departmentId._id || t.departmentId.id));
            return String(did) === String(dept.id);
          } catch (e) {
            return false;
          }
        });
        const completedTasks = deptTasks.filter(t => t.status === 'completed');
        const inProgressTasks = deptTasks.filter(t => t.status === 'in_progress');
        const overdueTasks = deptTasks.filter(t => {
          try {
            return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed';
          } catch (e) {
            return false;
          }
        });
        const taskCompletionRate = deptTasks.length > 0 ? Math.round((completedTasks.length / deptTasks.length) * 100) : 0;

        // Leave analytics with error handling
        const deptLeaves = (mockLeaveRequests || []).filter(l =>
          l && members.some(m => m && m.id === l.employeeId)
        );
        const pendingLeaves = deptLeaves.filter(l => l.status === 'pending');

        // Performance score calculation - only calculate if there are actual tasks
        const performanceScore = deptTasks.length > 0
          ? Math.round(
            (taskCompletionRate * 0.6) +
            (Math.max(0, 100 - (overdueTasks.length / Math.max(deptTasks.length, 1)) * 100) * 0.4)
          )
          : 0;

        // Calculate last activity safely with proper date handling
        let lastActivity = Date.now();
        try {
          if (dept.createdAt) {
            // Handle both string and Date object formats
            const createdDate = typeof dept.createdAt === 'string'
              ? new Date(dept.createdAt)
              : dept.createdAt;
            if (!isNaN(createdDate.getTime())) {
              lastActivity = createdDate.getTime();
            }
          }

          if (deptTasks.length > 0) {
            const times = deptTasks
              .filter(t => t.updatedAt)
              .map(t => {
                const updateDate = typeof t.updatedAt === 'string'
                  ? new Date(t.updatedAt)
                  : t.updatedAt;
                return updateDate.getTime();
              })
              .filter(time => !isNaN(time));
            if (times.length > 0) {
              lastActivity = Math.max(...times);
            }
          }
        } catch (e) {
          lastActivity = Date.now();
        }

        return {
          ...dept,
          members,
          managers,
          head,
          totalTasks: deptTasks.length,
          completedTasks: completedTasks.length,
          inProgressTasks: inProgressTasks.length,
          overdueTasks: overdueTasks.length,
          taskCompletionRate,
          pendingLeaves: pendingLeaves.length,
          performanceScore,
          hasHead: !!head,
          lastActivity
        };
      });
    } catch (error) {
      return departments.map(dept => ({
        ...dept,
        members: getDepartmentMembers(dept.id) || [],
        managers: getDepartmentManagers(dept.id) || [],
        head: getDepartmentHead(dept.headId),
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        taskCompletionRate: 0,
        pendingLeaves: 0,
        performanceScore: 0,
        hasHead: !!getDepartmentHead(dept.headId),
        lastActivity: Date.now()
      }));
    }
  }, [departments, users, allTasks, mockTasks, mockLeaveRequests]);

  // Advanced filtering and sorting
  const filteredAndSortedDepartments = useMemo(() => {
    let filtered = departmentAnalytics.filter(dept => {
      const query = searchTerm.toLowerCase();
      const name = (dept.name || '').toLowerCase();
      const description = (dept.description || '').toLowerCase();
      // Text search
      const matchesSearch = name.includes(query) || description.includes(query);

      // Size filter
      const totalTeamSize = dept.members.length + dept.managers.length + (dept.head ? 1 : 0);
      const matchesSize = sizeFilter === 'all' ||
        (sizeFilter === 'small' && totalTeamSize <= 5) ||
        (sizeFilter === 'medium' && totalTeamSize > 5 && totalTeamSize <= 15) ||
        (sizeFilter === 'large' && totalTeamSize > 15);

      // Performance filter
      const matchesPerformance = performanceFilter === 'all' ||
        (performanceFilter === 'high' && dept.performanceScore >= 80) ||
        (performanceFilter === 'medium' && dept.performanceScore >= 60 && dept.performanceScore < 80) ||
        (performanceFilter === 'low' && dept.performanceScore < 60);

      return matchesSearch && matchesSize && matchesPerformance;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'size':
          aVal = a.members.length + a.managers.length + (a.head ? 1 : 0);
          bVal = b.members.length + b.managers.length + (b.head ? 1 : 0);
          break;
        case 'performance':
          aVal = a.performanceScore;
          bVal = b.performanceScore;
          break;
        case 'tasks':
          aVal = a.totalTasks;
          bVal = b.totalTasks;
          break;
        case 'created':
          try {
            const aDate = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
            const bDate = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
            aVal = !isNaN(aDate.getTime()) ? aDate.getTime() : 0;
            bVal = !isNaN(bDate.getTime()) ? bDate.getTime() : 0;
          } catch (e) {
            aVal = 0;
            bVal = 0;
          }
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      } else {
        return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      }
    });


    return filtered;
  }, [departmentAnalytics, searchTerm, sizeFilter, performanceFilter, sortBy, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedDepartments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDepartments = filteredAndSortedDepartments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sizeFilter, performanceFilter, sortBy, sortOrder]);

  const addDepartment = async (departmentData: Omit<Department, 'id' | 'createdAt' | 'memberCount'>) => {
    try {
      const response = await departmentService.createDepartment({
        name: departmentData.name,
        description: departmentData.description,
        headId: departmentData.headId,
        color: departmentData.color
      });
      await refetchDepartments();
      // Toast will be handled by the dialog component
    } catch (error) {
      // Re-throw error so dialog can handle it
      throw error;
    }
  };

  const editDepartment = async (id: string, departmentData: Omit<Department, 'id' | 'createdAt' | 'memberCount'>) => {
    try {
      await departmentService.updateDepartment(id, {
        name: departmentData.name,
        description: departmentData.description,
        headId: departmentData.headId,
        color: departmentData.color
      });
      await refetchDepartments();
      // Toast will be handled by the dialog component
    } catch (error) {
      // Re-throw error so dialog can handle it
      throw error;
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      const department = departments.find(d => d.id === id);
      await departmentService.deleteDepartment(id);
      refetchDepartments();
      toast.success(`${department?.name} has been deleted successfully.`);
    } catch (error) {
      toast.error("Failed to delete department.");
    }
  };

  const updateDepartmentMembers = async (departmentId: string, memberIds: string[], managerIds: string[], headId?: string) => {
    try {
      await departmentService.updateDepartment(departmentId, {
        managerIds,
        memberIds,
        headId
      });

      // Refresh data
      await Promise.all([refetchDepartments(), refetchUsers()]);

      toast.success("Department hierarchy has been updated successfully.");
    } catch (error) {
      toast.error('Failed to update department members');
    }
  };

  const downloadDepartmentsReport = () => {
    try {
      // Create CSV content
      const headers = ['Department Name', 'Head', 'Team Size', 'Performance Score', 'Task Completion', 'Total Tasks', 'Pending Leaves', 'Created At'];
      const rows = filteredAndSortedDepartments.map(dept => [
        dept.name,
        dept.head?.name || 'No Head',
        dept.members.length + dept.managers.length + (dept.head ? 1 : 0),
        `${dept.performanceScore}%`,
        `${dept.taskCompletionRate}%`,
        dept.totalTasks,
        dept.pendingLeaves,
        new Date(dept.createdAt).toLocaleDateString()
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `departments_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      toast.success('Department report downloaded successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to download report');
    }
  };

  // Advanced statistics
  const stats = useMemo(() => {
    const totalDepartments = departmentAnalytics.length;
    const totalEmployees = users.filter(u => u.isActive).length;
    const departmentsWithHeads = departmentAnalytics.filter(d => d.hasHead).length;
    const highPerformingDepts = departmentAnalytics.filter(d => d.performanceScore >= 80).length;
    const totalTasks = departmentAnalytics.reduce((sum, d) => sum + d.totalTasks, 0);
    const averagePerformance = totalDepartments > 0
      ? Math.round(departmentAnalytics.reduce((sum, d) => sum + d.performanceScore, 0) / totalDepartments)
      : 0;
    const totalOverdueTasks = departmentAnalytics.reduce((sum, d) => sum + d.overdueTasks, 0);

    return [
      {
        title: 'Total Departments',
        value: totalDepartments,
        change: '+0%',
        trend: 'neutral' as const,
        icon: Building2,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        description: 'Company departments'
      },
      {
        title: 'Total Employees',
        value: totalEmployees,
        change: '+5.2%',
        trend: 'up' as const,
        icon: Users,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        description: 'Active employees'
      },
      {
        title: 'Avg Performance',
        value: `${averagePerformance}%`,
        change: highPerformingDepts > Math.ceil(totalDepartments / 2) ? '+12%' : '-3%',
        trend: highPerformingDepts > Math.ceil(totalDepartments / 2) ? 'up' as const : 'down' as const,
        icon: Target,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        description: `${highPerformingDepts} high performing`
      },
      {
        title: 'Department Heads',
        value: departmentsWithHeads,
        change: `${Math.round((departmentsWithHeads / totalDepartments) * 100)}%`,
        trend: departmentsWithHeads === totalDepartments ? 'up' as const : 'down' as const,
        icon: Crown,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        description: 'Leadership coverage'
      },
      {
        title: 'Active Tasks',
        value: totalTasks,
        change: totalOverdueTasks > 5 ? 'High alert' : 'On track',
        trend: totalOverdueTasks > 5 ? 'down' as const : 'up' as const,
        icon: Activity,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        description: `${totalOverdueTasks} overdue`
      }
    ];
  }, [departmentAnalytics, users]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Loading Header */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent rounded-xl"></div>
            <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg shadow-red-500/5">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 dark:from-red-400 dark:via-red-500 dark:to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    <span className="hidden sm:inline">Department Management</span>
                    <span className="sm:hidden">Department Management</span>
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base">
                    <span className="hidden sm:inline">Comprehensive analytics and management for company departments</span>
                    <span className="sm:hidden">Comprehensive analytics and management for departments</span>
                  </p>
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
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Loading Departments</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Fetching your department data...</p>
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

  if (departmentsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Advanced Department Management</h1>
            <p className="text-muted-foreground">Comprehensive analytics and management for company departments</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <h3 className="text-lg font-semibold">Error Loading Departments</h3>
              <p className="text-sm text-muted-foreground">
                {departmentsError.message || 'Unable to load departments from server'}
              </p>
            </div>
            <Button onClick={() => refetchDepartments()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent rounded-xl"></div>
          <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg shadow-red-500/5">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 dark:from-red-400 dark:via-red-500 dark:to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25 hidden sm:flex">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    <span className="hidden sm:inline">Department Management</span>
                    <span className="sm:hidden">Department Management</span>
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base">
                    <span className="hidden sm:inline">Comprehensive analytics and management for company departments</span>
                    <span className="sm:hidden">Comprehensive analytics and management for departments</span>
                  </p>
                  <div className="flex items-center gap-2 sm:gap-4 mt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>System Active</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <TrendingUp className="h-3 w-3" />
                      <span>Real-time Analytics</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={downloadDepartmentsReport}
                  className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-red-300 dark:hover:border-red-600 rounded-lg font-medium transition-all duration-200 w-full sm:w-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Download Report</span>
                  <span className="sm:hidden">Export</span>
                </Button>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 rounded-lg font-medium transition-all duration-200 hover:scale-105 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Add Department</span>
                  <span className="sm:hidden">Add Dept</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trend === 'up' ? TrendingUp : stat.trend === 'down' ? TrendingDown : Activity;

            return (
              <Card key={stat.title} className="group border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                      <div className="flex items-center text-xs text-slate-600 dark:text-slate-400 mt-1">
                        <TrendIcon className="h-3 w-3 mr-1" />
                        {stat.change}
                      </div>
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
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm mt-6 sm:mt-8">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-slate-900 dark:text-slate-100">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold">Filter & Sort Departments</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Search and filter your departments</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-3 lg:gap-4">
              {/* Search */}
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 sm:h-12 rounded-xl border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-col space-y-2 sm:flex-row sm:gap-3 sm:space-y-0 flex-wrap">
                <Select value={sizeFilter} onValueChange={setSizeFilter}>
                  <SelectTrigger className="w-full sm:w-36 h-10 sm:h-12 rounded-xl border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sizes</SelectItem>
                    <SelectItem value="small">🟢 Small (≤5)</SelectItem>
                    <SelectItem value="medium">🟡 Medium (6-15)</SelectItem>
                    <SelectItem value="large">🔴 Large (15+)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-10 sm:h-12 rounded-xl border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400">
                    <SelectValue placeholder="Performance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Performance</SelectItem>
                    <SelectItem value="high">🟢 High (80%+)</SelectItem>
                    <SelectItem value="medium">🟡 Medium (60-79%)</SelectItem>
                    <SelectItem value="low">🔴 Low (&lt;60%)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-36 h-10 sm:h-12 rounded-xl border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">📝 Name</SelectItem>
                    <SelectItem value="size">📏 Size</SelectItem>
                    <SelectItem value="performance">📊 Performance</SelectItem>
                    <SelectItem value="tasks">✅ Tasks</SelectItem>
                    <SelectItem value="created">📅 Created</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-10 sm:h-12 px-4 rounded-xl border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-red-300 dark:hover:border-red-600 font-medium transition-all duration-200 w-full sm:w-auto"
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSizeFilter('all');
                    setPerformanceFilter('all');
                    setSortBy('name');
                    setSortOrder('asc');
                  }}
                  className="h-10 sm:h-12 px-4 rounded-xl border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-red-300 dark:hover:border-red-600 font-medium transition-all duration-200 w-full sm:w-auto"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results summary */}
        <div className="flex items-center justify-between mt-4 sm:mt-6">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Showing {filteredAndSortedDepartments.length} of {departmentAnalytics.length} departments</span>
          </div>
        </div>

        {/* View Mode Toggle */}
        <Tabs value={viewMode} onValueChange={(value: string) => setViewMode(value as any)} className="mt-6 sm:mt-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <TabsTrigger value="cards" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 flex items-center gap-2 text-sm">
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Card View</span>
              <span className="sm:hidden">Cards</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 flex items-center gap-2 text-sm">
              <List className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">List View</span>
              <span className="sm:hidden">List</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <TableHead className="w-[250px]">Department</TableHead>
                      <TableHead>Head</TableHead>
                      <TableHead>Team Size</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Task Completion</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDepartments.map((department) => (
                      <TableRow key={department.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-2 h-8 rounded-full"
                              style={{ backgroundColor: department.color }}
                            />
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">{department.name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{department.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {department.head ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-xs font-bold text-red-600 dark:text-red-400">
                                {department.head.name.charAt(0)}
                              </div>
                              <span className="text-sm text-slate-700 dark:text-slate-300">{department.head.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400 italic">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {department.members.length + department.managers.length + (department.head ? 1 : 0)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${department.performanceScore >= 80 ? 'bg-green-500' :
                                department.performanceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{department.performanceScore}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-[100px] space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">{department.taskCompletionRate}%</span>
                            </div>
                            <Progress value={department.taskCompletionRate} className="h-1.5" />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDepartment(department);
                                setShowTaskDetailsDialog(true);
                              }}
                              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              <Eye className="w-4 h-4 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDepartment(department);
                                setShowEditDialog(true);
                              }}
                              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              <Edit2 className="w-4 h-4 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDepartment(department);
                                setShowDeleteDialog(true);
                              }}
                              className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="cards" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Advanced Departments Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {paginatedDepartments.map((department) => {
                const performanceColor = department.performanceScore >= 80 ? 'text-green-600 dark:text-green-400' :
                  department.performanceScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
                const performanceBg = department.performanceScore >= 80 ? 'bg-green-50 dark:bg-green-950/20' :
                  department.performanceScore >= 60 ? 'bg-yellow-50 dark:bg-yellow-950/20' : 'bg-red-50 dark:bg-red-950/20';

                return (
                  <Card key={department.id} className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 overflow-hidden">
                    {/* Top color bar */}
                    <div
                      className="absolute inset-x-0 top-0 h-2 rounded-t-2xl"
                      style={{ backgroundColor: department.color }}
                    />

                    {/* Department header with gradient overlay */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-700/30 dark:to-transparent rounded-lg"></div>
                      <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-200/50 dark:border-slate-700/50 p-3">


                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700 dark:text-slate-300" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                                {department.name}
                              </h3>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                Since {(() => {
                                  try {
                                    const date = typeof department.createdAt === 'string'
                                      ? new Date(department.createdAt)
                                      : department.createdAt;
                                    return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Unknown';
                                  } catch (e) {
                                    return 'Unknown';
                                  }
                                })()}
                              </p>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl">
                              <DropdownMenuItem onClick={() => {
                                setSelectedDepartment(department);
                                setShowEditDialog(true);
                              }} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Department
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedDepartment(department);
                                setShowDeleteDialog(true);
                              }} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Department
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {/* Department Description */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {department.description}
                      </p>
                    </div>

                    {/* Department Head */}
                    <div className="p-3 bg-gradient-to-r from-slate-50 to-red-50/30 dark:from-slate-700/50 dark:to-red-900/10 rounded-lg border border-slate-200 dark:border-slate-600">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-md flex items-center justify-center">
                          <Crown className="h-3 w-3 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Department Head</p>
                          {department.head ? (
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{department.head.name}</p>
                          ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400">No Head Assigned</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Team Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Team Size */}
                      <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-md flex items-center justify-center">
                            <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Team Size</p>
                            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{department.members.length + department.managers.length + (department.head ? 1 : 0)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Performance Score */}
                      <div className={`p-3 rounded-lg border ${performanceBg}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${department.performanceScore >= 80 ? 'bg-green-100 dark:bg-green-900/40' :
                            department.performanceScore >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/40' : 'bg-red-100 dark:bg-red-900/40'
                            }`}>
                            <Trophy className={`h-3 w-3 ${department.performanceScore >= 80 ? 'text-green-600 dark:text-green-400' :
                              department.performanceScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                              }`} />
                          </div>
                          <div>
                            <p className={`text-xs font-semibold uppercase tracking-wide ${department.performanceScore >= 80 ? 'text-green-600 dark:text-green-400' :
                              department.performanceScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                              }`}>Performance</p>
                            <p className={`text-sm font-bold ${department.performanceScore >= 80 ? 'text-green-700 dark:text-green-300' :
                              department.performanceScore >= 60 ? 'text-yellow-700 dark:text-yellow-300' : 'text-red-700 dark:text-red-300'
                              }`}>{department.performanceScore}%</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Task Performance */}
                    <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100/30 dark:from-purple-900/20 dark:to-purple-800/10 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/40 rounded-md flex items-center justify-center">
                          <Target className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Task Performance</p>
                          <p className={`text-sm font-bold ${performanceColor}`}>
                            {department.taskCompletionRate}%
                          </p>
                        </div>
                      </div>
                      <Progress value={department.taskCompletionRate} className="h-2 mb-1" />
                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>{department.completedTasks} completed</span>
                        <span>{department.totalTasks} total tasks</span>
                      </div>
                    </div>


                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                        onClick={() => {
                          setSelectedDepartment(department);
                          setShowTaskDetailsDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">View Department Tasks</span>
                        <span className="sm:hidden">View Tasks</span>
                      </Button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-red-300 dark:hover:border-red-600 rounded-lg font-medium transition-all duration-200"
                          onClick={() => {
                            setSelectedDepartment(department);
                            setShowHierarchyDialog(true);
                          }}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Hierarchy</span>
                          <span className="sm:hidden">Team</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-red-300 dark:hover:border-red-600 rounded-lg font-medium transition-all duration-200"
                          onClick={() => {
                            setSelectedDepartment(department);
                            setShowMembersDialog(true);
                          }}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Members</span>
                          <span className="sm:hidden">Manage</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mt-6 sm:mt-8">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <span>Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedDepartments.length)} of {filteredAndSortedDepartments.length} departments</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-red-300 dark:hover:border-red-600"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
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
                            ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25"
                            : "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-red-300 dark:hover:border-red-600"
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
                    className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-red-300 dark:hover:border-red-600"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {filteredAndSortedDepartments.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
              <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">No departments found</h3>
              <p className="text-muted-foreground text-center mb-4 text-sm sm:text-base px-4">
                {searchTerm || sizeFilter !== 'all' || performanceFilter !== 'all' ?
                  'Try adjusting your search terms or filters' :
                  'Get started by creating your first department'
                }
              </p>
              <Button onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Add Department</span>
                <span className="sm:hidden">Add Dept</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Department Dialog */}
        {showAddDialog && (
          <AddDepartmentDialog
            open={showAddDialog}
            onClose={() => setShowAddDialog(false)}
            onAdd={addDepartment}
            companyUsers={users}
          />
        )}

        {/* Debug: Show total users count */}
        {showAddDialog && (
          <div style={{ position: 'fixed', top: '10px', right: '10px', background: 'purple', color: 'white', padding: '5px', zIndex: 9999 }}>
            Total Users Fetched: {users?.length || 0}
          </div>
        )}

        {/* Edit Department Dialog */}
        {selectedDepartment && (
          <EditDepartmentDialog
            open={showEditDialog}
            department={selectedDepartment}
            onClose={() => {
              setShowEditDialog(false);
              setSelectedDepartment(null);
            }}
            onSave={editDepartment}
            users={users}
          />
        )}

        {/* Manage Members Dialog */}
        {selectedDepartment && (
          <EnhancedManageMembersDialog
            open={showMembersDialog}
            department={selectedDepartment}
            users={users}
            onClose={() => {
              setShowMembersDialog(false);
              setSelectedDepartment(null);
            }}
            onUpdateMembers={updateDepartmentMembers}
          />
        )}

        {/* Task Details Dialog */}
        {selectedDepartment && (
          <Dialog open={showTaskDetailsDialog} onOpenChange={setShowTaskDetailsDialog}>
            <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 border-0 shadow-2xl mx-2 sm:mx-4">
              <DialogHeader className="flex-shrink-0 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: selectedDepartment.color }}
                        />
                        {selectedDepartment.name} - Task Details
                      </DialogTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        View detailed task information and progress
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">Live Data</span>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-2">
                <DepartmentTaskDetails
                  department={selectedDepartment}
                  users={users}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Hierarchy Dialog */}
        {selectedDepartment && (
          <Dialog open={showHierarchyDialog} onOpenChange={setShowHierarchyDialog}>
            <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 border-0 shadow-2xl mx-2 sm:mx-4">
              <DialogHeader className="flex-shrink-0 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: selectedDepartment.color }}
                        />
                        {selectedDepartment.name} - Department Hierarchy
                      </DialogTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        View organizational structure and team members
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">Live Data</span>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-2">
                <DepartmentHierarchy
                  department={selectedDepartment}
                  users={users}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        {selectedDepartment && (
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-slate-900 dark:text-slate-100">
                  Delete Department
                </AlertDialogTitle>
                <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete "{selectedDepartment.name}"? This action cannot be undone.
                  All associated data including tasks and member assignments will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (selectedDepartment) {
                      deleteDepartment(selectedDepartment.id);
                    }
                    setShowDeleteDialog(false);
                    setSelectedDepartment(null);
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
