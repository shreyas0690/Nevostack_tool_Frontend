import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, RefreshCw, Shield, User, Key } from 'lucide-react';
import { saasAuthService } from '@/services/saasAuthService';
import { debugSaaSAuth, clearSaaSAuth, clearAllAuth } from '@/utils/saasAuthDebug';

export default function SaaSAuthTest() {
  const [authStatus, setAuthStatus] = useState({
    isAuthenticated: false,
    user: null,
    token: null,
    device: null,
    error: null
  });
  const [loading, setLoading] = useState(false);

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      console.log('🔍 Checking SaaS authentication status...');
      
      // Check using saasAuthService
      const isAuthenticated = saasAuthService.isSaaSAuthenticated();
      const user = saasAuthService.getSaaSUser();
      const device = saasAuthService.getSaaSDevice();
      const token = saasAuthService.getAccessToken();
      
      console.log('SaaS Auth Status:', { isAuthenticated, user, device, token });
      
      setAuthStatus({
        isAuthenticated,
        user,
        token,
        device,
        error: null
      });
      
      // Also run debug function
      debugSaaSAuth();
      
    } catch (error) {
      console.error('❌ Error checking SaaS auth:', error);
      setAuthStatus(prev => ({
        ...prev,
        error: error.message
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleClearAuth = () => {
    clearSaaSAuth();
    setAuthStatus({
      isAuthenticated: false,
      user: null,
      token: null,
      device: null,
      error: null
    });
    console.log('🗑️ SaaS auth cleared');
  };

  const handleClearAllAuth = () => {
    clearAllAuth();
    setAuthStatus({
      isAuthenticated: false,
      user: null,
      token: null,
      device: null,
      error: null
    });
    console.log('🗑️ All auth cleared');
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">SaaS Authentication Test</h1>
        <p className="text-muted-foreground">
          Debug and test SaaS super admin authentication
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            <Badge variant={authStatus.isAuthenticated ? "default" : "destructive"}>
              {authStatus.isAuthenticated ? (
                <><CheckCircle className="h-4 w-4 mr-1" /> Authenticated</>
              ) : (
                <><XCircle className="h-4 w-4 mr-1" /> Not Authenticated</>
              )}
            </Badge>
          </div>

          {authStatus.user && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">User:</span>
              </div>
              <div className="ml-6 space-y-1 text-sm">
                <div><strong>Name:</strong> {authStatus.user.name}</div>
                <div><strong>Email:</strong> {authStatus.user.email}</div>
                <div><strong>Role:</strong> {authStatus.user.role}</div>
                <div><strong>ID:</strong> {authStatus.user.id}</div>
              </div>
            </div>
          )}

          {authStatus.token && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span className="font-medium">Token:</span>
              </div>
              <div className="ml-6 text-sm font-mono bg-gray-100 p-2 rounded">
                {authStatus.token.substring(0, 50)}...
              </div>
            </div>
          )}

          {authStatus.device && (
            <div className="space-y-2">
              <div className="font-medium">Device Info:</div>
              <div className="ml-4 text-sm space-y-1">
                <div><strong>Device ID:</strong> {authStatus.device.deviceId}</div>
                <div><strong>Device Name:</strong> {authStatus.device.deviceName}</div>
                <div><strong>Browser:</strong> {authStatus.device.browser}</div>
                <div><strong>OS:</strong> {authStatus.device.os}</div>
              </div>
            </div>
          )}

          {authStatus.error && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Error:</strong> {authStatus.error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={checkAuthStatus} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleClearAuth}
              className="flex items-center gap-2"
            >
              Clear SaaS Auth
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={handleClearAllAuth}
              className="flex items-center gap-2"
            >
              Clear All Auth
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p><strong>Debug Commands:</strong></p>
            <p>Open browser console and run:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code>debugSaaSAuth()</code> - Show all auth data</li>
              <li><code>clearSaaSAuth()</code> - Clear SaaS auth only</li>
              <li><code>clearAllAuth()</code> - Clear all auth data</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* LocalStorage Debug */}
      <Card>
        <CardHeader>
          <CardTitle>LocalStorage Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>SaaS Access Token:</strong> {localStorage.getItem('saas_access_token') ? 'Present' : 'Missing'}</div>
            <div><strong>SaaS Refresh Token:</strong> {localStorage.getItem('saas_refresh_token') ? 'Present' : 'Missing'}</div>
            <div><strong>SaaS User:</strong> {localStorage.getItem('saas_user') ? 'Present' : 'Missing'}</div>
            <div><strong>SaaS Device:</strong> {localStorage.getItem('saas_device') ? 'Present' : 'Missing'}</div>
            <div><strong>NevoStack Auth:</strong> {localStorage.getItem('nevostack_auth') || 'Missing'}</div>
            <div><strong>NevoStack User:</strong> {localStorage.getItem('nevostack_user') ? 'Present' : 'Missing'}</div>
            <div><strong>Access Token:</strong> {localStorage.getItem('accessToken') ? 'Present' : 'Missing'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}








