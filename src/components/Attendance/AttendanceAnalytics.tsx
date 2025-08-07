import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAttendance } from "@/hooks/useAttendance";
import { useMemo } from "react";

export default function AttendanceAnalytics() {
  const { attendanceData, getAttendanceStats } = useAttendance();
  const stats = getAttendanceStats();

  const dailyAttendanceData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayRecords = attendanceData.records.filter(r => r.loginDate === date);
      const onTimeCount = dayRecords.filter(r => !r.isLate).length;
      const lateCount = dayRecords.filter(r => r.isLate).length;
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        onTime: onTimeCount,
        late: lateCount,
        total: dayRecords.length
      };
    });
  }, [attendanceData]);

  const workingHoursData = useMemo(() => {
    const userHours = attendanceData.records
      .filter(r => r.workingHours)
      .reduce((acc, record) => {
        if (!acc[record.userName]) {
          acc[record.userName] = [];
        }
        acc[record.userName].push(record.workingHours!);
        return acc;
      }, {} as Record<string, number[]>);

    return Object.entries(userHours).map(([userName, hours]) => ({
      userName,
      avgHours: Number((hours.reduce((sum, h) => sum + h, 0) / hours.length).toFixed(1)),
      totalDays: hours.length
    })).slice(0, 10);
  }, [attendanceData]);

  const attendanceStatusData = [
    { name: 'Present Today', value: stats.presentToday, color: '#22c55e' },
    { name: 'Late Today', value: stats.lateToday, color: '#f59e0b' },
    { name: 'Absent Today', value: Math.max(0, stats.totalUsers - stats.presentToday), color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Today's attendance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lateToday}</div>
            <p className="text-xs text-muted-foreground">Late today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Working Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgWorkingHours}h</div>
            <p className="text-xs text-muted-foreground">Overall average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>7-Day Attendance Trend</CardTitle>
            <CardDescription>Daily attendance for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="onTime" stackId="a" fill="#22c55e" name="On Time" />
                <Bar dataKey="late" stackId="a" fill="#f59e0b" name="Late" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance Status</CardTitle>
            <CardDescription>Current day attendance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attendanceStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {attendanceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Average Working Hours by User</CardTitle>
            <CardDescription>Top users by average daily working hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workingHoursData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="userName" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="avgHours" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}