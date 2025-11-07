import React from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FEATURE_SECTION_MAP } from '@/hooks/useFeatureAccess';

const ExpectedSections: React.FC = () => {
  const { features, hasFeature, hasAnyFeature } = useFeatureAccess();

  const getSectionStatus = (section: string) => {
    const requiredFeatures = FEATURE_SECTION_MAP[section];
    
    if (requiredFeatures.length === 0) {
      return { visible: true, reason: 'Always visible' };
    }
    
    const hasAccess = hasAnyFeature(requiredFeatures);
    return {
      visible: hasAccess,
      reason: hasAccess 
        ? `Has feature: ${requiredFeatures.find(f => hasFeature(f))}`
        : `Missing features: ${requiredFeatures.join(', ')}`
    };
  };

  const sections = [
    'dashboard',
    'tasks', 
    'departments',
    'users',
    'meetings',
    'leave',
    'attendance',
    'analytics',
    'reports',
    'settings'
  ];

  return (
    <div className="p-4 border rounded-lg bg-blue-50">
      <h3 className="font-bold mb-4">Expected Sidebar Sections</h3>
      
      <div className="space-y-2">
        {sections.map(section => {
          const status = getSectionStatus(section);
          return (
            <div key={section} className="flex items-center justify-between p-2 bg-white rounded">
              <div>
                <span className="font-medium capitalize">{section}</span>
                <div className="text-xs text-gray-600">{status.reason}</div>
              </div>
              <div className={`px-2 py-1 rounded text-xs ${
                status.visible 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {status.visible ? '✅ Visible' : '❌ Hidden'}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 p-2 bg-gray-100 rounded text-sm">
        <strong>Current Features:</strong>
        <div className="grid grid-cols-2 gap-1 mt-1">
          <div>Task Management: {features.taskManagement ? '✅' : '❌'}</div>
          <div>Leave Management: {features.leaveManagement ? '✅' : '❌'}</div>
          <div>Attendance: {features.attendance ? '✅' : '❌'}</div>
          <div>Analytics: {features.analytics ? '✅' : '❌'}</div>
          <div>Reports: {features.reports ? '✅' : '❌'}</div>
          <div>Meetings: {features.meetings ? '✅' : '❌'}</div>
        </div>
      </div>
    </div>
  );
};

export default ExpectedSections;
