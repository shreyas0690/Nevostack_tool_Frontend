import { API_CONFIG, ApiResponse, HTTP_STATUS, ERROR_MESSAGES } from '@/config/api';
import { User, Department, Task } from '@/types/company';
import { mockUsers, mockTasks, mockDepartments } from '@/data/mockData';

// API Helper function with error handling
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Fallback: if mock backend is enabled, return deterministic mock data for endpoints used by the dashboard
  try {
    // @ts-ignore
    const useMock = typeof process !== 'undefined' && (process.env as any).USE_MOCK_BACKEND === 'true';
    if (useMock) {
      // Simple routing based on endpoint
      const ep = endpoint as string;
      // Department users
      const mUsers = ep.match(/\/departments\/([^/]+)\/employees/);
      if (mUsers) {
        const deptId = mUsers[1];
        const data = mockUsers.filter(u => String(u.departmentId) === String(deptId));
        return { success: true, data } as any;
      }
      // Department details
      const mDept = ep.match(/departments\/([^/?]+)$/);
      if (mDept) {
        const id = mDept[1];
        const dept = mockDepartments.find(d => String(d.id) === String(id));
        return { success: true, data: dept } as any;
      }
      // Department tasks
      if (ep.includes('/tasks')) {
        const mTid = ep.match(/departmentId=([^&]+)/);
        const deptId = mTid?.[1] ?? null;
        const data = mockTasks.filter(t => deptId ? String(t.departmentId) === String(deptId) : true);
        return { success: true, data } as any;
      }
      // Analytics or other quick stubs
      if (ep.includes('/analytics')) {
        return { success: true, data: { taskStats: { total: mockTasks.length, inProgress: mockTasks.filter(t => t.status !== 'completed').length, completed: mockTasks.filter(t => t.status === 'completed').length }, employeeStats: { total: mockUsers.length }, topPerformers: [] } } as any;
      }
      // Default empty object
      return { success: true, data: {} as any } as any;
    }
  } catch {}
  try {
    // Try multiple token sources
    const token = localStorage.getItem('accessToken') || 
                  localStorage.getItem('authToken') || 
                  localStorage.getItem('token');
    
    console.log('Making API request to:', `${API_CONFIG.BASE_URL}${endpoint}`);
    console.log('Using token:', token ? `${token.substring(0, 10)}...` : 'No token');
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      timeout: API_CONFIG.TIMEOUT,
    });

    console.log('API Response status:', response.status);
    
    // Handle non-JSON responses
    let data;
    try {
      data = await response.json();
      console.log('API Response data:', data);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      if (response.ok) {
        return { success: true };
      }
      throw new Error(ERROR_MESSAGES.SERVER_ERROR);
    }

    if (!response.ok) {
      console.error('API Error Response:', data);
      // Handle specific error cases
      if (response.status === 403) {
        throw new Error('Access denied. Please check your permissions.');
      }
      if (response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      throw new Error(data.message || data.error || ERROR_MESSAGES.SERVER_ERROR);
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN,
    };
  }
}

export const hodService = {
  // Department Management - New enhanced endpoints
  async getDepartmentUsers(departmentId: string): Promise<ApiResponse<User[]>> {
    try {
      console.log('Fetching department employees for:', departmentId);

      const response = await apiRequest<any>(
        `/api/departments/${departmentId}/employees?includeHierarchy=true`
      );
      
      console.log('Department employees response:', response);
      
      if (response && response.success && response.data) {
        // Transform backend hierarchy response to flat user array
        const { hierarchy, allEmployees } = response.data;
        
        if (allEmployees && Array.isArray(allEmployees)) {
          return {
            success: true,
            data: allEmployees
          };
        }
        
        // Fallback: combine hierarchy data
        const users = [];
        if (hierarchy.departmentHead) users.push(hierarchy.departmentHead);
        if (hierarchy.managers) users.push(...hierarchy.managers);
        if (hierarchy.members) users.push(...hierarchy.members);
        
        return {
          success: true,
          data: users
        };
      }
      // Fallback to mock users when backend didn't return usable data
      console.warn('Department users API did not return data, falling back to mockUsers');
      console.log('Filtering mock users for department:', departmentId);
      console.log('Available mock users:', mockUsers.map(u => ({ id: u.id, name: u.name, departmentId: u.departmentId })));
      
      const fallback = mockUsers.filter(u => String(u.departmentId) === String(departmentId));
      console.log('Filtered mock users for department:', fallback.length, fallback.map(u => ({ id: u.id, name: u.name, role: u.role })));
      
      return { success: true, data: fallback } as ApiResponse<User[]>;
    } catch (error) {
      console.error('getDepartmentUsers error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get department users'
      };
    }
  },

  async getDepartmentDetails(departmentId: string): Promise<ApiResponse<Department>> {
    try {
      console.log('Fetching department details for:', departmentId);
      
      const response = await apiRequest<any>(
        API_CONFIG.ENDPOINTS.DEPARTMENTS.BY_ID(departmentId)
      );
      
      console.log('Department details response:', response);
      
      if (response && response.success && response.data) {
        // Transform backend response to frontend format
        const department: Department = {
          id: response.data.id || response.data._id,
          name: response.data.name,
          description: response.data.description || '',
          headId: response.data.headId,
          managerIds: response.data.managerIds || [],
          memberIds: response.data.memberIds || [],
          memberCount: response.data.memberCount || response.data.employees?.length || 0,
          color: response.data.color || '#3B82F6',
          companyId: response.data.companyId,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt
        };
        
        return {
          success: true,
          data: department
        };
      }
      // Fallback to mock department
      console.warn('Department details API did not return data, falling back to mockDepartments');
      const fallback = mockDepartments.find(d => String(d.id) === String(departmentId));
      return { success: true, data: fallback } as ApiResponse<Department>;
    } catch (error) {
      console.error('getDepartmentDetails error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get department details'
      };
    }
  },

  // Get team members with task analytics (new method)
  async getTeamMembersWithTasks(
    departmentId?: string, 
    timeRange: string = '30d',
    searchTerm: string = '',
    roleFilter: string = 'all',
    statusFilter: string = 'all'
  ): Promise<ApiResponse<{
    userTaskMapping: Array<{
      member: {
        id: string;
        name: string;
        email: string;
        role: string;
        isActive: boolean;
        avatar?: string;
        managerId?: string;
        lastLogin?: Date;
        joinedDate: Date;
      };
      tasks: {
        total: number;
        completed: number;
        inProgress: number;
        assigned: number;
        blocked: number;
        overdue: number;
        urgent: number;
        high: number;
        medium: number;
        low: number;
        completionRate: number;
        onTimeRate: number;
        efficiency: 'high' | 'medium' | 'low';
        productivityScore: number;
        recentTasks: Array<{
          id: string;
          title: string;
          status: string;
          priority: string;
          dueDate?: Date;
          createdAt: Date;
          assignedBy?: any;
        }>;
      };
    }>;
    summary: {
      totalMembers: number;
      activeMembers: number;
      totalTasks: number;
      completedTasks: number;
      avgCompletionRate: number;
      avgProductivityScore: number;
    };
    topPerformers: Array<{
      member: {
        id: string;
        name: string;
        email: string;
        role: string;
        isActive: boolean;
        avatar?: string;
      };
      productivityScore: number;
      completionRate: number;
      totalTasks: number;
      completedTasks: number;
    }>;
    filters: {
      searchTerm: string;
      roleFilter: string;
      statusFilter: string;
      timeRange: string;
    };
    lastUpdated: Date;
  }>> {
    try {
      console.log('Fetching team members with tasks for department:', departmentId, 'timeRange:', timeRange);
      
      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId);
      params.append('timeRange', timeRange);
      if (searchTerm) params.append('searchTerm', searchTerm);
      if (roleFilter !== 'all') params.append('roleFilter', roleFilter);
      if (statusFilter !== 'all') params.append('statusFilter', statusFilter);
      
      const response = await apiRequest<any>(
        `/api/analytics/hod/team/members-with-tasks?${params.toString()}`
      );
      
      console.log('Team members with tasks response:', response);
      
      if (response && response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      // Fallback to mock data
      console.warn('Team members with tasks API did not return data, using fallback');
      return {
        success: true,
        data: {
          userTaskMapping: mockUsers.map(user => ({
            member: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              isActive: user.isActive,
              avatar: user.avatar,
              managerId: user.managerId,
              lastLogin: user.lastLogin,
              joinedDate: user.createdAt
            },
            tasks: {
              total: Math.floor(Math.random() * 10) + 1,
              completed: Math.floor(Math.random() * 5) + 1,
              inProgress: Math.floor(Math.random() * 3) + 1,
              assigned: Math.floor(Math.random() * 2) + 1,
              blocked: Math.floor(Math.random() * 2),
              overdue: Math.floor(Math.random() * 2),
              urgent: Math.floor(Math.random() * 2),
              high: Math.floor(Math.random() * 3),
              medium: Math.floor(Math.random() * 4),
              low: Math.floor(Math.random() * 3),
              completionRate: Math.floor(Math.random() * 40) + 60,
              onTimeRate: Math.floor(Math.random() * 30) + 70,
              efficiency: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
              productivityScore: Math.floor(Math.random() * 40) + 60,
              recentTasks: mockTasks.slice(0, 3).map(t => ({
                id: t.id,
                title: t.title,
                status: t.status,
                priority: t.priority,
                dueDate: new Date(t.dueDate),
                createdAt: new Date(t.createdAt),
                assignedBy: { name: 'Manager' }
              }))
            }
          })),
          summary: {
            totalMembers: mockUsers.length,
            activeMembers: mockUsers.filter(u => u.isActive).length,
            totalTasks: mockTasks.length,
            completedTasks: mockTasks.filter(t => t.status === 'completed').length,
            avgCompletionRate: 75,
            avgProductivityScore: 78
          },
          topPerformers: mockUsers.slice(0, 5).map(user => ({
            member: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              isActive: user.isActive,
              avatar: user.avatar
            },
            productivityScore: Math.floor(Math.random() * 40) + 60,
            completionRate: Math.floor(Math.random() * 40) + 60,
            totalTasks: Math.floor(Math.random() * 10) + 5,
            completedTasks: Math.floor(Math.random() * 8) + 3
          })),
          filters: {
            searchTerm,
            roleFilter,
            statusFilter,
            timeRange
          },
          lastUpdated: new Date()
        }
      };
    } catch (error) {
      console.error('getTeamMembersWithTasks error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get team members with tasks'
      };
    }
  },

  // Get enhanced team overview (new method)
  async getTeamOverview(departmentId?: string, timeRange: string = '30d'): Promise<ApiResponse<{
    department: Department;
    teamStats: {
      totalMembers: number;
      activeMembers: number;
      departmentHeads: number;
      managers: number;
      members: number;
      newMembers: number;
    };
    taskStats: {
      total: number;
      completed: number;
      inProgress: number;
      assigned: number;
      blocked: number;
      overdue: number;
      highPriority: number;
    };
    performanceMetrics: {
      completionRate: number;
      teamEfficiency: number;
      onTimeDelivery: number;
      avgTasksPerMember: number;
      taskDistribution: {
        urgent: number;
        high: number;
        medium: number;
        low: number;
      };
    };
    memberAnalytics: Array<{
      member: {
        id: string;
        name: string;
        email: string;
        role: string;
        isActive: boolean;
        avatar?: string;
        managerId?: string;
      };
      tasks: {
        total: number;
        completed: number;
        inProgress: number;
        overdue: number;
        urgent: number;
        completionRate: number;
        efficiency: 'high' | 'medium' | 'low';
        recentTasks: Array<{
          id: string;
          title: string;
          status: string;
          priority: string;
          dueDate: Date;
          createdAt: Date;
        }>;
      };
    }>;
    topPerformers: Array<{
      member: {
        id: string;
        name: string;
        email: string;
        role: string;
        isActive: boolean;
        avatar?: string;
      };
      completionRate: number;
      totalTasks: number;
      completedTasks: number;
    }>;
    teamHierarchy: {
      departmentHead: {
        id: string;
        name: string;
        email: string;
        role: string;
        avatar?: string;
      } | null;
      managers: Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        avatar?: string;
        teamMembers: Array<{
          id: string;
          name: string;
          email: string;
          role: string;
          isActive: boolean;
          avatar?: string;
        }>;
      }>;
      unassignedMembers: Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        isActive: boolean;
        avatar?: string;
      }>;
    };
    timeRange: string;
    lastUpdated: Date;
  }>> {
    try {
      console.log('Fetching team overview for department:', departmentId, 'timeRange:', timeRange);
      
      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId);
      params.append('timeRange', timeRange);
      
      const response = await apiRequest<any>(
        `/api/analytics/hod/team/overview?${params.toString()}`
      );
      
      console.log('Team overview response:', response);
      
      if (response && response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      // Fallback to mock data
      console.warn('Team overview API did not return data, using fallback');
      return {
        success: true,
        data: {
          department: mockDepartments[0],
          teamStats: {
            totalMembers: mockUsers.length,
            activeMembers: mockUsers.filter(u => u.isActive).length,
            departmentHeads: 1,
            managers: 2,
            members: mockUsers.length - 3,
            newMembers: 0
          },
          taskStats: {
            total: mockTasks.length,
            completed: mockTasks.filter(t => t.status === 'completed').length,
            inProgress: mockTasks.filter(t => t.status === 'in_progress').length,
            assigned: mockTasks.filter(t => t.status === 'assigned').length,
            blocked: 0,
            overdue: 2,
            highPriority: mockTasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length
          },
          performanceMetrics: {
            completionRate: 85,
            teamEfficiency: 92,
            onTimeDelivery: 88,
            avgTasksPerMember: Math.round(mockTasks.length / mockUsers.length),
            taskDistribution: {
              urgent: 2,
              high: 4,
              medium: 6,
              low: 3
            }
          },
          memberAnalytics: mockUsers.map(user => ({
            member: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              isActive: user.isActive,
              avatar: user.avatar
            },
            tasks: {
              total: Math.floor(Math.random() * 10) + 1,
              completed: Math.floor(Math.random() * 5) + 1,
              inProgress: Math.floor(Math.random() * 3) + 1,
              overdue: Math.floor(Math.random() * 2),
              urgent: Math.floor(Math.random() * 2),
              completionRate: Math.floor(Math.random() * 40) + 60,
              efficiency: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
              recentTasks: mockTasks.slice(0, 3).map(t => ({
                id: t.id,
                title: t.title,
                status: t.status,
                priority: t.priority,
                dueDate: new Date(t.dueDate),
                createdAt: new Date(t.createdAt)
              }))
            }
          })),
          topPerformers: mockUsers.slice(0, 5).map(user => ({
            member: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              isActive: user.isActive,
              avatar: user.avatar
            },
            completionRate: Math.floor(Math.random() * 40) + 60,
            totalTasks: Math.floor(Math.random() * 10) + 5,
            completedTasks: Math.floor(Math.random() * 8) + 3
          })),
          teamHierarchy: {
            departmentHead: {
              id: mockUsers[0].id,
              name: mockUsers[0].name,
              email: mockUsers[0].email,
              role: mockUsers[0].role,
              avatar: mockUsers[0].avatar
            },
            managers: mockUsers.filter(u => u.role === 'manager').map(m => ({
              id: m.id,
              name: m.name,
              email: m.email,
              role: m.role,
              avatar: m.avatar,
              teamMembers: mockUsers.filter(u => u.role === 'member').slice(0, 3).map(tm => ({
                id: tm.id,
                name: tm.name,
                email: tm.email,
                role: tm.role,
                isActive: tm.isActive,
                avatar: tm.avatar
              }))
            })),
            unassignedMembers: mockUsers.filter(u => u.role === 'member').slice(3).map(um => ({
              id: um.id,
              name: um.name,
              email: um.email,
              role: um.role,
              isActive: um.isActive,
              avatar: um.avatar
            }))
          },
          timeRange,
          lastUpdated: new Date()
        }
      };
    } catch (error) {
      console.error('getTeamOverview error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get team overview'
      };
    }
  },

  // Get department hierarchy (new method)
  async getDepartmentHierarchy(departmentId: string): Promise<ApiResponse<{
    departmentHead: User | null;
    managers: User[];
    members: User[];
    managerTeams: Array<{
      manager: User;
      teamMembers: User[];
    }>;
    unassignedMembers: User[];
    stats: {
      totalEmployees: number;
      departmentHeads: number;
      managers: number;
      members: number;
      activeEmployees: number;
    };
  }>> {
    try {
      console.log('Fetching department hierarchy for:', departmentId);
      
      const response = await apiRequest<any>(
        `/api/departments/${departmentId}/employees?includeHierarchy=true`
      );
      
      console.log('Department hierarchy response:', response);
      
      if (response.success && response.data?.hierarchy) {
        return {
          success: true,
          data: response.data.hierarchy
        };
      }
      
      return response;
    } catch (error) {
      console.error('getDepartmentHierarchy error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get department hierarchy'
      };
    }
  },

  // Get department analytics (new method)
  async getDepartmentAnalytics(departmentId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiRequest<any>(
        `/departments/${departmentId}/analytics`
      );

      if (response.success && response.data) {
        // Only log successful responses in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Department analytics for ${departmentId}:`, {
            employees: response.data.employeeStats,
            tasks: response.data.taskStats,
            completionRate: response.data.taskStats?.completionRate
          });
        }
        return response;
      }

      return response;
    } catch (error) {
      console.error('getDepartmentAnalytics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get department analytics'
      };
    }
  },

  async getDepartmentTasks(departmentId: string): Promise<ApiResponse<Task[]>> {
    // Force fresh fetch (bypass cache / conditional 304 responses) so frontend always receives latest tasks
    try {
      // Use the HOD-specific analytics endpoint which returns department-scoped tasks
      const response = await apiRequest<Task[]>(
        `${API_CONFIG.ENDPOINTS.ANALYTICS.HOD.DEPARTMENT_TASKS}?departmentId=${departmentId}`,
        {
          method: 'GET',
          // prevent browser caching returning 304 Not Modified
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );

      if (response && response.success && response.data) return response;

      // Fallback to mock tasks when HOD analytics endpoint didn't return usable data
      console.warn('HOD department tasks API did not return data, falling back to mockTasks');
      const fallback = mockTasks.filter(t => String(t.departmentId) === String(departmentId));
      return { success: true, data: fallback } as ApiResponse<Task[]>;
    } catch (error) {
      console.error('getDepartmentTasks error:', error);
      const fallback = mockTasks.filter(t => String(t.departmentId) === String(departmentId));
      return { success: true, data: fallback } as ApiResponse<Task[]>;
    }
  },

  // User Management (HOD Operations)
  async addTeamMember(userData: {
    name: string;
    email: string;
    role: 'manager' | 'member';
    departmentId: string;
    managerId?: string;
    isActive: boolean;
  }): Promise<ApiResponse<User>> {
    return apiRequest<User>(API_CONFIG.ENDPOINTS.USERS.BASE, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateTeamMember(
    userId: string, 
    userData: {
      name: string;
      email: string;
      role: 'manager' | 'member';
      managerId?: string;
      isActive: boolean;
    }
  ): Promise<ApiResponse<User>> {
    return apiRequest<User>(API_CONFIG.ENDPOINTS.USERS.PROFILE(userId), {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async deleteTeamMember(userId: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(API_CONFIG.ENDPOINTS.USERS.PROFILE(userId), {
      method: 'DELETE',
    });
  },

  async changeUserStatus(userId: string, isActive: boolean): Promise<ApiResponse<User>> {
    return apiRequest<User>(`${API_CONFIG.ENDPOINTS.USERS.PROFILE(userId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  // Task Analytics for HOD Dashboard
  async getDepartmentTaskAnalytics(departmentId: string): Promise<ApiResponse<{
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
      user: User;
      totalTasks: number;
      activeTasks: number;
      completedTasks: number;
      overdueTasks: number;
      completionRate: number;
      workload: number;
      efficiency: 'high' | 'medium' | 'low';
    }>;
    topPerformers: Array<{
      user: User;
      completionRate: number;
      totalTasks: number;
    }>;
  }>> {
    return apiRequest(
      `${API_CONFIG.ENDPOINTS.ANALYTICS.DEPARTMENTS}/tasks?departmentId=${departmentId}`
    );
  },

  // Task Assignment (HOD can assign tasks to team members)
  async assignTask(taskData: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assignedTo: string;
    departmentId: string;
    managerId?: string;
    dueDate: Date;
  }): Promise<ApiResponse<Task>> {
    return apiRequest<Task>(API_CONFIG.ENDPOINTS.TASKS.ASSIGN, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  async updateTaskStatus(
    taskId: string, 
    status: 'assigned' | 'in_progress' | 'completed' | 'blocked'
  ): Promise<ApiResponse<Task>> {
    return apiRequest<Task>(API_CONFIG.ENDPOINTS.TASKS.STATUS(taskId), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Manager assignment for department members
  async assignManagerToMember(memberId: string, managerId: string): Promise<ApiResponse<User>> {
    return apiRequest<User>(`${API_CONFIG.ENDPOINTS.USERS.PROFILE(memberId)}/manager`, {
      method: 'PATCH',
      body: JSON.stringify({ managerId }),
    });
  },

  async removeManagerFromMember(memberId: string): Promise<ApiResponse<User>> {
    return apiRequest<User>(`${API_CONFIG.ENDPOINTS.USERS.PROFILE(memberId)}/manager`, {
      method: 'DELETE',
    });
  },

  // Bulk operations for department management
  async bulkUpdateUsers(
    userIds: string[], 
    updates: { 
      managerId?: string; 
      isActive?: boolean; 
      role?: 'manager' | 'member';
    }
  ): Promise<ApiResponse<User[]>> {
    return apiRequest<User[]>(API_CONFIG.ENDPOINTS.USERS.BULK_ACTIONS, {
      method: 'PATCH',
      body: JSON.stringify({ userIds, updates }),
    });
  },

  async bulkDeleteUsers(userIds: string[]): Promise<ApiResponse<void>> {
    return apiRequest<void>(API_CONFIG.ENDPOINTS.USERS.BULK_ACTIONS, {
      method: 'DELETE',
      body: JSON.stringify({ userIds }),
    });
  },

  // Department Statistics for HOD Dashboard
  async getDepartmentStats(departmentId: string): Promise<ApiResponse<{
    totalMembers: number;
    activeMembers: number;
    managersCount: number;
    averageTasksPerMember: number;
    departmentCompletionRate: number;
    monthlyGrowth: number;
    taskDistribution: {
      assigned: number;
      inProgress: number;
      completed: number;
      overdue: number;
    };
    topPerformers: Array<{
      user: User;
      score: number;
    }>;
  }>> {
    return apiRequest(
      `${API_CONFIG.ENDPOINTS.DEPARTMENTS.STATS}?departmentId=${departmentId}`
    );
  },

  // Get user tasks for View Tasks modal
  async getUserTasks(userId: string): Promise<ApiResponse<{
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
    tasks: {
      active: Array<{
        id: string;
        title: string;
        description: string;
        status: string;
        priority: string;
        dueDate: Date;
        createdAt: Date;
        updatedAt: Date;
        assignedTo: {
          id: string;
          name: string;
          email: string;
          role: string;
        };
        assignedBy: {
          id: string;
          name: string;
          email: string;
          role: string;
        } | null;
        department: {
          id: string;
          name: string;
        } | null;
      }>;
      completed: Array<{
        id: string;
        title: string;
        description: string;
        status: string;
        priority: string;
        dueDate: Date;
        createdAt: Date;
        updatedAt: Date;
        assignedTo: {
          id: string;
          name: string;
          email: string;
          role: string;
        };
        assignedBy: {
          id: string;
          name: string;
          email: string;
          role: string;
        } | null;
        department: {
          id: string;
          name: string;
        } | null;
      }>;
      blocked: Array<{
        id: string;
        title: string;
        description: string;
        status: string;
        priority: string;
        dueDate: Date;
        createdAt: Date;
        updatedAt: Date;
        assignedTo: {
          id: string;
          name: string;
          email: string;
          role: string;
        };
        assignedBy: {
          id: string;
          name: string;
          email: string;
          role: string;
        } | null;
        department: {
          id: string;
          name: string;
        } | null;
      }>;
      overdue: Array<{
        id: string;
        title: string;
        description: string;
        status: string;
        priority: string;
        dueDate: Date;
        createdAt: Date;
        updatedAt: Date;
        assignedTo: {
          id: string;
          name: string;
          email: string;
          role: string;
        };
        assignedBy: {
          id: string;
          name: string;
          email: string;
          role: string;
        } | null;
        department: {
          id: string;
          name: string;
        } | null;
      }>;
      all: Array<{
        id: string;
        title: string;
        description: string;
        status: string;
        priority: string;
        dueDate: Date;
        createdAt: Date;
        updatedAt: Date;
        assignedTo: {
          id: string;
          name: string;
          email: string;
          role: string;
        };
        assignedBy: {
          id: string;
          name: string;
          email: string;
          role: string;
        } | null;
        department: {
          id: string;
          name: string;
        } | null;
      }>;
    };
    stats: {
      total: number;
      active: number;
      completed: number;
      blocked: number;
      overdue: number;
      completionRate: number;
      overdueRate: number;
    };
    lastUpdated: Date;
  }>> {
    try {
      console.log('Fetching user tasks for user:', userId);

      const response = await apiRequest<any>(
        `/analytics/hod/user/tasks/${userId}`
      );

      console.log('User tasks response:', response);

      if (response && response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }

      // Fallback to mock data
      console.warn('User tasks API did not return data, using fallback');
      return {
        success: true,
        data: {
          user: {
            id: userId,
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'employee'
          },
          tasks: {
            active: mockTasks.filter(t => ['in_progress', 'assigned', 'pending'].includes(t.status)).map(t => ({
              id: t.id,
              title: t.title,
              description: t.description,
              status: t.status,
              priority: t.priority,
              dueDate: new Date(t.dueDate),
              createdAt: new Date(t.createdAt),
              updatedAt: new Date(t.updatedAt),
              assignedTo: {
                id: userId,
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: 'employee'
              },
              assignedBy: {
                id: 'manager-1',
                name: 'Manager Name',
                email: 'manager@example.com',
                role: 'manager'
              },
              department: {
                id: 'dept-1',
                name: 'Engineering'
              }
            })),
            completed: mockTasks.filter(t => t.status === 'completed').map(t => ({
              id: t.id,
              title: t.title,
              description: t.description,
              status: t.status,
              priority: t.priority,
              dueDate: new Date(t.dueDate),
              createdAt: new Date(t.createdAt),
              updatedAt: new Date(t.updatedAt),
              assignedTo: {
                id: userId,
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: 'employee'
              },
              assignedBy: {
                id: 'manager-1',
                name: 'Manager Name',
                email: 'manager@example.com',
                role: 'manager'
              },
              department: {
                id: 'dept-1',
                name: 'Engineering'
              }
            })),
            blocked: mockTasks.filter(t => t.status === 'blocked').map(t => ({
              id: t.id,
              title: t.title,
              description: t.description,
              status: t.status,
              priority: t.priority,
              dueDate: new Date(t.dueDate),
              createdAt: new Date(t.createdAt),
              updatedAt: new Date(t.updatedAt),
              assignedTo: {
                id: userId,
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: 'employee'
              },
              assignedBy: {
                id: 'manager-1',
                name: 'Manager Name',
                email: 'manager@example.com',
                role: 'manager'
              },
              department: {
                id: 'dept-1',
                name: 'Engineering'
              }
            })),
            overdue: mockTasks.filter(t => {
              const dueDate = new Date(t.dueDate);
              const now = new Date();
              return dueDate < now && !['completed', 'blocked'].includes(t.status);
            }).map(t => ({
              id: t.id,
              title: t.title,
              description: t.description,
              status: t.status,
              priority: t.priority,
              dueDate: new Date(t.dueDate),
              createdAt: new Date(t.createdAt),
              updatedAt: new Date(t.updatedAt),
              assignedTo: {
                id: userId,
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: 'employee'
              },
              assignedBy: {
                id: 'manager-1',
                name: 'Manager Name',
                email: 'manager@example.com',
                role: 'manager'
              },
              department: {
                id: 'dept-1',
                name: 'Engineering'
              }
            })),
            all: mockTasks.map(t => ({
              id: t.id,
              title: t.title,
              description: t.description,
              status: t.status,
              priority: t.priority,
              dueDate: new Date(t.dueDate),
              createdAt: new Date(t.createdAt),
              updatedAt: new Date(t.updatedAt),
              assignedTo: {
                id: userId,
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: 'employee'
              },
              assignedBy: {
                id: 'manager-1',
                name: 'Manager Name',
                email: 'manager@example.com',
                role: 'manager'
              },
              department: {
                id: 'dept-1',
                name: 'Engineering'
              }
            }))
          },
          stats: {
            total: mockTasks.length,
            active: mockTasks.filter(t => ['in_progress', 'assigned', 'pending'].includes(t.status)).length,
            completed: mockTasks.filter(t => t.status === 'completed').length,
            blocked: mockTasks.filter(t => t.status === 'blocked').length,
            overdue: mockTasks.filter(t => {
              const dueDate = new Date(t.dueDate);
              const now = new Date();
              return dueDate < now && !['completed', 'blocked'].includes(t.status);
            }).length,
            completionRate: 75,
            overdueRate: 15
          },
          lastUpdated: new Date()
        }
      };
    } catch (error) {
      console.error('getUserTasks error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user tasks'
      };
    }
  }
};

export default hodService;

