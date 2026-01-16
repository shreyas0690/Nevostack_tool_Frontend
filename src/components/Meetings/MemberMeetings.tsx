import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Video, Calendar, Clock, Users, MapPin, ExternalLink, Search, Eye, CheckCircle2, XCircle, PlayCircle, Timer, Crown, Shield, User
} from 'lucide-react';
import { meetingService, Meeting } from '@/services/meetingService';

export default function MemberMeetings() {
  const { currentUser } = useAuth();

  // State
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('list');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load meetings function
  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await meetingService.getMeetings();
      if (response.success && response.data) {
        setMeetings(Array.isArray(response.data) ? response.data : []);
      } else if ((response as any).meetings) {
        setMeetings(Array.isArray((response as any).meetings) ? (response as any).meetings : []);
      }
    } catch (err) {
      console.error('Failed to load meetings:', err);
      setError('Failed to load meetings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load meetings on component mount
  useEffect(() => {
    loadMeetings();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Meetings</h1>
            <p className="text-muted-foreground">Your scheduled meetings and invites</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading meetings...</p>
          </div>
        </div>
      </div>
    );
  }

  // Filters
  const filteredMeetings = meetings.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const now = new Date();
  const todayMeetings = meetings.filter(m => {
    const meetingDate = new Date(m.startTime);
    return meetingDate.toDateString() === now.toDateString();
  });
  const upcomingMeetings = meetings.filter(m => new Date(m.startTime) >= now && m.status === 'scheduled');
  const completedMeetings = meetings.filter(m => m.status === 'completed');
  const cancelledMeetings = meetings.filter(m => m.status === 'cancelled');

  // Helpers
  const getStatusColor = (status: Meeting['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'in_progress': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'postponed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Meeting['status']) => {
    switch (status) {
      case 'scheduled': return <Calendar className="h-3 w-3" />;
      case 'in_progress': return <PlayCircle className="h-3 w-3" />;
      case 'completed': return <CheckCircle2 className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      case 'postponed': return <Clock className="h-3 w-3" />;
      default: return <Calendar className="h-3 w-3" />;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <Crown className="h-3 w-3 text-red-500" />;
      case 'admin': return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'hr_manager': return <Shield className="h-3 w-3 text-purple-500" />;
      case 'hr': return <Shield className="h-3 w-3 text-cyan-500" />;
      case 'department_head': return <Shield className="h-3 w-3 text-blue-500" />;
      case 'manager': return <Users className="h-3 w-3 text-green-500" />;
      case 'member': return <User className="h-3 w-3 text-gray-500" />;
      default: return <User className="h-3 w-3 text-gray-500" />;
    }
  };

  const getOrganizerRole = (meeting: Meeting) =>
    meeting.organizerRole || meeting.organizer?.role || 'member';

  const getOrganizerName = (organizer: Meeting['organizer'] | null) => {
    if (!organizer) return 'Unknown Organizer';
    const name = `${organizer.firstName || ''} ${organizer.lastName || ''}`.trim();
    return name || organizer.email || 'Unknown Organizer';
  };

  const getMeetingLink = (meeting: Meeting) =>
    meeting.meetingLink || meeting.location?.virtual?.meetingUrl;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const calculateDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return 'Duration not set';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}` : `${minutes}m`;
  };

  // Handle meeting response
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Meetings</h1>
          <p className="text-muted-foreground">View and join meetings you're invited to</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadMeetings} variant="outline" size="sm" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
          <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <Video className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Main */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2"><Clock className="h-4 w-4" /> Meetings List</TabsTrigger>
          <TabsTrigger value="today" className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Today ({todayMeetings.length})</TabsTrigger>
        </TabsList>

        {/* List */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5" /> My Meeting Invites</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search meetings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 w-64" />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="postponed">Postponed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading meetings...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMeetings.length > 0 ? filteredMeetings.map(meeting => {
                    const dateTime = formatDateTime(meeting.startTime);
                    const isToday = new Date(meeting.startTime).toDateString() === new Date().toDateString();
                    const isUpcoming = new Date(meeting.startTime) > new Date();
                    const organizerRole = getOrganizerRole(meeting);
                    const meetingLink = getMeetingLink(meeting);

                    return (
                      <Card key={meeting.id || (meeting as any)._id} className={`border-2 transition-all hover:shadow-md ${isToday ? 'border-blue-200 bg-blue-50/50' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isUpcoming ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                <Video className={`h-6 w-6 ${isUpcoming ? 'text-blue-600' : 'text-gray-600'}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">{meeting.title}</h3>
                                  <Badge className={getStatusColor(meeting.status)}>
                                    {getStatusIcon(meeting.status)}
                                    <span className="ml-1">{meeting.status.replace('_', ' ')}</span>
                                  </Badge>
                                  {meeting.priority && meeting.priority !== 'medium' && (
                                    <Badge variant={meeting.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                                      {meeting.priority}
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    <div className="flex items-center gap-1">
                                      {getRoleIcon(organizerRole)}
                                      <span>Organizer: {getOrganizerName(meeting.organizer)}</span>
                                      <span className="text-[10px] text-muted-foreground/70 ml-1">
                                        ({organizerRole.replace('_', ' ')})
                                      </span>
                                    </div>
                                  </Badge>
                                  {meeting.type !== 'physical' && (
                                    <Badge variant="outline" className="text-xs">
                                      {meeting.type}
                                    </Badge>
                                  )}
                                </div>

                                {meeting.description && (
                                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{meeting.description}</p>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="font-medium">Date & Time</p>
                                      <p className="text-muted-foreground">{dateTime.date} at {dateTime.time}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Timer className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="font-medium">Duration</p>
                                      <p className="text-muted-foreground">{calculateDuration(meeting.startTime, meeting.endTime)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="font-medium">Invitees</p>
                                      <p className="text-muted-foreground">{meeting.inviteeUserIds?.length || 0} people</p>
                                    </div>
                                  </div>
                                </div>

                                {meeting.location?.physical?.room && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                      {meeting.location.physical.room}
                                      {meeting.location.physical.building && `, ${meeting.location.physical.building}`}
                                    </span>
                                  </div>
                                )}

                                {meetingLink && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                    <a href={meetingLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                      Join Meeting Link
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-4">
                              {meetingLink && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={meetingLink} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4 mr-2" /> Join
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }) : (
                    <div className="text-center py-12">
                      <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No meetings found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery || statusFilter !== 'all'
                          ? 'Try adjusting your search filters'
                          : 'No meeting invitations yet'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Today */}
        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Today's Meetings ({todayMeetings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading today's meetings...</p>
                </div>
              ) : todayMeetings.length > 0 ? (
                <div className="space-y-4">
                  {todayMeetings.map(meeting => {
                    const dateTime = formatDateTime(meeting.startTime);
                    const meetingLink = getMeetingLink(meeting);
                    return (
                      <div key={meeting.id || (meeting as any)._id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Video className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-blue-900">{meeting.title}</h3>
                            <p className="text-sm text-blue-700">
                              {dateTime.time} • {calculateDuration(meeting.startTime, meeting.endTime)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {meeting.location?.physical?.room && (
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {meeting.location.physical.room}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                <Users className="w-3 h-3 mr-1" />
                                {meeting.inviteeUserIds?.length || 0} invitees
                              </Badge>
                              {meeting.priority && meeting.priority !== 'medium' && (
                                <Badge variant={meeting.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                                  {meeting.priority}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {meetingLink && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={meetingLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" /> Join
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No meetings today</h3>
                  <p className="text-muted-foreground">No meetings scheduled for today</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
