import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Users, Clock, UserCheck, CalendarDays, Loader2 } from 'lucide-react';
import { leaveTypeConfig } from '@/types/leave';
import { format, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { useState, useEffect } from 'react';
import { leaveService } from '@/services/leaveService';
import { useAuth } from '@/components/Auth/AuthProvider';

export default function LeaveCalendar() {
  const { currentUser } = useAuth();
  const [monthlySummary, setMonthlySummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    const loadMonthlySummary = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await leaveService.getMonthlySummary({
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1 // JS months are 0-indexed
        });

        if (response && response.success && response.data) {
          setMonthlySummary(response.data);
        } else {
          setError('Failed to load monthly leave summary');
        }
      } catch (err: any) {
        console.error('Error loading monthly leave summary:', err);
        setError(err.message || 'Failed to load monthly leave summary');
      } finally {
        setIsLoading(false);
      }
    };

    loadMonthlySummary();
  }, [currentDate.getFullYear(), currentDate.getMonth(), currentUser]);

  const approvedLeaves = monthlySummary?.leaves || [];

  const getEmployeeName = (employeeId: string) => {
    const leave = approvedLeaves.find((l: any) => l.employeeId === employeeId);
    return leave?.employeeName || 'Unknown';
  };

  const getLeavesForDay = (day: Date) => {
    return approvedLeaves.filter((leave: any) =>
      isWithinInterval(day, { start: new Date(leave.startDate), end: new Date(leave.endDate) })
    );
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent rounded-xl"></div>
        <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Leave Calendar</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">{format(currentDate, 'MMMM yyyy')} - Track employee leave schedules</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            Monthly Calendar View
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map(day => (
              <div key={day} className="p-3 text-center font-semibold text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const leavesForDay = getLeavesForDay(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = format(day, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd');
              
              return (
                <div 
                  key={index}
                  className={`min-h-[100px] p-2 border border-slate-200 dark:border-slate-700 rounded-lg ${
                    !isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500' : 'bg-white dark:bg-slate-800'
                  } ${isToday ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 shadow-sm' : ''} hover:shadow-sm transition-shadow`}
                >
                  <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {leavesForDay.slice(0, 2).map(leave => {
                      const config = leaveTypeConfig[leave.leaveType];
                      return (
                        <div 
                          key={leave.id}
                          className="text-xs p-1.5 rounded-md text-white truncate font-medium shadow-sm"
                          style={{ backgroundColor: config.color }}
                          title={`${getEmployeeName(leave.employeeId)} - ${config.label}`}
                        >
                          {getEmployeeName(leave.employeeId).split(' ')[0]}
                        </div>
                      );
                    })}
                    {leavesForDay.length > 2 && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-700 rounded-md p-1 text-center">
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

      {/* Removed Leave Types Legend and Monthly Summary as requested */}
    </div>
  );
}