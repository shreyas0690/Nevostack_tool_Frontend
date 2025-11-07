import { useCallback } from 'react';
import { notificationService, type CreateNotificationRequest } from '@/services/notificationService';
import { useNotifications } from '@/contexts/NotificationContext';

export function useNotification() {
  const { addNotification } = useNotifications();

  const createNotification = useCallback(async (notification: CreateNotificationRequest) => {
    try {
      const newNotification = await notificationService.createNotification(notification);
      addNotification(newNotification);
      return newNotification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }, [addNotification]);

  const createTaskNotification = useCallback(async (
    recipientId: string,
    taskTitle: string,
    type: 'task_assigned' | 'task_updated' | 'task_completed' | 'task_overdue',
    taskId?: string
  ) => {
    try {
      const notification = await notificationService.createTaskNotification(
        recipientId,
        taskTitle,
        type,
        taskId
      );
      addNotification(notification);
      return notification;
    } catch (error) {
      console.error('Failed to create task notification:', error);
      throw error;
    }
  }, [addNotification]);

  const createMeetingNotification = useCallback(async (
    recipientId: string,
    meetingTitle: string,
    type: 'meeting_scheduled' | 'meeting_reminder' | 'meeting_cancelled',
    meetingId?: string
  ) => {
    try {
      const notification = await notificationService.createMeetingNotification(
        recipientId,
        meetingTitle,
        type,
        meetingId
      );
      addNotification(notification);
      return notification;
    } catch (error) {
      console.error('Failed to create meeting notification:', error);
      throw error;
    }
  }, [addNotification]);

  const createLeaveNotification = useCallback(async (
    recipientId: string,
    leaveType: string,
    type: 'leave_request' | 'leave_approved' | 'leave_rejected',
    leaveId?: string
  ) => {
    try {
      const notification = await notificationService.createLeaveNotification(
        recipientId,
        leaveType,
        type,
        leaveId
      );
      addNotification(notification);
      return notification;
    } catch (error) {
      console.error('Failed to create leave notification:', error);
      throw error;
    }
  }, [addNotification]);

  const createSystemNotification = useCallback(async (
    recipientId: string,
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ) => {
    try {
      const notification = await notificationService.createSystemNotification(
        recipientId,
        title,
        message,
        priority
      );
      addNotification(notification);
      return notification;
    } catch (error) {
      console.error('Failed to create system notification:', error);
      throw error;
    }
  }, [addNotification]);

  const createAnnouncement = useCallback(async (
    recipientIds: string[],
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ) => {
    try {
      const result = await notificationService.createAnnouncement(
        recipientIds,
        title,
        message,
        priority
      );
      
      // Refresh notifications to show the new announcements
      // Note: In a real app, you might want to emit these via WebSocket
      // or add them to the context directly
      return result;
    } catch (error) {
      console.error('Failed to create announcement:', error);
      throw error;
    }
  }, []);

  return {
    createNotification,
    createTaskNotification,
    createMeetingNotification,
    createLeaveNotification,
    createSystemNotification,
    createAnnouncement
  };
}




