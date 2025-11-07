import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useUserTheme } from '@/hooks/useUserTheme';

function SimpleNotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { resolvedTheme } = useUserTheme();

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

  const fetchUnreadNotifications = async () => {
    try {
      setLoading(true);
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
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleBellClick = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen) {
      fetchUnreadNotifications();
    }
  };

  const markAsRead = async (notificationId) => {
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
        prev.filter(n => n._id !== notificationId) // Remove from unread list
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
        className={`relative p-2 focus:outline-none transition-colors duration-200 ${
          resolvedTheme === 'dark' 
            ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
        }`}
        style={{ 
          backgroundColor: unreadCount > 0 
            ? (resolvedTheme === 'dark' ? '#451a03' : '#fef3c7') 
            : 'transparent',
          border: unreadCount > 0 
            ? `2px solid ${resolvedTheme === 'dark' ? '#f59e0b' : '#f59e0b'}` 
            : 'none',
          borderRadius: '6px'
        }}
      >
        {unreadCount > 0 ? (
          <BellRing className={`h-5 w-5 ${resolvedTheme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
        ) : (
          <Bell className={`h-5 w-5 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} />
        )}
        
        {unreadCount > 0 && (
          <span 
            className={`absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold ${
              resolvedTheme === 'dark' ? 'bg-red-500' : 'bg-red-600'
            }`}
            style={{ 
              fontSize: '11px',
              fontWeight: 'bold',
              zIndex: 1000
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className={`absolute right-0 mt-2 w-80 rounded-lg shadow-xl border backdrop-blur-sm ${
            resolvedTheme === 'dark' 
              ? 'bg-gray-900/95 border-gray-700 shadow-gray-900/50' 
              : 'bg-white/95 border-gray-200 shadow-gray-900/25'
          }`}
          style={{ zIndex: 1000 }}
        >
          <div className={`p-4 border-b ${resolvedTheme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
            <div className="flex justify-between items-center">
              <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Notifications ({unreadCount} unread)
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className={`text-xl transition-colors duration-200 ${
                  resolvedTheme === 'dark' 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded p-1' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded p-1'
                }`}
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className={`p-6 text-center ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="flex items-center justify-center mb-2">
                  <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${resolvedTheme === 'dark' ? 'border-blue-400' : 'border-blue-500'}`}></div>
                </div>
                <div className="text-sm">Loading notifications...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className={`p-6 text-center ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <Bell className={`h-6 w-6 ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <div className="text-sm font-medium">No unread notifications</div>
                <div className="text-xs mt-1">You're all caught up!</div>
              </div>
            ) : (
              <div className={`divide-y ${resolvedTheme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification._id || notification.id}
                      className={`p-4 cursor-pointer transition-all duration-200 ${
                        resolvedTheme === 'dark' 
                          ? `hover:bg-gray-700/80 ${!notification.isRead ? 'bg-blue-900/20 border-l-4 border-l-blue-400 shadow-sm' : 'bg-gray-800/50'}`
                          : `hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm' : 'bg-white'}`
                      }`}
                      onClick={() => markAsRead(notification._id || notification.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.isRead ? 'font-semibold' : ''
                          } ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {notification.title || 'No Title'}
                          </h4>
                          <p className={`text-sm mt-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {notification.message || 'No Message'}
                          </p>
                          <p className={`text-xs mt-1 ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'No Date'}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className={`w-2 h-2 rounded-full ml-2 mt-1 ${
                            resolvedTheme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'
                          }`}></div>
                        )}
                      </div>
                    </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}

export default SimpleNotificationBell;