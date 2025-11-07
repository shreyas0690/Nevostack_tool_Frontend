import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  FileText,
  Calendar,
  Database,
  Bell,
  Shield,
  CreditCard,
  UserPlus,
  MessageSquare,
  Settings,
  RefreshCw,
  Download,
  Plus,
  Eye,
  Zap,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  Server,
  HardDrive,
  Crown,
  Star,
  Briefcase,
  Mail
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { saasService, type SaaSDashboardStats } from '@/services/saasService';
import { toast } from 'sonner';

export default function SaaSSuperAdminDashboard() {
  const [stats, setStats] = useState<SaaSDashboardStats | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardStats = async () => {
    try {
      console.log('📊 Loading enhanced SaaS dashboard stats...');
      const [dashboardData, trendsData] = await Promise.all([
        saasService.getDashboardStats(),
        saasService.getMonthlyTrends()
      ]);

      setStats(dashboardData);
      setMonthlyTrends(trendsData);
      console.log('✅ Enhanced dashboard stats loaded:', dashboardData);
      console.log('✅ Monthly trends loaded:', trendsData);
    } catch (error) {
      console.error('❌ Error loading dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="text-lg font-medium">Loading Super Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h3>
        <p className="text-gray-600 mb-4">Unable to fetch dashboard statistics</p>
        <Button onClick={loadDashboardStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Chart colors
  const colors = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',
    purple: '#8B5CF6'
  };

  // Plan distribution chart data - Include all 4 categories
  const planChartData = [
    { name: 'Free', value: stats.planDistribution.free || 0, color: colors.success },
    { name: 'Basic', value: stats.planDistribution.basic || 0, color: colors.info },
    { name: 'Premium', value: stats.planDistribution.premium || 0, color: colors.primary },
    { name: 'Enterprise', value: stats.planDistribution.enterprise || 0, color: colors.purple }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const GrowthIndicator = ({ value, label }: { value: number; label: string }) => (
    <div className="flex items-center space-x-1">
      {value >= 0 ? (
        <ArrowUpRight className="h-4 w-4 text-green-500" />
      ) : (
        <ArrowDownRight className="h-4 w-4 text-red-500" />
      )}
      <span className={`text-sm font-medium ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {Math.abs(value)}% {label}
      </span>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 p-3 sm:p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Companies */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">
              <span className="hidden sm:inline">Total Companies Registered</span>
              <span className="sm:hidden">Companies</span>
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
              {formatNumber(stats.totalCompanies)}
            </div>
            <GrowthIndicator value={stats.growth.companies} label="this month" />
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              {stats.activeCompanies} active, {stats.trialCompanies} on trial
              </div>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
              <span className="hidden sm:inline">Total Users (All Companies)</span>
              <span className="sm:hidden">Users</span>
            </CardTitle>
            <Users className="h-4 w-4 text-green-600 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">
              {formatNumber(stats.totalUsers)}
            </div>
            <GrowthIndicator value={stats.growth.users} label="this month" />
            <div className="mt-2 text-xs text-green-600 dark:text-green-400">
              {stats.activeUsersToday} active users today
              </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300">
              <span className="hidden sm:inline">Monthly Revenue</span>
              <span className="sm:hidden">Revenue</span>
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-purple-900 dark:text-purple-100">
              {formatCurrency(stats.monthlyRevenue)}
            </div>
            <GrowthIndicator value={stats.growth.revenue} label="vs last month" />
            <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
              {formatCurrency(stats.yearlyRevenue)} annually
              </div>
          </CardContent>
        </Card>

        {/* New Signups */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300">
              <span className="hidden sm:inline">New Signups</span>
              <span className="sm:hidden">Signups</span>
            </CardTitle>
            <UserPlus className="h-4 w-4 text-orange-600 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-900 dark:text-orange-100">
              {stats.newSignups.month}
            </div>
            <div className="mt-1 text-sm text-orange-700 dark:text-orange-300">
              This month
            </div>
            <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
              {stats.newSignups.today} today, {stats.newSignups.week} this week
              </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Revenue Growth Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center text-sm sm:text-base">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">📈 Growth Trends (Last 1 Month)</span>
              <span className="sm:hidden">📈 Growth Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                {/* Styled tooltip: colored dot, spacing and original text colors preserved */}
                <Tooltip content={(props: any) => {
                  const { active, payload, label } = props || {};
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="bg-white p-3 rounded shadow-lg text-sm">
                      <div className="font-medium mb-2 text-gray-700">{`Day ${label}`}</div>
                      {payload.map((entry: any, idx: number) => {
                        const seriesName = entry.name || entry.dataKey || Object.keys(entry.payload || {}).find((k: string) => !['day','month','date'].includes(k)) || `Series ${idx+1}`;
                        const isRevenue = String(seriesName).toLowerCase().includes('revenue') || entry.dataKey === 'revenue';
                        const formattedValue = isRevenue ? formatCurrency(Number(entry.value)) : formatNumber(Number(entry.value));
                        const seriesColor = entry.stroke || entry.color || entry.fill || (entry.dataKey === 'revenue' ? colors.primary : entry.dataKey === 'companies' ? colors.success : colors.purple);
                        const leftClass = `flex items-center gap-2 ${isRevenue ? 'pr-6' : ''}`;
                        return (
                          <div key={idx} className="flex items-center justify-between py-1">
                            <div className={leftClass}>
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seriesColor }} />
                              <span className="text-gray-600">{seriesName}</span>
                            </div>
                            <div className="font-semibold text-gray-900">{formattedValue}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke={colors.primary} strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="companies" stroke={colors.success} strokeWidth={2} name="Companies" />
                <Line type="monotone" dataKey="users" stroke={colors.purple} strokeWidth={2} name="Users" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center text-sm sm:text-base">
              <PieChart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">📊 Plan Distribution</span>
              <span className="sm:hidden">📊 Plans</span>
            </CardTitle>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={planChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {planChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Companies']} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {planChartData.map((entry, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm">{entry.name}</span>
                  </div>
                  <span className="text-sm font-medium">{entry.value}</span>
              </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="activities" className="w-full">
        <TabsList className="grid w-full grid-cols-2 text-xs sm:text-sm">
          <TabsTrigger value="activities" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">🎯 Recent Activities</span>
            <span className="sm:hidden">🎯 Activities</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">🏥 System Health</span>
            <span className="sm:hidden">🏥 Health</span>
          </TabsTrigger>
        </TabsList>

        {/* Recent Activities Tab */}
        <TabsContent value="activities" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Latest Companies - Enhanced Design */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
                      <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span>Latest Registered Companies</span>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    {stats.recentActivities.companies.length} New
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {stats.recentActivities.companies.map((company, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">
                            {company.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {company.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                              <Mail className="h-3 w-3 mr-1" />
                              {company.email}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(company.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge 
                            variant={company.plan === 'enterprise' ? 'default' : 'outline'}
                            className={`text-xs ${
                              company.plan === 'enterprise' ? 'bg-purple-500' : 
                              company.plan === 'pro' ? 'bg-blue-500' : 'bg-gray-500'
                            }`}
                          >
                            {company.plan}
                          </Badge>
                          <Badge 
                            variant={company.status === 'active' ? 'outline' : 'destructive'}
                            className="text-xs"
                          >
                            <div className={`w-2 h-2 rounded-full mr-1 ${
                              company.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            {company.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Payments - Enhanced Design */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mr-3">
                      <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span>Recent Payments & Subscriptions</span>
                  </div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(stats.recentActivities.payments.reduce((sum, p) => sum + p.amount, 0))}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {stats.recentActivities.payments.map((payment, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            payment.status === 'completed' 
                              ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                              : 'bg-gradient-to-br from-yellow-400 to-orange-500'
                          }`}>
                            <DollarSign className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {payment.company}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Invoice #{Math.floor(Math.random() * 10000)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(payment.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(payment.amount)}
                          </div>
                          <Badge 
                            variant={payment.status === 'completed' ? 'default' : 'secondary'}
                            className={`text-xs mt-1 ${
                              payment.status === 'completed' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                            }`}
                          >
                            {payment.status === 'completed' ? '✓ Paid' : '⏳ Pending'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Health Tab - Clean Modern Design */}
        <TabsContent value="system">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Tasks Card */}
            <Card className="border border-cyan-200/50 dark:border-cyan-800/50 bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/30 dark:to-blue-950/30 shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-cyan-100 dark:bg-cyan-900/50 rounded-xl shadow-sm">
                      <Briefcase className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                    </div>
                  <Badge variant="outline" className="text-cyan-700 border-cyan-200 bg-cyan-50">
                    {stats.growth.companies > 0 ? `+${stats.growth.companies}%` : `${stats.growth.companies}%`}
                    </Badge>
                  </div>
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                      Total Tasks Created
                    </p>
                  <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                      {formatNumber(stats.systemHealth.totalTasks)}
                    </div>
                  <Progress value={Math.min((stats.systemHealth.totalTasks / 1000) * 100, 100)} className="h-2 bg-cyan-100 dark:bg-cyan-900/30" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                    {Math.round((stats.systemHealth.totalTasks / 1000) * 100)}% of monthly target
                    </p>
                  </div>
                </CardContent>
            </Card>

            {/* Meetings Card */}
            <Card className="border border-indigo-200/50 dark:border-indigo-800/50 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30 shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl shadow-sm">
                      <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  <Badge variant="outline" className="text-indigo-700 border-indigo-200 bg-indigo-50">
                    {stats.growth.users > 0 ? `+${stats.growth.users}%` : `${stats.growth.users}%`}
                    </Badge>
                  </div>
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                      Meetings Scheduled
                    </p>
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      {formatNumber(stats.systemHealth.totalMeetings)}
                    </div>
                  <Progress value={Math.min((stats.systemHealth.totalMeetings / 500) * 100, 100)} className="h-2 bg-indigo-100 dark:bg-indigo-900/30" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                    {Math.round((stats.systemHealth.totalMeetings / 500) * 100)}% capacity utilized
                    </p>
                  </div>
                </CardContent>
            </Card>

            {/* Leave Requests Card */}
            <Card className="border border-pink-200/50 dark:border-pink-800/50 bg-gradient-to-br from-pink-50/50 to-rose-50/50 dark:from-pink-950/30 dark:to-rose-950/30 shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-pink-100 dark:bg-pink-900/50 rounded-xl shadow-sm">
                      <Timer className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                    </div>
                  <Badge variant="outline" className="text-pink-700 border-pink-200 bg-pink-50">
                    {stats.growth.revenue > 0 ? `+${stats.growth.revenue}%` : `${stats.growth.revenue}%`}
                    </Badge>
                  </div>
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                      Leave Requests
                    </p>
                  <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                      {formatNumber(stats.systemHealth.totalLeaves)}
                    </div>
                  <Progress value={Math.min((stats.systemHealth.totalLeaves / 200) * 100, 100)} className="h-2 bg-pink-100 dark:bg-pink-900/30" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Across all companies
                    </p>
                  </div>
                </CardContent>
            </Card>

            {/* Storage Card */}
            <Card className="border border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/30 shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl shadow-sm">
                      <HardDrive className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                  <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                      {stats.systemHealth.storageUsed}%
                    </Badge>
                  </div>
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                      Storage Usage
                    </p>
                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                      {stats.systemHealth.storageUsed} GB
                    </div>
                  <Progress value={(stats.systemHealth.storageUsed / 100) * 100} className="h-2 bg-amber-100 dark:bg-amber-900/30" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      of 100 GB total
                    </p>
                  </div>
                </CardContent>
            </Card>
          </div>

        </TabsContent>

        {/* Companies Overview Tab - Clean Modern Design */}
      </Tabs>
    </div>
  );
}