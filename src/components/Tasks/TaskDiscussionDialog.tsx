import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/types/company';
import TaskComments from './TaskComments';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CalendarDays, MessageCircle } from 'lucide-react';

type TaskDiscussionDialogProps = {
  open: boolean;
  task: Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'assignedTo' | 'dueDate' | 'comments'> | null;
  onClose: () => void;
  currentUserId?: string;
  currentUserRole?: string;
};

const formatAssignedTo = (assigned: any) => {
  if (!assigned) return 'Unassigned';
  if (Array.isArray(assigned)) {
    const names = assigned
      .map((a) => formatAssignedTo(a))
      .filter(Boolean)
      .join(', ');
    return names || 'Unassigned';
  }
  if (typeof assigned === 'string') return assigned;
  return assigned.name || assigned.fullName || assigned.email || 'Unassigned';
};

export default function TaskDiscussionDialog({ open, task, onClose, currentUserId, currentUserRole }: TaskDiscussionDialogProps) {
  const assignedInitials = (formatAssignedTo((task as any)?.assignedToList && (task as any)?.assignedToList.length ? (task as any)?.assignedToList : task?.assignedTo) || '??')
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={(state) => {
      if (!state) onClose();
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-red-500" />
            Task Discussion
          </DialogTitle>
        </DialogHeader>

        {task ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-900/40">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Discussing</p>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{task.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{task.status?.replace('_', ' ')}</Badge>
                  <Badge variant="outline" className="capitalize">{task.priority}</Badge>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{assignedInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Assigned To</p>
                    <p className="font-medium">
                      {formatAssignedTo((task as any).assignedToList && (task as any).assignedToList.length ? (task as any).assignedToList : task.assignedTo)}
                    </p>
                  </div>
                </div>
                {task.dueDate && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Due Date</p>
                      <p className="font-medium">{new Date(task.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <TaskComments
              taskId={task.id}
              initialComments={Array.isArray(task.comments) ? task.comments : undefined}
              isOpen={open}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No task selected.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
