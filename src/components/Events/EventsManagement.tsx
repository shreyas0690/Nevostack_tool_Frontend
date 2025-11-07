import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, Eye, Calendar, FileText, Users, Download, X, Gift } from 'lucide-react';
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
  const [showRakshaBandhanModal, setShowRakshaBandhanModal] = useState(false);
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
    
    // Show Raksha Bandhan celebration modal
    setTimeout(() => {
      setShowRakshaBandhanModal(true);
    }, 500);
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

      {/* Raksha Bandhan Celebration Modal */}
      <Dialog open={showRakshaBandhanModal} onOpenChange={setShowRakshaBandhanModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <div className="relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRakshaBandhanModal(false)}
              className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white/90 rounded-full w-8 h-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white p-6">
              <div className="text-center">
                <Gift className="h-12 w-12 mx-auto mb-4 animate-bounce" />
                <h2 className="text-3xl font-bold mb-2">🎉 Event Created Successfully! 🎉</h2>
                <p className="text-orange-100 text-lg">
                  Celebrating the spirit of Raksha Bandhan - Bond of Protection & Love
                </p>
              </div>
            </div>

            {/* Raksha Bandhan Poster */}
            <div className="p-8 bg-gradient-to-b from-orange-50 to-red-50">
              <div className="max-w-2xl mx-auto">
                {/* Custom Raksha Bandhan Poster Design */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-orange-300">
                  {/* Poster Header */}
                  <div className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 text-white p-6 text-center">
                    <h1 className="text-4xl font-bold mb-2">🪷 राखी का त्योहार 🪷</h1>
                    <h2 className="text-2xl font-semibold">Raksha Bandhan</h2>
                    <p className="text-orange-100 mt-2">भाई-बहन के प्रेम का पावन पर्व</p>
                  </div>

                  {/* Main Poster Content */}
                  <div className="p-8 text-center bg-gradient-to-b from-yellow-50 to-orange-50">
                    {/* Decorative Elements */}
                    <div className="flex justify-center items-center mb-6">
                      <div className="text-6xl">🧵</div>
                      <div className="text-8xl mx-4">🪬</div>
                      <div className="text-6xl">🧵</div>
                    </div>

                    {/* Main Message */}
                    <div className="space-y-4 mb-6">
                      <h3 className="text-2xl font-bold text-orange-800">
                        भाई की कलाई पर बांधी जाने वाली राखी
                      </h3>
                      <p className="text-lg text-red-700">
                        बहन के प्यार और सुरक्षा का प्रतीक है
                      </p>
                      <div className="flex justify-center space-x-4 text-3xl my-6">
                        <span>👫</span>
                        <span>❤️</span>
                        <span>🛡️</span>
                        <span>🙏</span>
                      </div>
                    </div>

                    {/* Festival Details */}
                    <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-orange-200">
                      <h4 className="text-xl font-semibold text-orange-800 mb-4">
                        🌟 Festival Highlights 🌟
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-left">
                          <p className="font-semibold text-red-600">🎯 Purpose:</p>
                          <p className="text-gray-700">Brother-Sister Bond</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-red-600">🎁 Tradition:</p>
                          <p className="text-gray-700">Tying Sacred Thread</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-red-600">🍬 Celebration:</p>
                          <p className="text-gray-700">Sweets & Gifts</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-red-600">🕉️ Meaning:</p>
                          <p className="text-gray-700">Protection & Love</p>
                        </div>
                      </div>
                    </div>

                    {/* Decorative Bottom */}
                    <div className="mt-6 flex justify-center space-x-2 text-2xl">
                      <span>🌺</span>
                      <span>🪔</span>
                      <span>🌸</span>
                      <span>🪔</span>
                      <span>🌺</span>
                    </div>
                  </div>

                  {/* Poster Footer */}
                  <div className="bg-gradient-to-r from-red-400 via-pink-400 to-orange-400 text-white p-4 text-center">
                    <p className="text-lg font-semibold">
                      🎊 Happy Raksha Bandhan! 🎊
                    </p>
                    <p className="text-sm text-orange-100 mt-1">
                      May this sacred bond bring joy and prosperity
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-center">
              <Button
                onClick={() => setShowRakshaBandhanModal(false)}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-2 rounded-full font-semibold shadow-lg"
              >
                🙏 Close Celebration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}