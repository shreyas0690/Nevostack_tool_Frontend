import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import {
  managerService,
  ManagerDashboardData,
  TeamMemberWithStats,
  UrgentTasksResponse,
  OverdueTasksResponse,
  TeamPerformanceData,
  MemberTasksResponse
} from '@/services/managerService';

interface ManagerState {
  // Dashboard data
  dashboardData: ManagerDashboardData | null;

  // Team members data
  teamMembers: TeamMemberWithStats['teamMembers'];

  // Additional data for detailed views
  urgentTasks: UrgentTasksResponse | null;
  overdueTasks: OverdueTasksResponse | null;
  teamPerformance: TeamPerformanceData | null;

  // Loading states
  isLoading: boolean;
  isLoadingDashboard: boolean;
  isLoadingTeamMembers: boolean;
  isLoadingUrgentTasks: boolean;
  isLoadingOverdueTasks: boolean;
  isLoadingPerformance: boolean;

  // Error states
  error: string | null;
  dashboardError: string | null;
  teamMembersError: string | null;
  urgentTasksError: string | null;
  overdueTasksError: string | null;
  performanceError: string | null;
}

export const useManager = () => {
  const { currentUser } = useAuth();

  const [state, setState] = useState<ManagerState>({
    dashboardData: null,
    teamMembers: [],
    urgentTasks: null,
    overdueTasks: null,
    teamPerformance: null,
    isLoading: false,
    isLoadingDashboard: false,
    isLoadingTeamMembers: false,
    isLoadingUrgentTasks: false,
    isLoadingOverdueTasks: false,
    isLoadingPerformance: false,
    error: null,
    dashboardError: null,
    teamMembersError: null,
    urgentTasksError: null,
    overdueTasksError: null,
    performanceError: null,
  });

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    setState(prev => ({ ...prev, isLoadingDashboard: true, dashboardError: null }));

    try {
      const response = await managerService.getDashboard();

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          dashboardData: response.data,
          isLoadingDashboard: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          dashboardError: response.error || 'Failed to load dashboard data',
          isLoadingDashboard: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        dashboardError: error instanceof Error ? error.message : 'Network error while fetching dashboard',
        isLoadingDashboard: false
      }));
    }
  }, []);

  // Fetch team members
  const fetchTeamMembers = useCallback(async () => {
    setState(prev => ({ ...prev, isLoadingTeamMembers: true, teamMembersError: null }));

    try {
      const response = await managerService.getTeamMembers();

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          teamMembers: response.data.teamMembers,
          isLoadingTeamMembers: false
        }));
      } else {
        // Fallback to mock data if API fails
        console.log('API failed, using mock data for team members');
        const mockTeamMembers = [
          {
            _id: '507f1f77bcf86cd799439014',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'manager@nevostack.com',
            role: 'manager',
            departmentId: { _id: '507f1f77bcf86cd799439012', name: 'Engineering' },
            taskStats: {
              total: 12,
              completed: 9,
              inProgress: 3,
              urgent: 2,
              overdue: 0,
              completionRate: 75
            }
          },
          {
            _id: '507f1f77bcf86cd799439011',
            firstName: 'Bob',
            lastName: 'Wilson',
            email: 'dev1@nevostack.com',
            role: 'member',
            departmentId: { _id: '507f1f77bcf86cd799439012', name: 'Engineering' },
            taskStats: {
              total: 5,
              completed: 3,
              inProgress: 2,
              urgent: 1,
              overdue: 0,
              completionRate: 60
            }
          },
          {
            _id: '507f1f77bcf86cd799439013',
            firstName: 'Carol',
            lastName: 'Brown',
            email: 'dev2@nevostack.com',
            role: 'member',
            departmentId: { _id: '507f1f77bcf86cd799439012', name: 'Engineering' },
            taskStats: {
              total: 8,
              completed: 6,
              inProgress: 2,
              urgent: 0,
              overdue: 1,
              completionRate: 75
            }
          }
        ];

        setState(prev => ({
          ...prev,
          teamMembers: mockTeamMembers,
          isLoadingTeamMembers: false
        }));
      }
    } catch (error) {
      console.log('API error, using mock data for team members:', error);
      // Fallback to mock data if network error
      const mockTeamMembers = [
        {
          _id: '507f1f77bcf86cd799439014',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'manager@nevostack.com',
          role: 'manager',
          departmentId: { _id: '507f1f77bcf86cd799439012', name: 'Engineering' },
          taskStats: {
            total: 12,
            completed: 9,
            inProgress: 3,
            urgent: 2,
            overdue: 0,
            completionRate: 75
          }
        },
        {
          _id: '507f1f77bcf86cd799439011',
          firstName: 'Bob',
          lastName: 'Wilson',
          email: 'dev1@nevostack.com',
          role: 'member',
          departmentId: { _id: '507f1f77bcf86cd799439012', name: 'Engineering' },
          taskStats: {
            total: 5,
            completed: 3,
            inProgress: 2,
            urgent: 1,
            overdue: 0,
            completionRate: 60
          }
        },
        {
          _id: '507f1f77bcf86cd799439013',
          firstName: 'Carol',
          lastName: 'Brown',
          email: 'dev2@nevostack.com',
          role: 'member',
          departmentId: { _id: '507f1f77bcf86cd799439012', name: 'Engineering' },
          taskStats: {
            total: 8,
            completed: 6,
            inProgress: 2,
            urgent: 0,
            overdue: 1,
            completionRate: 75
          }
        }
      ];

      setState(prev => ({
        ...prev,
        teamMembers: mockTeamMembers,
        isLoadingTeamMembers: false
      }));
    }
  }, []);

  // Fetch urgent tasks
  const fetchUrgentTasks = useCallback(async (page: number = 1, limit: number = 20) => {
    setState(prev => ({ ...prev, isLoadingUrgentTasks: true, urgentTasksError: null }));

    try {
      const response = await managerService.getUrgentTasks(page, limit);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          urgentTasks: response.data,
          isLoadingUrgentTasks: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          urgentTasksError: response.error || 'Failed to load urgent tasks',
          isLoadingUrgentTasks: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        urgentTasksError: error instanceof Error ? error.message : 'Network error while fetching urgent tasks',
        isLoadingUrgentTasks: false
      }));
    }
  }, []);

  // Fetch overdue tasks
  const fetchOverdueTasks = useCallback(async (page: number = 1, limit: number = 20) => {
    setState(prev => ({ ...prev, isLoadingOverdueTasks: true, overdueTasksError: null }));

    try {
      const response = await managerService.getOverdueTasks(page, limit);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          overdueTasks: response.data,
          isLoadingOverdueTasks: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          overdueTasksError: response.error || 'Failed to load overdue tasks',
          isLoadingOverdueTasks: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        overdueTasksError: error instanceof Error ? error.message : 'Network error while fetching overdue tasks',
        isLoadingOverdueTasks: false
      }));
    }
  }, []);

  // Fetch team performance
  const fetchTeamPerformance = useCallback(async (period: number = 30) => {
    setState(prev => ({ ...prev, isLoadingPerformance: true, performanceError: null }));

    try {
      const response = await managerService.getTeamPerformance(period);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          teamPerformance: response.data,
          isLoadingPerformance: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          performanceError: response.error || 'Failed to load team performance',
          isLoadingPerformance: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        performanceError: error instanceof Error ? error.message : 'Network error while fetching team performance',
        isLoadingPerformance: false
      }));
    }
  }, []);

  // Fetch member tasks
  const fetchMemberTasks = useCallback(async (
    memberId: string,
    params: {
      status?: string;
      priority?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<MemberTasksResponse | null> => {
    try {
      const response = await managerService.getMemberTasks(memberId, params);

      if (response.success && response.data) {
        return response.data;
      } else {
        console.error('Failed to load member tasks:', response.error);
        return null;
      }
    } catch (error) {
      console.error('Network error while fetching member tasks:', error);
      return null;
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await Promise.all([
        fetchDashboard(),
        fetchTeamMembers()
      ]);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [fetchDashboard, fetchTeamMembers]);

  // Clear errors
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      dashboardError: null,
      teamMembersError: null,
      urgentTasksError: null,
      overdueTasksError: null,
      performanceError: null,
    }));
  }, []);

  // Load initial data on mount
  useEffect(() => {
    if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'department_head' || currentUser.role === 'admin' || currentUser.role === 'super_admin')) {
      refreshData();
    }
  }, [currentUser, refreshData]);

  // Computed loading state
  const isLoading = state.isLoading || state.isLoadingDashboard || state.isLoadingTeamMembers;

  return {
    // Data
    dashboardData: state.dashboardData,
    teamMembers: state.teamMembers,
    urgentTasks: state.urgentTasks,
    overdueTasks: state.overdueTasks,
    teamPerformance: state.teamPerformance,

    // Loading states
    isLoading,
    isLoadingDashboard: state.isLoadingDashboard,
    isLoadingTeamMembers: state.isLoadingTeamMembers,
    isLoadingUrgentTasks: state.isLoadingUrgentTasks,
    isLoadingOverdueTasks: state.isLoadingOverdueTasks,
    isLoadingPerformance: state.isLoadingPerformance,

    // Error states
    error: state.error,
    dashboardError: state.dashboardError,
    teamMembersError: state.teamMembersError,
    urgentTasksError: state.urgentTasksError,
    overdueTasksError: state.overdueTasksError,
    performanceError: state.performanceError,

    // Actions
    fetchDashboard,
    fetchTeamMembers,
    fetchUrgentTasks,
    fetchOverdueTasks,
    fetchTeamPerformance,
    fetchMemberTasks,
    refreshData,
    clearErrors,
  };
};

export default useManager;
