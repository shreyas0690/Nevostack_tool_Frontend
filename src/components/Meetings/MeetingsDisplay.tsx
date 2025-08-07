import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Video, ExternalLink } from 'lucide-react';
import { Meeting } from '@/types/meetings';
import { mockUsers } from '@/data/mockData';

interface MeetingsDisplayProps {
  meetings: Meeting[];
  maxMeetings?: number;
}

export default function MeetingsDisplay({ meetings, maxMeetings = 5 }: MeetingsDisplayProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status as keyof typeof colors] || colors.scheduled;
  };

  const getUserName = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const isUpcoming = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  const upcomingMeetings = meetings
    .filter(meeting => isUpcoming(meeting.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, maxMeetings);

  if (upcomingMeetings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Upcoming Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No upcoming meetings this week.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Upcoming Meetings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingMeetings.map((meeting) => (
          <div
            key={meeting.id}
            className="border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{meeting.title}</h3>
                <p className="text-sm text-muted-foreground">{meeting.description}</p>
              </div>
              <Badge className={getStatusColor(meeting.status)}>
                {meeting.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{meeting.date.toLocaleDateString()}</span>
                <span className="text-muted-foreground">at</span>
                <span>{meeting.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{Math.floor(meeting.duration / 60)}h {meeting.duration % 60}m</span>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Organizer: {getUserName(meeting.organizer)}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <a href={meeting.meetingLink || '#'} target="_blank" rel="noopener noreferrer">
                  <Video className="h-3 w-3 mr-1" />
                  Join Meeting
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}