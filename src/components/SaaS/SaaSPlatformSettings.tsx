import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Settings,
  Save,
  Globe,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Lock,
  Unlock,
  DollarSign,
  Clock,
  Users,
  Database,
  Server,
  Bell,
  Zap,
  TrendingUp,
  Building2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saasAuthService } from '@/services/saasAuthService';

export default function SaaSPlatformSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // General Settings
    platformName: '',
    platformDomain: '',
    supportEmail: '',
    contactPhone: '',
    timezone: 'UTC',
    language: 'en',
    firstName: '',
    lastName: '',

    // Security Settings
    requireStrongPassword: true
  });

  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Username change form state
  const [usernameForm, setUsernameForm] = useState({
    newUsername: '',
    confirmUsername: ''
  });

  // Loading states for individual operations
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Fetch platform settings from backend
  const fetchPlatformSettings = async () => {
    try {
      setLoading(true);

      // Remove pre-API authentication check - let authenticatedFetch handle it

      const response = await saasAuthService.authenticatedFetch('/api/saas/platform-settings');

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSettings(prevSettings => ({
            ...prevSettings,
            ...data.data
          }));
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Platform settings fetch error:', errorData);
        toast.error('Failed to load platform settings');
      }
    } catch (error) {
      console.error('❌ Error fetching platform settings:', error);
      toast.error('Network error: Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  // Load platform settings on component mount
  useEffect(() => {
    fetchPlatformSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Remove pre-API authentication check - let authenticatedFetch handle it

      const response = await saasAuthService.authenticatedFetch('/api/saas/platform-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platformName: settings.platformName,
          platformDomain: settings.platformDomain,
          supportEmail: settings.supportEmail,
          contactPhone: settings.contactPhone,
          timezone: settings.timezone,
          language: settings.language,
          firstName: settings.firstName,
          lastName: settings.lastName
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: "✅ Settings Saved Successfully",
            description: "Your platform configuration has been updated.",
          });
          // Refresh the data to show the latest changes
          await fetchPlatformSettings();
        } else {
          toast.error('❌ Failed to save platform settings');
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Platform settings save error:', errorData);
        toast.error('❌ Failed to save platform settings');
      }
    } catch (error) {
      console.error('❌ Error saving platform settings:', error);
      toast.error('❌ Network error: Failed to save platform settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    toast({
      title: "Settings Reset",
      description: "Settings have been reset to default values.",
    });
  };

  const updateSetting = (key: string, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all password fields.",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation password do not match.",
        variant: "destructive"
      });
      return;
    }

    const minPasswordLength = 8; // Default minimum password length
    if (passwordForm.newPassword.length < minPasswordLength) {
      toast({
        title: "Password Too Short",
        description: `Password must be at least ${minPasswordLength} characters long.`,
        variant: "destructive"
      });
      return;
    }

    try {
      setPasswordLoading(true);
      
      // Remove pre-API authentication check - let authenticatedFetch handle it

      const response = await saasAuthService.authenticatedFetch('/api/saas/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: "✅ Password Updated Successfully",
            description: "Your password has been changed successfully.",
          });

          // Clear the form
          setPasswordForm({
            newPassword: '',
            confirmPassword: ''
          });
        } else {
          toast.error(data.message || '❌ Failed to update password');
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Password change error:', errorData);
        toast.error('❌ Failed to update password');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUsernameChange = async () => {
    if (!usernameForm.newUsername || !usernameForm.confirmUsername) {
      toast({
        title: "Validation Error",
        description: "Please fill in all username fields.",
        variant: "destructive"
      });
      return;
    }

    if (usernameForm.newUsername !== usernameForm.confirmUsername) {
      toast({
        title: "Username Mismatch",
        description: "New username and confirmation username do not match.",
        variant: "destructive"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(usernameForm.newUsername)) {
      toast({
        title: "Invalid Email Format",
        description: "Please enter a valid email address as username.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUsernameLoading(true);
      
      // Remove pre-API authentication check - let authenticatedFetch handle it

      const response = await saasAuthService.authenticatedFetch('/api/saas/change-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newUsername: usernameForm.newUsername,
          confirmUsername: usernameForm.confirmUsername
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: "✅ Username Updated Successfully",
            description: "Your username (email) has been changed successfully.",
          });

          // Clear the form
          setUsernameForm({
            newUsername: '',
            confirmUsername: ''
          });

          // Refresh the settings to get updated user info
          fetchPlatformSettings();
        } else {
          toast.error(data.message || '❌ Failed to update username');
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Username change error:', errorData);
        toast.error('❌ Failed to update username');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update username. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUsernameLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-blue-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Loading Platform Settings...</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Please wait while we fetch your settings.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-blue-100 dark:border-gray-700 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">Platform Settings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Configure platform-wide settings and preferences</p>
          </div>
        </div>
      </div>


      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column - General Settings */}
        <Card className="hover:shadow-lg transition-all duration-200 border border-blue-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 border-b border-blue-100 dark:border-gray-600">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">General Settings</h3>
                <p className="text-sm text-blue-600 dark:text-blue-300">Platform configuration and branding</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="platformName" className="text-sm font-medium text-blue-700 dark:text-blue-300">Platform Name</Label>
              <Input
                id="platformName"
                value={settings.platformName}
                onChange={(e) => updateSetting('platformName', e.target.value)}
                className="border-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="Enter platform name"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="platformDomain" className="text-sm font-medium text-blue-700 dark:text-blue-300">Platform Domain</Label>
              <Input
                id="platformDomain"
                value={settings.platformDomain}
                onChange={(e) => updateSetting('platformDomain', e.target.value)}
                className="border-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="yourdomain.com"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="supportEmail" className="text-sm font-medium text-blue-700 dark:text-blue-300">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => updateSetting('supportEmail', e.target.value)}
                className="border-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="support@yourdomain.com"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="contactPhone" className="text-sm font-medium text-blue-700 dark:text-blue-300">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={settings.contactPhone}
                onChange={(e) => updateSetting('contactPhone', e.target.value)}
                className="border-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="firstName" className="text-sm font-medium text-blue-700 dark:text-blue-300">First Name</Label>
                <Input
                  id="firstName"
                  value={settings.firstName}
                  onChange={(e) => updateSetting('firstName', e.target.value)}
                  className="border-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="Enter first name"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="lastName" className="text-sm font-medium text-blue-700 dark:text-blue-300">Last Name</Label>
                <Input
                  id="lastName"
                  value={settings.lastName}
                  onChange={(e) => updateSetting('lastName', e.target.value)}
                  className="border-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="timezone" className="text-sm font-medium text-blue-700 dark:text-blue-300">Timezone</Label>
                <Select value={settings.timezone} onValueChange={(value) => updateSetting('timezone', value)}>
                  <SelectTrigger className="border-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="UTC" className="dark:text-gray-100 dark:hover:bg-gray-700">UTC (Coordinated Universal Time)</SelectItem>
                    <SelectItem value="EST" className="dark:text-gray-100 dark:hover:bg-gray-700">EST (Eastern Standard Time)</SelectItem>
                    <SelectItem value="PST" className="dark:text-gray-100 dark:hover:bg-gray-700">PST (Pacific Standard Time)</SelectItem>
                    <SelectItem value="GMT" className="dark:text-gray-100 dark:hover:bg-gray-700">GMT (Greenwich Mean Time)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="language" className="text-sm font-medium text-blue-700 dark:text-blue-300">Language</Label>
                <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                  <SelectTrigger className="border-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="en" className="dark:text-gray-100 dark:hover:bg-gray-700">🇺🇸 English</SelectItem>
                    <SelectItem value="es" className="dark:text-gray-100 dark:hover:bg-gray-700">🇪🇸 Spanish</SelectItem>
                    <SelectItem value="fr" className="dark:text-gray-100 dark:hover:bg-gray-700">🇫🇷 French</SelectItem>
                    <SelectItem value="de" className="dark:text-gray-100 dark:hover:bg-gray-700">🇩🇪 German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Save Button for General Settings */}
            <div className="pt-6 border-t border-blue-100 dark:border-gray-600">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Account Settings */}
        <div className="space-y-6">
          {/* Change Username */}
          <Card className="hover:shadow-lg transition-all duration-200 border border-blue-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 border-b border-blue-100 dark:border-gray-600">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Change Username</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300">Update your account username (email)</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newUsername" className="text-sm text-blue-700 dark:text-blue-300">New Username (Email)</Label>
                  <Input
                    id="newUsername"
                    type="email"
                    placeholder="Enter new email address"
                    value={usernameForm.newUsername}
                    onChange={(e) => setUsernameForm({ ...usernameForm, newUsername: e.target.value })}
                    className="border-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmUsername" className="text-sm text-blue-700 dark:text-blue-300">Confirm Username (Email)</Label>
                  <Input
                    id="confirmUsername"
                    type="email"
                    placeholder="Confirm new email address"
                    value={usernameForm.confirmUsername}
                    onChange={(e) => setUsernameForm({ ...usernameForm, confirmUsername: e.target.value })}
                    className="border-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  onClick={handleUsernameChange}
                  disabled={!usernameForm.newUsername || !usernameForm.confirmUsername || usernameLoading}
                >
                  {usernameLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Username'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="hover:shadow-lg transition-all duration-200 border border-blue-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 border-b border-blue-100 dark:border-gray-600">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Change Password</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300">Update your account password</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm text-blue-700 dark:text-blue-300">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="border-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm text-blue-700 dark:text-blue-300">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="border-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  onClick={handlePasswordChange}
                  disabled={!passwordForm.newPassword || !passwordForm.confirmPassword || passwordLoading}
                >
                  {passwordLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        


      </div>

    </div>
  );
}
