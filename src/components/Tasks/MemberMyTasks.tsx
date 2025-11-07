import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Search,
  Filter,
  Play,
  Pause,
  Check,
  Timer,
  Paperclip,
  Flag,
  Eye,
  Edit,
  Star,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { mockTasks, mockUsers, mockDepartments } from '@/data/mockData';

export default function MemberMyTasks() {
  const { currentUser } = useAuth();
  const userDeptId = currentUser?.departmentId ?? (currentUser as any)?.deptId ?? (currentUser as any)?.department_id;
  const userDepartment = userDeptId ? mockDepartments.find(d => String(d.id) === String(userDeptId) || String((d as any)._id) === String(userDeptId)) : null;
  const [tasks, setTasks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('active');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real tasks assigned to the current member
  const { data: myTasksData = [], isLoading, refetch } = useQuery({
    queryKey: ['tasks', 'member-my-tasks', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        const res: any = await taskService.getTasks(1, 1000, { assignedTo: String(currentUser.id) });
        let arr: any[] = [];
        if (Array.isArray(res)) arr = res;
        else if (Array.isArray(res?.tasks)) arr = res.tasks;
        else if (Array.isArray(res?.data)) arr = res.data;
        else if (Array.isArray(res?.data?.tasks)) arr = res.data.tasks;
        else arr = [];

        const normalized = arr.map((t: any) => ({
          ...t,
          id: t.id || t._id,
          dueDate: t.dueDate ? new Date(t.dueDate) : new Date(),
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
        })) as any[];

        return normalized as any;
      } catch (e) {
        console.warn('MemberMyTasks: failed to fetch my tasks', e);
        return [];
      }
    },
    enabled: !!currentUser,
  });

  useEffect(() => { setTasks(Array.isArray(myTasksData) ? (myTasksData as any[]) : []); }, [myTasksData]);

  // Get tasks assigned TO the current member (robust across id/object shapes)
  const myTasks = tasks.filter(t => {
    const tid = typeof t.assignedTo === 'string' ? t.assignedTo : (t.assignedTo && (t.assignedTo._id || t.assignedTo.id));
    return String(tid) === String(currentUser?.id);
  });

  // Filter tasks
  const filteredTasks = myTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    // Tab filtering
    const matchesTab = activeTab === 'all' ||
                      (activeTab === 'active' && task.status !== 'completed' && task.status !== 'blocked') ||
                      (activeTab === 'blocked' && task.status === 'blocked') ||
                      (activeTab === 'completed' && task.status === 'completed') ||
                      (activeTab === 'overdue' && task.dueDate < new Date() && task.status !== 'completed' && task.status !== 'blocked');
    
    return matchesSearch && matchesStatus && matchesPriority && matchesTab;
  });

  // Task categories
  const activeTasks = myTasks.filter(t => t.status !== 'completed' && t.status !== 'blocked');
  const completedTasks = myTasks.filter(t => t.status === 'completed');
  const overdueTasks = myTasks.filter(t => t.dueDate < new Date() && t.status !== 'completed' && t.status !== 'blocked');
  const blockedTasks = myTasks.filter(t => t.status === 'blocked');

  // Update task status (persist to backend and optimistic UI)
  const updateTaskStatus = async (taskId: string, newStatus: any) => {
    // Optimistic update
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? ({ ...task, status: newStatus as any, updatedAt: new Date() } as any)
        : task
    ));

    try {
      await taskService.updateTaskStatus(String(taskId), newStatus as any);
      // Refresh list from server to ensure consistency
      try { refetch && (await refetch()); } catch(e) { /* ignore */ }
    } catch (err) {
      console.error('MemberMyTasks: failed to update status', err);
      // Revert optimistic change on error by refetching
      try { refetch && (await refetch()); } catch(e) { /* ignore */ }
    }
  };

  // Resolve user-like values (id string or object) to a display object { id, name, role }
  const resolveUserDisplay = (userField: any) => {
    if (!userField) return null;
    if (typeof userField === 'object') {
      const uf: any = userField;
      const id = uf._id || uf.id || null;
      const name = uf.name || uf.fullName || ((uf.firstName || '') + ' ' + (uf.lastName || '')).trim() || uf.email || uf.username || null;
      const role = uf.role || null;
      return { id, name, role };
    }
    if (typeof userField === 'string') {
      const u: any = mockUsers.find(u => String(u.id) === String(userField) || String((u as any)._id) === String(userField));
      if (u) return { id: u.id || (u as any)._id, name: u.name || (u as any).fullName || u.email, role: u.role };
      return { id: userField, name: userField, role: null };
    }
    return null;
  };

  // Helper functions
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'department_head':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'manager':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'member':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTimeRemaining = (dueDate: Date) => {
    const now = currentTime;
    const diff = dueDate.getTime() - now.getTime();
    
    const pad = (n: number) => String(n).padStart(2, '0');

    if (diff <= 0) {
      const overdueMs = Math.abs(diff);
      const totalSeconds = Math.floor(overdueMs / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const text = days > 0
        ? `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s overdue`
        : hours > 0
          ? `${hours}h ${pad(minutes)}m ${pad(seconds)}s overdue`
          : minutes > 0
            ? `${minutes}m ${pad(seconds)}s overdue`
            : `Overdue ${seconds}s`;

      return { text, color: 'text-red-600 dark:text-red-400', isOverdue: true };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const text = days > 0
      ? `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
      : hours > 0
        ? `${hours}h ${pad(minutes)}m ${pad(seconds)}s`
        : minutes > 0
          ? `${minutes}m ${pad(seconds)}s`
          : `${seconds}s`;

    let color = 'text-green-600 dark:text-green-400';
    if (days > 7) color = 'text-green-600 dark:text-green-400';
    else if (days > 2) color = 'text-yellow-600 dark:text-yellow-400';
    else if (days > 0) color = 'text-orange-600 dark:text-orange-400';
    else if (hours > 2) color = 'text-red-500 dark:text-red-400';
    else if (hours > 0) color = 'text-red-600 dark:text-red-400';
    else if (minutes > 0) color = 'text-red-600 dark:text-red-400';
    else color = 'text-red-600 dark:text-red-400';

    return { text, color, isOverdue: false };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'assigned': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200';
      case 'blocked': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'blocked': return <AlertCircle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  // Stats for tabs
  const tabStats = [
    { id: 'active', label: 'Active Tasks', count: activeTasks.length, icon: Target },
    { id: 'completed', label: 'Completed', count: completedTasks.length, icon: CheckCircle },
    { id: 'blocked', label: 'Blocked', count: blockedTasks.length, icon: AlertCircle },
    { id: 'overdue', label: 'Overdue', count: overdueTasks.length, icon: AlertCircle },
    { id: 'all', label: 'All Tasks', count: myTasks.length, icon: Clock }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
            <p className="text-muted-foreground">
              Track and manage your assigned tasks — {userDepartment ? userDepartment.name : 'No department'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center shadow-sm">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading your tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">
            Track and manage your assigned tasks — {userDepartment ? userDepartment.name : 'No department'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center shadow-sm">
            <Target className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Active Tasks</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{activeTasks.length}</div>
            <p className="text-xs text-blue-700 dark:text-blue-300">Currently working on</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{completedTasks.length}</div>
            <p className="text-xs text-green-700 dark:text-green-300">Successfully finished</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Blocked</CardTitle>
            <AlertCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{blockedTasks.length}</div>
            <p className="text-xs text-purple-700 dark:text-purple-300">Need assistance</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-red-200 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">{overdueTasks.length}</div>
            <p className="text-xs text-red-700 dark:text-red-300">Urgent attention</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 border-gray-200 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">All Tasks</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{myTasks.length}</div>
            <p className="text-xs text-gray-700 dark:text-gray-300">Total assigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {tabStats.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {tab.label} ({tab.count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  My Tasks ({filteredTasks.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
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
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">Loading your tasks...</div>
                  </div>
                ) : filteredTasks.length > 0 ? filteredTasks.map((task) => {
                  const assignedByUserResolved = resolveUserDisplay(task.assignedBy);
                  const timeRemaining = getTimeRemaining(task.dueDate);

                  return (
                    <Card key={task.id} className={`border-2 transition-all duration-200 hover:shadow-md ${
                      timeRemaining.isOverdue ? 'border-red-200 bg-red-50/50 dark:bg-red-950/10' :
                      task.status === 'completed' ? 'border-green-200 bg-green-50/50 dark:bg-green-950/10' :
                      ''
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{task.title}</h3>
                              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                                <Flag className="w-3 h-3 mr-1" />
                                {task.priority}
                              </Badge>
                              <Badge className={getStatusColor(task.status)}>
                                {getStatusIcon(task.status)}
                                <span className="ml-1">{task.status.replace('_', ' ')}</span>
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-4">
                              {task.description}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Due Date:</p>
                                  <p className="text-muted-foreground">
                                    {task.dueDate.toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              
                              {task.status !== 'completed' && (
                                <div className="flex items-center gap-2">
                                  <Timer className={`h-4 w-4 ${timeRemaining.color}`} />
                                  <div>
                                    <p className="font-medium">Time Left:</p>
                                    <p className={timeRemaining.color}>
                                      {timeRemaining.text}
                                    </p>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Assigned By:</p>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground font-medium">
                                    {assignedByUserResolved?.name || 'Unknown'}
                                    </span>
                                    {assignedByUserResolved?.role && (
                                      <Badge className={`text-[10px] px-1.5 py-0 h-4 font-normal border ${getRoleBadgeColor(assignedByUserResolved.role)}`}>
                                        {assignedByUserResolved.role.replace('_', ' ')}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {task.attachments && task.attachments.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="flex items-center gap-2 mb-2">
                                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                                  <p className="font-medium text-sm">Attachments ({task.attachments.length})</p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Select
                              value={task.status}
                              onValueChange={(value) => updateTaskStatus(task.id, value)}
                            >
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
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTask(task);
                                setShowTaskDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                            
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }) : (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                        ? 'Try adjusting your filters'
                        : activeTab === 'all' ? 'No tasks assigned yet'
                        : activeTab === 'active' ? 'No active tasks assigned'
                        : activeTab === 'blocked' ? 'No blocked tasks - great job staying unblocked!'
                        : activeTab === 'completed' ? 'No completed tasks yet'
                        : activeTab === 'overdue' ? 'No overdue tasks - great job!'
                        : 'No tasks assigned yet'
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Task Details Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Task Details
            </DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedTask.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedTask.status)}>
                    {selectedTask.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Badge variant={getPriorityColor(selectedTask.priority)}>
                    {selectedTask.priority}
                  </Badge>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <p className="text-sm">{selectedTask.dueDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Assigned By</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {resolveUserDisplay(selectedTask.assignedBy)?.name || 'Unknown'}
                    </span>
                    {resolveUserDisplay(selectedTask.assignedBy)?.role && (
                      <Badge className={`text-[10px] px-1.5 py-0 h-4 font-normal border ${getRoleBadgeColor(resolveUserDisplay(selectedTask.assignedBy)?.role)}`}>
                        {resolveUserDisplay(selectedTask.assignedBy)?.role.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}












































