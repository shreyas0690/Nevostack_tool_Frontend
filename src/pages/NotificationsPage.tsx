import React from 'react';
import { NotificationList } from '@/components/Notifications/NotificationList';

export default function NotificationsPage() {
  return (
    <div className="container mx-auto py-6">
      <NotificationList 
        showFilters={true}
        showSearch={true}
        showBulkActions={true}
        itemsPerPage={20}
      />
    </div>
  );
}




