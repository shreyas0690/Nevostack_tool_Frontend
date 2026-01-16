import React, { useState, useEffect } from 'react';

interface Notification {
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

function NotificationTest() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const testNotification = async () => {
    try {
      setLoading(true);
      setMessage('Creating test notification...');

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setMessage('❌ No authentication token found. Please login first.');
        return;
      }

      console.log('🔔 Creating test notification...');

      const response = await fetch(`${API_BASE}/api/notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      console.log('📋 Test notification result:', result);

      if (result.success) {
        setMessage('✅ Test notification created successfully!');
        // Refresh notifications
        fetchNotifications();
      } else {
        setMessage(`❌ Test notification failed: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Test notification error:', error);
      setMessage(`❌ Test notification failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setMessage('❌ No authentication token found. Please login first.');
        return;
      }

      console.log('📥 Fetching notifications...');

      const response = await fetch(`${API_BASE}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      console.log('📋 Notifications response:', result);

      if (result.success) {
        setNotifications(result.data.notifications);
        setMessage(`✅ Found ${result.data.notifications.length} notifications`);
      } else {
        setMessage(`❌ Failed to fetch notifications: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Fetch notifications error:', error);
      setMessage(`❌ Failed to fetch notifications: ${error.message}`);
    }
  };

  const createTaskWithNotification = async () => {
    try {
      setLoading(true);
      setMessage('Creating task with notification...');

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setMessage('❌ No authentication token found. Please login first.');
        return;
      }

      // First, get a user to assign the task to
      const usersResponse = await fetch(`${API_BASE}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const usersResult = await usersResponse.json();
      if (!usersResult.success || !usersResult.data || usersResult.data.length === 0) {
        setMessage('❌ No users found to assign task to');
        return;
      }

      const assignee = usersResult.data[0]; // Use first user as assignee
      console.log('👤 Assigning task to:', assignee.name);

      const taskData = {
        title: 'Test Task with Notification',
        description: 'This is a test task to check notification system',
        assignedTo: assignee._id,
        priority: 'medium',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      };

      console.log('📝 Creating task:', taskData);

      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      const result = await response.json();
      console.log('📋 Task creation result:', result);

      if (result.success) {
        setMessage('✅ Task created successfully! Notification should be sent to assignee.');
        // Refresh notifications
        fetchNotifications();
      } else {
        setMessage(`❌ Task creation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Task creation error:', error);
      setMessage(`❌ Task creation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔔 Notification System Test</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Test Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Make sure backend server is running on port 5000</li>
          <li>Make sure you are logged in (check localStorage for token)</li>
          <li>Click "Test Notification" to create a direct notification</li>
          <li>Click "Create Task with Notification" to test task assignment notification</li>
          <li>Check the notifications list below</li>
          <li>Check your database for notifications collection</li>
        </ol>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={testNotification}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : '🔔 Test Notification'}
        </button>

        <button
          onClick={createTaskWithNotification}
          disabled={loading}
          className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : '📝 Create Task with Notification'}
        </button>

        <button
          onClick={fetchNotifications}
          className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600"
        >
          🔄 Refresh Notifications
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.includes('✅') ? 'bg-green-50 border border-green-200 text-green-800' :
            message.includes('❌') ? 'bg-red-50 border border-red-200 text-red-800' :
              'bg-yellow-50 border border-yellow-200 text-yellow-800'
          }`}>
          {message}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">
          📋 Notifications ({notifications.length})
        </h3>

        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔔</div>
            <p>No notifications found</p>
            <p className="text-sm">Try creating a test notification above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map(notification => (
              <div key={notification._id} className={`border rounded-lg p-4 ${notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                }`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-lg">{notification.title}</h4>
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

                <p className="text-gray-700 mb-2">{notification.message}</p>

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Type: {notification.type}</span>
                  <span>{new Date(notification.createdAt).toLocaleString()}</span>
                </div>

                {notification.sender && (
                  <div className="text-sm text-gray-500 mt-1">
                    From: {notification.sender.firstName} {notification.sender.lastName}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold mb-2">🔍 Debug Information:</h4>
        <div className="text-sm space-y-1">
          <p><strong>Token:</strong> {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}</p>
          <p><strong>Backend URL:</strong> {API_BASE}</p>
          <p><strong>API Endpoints:</strong></p>
          <ul className="list-disc list-inside ml-4">
            <li>POST /api/notifications/test</li>
            <li>GET /api/notifications</li>
            <li>POST /api/tasks</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default NotificationTest;
