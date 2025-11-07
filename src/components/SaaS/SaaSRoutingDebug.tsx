import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, RefreshCw, Route, Shield, User } from 'lucide-react';
import { saasAuthService } from '@/services/saasAuthService';

export default function SaaSRoutingDebug() {
  const [debugInfo, setDebugInfo] = useState({
    currentPath: '',
    isSaaSAuthenticated: false,
    saasUser: null,
    localStorage: {},
    routingDecision: ''
  });

  const checkDebugInfo = () => {
    const currentPath = window.location.pathname;
    const isSaaSAuthenticated = saasAuthService.isSaaSAuthenticated();
    const saasUser = saasAuthService.getSaaSUser();
    
    const localStorage = {
      saas_access_token: localStorage.getItem('saas_access_token'),
      saas_refresh_token: localStorage.getItem('saas_refresh_token'),
      saas_user: localStorage.getItem('saas_user'),
      saas_device: localStorage.getItem('saas_device'),
      nevostack_auth: localStorage.getItem('nevostack_auth'),
      nevostack_user: localStorage.getItem('nevostack_user'),
      user: localStorage.getItem('user'),
      accessToken: localStorage.getItem('accessToken')
    };

    let routingDecision = '';
    if (isSaaSAuthenticated && saasUser && currentPath.startsWith('/saas')) {
      routingDecision = 'SaaS Dashboard (Authenticated SaaS Admin)';
    } else if (currentPath.startsWith('/saas')) {
      routingDecision = 'SaaS Login Page (Not Authenticated)';
    } else {
      routingDecision = 'Regular App Flow';
    }

    setDebugInfo({
      currentPath,
      isSaaSAuthenticated,
      saasUser,
      localStorage,
      routingDecision
    });
  };

  useEffect(() => {
    checkDebugInfo();
  }, []);

  const handleClearAllAuth = () => {
    localStorage.removeItem('saas_access_token');
    localStorage.removeItem('saas_refresh_token');
    localStorage.removeItem('saas_user');
    localStorage.removeItem('saas_device');
    localStorage.removeItem('nevostack_auth');
    localStorage.removeItem('nevostack_user');
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    console.log('🗑️ All auth data cleared');
    checkDebugInfo();
  };

  const handleTestLogin = () => {
    // Simulate login
    const superAdminUser = {
      id: 'super-admin-001',
      name: 'SaaS Super Admin',
      firstName: 'SaaS',
      lastName: 'Super Admin',
      email: 'admin@demo.com',
      role: 'super_admin',
      isActive: true,
      createdAt: new Date(),
      departmentId: null,
      companyId: 'saas-platform',
      avatar: null
    };

    localStorage.setItem('saas_access_token', 'super-admin-token');
    localStorage.setItem('saas_refresh_token', 'super-admin-refresh-token');
    localStorage.setItem('saas_user', JSON.stringify(superAdminUser));
    localStorage.setItem('saas_device', JSON.stringify({
      id: 'saas-device-001',
      deviceId: 'saas-device-001',
      deviceName: 'SaaS Admin Device',
      deviceType: 'desktop',
      browser: 'Chrome',
      os: 'Windows',
      isTrusted: true
    }));

    console.log('✅ Test login completed');
    checkDebugInfo();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">SaaS Routing Debug</h1>
        <p className="text-muted-foreground">
          Debug SaaS authentication and routing issues
        </p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>Current Path:</strong>
              <Badge variant="outline" className="ml-2">{debugInfo.currentPath}</Badge>
            </div>
            <div>
              <strong>Routing Decision:</strong>
              <Badge variant="secondary" className="ml-2">{debugInfo.routingDecision}</Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <strong>Authentication Status:</strong>
            {debugInfo.isSaaSAuthenticated ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Authenticated
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Not Authenticated
              </Badge>
            )}
          </div>

          {debugInfo.saasUser && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <strong>SaaS User:</strong>
              </div>
              <div className="ml-6 text-sm space-y-1">
                <div><strong>Name:</strong> {debugInfo.saasUser.name}</div>
                <div><strong>Email:</strong> {debugInfo.saasUser.email}</div>
                <div><strong>Role:</strong> {debugInfo.saasUser.role}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* LocalStorage Status */}
      <Card>
        <CardHeader>
          <CardTitle>LocalStorage Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(debugInfo.localStorage).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="font-mono text-sm">{key}:</span>
                <Badge variant={value ? "default" : "outline"}>
                  {value ? 'Present' : 'Missing'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button onClick={checkDebugInfo} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleTestLogin}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Test Login
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={handleClearAllAuth}
              className="flex items-center gap-2"
            >
              Clear All Auth
            </Button>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Debug Steps:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Check current authentication status</li>
                <li>If not authenticated, try "Test Login"</li>
                <li>Navigate to <code>/saas/admin</code> to test routing</li>
                <li>If issues persist, use "Clear All Auth" and try again</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/saas/login'}
            >
              SaaS Login
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/saas/super-admin/login'}
            >
              Super Admin Login
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/saas/admin'}
            >
              SaaS Admin Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/saas/auth-test'}
            >
              Auth Test Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}








