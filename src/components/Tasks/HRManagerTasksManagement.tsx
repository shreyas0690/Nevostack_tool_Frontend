import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ClipboardList, 
  Search, 
  Plus,
  Calendar,
  User,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Target,
  Crown,
  Shield,
  UserCheck,
  Timer,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Eye,
  UserPlus,
  Paperclip,
  File,
  BarChart3
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/Auth/AuthProvider';
import { mockTasks, mockUsers, mockDepartments } from '@/data/mockData';
import AssignTaskDialog from './AssignTaskDialog';

export default function HRManagerTasksManagement() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState(mockTasks);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('recent');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Update current time every 30 seconds for more accurate countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(timer);
  }, []);

  // Helper function to calculate time remaining with real-time countdown
  const getTimeRemaining = (dueDate: Date) => {
    const now = currentTime;
    const diff = dueDate.getTime() - now.getTime();

    if (diff <= 0) {
      const overdueDiff = Math.abs(diff);
      const overdueDays = Math.floor(overdueDiff / (1000 * 60 * 60 * 24));
      const overdueHours = Math.floor((overdueDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (overdueDays > 0) {
        return { text: `${overdueDays}d overdue`, color: 'text-red-600', isOverdue: true };
      } else if (overdueHours > 0) {
        return { text: `${overdueHours}h overdue`, color: 'text-red-600', isOverdue: true };
      } else {
        return { text: 'Overdue', color: 'text-red-600', isOverdue: true };
      }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 7) {
      return { text: `${days} days`, color: 'text-green-600', isOverdue: false };
    } else if (days > 2) {
      return { text: `${days} days`, color: 'text-yellow-600', isOverdue: false };
    } else if (days > 0) {
      return { text: `${days}d ${hours}h`, color: 'text-orange-600', isOverdue: false };
    } else if (hours > 2) {
      return { text: `${hours}h ${minutes}m`, color: 'text-red-500', isOverdue: false };
    } else if (hours > 0) {
      return { text: `${hours}h ${minutes}m`, color: 'text-red-600', isOverdue: false };
    } else if (minutes > 0) {
      return { text: `${minutes}m`, color: 'text-red-600', isOverdue: false };
    } else {
      return { text: '< 1m', color: 'text-red-600', isOverdue: false };
    }
  };

  // Helper function to get formatted creation date
  const getCreatedDate = (createdAt: Date) => {
    const now = currentTime;
    const diff = now.getTime() - createdAt.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return createdAt.toLocaleDateString();
    }
  };

  // Function to update task status
  const updateTaskStatus = (taskId: string, newStatus: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus as any, updatedAt: new Date() }
          : task
      )
    );
  };

  // Function to add new task
  const handleAssignTask = (taskData: any) => {
    setTasks(prevTasks => [...prevTasks, taskData]);
    setShowAssignDialog(false);
  };

  // HR Manager sees all tasks across all departments
  const allTasks = tasks;

  // Get tasks by category
  const recentTasks = allTasks.filter(t => t.status !== 'completed' && !getTimeRemaining(t.dueDate).isOverdue);
  const completedTasks = allTasks.filter(t => t.status === 'completed');

  // Get current tab tasks
  const getCurrentTabTasks = () => {
    switch (activeTab) {
      case 'recent': return recentTasks;
      case 'completed': return completedTasks;
      case 'overview': return allTasks;
      default: return recentTasks;
    }
  };

  // Filter tasks based on current tab
  const filteredTasks = getCurrentTabTasks().filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || task.departmentId === departmentFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesPriority;
  });

  // Get assigned by role information
  const getAssignedByIcon = (assignedByRole?: string) => {
    switch (assignedByRole) {
      case 'super_admin': return <Crown className="h-4 w-4" />;
      case 'department_head': return <Shield className="h-4 w-4" />;
      case 'manager': return <UserCheck className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getAssignedByColor = (assignedByRole?: string) => {
    switch (assignedByRole) {
      case 'super_admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'department_head': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'manager': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatAssignedByRole = (assignedByRole?: string) => {
    switch (assignedByRole) {
      case 'super_admin': return 'Super Admin';
      case 'department_head': return 'HOD';
      case 'manager': return 'Manager';
      default: return 'Unknown';
    }
  };

  // Statistics
  const totalTasks = allTasks.length;
  const completedTasksCount = completedTasks.length;
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = allTasks.filter(t => t.status === 'assigned').length;
  const overdueTasks = allTasks.filter(t => getTimeRemaining(t.dueDate).isOverdue && t.status !== 'completed');
  const overdueTasksCount = overdueTasks.length;

  const stats = [
    {
      title: 'Total Tasks',
      value: totalTasks,
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50'
    },
    {
      title: 'Recent Tasks',
      value: recentTasks.length,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50'
    },
    {
      title: 'Completed',
      value: completedTasksCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/50'
    },
    {
      title: 'Overdue',
      value: overdueTasksCount,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Manager Task Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage HR tasks across all departments
          </p>
        </div>
        <Button onClick={() => setShowAssignDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Assign Task
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <div className={`absolute inset-0 ${stat.bgColor} opacity-30`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent ({recentTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed ({completedTasksCount})
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview ({totalTasks})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Task Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
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
                <SelectTrigger>
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {mockDepartments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setDepartmentFilter('all');
                }}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Clear Filters
              </Button>
            </div>

            {/* Tab Content */}
            <TabsContent value="recent" className="space-y-4 mt-0">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">{task.title}</h3>
                              <p className="text-muted-foreground mt-1">{task.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`border ${
                                task.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                task.status === 'assigned' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                'bg-gray-100 text-gray-800 border-gray-200'
                              }`}>
                                {task.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <Badge className={`border ${
                                task.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-200' :
                                task.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                'bg-green-100 text-green-800 border-green-200'
                              }`}>
                                {task.priority.toUpperCase()}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {mockUsers.find(u => u.id === task.assignedTo)?.name.split(' ').map(n => n[0]).join('') || 'UN'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {mockUsers.find(u => u.id === task.assignedTo)?.name || 'Unassigned'}
                                </div>
                                <div className="text-muted-foreground">
                                  {mockUsers.find(u => u.id === task.assignedTo)?.role.replace('_', ' ') || ''}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {task.dueDate.toLocaleDateString()}
                                </div>
                                <div className={`text-xs ${getTimeRemaining(task.dueDate).color}`}>
                                  {getTimeRemaining(task.dueDate).text}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {getCreatedDate(task.createdAt)}
                                </div>
                                <div className="text-muted-foreground">Created</div>
                              </div>
                            </div>
                          </div>

                          {/* File Attachments */}
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <div className="flex gap-2">
                              <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                                <File className="h-3 w-3" />
                                <span>requirements.pdf</span>
                                <span className="text-muted-foreground">(2.1 MB)</span>
                              </div>
                              <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                                <File className="h-3 w-3" />
                                <span>mockup.png</span>
                                <span className="text-muted-foreground">(1.5 MB)</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTask(task)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No recent tasks found</h3>
                    <p className="text-muted-foreground text-center">
                      Try adjusting your search criteria or check completed tasks
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-0">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow opacity-90">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">{task.title}</h3>
                              <p className="text-muted-foreground mt-1">{task.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800 border-green-200 border">
                                COMPLETED
                              </Badge>
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {mockUsers.find(u => u.id === task.assignedTo)?.name.split(' ').map(n => n[0]).join('') || 'UN'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {mockUsers.find(u => u.id === task.assignedTo)?.name || 'Unassigned'}
                                </div>
                                <div className="text-muted-foreground">
                                  {mockUsers.find(u => u.id === task.assignedTo)?.role.replace('_', ' ') || ''}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <div>
                                <div className="font-medium">
                                  {task.updatedAt.toLocaleDateString()}
                                </div>
                                <div className="text-green-600 text-xs">Completed</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {task.dueDate.toLocaleDateString()}
                                </div>
                                <div className="text-muted-foreground">Due Date</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTask(task)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No completed tasks found</h3>
                    <p className="text-muted-foreground text-center">
                      Completed tasks will appear here
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="overview" className="space-y-4 mt-0">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">{task.title}</h3>
                              <p className="text-muted-foreground mt-1">{task.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`border ${
                                task.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                task.status === 'assigned' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                'bg-gray-100 text-gray-800 border-gray-200'
                              }`}>
                                {task.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <Badge className={`border ${
                                task.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-200' :
                                task.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                'bg-green-100 text-green-800 border-green-200'
                              }`}>
                                {task.priority.toUpperCase()}
                              </Badge>
                              {task.status === 'completed' && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {mockUsers.find(u => u.id === task.assignedTo)?.name.split(' ').map(n => n[0]).join('') || 'UN'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {mockUsers.find(u => u.id === task.assignedTo)?.name || 'Unassigned'}
                                </div>
                                <div className="text-muted-foreground">
                                  {mockUsers.find(u => u.id === task.assignedTo)?.role.replace('_', ' ') || ''}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {task.dueDate.toLocaleDateString()}
                                </div>
                                <div className={`text-xs ${task.status === 'completed' ? 'text-green-600' : getTimeRemaining(task.dueDate).color}`}>
                                  {task.status === 'completed' ? 'Completed' : getTimeRemaining(task.dueDate).text}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${getAssignedByColor(task.assignedByRole)}`}>
                                {getAssignedByIcon(task.assignedByRole)}
                                <span className="ml-1">{formatAssignedByRole(task.assignedByRole)}</span>
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {getCreatedDate(task.createdAt)}
                                </div>
                                <div className="text-muted-foreground">Created</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTask(task)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                    <p className="text-muted-foreground text-center">
                      Tasks will appear here as they are created
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      {/* Assign Task Dialog */}
      <AssignTaskDialog
        open={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        onAssignTask={handleAssignTask}
        departmentMembers={mockUsers}
        currentUser={null}
      />
    </div>
  );
}