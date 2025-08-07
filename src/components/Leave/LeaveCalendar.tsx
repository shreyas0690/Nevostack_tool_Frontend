import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Users } from 'lucide-react';
import { mockLeaveRequests, mockLeaveBalances } from '@/data/leaveData';
import { leaveTypeConfig } from '@/types/leave';
import { mockUsers } from '@/data/mockData';
import { format, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';

export default function LeaveCalendar() {
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Get approved leaves for current month
  const approvedLeaves = mockLeaveRequests.filter(request => 
    request.status === 'approved' &&
    (isWithinInterval(request.startDate, { start: monthStart, end: monthEnd }) ||
     isWithinInterval(request.endDate, { start: monthStart, end: monthEnd }))
  );

  const getEmployeeName = (id: string) => {
    return mockUsers.find(u => u.id === id)?.name || 'Unknown';
  };

  const getLeavesForDay = (day: Date) => {
    return approvedLeaves.filter(leave => 
      isWithinInterval(day, { start: leave.startDate, end: leave.endDate })
    );
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Leave Calendar - {format(currentDate, 'MMMM yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const leavesForDay = getLeavesForDay(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = format(day, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd');
              
              return (
                <div 
                  key={index}
                  className={`min-h-[80px] p-1 border border-border rounded ${
                    !isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : 'bg-background'
                  } ${isToday ? 'bg-primary/10 border-primary' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {leavesForDay.slice(0, 2).map(leave => {
                      const config = leaveTypeConfig[leave.leaveType];
                      return (
                        <div 
                          key={leave.id}
                          className="text-xs p-1 rounded text-white truncate"
                          style={{ backgroundColor: config.color }}
                          title={`${getEmployeeName(leave.employeeId)} - ${config.label}`}
                        >
                          {getEmployeeName(leave.employeeId).split(' ')[0]}
                        </div>
                      );
                    })}
                    {leavesForDay.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{leavesForDay.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leave Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Leave Types Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(leaveTypeConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-sm">{config.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Leave Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {approvedLeaves.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No approved leaves for this month
              </p>
            ) : (
              approvedLeaves.map(leave => {
                const config = leaveTypeConfig[leave.leaveType];
                return (
                  <div key={leave.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: config.color }}
                      />
                      <div>
                        <span className="font-medium">{getEmployeeName(leave.employeeId)}</span>
                        <div className="text-sm text-muted-foreground">
                          {format(leave.startDate, 'MMM dd')} - {format(leave.endDate, 'MMM dd')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge style={{ backgroundColor: config.color, color: 'white' }}>
                        {config.label}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}