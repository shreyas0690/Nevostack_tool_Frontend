import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, RefreshCw, Server, Loader2 } from 'lucide-react';
import { API_CONFIG } from '@/config/api';

const API_BASE = API_CONFIG.BASE_URL;

interface BackendStatusProps {
  onStatusChange?: (isOnline: boolean) => void;
}

export default function SaaSBackendStatus({ onStatusChange }: BackendStatusProps) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkBackendStatus = async () => {
    setIsChecking(true);
    setError(null);

    try {
      // Test with a working endpoint that doesn't require auth
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // If we get any response (even 401 auth required), backend is online
      if (response.status === 401 || response.status === 403 || response.ok) {
        setIsOnline(true);
        onStatusChange?.(true);
        console.log('✅ Backend is online - API responding with status:', response.status);
      } else {
        setIsOnline(false);
        onStatusChange?.(false);
        setError(`Backend responded with status: ${response.status}`);
      }
    } catch (error) {
      setIsOnline(false);
      onStatusChange?.(false);
      setError('Backend server is not running or not accessible');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
  }, []);

  if (isOnline === null) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Checking backend status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Server className="h-5 w-5" />
          Backend Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isOnline ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Backend server is running and accessible. SaaS features are available.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Backend server is not running or not accessible.
              </AlertDescription>
            </Alert>

            {error && (
              <div className="text-sm text-muted-foreground">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p><strong>To fix this issue:</strong></p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Open a terminal/command prompt</li>
                <li>Navigate to the backend directory: <code className="bg-muted px-1 rounded">cd backend</code></li>
                <li>Start the backend server: <code className="bg-muted px-1 rounded">npm start</code></li>
                <li>Wait for the server to start (you should see "Server running on port 5000")</li>
                <li>Refresh this page</li>
              </ol>
            </div>

            <Button
              onClick={checkBackendStatus}
              disabled={isChecking}
              variant="outline"
              size="sm"
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Check Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}





