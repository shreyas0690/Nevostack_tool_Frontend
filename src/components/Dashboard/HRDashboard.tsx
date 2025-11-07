import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  ClipboardList, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Award, 
  Target, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  UserCheck,
  UserPlus,
  UserX,
  User as UserIcon,
  Crown,
  Briefcase,
  BarChart3,
  PieChart,
  LineChart,
  FileText,
  Mail,
  Phone,
  MapPin,
  Star,
  Heart,
  Zap,
  Shield,
  Globe,
  Coffee
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { hrDashboardService, type HRDashboardData } from '@/services/hrDashboardService';
import { departmentService } from '@/services/departmentService';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

export default function HRDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<HRDashboardData>({
    totalEmployees: 0,
    totalDepartments: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
    recentLeaves: [],
    recentTasks: [],
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    departmentStats: [],
    companyUsers: [],
    companyLeaves: [],
    companyTasks: [],
  } as HRDashboardData);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch latest 5 departments for overview
  const { data: latestDepartments = [] } = useQuery({
    queryKey: ['latest-departments', currentUser?.companyId],
    queryFn: async () => {
      if (!currentUser?.companyId) return [];
      const response = await departmentService.getDepartments({
        page: 1,
        limit: 5,
        sort: 'createdAt',
        order: 'desc'
      });
      return response.data || [];
    },
    enabled: !!currentUser?.companyId
  });

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  // Load dashboard data using HR Dashboard Service
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        console.log('🏢 HR Dashboard Service - Loading data for company:', currentUser?.companyId);
        
        if (!currentUser?.companyId) {
          console.log('⚠️ No company ID found for current user');
          setIsLoading(false);
          return;
        }
        
        // Use HR Dashboard Service with HR Management API
        const data = await hrDashboardService.getDashboardData({
          companyId: currentUser.companyId,
          userId: currentUser.id // Include userId for HR filtering
        });
        
        console.log('✅ HR Dashboard data loaded successfully:', {
          totalEmployees: data.totalEmployees,
          totalDepartments: data.totalDepartments,
          activeUsers: data.activeUsers,
          pendingLeaves: data.pendingLeaves,
          approvedLeaves: data.approvedLeaves,
          rejectedLeaves: data.rejectedLeaves,
          totalTasks: data.totalTasks,
          completedTasks: data.completedTasks,
          inProgressTasks: data.inProgressTasks,
          overdueTasks: data.overdueTasks,
          departmentStats: data.departmentStats.length,
          recentLeaves: data.recentLeaves.length,
          recentTasks: data.recentTasks.length
        });
        
        // Debug: Check if totalDepartments is being set correctly
        console.log('🔍 Debug - totalDepartments value:', data.totalDepartments);
        console.log('🔍 Debug - departmentStats length:', data.departmentStats?.length);
        console.log('🔍 Debug - departmentStats data:', data.departmentStats);
        
        setDashboardData({ ...data });
        setIsLoading(false);
        
      } catch (error) {
        console.error('❌ HR Dashboard Service Error:', error);
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser?.companyId]);


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Modern Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-indigo-600/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/30 via-transparent to-transparent"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    HR Command Center
                  </h1>
                  <p className="text-slate-300 text-lg font-medium">
                    Human Resources Management Dashboard
                  </p>
                </div>
              </div>
              <p className="text-slate-200 text-lg mb-4">
                Welcome back, <span className="font-semibold text-blue-300">{currentUser?.name || 'HR Manager'}</span>! Ready to make a difference today?
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <Coffee className="h-5 w-5 text-blue-300" />
                  <span className="text-sm font-medium">Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}!</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <Globe className="h-5 w-5 text-purple-300" />
                  <span className="text-sm font-medium">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-white mb-1">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-slate-300 text-sm font-medium">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      </div>


      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Total Employees</p>
                <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">{dashboardData.totalEmployees}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">Across all departments</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Active Users</p>
                <p className="text-4xl font-bold text-emerald-900 dark:text-emerald-100">{dashboardData.activeUsers}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Currently engaged</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <UserCheck className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-purple-50 via-purple-100 to-violet-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">Departments</p>
                <p className="text-4xl font-bold text-purple-900 dark:text-purple-100">{dashboardData.totalDepartments}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">Organized teams</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-amber-50 via-amber-100 to-orange-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-1">Pending Leaves</p>
                <p className="text-4xl font-bold text-amber-900 dark:text-amber-100">{dashboardData.pendingLeaves}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">Awaiting approval</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Clock className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* 3-Column Grid: Recent Tasks, Department Overview, Recent Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Tasks */}
        <Card id="recent-tasks-section" className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 hover:scale-[1.02]">
          <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white rounded-t-xl shadow-lg">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <ClipboardList className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Recent Tasks</h3>
                  <p className="text-slate-300 text-sm">Active company tasks</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{dashboardData.totalTasks}</div>
                <div className="text-slate-300 text-sm">Active</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {dashboardData.recentTasks.length > 0 ? (
                dashboardData.recentTasks.slice(0, 10).map((task: any, index: number) => {
                  const getPriorityColor = (priority: string) => {
                    switch (priority) {
                      case 'urgent': return 'bg-red-500 text-white';
                      case 'high': return 'bg-orange-500 text-white';
                      case 'medium': return 'bg-yellow-500 text-white';
                      case 'low': return 'bg-green-500 text-white';
                      default: return 'bg-gray-500 text-white';
                    }
                  };

                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
                      case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                      case 'todo': return 'bg-gray-100 text-gray-800 border-gray-200';
                      case 'assigned': return 'bg-purple-100 text-purple-800 border-purple-200';
                      default: return 'bg-gray-100 text-gray-800 border-gray-200';
                    }
                  };

                  return (
                  <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-sm dark:hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        task.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        task.status === 'review' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        task.status === 'todo' ? 'bg-gray-100 dark:bg-gray-800' :
                        task.status === 'assigned' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        {task.status === 'in_progress' && <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                        {task.status === 'review' && <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
                        {task.status === 'todo' && <ClipboardList className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
                        {task.status === 'assigned' && <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-1">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(task.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No active tasks</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Department Overview */}
        <Card id="department-overview-section" className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 hover:scale-[1.02]">
          <CardHeader className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white rounded-t-xl shadow-lg">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Department Overview</h3>
                  <p className="text-emerald-100 text-sm">Company departments</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{dashboardData.totalDepartments}</div>
                <div className="text-emerald-100 text-sm">Total Departments</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {latestDepartments.length > 0 ? (
                latestDepartments.map((dept: any, index: number) => (
                 <div key={dept.id || index} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-500 hover:shadow-sm dark:hover:shadow-lg transition-all duration-200">
                   <div className="flex items-center justify-between">
                     <div>
                       <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{dept.name}</h4>
                       <p className="text-xs text-gray-500 dark:text-gray-400">{dept.memberCount || 0} employees</p>
                     </div>
                     <div className="text-xs text-gray-400 dark:text-gray-500">
                       {format(new Date(dept.createdAt), 'MMM dd')}
                     </div>
                   </div>
                 </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">No departments</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Leave Requests */}
        <Card id="recent-leaves-section" className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-slate-50 via-purple-50 to-violet-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 hover:scale-[1.02]">
          <CardHeader className="bg-gradient-to-r from-purple-700 via-purple-600 to-violet-700 text-white rounded-t-xl shadow-lg">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Pending Leave Requests</h3>
                  <p className="text-purple-100 text-sm">Awaiting approval</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{dashboardData.pendingLeaves}</div>
                <div className="text-purple-100 text-sm">Pending</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {dashboardData.recentLeaves.filter((leave: any) => leave.status === 'pending').length > 0 ? (
                dashboardData.recentLeaves
                  .filter((leave: any) => leave.status === 'pending')
                  .slice(0, 10)
                  .map((leave: any, index: number) => (
                   <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-100 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-500 hover:shadow-sm dark:hover:shadow-lg transition-all duration-200">
                     <div className="flex items-center gap-3">
                       <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30">
                         <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-1">
                           {leave.user?.firstName} {leave.user?.lastName}
                         </h4>
                         <div className="flex items-center gap-2 mt-1">
                           <span className="text-xs text-gray-500 dark:text-gray-400">{leave.type}</span>
                           <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                             Pending
                           </span>
                         </div>
                         <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                           <Calendar className="h-3 w-3" />
                           <span>{format(new Date(leave.createdAt), 'MMM dd, yyyy')}</span>
                         </div>
                       </div>
                     </div>
                   </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">No leave requests</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}