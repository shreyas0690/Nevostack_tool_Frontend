import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ClipboardList, 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  MoreVertical,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Filter
} from 'lucide-react';
import { mockTasks, mockUsers, mockDepartments, currentUser } from '@/data/mockData';
import { Task, User, Department, TaskStatus, TaskPriority } from '@/types/company';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import AddTaskDialog from './AddTaskDialog';
import EditTaskDialog from './EditTaskDialog';
import MeetingDialog from './MeetingDialog';

export default function TasksManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { toast } = useToast();

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesDepartment = departmentFilter === 'all' || task.departmentId === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
  });

  const getUser = (userId: string): User | undefined => {
    return mockUsers.find(user => user.id === userId);
  };

  const getDepartment = (deptId: string): Department | undefined => {
    return mockDepartments.find(dept => dept.id === deptId);
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'blocked': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-orange-600" />;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setTasks([...tasks, newTask]);
    toast({
      title: "Task Created",
      description: `${taskData.title} has been assigned successfully.`,
    });
  };

  const editTask = (id: string, taskData: Omit<Task, 'id' | 'createdAt' | 'comments'>) => {
    setTasks(tasks.map(task => 
      task.id === id 
        ? { 
            ...task, 
            ...taskData,
            updatedAt: new Date()
          }
        : task
    ));
    toast({
      title: "Task Updated",
      description: `${taskData.title} has been updated successfully.`,
    });
  };

  const deleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks(tasks.filter(task => task.id !== id));
    toast({
      title: "Task Deleted",
      description: `${task?.title} has been deleted successfully.`,
      variant: "destructive",
    });
  };

  const quickUpdateStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus, updatedAt: new Date() }
        : task
    ));
    toast({
      title: "Status Updated",
      description: `Task status updated to ${newStatus.replace('_', ' ')}.`,
    });
  };

  const stats = [
    {
      title: 'Total Tasks',
      value: tasks.length,
      icon: ClipboardList,
      color: 'text-blue-600'
    },
    {
      title: 'In Progress',
      value: tasks.filter(t => t.status === 'in_progress').length,
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'Completed',
      value: tasks.filter(t => t.status === 'completed').length,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Overdue',
      value: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
      icon: AlertCircle,
      color: 'text-red-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Task Management</h1>
          <p className="text-muted-foreground">Manage and track team tasks and assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowMeetingDialog(true)}>
            <Users className="w-4 h-4 mr-2" />
            Schedule Meeting
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {mockDepartments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tasks found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || departmentFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Get started by creating your first task'}
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => {
            const assignedUser = getUser(task.assignedTo);
            const assignedByUser = getUser(task.assignedBy);
            const department = getDepartment(task.departmentId);
            const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
            
            return (
              <Card key={task.id} className={`${isOverdue ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            {task.title}
                            {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border shadow-md">
                            <DropdownMenuItem onClick={() => {
                              setSelectedTask(task);
                              setShowEditDialog(true);
                            }}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Task
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => quickUpdateStatus(task.id, 'completed')} disabled={task.status === 'completed'}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedTask(task);
                              setShowDeleteDialog(true);
                            }} className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge variant="outline">
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        {department && (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: department.color }}
                            />
                            <span className="text-muted-foreground">{department.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm bg-muted/20 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <div>
                            <span className="text-blue-600 font-medium" style={{ fontSize: '12px' }}>
                              Assigned: {task.createdAt.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className={`${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`} style={{ fontSize: '12px' }}>
                              Due: {task.dueDate.toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {assignedByUser && (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-4 h-4">
                              <AvatarFallback className="text-xs">
                                {assignedByUser.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-green-600 font-medium" style={{ fontSize: '12px' }}>
                              By: {assignedByUser.name}
                            </span>
                          </div>
                        )}
                      </div>
                      
                       {/* Meeting Information */}
                       {task.meeting?.enabled && (
                         <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg space-y-2">
                           <div className="flex items-center gap-2">
                             <Users className="w-4 h-4 text-blue-600" />
                             <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                               Meeting Scheduled
                             </span>
                           </div>
                           <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                             {task.meeting.meetingDate && (
                               <div className="flex items-center gap-1">
                                 <Calendar className="w-3 h-3" />
                                 {task.meeting.meetingDate.toLocaleDateString()}
                                 {task.meeting.meetingTime && ` at ${task.meeting.meetingTime}`}
                               </div>
                             )}
                             {task.meeting.meetingLocation && (
                               <div className="flex items-center gap-1">
                                 <Badge variant="outline" className="text-xs">
                                   📍 {task.meeting.meetingLocation}
                                 </Badge>
                               </div>
                             )}
                           </div>
                           <div className="flex flex-wrap gap-1">
                             {task.meeting.type === 'department' && task.meeting.selectedDepartments?.map(deptId => {
                               const dept = mockDepartments.find(d => d.id === deptId);
                               return dept ? (
                                 <Badge key={deptId} variant="secondary" className="text-xs">
                                   {dept.name}
                                 </Badge>
                               ) : null;
                             })}
                             {task.meeting.type === 'user' && task.meeting.selectedUsers?.map(userId => {
                               const user = mockUsers.find(u => u.id === userId);
                               return user ? (
                                 <Badge key={userId} variant="secondary" className="text-xs">
                                   {user.name}
                                 </Badge>
                               ) : null;
                             })}
                           </div>
                           {task.meeting.meetingLink && (
                             <div className="pt-1">
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 className="h-6 text-xs"
                                 onClick={() => window.open(task.meeting?.meetingLink, '_blank')}
                               >
                                 🔗 Join Meeting
                               </Button>
                             </div>
                           )}
                         </div>
                       )}

                       <div className="flex items-center justify-between pt-2 border-t">
                         <div className="flex items-center gap-4">
                           {assignedUser && (
                             <div className="flex items-center gap-2">
                               <Avatar className="w-6 h-6">
                                 <AvatarFallback className="text-xs">
                                   {assignedUser.name.charAt(0).toUpperCase()}
                                 </AvatarFallback>
                               </Avatar>
                               <span className="text-sm">
                                 Assigned to: <span className="font-medium">{assignedUser.name}</span>
                               </span>
                             </div>
                           )}
                           
                           {assignedByUser && (
                             <span className="text-xs text-muted-foreground">
                               by {assignedByUser.name}
                             </span>
                           )}
                         </div>
                         
                         <div className="flex gap-2">
                           <Select value={task.status} onValueChange={(value: TaskStatus) => quickUpdateStatus(task.id, value)}>
                             <SelectTrigger className="w-32 h-8">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="assigned">Assigned</SelectItem>
                               <SelectItem value="in_progress">In Progress</SelectItem>
                               <SelectItem value="completed">Completed</SelectItem>
                               <SelectItem value="blocked">Blocked</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialogs */}
      <AddTaskDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={addTask}
        currentUserId={currentUser.id}
      />

      <EditTaskDialog
        open={showEditDialog}
        task={selectedTask}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedTask(null);
        }}
        onSave={editTask}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              "{selectedTask?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setSelectedTask(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedTask) {
                  deleteTask(selectedTask.id);
                }
                setShowDeleteDialog(false);
                setSelectedTask(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MeetingDialog
        open={showMeetingDialog}
        onClose={() => setShowMeetingDialog(false)}
      />
    </div>
  );
}