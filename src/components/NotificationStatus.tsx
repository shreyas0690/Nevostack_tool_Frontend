import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '@/config/api';

const API_BASE = API_CONFIG.BASE_URL;

function NotificationStatus() {
  const [status, setStatus] = useState({
    token: false,
    apiConnected: false,
    unreadCount: 0,
    lastCheck: null,
    error: ''
  });

  const checkStatus = async () => {
    const newStatus = {
      token: !!localStorage.getItem('accessToken'),
      apiConnected: false,
      unreadCount: 0,
      lastCheck: new Date().toLocaleTimeString(),
      error: ''
    };

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        newStatus.error = 'No authentication token';
        setStatus(newStatus);
        return;
      }

      const response = await fetch(`${API_BASE}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          newStatus.apiConnected = true;
          newStatus.unreadCount = result.data.unreadCount;
        } else {
          newStatus.error = result.message || 'API Error';
        }
      } else {
        newStatus.error = `HTTP ${response.status}`;
      }
    } catch (error: any) {
      newStatus.error = error.message;
    }

    setStatus(newStatus);
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-3 shadow-lg text-xs max-w-xs">
      <div className="font-semibold mb-2">🔔 Notification Status</div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={status.apiConnected ? 'text-green-600' : 'text-red-600'}>
            {status.apiConnected ? '✅ Connected' : '❌ Disconnected'}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Unread:</span>
          <span className="font-semibold">{status.unreadCount}</span>
        </div>

        <div className="flex justify-between">
          <span>Last Check:</span>
          <span>{status.lastCheck}</span>
        </div>

        {status.error && (
          <div className="text-red-600 text-xs mt-1">
            {status.error}
          </div>
        )}
      </div>

      <button
        onClick={checkStatus}
        className="w-full mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
      >
        Refresh
      </button>
    </div>
  );
}

export default NotificationStatus;
