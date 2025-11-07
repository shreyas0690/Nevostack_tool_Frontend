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
  Calendar, Target, Award, Activity, Filter
} from 'lucide-react';
import { mockUsers, mockDepartments, mockTasks } from '@/data/mockData';
import { mockLeaveRequests } from '@/data/leaveData';
import { analyticsService } from '@/services/analyticsService';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function HRManagerAnalytics() {
  const [performancePeriod, setPerformancePeriod] = useState<'week' | 'month' | 'year'>('week');
  // Fixed values for task status distribution
  const taskStatusFilter = 'all';
  const includeOverdue = true;
  
  // Fetch task status distribution with backend filtering
  const { data: taskStatusData, isLoading: taskStatusLoading } = useQuery({
    queryKey: ['hr-analytics', 'task-status-distribution', taskStatusFilter, includeOverdue],
    queryFn: async () => {
      const res: any = await analyticsService.getTaskStatusDistribution({
        statusFilter: taskStatusFilter,
        includeOverdue: includeOverdue,
        excludeOverdue: taskStatusFilter === 'assigned' || taskStatusFilter === 'in_progress'
      });
      return res?.data || null;
    },
    staleTime: 1000 * 60 * 5
  });
  
  // Task Analytics Data with backend filtering
  const processTaskStatusData = () => {
    // Use backend filtered data if available
    if (taskStatusData && Array.isArray(taskStatusData)) {
      return taskStatusData.map((item: any) => ({
        name: item.name,
        value: item.value,
        color: item.color || (item.name === 'Completed' ? '#22c55e' : 
                              item.name === 'In Progress' ? '#3b82f6' : 
                              item.name === 'Assigned' ? '#f59e0b' : 
                              item.name === 'Overdue' ? '#dc2626' : '#ef4444')
      }));
    }
    
    // Fallback to mock data processing
    let data = [
      { name: 'Completed', value: mockTasks.filter(t => t.status === 'completed').length, color: '#22c55e' },
      { name: 'In Progress', value: mockTasks.filter(t => t.status === 'in_progress').length, color: '#3b82f6' },
      { name: 'Assigned', value: mockTasks.filter(t => t.status === 'assigned').length, color: '#f59e0b' },
      { name: 'Blocked', value: mockTasks.filter(t => t.status === 'blocked').length, color: '#ef4444' }
    ];
    
    // Apply status filter
    if (taskStatusFilter !== 'all') {
      data = data.filter(item => item.name.toLowerCase().replace(' ', '_') === taskStatusFilter);
    }
    
    // Add overdue tasks if requested
    if (includeOverdue) {
      const overdueTasks = mockTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
      if (overdueTasks > 0) {
        data.push({
          name: 'Overdue',
          value: overdueTasks,
          color: '#dc2626'
        });
      }
    }
    
    return data;
  };

  const tasksByStatus = processTaskStatusData();

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
      title: 'Total Active Users',
      value: mockUsers.filter(u => u.isActive).length,
      change: '+12',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Avg Tasks per User',
      value: avgTasksPerUser,
      change: '+0.8',
      trend: 'up',
      icon: Activity,
      color: 'text-purple-600'
    },
    {
      title: 'Urgent Tasks Open',
      value: urgentTasks,
      change: '-3',
      trend: 'down',
      icon: AlertCircle,
      color: 'text-red-600'
    },
    {
      title: 'Overdue Tasks',
      value: overdueTasks,
      change: '-5',
      trend: 'down',
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'Total Departments',
      value: mockDepartments.length,
      change: '0',
      trend: 'neutral',
      icon: Award,
      color: 'text-indigo-600'
    }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Manager Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Advanced HR analytics and performance insights
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {keyMetrics.map((metric) => {
          const Icon = metric.icon;
          const isUp = metric.trend === 'up';
          const isDown = metric.trend === 'down';
          
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
                  {isUp && <TrendingUp className="h-3 w-3 text-green-500 mr-1" />}
                  {isDown && <TrendingDown className="h-3 w-3 text-red-500 mr-1" />}
                  <span className={isUp ? 'text-green-500' : isDown ? 'text-red-500' : 'text-gray-500'}>
                    {metric.change}
                  </span>
                  <span className="ml-1">from last period</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">Task Analytics</TabsTrigger>
          <TabsTrigger value="departments">Department Performance</TabsTrigger>
          <TabsTrigger value="users">User Performance</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tasks by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tasksByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
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

            {/* Tasks by Priority */}
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Priority</CardTitle>
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
          </div>

          {/* Leave Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={leaveByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completionRate" fill="#3b82f6" name="Completion Rate %" />
                  <Bar dataKey="totalTasks" fill="#10b981" name="Total Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Department Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {departmentData.map((dept) => (
              <Card key={dept.name}>
                <CardHeader>
                  <CardTitle className="text-base">{dept.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Members:</span>
                    <span className="font-medium">{dept.members}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Tasks:</span>
                    <span className="font-medium">{dept.totalTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Completed:</span>
                    <span className="font-medium">{dept.completedTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Completion Rate:</span>
                    <Badge variant={dept.completionRate >= 80 ? 'default' : dept.completionRate >= 60 ? 'secondary' : 'destructive'}>
                      {dept.completionRate}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userPerformance.slice(0, 10).map((user, index) => (
                  <div key={user.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{user.completionRate}%</p>
                      <p className="text-sm text-muted-foreground">{user.completedTasks}/{user.totalTasks} tasks</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Performance Trends</CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant={performancePeriod === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPerformancePeriod('week')}
                >
                  Week
                </Button>
                <Button
                  variant={performancePeriod === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPerformancePeriod('month')}
                >
                  Month
                </Button>
                <Button
                  variant={performancePeriod === 'year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPerformancePeriod('year')}
                >
                  Year
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="tasks" stroke="#3b82f6" name="Total Tasks" />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed Tasks" />
                  <Line type="monotone" dataKey="productivity" stroke="#f59e0b" name="Productivity %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Task Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((performanceData.reduce((acc, day) => acc + day.completed, 0) / performanceData.reduce((acc, day) => acc + day.tasks, 0)) * 100)}%
                </div>
                <p className="text-sm text-muted-foreground">Average completion rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {performanceData.reduce((acc, day) => acc + day.tasks, 0)}
                </div>
                <p className="text-sm text-muted-foreground">In selected period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Avg Productivity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(performanceData.reduce((acc, day) => acc + day.productivity, 0) / performanceData.length)}%
                </div>
                <p className="text-sm text-muted-foreground">Overall productivity</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}