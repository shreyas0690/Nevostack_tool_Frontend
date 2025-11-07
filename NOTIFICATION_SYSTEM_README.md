# Notification System Documentation

## Overview

The notification system is a comprehensive solution for managing real-time notifications in the NevoStack application. It includes both backend APIs and frontend components for creating, displaying, and managing notifications.

## Features

### Backend Features
- ✅ Comprehensive notification model with multiple channels (in-app, email, push, SMS)
- ✅ Advanced filtering and pagination
- ✅ Bulk notification creation
- ✅ Notification tracking (clicks, reads, delivery status)
- ✅ Priority-based notifications
- ✅ Expiration and cleanup
- ✅ Company and user isolation
- ✅ Rich metadata support

### Frontend Features
- ✅ Notification bell with unread count
- ✅ Real-time notification toasts
- ✅ Full notification management page
- ✅ Advanced filtering and search
- ✅ Bulk actions (mark as read, delete)
- ✅ WebSocket integration for real-time updates
- ✅ Context-based state management
- ✅ Responsive design

## Architecture

### Backend Components

#### 1. Notification Model (`backend/models/Notification.js`)
```javascript
{
  recipient: ObjectId, // User who receives the notification
  sender: ObjectId,    // User who sent the notification
  companyId: ObjectId, // Company context
  type: String,        // Notification type (task_assigned, meeting_scheduled, etc.)
  title: String,       // Notification title
  message: String,     // Notification message
  priority: String,    // low, medium, high, urgent
  status: String,      // pending, sent, delivered, read, failed
  channels: Object,    // Delivery channels configuration
  data: Object,        // Additional data
  actionUrl: String,   // URL to navigate to when clicked
  actionText: String,  // Text for action button
  expiresAt: Date,     // Expiration date
  isRead: Boolean,     // Read status
  readAt: Date,        // When it was read
  clickCount: Number,  // Number of clicks
  metadata: Object     // Additional metadata
}
```

#### 2. API Endpoints (`backend/routes/notifications.js`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications with filtering |
| POST | `/api/notifications` | Create a notification |
| PATCH | `/api/notifications/:id/read` | Mark notification as read |
| PATCH | `/api/notifications/read-all` | Mark all notifications as read |
| GET | `/api/notifications/unread-count` | Get unread count |
| POST | `/api/notifications/bulk` | Create bulk notifications |
| DELETE | `/api/notifications/:id` | Delete notification |
| PATCH | `/api/notifications/:id/click` | Track notification click |

### Frontend Components

#### 1. Core Components

**NotificationBell** - Bell icon with unread count and dropdown
```tsx
<NotificationBell 
  showCount={true}
  maxNotifications={5}
  className="custom-class"
/>
```

**NotificationList** - Full notification management page
```tsx
<NotificationList 
  showFilters={true}
  showSearch={true}
  showBulkActions={true}
  itemsPerPage={20}
/>
```

**NotificationToast** - Real-time notification toasts
```tsx
<NotificationToast
  notification={notification}
  onClose={handleClose}
  onAction={handleAction}
  autoClose={true}
  autoCloseDelay={5000}
/>
```

#### 2. Services

**NotificationService** - API service for notifications
```typescript
import { notificationService } from '@/services/notificationService';

// Get notifications
const notifications = await notificationService.getNotifications({
  page: 1,
  limit: 20,
  unreadOnly: false,
  type: 'task_assigned'
});

// Create notification
const notification = await notificationService.createNotification({
  recipient: 'user-id',
  title: 'New Task Assigned',
  message: 'You have been assigned a new task',
  type: 'task_assigned',
  priority: 'medium'
});
```

**WebSocketService** - Real-time communication
```typescript
import { websocketService } from '@/services/websocketService';

// Connect to WebSocket
await websocketService.connect({
  url: 'ws://localhost:5000',
  token: 'jwt-token',
  userId: 'user-id',
  companyId: 'company-id'
});

// Listen for notifications
websocketService.onNotification((notification) => {
  console.log('New notification:', notification);
});
```

#### 3. Hooks

**useNotification** - Hook for creating notifications
```typescript
import { useNotification } from '@/hooks/useNotification';

const { createTaskNotification, createMeetingNotification } = useNotification();

// Create task notification
await createTaskNotification(
  'user-id',
  'Complete project report',
  'task_assigned',
  'task-id'
);
```

**useWebSocket** - Hook for WebSocket management
```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

const { isConnected, joinRoom, leaveRoom } = useWebSocket({
  url: 'ws://localhost:5000',
  token: 'jwt-token',
  userId: 'user-id',
  companyId: 'company-id'
});
```

## Usage Examples

### 1. Basic Integration

```tsx
import React from 'react';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { NotificationSystem } from '@/components/Notifications/NotificationSystem';

function App() {
  return (
    <NotificationProvider>
      <div className="app">
        {/* Your app content */}
        
        {/* Add notification system */}
        <NotificationSystem 
          showBell={true}
          showToasts={true}
          maxToasts={3}
        />
      </div>
    </NotificationProvider>
  );
}
```

### 2. Creating Notifications

```tsx
import { useNotification } from '@/hooks/useNotification';

function TaskComponent() {
  const { createTaskNotification } = useNotification();

  const handleAssignTask = async (task, assigneeId) => {
    // Assign task logic...
    
    // Create notification
    await createTaskNotification(
      assigneeId,
      task.title,
      'task_assigned',
      task.id
    );
  };

  return (
    // Your component JSX
  );
}
```

### 3. Custom Notification Types

```tsx
import { useNotification } from '@/hooks/useNotification';

function CustomComponent() {
  const { createNotification } = useNotification();

  const handleCustomEvent = async () => {
    await createNotification({
      recipient: 'user-id',
      title: 'Custom Event',
      message: 'Something important happened',
      type: 'other',
      priority: 'high',
      actionUrl: '/custom-page',
      actionText: 'View Details',
      data: { customData: 'value' }
    });
  };

  return (
    // Your component JSX
  );
}
```

## Notification Types

The system supports the following notification types:

### Task Notifications
- `task_assigned` - New task assigned to user
- `task_updated` - Task has been updated
- `task_completed` - Task has been completed
- `task_overdue` - Task is overdue

### Meeting Notifications
- `meeting_scheduled` - New meeting scheduled
- `meeting_reminder` - Meeting reminder
- `meeting_cancelled` - Meeting cancelled

### Leave Notifications
- `leave_request` - New leave request
- `leave_approved` - Leave request approved
- `leave_rejected` - Leave request rejected

### System Notifications
- `attendance_reminder` - Attendance reminder
- `system_notification` - General system notification
- `announcement` - Company announcement
- `birthday_reminder` - Birthday reminder
- `work_anniversary` - Work anniversary
- `holiday_reminder` - Holiday reminder
- `policy_update` - Policy update
- `other` - Other notifications

## Priority Levels

- `low` - Low priority (gray)
- `medium` - Medium priority (blue)
- `high` - High priority (orange)
- `urgent` - Urgent priority (red)

## Configuration

### Environment Variables

```env
# WebSocket URL
REACT_APP_WEBSOCKET_URL=ws://localhost:5000

# API Base URL
REACT_APP_API_URL=http://localhost:5000/api
```

### Backend Configuration

```javascript
// In your backend server.js
const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', authenticateToken, notificationRoutes);
```

## WebSocket Integration

The system supports real-time notifications via WebSocket:

1. **Connection**: Automatically connects when user logs in
2. **Rooms**: Joins user, company, and department rooms
3. **Events**: Listens for new notifications, updates, and deletions
4. **Reconnection**: Automatic reconnection with exponential backoff

## Best Practices

### 1. Notification Creation
- Use appropriate notification types
- Set correct priority levels
- Include action URLs when relevant
- Keep messages concise and clear

### 2. User Experience
- Don't overwhelm users with too many notifications
- Use appropriate priority levels
- Provide clear action buttons
- Allow users to manage notification preferences

### 3. Performance
- Use pagination for large notification lists
- Implement proper cleanup for expired notifications
- Use WebSocket for real-time updates
- Cache frequently accessed data

### 4. Security
- Validate all notification data
- Ensure users can only access their own notifications
- Use proper authentication for WebSocket connections
- Sanitize notification content

## Troubleshooting

### Common Issues

1. **Notifications not appearing**
   - Check WebSocket connection
   - Verify user authentication
   - Check notification filters

2. **WebSocket connection issues**
   - Verify WebSocket URL
   - Check authentication token
   - Ensure server supports WebSocket

3. **Performance issues**
   - Implement pagination
   - Use proper indexing
   - Clean up expired notifications

### Debug Mode

Enable debug mode in development:

```tsx
<NotificationSystem 
  enableWebSocket={true}
  // Shows connection status in development
/>
```

## Future Enhancements

- [ ] Email notification templates
- [ ] Push notification support
- [ ] SMS notification integration
- [ ] Notification preferences/settings
- [ ] Notification analytics
- [ ] Advanced filtering options
- [ ] Notification scheduling
- [ ] Multi-language support

## Support

For issues or questions about the notification system, please check:
1. This documentation
2. Console logs for errors
3. Network tab for API issues
4. WebSocket connection status




