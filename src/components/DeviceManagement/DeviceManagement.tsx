import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Shield, 
  MoreVertical,
  LogOut,
  Lock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface Device {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  ipAddress: string;
  isActive: boolean;
  isTrusted: boolean;
  lastActive: string;
  loginCount: number;
  status: 'active' | 'inactive' | 'locked';
  location?: {
    country?: string;
    city?: string;
  };
}

export default function DeviceManagement() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const mockDevices: Device[] = [
      {
        id: '1',
        deviceId: 'device_123456',
        deviceName: 'MacBook Pro',
        deviceType: 'desktop',
        browser: 'Chrome',
        os: 'macOS',
        ipAddress: '192.168.1.100',
        isActive: true,
        isTrusted: true,
        lastActive: '2024-01-20T14:45:00Z',
        loginCount: 45,
        status: 'active',
        location: { country: 'India', city: 'Mumbai' }
      },
      {
        id: '2',
        deviceId: 'device_789012',
        deviceName: 'iPhone 15 Pro',
        deviceType: 'mobile',
        browser: 'Safari',
        os: 'iOS',
        ipAddress: '192.168.1.101',
        isActive: true,
        isTrusted: false,
        lastActive: '2024-01-20T13:20:00Z',
        loginCount: 12,
        status: 'active',
        location: { country: 'India', city: 'Mumbai' }
      },
      {
        id: '3',
        deviceId: 'device_345678',
        deviceName: 'Windows PC',
        deviceType: 'desktop',
        browser: 'Edge',
        os: 'Windows',
        ipAddress: '192.168.1.102',
        isActive: false,
        isTrusted: true,
        lastActive: '2024-01-19T17:30:00Z',
        loginCount: 23,
        status: 'inactive',
        location: { country: 'India', city: 'Delhi' }
      }
    ];

    setDevices(mockDevices);
    setLoading(false);
  }, []);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-5 w-5" />;
      case 'tablet': return <Tablet className="h-5 w-5" />;
      default: return <Monitor className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) return <Badge variant="secondary">Inactive</Badge>;
    
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'locked': return <Badge className="bg-red-100 text-red-800">Locked</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDeviceAction = async (deviceId: string, action: string) => {
    try {
      console.log(`Performing ${action} on device ${deviceId}`);
      toast({
        title: "Device Action",
        description: `${action} action performed successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform device action.",
        variant: "destructive",
      });
    }
  };

  const activeDevices = devices.filter(d => d.isActive);
  const inactiveDevices = devices.filter(d => !d.isActive);

  if (loading) {
    return <div className="space-y-4">Loading devices...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Device Management</h2>
        <p className="text-muted-foreground">Manage your devices and monitor their activity</p>
      </div>

      {/* Device Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Devices</p>
                <p className="text-2xl font-bold">{devices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Active Devices</p>
                <p className="text-2xl font-bold">{activeDevices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Trusted Devices</p>
                <p className="text-2xl font-bold">
                  {devices.filter(d => d.isTrusted).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Security Alerts</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Active Devices</span>
            <Badge variant="secondary">{activeDevices.length}</Badge>
          </CardTitle>
          <CardDescription>Devices currently logged into your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeDevices.map((device) => (
              <div key={device.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getDeviceIcon(device.deviceType)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{device.deviceName}</h3>
                        {getStatusBadge(device.status, device.isActive)}
                        {device.isTrusted && (
                          <Badge className="bg-purple-100 text-purple-800">Trusted</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {device.browser} on {device.os} • {device.ipAddress}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDeviceAction(device.deviceId, 'trust')}>
                        <Shield className="h-4 w-4 mr-2" />
                        {device.isTrusted ? 'Untrust Device' : 'Trust Device'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeviceAction(device.deviceId, 'lock')}>
                        <Lock className="h-4 w-4 mr-2" />
                        Lock Device
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeviceAction(device.deviceId, 'logout')}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout Device
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Last Active</p>
                    <p className="font-medium">{formatDate(device.lastActive)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Login Count</p>
                    <p className="font-medium">{device.loginCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">
                      {device.location?.city}, {device.location?.country}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inactive Devices */}
      {inactiveDevices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-gray-500" />
              <span>Inactive Devices</span>
              <Badge variant="secondary">{inactiveDevices.length}</Badge>
            </CardTitle>
            <CardDescription>Devices that have been logged out</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inactiveDevices.map((device) => (
                <div key={device.id} className="border rounded-lg p-4 opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getDeviceIcon(device.deviceType)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{device.deviceName}</h3>
                          {getStatusBadge(device.status, device.isActive)}
                          {device.isTrusted && (
                            <Badge className="bg-purple-100 text-purple-800">Trusted</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {device.browser} on {device.os} • {device.ipAddress}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Last Active</p>
                      <p className="font-medium">{formatDate(device.lastActive)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Sessions</p>
                      <p className="font-medium">{device.loginCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium">
                        {device.location?.city}, {device.location?.country}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
