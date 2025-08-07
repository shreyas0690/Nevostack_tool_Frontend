import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { User, Department, Task } from '@/types/company';
import { Crown, UserCheck, Users, CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import { mockUsers, mockDepartments, mockTasks } from '@/data/mockData';

export default function ComprehensiveManagement() {
  const getUser = (userId: string) => mockUsers.find(u => u.id === userId);
  
  const getUserTasks = (userId: string) => mockTasks.filter(task => task.assignedTo === userId);
  
  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'assigned':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'blocked':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'assigned':
        return 'outline';
      case 'blocked':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const calculateCompletionRate = (tasks: Task[]) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  const UserWorkCard = ({ user, role }: { user: User; role: 'head' | 'manager' | 'member' }) => {
    const userTasks = getUserTasks(user.id);
    const completionRate = calculateCompletionRate(userTasks);
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback>
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{user.name}</h4>
                {role === 'head' && <Crown className="w-4 h-4 text-yellow-500" />}
                {role === 'manager' && <UserCheck className="w-4 h-4 text-blue-500" />}
                {role === 'member' && <Users className="w-4 h-4 text-gray-500" />}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={role === 'head' ? 'default' : role === 'manager' ? 'secondary' : 'outline'} className="text-xs">
                  {role === 'head' ? 'Department Head' : role === 'manager' ? 'Manager' : 'Member'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {user.role.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{userTasks.length}</p>
              <p className="text-xs text-muted-foreground">Tasks</p>
              <div className="flex items-center gap-1 mt-1">
                <Progress value={completionRate} className="w-16 h-2" />
                <span className="text-xs">{completionRate}%</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        {userTasks.length > 0 && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">Current Work:</h5>
              {userTasks.slice(0, 3).map(task => (
                <div key={task.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                  {getTaskStatusIcon(task.status)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getTaskStatusBadge(task.status)} className="text-xs">
                      {task.status.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {task.dueDate.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
              {userTasks.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{userTasks.length - 3} more tasks
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  const DepartmentHierarchyCard = ({ department }: { department: Department }) => {
    const head = department.headId ? getUser(department.headId) : null;
    const managers = department.managerIds.map(id => getUser(id)).filter(Boolean) as User[];
    const members = department.memberIds.map(id => getUser(id)).filter(Boolean) as User[];
    
    // Filter out head and managers from members list
    const regularMembers = members.filter(member => 
      member.id !== department.headId && 
      !department.managerIds.includes(member.id)
    );

    const allDepartmentTasks = mockTasks.filter(task => task.departmentId === department.id);
    const departmentCompletionRate = calculateCompletionRate(allDepartmentTasks);

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: department.color }}
              />
              {department.name} Department
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{allDepartmentTasks.length} Total Tasks</p>
                <div className="flex items-center gap-2">
                  <Progress value={departmentCompletionRate} className="w-24 h-2" />
                  <span className="text-sm">{departmentCompletionRate}%</span>
                </div>
              </div>
            </div>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{department.description}</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Department Head */}
          {head ? (
            <div>
              <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Department Head
              </h4>
              <UserWorkCard user={head} role="head" />
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-lg">
              <Crown className="w-8 h-8 mx-auto mb-2" />
              <p>No department head assigned</p>
            </div>
          )}

          {/* Managers */}
          {managers.length > 0 && (
            <div>
              <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-500" />
                Managers ({managers.length})
              </h4>
              {managers.map(manager => (
                <UserWorkCard key={manager.id} user={manager} role="manager" />
              ))}
            </div>
          )}

          {/* Regular Members */}
          {regularMembers.length > 0 && (
            <div>
              <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                Team Members ({regularMembers.length})
              </h4>
              {regularMembers.map(member => (
                <UserWorkCard key={member.id} user={member} role="member" />
              ))}
            </div>
          )}

          {members.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <Users className="w-12 h-12 mx-auto mb-3" />
              <p>No members in this department</p>
              <Button variant="outline" className="mt-2">Add Members</Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Get departments with members only
  const activeDepartments = mockDepartments.filter(dept => dept.memberIds.length > 0);
  const emptyDepartments = mockDepartments.filter(dept => dept.memberIds.length === 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Complete Management Overview</h2>
          <p className="text-muted-foreground">
            Comprehensive view of all departments, roles, and work assignments
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{mockDepartments.length}</p>
            <p className="text-xs text-muted-foreground">Departments</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{mockUsers.length}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{mockTasks.length}</p>
            <p className="text-xs text-muted-foreground">Active Tasks</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Departments ({activeDepartments.length})</TabsTrigger>
          <TabsTrigger value="empty">Setup Required ({emptyDepartments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6 mt-6">
          {activeDepartments.map(department => (
            <DepartmentHierarchyCard key={department.id} department={department} />
          ))}
          
          {activeDepartments.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Active Departments</h3>
                <p className="text-muted-foreground mb-4">
                  All departments need members to be assigned
                </p>
                <Button>Assign Members</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="empty" className="space-y-4 mt-6">
          {emptyDepartments.map(department => (
            <Card key={department.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: department.color }}
                  />
                  {department.name} Department
                  <Badge variant="outline">Setup Required</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{department.description}</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    This department needs members and leadership assigned
                  </p>
                  <Button>Assign Members</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}