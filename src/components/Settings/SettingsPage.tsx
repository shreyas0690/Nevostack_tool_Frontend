import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Settings, User, Building2, Bell, Shield, Palette, Database,
  Lock, Eye, EyeOff, Upload, Download, Trash2, RefreshCw,
  Globe, Mail, Phone, MapPin, Camera, Save, AlertTriangle,
  Key, Smartphone, Wifi, Monitor, Moon, Sun, Volume2,
  Calendar, Clock, Languages, CreditCard, Zap, Cloud,
  FileText, Archive, Filter, Search, BarChart3, Sliders
} from 'lucide-react';
import PushNotificationSettings from '@/components/Notifications/PushNotificationSettings';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    // Profile Settings
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      phone: '+1 (555) 123-4567',
      location: 'New York, USA',
      bio: 'Senior Software Engineer with 5+ years of experience.',
      avatar: '',
      timezone: 'America/New_York',
      language: 'en',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: '12h'
    },
    
    // Company Settings
    company: {
      name: 'Tech Solutions Inc.',
      domain: 'techsolutions.com',
      address: '123 Business St, NY 10001',
      industry: 'technology',
      size: '50-200',
      workingHours: '9:00 AM - 6:00 PM',
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      holidayCalendar: 'us',
      fiscalYearStart: 'january'
    },
    
    // Security Settings
    security: {
      twoFactorEnabled: true,
      emailNotifications: true,
      loginAlerts: true,
      sessionTimeout: 30,
      passwordExpiry: 90,
      failedLoginAttempts: 5,
      ipWhitelisting: false,
      auditLogging: true
    },
    
    // Notification Settings
    notifications: {
      email: {
        taskAssigned: true,
        taskCompleted: true,
        taskOverdue: true,
        leaveRequests: true,
        departmentUpdates: true,
        systemAlerts: true,
        weeklyReports: false,
        monthlyReports: true
      },
      push: {
        taskReminders: true,
        meetingAlerts: true,
        deadlineAlerts: true,
        teamUpdates: false
      },
      sms: {
        criticalAlerts: true,
        emergencyOnly: true
      }
    },
    
    // Appearance Settings
    appearance: {
      theme: 'system',
      colorScheme: 'blue',
      fontSize: 'medium',
      density: 'comfortable',
      sidebarCollapsed: false,
      showAvatars: true,
      showTimestamps: true,
      animationsEnabled: true
    },
    
    // Data & Privacy
    privacy: {
      profileVisibility: 'team',
      activityTracking: true,
      analyticsOptIn: false,
      dataRetention: 365,
      exportEnabled: true,
      deleteAfterInactive: 1095
    },
    
    // Integration Settings
    integrations: {
      googleCalendar: false,
      microsoftTeams: false,
      slack: true,
      zoom: false,
      github: false,
      jira: false,
      webhooks: []
    }
  });

  const handleSave = async (section: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Settings Saved",
        description: `${section} settings have been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = (section: string) => {
    toast({
      title: "Settings Reset",
      description: `${section} settings have been reset to defaults.`,
    });
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      const data = {
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Data Exported",
        description: "Your settings have been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Settings</h1>
          <p className="text-muted-foreground">Manage your account, company, and system preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportData} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={() => handleSave('All')} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            Save All Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={settings.profile.firstName}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          profile: { ...prev.profile, firstName: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={settings.profile.lastName}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          profile: { ...prev.profile, lastName: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        profile: { ...prev.profile, email: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={settings.profile.phone}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          profile: { ...prev.profile, phone: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={settings.profile.location}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          profile: { ...prev.profile, location: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={settings.profile.bio}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        profile: { ...prev.profile, bio: e.target.value }
                      }))}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Localization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={settings.profile.timezone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time (UTC-5)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (UTC-6)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (UTC-7)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (UTC-8)</SelectItem>
                          <SelectItem value="Europe/London">GMT (UTC+0)</SelectItem>
                          <SelectItem value="Europe/Paris">CET (UTC+1)</SelectItem>
                          <SelectItem value="Asia/Tokyo">JST (UTC+9)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select value={settings.profile.language}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                          <SelectItem value="zh">Chinese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select value={settings.profile.dateFormat}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                          <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                          <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                          <SelectItem value="MMM dd, yyyy">MMM DD, YYYY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="timeFormat">Time Format</Label>
                      <Select value={settings.profile.timeFormat}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                          <SelectItem value="24h">24 Hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Profile Picture
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={settings.profile.avatar} />
                      <AvatarFallback className="text-lg">
                        {settings.profile.firstName.charAt(0)}{settings.profile.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-2">
                      <Button size="sm" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photo
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Photo
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Recommended: Square image, at least 400x400px
                  </p>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Profile Data
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleReset('Profile')}>
              Reset Changes
            </Button>
            <Button onClick={() => handleSave('Profile')} disabled={isLoading}>
              Save Profile Settings
            </Button>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, twoFactorEnabled: checked }
                    }))}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Select value={settings.security.sessionTimeout.toString()}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                  <Select value={settings.security.passwordExpiry.toString()}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="-1">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Monitoring & Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Login Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified of new logins</p>
                  </div>
                  <Switch
                    checked={settings.security.loginAlerts}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, loginAlerts: checked }
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">Track all account activity</p>
                  </div>
                  <Switch
                    checked={settings.security.auditLogging}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, auditLogging: checked }
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>IP Whitelisting</Label>
                    <p className="text-sm text-muted-foreground">Restrict access by IP address</p>
                  </div>
                  <Switch
                    checked={settings.security.ipWhitelisting}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, ipWhitelisting: checked }
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="failedAttempts">Failed Login Attempts</Label>
                  <Select value={settings.security.failedLoginAttempts.toString()}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 attempts</SelectItem>
                      <SelectItem value="5">5 attempts</SelectItem>
                      <SelectItem value="10">10 attempts</SelectItem>
                      <SelectItem value="-1">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Security settings affect all users in your organization. Changes may require users to re-authenticate.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleReset('Security')}>
              Reset Changes
            </Button>
            <Button onClick={() => handleSave('Security')} disabled={isLoading}>
              Save Security Settings
            </Button>
          </div>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Theme & Colors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Theme Mode</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Monitor }
                    ].map((theme) => {
                      const Icon = theme.icon;
                      return (
                        <Button
                          key={theme.value}
                          variant={settings.appearance.theme === theme.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            appearance: { ...prev.appearance, theme: theme.value }
                          }))}
                          className="flex flex-col gap-1 h-auto py-3"
                        >
                          <Icon className="h-4 w-4" />
                          {theme.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <Label>Color Scheme</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {['blue', 'green', 'purple', 'orange'].map((color) => (
                      <Button
                        key={color}
                        variant={settings.appearance.colorScheme === color ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          appearance: { ...prev.appearance, colorScheme: color }
                        }))}
                        className="capitalize"
                      >
                        {color}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Font Size</Label>
                  <Select value={settings.appearance.fontSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Density</Label>
                  <Select value={settings.appearance.density}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                      <SelectItem value="spacious">Spacious</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="h-5 w-5" />
                  Interface Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Avatars</Label>
                    <p className="text-sm text-muted-foreground">Display user profile pictures</p>
                  </div>
                  <Switch
                    checked={settings.appearance.showAvatars}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, showAvatars: checked }
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Timestamps</Label>
                    <p className="text-sm text-muted-foreground">Display creation and update times</p>
                  </div>
                  <Switch
                    checked={settings.appearance.showTimestamps}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, showTimestamps: checked }
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Animations</Label>
                    <p className="text-sm text-muted-foreground">Enable smooth transitions</p>
                  </div>
                  <Switch
                    checked={settings.appearance.animationsEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, animationsEnabled: checked }
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Collapsed Sidebar</Label>
                    <p className="text-sm text-muted-foreground">Start with sidebar minimized</p>
                  </div>
                  <Switch
                    checked={settings.appearance.sidebarCollapsed}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, sidebarCollapsed: checked }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleReset('Appearance')}>
              Reset Changes
            </Button>
            <Button onClick={() => handleSave('Appearance')} disabled={isLoading}>
              Save Appearance Settings
            </Button>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(settings.notifications.email).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          email: { ...prev.notifications.email, [key]: checked }
                        }
                      }))}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  SMS Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(settings.notifications.sms).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          sms: { ...prev.notifications.sms, [key]: checked }
                        }
                      }))}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Push Notifications */}
          <PushNotificationSettings 
            settings={settings.notifications}
            onSettingsChange={(newSettings) => setSettings(prev => ({
              ...prev,
              notifications: newSettings
            }))}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleReset('Notifications')}>
              Reset Changes
            </Button>
            <Button onClick={() => handleSave('Notifications')} disabled={isLoading}>
              Save Notification Settings
            </Button>
          </div>
        </TabsContent>

        {/* Company Settings */}
        <TabsContent value="company" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.company.name}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      company: { ...prev.company, name: e.target.value }
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={settings.company.domain}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      company: { ...prev.company, domain: e.target.value }
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={settings.company.address}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      company: { ...prev.company, address: e.target.value }
                    }))}
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={settings.company.industry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="size">Company Size</Label>
                    <Select value={settings.company.size}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="500+">500+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Working Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="workingHours">Working Hours</Label>
                  <Input
                    id="workingHours"
                    value={settings.company.workingHours}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      company: { ...prev.company, workingHours: e.target.value }
                    }))}
                    placeholder="e.g., 9:00 AM - 6:00 PM"
                  />
                </div>
                
                <div>
                  <Label>Working Days</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Switch
                          checked={settings.company.workingDays.includes(day)}
                          onCheckedChange={(checked) => {
                            setSettings(prev => ({
                              ...prev,
                              company: {
                                ...prev.company,
                                workingDays: checked
                                  ? [...prev.company.workingDays, day]
                                  : prev.company.workingDays.filter(d => d !== day)
                              }
                            }));
                          }}
                        />
                        <Label className="capitalize text-sm">{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="holidayCalendar">Holiday Calendar</Label>
                    <Select value={settings.company.holidayCalendar}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="ca">Canada</SelectItem>
                        <SelectItem value="au">Australia</SelectItem>
                        <SelectItem value="in">India</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="fiscalYear">Fiscal Year Start</Label>
                    <Select value={settings.company.fiscalYearStart}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="january">January</SelectItem>
                        <SelectItem value="april">April</SelectItem>
                        <SelectItem value="july">July</SelectItem>
                        <SelectItem value="october">October</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleReset('Company')}>
              Reset Changes
            </Button>
            <Button onClick={() => handleSave('Company')} disabled={isLoading}>
              Save Company Settings
            </Button>
          </div>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Data & Privacy Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="profileVisibility">Profile Visibility</Label>
                  <Select value={settings.privacy.profileVisibility}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="team">Team Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="dataRetention">Data Retention (days)</Label>
                  <Select value={settings.privacy.dataRetention.toString()}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">6 months</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="1095">3 years</SelectItem>
                      <SelectItem value="-1">Forever</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Activity Tracking</Label>
                    <p className="text-sm text-muted-foreground">Track user actions for analytics</p>
                  </div>
                  <Switch
                    checked={settings.privacy.activityTracking}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, activityTracking: checked }
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Analytics Opt-in</Label>
                    <p className="text-sm text-muted-foreground">Share usage data to improve the product</p>
                  </div>
                  <Switch
                    checked={settings.privacy.analyticsOptIn}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, analyticsOptIn: checked }
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Data Export</Label>
                    <p className="text-sm text-muted-foreground">Allow users to export their data</p>
                  </div>
                  <Switch
                    checked={settings.privacy.exportEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, exportEnabled: checked }
                    }))}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Data Management Actions</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" size="sm" onClick={handleExportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                  <Button variant="outline" size="sm">
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Old Data
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleReset('Privacy')}>
              Reset Changes
            </Button>
            <Button onClick={() => handleSave('Privacy')} disabled={isLoading}>
              Save Privacy Settings
            </Button>
          </div>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Google Calendar', key: 'googleCalendar', icon: Calendar, description: 'Sync events and meetings' },
              { name: 'Microsoft Teams', key: 'microsoftTeams', icon: Wifi, description: 'Video calls and chat' },
              { name: 'Slack', key: 'slack', icon: Zap, description: 'Team communication' },
              { name: 'Zoom', key: 'zoom', icon: Monitor, description: 'Video conferencing' },
              { name: 'GitHub', key: 'github', icon: FileText, description: 'Code repository integration' },
              { name: 'Jira', key: 'jira', icon: BarChart3, description: 'Project management' }
            ].map((integration) => {
              const Icon = integration.icon;
              const isConnected = settings.integrations[integration.key as keyof typeof settings.integrations];
              
              return (
                <Card key={integration.key}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{integration.name}</h4>
                          <p className="text-sm text-muted-foreground">{integration.description}</p>
                        </div>
                      </div>
                      <Badge variant={isConnected ? 'default' : 'outline'}>
                        {isConnected ? 'Connected' : 'Not Connected'}
                      </Badge>
                    </div>
                    
                    <Button
                      size="sm"
                      variant={isConnected ? 'destructive' : 'default'}
                      className="w-full"
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        integrations: {
                          ...prev.integrations,
                          [integration.key]: !isConnected
                        }
                      }))}
                    >
                      {isConnected ? 'Disconnect' : 'Connect'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleReset('Integrations')}>
              Reset Changes
            </Button>
            <Button onClick={() => handleSave('Integrations')} disabled={isLoading}>
              Save Integration Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}