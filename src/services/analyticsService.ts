import { apiService } from './apiService';
import { API_CONFIG } from '@/config/api';

class AnalyticsService {
  async getOverview(params: any = {}) {
    const qs = new URLSearchParams(params).toString();
    const analyticsCfg = API_CONFIG.ENDPOINTS.ANALYTICS;
    const overviewPath = analyticsCfg?.OVERVIEW || analyticsCfg?.DASHBOARD || '/analytics/overview';
    const endpoint = overviewPath + (qs ? `?${qs}` : '');
    return apiService.get(endpoint);
  }

  // Get task status distribution with filtering options
  async getTaskStatusDistribution(params: {
    excludeOverdue?: boolean;
    statusFilter?: 'all' | 'assigned' | 'in_progress';
    includeOverdue?: boolean;
  } = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.excludeOverdue) {
      queryParams.append('excludeOverdue', 'true');
    }
    
    if (params.statusFilter && params.statusFilter !== 'all') {
      queryParams.append('statusFilter', params.statusFilter);
    }
    
    if (params.includeOverdue) {
      queryParams.append('includeOverdue', 'true');
    }
    
    const qs = queryParams.toString();
    const analyticsCfg = API_CONFIG.ENDPOINTS.ANALYTICS;
    const endpoint = (analyticsCfg?.TASK_STATUS_DISTRIBUTION || '/analytics/task-status-distribution') + (qs ? `?${qs}` : '');
    return apiService.get(endpoint);
  }

  async getLeavesTimeseries(params: any = {}) {
    const qs = new URLSearchParams(params).toString();
    const analyticsCfg = API_CONFIG.ENDPOINTS.ANALYTICS;
    const leavesPath = analyticsCfg?.LEAVES_TIMESERIES || '/analytics/leaves/timeseries';
    const endpoint = leavesPath + (qs ? `?${qs}` : '');
    return apiService.get(endpoint);
  }

  async getTasksTimeseries(params: any = {}) {
    const qs = new URLSearchParams(params).toString();
    const analyticsCfg = API_CONFIG.ENDPOINTS.ANALYTICS;
    const tasksPath = analyticsCfg?.TASKS_TIMESERIES || '/analytics/tasks/timeseries';
    const endpoint = tasksPath + (qs ? `?${qs}` : '');
    return apiService.get(endpoint);
  }

  // Fallback: fetch raw leaves list (for environments where analytics overview is incomplete)
  async getLeavesList(params: any = {}) {
    const qs = new URLSearchParams(params).toString();
    const endpoint = API_CONFIG.ENDPOINTS.LEAVES.BASE + (qs ? `?${qs}` : '');
    return apiService.get(endpoint);
  }

  async getTopLeaves(params: any = {}) {
    const qs = new URLSearchParams(params).toString();
    const analyticsCfg = API_CONFIG.ENDPOINTS.ANALYTICS;
    const topPath = analyticsCfg?.LEAVES_TOP || '/analytics/leaves/top';
    const endpoint = topPath + (qs ? `?${qs}` : '');
    return apiService.get(endpoint);
  }

  async getActiveTasks(params: any = {}) {
    try {
      const qs = new URLSearchParams(params).toString();
      const analyticsCfg = API_CONFIG.ENDPOINTS.ANALYTICS;
      const activeTasksPath = analyticsCfg?.ACTIVE_TASKS || '/analytics/active-tasks';
      const endpoint = activeTasksPath + (qs ? `?${qs}` : '');
      const result = await apiService.get(endpoint);
      console.log('✅ Analytics Service - getActiveTasks API result:', result);
      return result;
    } catch (error) {
      console.warn('⚠️ Analytics Service - getActiveTasks API failed, using mock data:', error);
      // Fallback to mock data
      const { mockTasks } = await import('@/data/mockData');
      const activeTasks = mockTasks.filter(task => 
        ['in_progress', 'assigned'].includes(task.status) &&
        (!task.dueDate || new Date(task.dueDate) >= new Date())
      ).slice(0, 10);
      
      return {
        success: true,
        data: {
          tasks: activeTasks.map(task => ({
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            createdAt: task.createdAt,
            assignedUser: { name: 'Team Member' },
            department: { name: 'Department' }
          })),
          total: activeTasks.length,
          limit: 10
        }
      };
    }
  }

  // HOD-specific methods
  async getHODOverview(params: any = {}) {
    const qs = new URLSearchParams(params).toString();
    const hodCfg = API_CONFIG.ENDPOINTS.ANALYTICS?.HOD;
    const overviewPath = hodCfg?.OVERVIEW || '/analytics/hod/overview';
    const endpoint = overviewPath + (qs ? `?${qs}` : '');
    return apiService.get(endpoint);
  }

  async getHODTasks(params: any = {}) {
    const qs = new URLSearchParams(params).toString();
    const hodCfg = API_CONFIG.ENDPOINTS.ANALYTICS?.HOD;
    const tasksPath = hodCfg?.TASKS || '/analytics/hod/tasks';
    const endpoint = tasksPath + (qs ? `?${qs}` : '');
    return apiService.get(endpoint);
  }

  async getHODDepartmentTasks(params: any = {}) {
    const qs = new URLSearchParams(params).toString();
    const hodCfg = API_CONFIG.ENDPOINTS.ANALYTICS?.HOD;
    const deptTasksPath = hodCfg?.DEPARTMENT_TASKS || '/analytics/hod/department/tasks';
    const endpoint = deptTasksPath + (qs ? `?${qs}` : '');
    return apiService.get(endpoint);
  }

  async getHODDepartmentMembers(params: any = {}) {
    const qs = new URLSearchParams(params).toString();
    const hodCfg = API_CONFIG.ENDPOINTS.ANALYTICS?.HOD;
    const membersPath = hodCfg?.DEPARTMENT_MEMBERS || '/analytics/hod/department/members';
    const endpoint = membersPath + (qs ? `?${qs}` : '');
    return apiService.get(endpoint);
  }

  async getHODAnalytics(params: any = {}) {
    const qs = new URLSearchParams(params).toString();
    const hodCfg = API_CONFIG.ENDPOINTS.ANALYTICS?.HOD;
    const analyticsPath = hodCfg?.ANALYTICS || '/analytics/hod/analytics';
    const endpoint = analyticsPath + (qs ? `?${qs}` : '');
    return apiService.get(endpoint);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;






