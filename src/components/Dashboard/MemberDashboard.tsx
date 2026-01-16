import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Target,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Star,
  Trophy,
  Building2,
  Users,
  Briefcase,
  BarChart3,
  Video,
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import memberService, { MemberDashboardData } from '@/services/memberService';
import { Skeleton } from '@/components/ui/skeleton';

interface MemberDashboardProps {
  onNavigate?: (tab: string) => void;
}

export default function MemberDashboard({ onNavigate }: MemberDashboardProps) {
  const { currentUser } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<MemberDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;

      try {
        setIsLoading(true);
        setError(null);
        const data = await memberService.getDashboard();
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);


  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);


  // Dashboard stats
  const dashboardStats = dashboardData ? [
    {
      title: 'Total Tasks',
      value: dashboardData.stats.totalTasks,
      description: 'Total assigned',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      gradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      title: 'Completed',
      value: dashboardData.stats.completedTasks,
      description: 'Successfully done',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/50',
      gradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    {
      title: 'Pending',
      value: dashboardData.stats.pendingTasks,
      description: 'In progress',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/50',
      gradient: 'from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20',
      borderColor: 'border-orange-200 dark:border-orange-800'
    },
    {
      title: 'Overdue',
      value: dashboardData.stats.overdueTasks,
      description: 'Need attention',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50',
      gradient: 'from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20',
      borderColor: 'border-red-200 dark:border-red-800'
    }
  ] : [];

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Welcome Header Skeleton */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <Skeleton className="h-8 w-80" />
              <Skeleton className="h-5 w-96" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="w-12 h-12 rounded-full" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="w-4 h-4" />
              </div>
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Bottom Section Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Performance Summary Skeleton */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Skeleton */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <Skeleton className="h-6 w-28" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* My Team Skeleton */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">Failed to Load Dashboard</h2>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 dark:bg-yellow-950/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-yellow-900 dark:text-yellow-100 mb-2">No Dashboard Data</h2>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">Unable to load your dashboard information.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, {dashboardData?.member.name || currentUser?.name}! 👋
            </h1>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Ready to tackle your tasks? Let's make today productive!
            </p>
            <div className="text-sm text-blue-600 dark:text-blue-400 mt-2">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: dashboardData?.member.department?.color || '#3B82F6' }}
            >
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className={`bg-gradient-to-r ${stat.gradient} ${stat.borderColor} relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105`}>
              <div className={`absolute inset-0 ${stat.bgColor} opacity-30`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>


      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Overall Completion</span>
                  <span className="font-medium">{dashboardData?.performance.completionRate || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      (dashboardData?.performance.completionRate || 0) >= 80 ? 'bg-green-500' :
                      (dashboardData?.performance.completionRate || 0) >= 60 ? 'bg-blue-500' :
                      (dashboardData?.performance.completionRate || 0) >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${dashboardData?.performance.completionRate || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Today's Progress</span>
                  <span className="font-medium">{dashboardData?.performance.todayCompletionRate || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      (dashboardData?.performance.todayCompletionRate || 0) >= 80 ? 'bg-green-500' :
                      (dashboardData?.performance.todayCompletionRate || 0) >= 60 ? 'bg-blue-500' :
                      (dashboardData?.performance.todayCompletionRate || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${dashboardData?.performance.todayCompletionRate || 0}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Due today: {dashboardData?.performance.todayDueCompletionRate || 0}%</span>
                    <span>Completed: {dashboardData?.performance.tasksCompletedToday || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {(dashboardData?.performance.completionRate || 0) >= 80 && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    <Trophy className="w-3 h-3 mr-1" />
                    High Performer
                  </Badge>
                )}
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  <Star className="w-3 h-3 mr-1" />
                  {dashboardData?.performance.status === 'excellent' ? 'Excellent' :
                   dashboardData?.performance.status === 'good' ? 'Good' : 'Improving'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 hover:bg-blue-50 hover:border-blue-200"
                onClick={() => onNavigate?.('my-tasks')}
              >
                <Target className="w-4 h-4 text-blue-600" />
                View My Tasks
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 hover:bg-green-50 hover:border-green-200"
                onClick={() => onNavigate?.('leave')}
              >
                <Calendar className="w-4 h-4 text-green-600" />
                Request Leave
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 hover:bg-purple-50 hover:border-purple-200"
                onClick={() => onNavigate?.('meetings')}
              >
                <Video className="w-4 h-4 text-purple-600" />
                Join Meeting
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Team Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Department</span>
                <Badge variant="outline" style={{
                  backgroundColor: dashboardData?.member.department?.color ? `${dashboardData.member.department.color}20` : '#10B98120',
                  color: dashboardData?.member.department?.color || '#10B981'
                }}>
                  {dashboardData?.member.department?.name || 'Not assigned'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">My Manager</span>
                <span className="text-sm font-medium">
                  {dashboardData?.member.manager?.name || 'Not assigned'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Role</span>
                <Badge variant="secondary">
                  <Briefcase className="w-3 h-3 mr-1" />
                  {dashboardData?.member.role?.replace('_', ' ') || 'Member'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
