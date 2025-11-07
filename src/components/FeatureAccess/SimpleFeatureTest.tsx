import React from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

const SimpleFeatureTest: React.FC = () => {
  const { features, hasFeature, hasAnyFeature, isLoading } = useFeatureAccess();

  if (isLoading) {
    return <div>Loading features...</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-bold mb-4">Simple Feature Test</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Task Management:</strong> {features.taskManagement ? '✅ Enabled' : '❌ Disabled'}
          <span className="ml-2 text-sm">(Should hide Tasks section if false)</span>
        </div>
        
        <div>
          <strong>Leave Management:</strong> {features.leaveManagement ? '✅ Enabled' : '❌ Disabled'}
          <span className="ml-2 text-sm">(Should hide Leave section if false)</span>
        </div>
        
        <div>
          <strong>Attendance:</strong> {features.attendance ? '✅ Enabled' : '❌ Disabled'}
          <span className="ml-2 text-sm">(Should hide Attendance section if false)</span>
        </div>
        
        <div>
          <strong>Analytics:</strong> {features.analytics ? '✅ Enabled' : '❌ Disabled'}
          <span className="ml-2 text-sm">(Should hide Analytics section if false)</span>
        </div>
        
        <div>
          <strong>Reports:</strong> {features.reports ? '✅ Enabled' : '❌ Disabled'}
          <span className="ml-2 text-sm">(Should hide Reports section if false)</span>
        </div>
        
        <div>
          <strong>Meetings:</strong> {features.meetings ? '✅ Enabled' : '❌ Disabled'}
          <span className="ml-2 text-sm">(Should hide Meetings section if false)</span>
        </div>
      </div>
      
      <div className="mt-4 p-2 bg-blue-100 rounded">
        <strong>Expected Sidebar Sections:</strong>
        <ul className="mt-1 text-sm">
          <li>✅ Dashboard (always visible)</li>
          <li>✅ Departments (always visible)</li>
          <li>✅ Users (always visible)</li>
          <li>✅ Settings (always visible)</li>
          <li>{features.taskManagement ? '✅' : '❌'} Tasks (requires taskManagement)</li>
          <li>{features.leaveManagement ? '✅' : '❌'} Leave (requires leaveManagement)</li>
          <li>{features.attendance ? '✅' : '❌'} Attendance (requires attendance)</li>
          <li>{features.analytics ? '✅' : '❌'} Analytics (requires analytics)</li>
          <li>{features.reports ? '✅' : '❌'} Reports (requires reports)</li>
          <li>{hasAnyFeature(['meetings', 'meetingScheduler']) ? '✅' : '❌'} Meetings (requires meetings OR meetingScheduler)</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleFeatureTest;
