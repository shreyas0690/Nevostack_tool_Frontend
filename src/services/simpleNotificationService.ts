import { apiClient } from './apiClient';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    firstName: string;
    lastName: string;
  };
}

export interface NotificationResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    unreadCount: number;
  };
}

class SimpleNotificationService {
  private baseUrl = '/api/notifications';

  async getNotifications(): Promise<NotificationResponse> {
    try {
      const response = await apiClient.get(this.baseUrl);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiClient.patch(`${this.baseUrl}/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.patch(`${this.baseUrl}/read-all`);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  async createTestNotification(): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/test`);
      return response.data;
    } catch (error) {
      console.error('Failed to create test notification:', error);
      throw error;
    }
  }
}

export const simpleNotificationService = new SimpleNotificationService();




