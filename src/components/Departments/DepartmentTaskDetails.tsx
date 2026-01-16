import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, User, AlertCircle, CheckCircle, Timer, XCircle, Crown, Users, UserCheck, Target } from 'lucide-react';
import { Department, User as UserType, Task } from '@/types/company';
import { hodService } from '@/services/api/hodService';
import { useEffect, useState } from 'react';

interface DepartmentTaskDetailsProps {
  department: Department;
  users: UserType[];
}

export default function DepartmentTaskDetails({ department, users }: DepartmentTaskDetailsProps) {
  // Real data state
  const [departmentTasks, setDepartmentTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchTasks = async () => {
      if (!department?.id) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await hodService.getDepartmentTasks(String(department.id));
        // normalize many possible backend shapes
        let tasksArr: any[] = [];
        if (Array.isArray(res)) tasksArr = res as any[];
        else if (res && Array.isArray((res as any).tasks)) tasksArr = (res as any).tasks;
        else if (res && Array.isArray((res as any).data)) tasksArr = (res as any).data;
        else if (res && Array.isArray((res as any).data?.tasks)) tasksArr = (res as any).data.tasks;
        else tasksArr = [];

        // Debug logging
        console.log('Department tasks fetched:', {
          departmentId: department.id,
          tasksCount: tasksArr.length,
          tasks: tasksArr,
          departmentMembers: department.memberIds,
          departmentManagers: department.managerIds,
          departmentHead: department.headId
        });

        if (mounted) setDepartmentTasks(tasksArr as Task[]);
      } catch (err: any) {
        console.error('Error fetching department tasks:', err);
        if (mounted) setError(err?.message || 'Failed to load tasks');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchTasks();
    return () => { mounted = false; };
  }, [department?.id]);
  
  // Normalize arrays to avoid runtime errors when backend omits fields
  const memberIds = Array.isArray(department.memberIds) ? department.memberIds : [];
  const managerIds = Array.isArray(department.managerIds) ? department.managerIds : [];
  
  // Get department head
  const departmentHead = users.find(user => user.id === department.headId);
  
  // Get managers
  const managers = users.filter(user => managerIds.includes(user.id));
  
  // Get regular members (excluding head and managers)
  // Also include users who have this department as their departmentId but are not in managerIds or headId
  const members = users.filter(user => {
    // Include users who are explicitly in memberIds
    if (memberIds.includes(user.id)) {
      return user.id !== department.headId && !managerIds.includes(user.id);
    }
    // Also include users who have this department as their departmentId but are not managers or head
    if (user.departmentId === department.id) {
      return user.id !== department.headId && !managerIds.includes(user.id);
    }
    return false;
  });

  // Debug logging for members
  console.log('Department members analysis:', {
    departmentId: department.id,
    departmentName: department.name,
    totalUsers: users.length,
    departmentMemberIds: department.memberIds,
    departmentManagerIds: department.managerIds,
    departmentHeadId: department.headId,
    foundMembers: members.length,
    membersList: members.map(m => ({ id: m.id, name: m.name, role: m.role, departmentId: m.departmentId })),
    allUsersInDepartment: users.filter(u => u.departmentId === department.id).map(u => ({ id: u.id, name: u.name, role: u.role }))
  });

  // Fallback: If no members found through normal filtering, include all users in department
  // who are not head or managers
  const finalMembers = members.length > 0 ? members : users.filter(user => 
    user.departmentId === department.id && 
    user.id !== department.headId && 
    !department.managerIds.includes(user.id)
  );

  // Helper to resolve id from a reference that might be a string or a populated object
  const resolveId = (ref: any): string | null => {
    if (!ref) return null;
    if (typeof ref === 'string') return ref;
    if (typeof ref === 'object') return (ref.id || ref._id || null) as string | null;
    return null;
  };

  // Get user name (accepts id string or populated object)
  const getUserName = (userRef: any) => {
    const id = resolveId(userRef);
    if (id) {
      const user = users.find(u => u.id === id);
      if (user) return user.name;
    }
    // fallback to try reading name directly from object
    if (userRef && typeof userRef === 'object' && (userRef.name || (userRef.firstName && userRef.lastName))) {
      return userRef.name || `${userRef.firstName || ''} ${userRef.lastName || ''}`.trim();
    }
    return 'Unknown User';
  };

  // Get tasks for specific user, tolerate assignedTo being id string or populated object
  const getUserTasks = (userId: string) => {
    const userTasks = departmentTasks.filter(task => {
      const assignedId = resolveId((task as any).assignedTo);
      return assignedId === userId;
    });
    
    // Debug logging for specific user
    console.log(`Tasks for user ${userId}:`, {
      userId,
      totalTasks: departmentTasks.length,
      userTasks: userTasks.length,
      userTasksList: userTasks
    });
    
    return userTasks;
  };

  // Get status color and icon
  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'completed':
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          icon: CheckCircle, 
          iconColor: 'text-green-600' 
        };
      case 'in_progress':
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200', 
          icon: Timer, 
          iconColor: 'text-blue-600' 
        };
      case 'assigned':
        return { 
          color: 'bg-orange-100 text-orange-800 border-orange-200', 
          icon: Clock, 
          iconColor: 'text-orange-600' 
        };
      case 'blocked':
        return { 
          color: 'bg-red-100 text-red-800 border-red-200', 
          icon: XCircle, 
          iconColor: 'text-red-600' 
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: Clock, 
          iconColor: 'text-gray-600' 
        };
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-blue-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  // Calculate completion rate
  const completedTasks = departmentTasks.filter(task => task.status === 'completed').length;
  const totalTasks = departmentTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Component to render user tasks
  const UserTasksSection = ({ user, userType }: { user: UserType; userType: string }) => {
    const userTasks = getUserTasks(user.id);
    
    if (userTasks.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="hidden sm:flex w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Tasks Assigned</h3>
          <p className="text-slate-600 dark:text-slate-400">This user doesn't have any tasks yet.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {userTasks.map((task) => {
          const statusDetails = getStatusDetails(task.status);
          const StatusIcon = statusDetails.icon;
          const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
          
          return (
            <div key={task.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 hover:shadow-lg transition-all duration-200">
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 mb-3">
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className={`hidden sm:flex w-8 h-8 sm:w-10 sm:h-10 rounded-lg items-center justify-center flex-shrink-0 ${
                    statusDetails.color.includes('green') ? 'bg-green-100 dark:bg-green-900/30' :
                    statusDetails.color.includes('blue') ? 'bg-blue-100 dark:bg-blue-900/30' :
                    statusDetails.color.includes('orange') ? 'bg-orange-100 dark:bg-orange-900/30' :
                    'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    <StatusIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${statusDetails.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 text-sm sm:text-base">{task.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {task.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      Overdue
                    </Badge>
                  )}
                  <Badge variant="outline" className={`${statusDetails.color} text-xs`}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs space-y-2 sm:space-y-0">
                <div className="flex items-center gap-2">
                  <AlertCircle className={`hidden sm:block w-4 h-4 ${getPriorityColor(task.priority)}`} />
                  <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="hidden sm:block w-4 h-4 text-blue-600" />
                  <span className="text-blue-600 font-medium">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="hidden sm:block w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-medium">
                    By: {getUserName(task.assignedBy)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="hidden sm:block w-4 h-4 text-slate-500" />
                  <span className="text-slate-500 font-medium">
                    Assigned: {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading department tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Error Loading Tasks</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Enhanced Task Performance Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Performance Card */}
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-700/50">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 sm:gap-3">
                  <div className="hidden sm:flex w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg items-center justify-center">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <span className="hidden sm:inline">Task Performance Overview</span>
                  <span className="sm:hidden">Performance</span>
                </CardTitle>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 text-xs sm:text-sm">
                  {completionRate}% Complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{totalTasks}</p>
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium">Total Tasks</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-xl border border-green-200 dark:border-green-800">
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{completedTasks}</p>
                  <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 font-medium">Completed</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 rounded-xl border border-orange-200 dark:border-orange-800">
                  <p className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">{departmentTasks.filter(t => t.status === 'in_progress').length}</p>
                  <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-300 font-medium">In Progress</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 rounded-xl border border-red-200 dark:border-red-800">
                  <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">{departmentTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length}</p>
                  <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 font-medium">Overdue</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Overall Progress</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-2 sm:h-3 bg-slate-200 dark:bg-slate-700" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Contributors Card */}
        <div>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-700/50 h-full">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <div className="hidden sm:flex w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md items-center justify-center">
                  <UserCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                </div>
                <span className="hidden sm:inline">Top Contributors</span>
                <span className="sm:hidden">Top</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  // compute tasks completed per user
                  const completedByUser: Record<string, number> = {};
                  departmentTasks.forEach((t) => {
                    if (t.status === 'completed') {
                      const id = resolveId((t as any).assignedTo) || 'unassigned';
                      completedByUser[id] = (completedByUser[id] || 0) + 1;
                    }
                  });

                  const sorted = Object.entries(completedByUser)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);

                  if (sorted.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <UserCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">No contributors yet</p>
                      </div>
                    );
                  }

                  return sorted.map(([uid, count], index) => {
                    const user = users.find(u => u.id === uid);
                    const display = user ? user.name : uid === 'unassigned' ? 'Unassigned' : uid;
                    return (
                      <div key={uid} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{display}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Team Member</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          {count} tasks
                        </Badge>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Tasks Tabs */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-700/50">
        <CardContent className="p-0">
          <Tabs defaultValue="overview" className="w-full">
            <div className="border-b border-slate-200 dark:border-slate-700">
              <div className="overflow-x-auto scrollbar-hide">
                <TabsList className="grid w-full min-w-max grid-cols-2 sm:grid-cols-4 h-auto bg-transparent p-0">
                  <TabsTrigger 
                    value="overview" 
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:border-b-2 data-[state=active]:border-red-500 dark:data-[state=active]:bg-red-900/20 dark:data-[state=active]:text-red-400 rounded-none text-xs sm:text-sm"
                  >
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="font-medium hidden sm:inline">Overview</span>
                    <span className="sm:hidden">All</span>
                  </TabsTrigger>
                {departmentHead && (
                  <TabsTrigger 
                    value="head" 
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700 data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 dark:data-[state=active]:bg-yellow-900/20 dark:data-[state=active]:text-yellow-400 rounded-none text-xs sm:text-sm"
                  >
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="font-medium hidden sm:inline">Head</span>
                    <span className="sm:hidden">H</span>
                    <Badge variant="secondary" className="ml-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">
                      {getUserTasks(departmentHead.id).length}
                    </Badge>
                  </TabsTrigger>
                )}
                {managers.length > 0 && (
                  <TabsTrigger 
                    value="managers" 
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-400 rounded-none text-xs sm:text-sm"
                  >
                    <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="font-medium hidden sm:inline">Managers</span>
                    <span className="sm:hidden">M</span>
                    <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                      {managers.reduce((acc, m) => acc + getUserTasks(m.id).length, 0)}
                    </Badge>
                  </TabsTrigger>
                )}
                <TabsTrigger 
                  value="members" 
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-500 dark:data-[state=active]:bg-green-900/20 dark:data-[state=active]:text-green-400 rounded-none text-xs sm:text-sm"
                >
                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-medium hidden sm:inline">Members</span>
                  <span className="sm:hidden">M</span>
                  <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                    {finalMembers.reduce((acc, m) => acc + getUserTasks(m.id).length, 0)}
                  </Badge>
                </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-3 sm:p-6 space-y-3 sm:space-y-6">
              {/* Recent Tasks Overview */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 sm:mb-4 flex items-center gap-2">
                  <div className="hidden sm:flex w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-slate-500 to-slate-600 rounded-md items-center justify-center">
                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                  </div>
                  <span className="hidden sm:inline">Recent Tasks</span>
                  <span className="sm:hidden">Recent</span>
                </h3>
                <div className="space-y-3">
                  {departmentTasks.slice(0, 8).map((task) => {
                    const statusDetails = getStatusDetails(task.status);
                    const StatusIcon = statusDetails.icon;
                    const assignedUserName = getUserName(task.assignedTo);
                    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
                    
                    return (
                      <div key={task.id} className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-3 sm:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`hidden sm:flex w-8 h-8 sm:w-10 sm:h-10 rounded-lg items-center justify-center flex-shrink-0 ${
                            statusDetails.color.includes('green') ? 'bg-green-100 dark:bg-green-900/30' :
                            statusDetails.color.includes('blue') ? 'bg-blue-100 dark:bg-blue-900/30' :
                            statusDetails.color.includes('orange') ? 'bg-orange-100 dark:bg-orange-900/30' :
                            'bg-red-100 dark:bg-red-900/30'
                          }`}>
                            <StatusIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${statusDetails.iconColor}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">{task.title}</p>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                              <span className="hidden sm:inline">Assigned to: </span>{assignedUserName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                          <Badge variant="outline" className={`${statusDetails.color} text-xs`}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                  {departmentTasks.length === 0 && (
                    <div className="text-center py-8 sm:py-12">
                      <div className="hidden sm:flex w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-700 rounded-full items-center justify-center mx-auto mb-3 sm:mb-4">
                        <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Tasks Found</h3>
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">This department doesn't have any tasks yet.</p>
                    </div>
                  )}
                  
                  {/* Debug Information */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Debug Information</h4>
                      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <p>Total Tasks: {departmentTasks.length}</p>
                        <p>Department ID: {department.id}</p>
                        <p>Tasks assigned to users: {JSON.stringify(departmentTasks.map(t => ({ 
                          id: t.id, 
                          title: t.title, 
                          assignedTo: (t as any).assignedTo,
                          assignedToId: resolveId((t as any).assignedTo)
                        })), null, 2)}</p>
                        <p>All Users: {JSON.stringify(users.map(u => ({ id: u.id, name: u.name, departmentId: u.departmentId })), null, 2)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Department Head Tab */}
            {departmentHead && (
              <TabsContent value="head" className="p-3 sm:p-6">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-800/10 rounded-xl border border-yellow-200 dark:border-yellow-800 p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{departmentHead.name}</h3>
                      <p className="text-slate-600 dark:text-slate-400">Department Head</p>
                    </div>
                    <Badge variant="default" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-4 py-2">
                      {getUserTasks(departmentHead.id).length} tasks
                    </Badge>
                  </div>
                  <UserTasksSection user={departmentHead} userType="head" />
                </div>
              </TabsContent>
            )}

            {/* Managers Tab */}
            {managers.length > 0 && (
              <TabsContent value="managers" className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                {managers.map((manager) => (
                  <div key={manager.id} className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <UserCheck className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{manager.name}</h3>
                        <p className="text-slate-600 dark:text-slate-400">Manager</p>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-4 py-2">
                        {getUserTasks(manager.id).length} tasks
                      </Badge>
                    </div>
                    <UserTasksSection user={manager} userType="manager" />
                  </div>
                ))}
              </TabsContent>
            )}

            {/* Members Tab */}
            <TabsContent value="members" className="p-3 sm:p-6 space-y-4 sm:space-y-6">
              {finalMembers.length > 0 ? (
                finalMembers.map((member) => (
                  <div key={member.id} className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-xl border border-green-200 dark:border-green-800 p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{member.name}</h3>
                        <p className="text-slate-600 dark:text-slate-400">Team Member</p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-4 py-2 border-green-300 dark:border-green-700">
                        {getUserTasks(member.id).length} tasks
                      </Badge>
                    </div>
                    <UserTasksSection user={member} userType="member" />
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Members Found</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    This department doesn't have any members assigned yet.
                  </p>
                  <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
                    <p>Department ID: {department.id}</p>
                    <p>Member IDs: {department.memberIds.join(', ') || 'None'}</p>
                    <p>Manager IDs: {department.managerIds.join(', ') || 'None'}</p>
                    <p>Head ID: {department.headId || 'None'}</p>
                    <p>Total Users in System: {users.length}</p>
                    <p>Users with this Department ID: {users.filter(u => u.departmentId === department.id).length}</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
