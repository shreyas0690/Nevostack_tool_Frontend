import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Key,
  Shield,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { saasAuthService } from '@/services/saasAuthService';

interface SaaSAuthHelperProps {
  onAuthSet?: (token: string) => void;
}

export default function SaaSAuthHelper({ onAuthSet }: SaaSAuthHelperProps) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');

  // Use saasAuthService for authentication
  const getAuthToken = () => saasAuthService.getAccessToken();

  // Set default SaaS Super Admin token
  const setDefaultToken = () => {
    const defaultToken = 'super-admin-token';
    const userData = {
      id: 'super-admin-001',
      name: 'SaaS Super Admin',
      firstName: 'SaaS',
      lastName: 'Super Admin',
      email: 'admin@demo.com',
      role: 'super_admin',
      status: 'active'
    };
    const deviceData = {
      id: 'saas-device-001',
      deviceId: 'saas-device-001',
      deviceName: 'SaaS Admin Device',
      deviceType: 'desktop',
      browser: 'Chrome',
      os: 'Windows',
      isTrusted: true
    };

    // Set using saasAuthService approach
    localStorage.setItem('saas_access_token', defaultToken);
    localStorage.setItem('saas_refresh_token', 'super-admin-refresh-token');
    localStorage.setItem('saas_user', JSON.stringify(userData));
    localStorage.setItem('saas_device', JSON.stringify(deviceData));

    setToken(defaultToken);
    setAuthStatus('valid');
    toast.success('SaaS Super Admin authentication set successfully!');
    onAuthSet?.(defaultToken);
  };

  // Set custom token
  const setCustomToken = () => {
    if (!token.trim()) {
      toast.error('Please enter a token');
      return;
    }

    // Set custom token using saasAuthService approach
    localStorage.setItem('saas_access_token', token.trim());

    setAuthStatus('valid');
    toast.success('Custom token set successfully!');
    onAuthSet?.(token.trim());
  };

  // Clear all tokens
  const clearTokens = () => {
    // Clear using saasAuthService approach
    localStorage.removeItem('saas_access_token');
    localStorage.removeItem('saas_refresh_token');
    localStorage.removeItem('saas_user');
    localStorage.removeItem('saas_device');

    setToken('');
    setAuthStatus('checking');
    toast.success('All authentication tokens cleared');
  };

  // Check current authentication status
  const checkAuthStatus = () => {
    const currentToken = getAuthToken();
    if (currentToken) {
      setToken(currentToken);
      setAuthStatus('valid');
    } else {
      setAuthStatus('invalid');
    }
  };

  React.useEffect(() => {
    checkAuthStatus();
  }, []);

  const getStatusIcon = () => {
    switch (authStatus) {
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (authStatus) {
      case 'checking':
        return 'Checking...';
      case 'valid':
        return 'Authenticated';
      case 'invalid':
        return 'Not Authenticated';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusColor = () => {
    switch (authStatus) {
      case 'checking':
        return 'bg-blue-100 text-blue-800';
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'invalid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          SaaS Authentication Helper
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Auth Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon()}
            <span className="ml-2 font-medium">Status:</span>
          </div>
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>

        {/* Current Token Display */}
        {getAuthToken() && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium mb-1">Current Token:</div>
            <div className="text-xs font-mono text-gray-600 break-all">
              {getAuthToken()?.substring(0, 50)}...
            </div>
          </div>
        )}

        {/* Quick Setup */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Setup:</Label>

          <Button
            onClick={setDefaultToken}
            className="w-full"
            variant="default"
          >
            <Shield className="h-4 w-4 mr-2" />
            Set SaaS Super Admin Token
          </Button>

          <div className="text-xs text-gray-500 text-center">
            Sets default super admin credentials for testing
          </div>
        </div>

        {/* Custom Token */}
        <div className="space-y-3 border-t pt-4">
          <Label className="text-sm font-medium">Custom Token:</Label>

          <Input
            type="text"
            placeholder="Enter custom token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="font-mono text-sm"
          />

          <Button
            onClick={setCustomToken}
            className="w-full"
            variant="outline"
            disabled={!token.trim()}
          >
            <Key className="h-4 w-4 mr-2" />
            Set Custom Token
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t pt-4">
          <Button
            onClick={checkAuthStatus}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Check Status
          </Button>

          <Button
            onClick={clearTokens}
            variant="destructive"
            size="sm"
            className="flex-1"
          >
            Clear All
          </Button>
        </div>

        {/* Help Text */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Use this tool to set authentication tokens for testing the SaaS Companies API.
            The default SaaS Super Admin token allows full access to company management.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
