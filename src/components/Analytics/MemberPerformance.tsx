import { useState } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { mockTasks } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, TrendingUp, Target, Award, Clock, PieChart, Activity, Zap, Filter, Download
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export default function MemberPerformance() {
  const { currentUser } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter tasks assigned to current member
  const getFilteredTasks = () => {
    let tasks = mockTasks.filter(t => t.assignedTo === currentUser?.id);
    if (timeRange !== 'all') {
      const days = parseInt(timeRange.replace('d', ''));
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      tasks = tasks.filter(t => t.createdAt >= cutoff);
    }
    if (statusFilter !== 'all') {
      tasks = tasks.filter(t => t.status === statusFilter);
    }
    return tasks;
  };

  const myTasks = getFilteredTasks();

  // Metrics
  const totalTasks = myTasks.length;
  const completedTasks = myTasks.filter(t => t.status === 'completed');
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress');
  const assignedTasks = myTasks.filter(t => t.status === 'assigned');
  const blockedTasks = myTasks.filter(t => t.status === 'blocked');
  const overdueTasks = myTasks.filter(t => t.dueDate < new Date() && t.status !== 'completed');
  const onTimeCompleted = completedTasks.filter(t => t.updatedAt <= t.dueDate).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const onTimeRate = completedTasks.length > 0 ? Math.round((onTimeCompleted / completedTasks.length) * 100) : 0;

  // Colors
  const COLORS = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
  };

  // Charts data
  const statusData = [
    { name: 'Completed', value: completedTasks.length, color: COLORS.success },
    { name: 'In Progress', value: inProgressTasks.length, color: COLORS.primary },
    { name: 'Assigned', value: assignedTasks.length, color: COLORS.warning },
    { name: 'Blocked', value: blockedTasks.length, color: COLORS.danger },
  ];

  const priorityData = [
    { name: 'Urgent', value: myTasks.filter(t => t.priority === 'urgent').length, color: COLORS.danger },
    { name: 'High', value: myTasks.filter(t => t.priority === 'high').length, color: COLORS.warning },
    { name: 'Medium', value: myTasks.filter(t => t.priority === 'medium').length, color: COLORS.primary },
    { name: 'Low', value: myTasks.filter(t => t.priority === 'low').length, color: COLORS.success },
  ];

  // Trend last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d;
  });
  const trendData = last7Days.map(date => {
    const dStr = date.toISOString().split('T')[0];
    const created = myTasks.filter(t => t.createdAt.toISOString().split('T')[0] === dStr).length;
    const completed = myTasks.filter(t => t.updatedAt.toISOString().split('T')[0] === dStr && t.status === 'completed').length;
    return { date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), created, completed };
  });

  // Performance metrics over time (efficiency, focus)
  const performanceData = last7Days.map(date => {
    const dStr = date.toISOString().split('T')[0];
    const tillDate = myTasks.filter(t => t.updatedAt.toISOString().split('T')[0] <= dStr);
    const done = tillDate.filter(t => t.status === 'completed').length;
    const total = tillDate.length;
    const efficiency = total > 0 ? Math.round((done / total) * 100) : 0;
    const focus = Math.min(100, Math.round(done * 10));
    return { date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), efficiency, focus };
  });

  const cards = [
    { title: 'My Completion Rate', value: `${completionRate}%`, desc: 'Completed out of total', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Total Tasks', value: totalTasks, desc: 'Assigned to me', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'On-Time Completion', value: `${onTimeRate}%`, desc: 'Completed before due', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Overdue Tasks', value: overdueTasks.length, desc: 'Need attention', icon: Award, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'In Progress', value: inProgressTasks.length, desc: 'Currently active', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Blocked', value: blockedTasks.length, desc: 'Waiting/unblocked', icon: Zap, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Performance</h1>
          <p className="text-muted-foreground">Personal productivity and progress overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v: '7d'|'30d'|'90d'|'all') => setTimeRange(v)}>
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
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2"/>Export</Button>
          <Badge variant="outline" className="px-3 py-1">
            <BarChart3 className="w-4 h-4 mr-2" /> Live
          </Badge>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`absolute inset-0 ${c.bg} opacity-30`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
                <Icon className={`h-4 w-4 ${c.color}`} />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{c.value}</div>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" /> Task Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie dataKey="value" data={statusData} cx="50%" cy="50%" outerRadius={80} label={({name, value, percent}) => `${name}: ${value} (${(percent*100).toFixed(0)}%)`}>
                  {statusData.map((e, i) => (<Cell key={i} fill={e.color} />))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" /> Priority Breakdown
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
                  {priorityData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> My Task Trends (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="created" stroke={COLORS.primary} strokeWidth={2} name="Created" />
                <Line type="monotone" dataKey="completed" stroke={COLORS.success} strokeWidth={2} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" /> Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="mp_eff" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="mp_focus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="efficiency" stroke={COLORS.primary} fillOpacity={1} fill="url(#mp_eff)" name="Efficiency %" />
                <Area type="monotone" dataKey="focus" stroke={COLORS.success} fillOpacity={1} fill="url(#mp_focus)" name="Focus %" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" /> Key Personal Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium">Completion Rate</span>
              </div>
              <p className="text-sm text-green-700">{completionRate}% completion indicates {completionRate >= 80 ? 'excellent' : completionRate >= 60 ? 'good' : 'improving'} progress.</p>
            </div>
            <div className="bg-white/50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="font-medium">On-Time Delivery</span>
              </div>
              <p className="text-sm text-purple-700">{onTimeRate}% of your completed tasks were on time.</p>
            </div>
            <div className="bg-white/50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-red-600" />
                <span className="font-medium">High Priority</span>
              </div>
              <p className="text-sm text-red-700">{myTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length} high-priority tasks currently assigned.</p>
            </div>
            <div className="bg-white/50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Active Workload</span>
              </div>
              <p className="text-sm text-orange-700">{inProgressTasks.length} tasks in progress, {blockedTasks.length} blocked.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
