import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Building2,
  UserCheck,
  UserX,
  Calendar,
  Clock,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  FileText
} from 'lucide-react';
import { saasAuthService } from '@/services/saasAuthService';

interface CompanyAnalyticsProps {
  companyId: string;
  companyName: string;
}

interface AnalyticsData {
  userActivity: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
  };
  departmentStats: Array<{
    _id: string;
    name: string;
    userCount: number;
  }>;
  roleStats: Array<{
    _id: string;
    userCount: number;
  }>;
  taskActivity: {
    totalTasks: number;
    taskTrend: Array<{
      date: string;
      count: number;
    }>;
  };
  meetingActivity: {
    totalMeetings: number;
    meetingTrend: Array<{
      date: string;
      count: number;
    }>;
  };
  recentLogins: Array<{
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    lastLogin: string;
    department: string;
  }>;
  period: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function CompanyAnalytics({ companyId, companyName }: CompanyAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [companyId, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      if (!saasAuthService.isSaaSAuthenticated()) {
        console.error('❌ SaaS authentication required');
        return;
      }

      console.log('📊 Fetching analytics for company:', companyId, 'period:', period);
      const response = await saasAuthService.authenticatedFetch(
        `/api/saas/companies/${companyId}/analytics?period=${period}`
      );

      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Analytics data received:', data);
        setAnalytics(data.data);
      } else {
        const errorData = await response.text();
        console.error('❌ API Error:', errorData);
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
    } finally {
      setLoading(false);
    }
  };


  const formatRoleName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrator',
      'manager': 'Manager',
      'member': 'Member',
      'hr': 'HR',
      'department_head': 'Department Head'
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Analytics for {companyName}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Detailed insights into company usage and activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-32 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {analytics.userActivity.totalUsers}
            </div>
            <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Registered users
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Active Users
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {analytics.userActivity.activeUsers}
            </div>
            <div className="mt-1 text-sm text-green-700 dark:text-green-300">
              Recently active
            </div>
            <div className="mt-2 text-xs text-green-600 dark:text-green-400">
              {analytics.userActivity.totalUsers > 0 
                ? `${Math.round((analytics.userActivity.activeUsers / analytics.userActivity.totalUsers) * 100)}% of total`
                : '0% of total'
              }
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Total Departments
            </CardTitle>
            <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {analytics.departmentStats.length}
            </div>
            <div className="mt-1 text-sm text-purple-700 dark:text-purple-300">
              Active departments
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Total Tasks
            </CardTitle>
            <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {analytics.taskActivity.totalTasks}
            </div>
            <div className="mt-1 text-sm text-orange-700 dark:text-orange-300">
              Tasks created
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-700 dark:text-teal-300">
              Total Meetings
            </CardTitle>
            <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-900 dark:text-teal-100">
              {analytics.meetingActivity.totalMeetings}
            </div>
            <div className="mt-1 text-sm text-teal-700 dark:text-teal-300">
              Meetings scheduled
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Role Distribution */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
              <UserCheck className="h-5 w-5 mr-2" />
              Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.roleStats.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.roleStats.map(role => ({
                    name: formatRoleName(role._id),
                    users: role.userCount
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="users" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No role data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
              <Building2 className="h-5 w-5 mr-2" />
              Department Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.departmentStats.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.departmentStats.map((dept, index) => ({
                        name: dept.name,
                        value: dept.userCount,
                        fill: COLORS[index % COLORS.length]
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.departmentStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No department data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
            <Activity className="h-5 w-5 mr-2" />
            User Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {analytics.userActivity.totalUsers}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Total Users</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analytics.userActivity.activeUsers}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Active Users</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {analytics.departmentStats.length}
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">Total Departments</div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Activity Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">User Engagement Rate</span>
                  <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-700">
                    {analytics.userActivity.totalUsers > 0 
                      ? `${Math.round((analytics.userActivity.activeUsers / analytics.userActivity.totalUsers) * 100)}%`
                      : '0%'
                    }
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Department Coverage</span>
                  <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700">
                    {analytics.userActivity.totalUsers > 0 && analytics.departmentStats.length > 0
                      ? `${Math.round((analytics.userActivity.totalUsers / analytics.departmentStats.length) * 10) / 10} users/dept`
                      : '0 users/dept'
                    }
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Period</span>
                  <Badge variant="outline">
                    {period === '7d' ? 'Last 7 days' : 
                     period === '30d' ? 'Last 30 days' : 
                     'Last 90 days'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task and Meeting Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Task Trend */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
              <FileText className="h-5 w-5 mr-2" />
              Task Creation Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.taskActivity.taskTrend.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.taskActivity.taskTrend}>
                    <defs>
                      <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '14px'
                      }}
                      labelStyle={{ color: '#374151', fontWeight: '600' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#f97316"
                      strokeWidth={3}
                      fill="url(#taskGradient)"
                      dot={{
                        fill: '#f97316',
                        strokeWidth: 2,
                        stroke: '#fff',
                        r: 5
                      }}
                      activeDot={{
                        r: 7,
                        fill: '#f97316',
                        stroke: '#fff',
                        strokeWidth: 2
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No task trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meeting Trend */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
              <Calendar className="h-5 w-5 mr-2" />
              Meeting Schedule Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.meetingActivity.meetingTrend.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.meetingActivity.meetingTrend}>
                    <defs>
                      <linearGradient id="meetingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '14px'
                      }}
                      labelStyle={{ color: '#374151', fontWeight: '600' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#14b8a6"
                      strokeWidth={3}
                      fill="url(#meetingGradient)"
                      dot={{
                        fill: '#14b8a6',
                        strokeWidth: 2,
                        stroke: '#fff',
                        r: 5
                      }}
                      activeDot={{
                        r: 7,
                        fill: '#14b8a6',
                        stroke: '#fff',
                        strokeWidth: 2
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No meeting trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Login History */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
              <UserCheck className="h-5 w-5 mr-2" />
              Recent Login History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.recentLogins.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentLogins.map((login, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {login.firstName[0]}{login.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {login.firstName} {login.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{login.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatRoleName(login.role)} • {login.department}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(login.lastLogin).toLocaleDateString()} at {new Date(login.lastLogin).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No recent login activity in the selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
