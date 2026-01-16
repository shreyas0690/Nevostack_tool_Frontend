import React, { useEffect } from 'react';
import { NotificationManager } from './NotificationManager';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/hooks/useAuth'; // Assuming you have an auth hook

interface NotificationSystemProps {
  showBell?: boolean;
  showToasts?: boolean;
  maxToasts?: number;
  toastPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  enableWebSocket?: boolean;
  className?: string;
}

export function NotificationSystem({
  showBell = true,
  showToasts = true,
  maxToasts = 3,
  toastPosition = 'top-right',
  enableWebSocket = true,
  className
}: NotificationSystemProps) {
  const { user, token } = useAuth(); // Get user and token from auth context

  const websocketConfig = {
    url: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    token: token || '',
    userId: user?.id || '',
    companyId: user?.companyId || '',
    autoConnect: enableWebSocket
  };

  const {
    isConnected,
    connectionState,
    emitNotificationRead,
    emitNotificationClick,
    joinCompanyRoom,
    joinDepartmentRoom,
    joinUserRoom
  } = useWebSocket(websocketConfig);

  // Join relevant rooms when connected
  useEffect(() => {
    if (isConnected && user) {
      // Join user-specific room
      joinUserRoom(user.id);

      // Join company room
      if (user.companyId) {
        joinCompanyRoom(user.companyId);
      }

      // Join department room if user has a department
      if (user.departmentId) {
        joinDepartmentRoom(user.departmentId);
      }
    }
  }, [isConnected, user, joinUserRoom, joinCompanyRoom, joinDepartmentRoom]);

  // Handle notification interactions
  const handleNotificationRead = (notificationId: string) => {
    emitNotificationRead(notificationId);
  };

  const handleNotificationClick = (notificationId: string, deviceInfo?: any) => {
    emitNotificationClick(notificationId, deviceInfo);
  };

  return (
    <div className={className}>
      <NotificationManager
        showBell={showBell}
        showToasts={showToasts}
        maxToasts={maxToasts}
        toastPosition={toastPosition}
      />

      {/* WebSocket connection status indicator (optional) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className={`
            px-2 py-1 rounded text-xs font-mono
            ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
          `}>
            WS: {connectionState}
          </div>
        </div>
      )}
    </div>
  );
}




