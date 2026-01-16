import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
  ChevronRight
} from 'lucide-react';
import { mockTasks } from '@/data/mockData';
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
import { useAuth } from '@/components/Auth/AuthProvider';
import AddDepartmentDialog from './AddDepartmentDialog';
import EditDepartmentDialog from './EditDepartmentDialog';
import EnhancedManageMembersDialog from './EnhancedManageMembersDialog';
import DepartmentHierarchy from './DepartmentHierarchy';
import DepartmentTaskDetails from './DepartmentTaskDetails';

export default function HRDepartments() {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');


  // Fetch departments from API
  const { data: departments = [], isLoading: departmentsLoading, refetch: refetchDepartments, error: departmentsError } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      try {
        const response = await departmentService.getDepartments();
        if (import.meta.env.DEV) {
          console.log('HR Departments API response received with', response.data?.length || 0, 'departments');
        }
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
        console.error('Error fetching departments:', error);
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
        return res.data || [];
      } catch (error) {
        console.error('Error fetching tasks for departments:', error);
        return [];
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Dialog states
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
  const [viewMode, setViewMode] = useState<'cards' | 'analytics' | 'comparison'>('cards');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  // Helper functions
  const getDepartmentHead = (headId?: string): User | undefined => {
    return users.find(user => user.id === headId) as unknown as User | undefined;
  };

  const getDepartmentMembers = (deptId: string): User[] => {
    return users.filter(user => user.departmentId === deptId) as unknown as User[];
  };

  const getDepartmentManagers = (deptId: string): User[] => {
    return users.filter(user => user.departmentId === deptId && user.role === 'manager') as unknown as User[];
  };

  // Advanced department analytics with memoization
  const departmentAnalytics = useMemo(() => {
    try {
    return departments.map(dept => {
      const members = getDepartmentMembers(dept.id);
      const managers = getDepartmentManagers(dept.id);
      const head = getDepartmentHead(dept.headId);

      // Use backend's memberCount if available, otherwise calculate from users
      const actualMemberCount = dept.memberCount || members.length;
        
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
          console.warn('Date parsing error in department analytics:', e);
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
          lastActivity,
          memberCount: actualMemberCount // Use consistent member count
      };
    });
    } catch (error) {
      console.warn('Error in departmentAnalytics, using fallback data:', error.message);
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
        lastActivity: Date.now(),
        memberCount: dept.memberCount || getDepartmentMembers(dept.id).length || 0
      }));
    }
  }, [departments, users, allTasks, mockTasks, mockLeaveRequests]);

  // Advanced filtering and sorting
  const filteredAndSortedDepartments = useMemo(() => {
    let filtered = departmentAnalytics.filter(dept => {
      // Text search
      const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           dept.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Size filter - calculate total team size like admin panel
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

    // Sort departments
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
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
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
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

  // Advanced statistics
  const stats = useMemo(() => {
    const totalDepartments = departmentAnalytics.length;
    const totalEmployees = users.filter(u => u.isActive !== false).length;
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

  // CRUD operations
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

  const deleteDepartment = async (deptId: string) => {
    try {
      const dept = departments.find(d => d.id === deptId);
      await departmentService.deleteDepartment(deptId);
      await refetchDepartments();
      toast.success(`${dept?.name} has been successfully deleted!`);
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error("Failed to delete department. Please try again.");
    }
  };

  // Loading state
  if (!currentUser || departmentsLoading || usersLoading || tasksLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading departments...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (departmentsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-2">Failed to load departments</p>
            <Button onClick={() => refetchDepartments()} variant="outline">
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
          <h1 className="text-3xl font-bold tracking-tight">Department Management</h1>
          <p className="text-muted-foreground">Manage company departments and team structure</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              {departments.length} Departments
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {users.filter(u => (u as any).isActive).length} Active Users
            </span>
            <span className="flex items-center gap-1">
              <Activity className="w-4 h-4" />
              Last updated: {new Date().toLocaleTimeString()}
            </span>
        </div>

        </div>
        <div className="flex items-center gap-2">
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
        </div>
      </div>

      {/* Advanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : stat.trend === 'down' ? TrendingDown : Activity;
          
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-all duration-300 border-0 bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                    stat.trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                  }`}>
                    <TrendIcon className="w-3 h-3" />
                    {stat.change}
                  </div>
                </div>
          </CardContent>
        </Card>
          );
        })}
      </div>

      {/* Advanced Filtering Controls */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              />
            </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Select value={sizeFilter} onValueChange={setSizeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                <SelectItem value="small">Small (≤5)</SelectItem>
                <SelectItem value="medium">Medium (6-15)</SelectItem>
                <SelectItem value="large">Large (15+)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Performance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance</SelectItem>
                <SelectItem value="high">High (80%+)</SelectItem>
                <SelectItem value="medium">Medium (60-79%)</SelectItem>
                <SelectItem value="low">Low (&lt;60%)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
                <SelectItem value="created">Created</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3"
            >
              <ArrowUpDown className="w-4 h-4" />
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
              className="px-3"
            >
              <Filter className="w-4 h-4" />
              </Button>
            </div>
          
          {/* Results summary */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Building2 className="h-4 w-4" />
              <span>Showing {filteredAndSortedDepartments.length} of {departmentAnalytics.length} departments</span>
            </div>
          </div>
        </div>
      </Card>

      {/* View Mode Toggle */}
      <Tabs value={viewMode} onValueChange={(value: string) => setViewMode(value as any)}>
        <TabsList className="grid w-full grid-cols-1 max-w-md">
          <TabsTrigger value="cards" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Department Cards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-6 mt-6">
          {/* Advanced Departments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedDepartments.map((department) => {
              const performanceColor = department.performanceScore >= 80 ? 'text-green-600 dark:text-green-400' : 
                                     department.performanceScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
              const performanceBg = department.performanceScore >= 80 ? 'bg-green-50 dark:bg-green-950/20' : 
                                  department.performanceScore >= 60 ? 'bg-yellow-50 dark:bg-yellow-950/20' : 'bg-red-50 dark:bg-red-950/20';
              
              return (
                <Card key={department.id} className="relative hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-background to-muted/30 rounded-xl overflow-hidden">
                  {/* Top color bar */}
                  <div
                    className="absolute inset-x-0 top-0 h-1.5"
                    style={{ backgroundColor: department.color }}
                  />
                  
                <CardHeader className="pb-4">
                    <div className="flex items-start justify-between pr-16">
                    <div className="flex items-center gap-3">
                        <div 
                          className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm ring-2 ring-background" 
                          style={{ backgroundColor: department.color }}
                        />
                      <div>
                          <CardTitle className="text-lg font-semibold tracking-tight">{department.name}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
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
                          <Button variant="ghost" size="sm" className="absolute top-2 right-2">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border shadow-md">
                          <DropdownMenuItem onClick={() => {
                            setSelectedDepartment(department as any);
                            setShowEditDialog(true);
                          }}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit Department
                        </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedDepartment(department as any);
                            setShowDeleteDialog(true);
                          }} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                            Delete Department
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {department.description}
                    </p>
                    
                  {/* Department Head */}
                    <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                      {department.head ? (
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-xs font-medium">
                            Department Head
                          </Badge>
                          <span className="text-sm font-semibold">{department.head.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Badge variant="outline" className="text-xs">
                            No Head Assigned
                          </Badge>
                    </div>
                  )}
                    </div>

                    {/* Advanced Metrics */}
                    <div className="space-y-3">
                      {/* Team Size & Composition */}
                      <div className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Team Size</span>
                      </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-semibold">
                            {department.members.length + department.managers.length + (department.head ? 1 : 0)}
                          </Badge>
                    </div>
                  </div>

                      {/* Task Performance */}
                      <div className="bg-muted/20 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <Target className="w-4 h-4 text-purple-600" />
                            Task Performance
                          </span>
                          <span className={`text-sm font-bold ${performanceColor}`}>
                            {department.taskCompletionRate}%
                          </span>
                    </div>
                        <Progress value={department.taskCompletionRate} className="h-2" />
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          <span>{department.completedTasks} completed</span>
                          <span>{department.totalTasks} total tasks</span>
                  </div>
                  </div>

                      {/* Status Indicators */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <div>
                            <div className="text-sm font-bold text-green-700 dark:text-green-300">{department.completedTasks}</div>
                            <div className="text-xs text-green-600 dark:text-green-400">Completed</div>
                    </div>
                    </div>
                        <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          <div>
                            <div className="text-sm font-bold text-orange-700 dark:text-orange-300">{department.inProgressTasks}</div>
                            <div className="text-xs text-orange-600 dark:text-orange-400">In Progress</div>
                          </div>
                    </div>
                  </div>

                      {/* Alert for overdue tasks */}
                      {department.overdueTasks > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                            {department.overdueTasks} overdue task{department.overdueTasks !== 1 ? 's' : ''}
                          </span>
                        </div>
                    )}
                  </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 gap-2 pt-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full font-medium shadow-sm hover:shadow-md transition-all duration-200"
                        onClick={() => {
                          setSelectedDepartment(department as any);
                          setShowTaskDetailsDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Department Tasks
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 font-medium border-border/60 hover:border-border hover:ring-1 hover:ring-border transition-all duration-200"
                          onClick={() => {
                            setSelectedDepartment(department as any);
                            setShowHierarchyDialog(true);
                          }}
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Hierarchy
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 font-medium border-border/60 hover:border-border hover:ring-1 hover:ring-border transition-all duration-200"
                          onClick={() => {
                            setSelectedDepartment(department as any);
                            setShowMembersDialog(true);
                          }}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Members
                        </Button>
                            </div>
              </div>
            </CardContent>
          </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span>Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedDepartments.length)} of {filteredAndSortedDepartments.length} departments</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600"
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
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* No Results */}
      {filteredAndSortedDepartments.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No departments found</h3>
              <p className="text-muted-foreground mb-4">
              {searchTerm || sizeFilter !== 'all' || performanceFilter !== 'all' ? 
                  'Try adjusting your search or filters' :
                'Get started by creating your first department'
              }
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </Button>
            </div>
      )}
        </TabsContent>

      </Tabs>

      {/* Dialogs */}
      <AddDepartmentDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={addDepartment}
        companyUsers={users}
      />

      <EditDepartmentDialog
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
        onSave={editDepartment}
      />

      <EnhancedManageMembersDialog
        open={showMembersDialog}
        onClose={() => {
          setShowMembersDialog(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
        users={users as unknown as any}
        onUpdateMembers={async (departmentId, memberIds, managerIds, headId) => {
          // Handle member updates here
          await refetchUsers();
          await refetchDepartments();
        }}
      />

      {/* Task Details Dialog */}
      <Dialog open={showTaskDetailsDialog} onOpenChange={setShowTaskDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Department Task Details</DialogTitle>
          </DialogHeader>
            {selectedDepartment && (
            <DepartmentTaskDetails 
                department={selectedDepartment}
              users={users as unknown as any}
              />
            )}
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowTaskDetailsDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hierarchy Dialog */}
      <Dialog open={showHierarchyDialog} onOpenChange={setShowHierarchyDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {selectedDepartment?.name} - Department Hierarchy
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
          {selectedDepartment && (
              <DepartmentHierarchy 
              department={selectedDepartment}
                users={users as unknown as any}
              />
            )}
          </div>
          <div className="flex justify-end pt-4 flex-shrink-0">
            <Button onClick={() => setShowHierarchyDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the department
              "{selectedDepartment?.name}" and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setSelectedDepartment(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedDepartment) {
                  deleteDepartment(selectedDepartment.id);
                  setShowDeleteDialog(false);
                  setSelectedDepartment(null);
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
