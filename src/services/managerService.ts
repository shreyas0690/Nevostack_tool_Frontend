import { apiService } from './apiService';
import { API_CONFIG, type ApiResponse } from '@/config/api';

export interface ManagerDashboardData {
  teamMembers: number;
  teamTasks: number;
  completionRate: number;
  urgent: {
    count: number;
    tasks: Task[];
  };
  overdue: {
    count: number;
    tasks: Task[];
  };
  recentTasks: Task[];
}

export interface TeamMemberStats {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  position: string;
  departmentId: {
    _id: string;
    name: string;
  };
  taskStats: {
    total: number;
    completed: number;
    inProgress: number;
    urgent: number;
    overdue: number;
    completionRate: number;
  };
}

export interface TeamMemberWithStats {
  teamMembers: TeamMemberStats[];
  totalMembers: number;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTo: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  assignedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  companyId: string;
  departmentId: {
    _id: string;
    name: string;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'assigned' | 'in_progress' | 'review' | 'completed' | 'cancelled' | 'blocked';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedDate?: Date;
  progress?: number;
}

export interface UrgentTasksResponse {
  tasks: Task[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTasks: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface OverdueTasksResponse {
  tasks: Task[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTasks: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface TeamPerformanceData {
  overview: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    completionRate: number;
    recentTasks: number;
    avgCompletionDays: number;
  };
  priorityDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  period: number;
}

export interface MemberTasksResponse {
  member: {
    _id: string;
    name: string;
    email: string;
    role: string;
    position: string;
  };
  tasks: Task[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTasks: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class ManagerService {
  // Get main dashboard data
  async getDashboard(): Promise<ApiResponse<ManagerDashboardData>> {
    return apiService.get<ManagerDashboardData>(API_CONFIG.ENDPOINTS.MANAGER.DASHBOARD);
  }

  // Get detailed list of team members with their task statistics
  async getTeamMembers(): Promise<ApiResponse<TeamMemberWithStats>> {
    return apiService.get<TeamMemberWithStats>(API_CONFIG.ENDPOINTS.MANAGER.TEAM_MEMBERS);
  }

  // Get urgent tasks for team members
  async getUrgentTasks(page: number = 1, limit: number = 20): Promise<ApiResponse<UrgentTasksResponse>> {
    return apiService.get<UrgentTasksResponse>(
      `${API_CONFIG.ENDPOINTS.MANAGER.URGENT_TASKS}?page=${page}&limit=${limit}`
    );
  }

  // Get overdue tasks for team members
  async getOverdueTasks(page: number = 1, limit: number = 20): Promise<ApiResponse<OverdueTasksResponse>> {
    return apiService.get<OverdueTasksResponse>(
      `${API_CONFIG.ENDPOINTS.MANAGER.OVERDUE_TASKS}?page=${page}&limit=${limit}`
    );
  }

  // Get team performance metrics
  async getTeamPerformance(period: number = 30): Promise<ApiResponse<TeamPerformanceData>> {
    return apiService.get<TeamPerformanceData>(
      `${API_CONFIG.ENDPOINTS.MANAGER.TEAM_PERFORMANCE}?period=${period}`
    );
  }

  // Get tasks for a specific team member
  async getMemberTasks(
    memberId: string,
    params: {
      status?: string;
      priority?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ApiResponse<MemberTasksResponse>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const url = searchParams.toString()
      ? `${API_CONFIG.ENDPOINTS.MANAGER.MEMBER_TASKS(memberId)}?${searchParams}`
      : API_CONFIG.ENDPOINTS.MANAGER.MEMBER_TASKS(memberId);

    return apiService.get<MemberTasksResponse>(url);
  }

  // Team Management APIs

  // Get team management overview
  async getTeamManagementOverview(): Promise<ApiResponse<TeamManagementOverviewData>> {
    return apiService.get<TeamManagementOverviewData>(
      API_CONFIG.ENDPOINTS.MANAGER.TEAM_MANAGEMENT_OVERVIEW
    );
  }

  // Get team member details
  async getTeamMemberDetails(memberId: string): Promise<ApiResponse<TeamMemberDetailsData>> {
    return apiService.get<TeamMemberDetailsData>(
      API_CONFIG.ENDPOINTS.MANAGER.TEAM_MEMBER_DETAILS(memberId)
    );
  }

  // Update team member status
  async updateTeamMemberStatus(
    memberId: string, 
    isActive: boolean
  ): Promise<ApiResponse<TeamMemberUpdateResponse>> {
    return apiService.put<TeamMemberUpdateResponse>(
      API_CONFIG.ENDPOINTS.MANAGER.TEAM_MEMBER_STATUS(memberId),
      { isActive }
    );
  }

  // Get team performance analytics
  async getTeamPerformanceAnalytics(): Promise<ApiResponse<TeamPerformanceAnalyticsData>> {
    return apiService.get<TeamPerformanceAnalyticsData>(
      API_CONFIG.ENDPOINTS.MANAGER.TEAM_PERFORMANCE_ANALYTICS
    );
  }
}

export const managerService = new ManagerService();
export default managerService;

// Team Management Types
export interface TeamManagementOverviewData {
  teamStats: {
    totalMembers: number;
    activeMembers: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    teamCompletionRate: number;
    avgTasksPerMember: number;
  };
  memberStats: TeamMemberStatsData[];
  allTasks: Task[];
}

export interface TeamMemberStatsData {
  member: {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    departmentId: {
      _id: string;
      name: string;
      color?: string;
    };
    createdAt: string;
  };
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  tasks: Task[];
}

export interface TeamMemberDetailsData {
  member: {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    departmentId: {
      _id: string;
      name: string;
      color?: string;
    };
    createdAt: string;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  tasks: Task[];
}

export interface TeamMemberUpdateResponse {
  member: {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    departmentId: {
      _id: string;
      name: string;
      color?: string;
    };
    createdAt: string;
  };
}

export interface TeamPerformanceAnalyticsData {
  performanceMetrics: PerformanceMetric[];
  teamStats: {
    totalMembers: number;
    highPerformers: number;
    mediumPerformers: number;
    lowPerformers: number;
    avgCompletionRate: number;
  };
}

export interface PerformanceMetric {
  member: {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  efficiency: 'high' | 'medium' | 'low';
  tasks: Task[];
}

// Get team members from backend
export async function getTeamMembers(): Promise<ApiResponse<any[]>> {
  return apiService.get('/manager/team-members');
}






