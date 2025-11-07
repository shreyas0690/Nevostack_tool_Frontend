import React, { useState, useEffect } from 'react';
import { NotificationBell } from './NotificationBell';
import { NotificationToastContainer } from './NotificationToast';
import { useNotifications } from '@/contexts/NotificationContext';
import { notificationService } from '@/services/notificationService';

interface NotificationManagerProps {
  showBell?: boolean;
  showToasts?: boolean;
  maxToasts?: number;
  toastPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

export function NotificationManager({ 
  showBell = true,
  showToasts = true,
  maxToasts = 3,
  toastPosition = 'top-right',
  className
}: NotificationManagerProps) {
  const { notifications, markAsRead, deleteNotification } = useNotifications();
  const [toastNotifications, setToastNotifications] = useState<string[]>([]);

  // Show new notifications as toasts
  useEffect(() => {
    const newNotifications = notifications.filter(
      notification => !notification.isRead && !toastNotifications.includes(notification.id)
    );

    if (newNotifications.length > 0) {
      const newToastIds = newNotifications.slice(0, maxToasts).map(n => n.id);
      setToastNotifications(prev => [...prev, ...newToastIds]);
    }
  }, [notifications, toastNotifications, maxToasts]);

  const handleToastClose = (notificationId: string) => {
    setToastNotifications(prev => prev.filter(id => id !== notificationId));
  };

  const handleToastAction = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    try {
      await notificationService.trackClick(notification.id);
    } catch (error) {
      console.error('Failed to track notification click:', error);
    }
  };

  const toastNotificationsData = notifications.filter(notification => 
    toastNotifications.includes(notification.id)
  );

  return (
    <div className={className}>
      {showBell && <NotificationBell />}
      
      {showToasts && (
        <NotificationToastContainer
          notifications={toastNotificationsData}
          onClose={handleToastClose}
          onAction={handleToastAction}
          maxToasts={maxToasts}
          position={toastPosition}
        />
      )}
    </div>
  );
}




