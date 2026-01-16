import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { useAuth } from '@/components/Auth/AuthProvider';
import TaskCard from './TaskCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, CheckCircle2, AlertCircle, Target, Search as SearchIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import useHODManagement from '@/hooks/useHODManagement';
import ManagerTasksManagement from './ManagerTasksManagement';

export default function ManagerMyTasks() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [fetchedTeamTasks, setFetchedTeamTasks] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedByFilter, setAssignedByFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const { data: myTasksData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', 'manager-my-tasks', currentUser?.id],
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
          dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
          createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
        }));

        return normalized;
      } catch (e) {
        console.warn('ManagerMyTasks: failed to fetch my tasks', e);
        return [];
      }
    },
    enabled: !!currentUser,
  });

  useEffect(() => { setTasks(Array.isArray(myTasksData) ? myTasksData : []); }, [myTasksData]);

  useEffect(() => {
    const fetchTeamTasks = async () => {
      const managedIds: string[] = Array.isArray((currentUser as any)?.managedMemberIds) ? (currentUser as any).managedMemberIds : [];
      if (managedIds.length === 0) {
        setFetchedTeamTasks([]);
        return;
      }
      try {
        const res: any = await taskService.getTasksByAssignedToList(managedIds, 1, 1000);
        let arr: any[] = [];
        if (Array.isArray(res)) arr = res;
        else if (Array.isArray(res?.data)) arr = res.data;
        else if (Array.isArray(res?.tasks)) arr = res.tasks;
        setFetchedTeamTasks(arr.map((t: any) => ({ ...t, id: t.id || t._id })));
      } catch (e) {
        console.warn('Failed to fetch team tasks', e);
        setFetchedTeamTasks([]);
      }
    };

    fetchTeamTasks();
  }, [currentUser]);


  const normalizeDate = (d: any) => {
    if (!d) return new Date(0);
    if (d instanceof Date) return d;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? new Date(0) : parsed;
  };

  const getTimeRemaining = (dueDate: any) => {
    const now = currentTime;
    const due = normalizeDate(dueDate);
    const diff = due.getTime() - now.getTime();
    if (diff <= 0) return { text: 'Overdue', color: 'text-red-600', isOverdue: true };
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

  const userDeptId = currentUser?.departmentId;
  const { departmentUsers = [] } = useHODManagement(userDeptId);

  const allTasks = tasks;

  const recentTasks = allTasks.filter(t => t.status !== 'completed' && !getTimeRemaining(t.dueDate).isOverdue);
  const completedTasks = allTasks.filter(t => t.status === 'completed');
  const overdueTasks = allTasks.filter(t => getTimeRemaining(t.dueDate).isOverdue && t.status !== 'completed' && t.status !== 'blocked');
  const blockedTasks = allTasks.filter(t => t.status === 'blocked');

  // Add Due Today tasks logic
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const dueTodayTasks = allTasks.filter(t => {
    if (!t.dueDate) return false;
    const taskDueDate = normalizeDate(t.dueDate);
    return taskDueDate >= startOfToday && taskDueDate < endOfToday && t.status !== 'completed';
  });

  const managedIds: string[] = Array.isArray((currentUser as any)?.managedMemberIds) ? (currentUser as any).managedMemberIds : [];

  const teamMemberIds = managedIds.length > 0
    ? managedIds.map(String)
    : departmentUsers.filter((u: any) => {
      const mgr = u.managerId || (u.manager && (u.manager._id || u.manager.id));
      return String(mgr) === String(currentUser?.id);
    }).map((m: any) => String(m.id || m._id));

  const getAssignedId = (t: any) => {
    if (!t) return null;
    if (typeof t === 'string') return t;
    if (typeof t === 'object') return t._id || t.id || null;
    return null;
  };

  const isTaskForTeamMember = (task: any) => {
    const ids: string[] = [];
    if (Array.isArray((task as any).assignedToList)) {
      ids.push(...((task as any).assignedToList as any[]).map((a: any) => (typeof a === 'string' ? a : (a && (a._id || a.id)))).filter(Boolean));
    }
    const single = getAssignedId(task.assignedTo);
    if (single) ids.push(single);
    return ids.some(id => teamMemberIds.includes(String(id)));
  };

  const teamTasks = (Array.isArray(fetchedTeamTasks) && fetchedTeamTasks.length > 0)
    ? fetchedTeamTasks
    : allTasks.filter((t: any) => isTaskForTeamMember(t));

  const getCurrentTabTasks = () => {
    switch (activeTab) {
      case 'recent': return recentTasks;
      case 'completed': return completedTasks;
      case 'overdue': return overdueTasks;
      case 'blocked': return blockedTasks;
      default: return recentTasks;
    }
  };

  const filteredTasks = getCurrentTabTasks().filter(task => {
    const matchesSearch = (task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesAssignedBy = assignedByFilter === 'all' || task.assignedByRole === assignedByFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignedBy;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, assignedByFilter, activeTab]);

  const stats = [
    { title: 'Recent Tasks', value: recentTasks.length, icon: Clock, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/50', description: 'Active tasks' },
    { title: 'Completed', value: completedTasks.length, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950/50' },
    { title: 'Overdue', value: overdueTasks.length, icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950/50' },
    { title: 'Blocked', value: blockedTasks.length, icon: Target, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950/50' }
  ];

  if (!currentUser) return (<div className="p-6"><h2 className="text-lg font-medium">Please sign in to view your tasks</h2></div>);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
            <p className="text-muted-foreground">Tasks assigned to you</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <Target className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium mb-2">Loading My Tasks</h3>
          <p className="text-muted-foreground">Please wait while we fetch your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">Tasks assigned to you</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <div className={`absolute inset-0 ${stat.bgColor} opacity-30`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.description && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recent" className="flex items-center gap-2"><Clock className="h-4 w-4" />Recent Tasks ({recentTasks.length})</TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Completed ({completedTasks.length})</TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />Overdue ({overdueTasks.length})</TabsTrigger>
          <TabsTrigger value="blocked" className="flex items-center gap-2"><Target className="h-4 w-4" />Blocked ({blockedTasks.length})</TabsTrigger>
        </TabsList>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              {activeTab === 'recent' && 'Recent Tasks'}
              {activeTab === 'completed' && 'Completed Tasks'}
              {activeTab === 'overdue' && 'Overdue Tasks'}
              {activeTab === 'blocked' && 'Blocked Tasks'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search tasks..." value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} className="pl-8" />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={assignedByFilter} onValueChange={setAssignedByFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by assigned by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignments</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="department_head">HOD</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              <div className="space-y-4">
                {currentTasks.map(task => (
                  <TaskCard key={task.id} task={task} onUpdateStatus={async (id, status) => {
                    try { await taskService.updateTaskStatus(id, status as any); refetch(); } catch (e) { console.warn(e); }
                  }} currentUserId={currentUser?.id} currentUserRole={currentUser?.role} />
                ))}
              </div>

              {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                  {activeTab === 'recent' && <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                  {activeTab === 'completed' && <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                  {activeTab === 'overdue' && <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                  {activeTab === 'blocked' && <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                  <h3 className="text-lg font-medium mb-2">
                    {activeTab === 'recent' && 'No recent tasks'}
                    {activeTab === 'completed' && 'No completed tasks found'}
                    {activeTab === 'overdue' && 'No overdue tasks found'}
                    {activeTab === 'blocked' && 'No blocked tasks found'}
                  </h3>
                  <p className="text-muted-foreground">{searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || assignedByFilter !== 'all' ? 'Try adjusting your search filters' : (activeTab === 'recent' ? 'No recent tasks - great job staying on top of things!' : (activeTab === 'completed' ? 'No tasks have been completed yet' : (activeTab === 'overdue' ? 'No overdue tasks - good job!' : 'No blocked tasks')))}</p>
                </div>
              )}

              {/* Pagination Controls */}
              {filteredTasks.length > itemsPerPage && (
                <div className="flex items-center justify-between border-t pt-4 mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTasks.length)} of {filteredTasks.length} tasks
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
