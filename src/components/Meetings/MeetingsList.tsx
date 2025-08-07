
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Video, ExternalLink, Edit } from 'lucide-react';
import { Meeting } from '@/types/meetings';
import { mockUsers, mockDepartments } from '@/data/mockData';
import EditMeetingDialog from './EditMeetingDialog';

interface MeetingsListProps {
  meetings: Meeting[];
}

export default function MeetingsList({ meetings }: MeetingsListProps) {
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
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

  const getDepartmentNames = (deptIds?: string[]) => {
    if (!deptIds) return [];
    return deptIds.map(id => {
      const dept = mockDepartments.find(d => d.id === id);
      return dept ? dept.name : 'Unknown';
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const sortedMeetings = [...meetings].sort((a, b) => b.date.getTime() - a.date.getTime());

  if (meetings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No meetings found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedMeetings.map((meeting) => (
        <div
          key={meeting.id}
          className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{meeting.title}</h3>
              <p className="text-sm text-muted-foreground">{meeting.description}</p>
            </div>
            <Badge className={getStatusColor(meeting.status)}>
              {meeting.status.replace('_', ' ')}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{meeting.date.toLocaleDateString()}</span>
            <span className="text-muted-foreground">at</span>
            <span>{meeting.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Attendees ({meeting.attendees.length}):</span>
              <span>{meeting.attendees.map(getUserName).join(', ')}</span>
            </div>

            {meeting.departments && meeting.departments.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Departments:</span>
                <div className="flex flex-wrap gap-1">
                  {getDepartmentNames(meeting.departments).map((name, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditingMeeting(meeting)}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
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

      <EditMeetingDialog
        open={!!editingMeeting}
        onClose={() => setEditingMeeting(null)}
        meeting={editingMeeting}
      />
    </div>
  );
}
