import { userService } from './userService';
import { leaveService } from './leaveService';
import { taskService } from './taskService';
import { departmentService } from './departmentService';

export interface HRDashboardData {
  totalEmployees: number;
  totalDepartments: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  recentLeaves: any[];
  recentTasks: any[];
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  departmentStats: DepartmentStat[];
  companyUsers: any[];
  companyLeaves: any[];
  companyTasks: any[];
}

export interface DepartmentStat {
  name: string;
  count: number;
  active: number;
  percentage: number;
}

export interface HRDashboardFilters {
  companyId: string;
  userId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  departmentId?: string;
}

class HRDashboardService {
  /**
   * Get comprehensive HR dashboard data
   */
  async getDashboardData(filters: HRDashboardFilters): Promise<HRDashboardData> {
    try {
      console.log('🏢 HR Dashboard Service - Loading data for company:', filters.companyId);
      
      // Load all company users
      const usersRes = await userService.getUsers({ 
        limit: 1000, 
        companyId: filters.companyId 
      });
      const allUsers = usersRes?.data || [];
      
      console.log('👥 Users loaded:', allUsers.length);
      
      // Filter users by company
      const companyUsers = allUsers.filter(user => 
        user.companyId === filters.companyId || 
        user.company?.id === filters.companyId ||
        user.company?._id === filters.companyId
      );
      
      console.log('🏢 Company users filtered:', companyUsers.length);
      
      // Load leave requests using HR Management API (excludes HR own requests)
      let companyLeaves = [];
      try {
        const leavesRes = await leaveService.getHRManagementLeaves({ limit: 500 });
        companyLeaves = leavesRes?.data || leavesRes?.leaves || [];
        console.log('📅 HR Management API - Leaves loaded (excluding HR own):', companyLeaves.length);
      } catch (error) {
        console.warn('HR Management API failed, falling back to regular API:', error);
        // Fallback to regular API if HR Management API fails
        const leavesRes = await leaveService.getLeaves({ limit: 500 });
        const allLeaves = leavesRes?.leaves || leavesRes?.data || [];
        
        // Filter leaves by company users (excluding HR own requests)
        companyLeaves = allLeaves.filter(leave => {
          const isCompanyLeave = companyUsers.some(user => 
            user.id === leave.userId || 
            user._id === leave.userId ||
            user.id === leave.user?._id ||
            user._id === leave.user?._id
          );
          // Exclude HR's own requests
          const isHROwnRequest = leave.userId === filters.userId || 
                                leave.user?._id === filters.userId ||
                                leave.user?.id === filters.userId;
          return isCompanyLeave && !isHROwnRequest;
        });
        
        console.log('📅 Fallback API - Company leaves filtered (excluding HR own):', companyLeaves.length);
      }
      
      // Calculate basic metrics
      const totalEmployees = companyUsers.length;
      const activeUsers = companyUsers.filter(u => u.isActive !== false).length;
      const inactiveUsers = companyUsers.filter(u => u.isActive === false).length;
      
      // Get total departments count for the company
      let totalDepartmentsCount = 0;
      try {
        const deptsRes = await departmentService.getDepartments({ limit: 1 }); // Get just pagination info
        totalDepartmentsCount = deptsRes?.pagination?.total || 0;
        console.log('🏢 Total departments count from backend:', totalDepartmentsCount);
      } catch (err) {
        console.warn('Failed to fetch total departments count:', err);
      }

      // Calculate department statistics (excluding users with no department)
      const usersWithDepartments = companyUsers.filter(user =>
        user.department?.name || user.department?.title || user.departmentId
      );
      let departmentStats = this.calculateDepartmentStats(usersWithDepartments);

      // If backend user objects don't contain department details, fall back to fetching departments
      // and computing counts from companyUsers using departmentId.
      if ((!departmentStats || departmentStats.length === 0) && companyUsers.length > 0) {
        try {
          const deptsRes = await departmentService.getDepartments({ limit: 1000 });
          const depts = deptsRes?.data || [];

          if (Array.isArray(depts) && depts.length > 0) {
            departmentStats = depts.map((d: any) => {
              const deptId = String(d.id || d._id || d._id);
              const usersInDept = companyUsers.filter(u => {
                const rawDept = u.department?.id || u.department?._id || u.departmentId || u.department;
                return String(rawDept) === deptId;
              });
              const count = usersInDept.length;
              const active = usersInDept.filter(u => u.isActive !== false).length;
              return {
                name: d.name || d.title || 'Unknown',
                count,
                active,
                percentage: count ? Math.round((active / count) * 100) : 0
              };
            }).filter((s: any) => s.count > 0);
          }
        } catch (err) {
          console.warn('Failed to fetch departments for HR dashboard fallback:', err);
        }
      }
      
      console.log('🏢 Department Filtering:', {
        totalCompanyUsers: companyUsers.length,
        usersWithDepartments: usersWithDepartments.length,
        usersWithoutDepartments: companyUsers.length - usersWithDepartments.length,
        departmentStatsCount: departmentStats.length
      });
      
      // Calculate leave statistics
      const pendingLeaves = companyLeaves.filter(l => l.status === 'pending').length;
      const approvedLeaves = companyLeaves.filter(l => l.status === 'approved').length;
      const rejectedLeaves = companyLeaves.filter(l => l.status === 'rejected').length;
      
      // Get recent leaves (limit to 5 only)
      const recentLeaves = companyLeaves
        .sort((a, b) => new Date(b.createdAt || b.appliedAt).getTime() - new Date(a.createdAt || a.appliedAt).getTime())
        .slice(0, 5);
      
      // Load company tasks using HR Management API (excludes completed, blocked, cancelled, overdue)
      let companyTasks = [];
      try {
        const tasksRes = await taskService.getHRManagementTasks(1, 500, {});
        companyTasks = tasksRes?.data || [];
        console.log('📋 HR Management Tasks API - Company tasks loaded (filtered):', companyTasks.length);
      } catch (error) {
        console.warn('HR Management Tasks API failed, falling back to regular API:', error);
        // Fallback to regular API if HR Management API fails
        const tasksRes = await taskService.getTasks(1, 500, {});
        const allTasks = tasksRes?.data || [];
        
        // Filter tasks by company users and exclude unwanted statuses
        companyTasks = allTasks.filter(task => {
          const isCompanyTask = companyUsers.some(user => 
            user.id === task.assignedTo || 
            user._id === task.assignedTo ||
            user.id === task.assignedBy ||
            user._id === task.assignedBy
          );
          
          // Exclude completed, blocked, cancelled tasks
          const isExcludedStatus = ['completed', 'blocked', 'cancelled'].includes(task.status);
          
          // Exclude overdue tasks
          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
          
          return isCompanyTask && !isExcludedStatus && !isOverdue;
        });
        
        console.log('📋 Fallback API - Company tasks filtered:', companyTasks.length);
      }
      
      // Calculate task statistics
      const totalTasks = companyTasks.length;
      const completedTasks = companyTasks.filter(t => t.status === 'completed').length;
      const inProgressTasks = companyTasks.filter(t => t.status === 'in_progress').length;
      const overdueTasks = companyTasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < new Date() && t.status !== 'completed';
      }).length;
      
      // Get recent tasks (limit to 5 only)
      const recentTasks = companyTasks
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      const dashboardData: HRDashboardData = {
        totalEmployees,
        totalDepartments: totalDepartmentsCount, // Total departments count from backend
        activeUsers,
        inactiveUsers,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        recentLeaves,
        recentTasks,
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        departmentStats,
        companyUsers,
        companyLeaves,
        companyTasks
      };
      
      console.log('✅ HR Dashboard data loaded successfully:', {
        totalEmployees,
        totalDepartments: totalDepartmentsCount,
        activeUsers,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks
      });
      
      // Debug: Check department calculation
      console.log('🔍 Debug - Department Stats Calculation:');
      console.log('  - Company Users:', companyUsers.length);
      console.log('  - Department Stats:', departmentStats);
      console.log('  - Department Stats Length:', departmentStats.length);
      console.log('  - Total Departments:', totalDepartmentsCount);
      
      return dashboardData;
      
    } catch (error) {
      console.error('❌ HR Dashboard Service Error:', error);
      throw new Error(`Failed to load HR dashboard data: ${error}`);
    }
  }
  
  /**
   * Calculate department statistics
   */
  private calculateDepartmentStats(users: any[]): DepartmentStat[] {
    const deptMap = new Map<string, { count: number; active: number }>();
    
    console.log('🔍 Debug - calculateDepartmentStats input users:', users.length);
    
    users.forEach((user, index) => {
      // Debug: Log first few users to see their department structure
      if (index < 3) {
        console.log(`🔍 Debug - User ${index + 1}:`, {
          id: user.id,
          name: user.name || user.firstName + ' ' + user.lastName,
          department: user.department,
          isActive: user.isActive
        });
      }
      
      // Skip users with no department
      const deptName = user.department?.name || user.department?.title;
      if (!deptName) {
        console.log(`🔍 Debug - User ${index + 1} has no department:`, user.department);
        return; // Skip users with no department
      }
      
      const isActive = user.isActive !== false;
      
      if (!deptMap.has(deptName)) {
        deptMap.set(deptName, { count: 0, active: 0 });
      }
      
      const dept = deptMap.get(deptName)!;
      dept.count++;
      if (isActive) dept.active++;
    });
    
    const result = Array.from(deptMap.entries()).map(([name, stats]) => ({
      name,
      count: stats.count,
      active: stats.active,
      percentage: Math.round((stats.active / stats.count) * 100)
    }));
    
    console.log('🔍 Debug - calculateDepartmentStats result:', result);
    return result;
  }
  
  /**
   * Get department-wise employee breakdown
   */
  async getDepartmentBreakdown(companyId: string) {
    try {
      const usersRes = await userService.getUsers({ 
        limit: 1000, 
        companyId 
      });
      const users = usersRes?.data || [];
      
      const companyUsers = users.filter(user => 
        user.companyId === companyId || 
        user.company?.id === companyId
      );
      
      // Filter out users with no department
      const usersWithDepartments = companyUsers.filter(user => 
        user.department?.name || user.department?.title
      );
      
      console.log('🏢 Department Breakdown:', {
        totalCompanyUsers: companyUsers.length,
        usersWithDepartments: usersWithDepartments.length,
        usersWithoutDepartments: companyUsers.length - usersWithDepartments.length
      });
      
      return this.calculateDepartmentStats(usersWithDepartments);
    } catch (error) {
      console.error('❌ Department breakdown error:', error);
      return [];
    }
  }
  
  /**
   * Get leave statistics for company
   */
  async getLeaveStatistics(companyId: string) {
    try {
      const usersRes = await userService.getUsers({ 
        limit: 1000, 
        companyId 
      });
      const users = usersRes?.data || [];
      
      const companyUsers = users.filter(user => 
        user.companyId === companyId || 
        user.company?.id === companyId
      );
      
      const leavesRes = await leaveService.getLeaves({ limit: 500 });
      const allLeaves = leavesRes?.leaves || leavesRes?.data || [];
      
      const companyLeaves = allLeaves.filter(leave => {
        return companyUsers.some(user => 
          user.id === leave.userId || 
          user._id === leave.userId
        );
      });
      
      return {
        total: companyLeaves.length,
        pending: companyLeaves.filter(l => l.status === 'pending').length,
        approved: companyLeaves.filter(l => l.status === 'approved').length,
        rejected: companyLeaves.filter(l => l.status === 'rejected').length,
        cancelled: companyLeaves.filter(l => l.status === 'cancelled').length
      };
    } catch (error) {
      console.error('❌ Leave statistics error:', error);
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0
      };
    }
  }
  
  /**
   * Get recent activities for HR
   */
  async getRecentActivities(companyId: string, limit: number = 5) {
    try {
      const usersRes = await userService.getUsers({ 
        limit: 1000, 
        companyId 
      });
      const users = usersRes?.data || [];
      
      const companyUsers = users.filter(user => 
        user.companyId === companyId || 
        user.company?.id === companyId
      );
      
      // Use HR Management API to get company leaves (excluding HR own requests)
      let companyLeaves = [];
      try {
        const leavesRes = await leaveService.getHRManagementLeaves({ limit: 100 });
        companyLeaves = leavesRes?.data || leavesRes?.leaves || [];
        console.log('📅 Recent Activities - HR Management API leaves:', companyLeaves.length);
      } catch (error) {
        console.warn('HR Management API failed in recent activities, falling back to regular API:', error);
        // Fallback to regular API
        const leavesRes = await leaveService.getLeaves({ limit: 100 });
        const allLeaves = leavesRes?.leaves || leavesRes?.data || [];
        
        companyLeaves = allLeaves.filter(leave => {
          return companyUsers.some(user => 
            user.id === leave.userId || 
            user._id === leave.userId
          );
        });
      }
      
      // Combine and sort activities
      const activities = [
        ...companyLeaves.map(leave => ({
          type: 'leave',
          id: leave.id,
          title: `${leave.user?.firstName || 'User'} ${leave.user?.lastName || ''} applied for ${leave.type} leave`,
          date: new Date(leave.createdAt || leave.appliedAt),
          status: leave.status,
          user: leave.user
        })),
        ...companyUsers.map(user => ({
          type: 'user',
          id: user.id,
          title: `${user.firstName} ${user.lastName} joined the company`,
          date: new Date(user.createdAt || user.joinedAt),
          status: user.isActive ? 'active' : 'inactive',
          user: user
        }))
      ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
      
      return activities;
    } catch (error) {
      console.error('❌ Recent activities error:', error);
      return [];
    }
  }
}

export const hrDashboardService = new HRDashboardService();
