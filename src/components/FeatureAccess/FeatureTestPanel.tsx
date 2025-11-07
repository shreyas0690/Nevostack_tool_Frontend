import React, { useState } from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const FeatureTestPanel: React.FC = () => {
  const { features, hasFeature, hasAnyFeature } = useFeatureAccess();
  const [testResults, setTestResults] = useState<any>(null);

  const runFeatureTests = () => {
    const results = {
      // Test individual features
      taskManagement: hasFeature('taskManagement'),
      leaveManagement: hasFeature('leaveManagement'),
      attendance: hasFeature('attendance'),
      analytics: hasFeature('analytics'),
      reports: hasFeature('reports'),
      meetings: hasFeature('meetings'),
      meetingScheduler: hasFeature('meetingScheduler'),
      
      // Test section access
      tasksSection: hasFeature('taskManagement'),
      leaveSection: hasFeature('leaveManagement'),
      attendanceSection: hasFeature('attendance'),
      analyticsSection: hasFeature('analytics'),
      reportsSection: hasFeature('reports'),
      meetingsSection: hasAnyFeature(['meetings', 'meetingScheduler']),
      
      // Test combinations
      anyMeetingFeature: hasAnyFeature(['meetings', 'meetingScheduler']),
      allBasicFeatures: hasAnyFeature(['attendance', 'leaveManagement', 'taskManagement']),
    };

    setTestResults(results);
  };

  const getSectionVisibility = (section: string, requiredFeatures: string[]) => {
    if (requiredFeatures.length === 0) return 'Always Visible';
    
    const hasAccess = requiredFeatures.some(feature => hasFeature(feature as any));
    return hasAccess ? 'Visible' : 'Hidden';
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Feature Test Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runFeatureTests} className="w-full">
          Run Feature Tests
        </Button>

        {testResults && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Individual Features:</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(testResults).slice(0, 7).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{key}</span>
                    <Badge variant={value ? "default" : "secondary"}>
                      {value ? 'True' : 'False'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Section Visibility:</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Tasks Section</span>
                  <Badge variant={testResults.tasksSection ? "default" : "destructive"}>
                    {testResults.tasksSection ? 'Visible' : 'Hidden'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Leave Section</span>
                  <Badge variant={testResults.leaveSection ? "default" : "destructive"}>
                    {testResults.leaveSection ? 'Visible' : 'Hidden'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Attendance Section</span>
                  <Badge variant={testResults.attendanceSection ? "default" : "destructive"}>
                    {testResults.attendanceSection ? 'Visible' : 'Hidden'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Analytics Section</span>
                  <Badge variant={testResults.analyticsSection ? "default" : "destructive"}>
                    {testResults.analyticsSection ? 'Visible' : 'Hidden'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Reports Section</span>
                  <Badge variant={testResults.reportsSection ? "default" : "destructive"}>
                    {testResults.reportsSection ? 'Visible' : 'Hidden'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Meetings Section</span>
                  <Badge variant={testResults.meetingsSection ? "default" : "destructive"}>
                    {testResults.meetingsSection ? 'Visible' : 'Hidden'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Feature Combinations:</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Any Meeting Feature</span>
                  <Badge variant={testResults.anyMeetingFeature ? "default" : "secondary"}>
                    {testResults.anyMeetingFeature ? 'True' : 'False'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Any Basic Feature</span>
                  <Badge variant={testResults.allBasicFeatures ? "default" : "secondary"}>
                    {testResults.allBasicFeatures ? 'True' : 'False'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeatureTestPanel;
