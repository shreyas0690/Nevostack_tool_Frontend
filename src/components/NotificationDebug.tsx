import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '@/config/api';

const API_BASE = API_CONFIG.BASE_URL;

function NotificationDebug() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('❌ No authentication token found');
        return;
      }

      console.log('🔔 Debug: Fetching notifications...');

      const response = await fetch(`${API_BASE}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('📡 Debug: Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📋 Debug: Full response:', result);

      if (result.success) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
        setError('');
        console.log('✅ Debug: Notifications loaded successfully');
      } else {
        setError(`❌ API Error: ${result.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('❌ Debug: Fetch error:', err);
      setError(`❌ Network Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testNotification = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('❌ No authentication token found');
        return;
      }

      console.log('🔔 Debug: Creating test notification...');

      const response = await fetch(`${API_BASE}/api/notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Debug: Test response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📋 Debug: Test response:', result);

      if (result.success) {
        setError('✅ Test notification created successfully!');
        // Refresh notifications
        setTimeout(() => fetchNotifications(), 1000);
      } else {
        setError(`❌ Test failed: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ Debug: Test error:', err);
      setError(`❌ Test Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔍 Notification Debug Panel</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={fetchNotifications}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : '🔄 Refresh Notifications'}
        </button>

        <button
          onClick={testNotification}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {loading ? 'Creating...' : '🔔 Create Test Notification'}
        </button>
      </div>

      {error && (
        <div className={`p-4 rounded-lg mb-4 ${error.includes('✅') ? 'bg-green-50 border border-green-200 text-green-800' :
          'bg-red-50 border border-red-200 text-red-800'
          }`}>
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold mb-2">📊 Status</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Total Notifications:</strong> {notifications.length}
          </div>
          <div>
            <strong>Unread Count:</strong> {unreadCount}
          </div>
          <div>
            <strong>Token:</strong> {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}
          </div>
          <div>
            <strong>Loading:</strong> {loading ? '⏳ Yes' : '✅ No'}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">📋 Notifications ({notifications.length})</h3>

        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔔</div>
            <p>No notifications found</p>
            <p className="text-sm">Try creating a test notification</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <div key={notification._id || index} className={`border rounded-lg p-3 ${notification.isRead ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                }`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{notification.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        notification.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {notification.priority}
                    </span>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 text-sm mb-2">{notification.message}</p>

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Type: {notification.type}</span>
                  <span>{new Date(notification.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold mb-2">🔍 Debug Information:</h4>
        <div className="text-sm space-y-1">
          <p><strong>API URL:</strong> {API_BASE}/api/notifications</p>
          <p><strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
          <p><strong>Last Fetch:</strong> {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

export default NotificationDebug;
