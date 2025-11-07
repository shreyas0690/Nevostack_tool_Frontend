import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ClipboardList, 
  Calendar,
  Target,
  Award,
  Clock,
  PieChart,
  Activity,
  Zap,
  Timer,
  Download
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { mockUsers, mockDepartments, mockTasks } from '@/data/mockData';
import { analyticsService } from '@/services/analyticsService';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';

export default function ManagerAnalytics() {
  const { currentUser } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  // Fixed values for task status distribution
  const taskStatusFilter = 'all';
  const includeOverdue = true;
  
  // Fetch task status distribution with backend filtering
  const { data: taskStatusData, isLoading: taskStatusLoading } = useQuery({
    queryKey: ['manager-analytics', 'task-status-distribution', taskStatusFilter, includeOverdue, currentUser?.id],
    queryFn: async () => {
      const res: any = await analyticsService.getTaskStatusDistribution({
        statusFilter: taskStatusFilter,
        includeOverdue: includeOverdue,
        excludeOverdue: taskStatusFilter === 'assigned' || taskStatusFilter === 'in_progress',
        managerId: currentUser?.id
      });
      return res?.data || null;
    },
    enabled: !!currentUser?.id,
    staleTime: 1000 * 60 * 5
  });
  
  // Get manager's team data
  const teamMembers = mockUsers.filter(user => user.managerId === currentUser?.id);
  
  // Apply filters
  const getFilteredTasks = () => {
    // Get manager's team tasks (tasks assigned BY the manager to team members)
    let filteredTasks = mockTasks.filter(task => task.managerId === currentUser?.id);
    
    // Apply time range filter
    if (timeRange !== 'all') {
      const days = parseInt(timeRange.replace('d', ''));
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filteredTasks = filteredTasks.filter(t => t.createdAt >= cutoffDate);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filteredTasks = filteredTasks.filter(t => t.status === statusFilter);
    }
    
    return filteredTasks;
  };
  
  const teamTasks = getFilteredTasks();

  // Calculate analytics
  const totalMembers = teamMembers.length;
  const activeMembers = teamMembers.filter(m => m.isActive).length;
  const totalTasks = teamTasks.length;
  const completedTasks = teamTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = teamTasks.filter(t => t.status === 'in_progress').length;
  const assignedTasks = teamTasks.filter(t => t.status === 'assigned').length;
  const blockedTasks = teamTasks.filter(t => t.status === 'blocked').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const avgTasksPerMember = totalMembers > 0 ? Math.round(totalTasks / totalMembers) : 0;
  
  // Chart colors
  const COLORS = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    cyan: '#06B6D4',
    pink: '#EC4899',
    indigo: '#6366F1'
  };

  // Prepare chart data with backend filtering
  const processTaskStatusData = () => {
    // Use backend filtered data if available
    if (taskStatusData && Array.isArray(taskStatusData)) {
      return taskStatusData.map((item: any) => ({
        name: item.name,
        value: item.value,
        color: item.color || (item.name === 'Completed' ? COLORS.success : 
                              item.name === 'In Progress' ? COLORS.primary : 
                              item.name === 'Assigned' ? COLORS.warning : 
                              item.name === 'Overdue' ? '#dc2626' : COLORS.danger)
      }));
    }
    
    // Fallback to mock data processing
    let data = [
      { name: 'Completed', value: completedTasks, color: COLORS.success },
      { name: 'In Progress', value: inProgressTasks, color: COLORS.primary },
      { name: 'Assigned', value: assignedTasks, color: COLORS.warning },
      { name: 'Blocked', value: blockedTasks, color: COLORS.danger }
    ];
    
    // Apply status filter
    if (taskStatusFilter !== 'all') {
      data = data.filter(item => item.name.toLowerCase().replace(' ', '_') === taskStatusFilter);
    }
    
    // Add overdue tasks if requested
    if (includeOverdue) {
      const overdueTasks = teamTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
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

  const taskStatusChartData = processTaskStatusData();

  const priorityData = [
    { 
      name: 'Urgent', 
      value: teamTasks.filter(t => t.priority === 'urgent').length,
      color: COLORS.danger 
    },
    { 
      name: 'High', 
      value: teamTasks.filter(t => t.priority === 'high').length,
      color: COLORS.warning 
    },
    { 
      name: 'Medium', 
      value: teamTasks.filter(t => t.priority === 'medium').length,
      color: COLORS.primary 
    },
    { 
      name: 'Low', 
      value: teamTasks.filter(t => t.priority === 'low').length,
      color: COLORS.success 
    }
  ];

  // Task creation trend data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const taskTrendData = last7Days.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const tasksCreated = teamTasks.filter(task => 
      task.createdAt.toISOString().split('T')[0] === dateStr
    ).length;
    const tasksCompleted = teamTasks.filter(task => 
      task.updatedAt.toISOString().split('T')[0] === dateStr && task.status === 'completed'
    ).length;
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      created: tasksCreated,
      completed: tasksCompleted,
      fullDate: dateStr
    };
  });

  // Team role distribution (only showing team members)
  const roleData = [
    { 
      name: 'Members', 
      value: teamMembers.filter(m => m.role === 'member').length,
      color: COLORS.success 
    }
  ];

  // Performance metrics over time
  const performanceData = last7Days.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const dayTasks = teamTasks.filter(task => 
      task.updatedAt.toISOString().split('T')[0] <= dateStr
    );
    const dayCompleted = dayTasks.filter(t => t.status === 'completed').length;
    const dayTotal = dayTasks.length;
    const efficiency = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      efficiency,
      productivity: Math.min(100, Math.round((dayCompleted / Math.max(1, teamMembers.length)) * 20)),
      engagement: Math.round((activeMembers / Math.max(1, totalMembers)) * 100)
    };
  });

  const analytics = [
    {
      title: 'Team Performance',
      value: `${completionRate}%`,
      description: 'Task completion rate',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/50'
    },
    {
      title: 'Total Tasks',
      value: totalTasks,
      description: 'Team tasks assigned',
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50'
    },
    {
      title: 'Active Members',
      value: `${activeMembers}/${totalMembers}`,
      description: 'Team availability',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50'
    },
    {
      title: 'Completed Tasks',
      value: completedTasks,
      description: 'Successfully finished',
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/50'
    },
    {
      title: 'In Progress',
      value: inProgressTasks,
      description: 'Currently active',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/50'
    },
    {
      title: 'Urgent Tasks',
      value: teamTasks.filter(t => t.priority === 'urgent').length,
      description: 'High priority items',
      icon: Zap,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Analytics</h1>
          <p className="text-muted-foreground">
            Performance insights for your team members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d' | 'all') => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Badge variant="outline" className="px-3 py-1">
            <BarChart3 className="w-4 h-4 mr-2" />
            Live Data
          </Badge>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {analytics.map((analytic) => {
          const Icon = analytic.icon;
          return (
            <Card key={analytic.title} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`absolute inset-0 ${analytic.bgColor} opacity-30`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium">
                  {analytic.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${analytic.color}`} />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{analytic.value}</div>
                <p className="text-xs text-muted-foreground">
                  {analytic.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Task Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  dataKey="value"
                  data={taskStatusChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                >
                  {taskStatusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Priority Analysis */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Task Priority Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.primary}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Creation vs Completion Trend */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Task Trends (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={taskTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="created" 
                  stroke={COLORS.primary} 
                  strokeWidth={2}
                  name="Created"
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke={COLORS.success} 
                  strokeWidth={2}
                  name="Completed"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Team Composition */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Composition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Team Members</span>
                <Badge variant="outline">{teamMembers.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Members</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {activeMembers}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Team Manager</span>
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  {currentUser?.name || 'Manager'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tasks per Member</span>
                <Badge variant="outline">
                  {avgTasksPerMember}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <Badge variant="default" className="bg-purple-100 text-purple-800">
                  {completionRate}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Team Productivity</span>
                <Badge variant="outline">
                  {totalMembers > 0 ? Math.round((completedTasks / totalMembers) * 10) : 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics Over Time */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Team Performance Metrics Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorProductivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="efficiency"
                stroke={COLORS.primary}
                fillOpacity={1}
                fill="url(#colorEfficiency)"
                name="Efficiency %"
              />
              <Area
                type="monotone"
                dataKey="productivity"
                stroke={COLORS.success}
                fillOpacity={1}
                fill="url(#colorProductivity)"
                name="Productivity %"
              />
              <Area
                type="monotone"
                dataKey="engagement"
                stroke={COLORS.warning}
                fillOpacity={1}
                fill="url(#colorEngagement)"
                name="Engagement %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Key Team Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/50 dark:bg-gray-900/50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900 dark:text-green-100">
                  Completion Rate
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                {completionRate}% task completion rate shows {completionRate >= 80 ? 'excellent' : completionRate >= 60 ? 'good' : 'needs improvement'} team performance.
              </p>
            </div>
            
            <div className="bg-white/50 dark:bg-gray-900/50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  Team Engagement
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {Math.round((activeMembers / Math.max(1, totalMembers)) * 100)}% of your team members are actively engaged in current projects.
              </p>
            </div>
            
            <div className="bg-white/50 dark:bg-gray-900/50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-900 dark:text-orange-100">
                  Workload Distribution
                </span>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Average of {avgTasksPerMember} tasks per team member indicates {avgTasksPerMember <= 3 ? 'optimal' : avgTasksPerMember <= 5 ? 'moderate' : 'high'} workload balance.
              </p>
            </div>
            
            <div className="bg-white/50 dark:bg-gray-900/50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-900 dark:text-red-100">
                  Priority Focus
                </span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                {teamTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length} high-priority tasks assigned to your team need attention.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}