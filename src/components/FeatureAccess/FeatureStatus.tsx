import React from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

const FeatureStatus: React.FC = () => {
  const { features, isLoading, error } = useFeatureAccess();

  console.log('🔍 FeatureStatus component rendered');
  console.log('🔍 Features:', features);
  console.log('🔍 IsLoading:', isLoading);
  console.log('🔍 Error:', error);

  if (isLoading) {
    return <div className="p-2 bg-blue-100 rounded">Loading features...</div>;
  }

  if (error) {
    return <div className="p-2 bg-red-100 rounded">Error: {error}</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-green-50">
      <h3 className="font-bold mb-2">Current Features Status</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>Task Management: {features.taskManagement ? '✅' : '❌'}</div>
        <div>Leave Management: {features.leaveManagement ? '✅' : '❌'}</div>
        <div>Attendance: {features.attendance ? '✅' : '❌'}</div>
        <div>Analytics: {features.analytics ? '✅' : '❌'}</div>
        <div>Reports: {features.reports ? '✅' : '❌'}</div>
        <div>Meetings: {features.meetings ? '✅' : '❌'}</div>
      </div>
    </div>
  );
};

export default FeatureStatus;
