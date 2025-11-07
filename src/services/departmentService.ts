import { apiService } from './apiService';
import { API_CONFIG } from '@/config/api';

export interface Department {
  id: string;
  name: string;
  description?: string;
  headId?: string;
  managerIds: string[];
  memberIds: string[];
  color?: string;
  memberCount: number;
  companyId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDepartmentData {
  name: string;
  description?: string;
  headId?: string;
  color?: string;
}

export interface UpdateDepartmentData {
  name?: string;
  description?: string;
  headId?: string;
  color?: string;
}

class DepartmentService {
  // Get all departments
  async getDepartments(params: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  } = {}) {
    try {
      const response = await apiService.getPaginated<Department>(
        API_CONFIG.ENDPOINTS.DEPARTMENTS.BASE,
        params
      );
      return response;
    } catch (error) {
      console.error('Get departments error:', error);
      throw error;
    }
  }

  // Get department by ID
  async getDepartmentById(id: string) {
    try {
      const response = await apiService.get<Department>(
        API_CONFIG.ENDPOINTS.DEPARTMENTS.BY_ID(id)
      );
      return response;
    } catch (error) {
      console.error('Get department by ID error:', error);
      throw error;
    }
  }

  // Create new department
  async createDepartment(departmentData: CreateDepartmentData) {
    try {
      const response = await apiService.post<Department>(
        API_CONFIG.ENDPOINTS.DEPARTMENTS.BASE,
        departmentData
      );
      return response;
    } catch (error) {
      console.error('Create department error:', error);
      throw error;
    }
  }

  // Update department
  async updateDepartment(id: string, departmentData: UpdateDepartmentData) {
    try {
      const response = await apiService.put<Department>(
        API_CONFIG.ENDPOINTS.DEPARTMENTS.BY_ID(id),
        departmentData
      );
      return response;
    } catch (error) {
      console.error('Update department error:', error);
      throw error;
    }
  }

  // Delete department
  async deleteDepartment(id: string) {
    try {
      const response = await apiService.delete<void>(
        API_CONFIG.ENDPOINTS.DEPARTMENTS.BY_ID(id)
      );
      return response;
    } catch (error) {
      console.error('Delete department error:', error);
      throw error;
    }
  }

  // Get department employees
  async getDepartmentEmployees(id: string, params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  } = {}) {
    try {
      const response = await apiService.getPaginated<any>(
        API_CONFIG.ENDPOINTS.DEPARTMENTS.EMPLOYEES(id),
        params
      );
      return response;
    } catch (error) {
      console.error('Get department employees error:', error);
      throw error;
    }
  }

  // Get department statistics
  async getDepartmentStats() {
    try {
      const response = await apiService.get<any>(
        API_CONFIG.ENDPOINTS.DEPARTMENTS.STATS
      );
      return response;
    } catch (error) {
      console.error('Get department stats error:', error);
      throw error;
    }
  }

  // Add member to department
  async addMember(departmentId: string, userId: string) {
    try {
      const response = await apiService.post<any>(
        `${API_CONFIG.ENDPOINTS.DEPARTMENTS.BY_ID(departmentId)}/members`,
        { userId }
      );
      return response;
    } catch (error) {
      console.error('Add department member error:', error);
      throw error;
    }
  }

  // Remove member from department
  async removeMember(departmentId: string, userId: string) {
    try {
      const response = await apiService.delete<any>(
        `${API_CONFIG.ENDPOINTS.DEPARTMENTS.BY_ID(departmentId)}/members/${userId}`
      );
      return response;
    } catch (error) {
      console.error('Remove department member error:', error);
      throw error;
    }
  }

  // Assign department head
  async assignHead(departmentId: string, userId: string) {
    try {
      const response = await apiService.post<any>(
        `${API_CONFIG.ENDPOINTS.DEPARTMENTS.BY_ID(departmentId)}/head`,
        { userId }
      );
      return response;
    } catch (error) {
      console.error('Assign department head error:', error);
      throw error;
    }
  }
}

export const departmentService = new DepartmentService();
export default departmentService;









