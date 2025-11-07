import { useEffect, useState, useCallback } from 'react';
import { websocketService } from '@/services/websocketService';
import { type Notification } from '@/services/notificationService';
import { useNotifications } from '@/contexts/NotificationContext';

interface UseWebSocketConfig {
  url: string;
  token: string;
  userId: string;
  companyId: string;
  autoConnect?: boolean;
}

export function useWebSocket(config: UseWebSocketConfig) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const { addNotification, markAsRead, deleteNotification } = useNotifications();

  const connect = useCallback(async () => {
    try {
      await websocketService.connect(config);
      setIsConnected(true);
      setConnectionState('connected');
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setIsConnected(false);
      setConnectionState('disconnected');
    }
  }, [config]);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
    setIsConnected(false);
    setConnectionState('disconnected');
  }, []);

  const emitNotificationRead = useCallback((notificationId: string) => {
    websocketService.emitNotificationRead(notificationId);
  }, []);

  const emitNotificationClick = useCallback((notificationId: string, deviceInfo?: any) => {
    websocketService.emitNotificationClick(notificationId, deviceInfo);
  }, []);

  const joinRoom = useCallback((room: string) => {
    websocketService.joinRoom(room);
  }, []);

  const leaveRoom = useCallback((room: string) => {
    websocketService.leaveRoom(room);
  }, []);

  const joinCompanyRoom = useCallback((companyId: string) => {
    websocketService.joinCompanyRoom(companyId);
  }, []);

  const leaveCompanyRoom = useCallback((companyId: string) => {
    websocketService.leaveCompanyRoom(companyId);
  }, []);

  const joinDepartmentRoom = useCallback((departmentId: string) => {
    websocketService.joinDepartmentRoom(departmentId);
  }, []);

  const leaveDepartmentRoom = useCallback((departmentId: string) => {
    websocketService.leaveDepartmentRoom(departmentId);
  }, []);

  const joinUserRoom = useCallback((userId: string) => {
    websocketService.joinUserRoom(userId);
  }, []);

  const leaveUserRoom = useCallback((userId: string) => {
    websocketService.leaveUserRoom(userId);
  }, []);

  useEffect(() => {
    if (config.autoConnect !== false) {
      connect();
    }

    // Set up event listeners
    const handleNotification = (notification: Notification) => {
      addNotification(notification);
    };

    const handleNotificationUpdate = (notification: Notification) => {
      // Update notification in context if needed
      console.log('Notification updated:', notification);
    };

    const handleNotificationDelete = (notificationId: string) => {
      deleteNotification(notificationId);
    };

    websocketService.onNotification(handleNotification);
    websocketService.onNotificationUpdate(handleNotificationUpdate);
    websocketService.onNotificationDelete(handleNotificationDelete);

    // Join user and company rooms
    if (isConnected) {
      joinUserRoom(config.userId);
      joinCompanyRoom(config.companyId);
    }

    return () => {
      websocketService.offNotification(handleNotification);
      websocketService.offNotificationUpdate(handleNotificationUpdate);
      websocketService.offNotificationDelete(handleNotificationDelete);
      
      if (isConnected) {
        leaveUserRoom(config.userId);
        leaveCompanyRoom(config.companyId);
      }
      
      disconnect();
    };
  }, [config, isConnected, connect, disconnect, addNotification, deleteNotification, joinUserRoom, leaveUserRoom, joinCompanyRoom, leaveCompanyRoom]);

  return {
    isConnected,
    connectionState,
    connect,
    disconnect,
    emitNotificationRead,
    emitNotificationClick,
    joinRoom,
    leaveRoom,
    joinCompanyRoom,
    leaveCompanyRoom,
    joinDepartmentRoom,
    leaveDepartmentRoom,
    joinUserRoom,
    leaveUserRoom
  };
}




