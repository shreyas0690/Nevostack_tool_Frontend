import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Clock, 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Target
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { mockUsers, mockDepartments } from '@/data/mockData';

export default function HODAttendanceManagement() {
  const { currentUser } = useAuth();
  
  // Find user's department
  const userDepartment = currentUser?.departmentId ? 
    mockDepartments.find(d => d.id === currentUser.departmentId) : null;

  // Get department members
  const departmentMembers = userDepartment ? 
    mockUsers.filter(u => userDepartment.memberIds.includes(u.id)) : [];

  // Mock attendance data for today
  const today = new Date();
  const mockAttendanceData = departmentMembers.map(member => ({
    userId: member.id,
    userName: member.name,
    status: Math.random() > 0.2 ? 'present' : Math.random() > 0.5 ? 'late' : 'absent',
    checkInTime: Math.random() > 0.2 ? `${8 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} AM` : null,
    hoursWorked: Math.random() > 0.2 ? Math.floor(Math.random() * 3) + 7 : 0
  }));

  const presentCount = mockAttendanceData.filter(a => a.status === 'present').length;
  const lateCount = mockAttendanceData.filter(a => a.status === 'late').length;
  const absentCount = mockAttendanceData.filter(a => a.status === 'absent').length;
  const attendanceRate = Math.round((presentCount / departmentMembers.length) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'default';
      case 'late': return 'secondary';
      case 'absent': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4" />;
      case 'late': return <AlertCircle className="h-4 w-4" />;
      case 'absent': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground">
            Track attendance for {userDepartment?.name} department
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Calendar className="w-4 h-4 mr-2" />
          {today.toLocaleDateString()}
        </Badge>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentMembers.length}</div>
            <p className="text-xs text-muted-foreground">Team size</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentCount}</div>
            <p className="text-xs text-muted-foreground">On time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late/Absent</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lateCount + absentCount}</div>
            <p className="text-xs text-muted-foreground">{lateCount} late, {absentCount} absent</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Today's rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Attendance - {today.toLocaleDateString()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockAttendanceData.map((attendance) => {
              const member = departmentMembers.find(m => m.id === attendance.userId);
              return (
                <Card key={attendance.userId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {attendance.userName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{attendance.userName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {member?.role.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(attendance.status)} className="flex items-center gap-1 text-xs">
                        {getStatusIcon(attendance.status)}
                        {attendance.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Check-in:</span>
                        <span>{attendance.checkInTime || 'Not checked in'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Hours worked:</span>
                        <span>{attendance.hoursWorked}h</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Attendance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Present</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(presentCount / departmentMembers.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{presentCount}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Late</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${(lateCount / departmentMembers.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{lateCount}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Absent</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${(absentCount / departmentMembers.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{absentCount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900 dark:text-green-100">
                    Good Attendance
                  </span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {attendanceRate}% attendance rate today
                </p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    Punctuality
                  </span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {presentCount} members arrived on time
                </p>
              </div>
              
              {absentCount > 0 && (
                <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-900 dark:text-orange-100">
                      Follow-up Required
                    </span>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    {absentCount} member{absentCount > 1 ? 's' : ''} absent today
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

