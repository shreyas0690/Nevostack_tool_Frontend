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
import { analyticsService } from '@/services/analyticsService';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function HRAnalytics() {
  const [performancePeriod, setPerformancePeriod] = useState<'week' | 'month' | 'year'>('week');
  // Fixed values for task status distribution
  const taskStatusFilter = 'all';
  const includeOverdue = true;
  
  // Fetch real analytics from backend (fallback to mocks)
  const { data: overviewData, isLoading } = useQuery({
    queryKey: ['analytics','overview'],
    queryFn: async () => {
      const res: any = await analyticsService.getOverview({});
      return res?.data || null;
    },
    staleTime: 1000 * 60 * 5
  });

  // Fetch task status distribution with backend filtering
  const { data: taskStatusData, isLoading: taskStatusLoading } = useQuery({
    queryKey: ['hr-analytics', 'task-status-distribution', taskStatusFilter, includeOverdue],
    queryFn: async () => {
      const res: any = await analyticsService.getTaskStatusDistribution({
        statusFilter: taskStatusFilter,
        includeOverdue: includeOverdue,
        excludeOverdue: true // Always exclude overdue from assigned and in-progress counts
      });
      return res?.data || null;
    },
    staleTime: 1000 * 60 * 5
  });

  // Process task status data with backend filtering
  const tasksByStatus = taskStatusData && taskStatusData.taskStatusData && Array.isArray(taskStatusData.taskStatusData)
    ? taskStatusData.taskStatusData.map((item: any) => ({
        name: item.name,
        value: item.value,
        color: item.color || (item.name === 'Completed' ? '#22c55e' : 
                              item.name === 'In Progress' ? '#3b82f6' : 
                              item.name === 'Assigned' ? '#f59e0b' : 
                              item.name === 'Overdue' ? '#dc2626' : '#ef4444')
      }))
    : overviewData
      ? Object.entries(overviewData.tasksByStatus || {}).map(([k, v]) => ({ name: k, value: v as number, color: k === 'completed' ? '#22c55e' : k === 'in_progress' ? '#3b82f6' : k === 'assigned' ? '#f59e0b' : '#ef4444' }))
      : [];

  // Prefer backend priority breakdown if provided
  const tasksByPriority = overviewData && overviewData.tasksByPriority
    ? Object.entries(overviewData.tasksByPriority).map(([k, v]) => ({ name: k, value: v as number, color: k === 'low' ? '#6b7280' : k === 'medium' ? '#f59e0b' : k === 'high' ? '#f97316' : '#dc2626' }))
    : [];

  // Department Performance - use only backend data; do not fall back to mock data
  const departmentData = overviewData && Array.isArray(overviewData.byDepartment)
    ? (overviewData.byDepartment as any[]).map(d => ({
        name: d.name || d.departmentName || (d.departmentId ? String(d.departmentId) : '—'),
        totalTasks: d.total || d.count || 0,
        completedTasks: d.completed || 0,
        // show integer percentage (no long decimal tails)
        completionRate: d.completionRate ? Math.round(Number(d.completionRate)) : 0,
        members: d.members || 0
      }))
    : [];

  // User Performance
  // Top performers: prefer backend `topPerformers` if provided
  const userPerformance = overviewData && Array.isArray(overviewData.topPerformers)
    ? (overviewData.topPerformers as any[]).map((p, idx) => ({
        name: p.user?.name || `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim() || `User ${idx+1}`,
        totalTasks: p.total || p.totalTasks || 0,
        completedTasks: p.completed || 0,
        // show integer percentage (no fractional digits)
        completionRate: Number.isFinite(p.completionRate) ? Math.round(Number(p.completionRate)) : Math.round((p.completionRate || 0)),
        department: p.departmentName || 'Unknown'
      }))
    : [];

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
  // Fetch tasks timeseries for Performance Trend when possible
  const { data: tasksSeries } = useQuery({
    queryKey: ['analytics','tasksSeries', performancePeriod],
    queryFn: async () => {
      // map performancePeriod to groupBy
      const groupBy = performancePeriod === 'week' ? 'day' : performancePeriod === 'month' ? 'day' : 'month';
      const res: any = await analyticsService.getTasksTimeseries({ groupBy });
      return res?.data || [];
    },
    enabled: true,
    staleTime: 1000 * 60 * 5
  });

  // Map backend timeseries (expects { date, total, completed }) into chart shape
  const trendData = tasksSeries && tasksSeries.length > 0
    ? tasksSeries.map((r: any) => ({ period: new Date(r.date).toLocaleDateString(), tasks: r.total || r.count || 0, completed: r.completed || 0 }))
    : performanceData;

  // Leave Analytics (from backend if available)
  const leaveByType = overviewData && overviewData.leavesByType
    ? Object.entries(overviewData.leavesByType).map(([k, v]) => ({ name: k, value: v as number, color: '#3b82f6' }))
    : [];

  // Key Metrics
  // Key metrics derived from backend overview when available
  const totalTasksCount = overviewData?.totalTasks || 0;
  const completedCount = overviewData?.tasksByStatus?.completed || 0;
  // Use backend-provided completion rate if available, otherwise compute
  const totalCompletionRate = overviewData?.completionRate ? Math.round(Number(overviewData.completionRate)) : (totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0);
  const avgTasksPerUser = overviewData?.avgTasksPerUser ? Math.round(Number(overviewData.avgTasksPerUser)) : (overviewData?.usersCount && overviewData.usersCount > 0 ? Math.round(totalTasksCount / overviewData.usersCount) : 0);
  // Calculate urgent tasks that are not overdue, blocked, or completed
  const urgentTasks = (() => {
    if (overviewData?.tasksList?.length > 0) {
      return overviewData.tasksList.filter(task => 
        (task.priority === 'urgent' || task.priority === 'high') &&
        task.status !== 'completed' &&
        task.status !== 'blocked' &&
        (!task.dueDate || new Date(task.dueDate) >= new Date())
      ).length;
    }
    return overviewData?.tasksByPriority?.urgent || overviewData?.urgentTasks || 0;
  })();
  const overdueTasks = overviewData?.overdue || overviewData?.overdue || 0;

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
        {(isLoading || taskStatusLoading) ? (
          // Loading skeleton for key metrics
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-3 w-20 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          keyMetrics.map((metric) => {
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
          })
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {(isLoading || taskStatusLoading) ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-muted-foreground">Loading chart data...</p>
                    </div>
                  </div>
                ) : (
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
                )}
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Task Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {(isLoading || taskStatusLoading) ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-muted-foreground">Loading chart data...</p>
                    </div>
                  </div>
                ) : (
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
                )}
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
                    disabled={isLoading}
                  >
                    1 Week
                  </Button>
                  <Button
                    variant={performancePeriod === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPerformancePeriod('month')}
                    disabled={isLoading}
                  >
                    1 Month
                  </Button>
                  <Button
                    variant={performancePeriod === 'year' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPerformancePeriod('year')}
                    disabled={isLoading}
                  >
                    1 Year
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(isLoading || taskStatusLoading) ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-muted-foreground">Loading performance data...</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trendData && trendData.length > 0 ? trendData : performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="tasks" stackId="1" stroke="#8884d8" fill="#8884d8" name="Total Tasks" />
                      <Area type="monotone" dataKey="completed" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Completed Tasks" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
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
              {(isLoading || taskStatusLoading) ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-muted-foreground">Loading department data...</p>
                  </div>
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Department Completion Rates</CardTitle>
            </CardHeader>
            <CardContent>
              {(isLoading || taskStatusLoading) ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted animate-pulse rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                          <div className="h-3 w-48 bg-muted animate-pulse rounded"></div>
                        </div>
                      </div>
                      <div className="h-6 w-12 bg-muted animate-pulse rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {departmentData
                    .sort((a, b) => b.completionRate - a.completionRate) // Sort by completion rate descending
                    .map((dept, index) => (
                    <div key={dept.name} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{dept.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {dept.completedTasks}/{dept.totalTasks} tasks completed • {dept.members} members
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {index < 3 && <Award className="h-4 w-4 text-yellow-500" />}
                        <Badge
                          variant={dept.completionRate >= 80 ? 'default' : dept.completionRate >= 60 ? 'secondary' : 'destructive'}
                        >
                          {dept.completionRate}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              {(isLoading || taskStatusLoading) ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted animate-pulse rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                          <div className="h-3 w-48 bg-muted animate-pulse rounded"></div>
                        </div>
                      </div>
                      <div className="h-6 w-12 bg-muted animate-pulse rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {userPerformance
                    .sort((a, b) => b.completionRate - a.completionRate) // Sort by completion rate descending
                    .slice(0, 10)
                    .map((user, index) => (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Analysis tab removed per request */}
      </Tabs>
    </div>
  );
}