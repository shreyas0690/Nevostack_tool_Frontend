import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function SimpleNotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([] as any[]);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUnreadCount(result.data.unreadCount);
        }
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const fetchUnreadNotifications = async (isBackground = false) => {
    try {
      if (!isBackground && notifications.length === 0) {
        setLoading(true);
      }
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return;
      }

      const response = await fetch('http://localhost:5000/api/notifications?unreadOnly=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNotifications(result.data.notifications || []);
        }
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Initial fetch of notifications to populate the list if there are unread ones
    fetchUnreadNotifications(true);

    const interval = setInterval(fetchUnreadCount, 30000); // Reduced frequency since we have WS

    // Listen for WebSocket notifications
    const handleNotification = (event: any) => {
      const notification = event.detail;
      console.log('🔔 Bell received notification:', notification);

      // Update unread count
      setUnreadCount(prev => prev + 1);

      // Add to list immediately
      setNotifications(prev => [notification, ...prev]);
    };

    window.addEventListener('websocket-notification', handleNotification as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener('websocket-notification', handleNotification as EventListener);
    };
  }, []);

  const handleBellClick = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    if (newIsOpen) {
      // Only fetch if we don't have data or want to ensure sync
      // But since we have WS, we can trust local state mostly. 
      // We'll do a background refresh just in case.
      fetchUnreadNotifications(true);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Update local state
      setNotifications(prev =>
        prev.filter((n: any) => (n._id || n.id) !== notificationId) // Remove from unread list
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Refresh the unread notifications list
      fetchUnreadNotifications();
    } catch (error) {
      // Handle error silently
    }
  };


  return (
    <div className="relative">
      <button
        onClick={handleBellClick}
        className={`relative p-2 focus:outline-none transition-all duration-200 rounded-full
          ${unreadCount > 0
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5" />
        ) : (
          <Bell className="h-5 w-5" />
        )}

        {unreadCount > 0 && (
          <span
            className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 
              flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-950"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-96 rounded-xl shadow-2xl border backdrop-blur-xl z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200
            bg-white/95 dark:bg-gray-900/95 border-gray-200 dark:border-gray-800"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => notifications.forEach(n => markAsRead(n._id || n.id))}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400 mb-3"></div>
                <p className="text-sm">Loading updates...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
                  <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                </div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">No notifications</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[180px]">
                  You're all caught up! Check back later for updates.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification._id || notification.id}
                    onClick={() => markAsRead(notification._id || notification.id)}
                    className={`group relative p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50
                      ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 
                        ${!notification.isRead ? 'bg-blue-500 dark:bg-blue-400' : 'bg-transparent'}`}
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm leading-none ${!notification.isRead ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                            {notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : 'Just now'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-xl">
            <button className="w-full py-2 text-xs font-medium text-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SimpleNotificationBell;
