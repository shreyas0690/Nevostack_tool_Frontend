
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
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
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.scheduled;
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Meeting Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium text-sm min-w-[120px] text-center">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-md border pointer-events-auto"
            modifiers={{
              hasMeetings: (date) => getMeetingsForDate(date).length > 0
            }}
            modifiersStyles={{
              hasMeetings: { 
                backgroundColor: 'hsl(var(--primary) / 0.1)',
                border: '1px solid hsl(var(--primary) / 0.3)'
              }
            }}
          />
          
          <div className="mt-4">
            <h4 className="font-medium text-sm mb-2">
              Meetings in {monthNames[currentMonth.getMonth()]} ({monthlyMeetings.length})
            </h4>
            <div className="space-y-1">
              {monthlyMeetings.slice(0, 5).map((meeting) => (
                <div key={meeting.id} className="text-xs p-2 bg-muted/50 rounded flex justify-between items-center">
                  <span className="truncate">{meeting.title}</span>
                  <Badge className={`${getStatusColor(meeting.status)} text-xs`}>
                    {meeting.status}
                  </Badge>
                </div>
              ))}
              {monthlyMeetings.length > 5 && (
                <div className="text-xs text-muted-foreground text-center py-1">
                  +{monthlyMeetings.length - 5} more meetings
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate 
              ? `Meetings on ${selectedDate.toLocaleDateString()}`
              : 'Select a date to view meetings'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateMeetings.length > 0 ? (
            <div className="space-y-3">
              {selectedDateMeetings.map((meeting) => (
                <div key={meeting.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{meeting.title}</h4>
                      <p className="text-sm text-muted-foreground">{meeting.description}</p>
                    </div>
                    <Badge className={getStatusColor(meeting.status)}>
                      {meeting.status}
                    </Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Time:</strong> {meeting.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div>
                      <strong>Duration:</strong> {Math.floor(meeting.duration / 60)}h {meeting.duration % 60}m
                    </div>
                    <div>
                      <strong>Location:</strong> {meeting.location}
                    </div>
                    <div>
                      <strong>Attendees:</strong> {meeting.attendees.length} people
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {selectedDate 
                ? 'No meetings scheduled for this date.'
                : 'Select a date to view meetings.'
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
