import { apiClient } from './apiClient';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  timeAgo: string;
  sender?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  actionUrl?: string;
  actionText?: string;
  data?: any;
}

export type NotificationType = 
  | 'task_assigned' | 'task_updated' | 'task_completed' | 'task_overdue'
  | 'meeting_scheduled' | 'meeting_reminder' | 'meeting_cancelled'
  | 'leave_request' | 'leave_approved' | 'leave_rejected'
  | 'attendance_reminder' | 'system_notification' | 'announcement'
  | 'birthday_reminder' | 'work_anniversary' | 'holiday_reminder'
  | 'policy_update' | 'other';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface NotificationFilters {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  startDate?: string;
  endDate?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  unreadCount: number;
}

export interface CreateNotificationRequest {
  recipient: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  actionUrl?: string;
  actionText?: string;
  channels?: {
    inApp?: { enabled: boolean };
    email?: { enabled: boolean };
    push?: { enabled: boolean };
    sms?: { enabled: boolean };
  };
  data?: any;
  expiresAt?: string;
}

export interface BulkNotificationRequest {
  notifications: CreateNotificationRequest[];
}

class NotificationService {
  private baseUrl = '/api/notifications';

  async getNotifications(filters: NotificationFilters = {}): Promise<NotificationResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.unreadOnly) params.append('unreadOnly', 'true');
    if (filters.type) params.append('type', filters.type);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`${this.baseUrl}?${params.toString()}`);
    return response.data.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get(`${this.baseUrl}/unread-count`);
    return response.data.data.unreadCount;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(`${this.baseUrl}/${notificationId}/read`);
  }

  async markAllAsRead(): Promise<{ modifiedCount: number }> {
    const response = await apiClient.patch(`${this.baseUrl}/read-all`);
    return response.data.data;
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${notificationId}`);
  }

  async trackClick(notificationId: string, deviceInfo?: any): Promise<void> {
    await apiClient.patch(`${this.baseUrl}/${notificationId}/click`, {
      deviceInfo: deviceInfo || {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        browser: this.getBrowserName()
      }
    });
  }

  async createNotification(notification: CreateNotificationRequest): Promise<Notification> {
    const response = await apiClient.post(this.baseUrl, notification);
    return response.data.data;
  }

  async createBulkNotifications(notifications: BulkNotificationRequest): Promise<{
    count: number;
    batchId: string;
  }> {
    const response = await apiClient.post(`${this.baseUrl}/bulk`, notifications);
    return response.data.data;
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  // Helper methods for creating specific notification types
  async createTaskNotification(
    recipientId: string,
    taskTitle: string,
    type: 'task_assigned' | 'task_updated' | 'task_completed' | 'task_overdue',
    taskId?: string
  ): Promise<Notification> {
    const messages = {
      task_assigned: `You have been assigned a new task: ${taskTitle}`,
      task_updated: `Task "${taskTitle}" has been updated`,
      task_completed: `Task "${taskTitle}" has been completed`,
      task_overdue: `Task "${taskTitle}" is overdue`
    };

    return this.createNotification({
      recipient: recipientId,
      title: messages[type],
      message: messages[type],
      type,
      priority: type === 'task_overdue' ? 'high' : 'medium',
      actionUrl: taskId ? `/tasks/${taskId}` : '/tasks',
      actionText: 'View Task',
      data: { taskId, taskTitle }
    });
  }

  async createMeetingNotification(
    recipientId: string,
    meetingTitle: string,
    type: 'meeting_scheduled' | 'meeting_reminder' | 'meeting_cancelled',
    meetingId?: string
  ): Promise<Notification> {
    const messages = {
      meeting_scheduled: `New meeting scheduled: ${meetingTitle}`,
      meeting_reminder: `Reminder: Meeting "${meetingTitle}" is coming up`,
      meeting_cancelled: `Meeting "${meetingTitle}" has been cancelled`
    };

    return this.createNotification({
      recipient: recipientId,
      title: messages[type],
      message: messages[type],
      type,
      priority: type === 'meeting_reminder' ? 'high' : 'medium',
      actionUrl: meetingId ? `/meetings/${meetingId}` : '/meetings',
      actionText: 'View Meeting',
      data: { meetingId, meetingTitle }
    });
  }

  async createLeaveNotification(
    recipientId: string,
    leaveType: string,
    type: 'leave_request' | 'leave_approved' | 'leave_rejected',
    leaveId?: string
  ): Promise<Notification> {
    const messages = {
      leave_request: `New leave request for ${leaveType} leave`,
      leave_approved: `Your ${leaveType} leave request has been approved`,
      leave_rejected: `Your ${leaveType} leave request has been rejected`
    };

    return this.createNotification({
      recipient: recipientId,
      title: messages[type],
      message: messages[type],
      type,
      priority: type === 'leave_rejected' ? 'high' : 'medium',
      actionUrl: leaveId ? `/leaves/${leaveId}` : '/leaves',
      actionText: 'View Leave',
      data: { leaveId, leaveType }
    });
  }

  async createSystemNotification(
    recipientId: string,
    title: string,
    message: string,
    priority: NotificationPriority = 'medium'
  ): Promise<Notification> {
    return this.createNotification({
      recipient: recipientId,
      title,
      message,
      type: 'system_notification',
      priority
    });
  }

  async createAnnouncement(
    recipientIds: string[],
    title: string,
    message: string,
    priority: NotificationPriority = 'medium'
  ): Promise<{ count: number; batchId: string }> {
    const notifications = recipientIds.map(recipientId => ({
      recipient: recipientId,
      title,
      message,
      type: 'announcement' as NotificationType,
      priority
    }));

    return this.createBulkNotifications({ notifications });
  }
}

export const notificationService = new NotificationService();




