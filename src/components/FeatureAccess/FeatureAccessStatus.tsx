import React from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface FeatureAccessStatusProps {
  className?: string;
}

const FeatureAccessStatus: React.FC<FeatureAccessStatusProps> = ({ className }) => {
  const { features, isLoading, error } = useFeatureAccess();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Feature Access</CardTitle>
          <CardDescription>Loading company features...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Feature Access Error
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const featureList = [
    { key: 'attendance', label: 'Attendance Management', description: 'Track employee attendance and time' },
    { key: 'leaveManagement', label: 'Leave Management', description: 'Manage employee leave requests' },
    { key: 'taskManagement', label: 'Task Management', description: 'Create and assign tasks' },
    { key: 'meetings', label: 'Meetings', description: 'Schedule and manage meetings' },
    { key: 'meetingScheduler', label: 'Meeting Scheduler', description: 'Advanced meeting scheduling' },
    { key: 'analytics', label: 'Analytics', description: 'View detailed analytics and insights' },
    { key: 'reports', label: 'Reports', description: 'Generate and export reports' },
    { key: 'notifications', label: 'Notifications', description: 'Send notifications and alerts' },
    { key: 'deviceTracking', label: 'Device Tracking', description: 'Track employee devices' },
    { key: 'apiAccess', label: 'API Access', description: 'Access to API endpoints' },
    { key: 'customBranding', label: 'Custom Branding', description: 'Customize company branding' },
  ];

  const enabledFeatures = featureList.filter(feature => features[feature.key as keyof typeof features]);
  const disabledFeatures = featureList.filter(feature => !features[feature.key as keyof typeof features]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Company Features</CardTitle>
        <CardDescription>
          {enabledFeatures.length} of {featureList.length} features enabled
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enabled Features */}
        {enabledFeatures.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Enabled Features
            </h4>
            <div className="space-y-2">
              {enabledFeatures.map((feature) => (
                <div key={feature.key} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      {feature.label}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      {feature.description}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Enabled
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disabled Features */}
        {disabledFeatures.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Disabled Features
            </h4>
            <div className="space-y-2">
              {disabledFeatures.map((feature) => (
                <div key={feature.key} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      {feature.label}
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300">
                      {feature.description}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    Disabled
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Summary */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {enabledFeatures.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Enabled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {disabledFeatures.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Disabled</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureAccessStatus;

