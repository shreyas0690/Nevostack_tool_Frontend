
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Calendar, Clock, Users, TrendingUp } from 'lucide-react';
import { Meeting } from '@/types/meetings';
import { mockUsers, mockDepartments } from '@/data/mockData';

interface MeetingStatsProps {
  meetings: Meeting[];
}

export default function MeetingStats({ meetings }: MeetingStatsProps) {
  const getMonthlyStats = () => {
    const monthlyData: { [key: string]: { count: number; duration: number; completed: number } } = {};
    
    meetings.forEach(meeting => {
      const monthKey = `${meeting.date.getFullYear()}-${String(meeting.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, duration: 0, completed: 0 };
      }
      monthlyData[monthKey].count++;
      monthlyData[monthKey].duration += meeting.duration;
      if (meeting.status === 'completed') {
        monthlyData[monthKey].completed++;
      }
    });

    return Object.entries(monthlyData)
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return {
          month: monthName,
          ...data,
          averageDuration: Math.round(data.duration / data.count)
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const getDepartmentStats = () => {
    const deptStats: { [key: string]: number } = {};
    
    meetings.forEach(meeting => {
      if (meeting.departments) {
        meeting.departments.forEach(deptId => {
          deptStats[deptId] = (deptStats[deptId] || 0) + 1;
        });
      }
    });

    return Object.entries(deptStats)
      .map(([deptId, count]) => {
        const dept = mockDepartments.find(d => d.id === deptId);
        return {
          name: dept ? dept.name : 'Unknown',
          count,
          color: dept ? dept.color : '#gray'
        };
      })
      .sort((a, b) => b.count - a.count);
  };

  const getStatusStats = () => {
    const statusCounts = meetings.reduce((acc, meeting) => {
      acc[meeting.status] = (acc[meeting.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return statusCounts;
  };

  const monthlyStats = getMonthlyStats();
  const departmentStats = getDepartmentStats();
  const statusStats = getStatusStats();
  const totalDuration = meetings.reduce((sum, meeting) => sum + meeting.duration, 0);
  const averageDuration = meetings.length > 0 ? Math.round(totalDuration / meetings.length) : 0;
  const totalAttendees = meetings.reduce((sum, meeting) => sum + meeting.attendees.length, 0);

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.scheduled;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Meetings</p>
                <p className="text-2xl font-bold">{meetings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Duration</p>
                <p className="text-2xl font-bold">{Math.round(totalDuration / 60)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold">{averageDuration}m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Attendees</p>
                <p className="text-2xl font-bold">{totalAttendees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Meeting Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyStats.map((stat, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{stat.month}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline">{stat.count} meetings</Badge>
                      <Badge variant="outline">{Math.round(stat.duration / 60)}h total</Badge>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${(stat.count / Math.max(...monthlyStats.map(s => s.count))) * 100}%` }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.completed} completed • Avg: {stat.averageDuration}m per meeting
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Department-wise Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {departmentStats.map((dept, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: dept.color }}
                    />
                    <span>{dept.name}</span>
                  </div>
                  <Badge variant="outline">{dept.count} meetings</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(statusStats).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className="text-2xl font-bold">{count}</div>
                <Badge className={`${getStatusColor(status)} mt-1`}>
                  {status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
