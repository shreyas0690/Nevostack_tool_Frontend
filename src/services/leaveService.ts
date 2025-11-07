import { apiService } from './apiService';
import { API_CONFIG } from '@/config/api';

export interface LeavePayload {
  userId?: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  days?: number;
}

class LeaveService {
  async getLeaves(params: any = {}) {
    return apiService.getPaginated(`${API_CONFIG.ENDPOINTS.LEAVES.BASE}`, params);
  }

  async getHRManagementLeaves(params: any = {}) {
    return apiService.get(`${API_CONFIG.ENDPOINTS.LEAVES.BASE}/hr-management`, params);
  }

  async getLeaveById(id: string) {
    return apiService.get(API_CONFIG.ENDPOINTS.LEAVES.BY_ID(id));
  }

  async createLeave(data: LeavePayload) {
    return apiService.post(API_CONFIG.ENDPOINTS.LEAVES.BASE, data);
  }

  async approveLeave(id: string, note?: string) {
    return apiService.patch(API_CONFIG.ENDPOINTS.LEAVES.APPROVE(id), { note });
  }

  async rejectLeave(id: string, rejectionReason: string) {
    return apiService.patch(API_CONFIG.ENDPOINTS.LEAVES.REJECT(id), { rejectionReason });
  }

  async cancelLeave(id: string, cancellationReason?: string) {
    return apiService.patch(`${API_CONFIG.ENDPOINTS.LEAVES.BY_ID(id)}/cancel`, { cancellationReason });
  }

  async updateLeave(id: string, data: any) {
    return apiService.put(API_CONFIG.ENDPOINTS.LEAVES.BY_ID(id), data);
  }

  async deleteLeave(id: string) {
    return apiService.delete(API_CONFIG.ENDPOINTS.LEAVES.BY_ID(id));
  }

  async getBalance() {
    return apiService.get(API_CONFIG.ENDPOINTS.LEAVES.BALANCE);
  }

  async getMonthlySummary(params: { year?: number; month?: number } = {}) {
    const queryParams = new URLSearchParams();
    if (params.year) queryParams.append('year', params.year.toString());
    if (params.month) queryParams.append('month', params.month.toString());

    const queryString = queryParams.toString();
    const url = `${API_CONFIG.ENDPOINTS.LEAVES.BASE}/monthly-summary${queryString ? `?${queryString}` : ''}`;

    return apiService.get(url);
  }
}

export const leaveService = new LeaveService();
export default leaveService;


