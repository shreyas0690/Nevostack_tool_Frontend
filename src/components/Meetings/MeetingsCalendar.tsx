
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Users, Video } from 'lucide-react';
import { Meeting } from '@/types/meetings';

interface MeetingsCalendarProps {
  meetings: Meeting[];
}

export default function MeetingsCalendar({ meetings }: MeetingsCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(meeting => 
      meeting.date.toDateString() === date.toDateString()
    );
  };

  const getMeetingsForMonth = (month: Date) => {
    return meetings.filter(meeting => 
      meeting.date.getMonth() === month.getMonth() &&
      meeting.date.getFullYear() === month.getFullYear()
    );
  };

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

  const formatLocation = (loc: any) => {
    if (!loc) return 'N/A';
    if (typeof loc === 'string') return loc;
    // If backend sends { physical: {...}, virtual: {...} }
    if (loc.physical && typeof loc.physical === 'object') {
      // Prefer a human readable physical location if present
      const room = loc.physical.room || loc.physical.name || '';
      const address = loc.physical.address || '';
      return (room || address) ? `${room}${room && address ? ', ' : ''}${address}`.trim() : 'Physical location';
    }
    if (loc.virtual && typeof loc.virtual === 'object') {
      // Prefer meeting link or label
      const link = loc.virtual.link || loc.virtual.meetingLink || '';
      const label = loc.virtual.label || loc.virtual.name || '';
      return link || label ? (label || link) : 'Virtual location';
    }
    // Fallback: stringify simple object properties
    if (typeof loc === 'object') {
      try {
        const parts: string[] = [];
        Object.keys(loc).forEach(k => {
          const v = (loc as any)[k];
          if (typeof v === 'string') parts.push(v);
        });
        if (parts.length > 0) return parts.join(', ');
      } catch (e) {
        // ignore
      }
    }
    return 'Location info';
  };

  const monthlyMeetings = getMeetingsForMonth(currentMonth);
  const selectedDateMeetings = selectedDate ? getMeetingsForDate(selectedDate) : [];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent rounded-xl"></div>
        <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  <span className="hidden sm:inline">Meeting Calendar</span>
                  <span className="sm:hidden">Calendar</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  <span className="hidden sm:inline">View and manage your meetings</span>
                  <span className="sm:hidden">Manage meetings</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('prev')}
                className="border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1">Prev</span>
              </Button>
              <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 min-w-[100px] sm:min-w-[140px] text-center">
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                  <span className="hidden sm:inline">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                  <span className="sm:hidden">{monthNames[currentMonth.getMonth()].substring(0, 3)} {currentMonth.getFullYear()}</span>
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('next')}
                className="border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1">Next</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4 lg:gap-6">
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm lg:col-span-1 xl:col-span-2">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-4">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm sm:text-base lg:text-lg">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="hidden sm:inline">Calendar View</span>
              <span className="sm:hidden">Calendar</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-xl border-slate-200 dark:border-slate-700 pointer-events-auto shadow-sm"
              modifiers={{
                hasMeetings: (date) => getMeetingsForDate(date).length > 0
              }}
              modifiersStyles={{
                hasMeetings: { 
                  backgroundColor: 'hsl(0 84% 60% / 0.1)',
                  border: '1px solid hsl(0 84% 60% / 0.3)',
                  borderRadius: '6px'
                }
              }}
            />
            
            <div className="mt-4 lg:mt-6 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></div>
                <span className="hidden sm:inline">Meetings in {monthNames[currentMonth.getMonth()]} ({monthlyMeetings.length})</span>
                <span className="sm:hidden">{monthNames[currentMonth.getMonth()]} ({monthlyMeetings.length})</span>
              </h4>
              <div className="space-y-2">
                {monthlyMeetings.slice(0, 5).map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-2 sm:p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-sm transition-shadow">
                    <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 truncate flex-1 mr-2 sm:mr-3">
                      {meeting.title}
                    </span>
                    <Badge className={`${getStatusColor(meeting.status)} text-xs font-medium border-0`}>
                      {meeting.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
                {monthlyMeetings.length > 5 && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-1.5 sm:py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    +{monthlyMeetings.length - 5} more meetings
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 shadow-sm lg:col-span-1 xl:col-span-3">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-4">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm sm:text-base lg:text-lg">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="hidden sm:inline">
                {selectedDate 
                  ? `Meetings on ${selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}`
                  : 'Select a date to view meetings'
                }
              </span>
              <span className="sm:hidden">
                {selectedDate 
                  ? `Meetings on ${selectedDate.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric'
                    })}`
                  : 'Select a date'
                }
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-4">
            {selectedDateMeetings.length > 0 ? (
              <div className="space-y-4">
                {selectedDateMeetings.map((meeting) => (
                  <div key={meeting.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">
                          {meeting.title}
                        </h4>
                        {meeting.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {meeting.description}
                          </p>
                        )}
                      </div>
                      <Badge className={`${getStatusColor(meeting.status)} text-xs font-medium border-0 ml-3`}>
                        {meeting.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                          <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {meeting.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {Math.floor(meeting.duration / 60)}h {meeting.duration % 60}m duration
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                          <Users className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {meeting.attendees.length} attendees
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            Meeting participants
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  {selectedDate ? 'No meetings scheduled' : 'Select a date'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {selectedDate 
                    ? 'No meetings are scheduled for this date.'
                    : 'Choose a date from the calendar to view meetings.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
