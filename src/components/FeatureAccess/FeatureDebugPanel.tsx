import React from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const FeatureDebugPanel: React.FC = () => {
  const { features, isLoading, error } = useFeatureAccess();

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            Feature Debug Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading features...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-4 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Feature Debug Panel - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const featureList = [
    { key: 'attendance', label: 'Attendance Management' },
    { key: 'leaveManagement', label: 'Leave Management' },
    { key: 'taskManagement', label: 'Task Management' },
    { key: 'meetingScheduler', label: 'Meeting Scheduler' },
    { key: 'meetings', label: 'Meetings' },
    { key: 'deviceTracking', label: 'Device Tracking' },
    { key: 'reports', label: 'Reports' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'apiAccess', label: 'API Access' },
    { key: 'customBranding', label: 'Custom Branding' },
  ];

  const enabledFeatures = featureList.filter(feature => features[feature.key as keyof typeof features]);
  const disabledFeatures = featureList.filter(feature => !features[feature.key as keyof typeof features]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Feature Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Feature Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Enabled Features ({enabledFeatures.length})
            </h4>
            <div className="space-y-1">
              {enabledFeatures.map((feature) => (
                <div key={feature.key} className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">{feature.label}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Enabled
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Disabled Features ({disabledFeatures.length})
            </h4>
            <div className="space-y-1">
              {disabledFeatures.map((feature) => (
                <div key={feature.key} className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <span className="text-sm">{feature.label}</span>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    Disabled
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section Visibility */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Admin Panel Sections:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-green-50 rounded">
              <span className="font-medium text-green-800">✅ Always Visible:</span>
              <div>Dashboard, Departments, Users, Settings</div>
            </div>
            <div className="p-2 bg-yellow-50 rounded">
              <span className="font-medium text-yellow-800">⚠️ Feature Dependent:</span>
              <div>
                Tasks (taskManagement), Leave (leaveManagement), 
                Attendance (attendance), Analytics (analytics), 
                Reports (reports), Meetings (meetings/meetingScheduler)
              </div>
            </div>
          </div>
        </div>

        {/* Raw Data */}
        <details className="pt-2">
          <summary className="text-sm font-medium cursor-pointer">Raw Feature Data</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(features, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
};

export default FeatureDebugPanel;
