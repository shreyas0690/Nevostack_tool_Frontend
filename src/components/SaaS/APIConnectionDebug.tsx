import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Server,
  Database,
  Key,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { saasAuthService } from '@/services/saasAuthService';

interface APIConnectionDebugProps {
  onConnectionTest?: (success: boolean) => void;
}

export default function APIConnectionDebug({ onConnectionTest }: APIConnectionDebugProps) {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [apiDetails, setApiDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPIConnection = async () => {
    setLoading(true);
    setConnectionStatus('checking');

    try {
      console.log('🔍 Testing API connection...');

      // Test 1: Check if SaaS admin is authenticated
      if (!saasAuthService.isSaaSAuthenticated()) {
        throw new Error('SaaS authentication required. Please login as Super Admin first.');
      }

      // Test 2: Test basic API endpoint using saasAuthService
      const response = await saasAuthService.authenticatedFetch(
        '/api/saas/companies?page=1&limit=1'
      );
      
      console.log('📡 API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response data:', data);
        setConnectionStatus('success');
        setApiDetails({
          status: response.status,
          statusText: response.statusText,
          dataReceived: data,
          timestamp: new Date().toISOString()
        });

        toast.success('API connection successful!');
        onConnectionTest?.(true);
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: 'Failed to parse error response' };
        }
        console.error('❌ API Error:', errorData);

        setConnectionStatus('error');
        setApiDetails({
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          timestamp: new Date().toISOString()
        });

        toast.error(`API Error: ${errorData?.message || 'Unknown error'}`);
        onConnectionTest?.(false);
      }
    } catch (error) {
      console.error('❌ Connection Error:', error);
      
      setConnectionStatus('error');
      setApiDetails({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
      toast.error(`Connection Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      onConnectionTest?.(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAPIConnection();
  }, []);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'checking':
        return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'checking':
        return 'bg-blue-100 text-blue-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'checking':
        return 'Testing Connection...';
      case 'success':
        return 'Connected Successfully';
      case 'error':
        return 'Connection Failed';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Server className="h-5 w-5 mr-2" />
          API Connection Debug
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon()}
            <span className="ml-2 font-medium">{getStatusText()}</span>
          </div>
          <Badge className={getStatusColor()}>
            {connectionStatus.toUpperCase()}
          </Badge>
        </div>

        {/* Connection Details */}
        {apiDetails && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <Database className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">Status Code:</span>
                <span className="ml-2 font-mono text-sm">{apiDetails.status}</span>
              </div>
              
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">Response:</span>
                <span className="ml-2 font-mono text-sm">{apiDetails.statusText}</span>
              </div>
            </div>

            {apiDetails.dataReceived && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium mb-2">API Response:</div>
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {JSON.stringify(apiDetails.dataReceived, null, 2)}
                </pre>
              </div>
            )}

            {apiDetails.error && (
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-red-800 mb-2">Error Details:</div>
                <pre className="text-xs text-red-600 overflow-x-auto">
                  {JSON.stringify(apiDetails.error, null, 2)}
                </pre>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Last tested: {new Date(apiDetails.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {/* Test Button */}
        <div className="flex justify-center">
          <Button 
            onClick={testAPIConnection} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Again
              </>
            )}
          </Button>
        </div>

        {/* Authentication Info */}
        <div className="border-t pt-4">
          <div className="flex items-center mb-2">
            <Key className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-sm font-medium">Authentication</span>
          </div>
          <div className="text-xs text-gray-600">
            SaaS Authenticated: {saasAuthService.isSaaSAuthenticated() ? '✅ Yes' : '❌ No'}
          </div>
          <div className="text-xs text-gray-600">
            Token: {saasAuthService.getAccessToken() ? 'Present' : 'Missing'}
          </div>
          <div className="text-xs text-gray-600">
            User: {saasAuthService.getSaaSUser()?.email || 'None'}
          </div>
          <div className="text-xs text-gray-600">
            API Endpoint: /api/saas/companies
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
