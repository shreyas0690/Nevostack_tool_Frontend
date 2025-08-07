import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, CheckCircle, Clock, AlertCircle,
  Calendar, Target, Award, Activity
} from 'lucide-react';
import { mockUsers, mockDepartments, mockTasks } from '@/data/mockData';
import { mockLeaveRequests } from '@/data/leaveData';
import { useState } from 'react';

export default function AnalyticsDashboard() {
  const [performancePeriod, setPerformancePeriod] = useState<'week' | 'month' | 'year'>('week');
  // Task Analytics Data
  const tasksByStatus = [
    { name: 'Completed', value: mockTasks.filter(t => t.status === 'completed').length, color: '#22c55e' },
    { name: 'In Progress', value: mockTasks.filter(t => t.status === 'in_progress').length, color: '#3b82f6' },
    { name: 'Assigned', value: mockTasks.filter(t => t.status === 'assigned').length, color: '#f59e0b' },
    { name: 'Blocked', value: mockTasks.filter(t => t.status === 'blocked').length, color: '#ef4444' }
  ];

  const tasksByPriority = [
    { name: 'Low', value: mockTasks.filter(t => t.priority === 'low').length, color: '#6b7280' },
    { name: 'Medium', value: mockTasks.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
    { name: 'High', value: mockTasks.filter(t => t.priority === 'high').length, color: '#f97316' },
    { name: 'Urgent', value: mockTasks.filter(t => t.priority === 'urgent').length, color: '#dc2626' }
  ];

  // Department Performance
  const departmentData = mockDepartments.map(dept => {
    const deptTasks = mockTasks.filter(t => t.departmentId === dept.id);
    const completedTasks = deptTasks.filter(t => t.status === 'completed').length;
    const totalTasks = deptTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      name: dept.name,
      totalTasks,
      completedTasks,
      completionRate,
      members: dept.memberCount
    };
  });

  // User Performance
  const userPerformance = mockUsers.map(user => {
    const userTasks = mockTasks.filter(t => t.assignedTo === user.id);
    const completedTasks = userTasks.filter(t => t.status === 'completed').length;
    const totalTasks = userTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      name: user.name,
      totalTasks,
      completedTasks,
      completionRate,
      department: mockDepartments.find(d => d.id === user.departmentId)?.name || 'No Department'
    };
  }).sort((a, b) => b.completionRate - a.completionRate);

  // Performance Data
  const weeklyData = [
    { period: 'Mon', tasks: 12, completed: 10, productivity: 83 },
    { period: 'Tue', tasks: 15, completed: 13, productivity: 87 },
    { period: 'Wed', tasks: 18, completed: 16, productivity: 89 },
    { period: 'Thu', tasks: 14, completed: 12, productivity: 86 },
    { period: 'Fri', tasks: 16, completed: 15, productivity: 94 },
    { period: 'Sat', tasks: 8, completed: 7, productivity: 88 },
    { period: 'Sun', tasks: 5, completed: 4, productivity: 80 }
  ];

  const monthlyData = [
    { period: 'Day 1', tasks: 15, completed: 12, productivity: 80 },
    { period: 'Day 2', tasks: 18, completed: 16, productivity: 89 },
    { period: 'Day 3', tasks: 12, completed: 10, productivity: 83 },
    { period: 'Day 4', tasks: 20, completed: 18, productivity: 90 },
    { period: 'Day 5', tasks: 16, completed: 14, productivity: 88 },
    { period: 'Day 6', tasks: 8, completed: 7, productivity: 88 },
    { period: 'Day 7', tasks: 10, completed: 8, productivity: 80 },
    { period: 'Day 8', tasks: 14, completed: 13, productivity: 93 },
    { period: 'Day 9', tasks: 17, completed: 15, productivity: 88 },
    { period: 'Day 10', tasks: 19, completed: 17, productivity: 89 },
    { period: 'Day 11', tasks: 13, completed: 11, productivity: 85 },
    { period: 'Day 12', tasks: 21, completed: 19, productivity: 90 },
    { period: 'Day 13', tasks: 16, completed: 15, productivity: 94 },
    { period: 'Day 14', tasks: 9, completed: 8, productivity: 89 },
    { period: 'Day 15', tasks: 11, completed: 9, productivity: 82 },
    { period: 'Day 16', tasks: 18, completed: 16, productivity: 89 },
    { period: 'Day 17', tasks: 22, completed: 20, productivity: 91 },
    { period: 'Day 18', tasks: 15, completed: 14, productivity: 93 },
    { period: 'Day 19', tasks: 17, completed: 15, productivity: 88 },
    { period: 'Day 20', tasks: 19, completed: 18, productivity: 95 },
    { period: 'Day 21', tasks: 12, completed: 10, productivity: 83 },
    { period: 'Day 22', tasks: 14, completed: 12, productivity: 86 },
    { period: 'Day 23', tasks: 20, completed: 18, productivity: 90 },
    { period: 'Day 24', tasks: 16, completed: 15, productivity: 94 },
    { period: 'Day 25', tasks: 18, completed: 17, productivity: 94 },
    { period: 'Day 26', tasks: 13, completed: 12, productivity: 92 },
    { period: 'Day 27', tasks: 15, completed: 13, productivity: 87 },
    { period: 'Day 28', tasks: 21, completed: 20, productivity: 95 },
    { period: 'Day 29', tasks: 17, completed: 16, productivity: 94 },
    { period: 'Day 30', tasks: 19, completed: 18, productivity: 95 }
  ];

  const yearlyData = [
    { period: 'Jan', tasks: 180, completed: 152, productivity: 84 },
    { period: 'Feb', tasks: 208, completed: 176, productivity: 85 },
    { period: 'Mar', tasks: 192, completed: 168, productivity: 88 },
    { period: 'Apr', tasks: 244, completed: 220, productivity: 90 },
    { period: 'May', tasks: 220, completed: 192, productivity: 87 },
    { period: 'Jun', tasks: 268, completed: 248, productivity: 93 },
    { period: 'Jul', tasks: 285, completed: 260, productivity: 91 },
    { period: 'Aug', tasks: 265, completed: 240, productivity: 90 },
    { period: 'Sep', tasks: 290, completed: 270, productivity: 93 },
    { period: 'Oct', tasks: 275, completed: 250, productivity: 91 },
    { period: 'Nov', tasks: 260, completed: 235, productivity: 90 },
    { period: 'Dec', tasks: 280, completed: 260, productivity: 93 }
  ];

  const performanceData = performancePeriod === 'week' ? weeklyData : performancePeriod === 'month' ? monthlyData : yearlyData;

  // Leave Analytics
  const leaveByType = [
    { name: 'Annual', value: mockLeaveRequests.filter(l => l.leaveType === 'annual').length, color: '#3b82f6' },
    { name: 'Sick', value: mockLeaveRequests.filter(l => l.leaveType === 'sick').length, color: '#ef4444' },
    { name: 'Compensatory', value: mockLeaveRequests.filter(l => l.leaveType === 'compensatory').length, color: '#8b5cf6' },
    { name: 'Emergency', value: mockLeaveRequests.filter(l => l.leaveType === 'emergency').length, color: '#f59e0b' }
  ];

  // Key Metrics
  const totalCompletionRate = Math.round((mockTasks.filter(t => t.status === 'completed').length / mockTasks.length) * 100);
  const avgTasksPerUser = Math.round(mockTasks.length / mockUsers.length);
  const urgentTasks = mockTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
  const overdueTasks = mockTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length;

  const keyMetrics = [
    {
      title: 'Overall Completion Rate',
      value: `${totalCompletionRate}%`,
      change: '+5.2%',
      trend: 'up',
      icon: Target,
      color: 'text-green-600'
    },
    {
      title: 'Avg Tasks per User',
      value: avgTasksPerUser,
      change: '+2.1%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Urgent Tasks',
      value: urgentTasks,
      change: '-12%',
      trend: 'down',
      icon: AlertCircle,
      color: 'text-red-600'
    },
    {
      title: 'Overdue Tasks',
      value: overdueTasks,
      change: '-8%',
      trend: 'down',
      icon: Clock,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {keyMetrics.map((metric) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendIcon className={`h-3 w-3 mr-1 ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                  {metric.change} from last month
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="leave">Leave Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tasksByStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {tasksByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Task Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tasksByPriority}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {tasksByPriority.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Trend */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Performance Trend</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={performancePeriod === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPerformancePeriod('week')}
                  >
                    1 Week
                  </Button>
                  <Button
                    variant={performancePeriod === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPerformancePeriod('month')}
                  >
                    1 Month
                  </Button>
                  <Button
                    variant={performancePeriod === 'year' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPerformancePeriod('year')}
                  >
                    1 Year
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="tasks" stackId="1" stroke="#8884d8" fill="#8884d8" name="Total Tasks" />
                    <Area type="monotone" dataKey="completed" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Completed Tasks" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalTasks" fill="#8884d8" name="Total Tasks" />
                  <Bar dataKey="completedTasks" fill="#82ca9d" name="Completed Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Department Completion Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentData.map((dept) => (
                  <div key={dept.name} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{dept.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {dept.completedTasks}/{dept.totalTasks} tasks completed • {dept.members} members
                      </p>
                    </div>
                    <Badge 
                      variant={dept.completionRate >= 80 ? 'default' : dept.completionRate >= 60 ? 'secondary' : 'destructive'}
                    >
                      {dept.completionRate}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userPerformance.slice(0, 10).map((user, index) => (
                  <div key={user.name} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{user.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {user.department} • {user.completedTasks}/{user.totalTasks} tasks
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {index < 3 && <Award className="h-4 w-4 text-yellow-500" />}
                      <Badge 
                        variant={user.completionRate >= 90 ? 'default' : user.completionRate >= 70 ? 'secondary' : 'outline'}
                      >
                        {user.completionRate}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Leave Requests by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={leaveByType}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {leaveByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leave Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Requests</span>
                    <Badge>{mockLeaveRequests.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Approved</span>
                    <Badge variant="default">{mockLeaveRequests.filter(l => l.status === 'approved').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Pending</span>
                    <Badge variant="secondary">{mockLeaveRequests.filter(l => l.status === 'pending').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Rejected</span>
                    <Badge variant="destructive">{mockLeaveRequests.filter(l => l.status === 'rejected').length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockLeaveRequests.slice(0, 5).map((leave) => {
                  const user = mockUsers.find(u => u.id === leave.employeeId);
                  return (
                    <div key={leave.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{user?.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {leave.leaveType} leave • {leave.startDate.toLocaleDateString()} - {leave.endDate.toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          leave.status === 'approved' ? 'default' :
                          leave.status === 'pending' ? 'secondary' : 'destructive'
                        }
                      >
                        {leave.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}