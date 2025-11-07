import { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  Calendar, 
  CheckCircle, 
  Clock, 
  User,
  Search,
  Filter,
  MoreHorizontal,
  Star,
  Trophy,
  TrendingUp,
  Activity,
  Phone,
  MapPin,
  Briefcase,
  Award,
  Target,
  BarChart3,
  PieChart,
  AlertCircle,
  UserCheck,
  Settings,
  Plus,
  Eye,
  Edit,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/Auth/AuthProvider';
import { mockUsers, mockTasks } from '@/data/mockData';
import { managerService, type TeamManagementOverviewData, type TeamMemberDetailsData } from '@/services/managerService';
import toast from 'react-hot-toast';

interface ManagerTeamManagementProps {
  onNavigate?: (tab: string) => void;
}

export default function ManagerTeamManagement({ onNavigate }: ManagerTeamManagementProps) {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  
  // State for backend data
  const [teamManagementData, setTeamManagementData] = useState<TeamManagementOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch team management data from backend
  useEffect(() => {
    const fetchTeamManagementData = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const response = await managerService.getTeamManagementOverview();
        if (response.success) {
          setTeamManagementData(response.data);
        } else {
          setError('Failed to load team management data');
        }
      } catch (err) {
        console.error('Failed to fetch team management data:', err);
        setError('Failed to load team management data');
        // Fallback to mock data
  const teamMembers = mockUsers.filter(user => user.managerId === currentUser?.id);
        setTeamManagementData({
          teamStats: {
            totalMembers: teamMembers.length,
            activeMembers: teamMembers.filter(m => m.isActive).length,
            totalTasks: mockTasks.filter(t => t.managerId === currentUser?.id).length,
            completedTasks: mockTasks.filter(t => t.managerId === currentUser?.id && t.status === 'completed').length,
            inProgressTasks: mockTasks.filter(t => t.managerId === currentUser?.id && t.status === 'in_progress').length,
            overdueTasks: mockTasks.filter(t => {
              if (t.managerId !== currentUser?.id) return false;
              const now = new Date();
              return t.dueDate < now && t.status !== 'completed';
            }).length,
            teamCompletionRate: 0,
            avgTasksPerMember: 0
          },
          memberStats: [],
          allTasks: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamManagementData();
  }, [currentUser]);
  
  // Get manager's team members from backend data or fallback to mock
  const teamMembers = teamManagementData?.memberStats?.map(stat => ({
    id: stat.member._id,
    name: stat.member.name,
    email: stat.member.email,
    role: stat.member.role,
    isActive: stat.member.isActive,
    createdAt: stat.member.createdAt,
    managerId: currentUser?.id,
    departmentId: stat.member.departmentId,
    department: stat.member.department
  })) || mockUsers.filter(user => user.managerId === currentUser?.id);
  
  // Filter team members
  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && member.isActive) ||
                         (statusFilter === 'inactive' && !member.isActive);
    return matchesSearch && matchesStatus;
  });

  // Calculate enhanced team stats from backend data or fallback to mock
  const totalMembers = teamManagementData?.teamStats?.totalMembers || teamMembers.length;
  const activeMembers = teamManagementData?.teamStats?.activeMembers || teamMembers.filter(m => m.isActive).length;
  const totalTasks = teamManagementData?.teamStats?.totalTasks || mockTasks.filter(t => t.managerId === currentUser?.id).length;
  const completedTasks = teamManagementData?.teamStats?.completedTasks || mockTasks.filter(t => t.managerId === currentUser?.id && t.status === 'completed').length;
  const inProgressTasks = teamManagementData?.teamStats?.inProgressTasks || mockTasks.filter(t => t.managerId === currentUser?.id && t.status === 'in_progress').length;
  const overdueTasksCount = teamManagementData?.teamStats?.overdueTasks || mockTasks.filter(t => {
    if (t.managerId !== currentUser?.id) return false;
    const now = new Date();
    return t.dueDate < now && t.status !== 'completed';
  }).length;

  const teamCompletionRate = teamManagementData?.teamStats?.teamCompletionRate || (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);
  const avgTasksPerMember = teamManagementData?.teamStats?.avgTasksPerMember || (totalMembers > 0 ? Math.round(totalTasks / totalMembers) : 0);

  // Enhanced stats with gradients
  const enhancedStats = [
    {
      title: 'Total Members',
      value: totalMembers,
      description: 'Under your management',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      gradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      title: 'Active Members',
      value: activeMembers,
      description: 'Currently engaged',
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/50',
      gradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    {
      title: 'Total Tasks',
      value: totalTasks,
      description: 'Assigned to team',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
      gradient: 'from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20',
      borderColor: 'border-purple-200 dark:border-purple-800'
    },
    {
      title: 'Completed',
      value: completedTasks,
      description: 'Successfully finished',
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/50',
      gradient: 'from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    {
      title: 'In Progress',
      value: inProgressTasks,
      description: 'Currently active',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/50',
      gradient: 'from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20',
      borderColor: 'border-orange-200 dark:border-orange-800'
    },
    {
      title: 'Overdue',
      value: overdueTasksCount,
      description: 'Need attention',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50',
      gradient: 'from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20',
      borderColor: 'border-red-200 dark:border-red-800'
    }
  ];

  // Team member card component
  const TeamMemberCard = ({ member }: { member: any }) => {
    // Get member stats from backend data or fallback to mock
    const memberStats = teamManagementData?.memberStats?.find(stat => stat.member._id === member.id);
    const memberTasks = memberStats?.tasks || mockTasks.filter(task => task.assignedTo === member.id);
    const completedTasks = memberStats?.completedTasks || memberTasks.filter(task => task.status === 'completed').length;
    const pendingTasks = memberStats?.pendingTasks || memberTasks.filter(task => 
      task.status === 'assigned' || task.status === 'in_progress'
    ).length;
    const completionRate = memberStats?.completionRate || (memberTasks.length > 0 
      ? Math.round((completedTasks / memberTasks.length) * 100)
      : 0);

    return (
      <Card key={member.id} className="transition-all duration-200 hover:shadow-lg border-2">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-bold">
                {member.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">{member.name}</h3>
                <Badge 
                  variant={member.isActive ? "default" : "secondary"}
                  className={member.isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }
                >
                  {member.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {completionRate >= 80 && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    <Trophy className="w-3 h-3 mr-1" />
                    Top Performer
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {member.email}
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Role: {member.role.replace('_', ' ')}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Joined: {new Date(member.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Task Statistics */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{memberStats?.totalTasks || memberTasks.length}</div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">Total Tasks</div>
                </div>
                <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{completedTasks}</div>
                  <div className="text-xs text-green-700 dark:text-green-300">Completed</div>
                </div>
                <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{pendingTasks}</div>
                  <div className="text-xs text-orange-700 dark:text-orange-300">Pending</div>
                </div>
                <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">{completionRate}%</div>
                  <div className="text-xs text-purple-700 dark:text-purple-300">Success Rate</div>
                </div>
              </div>

              {/* Progress Bar */}
              {memberTasks.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>Task Completion Progress</span>
                    <span>{completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        completionRate >= 80 ? 'bg-green-500' :
                        completionRate >= 60 ? 'bg-blue-500' :
                        completionRate >= 40 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedMember(member);
                setShowMemberDialog(true);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('tasks');
                }
              }}
            >
              <Target className="w-4 h-4 mr-2" />
              Assign Task
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
            <p className="text-muted-foreground">
              Manage your team members, track performance, and boost productivity
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium mb-2">Loading Team Management Data</h3>
          <p className="text-muted-foreground">Please wait while we fetch your team information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
            <p className="text-muted-foreground">
              Manage your team members, track performance, and boost productivity
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Failed to Load Team Data</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your team members, track performance, and boost productivity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {enhancedStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className={`bg-gradient-to-r ${stat.gradient} ${stat.borderColor} relative overflow-hidden hover:shadow-lg transition-shadow`}>
              <div className={`absolute inset-0 ${stat.bgColor} opacity-30`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Enhanced Team Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members ({filteredMembers.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMembers.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredMembers.map((member) => (
                    <TeamMemberCard key={member.id} member={member} />
                  ))}
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">No team members assigned</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Contact your HOD or department head to get team members assigned to your management.
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No members found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search filters
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    // Get top performers from backend data or fallback to mock
                    const topPerformers = teamManagementData?.memberStats
                      ?.filter(stat => stat.totalTasks > 0)
                      ?.sort((a, b) => b.completionRate - a.completionRate)
                      ?.slice(0, 5) || [];
                    
                    if (topPerformers.length === 0) {
                      // Fallback to mock data calculation
                      return teamMembers
                    .map(member => {
                      const memberTasks = mockTasks.filter(task => task.assignedTo === member.id);
                      const completedTasks = memberTasks.filter(task => task.status === 'completed');
                      const rate = memberTasks.length > 0 
                        ? (completedTasks.length / memberTasks.length) * 100 
                        : 0;
                      return { ...member, rate, taskCount: memberTasks.length };
                    })
                    .filter(member => member.taskCount > 0)
                    .sort((a, b) => b.rate - a.rate)
                    .slice(0, 5)
                    .map((member, index) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            #{index + 1}
                          </div>
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-muted-foreground">{member.taskCount} tasks</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {Math.round(member.rate)}%
                        </Badge>
                      </div>
                        ));
                    }
                    
                    // Use backend data
                    if (topPerformers.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Top Performers Yet</h3>
                          <p className="text-muted-foreground">
                            Team members need to complete tasks to appear in top performers
                          </p>
                        </div>
                      );
                    }
                    
                    return topPerformers.map((performer, index) => (
                      <div key={performer.member._id} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            #{index + 1}
                          </div>
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {performer.member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{performer.member.name}</div>
                            <div className="text-xs text-muted-foreground">{performer.totalTasks} tasks</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {performer.completionRate}%
                        </Badge>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Team Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Team Completion Rate</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {teamCompletionRate}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Tasks per Member</span>
                    <Badge variant="outline">{avgTasksPerMember}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Team Members</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {Math.round((activeMembers / totalMembers) * 100)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tasks in Progress</span>
                    <Badge variant="default" className="bg-orange-100 text-orange-800">
                      {inProgressTasks}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overdue Tasks</span>
                    <Badge variant="default" className={`${overdueTasksCount > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {overdueTasksCount}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Team Management Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white/50 dark:bg-gray-900/50 p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Team Performance</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your team has a {teamCompletionRate}% completion rate, showing {teamCompletionRate >= 80 ? 'excellent' : teamCompletionRate >= 60 ? 'good' : 'improving'} performance.
                  </p>
                </div>
                
                <div className="bg-white/50 dark:bg-gray-900/50 p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Team Engagement</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {Math.round((activeMembers / totalMembers) * 100)}% of your team members are actively engaged in projects.
                  </p>
                </div>
                
                <div className="bg-white/50 dark:bg-gray-900/50 p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Workload Balance</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Average {avgTasksPerMember} tasks per member indicates {avgTasksPerMember <= 3 ? 'optimal' : avgTasksPerMember <= 5 ? 'moderate' : 'high'} workload.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Member Details Dialog */}
      <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Member Details - {selectedMember?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-bold">
                    {selectedMember.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedMember.name}</h3>
                  <p className="text-muted-foreground">{selectedMember.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={selectedMember.isActive ? "default" : "secondary"}>
                      {selectedMember.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">
                      {selectedMember.role.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Member Since</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedMember.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('tasks');
                    }
                  }}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Assign Task
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
