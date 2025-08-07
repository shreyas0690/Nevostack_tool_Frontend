import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, ExternalLink, FileText, Download } from 'lucide-react';
import { Event } from '@/types/events';
import { UserRole } from '@/types/company';

interface EventsDisplayProps {
  events: Event[];
  userRole?: UserRole;
  userDepartment?: string;
  maxEvents?: number;
}

export default function EventsDisplay({ 
  events, 
  userRole = 'executive', 
  userDepartment = 'engineering',
  maxEvents = 5 
}: EventsDisplayProps) {
  
  const canViewEvent = (event: Event): boolean => {
    if (!event.isActive) return false;
    
    switch (event.visibility) {
      case 'all':
        return true;
      case 'managers_only':
        return ['super_admin', 'admin', 'department_head', 'manager'].includes(userRole);
      case 'department_specific':
        return event.allowedDepartments?.includes(userDepartment) || false;
      case 'role_specific':
        return event.allowedRoles?.includes(userRole) || false;
      default:
        return false;
    }
  };

  const visibleEvents = events
    .filter(canViewEvent)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .slice(0, maxEvents);

  const getEventTypeColor = (type: string) => {
    const colors = {
      meeting: 'bg-blue-100 text-blue-800 border-blue-200',
      training: 'bg-green-100 text-green-800 border-green-200',
      announcement: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      celebration: 'bg-purple-100 text-purple-800 border-purple-200',
      deadline: 'bg-red-100 text-red-800 border-red-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const isEventToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isEventUpcoming = (date: Date) => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  if (visibleEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No upcoming events at this time.
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
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleEvents.map((event) => (
          <div
            key={event.id}
            className={`border rounded-lg p-4 space-y-3 ${
              isEventToday(event.startDate) 
                ? 'border-primary bg-primary/5' 
                : isEventUpcoming(event.startDate)
                ? 'border-orange-200 bg-orange-50'
                : 'border-border'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold">{event.title}</h3>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </div>
              <Badge className={getEventTypeColor(event.type)}>
                {event.type}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  {isEventToday(event.startDate) ? 'Today' : event.startDate.toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{event.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Event Poster */}
            {event.posterImage && (
              <div className="mt-3">
                <img 
                  src={event.posterImage} 
                  alt="Event poster" 
                  className="w-full h-32 object-cover rounded-md border"
                />
              </div>
            )}

            {/* Attached Files */}
            {event.attachedFiles && event.attachedFiles.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center mb-2">
                  <FileText className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm font-medium">Attached Files:</span>
                </div>
                <div className="space-y-1">
                  {event.attachedFiles.slice(0, 2).map((file) => (
                    <div key={file.id} className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded">
                      <span className="truncate">{file.name}</span>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={file.url} download={file.name}>
                          <Download className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  ))}
                  {event.attachedFiles.length > 2 && (
                    <p className="text-xs text-muted-foreground">
                      +{event.attachedFiles.length - 2} more files
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-muted-foreground">
                <Users className="h-3 w-3 mr-1" />
                {event.visibility === 'all' && 'All Users'}
                {event.visibility === 'managers_only' && 'Managers Only'}
                {event.visibility === 'department_specific' && 
                  `${event.allowedDepartments?.length || 0} Department(s)`}
                {event.visibility === 'role_specific' && 
                  `${event.allowedRoles?.length || 0} Role(s)`}
              </div>

              {event.isOnline && event.meetingLink && (
                <Button variant="outline" size="sm" asChild>
                  <a href={event.meetingLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Join
                  </a>
                </Button>
              )}
            </div>

            {isEventToday(event.startDate) && (
              <div className="text-xs font-medium text-primary">
                🎯 Happening Today!
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}