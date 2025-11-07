import React, { useEffect, useState } from 'react';
import apiService from '../services/api';
import authService from '../services/auth';

// Example component showing how to use automatic token refresh
const AutomaticTokenRefreshExample: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize authentication on component mount
    const initializeAuth = async () => {
      try {
        const isAuthenticated = await authService.initializeAuth();
        if (isAuthenticated) {
          setUser(authService.getCurrentUser());
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      }
    };

    initializeAuth();

    // Listen for auth events
    const handleAuthFailed = (event: CustomEvent) => {
      console.log('Auth failed:', event.detail);
      setUser(null);
      setError(event.detail.message);
    };

    const handleAuthLogout = () => {
      console.log('User logged out');
      setUser(null);
      setError(null);
    };

    window.addEventListener('auth:failed', handleAuthFailed as EventListener);
    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:failed', handleAuthFailed as EventListener);
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  // Example: Make API calls that will automatically refresh tokens
  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // This API call will automatically handle token refresh if needed
      const profile = await apiService.get('/api/auth/profile');
      setUser(profile.user);
      console.log('✅ Profile fetched successfully');
    } catch (error: any) {
      setError(error.message);
      console.error('❌ Profile fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // This API call will also automatically handle token refresh
      const tasks = await apiService.get('/api/members/tasks');
      console.log('✅ Tasks fetched successfully:', tasks);
    } catch (error: any) {
      setError(error.message);
      console.error('❌ Tasks fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // File upload with progress tracking
      const result = await apiService.upload('/api/files/upload', formData, (progress) => {
        console.log(`Upload progress: ${progress}%`);
      });
      
      console.log('✅ File uploaded successfully:', result);
    } catch (error: any) {
      setError(error.message);
      console.error('❌ File upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setError(null);
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (!user) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
        <p className="text-gray-600 mb-4">
          Please login to test automatic token refresh functionality.
        </p>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Automatic Token Refresh Demo</h2>
      
      {/* User Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Current User</h3>
        <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Company ID:</strong> {user.companyId}</p>
        <p><strong>Authenticated:</strong> {authService.isAuthenticated() ? '✅ Yes' : '❌ No'}</p>
      </div>

      {/* API Test Buttons */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Test API Calls (Auto Token Refresh)</h3>
        <div className="space-y-2">
          <button
            onClick={fetchUserProfile}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
          >
            {loading ? 'Loading...' : 'Fetch User Profile'}
          </button>
          
          <button
            onClick={fetchUserTasks}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
          >
            {loading ? 'Loading...' : 'Fetch User Tasks'}
          </button>
          
          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) uploadFile(file);
              };
              input.click();
            }}
            disabled={loading}
            className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
          >
            {loading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
      >
        Logout
      </button>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold mb-2">How Automatic Token Refresh Works:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Access tokens expire after 15 minutes</li>
          <li>• When an API call fails with 401 (Unauthorized), the system automatically tries to refresh the token</li>
          <li>• If refresh is successful, the original API call is retried with the new token</li>
          <li>• If refresh fails, the user is redirected to login</li>
          <li>• All of this happens transparently without user intervention</li>
        </ul>
      </div>
    </div>
  );
};

export default AutomaticTokenRefreshExample;
