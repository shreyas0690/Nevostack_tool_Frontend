import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Eye, Calendar, FileText, Users, Download } from 'lucide-react';
import { mockEvents } from '@/data/eventsData';
import { Event } from '@/types/events';
import AddEventDialog from './AddEventDialog';
import EditEventDialog from './EditEventDialog';
import { useToast } from '@/hooks/use-toast';

export default function EventsManagement() {
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddEvent = (newEvent: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    const event: Event = {
      ...newEvent,
      id: `event-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setEvents([...events, event]);
    toast({
      title: "Event Created",
      description: "Event has been successfully created.",
    });
  };

  const handleEditEvent = (updatedEvent: Event) => {
    setEvents(events.map(event => 
      event.id === updatedEvent.id 
        ? { ...updatedEvent, updatedAt: new Date() }
        : event
    ));
    toast({
      title: "Event Updated",
      description: "Event has been successfully updated.",
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(event => event.id !== eventId));
    toast({
      title: "Event Deleted",
      description: "Event has been successfully deleted.",
    });
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      meeting: 'bg-blue-100 text-blue-800',
      training: 'bg-green-100 text-green-800',
      announcement: 'bg-yellow-100 text-yellow-800',
      celebration: 'bg-purple-100 text-purple-800',
      deadline: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const getVisibilityText = (event: Event) => {
    switch (event.visibility) {
      case 'all':
        return 'All Users';
      case 'managers_only':
        return 'Managers Only';
      case 'department_specific':
        return `Departments: ${event.allowedDepartments?.join(', ') || 'None'}`;
      case 'role_specific':
        return `Roles: ${event.allowedRoles?.join(', ') || 'None'}`;
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Event Management</h1>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Events Overview</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Files</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.description.substring(0, 60)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getEventTypeColor(event.type)}>
                      {event.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      {event.startDate.toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      {event.posterImage && (
                        <img 
                          src={event.posterImage} 
                          alt="Event poster" 
                          className="w-8 h-8 object-cover rounded mr-2"
                        />
                      )}
                      {event.attachedFiles && event.attachedFiles.length > 0 ? (
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {event.attachedFiles.length} file(s)
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No files</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-1" />
                      {getVisibilityText(event)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={event.isActive ? "default" : "secondary"}>
                      {event.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddEventDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAddEvent={handleAddEvent}
      />

      {selectedEvent && (
        <EditEventDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          event={selectedEvent}
          onEditEvent={handleEditEvent}
        />
      )}
    </div>
  );
}