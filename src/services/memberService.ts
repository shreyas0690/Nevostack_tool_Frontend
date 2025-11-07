import { apiService } from './apiService';
import { API_CONFIG } from '@/config/api';

// Member Dashboard Types
export interface MemberDashboardData {
  member: {
    id: string;
    name: string;
    email: string;
    role: string;
    position?: string;
    department: {
      _id: string;
      name: string;
      color?: string;
    } | null;
    manager: {
      _id: string;
      name: string;
      email: string;
      role: string;
    } | null;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    todayTasks: number;
    overdueTasks: number;
    urgentTasks: number;
    recentTasks: number;
  };
  tasks: {
    recent: Task[];
    urgent: Task[];
    overdue: Task[];
    today: Task[];
  };
  team: {
    manager: any;
    teamSize: number;
    teamMembers: any[];
  } | null;
  performance: {
    completionRate: number;
    todayCompletionRate: number;
    todayDueCompletionRate: number;
    tasksCompletedToday: number;
    status: 'excellent' | 'good' | 'improving';
  };
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
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
    role: string;
  };
  companyId: {
    _id: string;
    name: string;
  };
  departmentId?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MemberProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  username?: string;
  role: string;
  companyId: {
    _id: string;
    name: string;
  };
  departmentId?: {
    _id: string;
    name: string;
    color?: string;
    description?: string;
  };
  managerId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  phone?: string;
  avatar?: string;
  position?: string;
  dateOfJoining: string;
  status: string;
  lastLogin?: string;
}

export interface TeamInfo {
  manager: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  teamMembers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    position?: string;
  }>;
  teamSize: number;
}

export interface MemberStats {
  period: number;
  overview: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionRate: number;
    avgCompletionDays: number;
  };
  priorityDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
}


export interface MemberTasksResponse {
  tasks: Task[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTasks: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class MemberService {
  // Get member dashboard data
  async getDashboard(): Promise<MemberDashboardData> {
    try {
      const response = await apiService.get<MemberDashboardData>(
        API_CONFIG.ENDPOINTS.MEMBERS.DASHBOARD
      );
      return response.data;
    } catch (error) {
      console.error('Get member dashboard error:', error);
      throw error;
    }
  }

  // Get member tasks with filters
  async getTasks(params: {
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
    sort?: string;
  } = {}): Promise<MemberTasksResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.priority) queryParams.append('priority', params.priority);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sort) queryParams.append('sort', params.sort);

      const url = `${API_CONFIG.ENDPOINTS.MEMBERS.TASKS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiService.get<MemberTasksResponse>(url);
      return response.data;
    } catch (error) {
      console.error('Get member tasks error:', error);
      throw error;
    }
  }

  // Get member profile
  async getProfile(): Promise<MemberProfile> {
    try {
      const response = await apiService.get<{ data: MemberProfile }>(
        API_CONFIG.ENDPOINTS.MEMBERS.PROFILE
      );
      return response.data.data;
    } catch (error) {
      console.error('Get member profile error:', error);
      throw error;
    }
  }

  // Get team information
  async getTeam(): Promise<TeamInfo> {
    try {
      const response = await apiService.get<{ data: TeamInfo }>(
        API_CONFIG.ENDPOINTS.MEMBERS.TEAM
      );
      return response.data.data;
    } catch (error) {
      console.error('Get member team error:', error);
      throw error;
    }
  }

  // Get member statistics
  async getStats(period: number = 30): Promise<MemberStats> {
    try {
      const response = await apiService.get<{ data: MemberStats }>(
        `${API_CONFIG.ENDPOINTS.MEMBERS.STATS}?period=${period}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Get member stats error:', error);
      throw error;
    }
  }


  // Quick Actions
  async requestLeave(data: {
    startDate: string;
    endDate: string;
    reason?: string;
    leaveType?: string;
  }): Promise<any> {
    try {
      const response = await apiService.post<{ data: any }>(
        API_CONFIG.ENDPOINTS.MEMBERS.QUICK_ACTIONS.REQUEST_LEAVE,
        data
      );
      return response.data.data;
    } catch (error) {
      console.error('Request leave error:', error);
      throw error;
    }
  }

  async getUpcomingMeetings(limit: number = 5): Promise<any[]> {
    try {
      const response = await apiService.get<{ data: any[] }>(
        `${API_CONFIG.ENDPOINTS.MEMBERS.QUICK_ACTIONS.UPCOMING_MEETINGS}?limit=${limit}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Get upcoming meetings error:', error);
      throw error;
    }
  }

  async getRecentTasks(limit: number = 5): Promise<Task[]> {
    try {
      const response = await apiService.get<{ data: Task[] }>(
        `${API_CONFIG.ENDPOINTS.MEMBERS.QUICK_ACTIONS.RECENT_TASKS}?limit=${limit}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Get recent tasks error:', error);
      throw error;
    }
  }
}

export const memberService = new MemberService();
export default memberService;
