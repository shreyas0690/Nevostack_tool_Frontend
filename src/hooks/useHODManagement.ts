import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Department, Task } from '@/types/company';
import { hodService } from '@/services/api/hodService';
import { useAuth } from '@/components/Auth/AuthProvider';

interface HODManagementState {
  // Data
  departmentUsers: User[];
  department: Department | null;
  departmentTasks: Task[];
  
  // Loading states
  isLoading: boolean;
  isLoadingUsers: boolean;
  isLoadingTasks: boolean;
  isSubmitting: boolean;
  
  // Error states
  error: string | null;
  userError: string | null;
  taskError: string | null;
}

interface TaskAnalytics {
  departmentSummary: {
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    overdueTasks: number;
    avgTasksPerMember: number;
    departmentCompletionRate: number;
    tasksByPriority: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  userTaskMapping: Array<{
    member: User;
    tasks: Task[];
    activeTasks: Task[];
    completedTasks: Task[];
    overdueTasks: Task[];
    urgentTasks: Task[];
    totalTasks: number;
    completionRate: number;
    workload: number;
    efficiency: 'high' | 'medium' | 'low';
  }>;
  topPerformers: Array<{
    member: User;
    completionRate: number;
    totalTasks: number;
    completedTasks: Task[];
  }>;
}

export const useHODManagement = (departmentId?: string) => {
  const { currentUser } = useAuth();
  
  const [state, setState] = useState<HODManagementState>({
    departmentUsers: [],
    department: null,
    departmentTasks: [],
    isLoading: false,
    isLoadingUsers: false,
    isLoadingTasks: false,
    isSubmitting: false,
    error: null,
    userError: null,
    taskError: null,
  });

  // Get the department ID from current user or props
  const currentDepartmentId = departmentId || currentUser?.departmentId;

  // Fetch department details
  const fetchDepartment = useCallback(async () => {
    if (!currentDepartmentId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await hodService.getDepartmentDetails(currentDepartmentId);
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          department: response.data!,
          isLoading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to fetch department details',
          isLoading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Network error while fetching department',
        isLoading: false
      }));
    }
  }, [currentDepartmentId]);

  // Fetch department users with hierarchy
  const fetchDepartmentUsers = useCallback(async () => {
    if (!currentDepartmentId) return;

    setState(prev => ({ ...prev, isLoadingUsers: true, userError: null }));
    
    try {
      console.log('Fetching department users for:', currentDepartmentId);
      
      // Try to get hierarchy data first
      const hierarchyResponse = await hodService.getDepartmentHierarchy(currentDepartmentId);
      
      if (hierarchyResponse.success && hierarchyResponse.data) {
        // Combine all users from hierarchy
        const allUsers = [];
        const { departmentHead, managers, members } = hierarchyResponse.data;
        
        if (departmentHead) allUsers.push(departmentHead);
        if (managers) allUsers.push(...managers);
        if (members) allUsers.push(...members);
        
        setState(prev => ({
          ...prev,
          departmentUsers: allUsers,
          isLoadingUsers: false
        }));
        return;
      }
      
      // Fallback to simple users fetch
      const response = await hodService.getDepartmentUsers(currentDepartmentId);
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          departmentUsers: response.data!,
          isLoadingUsers: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          userError: response.error || 'Failed to fetch users',
          isLoadingUsers: false
        }));
      }
    } catch (error) {
      console.error('fetchDepartmentUsers error:', error);
      setState(prev => ({
        ...prev,
        userError: 'Network error while fetching users',
        isLoadingUsers: false
      }));
    }
  }, [currentDepartmentId]);

  // Fetch department tasks
  const fetchDepartmentTasks = useCallback(async () => {
    if (!currentDepartmentId) return;

    setState(prev => ({ ...prev, isLoadingTasks: true, taskError: null }));
    
    try {
      const response = await hodService.getDepartmentTasks(currentDepartmentId);
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          departmentTasks: response.data!,
          isLoadingTasks: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          taskError: response.error || 'Failed to fetch tasks',
          isLoadingTasks: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        taskError: 'Network error while fetching tasks',
        isLoadingTasks: false
      }));
    }
  }, [currentDepartmentId]);

  // Add team member
  const addTeamMember = useCallback(async (userData: {
    name: string;
    email: string;
    role: 'manager' | 'member';
    managerId?: string;
    isActive: boolean;
  }) => {
    if (!currentDepartmentId) {
      throw new Error('Department ID not found');
    }

    setState(prev => ({ ...prev, isSubmitting: true, userError: null }));
    
    try {
      const response = await hodService.addTeamMember({
        ...userData,
        departmentId: currentDepartmentId
      });
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          departmentUsers: [...prev.departmentUsers, response.data!],
          isSubmitting: false
        }));
        return response.data;
      } else {
        setState(prev => ({
          ...prev,
          userError: response.error || 'Failed to add team member',
          isSubmitting: false
        }));
        throw new Error(response.error || 'Failed to add team member');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        userError: error instanceof Error ? error.message : 'Network error',
        isSubmitting: false
      }));
      throw error;
    }
  }, [currentDepartmentId]);

  // Update team member
  const updateTeamMember = useCallback(async (
    userId: string, 
    userData: {
      name: string;
      email: string;
      role?: 'manager' | 'member';
      managerId?: string;
      isActive?: boolean;
    }
  ) => {
    setState(prev => ({ ...prev, isSubmitting: true, userError: null }));
    
    try {
      const response = await hodService.updateTeamMember(userId, userData);
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          departmentUsers: prev.departmentUsers.map(user => 
            user.id === userId ? response.data! : user
          ),
          isSubmitting: false
        }));
        return response.data;
      } else {
        setState(prev => ({
          ...prev,
          userError: response.error || 'Failed to update team member',
          isSubmitting: false
        }));
        throw new Error(response.error || 'Failed to update team member');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        userError: error instanceof Error ? error.message : 'Network error',
        isSubmitting: false
      }));
      throw error;
    }
  }, []);

  // Delete team member
  const deleteTeamMember = useCallback(async (userId: string) => {
    setState(prev => ({ ...prev, isSubmitting: true, userError: null }));
    
    try {
      const response = await hodService.deleteTeamMember(userId);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          departmentUsers: prev.departmentUsers.filter(user => user.id !== userId),
          isSubmitting: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          userError: response.error || 'Failed to delete team member',
          isSubmitting: false
        }));
        throw new Error(response.error || 'Failed to delete team member');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        userError: error instanceof Error ? error.message : 'Network error',
        isSubmitting: false
      }));
      throw error;
    }
  }, []);

  // Calculate task analytics from current data
  const taskAnalytics: TaskAnalytics | null = useMemo(() => {
    if (!state.department || state.departmentUsers.length === 0) return null;

    const departmentTasks = state.departmentTasks;
    const departmentMembers = state.departmentUsers;
    
    // Calculate user-task mapping
    const userTaskMapping = departmentMembers.map(member => {
      const memberTasks = departmentTasks.filter(task => task.assignedTo === member.id);
      const activeTasks = memberTasks.filter(task => task.status !== 'completed');
      const completedTasks = memberTasks.filter(task => task.status === 'completed');
      const overdueTasks = memberTasks.filter(task => {
        const now = new Date();
        return new Date(task.dueDate) < now && task.status !== 'completed';
      });
      const urgentTasks = memberTasks.filter(task => 
        (task.priority === 'urgent' || task.priority === 'high') && task.status !== 'completed'
      );

      const completionRate = memberTasks.length > 0 
        ? Math.round((completedTasks.length / memberTasks.length) * 100) 
        : 0;

      return {
        member,
        tasks: memberTasks,
        activeTasks,
        completedTasks,
        overdueTasks,
        urgentTasks,
        totalTasks: memberTasks.length,
        completionRate,
        workload: activeTasks.length,
        efficiency: completionRate >= 80 ? 'high' as const : completionRate >= 60 ? 'medium' as const : 'low' as const
      };
    });

    // Department task summary
    const totalTasks = departmentTasks.length;
    const activeTasks = departmentTasks.filter(task => task.status !== 'completed').length;
    const completedTasks = departmentTasks.filter(task => task.status === 'completed').length;
    const overdueTasks = departmentTasks.filter(task => {
      const now = new Date();
      return new Date(task.dueDate) < now && task.status !== 'completed';
    }).length;

    const avgTasksPerMember = departmentMembers.length > 0 ? Math.round(totalTasks / departmentMembers.length) : 0;
    const departmentCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Task distribution by priority
    const tasksByPriority = {
      urgent: departmentTasks.filter(t => t.priority === 'urgent').length,
      high: departmentTasks.filter(t => t.priority === 'high').length,
      medium: departmentTasks.filter(t => t.priority === 'medium').length,
      low: departmentTasks.filter(t => t.priority === 'low').length
    };

    // Top performers
    const topPerformers = userTaskMapping
      .filter(u => u.totalTasks > 0)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 3)
      .map(u => ({
        member: u.member,
        completionRate: u.completionRate,
        totalTasks: u.totalTasks,
        completedTasks: u.completedTasks
      }));

    return {
      userTaskMapping,
      departmentSummary: {
        totalTasks,
        activeTasks,
        completedTasks,
        overdueTasks,
        avgTasksPerMember,
        departmentCompletionRate,
        tasksByPriority
      },
      topPerformers
    };
  }, [state.department, state.departmentUsers, state.departmentTasks]);

  // Team overview analytics from new comprehensive endpoint
  const [teamOverviewData, setTeamOverviewData] = useState<any>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  
  // Team members with task analytics from new endpoint
  const [teamMembersWithTasks, setTeamMembersWithTasks] = useState<any>(null);
  const [isLoadingMembersWithTasks, setIsLoadingMembersWithTasks] = useState(false);
  
  // Fetch comprehensive team overview
  const fetchTeamOverview = useCallback(async () => {
    if (!currentDepartmentId) return;

    setIsLoadingOverview(true);
    try {
      const overviewResponse = await hodService.getTeamOverview(currentDepartmentId);
      
      if (overviewResponse.success && overviewResponse.data) {
        setTeamOverviewData(overviewResponse.data);
      } else {
        console.warn('Failed to fetch team overview:', overviewResponse.error);
      }
    } catch (error) {
      console.warn('Error fetching team overview:', error instanceof Error ? error.message : error);
    } finally {
      setIsLoadingOverview(false);
    }
  }, [currentDepartmentId]);

  // Fetch team members with task analytics
  const fetchTeamMembersWithTasks = useCallback(async (
    searchTerm: string = '',
    roleFilter: string = 'all',
    statusFilter: string = 'all',
    timeRange: string = '30d'
  ) => {
    if (!currentDepartmentId) return;

    setIsLoadingMembersWithTasks(true);
    try {
      const response = await hodService.getTeamMembersWithTasks(
        currentDepartmentId,
        timeRange,
        searchTerm,
        roleFilter,
        statusFilter
      );
      
      if (response.success && response.data) {
        setTeamMembersWithTasks(response.data);
      } else {
        console.warn('Failed to fetch team members with tasks:', response.error);
      }
    } catch (error) {
      console.warn('Error fetching team members with tasks:', error instanceof Error ? error.message : error);
    } finally {
      setIsLoadingMembersWithTasks(false);
    }
  }, [currentDepartmentId]);

  // Fetch task analytics from backend (legacy endpoint)
  const [backendTaskAnalytics, setBackendTaskAnalytics] = useState<any>(null);
  
  const fetchTaskAnalytics = useCallback(async () => {
    if (!currentDepartmentId) return;

    try {
      const analyticsResponse = await hodService.getDepartmentAnalytics(currentDepartmentId);
      
      if (analyticsResponse.success && analyticsResponse.data) {
        const backend = analyticsResponse.data;

        // Transform backend analytics shape to frontend TaskAnalytics shape
        const transformed: any = {
          departmentSummary: {
            totalTasks: backend.taskStats?.total || 0,
            activeTasks: backend.taskStats?.inProgress || 0,
            completedTasks: backend.taskStats?.completed || 0,
            overdueTasks: backend.taskStats?.overdue || 0,
            avgTasksPerMember: backend.employeeStats && backend.employeeStats.total > 0 ? Math.round((backend.taskStats?.total || 0) / backend.employeeStats.total) : 0,
            departmentCompletionRate: backend.taskStats?.completionRate || 0,
            tasksByPriority: {
              urgent: backend.taskStats?.urgent || 0,
              high: backend.taskStats?.high || 0,
              medium: backend.taskStats?.medium || 0,
              low: backend.taskStats?.low || 0,
            }
          },
          userTaskMapping: [],
          topPerformers: []
        };

        // Try to build topPerformers from backend.performanceByRole or backend.topPerformers
        if (backend.topPerformers && Array.isArray(backend.topPerformers)) {
          transformed.topPerformers = backend.topPerformers.map((p: any) => ({ user: p.user, score: p.score || p.completionRate || 0 }));
        } else if (backend.performanceByRole) {
          // Flatten a simple top performers list from task stats
          transformed.topPerformers = [];
        }

        setBackendTaskAnalytics(transformed);
      }
    } catch (error) {
      console.warn('Failed to fetch task analytics:', error instanceof Error ? error.message : error);
    }
  }, [currentDepartmentId]);

  // Memoize analytics data to prevent unnecessary re-computations
  const analyticsData = useMemo(() => backendTaskAnalytics, [backendTaskAnalytics]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchDepartment(),
      fetchDepartmentUsers(),
      fetchDepartmentTasks(),
      fetchTaskAnalytics(),
      fetchTeamOverview(),
      fetchTeamMembersWithTasks()
    ]);
  }, [fetchDepartment, fetchDepartmentUsers, fetchDepartmentTasks, fetchTaskAnalytics, fetchTeamOverview, fetchTeamMembersWithTasks]);

  // Clear errors
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      userError: null,
      taskError: null
    }));
  }, []);

  // Load initial data
  useEffect(() => {
    if (currentDepartmentId) {
      refreshData();
    }
  }, [currentDepartmentId, refreshData]);

  // Analytics are already fetched in refreshData(), no need for separate effect

  return {
    // Data
    departmentUsers: state.departmentUsers,
    department: state.department,
    departmentTasks: state.departmentTasks,
    taskAnalytics: backendTaskAnalytics || taskAnalytics,
    teamOverview: teamOverviewData,
    teamMembersWithTasks,
    
    // Loading states
    isLoading: state.isLoading,
    isLoadingUsers: state.isLoadingUsers,
    isLoadingTasks: state.isLoadingTasks,
    isLoadingOverview,
    isLoadingMembersWithTasks,
    isSubmitting: state.isSubmitting,
    
    // Error states
    error: state.error,
    userError: state.userError,
    taskError: state.taskError,
    
    // Actions
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    refreshData,
    clearErrors,
    fetchTeamOverview,
    fetchTeamMembersWithTasks,
    
    // Derived data
    departmentHead: state.department?.headId ? 
      state.departmentUsers.find(u => u.id === state.department?.headId) : null,
    departmentManagers: state.department ? 
      state.departmentUsers.filter(u => (state.department?.managerIds || []).includes(u.id)) : [],
    regularMembers: state.departmentUsers.filter(u => 
      u.id !== state.department?.headId && 
      !(state.department?.managerIds || []).includes(u.id)
    ),
  };
};

export default useHODManagement;
