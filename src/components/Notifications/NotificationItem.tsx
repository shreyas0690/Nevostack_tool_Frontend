import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Info, 
  X, 
  ExternalLink,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Bell,
  Gift,
  Cake,
  Briefcase,
  Shield,
  Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { type Notification, type NotificationType, type NotificationPriority } from '@/services/notificationService';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
  showActions?: boolean;
  compact?: boolean;
}

const getNotificationIcon = (type: NotificationType) => {
  const iconMap: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
    task_assigned: FileText,
    task_updated: FileText,
    task_completed: CheckCircle,
    task_overdue: AlertCircle,
    meeting_scheduled: Calendar,
    meeting_reminder: Clock,
    meeting_cancelled: X,
    leave_request: User,
    leave_approved: CheckCircle,
    leave_rejected: X,
    attendance_reminder: Clock,
    system_notification: Bell,
    announcement: Megaphone,
    birthday_reminder: Cake,
    work_anniversary: Gift,
    holiday_reminder: Calendar,
    policy_update: Shield,
    other: Info
  };
  
  return iconMap[type] || Info;
};

const getPriorityColor = (priority: NotificationPriority) => {
  const colorMap: Record<NotificationPriority, string> = {
    low: 'text-muted-foreground',
    medium: 'text-blue-600',
    high: 'text-orange-600',
    urgent: 'text-red-600'
  };
  
  return colorMap[priority] || 'text-blue-600';
};

const getPriorityBadgeVariant = (priority: NotificationPriority) => {
  const variantMap: Record<NotificationPriority, 'secondary' | 'default' | 'destructive'> = {
    low: 'secondary',
    medium: 'default',
    high: 'destructive',
    urgent: 'destructive'
  };
  
  return variantMap[priority] || 'default';
};

export function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  onClick,
  showActions = true,
  compact = false
}: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.type);
  const priorityColor = getPriorityColor(notification.priority);
  const priorityVariant = getPriorityBadgeVariant(notification.priority);

  const handleClick = () => {
    onClick(notification);
    
    // Navigate to action URL if provided
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(notification.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
          !notification.isRead && "bg-blue-50 border-l-4 border-l-blue-500"
        )}
        onClick={handleClick}
      >
        <div className={cn("flex-shrink-0 mt-0.5", priorityColor)}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              "text-sm font-medium truncate",
              !notification.isRead && "font-semibold"
            )}>
              {notification.title}
            </p>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge variant={priorityVariant} className="text-xs">
                {notification.priority}
              </Badge>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            
            {showActions && (
              <div className="flex items-center gap-1">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAsRead}
                    className="h-6 w-6 p-0"
                  >
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        !notification.isRead && "border-l-4 border-l-blue-500 bg-blue-50/50"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("flex-shrink-0 mt-1", priorityColor)}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className={cn(
                "text-sm font-medium",
                !notification.isRead && "font-semibold"
              )}>
                {notification.title}
              </h4>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={priorityVariant} className="text-xs">
                  {notification.priority}
                </Badge>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
                
                {notification.sender && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>
                      {notification.sender.firstName} {notification.sender.lastName}
                    </span>
                  </div>
                )}
              </div>
              
              {notification.actionUrl && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {notification.actionText || 'View'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {showActions && (
            <div className="flex flex-col gap-1">
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAsRead}
                  className="h-8 w-8 p-0"
                  title="Mark as read"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                title="Delete notification"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}




