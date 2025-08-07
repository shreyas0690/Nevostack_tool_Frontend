import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, User, AlertCircle, CheckCircle, Timer, XCircle, Crown, Users, UserCheck } from 'lucide-react';
import { Department, User as UserType, Task } from '@/types/company';
import { mockTasks } from '@/data/mockData';

interface DepartmentTaskDetailsProps {
  department: Department;
  users: UserType[];
}

export default function DepartmentTaskDetails({ department, users }: DepartmentTaskDetailsProps) {
  // Get all tasks for this department
  const departmentTasks = mockTasks.filter(task => task.departmentId === department.id);
  
  // Get department head
  const departmentHead = users.find(user => user.id === department.headId);
  
  // Get managers
  const managers = users.filter(user => department.managerIds.includes(user.id));
  
  // Get regular members (excluding head and managers)
  const members = users.filter(user => 
    department.memberIds.includes(user.id) && 
    user.id !== department.headId && 
    !department.managerIds.includes(user.id)
  );

  // Get user name
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  // Get tasks for specific user
  const getUserTasks = (userId: string) => {
    return departmentTasks.filter(task => task.assignedTo === userId);
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
        <div className="text-center py-4 text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No tasks assigned</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {userTasks.map((task) => {
          const statusDetails = getStatusDetails(task.status);
          const StatusIcon = statusDetails.icon;
          const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
          
          return (
            <div key={task.id} className="border rounded-lg p-3 bg-card">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm">{task.title}</h4>
                <Badge variant="outline" className={statusDetails.color}>
                  <StatusIcon className={`w-3 h-3 mr-1 ${statusDetails.iconColor}`} />
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {task.description}
              </p>
              
              <div className="flex items-center justify-between text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <AlertCircle className={`w-3 h-3 ${getPriorityColor(task.priority)}`} />
                    <span className={getPriorityColor(task.priority)} style={{ fontSize: '10px' }}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    <span className="text-blue-600" style={{ fontSize: '10px' }}>
                      Assigned: {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className={isOverdue ? 'text-red-600' : 'text-muted-foreground'} style={{ fontSize: '10px' }}>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-green-600" />
                    <span className="text-green-600" style={{ fontSize: '10px' }}>
                      By: {getUserName(task.assignedBy)}
                    </span>
                  </div>
                </div>
                
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Department Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: department.color }}
            />
            {department.name} Task Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{totalTasks}</p>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {departmentTasks.filter(t => t.status === 'in_progress').length}
              </p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {departmentTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length}
              </p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion Rate</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Tasks Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Overview
          </TabsTrigger>
          {departmentHead && (
            <TabsTrigger value="head" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Head ({getUserTasks(departmentHead.id).length})
            </TabsTrigger>
          )}
          {managers.length > 0 && (
            <TabsTrigger value="managers" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Managers ({managers.reduce((acc, m) => acc + getUserTasks(m.id).length, 0)})
            </TabsTrigger>
          )}
          {members.length > 0 && (
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Members ({members.reduce((acc, m) => acc + getUserTasks(m.id).length, 0)})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{totalTasks}</p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {departmentTasks.filter(t => t.status === 'in_progress').length}
                </p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">
                  {departmentTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length}
                </p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Department Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span className="font-medium">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Recent Tasks Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {departmentTasks.slice(0, 5).map((task) => {
                  const statusDetails = getStatusDetails(task.status);
                  const StatusIcon = statusDetails.icon;
                  const assignedUser = users.find(u => u.id === task.assignedTo);
                  
                  return (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`w-4 h-4 ${statusDetails.iconColor}`} />
                        <div>
                          <p className="font-medium text-sm">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Assigned to: {assignedUser?.name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={statusDetails.color}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  );
                })}
                {departmentTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tasks found for this department</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Department Head Tab */}
        {departmentHead && (
          <TabsContent value="head" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Crown className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-lg">{departmentHead.name}</p>
                    <p className="text-sm text-muted-foreground font-normal">Department Head</p>
                  </div>
                  <Badge variant="default" className="ml-auto">
                    {getUserTasks(departmentHead.id).length} tasks
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UserTasksSection user={departmentHead} userType="head" />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Managers Tab */}
        {managers.length > 0 && (
          <TabsContent value="managers" className="space-y-4">
            {managers.map((manager) => (
              <Card key={manager.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg">{manager.name}</p>
                      <p className="text-sm text-muted-foreground font-normal">Manager</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      {getUserTasks(manager.id).length} tasks
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserTasksSection user={manager} userType="manager" />
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}

        {/* Members Tab */}
        {members.length > 0 && (
          <TabsContent value="members" className="space-y-4">
            {members.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-lg">{member.name}</p>
                      <p className="text-sm text-muted-foreground font-normal">Member</p>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      {getUserTasks(member.id).length} tasks
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserTasksSection user={member} userType="member" />
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}