import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Clock,
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type Notification, type NotificationType, type NotificationPriority } from '@/services/notificationService';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onAction?: (notification: Notification) => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
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

const getPriorityBorderColor = (priority: NotificationPriority) => {
  const colorMap: Record<NotificationPriority, string> = {
    low: 'border-muted',
    medium: 'border-blue-500',
    high: 'border-orange-500',
    urgent: 'border-red-500'
  };
  
  return colorMap[priority] || 'border-blue-500';
};

export function NotificationToast({ 
  notification, 
  onClose, 
  onAction,
  autoClose = true,
  autoCloseDelay = 5000,
  position = 'top-right'
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const Icon = getNotificationIcon(notification.type);
  const priorityColor = getPriorityColor(notification.priority);
  const borderColor = getPriorityBorderColor(notification.priority);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto close
    if (autoClose) {
      const closeTimer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(closeTimer);
      };
    }
    
    return () => clearTimeout(timer);
  }, [autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleAction = () => {
    if (onAction) {
      onAction(notification);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    
    handleClose();
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div
      className={cn(
        "fixed z-50 max-w-sm w-full transition-all duration-300 ease-in-out",
        positionClasses[position],
        isVisible && !isClosing ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <Card className={cn(
        "shadow-lg border-l-4",
        borderColor,
        isClosing && "animate-out slide-out-to-right"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn("flex-shrink-0 mt-1", priorityColor)}>
              <Icon className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-semibold truncate">
                  {notification.title}
                </h4>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge 
                    variant={notification.priority === 'urgent' || notification.priority === 'high' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {notification.priority}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {notification.message}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
                
                {notification.actionUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAction}
                    className="h-7 text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {notification.actionText || 'View'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface NotificationToastContainerProps {
  notifications: Notification[];
  onClose: (id: string) => void;
  onAction?: (notification: Notification) => void;
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function NotificationToastContainer({ 
  notifications, 
  onClose, 
  onAction,
  maxToasts = 3,
  position = 'top-right'
}: NotificationToastContainerProps) {
  const visibleNotifications = notifications.slice(0, maxToasts);

  return (
    <div className="fixed z-50 pointer-events-none">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 20}px)`,
            zIndex: 50 - index
          }}
        >
          <NotificationToast
            notification={notification}
            onClose={() => onClose(notification.id)}
            onAction={onAction}
            position={position}
            autoClose={true}
            autoCloseDelay={5000}
          />
        </div>
      ))}
    </div>
  );
}




