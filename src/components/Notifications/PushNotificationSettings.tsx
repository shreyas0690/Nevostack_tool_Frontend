import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, TestTube, Settings, Shield, AlertTriangle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushNotificationSettingsProps {
  settings: {
    push: {
      taskReminders: boolean;
      meetingAlerts: boolean;
      deadlineAlerts: boolean;
      teamUpdates: boolean;
    };
  };
  onSettingsChange: (settings: any) => void;
}

export default function PushNotificationSettings({ settings, onSettingsChange }: PushNotificationSettingsProps) {
  const {
    isSupported,
    subscription,
    isSubscribed,
    permission,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification
  } = usePushNotifications();

  const handlePermissionRequest = async () => {
    const granted = await requestPermission();
    if (granted) {
      await subscribe();
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Enabled</Badge>;
      case 'denied':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="outline">Not Set</Badge>;
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Push notifications are not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Permission Status</span>
              {getPermissionBadge()}
            </div>
            <p className="text-sm text-muted-foreground">
              {permission === 'granted' 
                ? 'You can receive push notifications' 
                : permission === 'denied'
                ? 'Notifications are blocked. Enable them in browser settings.'
                : 'Click to enable push notifications'
              }
            </p>
          </div>
          <div className="flex gap-2">
            {permission !== 'granted' && (
              <Button onClick={handlePermissionRequest} size="sm">
                Enable Notifications
              </Button>
            )}
            {permission === 'granted' && !isSubscribed && (
              <Button onClick={subscribe} size="sm">
                Subscribe
              </Button>
            )}
            {isSubscribed && (
              <Button onClick={unsubscribe} variant="outline" size="sm">
                Unsubscribe
              </Button>
            )}
          </div>
        </div>

        {/* Test Notification */}
        {permission === 'granted' && (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                <span className="font-medium">Test Notification</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Send a test notification to verify everything is working
              </p>
            </div>
            <Button onClick={sendTestNotification} variant="outline" size="sm">
              Send Test
            </Button>
          </div>
        )}

        {/* Notification Preferences */}
        {permission === 'granted' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-4 w-4" />
              <span className="font-medium">Notification Preferences</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="taskReminders">Task Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about upcoming task deadlines
                  </p>
                </div>
                <Switch
                  id="taskReminders"
                  checked={settings.push.taskReminders}
                  onCheckedChange={(checked) =>
                    onSettingsChange({
                      ...settings,
                      push: { ...settings.push, taskReminders: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="meetingAlerts">Meeting Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about upcoming meetings
                  </p>
                </div>
                <Switch
                  id="meetingAlerts"
                  checked={settings.push.meetingAlerts}
                  onCheckedChange={(checked) =>
                    onSettingsChange({
                      ...settings,
                      push: { ...settings.push, meetingAlerts: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="deadlineAlerts">Deadline Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about approaching deadlines
                  </p>
                </div>
                <Switch
                  id="deadlineAlerts"
                  checked={settings.push.deadlineAlerts}
                  onCheckedChange={(checked) =>
                    onSettingsChange({
                      ...settings,
                      push: { ...settings.push, deadlineAlerts: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="teamUpdates">Team Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about team announcements and updates
                  </p>
                </div>
                <Switch
                  id="teamUpdates"
                  checked={settings.push.teamUpdates}
                  onCheckedChange={(checked) =>
                    onSettingsChange({
                      ...settings,
                      push: { ...settings.push, teamUpdates: checked }
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Subscription Info */}
        {isSubscribed && subscription && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Subscription Active</h4>
            <p className="text-sm text-muted-foreground">
              Your device is registered to receive push notifications.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}