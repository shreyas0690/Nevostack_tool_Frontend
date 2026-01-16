import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { mockUsers } from '@/data/mockData';
import {
  Timer,
  CalendarDays,
  CheckCircle2,
  User,
  Paperclip,
  File,
  Crown,
  Shield,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Target,
  Eye,
  Paperclip as PaperclipIcon,
  MessageCircle
} from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type TaskCardProps = {
  task: any;
  onUpdateStatus?: (id: string, status: string) => void;
  updatingTaskId?: string | null;
  departmentMembers?: any[];
  companyUsers?: any[];
  onDiscuss?: (task: any) => void;
};

export default function TaskCard({ task, onUpdateStatus, updatingTaskId, departmentMembers = [], companyUsers = [], onDiscuss }: TaskCardProps) {
  const [openDetails, setOpenDetails] = useState(false);

  const normalizeDate = (d: any) => {
    if (!d) return new Date(0);
    if (d instanceof Date) return d;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? new Date(0) : parsed;
  };

  const getTimeRemaining = (dueDate: any, now = new Date()) => {
    const due = normalizeDate(dueDate);
    const diff = due.getTime() - now.getTime();
    if (diff <= 0) {
      const overdueDiff = Math.abs(diff);
      const overdueDays = Math.floor(overdueDiff / (1000 * 60 * 60 * 24));
      const overdueHours = Math.floor((overdueDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (overdueDays > 0) return { text: `${overdueDays}d overdue`, color: 'text-red-600', isOverdue: true };
      if (overdueHours > 0) return { text: `${overdueHours}h overdue`, color: 'text-red-600', isOverdue: true };
      return { text: 'Overdue', color: 'text-red-600', isOverdue: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 7) return { text: `${days} days`, color: 'text-green-600', isOverdue: false };
    if (days > 2) return { text: `${days} days`, color: 'text-yellow-600', isOverdue: false };
    if (days > 0) return { text: `${days}d ${hours}h`, color: 'text-orange-600', isOverdue: false };
    if (hours > 2) return { text: `${hours}h ${minutes}m`, color: 'text-red-500', isOverdue: false };
    if (hours > 0) return { text: `${hours}h ${minutes}m`, color: 'text-red-600', isOverdue: false };
    if (minutes > 0) return { text: `${minutes}m`, color: 'text-red-600', isOverdue: false };
    return { text: '< 1m', color: 'text-red-600', isOverdue: false };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'blocked': return 'destructive';
      case 'assigned': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Timer className="h-4 w-4" />;
      case 'blocked': return <AlertCircle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getAssignedByIcon = (assignedByRole?: string) => {
    switch (assignedByRole) {
      case 'super_admin': return <Crown className="h-4 w-4" />;
      case 'department_head': return <Shield className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'manager': return <UserCheck className="h-4 w-4" />;
      case 'member': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getAssignedByColor = (assignedByRole?: string) => {
    switch (assignedByRole) {
      case 'super_admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'department_head': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'admin': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'manager': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'member': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatAssignedByRole = (assignedByRole?: string) => {
    if (!assignedByRole) return 'Unknown';
    switch (assignedByRole) {
      case 'super_admin': return 'Super Admin';
      case 'department_head': return 'HOD';
      case 'manager': return 'Manager';
      case 'admin': return 'Admin';
      case 'member': return 'Member';
      case 'staff': return 'Staff';
      default: return assignedByRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const resolveUserDisplay = (userField: any) => {
    if (!userField) return null;
    if (typeof userField === 'object') {
      const id = userField._id || userField.id || null;
      const name = userField.name || userField.fullName || ((userField.firstName || '') + ' ' + (userField.lastName || '')).trim() || userField.email || userField.username || null;
      return { id, name };
    }
    if (typeof userField === 'string') {
      // Try to find user in department members first
      const foundInDept = departmentMembers.find((m: any) => String(m.id) === String(userField) || String((m as any)._id) === String(userField));
      if (foundInDept) {
        return {
          id: foundInDept.id || (foundInDept as any)._id,
          name: foundInDept.name || (foundInDept as any).fullName || foundInDept.email
        };
      }

      // Try to find user in company users
      const foundInCompany = companyUsers.find((m: any) => String(m.id) === String(userField) || String((m as any)._id) === String(userField));
      if (foundInCompany) {
        return {
          id: foundInCompany.id || (foundInCompany as any)._id,
          name: foundInCompany.name || (foundInCompany as any).fullName || foundInCompany.email
        };
      }

      // Fallback to mock users
      const foundInMock = mockUsers.find((m: any) => String(m.id) === String(userField) || String((m as any)._id) === String(userField));
      if (foundInMock) {
        return {
          id: foundInMock.id || (foundInMock as any)._id,
          name: foundInMock.name || (foundInMock as any).fullName || (foundInMock as any).email
        };
      }

      return { id: userField, name: userField };
    }
    return null;
  };

  const assignedUsersArray: any[] = Array.isArray(task.assignedToList)
    ? task.assignedToList
    : Array.isArray(task.assignedTo)
      ? task.assignedTo
      : task.assignedTo
        ? [task.assignedTo]
        : [];
  const assignedUsersResolved = assignedUsersArray
    .map((u) => resolveUserDisplay(u))
    .filter(Boolean) as Array<{ id: any; name: string | null }>;
  const assignedUserResolved = assignedUsersResolved[0] || resolveUserDisplay(task.assignedTo);
  const assignedByResolved = resolveUserDisplay(task.assignedBy);
  const assignedNames = assignedUsersResolved.map(u => u.name).filter(Boolean).join(', ');
  const timeRemaining = getTimeRemaining(task.dueDate);

  const getCreatedDate = (createdAt: any) => {
    const created = normalizeDate(createdAt);
    return created.toLocaleDateString();
  };

  return (
    <Card key={task.id} className={`hover:shadow-md transition-shadow ${task.status === 'completed'
      ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
      : task.assignedByRole === 'super_admin'
        ? 'border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50/50 to-orange-50/50 dark:from-red-950/10 dark:to-orange-950/10'
        : timeRemaining.isOverdue
          ? 'border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50/50 to-red-50/50 dark:from-orange-950/10 dark:to-red-950/10'
          : ''
      }`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`font-semibold text-lg ${task.status === 'completed' ? 'text-green-700 dark:text-green-300' : ''}`}>
                {task.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500 inline mr-1" />}
                {task.title}
              </h3>
              <Badge variant={getPriorityColor(task.priority)} className="text-xs">{task.priority}</Badge>
              <Badge variant={getStatusColor(task.status)} className="text-xs flex items-center gap-1">{getStatusIcon(task.status)}{task.status.replace('_', ' ')}</Badge>
              {task.assignedByRole === 'super_admin' && (
                <Badge className={`text-xs flex items-center gap-1 ${getAssignedByColor(task.assignedByRole)}`}>
                  {getAssignedByIcon(task.assignedByRole)}
                  Super Admin Task
                </Badge>
              )}
              {task.status === 'completed' && (
                <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">✓ Completed</Badge>
              )}
            </div>
            <p className={`text-sm mb-4 ${task.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>{task.description}</p>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {updatingTaskId === String(task.id || task._id) ? (
              <div className="flex items-center gap-2 w-32 px-3 py-2 border rounded-md bg-muted">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                <span className="text-xs text-muted-foreground">Updating...</span>
              </div>
            ) : (
              <Select
                value={task.status}
                onValueChange={(value) => onUpdateStatus ? onUpdateStatus(String(task.id || task._id), value) : undefined}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Assigned to:</p>
              {assignedUsersResolved.length > 0 ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {(assignedUsersResolved[0].name || 'UN').split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {assignedUsersResolved.map(u => u.name).filter(Boolean).join(', ')}
                  </span>
                  {assignedUsersResolved.length > 1 && (
                    <Badge variant="secondary" className="text-[10px] px-2">
                      {assignedUsersResolved.length} members
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Created:</p>
              <p className="text-muted-foreground">{getCreatedDate(task.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Timer className={`h-4 w-4 ${task.status === 'completed' ? 'text-muted-foreground' : timeRemaining.color}`} />
            <div>
              <p className="font-medium">Due Date:</p>
              <div className="flex items-center gap-1">
                <p className="text-muted-foreground">{normalizeDate(task.dueDate).toLocaleDateString()}</p>
                {task.status !== 'completed' && (
                  <Badge
                    variant={timeRemaining.isOverdue ? "destructive" : "outline"}
                    className={`text-xs ${timeRemaining.color}`}
                  >
                    {timeRemaining.isOverdue ? '🚨 Overdue' : `⏰ ${timeRemaining.text}`}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getAssignedByIcon(task.assignedByRole)}
            <div>
              <p className="font-medium">Assigned by:</p>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground">{assignedByResolved?.name || 'Unknown'}</p>
                {/* <p className="text-muted-foreground">{getAssignedByName(task.assignedBy) || 'Unknown'}</p> */}

                <Badge className={`text-xs ${getAssignedByColor(task.assignedByRole)}`}>
                  {formatAssignedByRole(task.assignedByRole)}
                </Badge>

              </div>
            </div>
          </div>
        </div>

        {/* Attachments Section */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <PaperclipIcon className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium text-sm">Attachments ({task.attachments.length})</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {task.attachments.map((attachment: any) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md border text-xs"
                >
                  <File className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate max-w-32">{attachment.name}</span>
                  <span className="text-muted-foreground">({Math.round((attachment.size || 0) / 1024)}KB)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <div className="text-xs text-muted-foreground">
            Updated: {normalizeDate(task.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={openDetails} onOpenChange={setOpenDetails}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setOpenDetails(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Task Details
                  </DialogTitle>
                </DialogHeader>
                {task && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">Status</p>
                        <Badge variant={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium">Priority</p>
                        <Badge variant={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium">Assigned to</p>
                        <p className="text-sm">{assignedNames || resolveUserDisplay(task.assignedTo)?.name || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Due Date</p>
                        <p className="text-sm">{normalizeDate(task.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button variant="outline" onClick={() => setOpenDetails(false)}>
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            {onDiscuss && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onDiscuss(task)}
                className="flex items-center gap-1"
              >
                <MessageCircle className="h-4 w-4" />
                Team Discuss
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
