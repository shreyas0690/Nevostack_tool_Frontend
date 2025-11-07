import { apiService } from './apiService';
import { API_CONFIG, type ApiResponse } from '@/config/api';

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  workingHours: number;
  overtimeHours: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'work_from_home';
  checkInLocation?: {
    coordinates: [number, number];
    address: string;
  };
  checkOutLocation?: {
    coordinates: [number, number];
    address: string;
  };
  breaks: Array<{
    startTime: string;
    endTime?: string;
    duration: number;
    type: 'lunch' | 'short' | 'other';
  }>;
  notes?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInRequest {
  location?: {
    coordinates: [number, number];
    address: string;
  };
  notes?: string;
}

export interface CheckOutRequest {
  location?: {
    coordinates: [number, number];
    address: string;
  };
  notes?: string;
}

export interface AttendanceFilters {
  userId?: string;
  departmentId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  search?: string;
}

export interface AttendanceStats {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  workFromHomeDays: number;
  totalWorkingHours: number;
  averageWorkingHours: number;
  overtimeHours: number;
  attendanceRate: number;
  punctualityRate: number;
  monthlyBreakdown: Array<{
    month: string;
    presentDays: number;
    absentDays: number;
    workingHours: number;
  }>;
}

export interface TodayAttendance {
  isCheckedIn: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  workingHours: number;
  currentBreak?: {
    startTime: string;
    type: string;
  };
  location?: {
    coordinates: [number, number];
    address: string;
  };
}

class AttendanceService {
  // Get attendance records with pagination and filters
  async getAttendanceRecords(
    page: number = 1,
    limit: number = 20,
    filters: AttendanceFilters = {}
  ): Promise<ApiResponse<AttendanceRecord[]>> {
    return apiService.getPaginated<AttendanceRecord>(API_CONFIG.ENDPOINTS.ATTENDANCE.BASE, {
      page,
      limit,
      filters
    });
  }

  // Get attendance record by ID
  async getAttendanceById(id: string): Promise<ApiResponse<AttendanceRecord>> {
    return apiService.get<AttendanceRecord>(API_CONFIG.ENDPOINTS.ATTENDANCE.BY_ID(id));
  }

  // Get today's attendance for current user
  async getTodayAttendance(): Promise<ApiResponse<TodayAttendance>> {
    return apiService.get<TodayAttendance>(`${API_CONFIG.ENDPOINTS.ATTENDANCE.BASE}/today`);
  }

  // Check in
  async checkIn(data: CheckInRequest): Promise<ApiResponse<AttendanceRecord>> {
    return apiService.post<AttendanceRecord>(API_CONFIG.ENDPOINTS.ATTENDANCE.CHECK_IN, data);
  }

  // Check out
  async checkOut(data: CheckOutRequest): Promise<ApiResponse<AttendanceRecord>> {
    return apiService.post<AttendanceRecord>(API_CONFIG.ENDPOINTS.ATTENDANCE.CHECK_OUT, data);
  }

  // Start break
  async startBreak(type: 'lunch' | 'short' | 'other' = 'short'): Promise<ApiResponse<void>> {
    return apiService.post<void>(`${API_CONFIG.ENDPOINTS.ATTENDANCE.BASE}/break/start`, { type });
  }

  // End break
  async endBreak(): Promise<ApiResponse<void>> {
    return apiService.post<void>(`${API_CONFIG.ENDPOINTS.ATTENDANCE.BASE}/break/end`);
  }

  // Get my attendance records
  async getMyAttendance(
    dateFrom?: string,
    dateTo?: string
  ): Promise<ApiResponse<AttendanceRecord[]>> {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    
    const query = params.toString() ? `?${params}` : '';
    return apiService.get<AttendanceRecord[]>(`${API_CONFIG.ENDPOINTS.ATTENDANCE.BASE}/my-attendance${query}`);
  }

  // Get attendance for specific user
  async getUserAttendance(
    userId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ApiResponse<AttendanceRecord[]>> {
    const params = new URLSearchParams({ userId });
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    
    return apiService.get<AttendanceRecord[]>(`${API_CONFIG.ENDPOINTS.ATTENDANCE.BASE}?${params}`);
  }

  // Get attendance statistics
  async getAttendanceStats(
    userId?: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<ApiResponse<AttendanceStats>> {
    const params = new URLSearchParams({ period });
    if (userId) params.append('userId', userId);
    
    return apiService.get<AttendanceStats>(`${API_CONFIG.ENDPOINTS.ATTENDANCE.STATS}?${params}`);
  }

  // Create manual attendance record (Admin only)
  async createAttendanceRecord(data: {
    userId: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    status: AttendanceRecord['status'];
    notes?: string;
  }): Promise<ApiResponse<AttendanceRecord>> {
    return apiService.post<AttendanceRecord>(API_CONFIG.ENDPOINTS.ATTENDANCE.BASE, data);
  }

  // Update attendance record (Admin only)
  async updateAttendanceRecord(
    id: string,
    data: Partial<AttendanceRecord>
  ): Promise<ApiResponse<AttendanceRecord>> {
    return apiService.put<AttendanceRecord>(API_CONFIG.ENDPOINTS.ATTENDANCE.BY_ID(id), data);
  }

  // Delete attendance record (Admin only)
  async deleteAttendanceRecord(id: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(API_CONFIG.ENDPOINTS.ATTENDANCE.BY_ID(id));
  }

  // Approve attendance record
  async approveAttendance(id: string, notes?: string): Promise<ApiResponse<AttendanceRecord>> {
    return apiService.patch<AttendanceRecord>(`${API_CONFIG.ENDPOINTS.ATTENDANCE.BY_ID(id)}/approve`, { notes });
  }

  // Reject attendance record
  async rejectAttendance(id: string, reason: string): Promise<ApiResponse<AttendanceRecord>> {
    return apiService.patch<AttendanceRecord>(`${API_CONFIG.ENDPOINTS.ATTENDANCE.BY_ID(id)}/reject`, { reason });
  }

  // Get department attendance summary
  async getDepartmentAttendance(
    departmentId: string,
    date?: string
  ): Promise<ApiResponse<Array<{
    userId: string;
    userName: string;
    status: AttendanceRecord['status'];
    checkInTime?: string;
    checkOutTime?: string;
    workingHours: number;
  }>>> {
    const params = new URLSearchParams({ departmentId });
    if (date) params.append('date', date);
    
    return apiService.get(`${API_CONFIG.ENDPOINTS.ATTENDANCE.BASE}/department?${params}`);
  }

  // Get attendance reports
  async getAttendanceReport(
    filters: AttendanceFilters & {
      reportType: 'daily' | 'weekly' | 'monthly';
      format?: 'json' | 'csv' | 'excel';
    }
  ): Promise<ApiResponse<any> | Blob> {
    const { format = 'json', ...otherFilters } = filters;
    
    if (format === 'json') {
      return apiService.get<any>(`${API_CONFIG.ENDPOINTS.ATTENDANCE.REPORTS}`, {
        headers: {
          'X-Filters': JSON.stringify(otherFilters)
        }
      });
    } else {
      const params = new URLSearchParams({
        format,
        ...otherFilters
      });
      
      return apiService.downloadFile(
        `${API_CONFIG.ENDPOINTS.ATTENDANCE.REPORTS}?${params}`,
        `attendance_report_${new Date().toISOString().split('T')[0]}.${format}`
      );
    }
  }

  // Get overtime records
  async getOvertimeRecords(
    userId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ApiResponse<Array<{
    id: string;
    userId: string;
    date: string;
    overtimeHours: number;
    reason: string;
    approvedBy?: string;
    status: 'pending' | 'approved' | 'rejected';
  }>>> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    
    const query = params.toString() ? `?${params}` : '';
    return apiService.get(`${API_CONFIG.ENDPOINTS.ATTENDANCE.BASE}/overtime${query}`);
  }

  // Request overtime
  async requestOvertime(data: {
    date: string;
    hours: number;
    reason: string;
  }): Promise<ApiResponse<void>> {
    return apiService.post<void>(`${API_CONFIG.ENDPOINTS.ATTENDANCE.BASE}/overtime/request`, data);
  }

  // Bulk operations
  async bulkUpdateAttendance(
    ids: string[],
    updateData: Partial<AttendanceRecord>
  ): Promise<ApiResponse<AttendanceRecord[]>> {
    return apiService.bulkOperation<AttendanceRecord[]>(
      API_CONFIG.ENDPOINTS.ATTENDANCE.BASE,
      'update',
      ids,
      updateData
    );
  }

  async bulkApproveAttendance(ids: string[]): Promise<ApiResponse<AttendanceRecord[]>> {
    return apiService.bulkOperation<AttendanceRecord[]>(
      API_CONFIG.ENDPOINTS.ATTENDANCE.BASE,
      'approve',
      ids
    );
  }

  // Export attendance data
  async exportAttendance(
    filters: AttendanceFilters = {},
    format: 'csv' | 'excel' = 'csv'
  ): Promise<Blob> {
    const params = new URLSearchParams({
      format,
      ...filters
    });
    
    return apiService.downloadFile(
      `${API_CONFIG.ENDPOINTS.ATTENDANCE.BASE}/export?${params}`,
      `attendance_export_${new Date().toISOString().split('T')[0]}.${format}`
    );
  }

  // Get attendance calendar data
  async getAttendanceCalendar(
    userId?: string,
    month?: string,
    year?: string
  ): Promise<ApiResponse<Array<{
    date: string;
    status: AttendanceRecord['status'];
    workingHours: number;
    checkInTime?: string;
    checkOutTime?: string;
  }>>> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    
    const query = params.toString() ? `?${params}` : '';
    return apiService.get(`${API_CONFIG.ENDPOINTS.ATTENDANCE.BASE}/calendar${query}`);
  }

  // Get late arrivals
  async getLateArrivals(
    dateFrom?: string,
    dateTo?: string,
    departmentId?: string
  ): Promise<ApiResponse<Array<{
    userId: string;
    userName: string;
    date: string;
    scheduledTime: string;
    actualTime: string;
    lateMinutes: number;
  }>>> {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (departmentId) params.append('departmentId', departmentId);
    
    const query = params.toString() ? `?${params}` : '';
    return apiService.get(`${API_CONFIG.ENDPOINTS.ATTENDANCE.BASE}/late-arrivals${query}`);
  }
}

export const attendanceService = new AttendanceService();
export default attendanceService;
