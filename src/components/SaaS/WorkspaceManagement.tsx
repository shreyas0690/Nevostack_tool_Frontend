import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Users, 
  Settings, 
  CreditCard, 
  BarChart3, 
  Globe, 
  Palette,
  Calendar,
  Clock,
  Languages,
  Shield,
  Zap
} from 'lucide-react';
import { Workspace, UpdateWorkspaceData } from '@/services/workspaceService';
import { workspaceService } from '@/services/workspaceService';
import { useTenant } from './TenantProvider';

interface WorkspaceManagementProps {
  workspaceId?: string;
}

export default function WorkspaceManagement({ workspaceId }: WorkspaceManagementProps) {
  const { currentWorkspace, refreshWorkspace } = useTenant();
  const [workspace, setWorkspace] = useState<Workspace | null>(currentWorkspace);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdateWorkspaceData>({});
  const { toast } = useToast();

  useEffect(() => {
    if (workspaceId && !workspace) {
      loadWorkspace(workspaceId);
    } else if (currentWorkspace) {
      setWorkspace(currentWorkspace);
    }
  }, [workspaceId, currentWorkspace]);

  const loadWorkspace = async (id: string) => {
    try {
      const response = await workspaceService.getWorkspaceById(id);
      if (response.success && response.data) {
        setWorkspace(response.data);
      }
    } catch (error) {
      console.error('Error loading workspace:', error);
      toast({
        title: "Error",
        description: "Failed to load workspace",
        variant: "destructive"
      });
    }
  };

  const handleEdit = () => {
    if (workspace) {
      setEditData({
        name: workspace.name,
        plan: workspace.plan,
        status: workspace.status,
        customization: { ...workspace.customization },
        settings: { ...workspace.settings }
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!workspace) return;

    setIsLoading(true);
    try {
      const response = await workspaceService.updateWorkspace(workspace.id, editData);
      if (response.success && response.data) {
        setWorkspace(response.data);
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Workspace updated successfully"
        });
        refreshWorkspace();
      }
    } catch (error) {
      console.error('Error updating workspace:', error);
      toast({
        title: "Error",
        description: "Failed to update workspace",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleUpgrade = async (plan: string) => {
    if (!workspace) return;

    setIsLoading(true);
    try {
      const response = await workspaceService.upgradeWorkspace(workspace.id, plan);
      if (response.success && response.data) {
        setWorkspace(response.data);
        toast({
          title: "Success",
          description: `Workspace upgraded to ${plan} plan`
        });
        refreshWorkspace();
      }
    } catch (error) {
      console.error('Error upgrading workspace:', error);
      toast({
        title: "Error",
        description: "Failed to upgrade workspace",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No workspace found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'starter': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsagePercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
          <p className="text-gray-600">Workspace Management</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit}>
              <Settings className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={getStatusColor(workspace.status)}>
                  {workspace.status.charAt(0).toUpperCase() + workspace.status.slice(1)}
                </Badge>
                {workspace.status === 'trial' && workspace.trialEndsAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Trial ends: {new Date(workspace.trialEndsAt).toLocaleDateString()}
                    {(() => {
                      const daysLeft = Math.ceil((new Date(workspace.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
                      if (daysLeft > 0) {
                        return ` (${daysLeft} days left)`;
                      } else if (daysLeft === 0) {
                        return ' (ends today)';
                      } else {
                        return ' (expired)';
                      }
                    })()}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Plan Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Current Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={getPlanColor(workspace.plan)}>
                  {workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1)}
                </Badge>
                <p className="text-xs text-gray-500 mt-2">
                  ${workspace.plan === 'starter' ? 29 : workspace.plan === 'professional' ? 79 : 199}/month
                </p>
              </CardContent>
            </Card>

            {/* Domain Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Domain</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{workspace.domain}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Subdomain: {workspace.subdomain}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your workspace quickly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Settings
                </Button>
                <Button variant="outline" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Integrations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Settings</CardTitle>
              <CardDescription>Customize your workspace appearance and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workspaceName">Workspace Name</Label>
                    {isEditing ? (
                      <Input
                        id="workspaceName"
                        value={editData.name || workspace.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">{workspace.name}</p>
                    )}
                  </div>
                  <div>
                    <Label>Status</Label>
                    {isEditing ? (
                      <Select 
                        value={editData.status || workspace.status} 
                        onValueChange={(value) => setEditData({ ...editData, status: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="trial">Trial</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getStatusColor(workspace.status)}>
                        {workspace.status.charAt(0).toUpperCase() + workspace.status.slice(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Customization Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Customization</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Primary Color</Label>
                    {isEditing ? (
                      <Input
                        type="color"
                        value={editData.customization?.primaryColor || workspace.customization.primaryColor}
                        onChange={(e) => setEditData({
                          ...editData,
                          customization: { ...editData.customization, primaryColor: e.target.value }
                        })}
                        className="w-20 h-10"
                      />
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: workspace.customization.primaryColor }}
                        />
                        <span className="text-sm text-gray-600">{workspace.customization.primaryColor}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Theme</Label>
                    {isEditing ? (
                      <Select 
                        value={editData.customization?.theme || workspace.customization.theme} 
                        onValueChange={(value) => setEditData({
                          ...editData,
                          customization: { ...editData.customization, theme: value as any }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-600 mt-1 capitalize">{workspace.customization.theme}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Regional Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Regional Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Timezone</Label>
                    {isEditing ? (
                      <Select 
                        value={editData.settings?.timezone || workspace.settings.timezone} 
                        onValueChange={(value) => setEditData({
                          ...editData,
                          settings: { ...editData.settings, timezone: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">{workspace.settings.timezone}</p>
                    )}
                  </div>
                  <div>
                    <Label>Date Format</Label>
                    {isEditing ? (
                      <Select 
                        value={editData.settings?.dateFormat || workspace.settings.dateFormat} 
                        onValueChange={(value) => setEditData({
                          ...editData,
                          settings: { ...editData.settings, dateFormat: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">{workspace.settings.dateFormat}</p>
                    )}
                  </div>
                  <div>
                    <Label>Time Format</Label>
                    {isEditing ? (
                      <Select 
                        value={editData.settings?.timeFormat || workspace.settings.timeFormat} 
                        onValueChange={(value) => setEditData({
                          ...editData,
                          settings: { ...editData.settings, timeFormat: value as any }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12h">12-hour</SelectItem>
                          <SelectItem value="24h">24-hour</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">{workspace.settings.timeFormat}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>Manage your subscription and billing information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Current Plan</h3>
                    <p className="text-gray-600">{workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1)}</p>
                  </div>
                  <Badge className={getPlanColor(workspace.plan)}>
                    ${workspace.plan === 'starter' ? 29 : workspace.plan === 'professional' ? 79 : 199}/month
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Billing Cycle</p>
                    <p className="font-medium">{workspace.billing.interval}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Next Billing</p>
                    <p className="font-medium">
                      {workspace.billing.nextBillingDate 
                        ? new Date(workspace.billing.nextBillingDate).toLocaleDateString()
                        : 'Not set'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUpgrade('professional')}
                    disabled={workspace.plan === 'professional' || isLoading}
                  >
                    Upgrade to Professional
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUpgrade('enterprise')}
                    disabled={workspace.plan === 'enterprise' || isLoading}
                  >
                    Upgrade to Enterprise
                  </Button>
                </div>
              </div>

              {/* Billing History */}
              <div>
                <h3 className="text-lg font-medium mb-4">Billing History</h3>
                <div className="border rounded-lg p-4">
                  <p className="text-gray-500 text-center py-8">Billing history will appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage</CardTitle>
              <CardDescription>Monitor your workspace resource consumption</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Users Usage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Users</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {workspace.usage.currentUsers} / {workspace.limits.maxUsers}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(workspace.usage.currentUsers, workspace.limits.maxUsers)} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500">
                  {workspace.limits.maxUsers - workspace.usage.currentUsers} users remaining
                </p>
              </div>

              {/* Storage Usage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Storage</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {workspace.usage.storageUsed} MB / {workspace.limits.maxStorage} MB
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(workspace.usage.storageUsed, workspace.limits.maxStorage)} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500">
                  {workspace.limits.maxStorage - workspace.usage.storageUsed} MB remaining
                </p>
              </div>

              {/* Departments Usage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Departments</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {workspace.usage.currentDepartments} / {workspace.limits.maxDepartments}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(workspace.usage.currentDepartments, workspace.limits.maxDepartments)} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500">
                  {workspace.limits.maxDepartments - workspace.usage.currentDepartments} departments remaining
                </p>
              </div>

              {/* API Usage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">API Calls (This Month)</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {workspace.usage.apiCallsThisMonth} / {workspace.limits.apiCallsPerMonth}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(workspace.usage.apiCallsThisMonth, workspace.limits.apiCallsPerMonth)} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500">
                  {workspace.limits.apiCallsPerMonth - workspace.usage.apiCallsThisMonth} calls remaining
                </p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(workspace.usage.lastUpdated).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}




