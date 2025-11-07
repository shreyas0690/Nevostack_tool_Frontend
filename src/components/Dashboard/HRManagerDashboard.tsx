import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  ClipboardList, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  UserPlus,
  User as UserIcon,
  FileText,
  BarChart3,
  Clock,
  Building2,
  Target,
  Award
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { mockUsers, mockDepartments, mockTasks } from '@/data/mockData';
import { mockLeaveRequests } from '@/data/leaveData';
import { leaveService } from '@/services/leaveService';
import { taskService } from '@/services/taskService';

export default function HRManagerDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [realLeaveData, setRealLeaveData] = useState<any[]>([]);
  const [isLoadingLeaves, setIsLoadingLeaves] = useState(true);
  const [realTaskData, setRealTaskData] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  // Load real leave data using HR Management API
  useEffect(() => {
    const loadLeaveData = async () => {
      try {
        setIsLoadingLeaves(true);
        console.log('🏢 HR Manager Dashboard - Loading leave data...');
        
        // Use HR Management API to get company leaves (excluding HR own)
        const response = await leaveService.getHRManagementLeaves({ limit: 500 });
        const leaves = response?.data || response?.leaves || [];
        
        console.log('📅 HR Manager Dashboard - Leave data loaded:', leaves.length);
        setRealLeaveData(leaves);
      } catch (error) {
        console.warn('HR Management API failed, using mock data:', error);
        setRealLeaveData(mockLeaveRequests);
      } finally {
        setIsLoadingLeaves(false);
      }
    };

    loadLeaveData();
  }, []);

  // Load real task data using HR Management API
  useEffect(() => {
    const loadTaskData = async () => {
      try {
        setIsLoadingTasks(true);
        console.log('🏢 HR Manager Dashboard - Loading task data using HR Management API...');
        
        // Use HR Management Tasks API (excludes completed, blocked, cancelled, overdue)
        const response = await taskService.getHRManagementTasks(1, 500, {});
        const tasks = response?.data || [];
        
        console.log('📋 HR Manager Dashboard - HR Management Tasks API data loaded:', tasks.length);
        setRealTaskData(tasks);
      } catch (error) {
        console.warn('HR Management Tasks API failed, falling back to regular API:', error);
        try {
          // Fallback to regular API
          const fallbackResponse = await taskService.getTasks(1, 500, {});
          const fallbackTasks = fallbackResponse?.data || [];
          
          // Filter out unwanted tasks
          const filteredTasks = fallbackTasks.filter(task => {
            const isExcludedStatus = ['completed', 'blocked', 'cancelled'].includes(task.status);
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
            return !isExcludedStatus && !isOverdue;
          });
          
          console.log('📋 HR Manager Dashboard - Fallback API data loaded:', filteredTasks.length);
          setRealTaskData(filteredTasks);
        } catch (fallbackError) {
          console.warn('Fallback API also failed, using mock data:', fallbackError);
          setRealTaskData(mockTasks);
        }
      } finally {
        setIsLoadingTasks(false);
      }
    };

    loadTaskData();
  }, []);

  // Calculate HR Manager specific metrics
  const totalEmployees = mockUsers.filter(u => u.isActive).length;
  const totalDepartments = mockDepartments.length;
  const hrDepartmentEmployees = mockUsers.filter(u => u.departmentId === '3' && u.isActive).length; // HR department
  
  // Task statistics (using real data from API)
  const taskDataToUse = realTaskData.length > 0 ? realTaskData : mockTasks;
  const totalTasks = taskDataToUse.length;
  const completedTasks = taskDataToUse.filter(t => t.status === 'completed').length;
  const inProgressTasks = taskDataToUse.filter(t => t.status === 'in_progress').length;
  const overdueTasks = taskDataToUse.filter(t => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < currentTime && t.status !== 'completed';
  }).length;
  
  // Leave statistics (using real data from HR Management API)
  const leaveDataToUse = realLeaveData.length > 0 ? realLeaveData : mockLeaveRequests;
  const totalLeaveRequests = leaveDataToUse.length;
  const pendingLeaves = leaveDataToUse.filter(l => l.status === 'pending').length;
  const approvedLeaves = leaveDataToUse.filter(l => l.status === 'approved').length;
  const todayLeaves = leaveDataToUse.filter(l => {
    const today = new Date();
    const startDate = new Date(l.startDate);
    const endDate = new Date(l.endDate);
    return startDate <= today && endDate >= today && l.status === 'approved';
  }).length;
  
  // Performance calculations
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const approvalRate = totalLeaveRequests > 0 ? Math.round((approvedLeaves / totalLeaveRequests) * 100) : 0;
  
  // Recent activities (using real data from HR Management API)
  const recentLeaves = leaveDataToUse
    .sort((a, b) => new Date(b.appliedAt || b.createdAt).getTime() - new Date(a.appliedAt || a.createdAt).getTime())
    .slice(0, 5);

  const recentTasks = taskDataToUse
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Department performance
  const departmentPerformance = mockDepartments.map(dept => {
    const deptTasks = mockTasks.filter(t => t.departmentId === dept.id);
    const completedDeptTasks = deptTasks.filter(t => t.status === 'completed');
    return {
      ...dept,
      totalTasks: deptTasks.length,
      completionRate: deptTasks.length > 0 ? Math.round((completedDeptTasks.length / deptTasks.length) * 100) : 0
    };
  }).sort((a, b) => b.completionRate - a.completionRate);

  const hrManagerStats = [
    {
      title: 'Total Employees',
      value: totalEmployees,
      change: `+${Math.floor(Math.random() * 8)}`,
      changeType: 'increase',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      gradient: 'from-blue-50 to-indigo-50'
    },
    {
      title: 'HR Team',
      value: hrDepartmentEmployees,
      change: 'Active',
      changeType: 'neutral',
      icon: UserCheck,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      gradient: 'from-indigo-50 to-purple-50'
    },
    {
      title: 'Pending Leaves',
      value: pendingLeaves,
      change: `${Math.floor(Math.random() * 3)} new`,
      changeType: pendingLeaves > 5 ? 'decrease' : 'increase',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      gradient: 'from-orange-50 to-red-50'
    },
    {
      title: 'Active Tasks',
      value: inProgressTasks,
      change: `${completionRate}% completion`,
      changeType: 'increase',
      icon: ClipboardList,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      gradient: 'from-green-50 to-teal-50'
    },
    {
      title: 'Approval Rate',
      value: `${approvalRate}%`,
      change: 'This month',
      changeType: 'increase',
      icon: CheckCircle2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      gradient: 'from-purple-50 to-pink-50'
    },
    {
      title: 'On Leave Today',
      value: todayLeaves,
      change: overdueTasks > 3 ? 'High priority' : 'Manageable',
      changeType: todayLeaves > 5 ? 'decrease' : 'increase',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      gradient: 'from-red-50 to-orange-50'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
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
                    HR Manager Dashboard
                  </h1>
                  <p className="text-slate-300 text-lg font-medium">
                    Human Resources Management Panel
                  </p>
                </div>
              </div>
              <p className="text-slate-200 text-lg mb-4">
                Welcome back, <span className="font-semibold text-blue-300">{currentUser?.name}</span>! Here's your dashboard overview for {currentTime.toLocaleDateString()}
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-white">{totalEmployees}</div>
                <div className="text-slate-300 text-sm font-medium">Total Staff</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-white">{pendingLeaves}</div>
                <div className="text-slate-300 text-sm font-medium">Pending Leaves</div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Debug Info */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <h3 className="font-bold text-green-800 mb-2">🔍 HR Manager Dashboard - Using HR Management API:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium text-green-700">Data Source:</p>
              <p className="text-green-600">{realLeaveData.length > 0 ? 'HR Management API' : 'Mock Data (Fallback)'}</p>
            </div>
            <div>
              <p className="font-medium text-green-700">Total Leave Requests:</p>
              <p className="text-green-600">{totalLeaveRequests}</p>
            </div>
            <div>
              <p className="font-medium text-green-700">Pending Leaves:</p>
              <p className="text-green-600">{pendingLeaves}</p>
            </div>
            <div>
              <p className="font-medium text-green-700">Approved Leaves:</p>
              <p className="text-green-600">{approvedLeaves}</p>
            </div>
          </div>
          <div className="mt-3 p-2 bg-green-100 rounded">
            <p className="text-green-700 text-sm">
              <strong>✅ Leave Data:</strong> {realLeaveData.length > 0 ? 'Real data from HR Management API (excludes HR own requests)' : 'Mock data (API failed)'}
            </p>
            <p className="text-green-600 text-xs mt-1">
              Loading: {isLoadingLeaves ? 'Yes' : 'No'} | Approval Rate: {approvalRate}%
            </p>
            <p className="text-green-700 text-sm mt-2">
              <strong>📋 Task Data:</strong> {realTaskData.length > 0 ? 'Real data from HR Management Tasks API (excludes completed, blocked, cancelled, overdue)' : 'Mock data (API failed)'}
            </p>
            <p className="text-green-600 text-xs mt-1">
              Total: {totalTasks} | Completed: {completedTasks} | In Progress: {inProgressTasks} | Overdue: {overdueTasks}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid - 6 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {hrManagerStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`group bg-gradient-to-br ${stat.gradient} border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
                    stat.changeType === 'increase' ? 'bg-emerald-100 text-emerald-700' : 
                    stat.changeType === 'decrease' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {stat.changeType === 'increase' && <TrendingUp className="h-3 w-3 mr-1" />}
                    {stat.changeType === 'decrease' && <TrendingDown className="h-3 w-3 mr-1" />}
                    {stat.change}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{stat.value}</div>
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">{stat.title}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>


      {/* 3-Column Grid: Recent Tasks, Department Overview, Recent Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Tasks */}
        <Card id="recent-tasks-section" className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 hover:scale-[1.02]">
          <CardHeader className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white rounded-t-xl shadow-lg">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Recent Tasks</h3>
                  <p className="text-emerald-100 text-sm">Active company tasks</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{recentTasks.length}</div>
                <div className="text-emerald-100 text-sm">Active Tasks</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {recentTasks.length > 0 ? (
                recentTasks.slice(0, 10).map((task) => {
                  const assignedUser = mockUsers.find(u => u.id === task.assignedTo);
                  const department = mockDepartments.find(d => d.id === task.departmentId);
                  
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
                    <div key={task.id} className="group relative bg-white rounded-xl p-4 border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-start gap-4">
                        {/* Status Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          task.status === 'in_progress' ? 'bg-blue-100' :
                          task.status === 'review' ? 'bg-yellow-100' :
                          task.status === 'todo' ? 'bg-gray-100' :
                          task.status === 'assigned' ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          {task.status === 'in_progress' && <Clock className="h-5 w-5 text-blue-600" />}
                          {task.status === 'review' && <AlertCircle className="h-5 w-5 text-yellow-600" />}
                          {task.status === 'todo' && <ClipboardList className="h-5 w-5 text-gray-600" />}
                          {task.status === 'assigned' && <UserCheck className="h-5 w-5 text-purple-600" />}
                        </div>

                        {/* Task Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2">
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-2 ml-2">
                              {/* Priority Badge */}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              {/* Status Badge */}
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          {/* Task Details */}
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {task.category && (
                              <div className="flex items-center gap-1">
                                <Target className="h-4 w-4" />
                                <span>{task.category}</span>
                              </div>
                            )}
                            {assignedUser && (
                              <div className="flex items-center gap-1">
                                <UserIcon className="h-4 w-4" />
                                <span>{assignedUser.name}</span>
                              </div>
                            )}
                            {department && (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                <span>{department.name}</span>
                              </div>
                            )}
                          </div>

                          {/* Created Date */}
                          <div className="mt-2 flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-500">
                              Created: {new Date(task.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Due Date */}
                          {task.dueDate && (
                            <div className="mt-1 flex items-center gap-1 text-sm">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-500">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <Target className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No Active Tasks</h3>
                  <p className="text-gray-500 text-xs">All tasks are completed or there are no tasks yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Department Overview */}
        <Card id="department-overview-section" className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 hover:scale-[1.02]">
          <CardHeader className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-t-xl shadow-lg">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Department Overview</h3>
                  <p className="text-blue-100 text-sm">Company departments</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{totalDepartments}</div>
                <div className="text-blue-100 text-sm">Departments</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {departmentPerformance.slice(0, 10).map((dept, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{dept.name}</h4>
                        <p className="text-xs text-gray-500">{dept.totalTasks} tasks</p>
                      </div>
                  </div>
                </div>
              ))}
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
                  <h3 className="text-xl font-bold">Recent Leave Requests</h3>
                  <p className="text-purple-100 text-sm">Latest leave applications</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{recentLeaves.length}</div>
                <div className="text-purple-100 text-sm">Requests</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {recentLeaves.slice(0, 10).map((leave, index) => {
                const employee = mockUsers.find(u => u.id === leave.employeeId);
                return (
                  <div key={index} className="bg-white rounded-lg p-3 border border-gray-100 hover:border-purple-200 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        leave.status === 'pending' ? 'bg-yellow-100' :
                        leave.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {leave.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                        {leave.status === 'approved' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {leave.status === 'rejected' && <AlertCircle className="h-4 w-4 text-red-600" />}
                      </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                          {employee?.name || 'Unknown Employee'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{leave.leaveType}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            leave.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {leave.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(leave.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card id="quick-actions-section" className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 hover:scale-[1.01]">
          <CardHeader className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 text-white rounded-t-xl shadow-lg">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Quick Actions</h3>
                <p className="text-slate-300 text-sm">Manage your HR operations</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => {
                const tasksSection = document.getElementById('recent-tasks-section');
                tasksSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              variant="outline" 
              className="h-20 flex-col gap-2"
            >
              <ClipboardList className="h-5 w-5 text-blue-600" />
              <span className="text-sm">Manage Tasks</span>
              </Button>
            <Button 
              onClick={() => {
                const leavesSection = document.getElementById('recent-leaves-section');
                leavesSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              variant="outline" 
              className="h-20 flex-col gap-2"
            >
                <Calendar className="h-5 w-5 text-indigo-600" />
                <span className="text-sm">Review Leaves</span>
              </Button>
            <Button 
              onClick={() => {
                const departmentsSection = document.getElementById('department-overview-section');
                departmentsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              variant="outline" 
              className="h-20 flex-col gap-2"
            >
              <UserPlus className="h-5 w-5 text-green-600" />
              <span className="text-sm">Add Employee</span>
              </Button>
            <Button 
              onClick={() => {
                const quickActionsSection = document.getElementById('quick-actions-section');
                quickActionsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              variant="outline" 
              className="h-20 flex-col gap-2"
            >
                <FileText className="h-5 w-5 text-purple-600" />
                <span className="text-sm">Generate Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}













































































































