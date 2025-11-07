import { apiService } from './apiService';
import { API_CONFIG } from '@/config/api';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  organizer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  organizerRole: 'admin' | 'department_head' | 'manager' | 'member';
  company?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
  inviteeUserIds: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }>;
  inviteeRoles?: Array<'admin' | 'department_head' | 'manager' | 'member'>;
  participants?: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    };
    role: 'organizer' | 'required' | 'optional';
    status: 'pending' | 'accepted' | 'declined' | 'tentative';
    joinedAt?: string;
    leftAt?: string;
    responseAt?: string;
    responseNote?: string;
  }>;
  startTime: string;
  endTime?: string;
  meetingLink?: string;
  location?: {
    physical?: {
      room?: string;
      building?: string;
      address?: string;
      floor?: string;
    };
    virtual?: {
      platform?: 'zoom' | 'teams' | 'meet' | 'webex' | 'other';
      meetingUrl?: string;
      meetingId?: string;
      password?: string;
    };
  };
  type: 'physical' | 'virtual' | 'hybrid';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMeetingData {
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  meetingLink?: string;
  location?: Meeting['location'];
  type?: 'physical' | 'virtual' | 'hybrid';
  departmentId?: string;
  inviteeUserIds?: string[];
  inviteeRoles?: Array<'admin' | 'department_head' | 'manager' | 'member'>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface UpdateMeetingData {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  meetingLink?: string;
  location?: Meeting['location'];
  type?: 'physical' | 'virtual' | 'hybrid';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface MeetingFilters {
  status?: string;
  type?: string;
  departmentId?: string;
  organizerId?: string;
  inviteeUserIds?: string[];
  startDate?: string;
  endDate?: string;
  priority?: string;
}

class MeetingService {
  // Get all meetings for the current user
  async getMeetings(params: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    filters?: MeetingFilters;
  } = {}) {
    try {
      const response = await apiService.getPaginated<Meeting>(
        API_CONFIG.ENDPOINTS.MEETINGS.BASE,
        params
      );
      return response;
    } catch (error) {
      console.error('Get meetings error:', error);
      throw error;
    }
  }

  // Get meeting by ID
  async getMeetingById(id: string) {
    try {
      const response = await apiService.get<Meeting>(
        API_CONFIG.ENDPOINTS.MEETINGS.BY_ID(id)
      );
      return response;
    } catch (error) {
      console.error('Get meeting by ID error:', error);
      throw error;
    }
  }

  // Create new meeting
  async createMeeting(meetingData: CreateMeetingData) {
    try {
      const response = await apiService.post<Meeting>(
        API_CONFIG.ENDPOINTS.MEETINGS.BASE,
        meetingData
      );
      return response;
    } catch (error) {
      console.error('Create meeting error:', error);
      throw error;
    }
  }

  // Update meeting
  async updateMeeting(id: string, meetingData: UpdateMeetingData) {
    try {
      const response = await apiService.put<Meeting>(
        API_CONFIG.ENDPOINTS.MEETINGS.BY_ID(id),
        meetingData
      );
      return response;
    } catch (error) {
      console.error('Update meeting error:', error);
      throw error;
    }
  }

  // Delete meeting
  async deleteMeeting(id: string) {
    try {
      console.log('🗑️ MeetingService: Deleting meeting with ID:', id);
      console.log('🗑️ MeetingService: Endpoint:', API_CONFIG.ENDPOINTS.MEETINGS.BY_ID(id));
      
      const response = await apiService.delete<void>(
        API_CONFIG.ENDPOINTS.MEETINGS.BY_ID(id)
      );
      
      console.log('✅ MeetingService: Delete response:', response);
      return response;
    } catch (error) {
      console.error('❌ MeetingService: Delete meeting error:', error);
      throw error;
    }
  }

  // Update meeting status
  async updateMeetingStatus(id: string, status: Meeting['status']) {
    try {
      const response = await apiService.patch<void>(
        API_CONFIG.ENDPOINTS.MEETINGS.STATUS(id),
        { status }
      );
      return response;
    } catch (error) {
      console.error('Update meeting status error:', error);
      throw error;
    }
  }

  // Join meeting (mark participant as joined)
  async joinMeeting(id: string) {
    try {
      const response = await apiService.post<void>(
        `${API_CONFIG.ENDPOINTS.MEETINGS.BY_ID(id)}/join`
      );
      return response;
    } catch (error) {
      console.error('Join meeting error:', error);
      throw error;
    }
  }

  // Leave meeting (mark participant as left)
  async leaveMeeting(id: string) {
    try {
      const response = await apiService.post<void>(
        `${API_CONFIG.ENDPOINTS.MEETINGS.BY_ID(id)}/leave`
      );
      return response;
    } catch (error) {
      console.error('Leave meeting error:', error);
      throw error;
    }
  }

  // Respond to meeting invitation
  async respondToMeeting(
    id: string, 
    response: 'accepted' | 'declined' | 'tentative',
    note?: string
  ) {
    try {
      const responseData = await apiService.post<void>(
        `${API_CONFIG.ENDPOINTS.MEETINGS.BY_ID(id)}/respond`,
        { response, note }
      );
      return responseData;
    } catch (error) {
      console.error('Respond to meeting error:', error);
      throw error;
    }
  }

  // Get upcoming meetings
  async getUpcomingMeetings(limit: number = 10) {
    try {
      const response = await apiService.get<Meeting[]>(
        `${API_CONFIG.ENDPOINTS.MEETINGS.BASE}/upcoming?limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Get upcoming meetings error:', error);
      throw error;
    }
  }

  // Get meetings by date range
  async getMeetingsByDateRange(startDate: string, endDate: string) {
    try {
      const response = await apiService.get<Meeting[]>(
        `${API_CONFIG.ENDPOINTS.MEETINGS.BASE}/date-range?startDate=${startDate}&endDate=${endDate}`
      );
      return response;
    } catch (error) {
      console.error('Get meetings by date range error:', error);
      throw error;
    }
  }

  // Get meeting statistics
  async getMeetingStats() {
    try {
      const response = await apiService.get<{
        total: number;
        scheduled: number;
        completed: number;
        cancelled: number;
        upcoming: number;
        todaysMeetings: number;
        thisWeeksMeetings: number;
        thisMonthsMeetings: number;
        byType: Record<string, number>;
        byStatus: Record<string, number>;
        byPriority: Record<string, number>;
      }>(API_CONFIG.ENDPOINTS.MEETINGS.STATS);
      return response;
    } catch (error) {
      console.error('Get meeting stats error:', error);
      throw error;
    }
  }

  // Check for meeting conflicts
  async checkConflicts(
    startTime: string,
    endTime: string,
    participantIds: string[],
    excludeMeetingId?: string
  ) {
    try {
      const response = await apiService.post<Meeting[]>(
        `${API_CONFIG.ENDPOINTS.MEETINGS.BASE}/check-conflicts`,
        {
          startTime,
          endTime,
          participantIds,
          excludeMeetingId
        }
      );
      return response;
    } catch (error) {
      console.error('Check meeting conflicts error:', error);
      throw error;
    }
  }

  // Add participants to meeting
  async addParticipants(id: string, participantIds: string[]) {
    try {
      const response = await apiService.post<void>(
        API_CONFIG.ENDPOINTS.MEETINGS.PARTICIPANTS(id),
        { participantIds }
      );
      return response;
    } catch (error) {
      console.error('Add participants error:', error);
      throw error;
    }
  }

  // Remove participants from meeting
  async removeParticipants(id: string, participantIds: string[]) {
    try {
      const response = await apiService.delete<void>(
        `${API_CONFIG.ENDPOINTS.MEETINGS.PARTICIPANTS(id)}?participantIds=${participantIds.join(',')}`
      );
      return response;
    } catch (error) {
      console.error('Remove participants error:', error);
      throw error;
    }
  }

  // Export meetings
  async exportMeetings(format: 'csv' | 'xlsx' | 'pdf' = 'csv', filters?: MeetingFilters) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const filename = `meetings_${new Date().toISOString().split('T')[0]}.${format}`;
      await apiService.downloadFile(
        `${API_CONFIG.ENDPOINTS.MEETINGS.BASE}/export?${queryParams}`,
        filename
      );
    } catch (error) {
      console.error('Export meetings error:', error);
      throw error;
    }
  }
}

export const meetingService = new MeetingService();
export default meetingService;
































