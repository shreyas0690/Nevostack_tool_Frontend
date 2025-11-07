import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2,
  DollarSign,
  Activity,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Award,
  Globe,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download,
  RefreshCw,
  Filter,
  Star,
  Crown,
  Shield,
  Rocket,
  Sparkles,
  Database,
  Server,
  HeartHandshake
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
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
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { toast } from 'sonner';
import { saasAuthService } from '@/services/saasAuthService';
import * as XLSX from 'xlsx';

// Loading Skeleton Components
const CardSkeleton = () => (
  <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse">
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
      </div>
      <div className="h-8 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-1"></div>
      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
      <div className="h-3 w-40 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mt-2"></div>
    </CardContent>
  </Card>
);

const ChartSkeleton = ({ height = 400 }) => (
  <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border-0 shadow-xl">
    <CardHeader>
      <CardTitle className="flex items-center text-xl text-gray-900 dark:text-gray-100">
        <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg mr-3 animate-pulse">
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div
        className="bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"
        style={{ height: `${height}px` }}
      ></div>
    </CardContent>
  </Card>
);

const MetricSkeleton = () => (
  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-2 mx-auto"></div>
    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mx-auto"></div>
  </div>
);

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

export default function SaaSPlatformAnalytics() {
  const [timeframe, setTimeframe] = useState('12M');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  const fetchAnalytics = async (selectedTimeframe = timeframe) => {
    try {
      setLoading(true);

      // Remove pre-API authentication check - let authenticatedFetch handle it

      console.log('📊 Fetching platform analytics for timeframe:', selectedTimeframe);

      const response = await saasAuthService.authenticatedFetch(
        `/api/saas/analytics/platform?timeframe=${selectedTimeframe}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Analytics data received:', data);
        console.log('📊 Summary data:', data.data?.summary);
        console.log('📈 Charts data:', data.data?.charts);

        if (data.success && data.data) {
          setAnalyticsData(data.data);
          toast.success("Analytics data updated!");
        } else {
          toast.error('Invalid analytics data received');
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Analytics API error:', errorData);
        toast.error(errorData.message || 'Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      toast.error('Network error: Failed to fetch analytics data');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const refreshData = async () => {
    toast.info("Refreshing analytics data...");
    await fetchAnalytics();
  };


  // Fetch data on component mount and timeframe change
  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (timeframe && analyticsData?.timeframe !== timeframe) {
      fetchAnalytics(timeframe);
    }
  }, [timeframe]);

  // Calculate key metrics from fetched data
  const summary = analyticsData?.summary || {};
  const charts = analyticsData?.charts || {};

  const currentMRR = summary.totalRevenue || 0;
  const mrrGrowth = summary.mrrGrowth || '0.0';
  const totalUsers = summary.totalUsers || 0;
  const userGrowth = summary.userGrowth || '0.0';
  const activeCompanies = summary.activeCompanies || 0;
  const platformUptime = summary.platformUptime || 99.8;
  const engagementScore = summary.engagementScore || 0;
  const avgRevenuePerUser = summary.avgRevenuePerUser || 0;

  // Format currency in INR
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Generate sample data if no real data is available
  const generateSampleRevenueData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => ({
      month,
      revenue: Math.max(0, 1000 + (index * 200) + Math.random() * 500),
      customers: Math.max(0, 5 + (index * 2) + Math.floor(Math.random() * 3)),
      arr: Math.max(0, 12000 + (index * 2400) + Math.random() * 6000),
      mrr: Math.max(0, 1000 + (index * 200) + Math.random() * 500)
    }));
  };

  const generateSamplePlanData = () => {
    return [
      { name: 'Free', value: 45, count: 9, color: '#10b981', revenue: 0 },
      { name: 'Basic', value: 30, count: 6, color: '#3b82f6', revenue: 5994 },
      { name: 'Premium', value: 20, count: 4, color: '#8b5cf6', revenue: 11996 },
      { name: 'Enterprise', value: 5, count: 1, color: '#f59e0b', revenue: 5999 }
    ];
  };

  // Export Revenue Report to Excel
  const exportRevenueReport = () => {
    try {
      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Revenue Summary Sheet
      const revenueSummary = [
        ['Metric', 'Value'],
        ['Monthly Recurring Revenue (MRR)', formatCurrency(currentMRR)],
        ['Annual Recurring Revenue (ARR)', formatCurrency(currentMRR * 12)],
        ['Total Users', totalUsers],
        ['Active Companies', activeCompanies],
        ['Average Revenue per User', formatCurrency(avgRevenuePerUser)],
        ['Platform Uptime', `${platformUptime}%`],
        ['Engagement Score', `${engagementScore}%`],
        ['MRR Growth', `${mrrGrowth}%`],
        ['User Growth', `${userGrowth}%`]
      ];

      const revenueSheet = XLSX.utils.aoa_to_sheet(revenueSummary);
      XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue Summary');

      // Plan Distribution Sheet
      if (charts.planDistribution && charts.planDistribution.length > 0) {
        const planData = [
          ['Plan Name', 'Users', 'Percentage', 'Revenue', 'Revenue per User']
        ];
        
        charts.planDistribution.forEach(plan => {
          planData.push([
            plan.name,
            plan.count,
            `${plan.value}%`,
            plan.revenue > 0 ? formatCurrency(plan.revenue) : 'Free Plan',
            plan.count > 0 ? formatCurrency(plan.revenue / plan.count) : 'N/A'
          ]);
        });

        const planSheet = XLSX.utils.aoa_to_sheet(planData);
        XLSX.utils.book_append_sheet(workbook, planSheet, 'Plan Distribution');
      }

      // Revenue Growth Sheet
      if (charts.revenueGrowth && charts.revenueGrowth.length > 0) {
        const growthData = [
          ['Month', 'Revenue', 'Customers', 'ARR', 'MRR']
        ];
        
        charts.revenueGrowth.forEach(month => {
          growthData.push([
            month.month,
            formatCurrency(month.revenue),
            month.customers,
            formatCurrency(month.arr),
            formatCurrency(month.mrr)
          ]);
        });

        const growthSheet = XLSX.utils.aoa_to_sheet(growthData);
        XLSX.utils.book_append_sheet(workbook, growthSheet, 'Revenue Growth');
      }

      // User Growth Sheet
      if (charts.userGrowth && charts.userGrowth.length > 0) {
        const userData = [
          ['Month', 'Active Users', 'New Users', 'Churned Users', 'Total Users']
        ];
        
        charts.userGrowth.forEach(month => {
          userData.push([
            month.month,
            month.activeUsers,
            month.newUsers,
            month.churnedUsers,
            month.totalUsers
          ]);
        });

        const userSheet = XLSX.utils.aoa_to_sheet(userData);
        XLSX.utils.book_append_sheet(workbook, userSheet, 'User Growth');
      }

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `Revenue_Report_${currentDate}.xlsx`;

      // Export file
      XLSX.writeFile(workbook, filename);
      
      toast.success('Revenue report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export revenue report');
    }
  };

  // Show loading screen during initial load
  if (initialLoad) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Loading Analytics...
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Fetching analytics data from all companies
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state when no analytics data is available
  if (!loading && !analyticsData) {
    return (
      <div className="space-y-8 p-6 bg-slate-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-6 mx-auto w-fit">
              <BarChart3 className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              No Analytics Data Available
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Analytics data could not be loaded. This might be due to network issues or no data being available for the selected timeframe.
            </p>
            <Button
              onClick={() => fetchAnalytics()}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Loading Data
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="space-y-6 sm:space-y-8 p-3 sm:p-6 bg-slate-50 dark:bg-gray-900 min-h-screen">
      {/* Header with Animated Title */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-gray-100">
            Platform Analytics
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 mt-2">
            Real-time insights and performance metrics across your SaaS platform
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32 h-10 border-2 border-blue-200 dark:border-blue-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24H">Last 24H</SelectItem>
              <SelectItem value="7D">Last 7 Days</SelectItem>
              <SelectItem value="30D">Last 30 Days</SelectItem>
              <SelectItem value="12M">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={refreshData} disabled={loading} 
                  className="h-10 border-2 border-purple-200 dark:border-purple-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur hover:bg-purple-50 dark:hover:bg-purple-900/20">
            {loading ? (
              <div className="animate-spin mr-2">⟳</div>
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          
          {/* <Button className="h-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button> */}
        </div>
      </div>

      {/* Key Metrics Cards - Clean Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* Total Revenue Card */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <Badge variant="secondary" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{mrrGrowth}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {formatCurrency(currentMRR)}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Monthly Recurring Revenue</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                  {formatCurrency(currentMRR * 12)} ARR projected
                </p>
              </CardContent>
            </Card>

            {/* Total Users Card */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{userGrowth}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {totalUsers.toLocaleString()}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Platform Users</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                  {charts.userGrowth?.[charts.userGrowth.length - 1]?.activeUsers || 0} active this month
                </p>
              </CardContent>
            </Card>

            {/* Companies Card */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <Badge variant="secondary" className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +15.2%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {activeCompanies}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Active Companies</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                  Growing subscriber base
                </p>
              </CardContent>
            </Card>

            {/* Platform Health Card */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <Badge variant="secondary" className="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Healthy
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {platformUptime}%
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Platform Uptime</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                  {engagementScore}% overall engagement
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="growth" className="w-full">
        <TabsList className="flex sm:grid w-full sm:grid-cols-4 gap-1 h-auto overflow-x-auto sm:overflow-x-visible scrollbar-hide p-1 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4 sticky top-0 z-10 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
          <TabsTrigger 
            value="growth" 
            className="text-xs sm:text-sm h-10 sm:h-11 px-2 sm:px-4 flex-shrink-0 min-w-0 whitespace-nowrap rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-700"
          >
            <span className="hidden sm:inline">📈 Growth</span>
            <span className="sm:hidden">📈</span>
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className="text-xs sm:text-sm h-10 sm:h-11 px-2 sm:px-4 flex-shrink-0 min-w-0 whitespace-nowrap rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-700"
          >
            <span className="hidden sm:inline">👥 Users</span>
            <span className="sm:hidden">👥</span>
          </TabsTrigger>
          <TabsTrigger 
            value="revenue" 
            className="text-xs sm:text-sm h-10 sm:h-11 px-2 sm:px-4 flex-shrink-0 min-w-0 whitespace-nowrap rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-700"
          >
            <span className="hidden sm:inline">💰 Revenue</span>
            <span className="sm:hidden">💰</span>
          </TabsTrigger>
          <TabsTrigger 
            value="reports" 
            className="text-xs sm:text-sm h-10 sm:h-11 px-2 sm:px-4 flex-shrink-0 min-w-0 whitespace-nowrap rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-700"
          >
            <span className="hidden sm:inline">📊 Reports</span>
            <span className="sm:hidden">📊</span>
          </TabsTrigger>
        </TabsList>

        {/* Growth Analytics Tab */}
        <TabsContent value="growth" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <ChartSkeleton />
              <ChartSkeleton height={300} />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Revenue Growth Chart */}
              <Card className="xl:col-span-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl text-gray-900 dark:text-gray-100">
                    <div className="p-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg mr-3">
                      <LineChart className="h-6 w-6 text-white" />
                    </div>
                    Revenue Growth Trajectory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={charts.revenueGrowth && charts.revenueGrowth.length > 0 ? charts.revenueGrowth : generateSampleRevenueData()}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis yAxisId="left" stroke="#6b7280" />
                      <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revenueGradient)" name="MRR (₹)" />
                      <Bar yAxisId="right" dataKey="customers" fill="#3b82f6" name="Customers" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Plan Distribution Pie Chart */}
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-900 dark:text-gray-100">
                    <div className="p-2 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-lg mr-3">
                      <PieChart className="h-5 w-5 text-white" />
                    </div>
                    Plan Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {charts.planDistribution && charts.planDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={charts.planDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {charts.planDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                  <p className="font-semibold text-gray-900">{data.name}</p>
                                  <p className="text-sm text-gray-600">
                                    Users: {data.count}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Revenue: {data.revenue > 0 ? formatCurrency(data.revenue) : 'Free Plan'}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Percentage: {data.value}%
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-96 text-gray-500 dark:text-gray-400">
                      <div className="text-center">
                        <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">No Plan Data Available</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Plan distribution will appear once companies subscribe to plans</p>
                      </div>
                    </div>
                  )}

                  {/* Plan Stats */}
                  <div className="mt-4 space-y-2">
                    {(charts.planDistribution || []).map((plan, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: plan.color }}
                          ></div>
                          <span className="text-gray-900 dark:text-gray-100">{plan.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{plan.count} users</div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {plan.revenue > 0 ? formatCurrency(plan.revenue) : 'Free Plan'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* User Analytics Tab */}
        <TabsContent value="users" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {loading ? (
            <ChartSkeleton />
          ) : (
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-gray-900 dark:text-gray-100">
                  <div className="p-2 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg mr-3">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  User Growth Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={charts.userGrowth || []}>
                    <defs>
                      <linearGradient id="activeUsersGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="newUsersGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="activeUsers" stackId="1" stroke="#3b82f6" fill="url(#activeUsersGradient)" name="Active Users" />
                    <Area type="monotone" dataKey="newUsers" stackId="2" stroke="#10b981" fill="url(#newUsersGradient)" name="New Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Revenue Analytics Tab */}
        <TabsContent value="revenue" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <ChartSkeleton />
              <ChartSkeleton height={500} />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-gray-900 dark:text-gray-100">
                  <div className="p-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg mr-3">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  Revenue Breakdown by Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={charts.planDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                      {(charts.planDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-gray-900 dark:text-gray-100">
                  <Award className="h-5 w-5 mr-2 text-yellow-500" />
                  Revenue Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {loading ? '...' : formatCurrency(currentMRR)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Monthly Revenue</div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Average Revenue per User</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {loading ? '...' : formatCurrency(avgRevenuePerUser)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Conversion Rate</span>
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">18.7%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Churn Rate</span>
                    <span className="text-lg font-bold text-red-500 dark:text-red-400">2.1%</span>
                  </div>
                  
                  <Progress value={82} className="h-3" />
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">Revenue Goal: 82% achieved</div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Top Performing Plans</h4>
                  {(charts.planDistribution || [])
                    .filter(plan => plan.revenue > 0)
                    .sort((a, b) => b.revenue - a.revenue)
                    .map((plan, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: plan.color }}
                          />
                          <span className="text-sm text-gray-900 dark:text-gray-100">{plan.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(plan.revenue)}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <ChartSkeleton height={600} />
              <ChartSkeleton height={400} />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Reports Card */}
            <Card className="xl:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="flex items-center text-xl text-gray-900 dark:text-gray-100">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  Subscription & Revenue Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* MRR & ARR Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{mrrGrowth}%
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold text-green-700 dark:text-green-400 mb-1">
                      {loading ? '...' : formatCurrency(currentMRR)}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">Monthly Recurring Revenue</div>
                    <div className="text-xs text-green-500 dark:text-green-500 mt-1">
                      Change: {loading ? '...' : `${mrrGrowth}% vs previous month`}
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        <Target className="h-3 w-3 mr-1" />
                        Projected
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-1">
                      {loading ? '...' : formatCurrency(currentMRR * 12)}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Annual Recurring Revenue</div>
                    <div className="text-xs text-blue-500 dark:text-blue-500 mt-1">Based on current MRR trends</div>
                  </div>
                </div>

                {/* Plan Distribution Chart */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Plan-wise Distribution</h3>
                    <Badge variant="outline" className="text-xs">
                      {(charts.planDistribution || []).reduce((sum, plan) => sum + plan.count, 0)} Total Users
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div style={{ width: '100%', height: 250 }}>
                      <ResponsiveContainer>
                        <RechartsPieChart>
                          <Pie
                            data={charts.planDistribution || []}
                            innerRadius={50}
                            outerRadius={90}
                            dataKey="count"
                            paddingAngle={2}
                          >
                            {(charts.planDistribution || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                      {(charts.planDistribution || []).map((plan, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center">
                            <div
                              className="w-4 h-4 rounded-full mr-3"
                              style={{ backgroundColor: plan.color }}
                            />
                            <span className="font-medium text-gray-900 dark:text-gray-100">{plan.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{plan.count} users</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {plan.revenue > 0 ? formatCurrency(plan.revenue) + ' revenue' : 'Free Plan'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Quick Insights Panel */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="flex items-center text-lg text-gray-900 dark:text-gray-100">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Quick Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-1">
                      {loading ? '...' : formatCurrency(currentMRR)}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Current MRR</div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total ARR</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {loading ? '...' : formatCurrency(currentMRR * 12)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Trial Companies</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {loading ? '...' : summary.trialCompanies || 0}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Active Companies</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {loading ? '...' : activeCompanies}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Revenue/User</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {loading ? '...' : formatCurrency(avgRevenuePerUser)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Button 
                      onClick={exportRevenueReport}
                      className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Revenue Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}
