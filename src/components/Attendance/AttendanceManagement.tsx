import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAttendance } from '@/hooks/useAttendance';
import { Download, Search, Users, Clock, Calendar, LogOut, Timer } from 'lucide-react';
import AttendanceAnalytics from './AttendanceAnalytics';
import { useToast } from '@/hooks/use-toast';

export default function AttendanceManagement() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  
  const { 
    attendanceData, 
    getAttendanceByDate, 
    getAttendanceByUser, 
    getTodayAttendance,
    recordLogout,
    getAttendanceStats
  } = useAttendance();
  
  const { toast } = useToast();

  const uniqueUsers = Array.from(new Set(attendanceData.records.map(record => record.userName)));
  const stats = getAttendanceStats();
  
  const filteredRecords = getAttendanceByDate(selectedDate).filter(record => {
    const matchesSearch = record.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = selectedUser === 'all' || record.userName === selectedUser;
    return matchesSearch && matchesUser;
  });

  const exportData = () => {
    const csvData = filteredRecords.map(record => ({
      'User Name': record.userName,
      'Login Time': record.loginTime.toLocaleString(),
      'Logout Time': record.logoutTime?.toLocaleString() || 'Not logged out',
      'Working Hours': record.workingHours || 'N/A',
      'Status': record.isLate ? 'Late' : 'On Time',
      'Login Date': record.loginDate,
      'Session ID': record.sessionId
    }));
    
    console.log('Exported data:', csvData);
  };

  const handleLogout = (userId: string, userName: string) => {
    recordLogout(userId);
    toast({
      title: "Logout Recorded",
      description: `${userName} has been logged out successfully.`
    });
  };

  const todayAttendance = getTodayAttendance();
  const totalRecords = attendanceData.records.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground">Track and manage user attendance records</p>
        </div>
        <Button onClick={exportData} className="gap-2">
          <Download className="w-4 h-4" />
          Export Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.presentToday}</div>
            <p className="text-xs text-muted-foreground">{stats.attendanceRate}% attendance rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lateToday}</div>
            <p className="text-xs text-muted-foreground">Late today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Working Hours</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgWorkingHours}h</div>
            <p className="text-xs text-muted-foreground">Overall average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
            <p className="text-xs text-muted-foreground">All time records</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Daily View</TabsTrigger>
          <TabsTrigger value="user">User View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Filter Attendance Records
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Search by user name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {uniqueUsers.map((userName) => (
                        <SelectItem key={userName} value={userName}>
                          {userName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Attendance Records</CardTitle>
                <CardDescription>
                  Showing {filteredRecords.length} records for {new Date(selectedDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRecords.map((record) => {
                    const canLogout = !record.logoutTime && record.loginDate === new Date().toISOString().split('T')[0];
                    return (
                      <Card key={record.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-medium">{record.userName}</p>
                              <p className="text-sm text-muted-foreground">
                                Login: {record.loginTime.toLocaleTimeString()}
                                {record.logoutTime && ` | Logout: ${record.logoutTime.toLocaleTimeString()}`}
                              </p>
                              {record.workingHours && (
                                <p className="text-sm text-muted-foreground">
                                  Working Hours: {record.workingHours}h
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {record.isLate && (
                              <Badge variant="destructive">Late</Badge>
                            )}
                            {!record.isLate && record.loginDate === new Date().toISOString().split('T')[0] && (
                              <Badge variant="default">On Time</Badge>
                            )}
                            {canLogout && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleLogout(record.userId, record.userName)}
                              >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                              </Button>
                            )}
                            <Badge variant="secondary">
                              {record.loginTime.toLocaleDateString()}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {filteredRecords.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-8">
                        <p className="text-muted-foreground">No attendance records found for selected filters.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="user">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select User</CardTitle>
                <CardDescription>Choose a user to view their complete attendance history</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueUsers.map((userName) => (
                      <SelectItem key={userName} value={userName}>
                        {userName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedUser !== 'all' && (
              <Card>
                <CardHeader>
                  <CardTitle>User Attendance History - {selectedUser}</CardTitle>
                  <CardDescription>
                    Complete attendance records for this user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      const userRecords = attendanceData.records
                        .filter(record => record.userName === selectedUser)
                        .sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());
                      
                      return userRecords.map((record) => (
                        <Card key={record.id}>
                          <CardContent className="flex items-center justify-between p-4">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                {record.loginTime.toLocaleDateString()} at {record.loginTime.toLocaleTimeString()}
                                {record.logoutTime && ` - ${record.logoutTime.toLocaleTimeString()}`}
                              </p>
                              {record.workingHours && (
                                <p className="text-xs text-muted-foreground">
                                  Working hours: {record.workingHours}h
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {record.isLate && <Badge variant="destructive">Late</Badge>}
                              {!record.isLate && <Badge variant="default">On Time</Badge>}
                              <Badge variant="outline">
                                Session: {record.sessionId.split('_')[1]}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ));
                    })()}
                    {(() => {
                      const userRecords = attendanceData.records.filter(record => record.userName === selectedUser);
                      return userRecords.length === 0 && (
                        <Card>
                          <CardContent className="text-center py-8">
                            <p className="text-muted-foreground">No attendance records found for this user.</p>
                          </CardContent>
                        </Card>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <AttendanceAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}