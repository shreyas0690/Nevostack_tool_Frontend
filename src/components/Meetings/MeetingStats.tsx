
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Calendar, Clock, Users, TrendingUp, PieChart as PieChartIcon, Activity, Target } from 'lucide-react';
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
    const deptStats: { [key: string]: { count: number; name?: string; color?: string } } = {};

    meetings.forEach(meeting => {
      if (!meeting.departments) return;
      meeting.departments.forEach((deptItem: any) => {
        // deptItem may be an id string or a populated object {_id,id,name}
        let id: string | undefined;
        let name: string | undefined;
        let color: string | undefined;

        if (!deptItem) return;
        if (typeof deptItem === 'string') {
          id = deptItem;
        } else if (typeof deptItem === 'object') {
          id = deptItem.id || deptItem._id;
          name = deptItem.name;
          color = deptItem.color;
        }

        if (!id) {
          // fallback: use name as key
          id = name || JSON.stringify(deptItem);
        }

        if (!deptStats[id]) deptStats[id] = { count: 0, name, color };
        deptStats[id].count++;
        // if name/color not set, try to fill from mock list
        if (!deptStats[id].name) {
          const found = mockDepartments.find(d => d.id === id || (d as any)._id === id || d.name === id);
          if (found) {
            deptStats[id].name = found.name;
            deptStats[id].color = (found as any).color;
          }
        }
      });
    });

    return Object.entries(deptStats)
      .map(([deptId, info]) => ({
        name: info.name || 'Unknown',
        count: info.count,
        color: info.color || '#999'
      }))
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
      scheduled: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600',
      in_progress: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
      completed: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
      cancelled: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
      postponed: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
    };
    return colors[status as keyof typeof colors] || colors.scheduled;
  };

  return (
    <div className="space-y-6">
      {/* Meeting Statistics Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent rounded-xl"></div>
        <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
                <span className="hidden sm:inline">Meeting Statistics</span>
                <span className="sm:hidden">Statistics</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                <span className="hidden sm:inline">Comprehensive insights into meeting performance and trends</span>
                <span className="sm:hidden">Meeting insights and trends</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">Total Meetings</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{meetings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">Total Duration</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{Math.round(totalDuration / 60)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">Avg Duration</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{averageDuration}m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">Total Attendees</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{totalAttendees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Statistics */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-6">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm sm:text-base lg:text-lg">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="hidden sm:inline">Monthly Meeting Statistics</span>
              <span className="sm:hidden">Monthly Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="space-y-4 sm:space-y-6">
              {monthlyStats.map((stat, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 hover:shadow-sm transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-3">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{stat.month}</span>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      <Badge className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 text-xs">
                        {stat.count} meetings
                      </Badge>
                      <Badge className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 text-xs">
                        {Math.round(stat.duration / 60)}h total
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 sm:h-3 mb-3">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-red-600 h-2 sm:h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${(stat.count / Math.max(...monthlyStats.map(s => s.count))) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                      {stat.completed} completed
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></div>
                      Avg: {stat.averageDuration}m per meeting
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Statistics */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              Department-wise Meetings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {departmentStats.map((dept, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full shadow-sm" 
                      style={{ backgroundColor: dept.color }}
                    />
                    <span className="font-medium text-slate-900 dark:text-slate-100">{dept.name}</span>
                  </div>
                  <Badge className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 font-medium">
                    {dept.count} meetings
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <PieChartIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            Meeting Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(statusStats).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-sm transition-shadow">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">{count}</div>
                <Badge className={`${getStatusColor(status)} font-medium border-0`}>
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
