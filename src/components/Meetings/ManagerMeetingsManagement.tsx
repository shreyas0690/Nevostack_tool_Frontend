import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Video, 
  Calendar, 
  Clock, 
  Users, 
  MapPin,
  Plus,
  ExternalLink,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  PlayCircle,
  BarChart3,
  Building2,
  UserCheck,
  Timer,
  Crown,
  Shield,
  Target
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { meetingService } from '@/services/meetingService';
import { getTeamMembers } from '@/services/managerService';
import { Meeting, MeetingStatus } from '@/types/meetings';
import { CreateMeetingDialog } from './index';

export default function ManagerMeetingsManagement() {
  const { currentUser } = useAuth();
  
  // State management
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  // Form state for scheduling meetings
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    location: '',
    meetingLink: '',
    selectedAttendees: [] as string[],
    status: 'scheduled' as MeetingStatus
  });

  // Fetch team members from backend
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await getTeamMembers();
        if (response && response.success && response.data) {
          setTeamMembers(response.data);
        } else {
          setTeamMembers([]);
        }
      } catch (error) {
        console.error('Failed to fetch team members:', error);
        setTeamMembers([]);
      }
    };

    if (currentUser?.id) {
      fetchTeamMembers();
    }
  }, [currentUser?.id]);
  

  useEffect(() => {
    let mounted = true;
    const fetchMeetings = async () => {
      try {
        setIsLoading(true);
        const response = await meetingService.getMeetings();
        if (response && response.success && (response.data || (response as any).meetings)) {
          const meetingsArray = response.data ?? (response as any).meetings;
          
          console.log('ManagerMeetingsManagement: Raw meeting data from backend:', meetingsArray.map((m: any) => ({
            id: m.id,
            title: m.title,
            organizer: m.organizer,
            organizerType: typeof m.organizer,
            organizerRole: m.organizerRole
          })));
          
          const transformed = meetingsArray.map((meeting: any) => {
            const toId = (v: any) => {
              if (!v && v !== 0) return '';
              if (typeof v === 'string') return v;
              if (typeof v === 'object') return String(v._id || v.id || v);
              return String(v);
            };

            const deptIds: string[] = [];
            if (Array.isArray(meeting.departments) && meeting.departments.length > 0) {
              meeting.departments.forEach((d: any) => {
                const id = toId(d);
                if (id) deptIds.push(id);
              });
            } else if (meeting.department) {
              const id = toId(meeting.department);
              if (id) deptIds.push(id);
            }

            const attendeesIds: string[] = [];
            if (Array.isArray(meeting.participants) && meeting.participants.length > 0) {
              meeting.participants.forEach((p: any) => {
                const user = p.user || p;
                const id = toId(user);
                if (id) attendeesIds.push(id);
              });
            } else if (Array.isArray(meeting.inviteeUserIds)) {
              meeting.inviteeUserIds.forEach((u: any) => {
                const id = toId(u);
                if (id) attendeesIds.push(id);
              });
            }

            return {
              id: toId(meeting.id || meeting._id),
              title: meeting.title || meeting.name || 'Untitled Meeting',
              description: meeting.description || '',
              type: meeting.type || 'team',
              date: meeting.startTime ? new Date(meeting.startTime) : (meeting.date ? new Date(meeting.date) : new Date()),
              duration: meeting.endTime ? Math.round((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / (1000 * 60)) : (meeting.duration || 60),
              location: meeting.location?.physical?.room ?? meeting.location?.virtual?.meetingUrl ?? (typeof meeting.location === 'string' ? meeting.location : ''),
              meetingLink: meeting.meetingLink,
              organizer: meeting.organizer, // Preserve the full organizer object with role information
              attendees: attendeesIds,
              departments: deptIds,
              status: meeting.status || 'scheduled',
              createdAt: meeting.createdAt ? new Date(meeting.createdAt) : new Date(),
              updatedAt: meeting.updatedAt ? new Date(meeting.updatedAt) : new Date()
            } as Meeting;
          });

          if (mounted) setMeetings(transformed);
        } else {
          if (mounted) setMeetings([]);
        }
      } catch (err) {
        console.error('ManagerMeetingsManagement: failed to fetch meetings', err);
        if (mounted) setMeetings([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchMeetings();
    return () => { mounted = false; };
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Meetings</h1>
            <p className="text-muted-foreground">Meetings organized for your team</p>
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

  // Helper function to get organizer ID from organizer field (can be string or object)
  const getOrganizerId = (organizer: any) => {
    if (!organizer) return '';
    if (typeof organizer === 'string') return organizer;
    if (typeof organizer === 'object') return organizer.id || organizer._id || '';
    return '';
  };

  // Get team meetings (meetings involving manager and team)
  const teamMeetings = meetings.filter(m =>
    getOrganizerId(m.organizer) === currentUser?.id ||
    getOrganizerId(m.organizer) === currentUser?.email ||
    m.attendees?.some(id => teamMembers.find(member => member._id === id || member.id === id) || id === currentUser?.id)
  );

  // Filter meetings based on search and status
  const filteredMeetings = teamMeetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         meeting.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || meeting.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Meeting statistics
  const now = new Date();
  const upcomingMeetings = teamMeetings.filter(m => m.date >= now && m.status === 'scheduled');
  const todayMeetings = teamMeetings.filter(m => {
    const today = new Date();
    return m.date.toDateString() === today.toDateString();
  });
  const thisWeekMeetings = teamMeetings.filter(m => {
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return m.date >= now && m.date <= weekFromNow;
  });
  const completedMeetings = teamMeetings.filter(m => m.status === 'completed');
  const cancelledMeetings = teamMeetings.filter(m => m.status === 'cancelled');

  // CRUD Functions
  const handleScheduleMeeting = () => {
    if (!meetingForm.title || !meetingForm.date || !meetingForm.time) return;

    const newId = `meeting-${Date.now()}`;
    const meetingDateTime = new Date(`${meetingForm.date}T${meetingForm.time}`);
    
    const newMeeting: Meeting = {
      id: newId,
      title: meetingForm.title,
      description: meetingForm.description,
      type: 'user',
      date: meetingDateTime,
      duration: meetingForm.duration,
      location: meetingForm.location,
      meetingLink: meetingForm.meetingLink,
      organizer: currentUser?.id || currentUser?.name || 'Unknown',
      attendees: meetingForm.selectedAttendees,
      departments: [],
      status: meetingForm.status,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setMeetings(prev => [...prev, newMeeting]);
    resetForm();
    setShowScheduleDialog(false);
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    
    // Calculate end time based on duration
    const startTime = new Date(meeting.date);
    const endTime = new Date(startTime.getTime() + meeting.duration * 60000); // duration in minutes
    
    setMeetingForm({
      title: meeting.title,
      description: meeting.description,
      date: meeting.date.toISOString().split('T')[0],
      time: meeting.date.toTimeString().slice(0, 5),
      duration: meeting.duration,
      location: meeting.location,
      meetingLink: meeting.meetingLink || '',
      selectedAttendees: meeting.attendees,
      status: meeting.status
    });
    setShowEditDialog(true);
  };

  const handleUpdateMeeting = () => {
    if (!selectedMeeting) return;

    const meetingDateTime = new Date(`${meetingForm.date}T${meetingForm.time}`);
    
    setMeetings(prev => prev.map(meeting => 
      meeting.id === selectedMeeting.id
        ? {
            ...meeting,
            title: meetingForm.title,
            description: meetingForm.description,
            date: meetingDateTime,
            duration: meetingForm.duration,
            location: meetingForm.location,
            meetingLink: meetingForm.meetingLink,
            attendees: meetingForm.selectedAttendees,
            status: meetingForm.status,
            updatedAt: new Date()
          }
        : meeting
    ));

    resetForm();
    setSelectedMeeting(null);
    setShowEditDialog(false);
  };

  const handleDeleteMeeting = (meetingId: string) => {
    setMeetings(prev => prev.filter(meeting => meeting.id !== meetingId));
  };

  const handleUpdateMeetingStatus = async (meetingId: string, newStatus: MeetingStatus) => {
    try {
      console.log('🔄 Updating meeting status:', { meetingId, newStatus });
      
      // Call backend API to update meeting status
      const response = await meetingService.updateMeetingStatus(meetingId, newStatus);
      
      if (response && response.success) {
        console.log('✅ Meeting status updated successfully');
        
        // Update local state
        setMeetings(prev => prev.map(meeting => 
          meeting.id === meetingId
            ? { ...meeting, status: newStatus, updatedAt: new Date() }
            : meeting
        ));
      } else {
        console.error('❌ Failed to update meeting status:', response);
        // Revert the change if backend update failed
        // The UI will automatically revert since we're not updating local state
      }
    } catch (error) {
      console.error('❌ Error updating meeting status:', error);
      // Revert the change if backend update failed
      // The UI will automatically revert since we're not updating local state
    }
  };

  const resetForm = () => {
    setMeetingForm({
      title: '',
      description: '',
      date: '',
      time: '',
      duration: 60,
      location: '',
      meetingLink: '',
      selectedAttendees: [],
      status: 'scheduled'
    });
  };

  // Helper functions
  const getStatusColor = (status: MeetingStatus) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'in_progress': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: MeetingStatus) => {
    switch (status) {
      case 'scheduled': return <Calendar className="h-3 w-3" />;
      case 'in_progress': return <PlayCircle className="h-3 w-3" />;
      case 'completed': return <CheckCircle2 className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      default: return <Calendar className="h-3 w-3" />;
    }
  };

  const getUserName = (organizer: any) => {
    // Handle empty or invalid organizer
    if (!organizer) {
      return 'No Organizer';
    }
    
    // If organizer is an object with name and role (from backend)
    if (typeof organizer === 'object') {
      // Check for name field first
      if (organizer.name) {
        return organizer.name;
      }
      
      // Check for firstName and lastName
      if (organizer.firstName || organizer.lastName) {
        return `${organizer.firstName || ''} ${organizer.lastName || ''}`.trim();
      }
      
      // Check for email as fallback
      if (organizer.email) {
        return organizer.email;
      }
      
      // If it's an object but no name fields, return unknown
      return 'Unknown Organizer';
    }
    
    // If organizer is a string (legacy data)
    if (typeof organizer === 'string') {
      // If it's an ID, try to find in team members
      if (organizer.match(/^[0-9a-f]{24}$/i)) {
        const teamMember = teamMembers.find(member => 
          member._id === organizer || 
          member.id === organizer
        );
        if (teamMember) {
          return `${teamMember.firstName} ${teamMember.lastName}`;
        }
        
        // Check if it's current user
        if (organizer === currentUser?.id) {
          return currentUser.name || 'Current User';
        }
      }
      
      // If it's already a name, return as is
      return organizer;
    }
    
    // Fallback
    return 'Unknown Organizer';
  };

  const getOrganizerRole = (meeting: any) => {
    console.log('getOrganizerRole called with:', {
      organizer: meeting.organizer,
      type: typeof meeting.organizer,
      organizerRole: (meeting as any).organizerRole,
      teamMembersCount: teamMembers.length,
      currentUserRole: currentUser?.role
    });
    
    // If organizer is an object with role
    if (meeting.organizer && typeof meeting.organizer === 'object' && meeting.organizer.role) {
      console.log('Found role in organizer object:', meeting.organizer.role);
      return meeting.organizer.role;
    }
    
    // Fallback: try to get role from organizerRole field
    if ((meeting as any).organizerRole) {
      console.log('Found role in organizerRole field:', (meeting as any).organizerRole);
      return (meeting as any).organizerRole;
    }
    
    // If organizer is a string, try to find role
    if (typeof meeting.organizer === 'string') {
      console.log('Organizer is string:', meeting.organizer);
      
      // If it's a MongoDB ObjectId, try to find in team members
      if (meeting.organizer.match(/^[0-9a-f]{24}$/i)) {
        console.log('Organizer is MongoDB ObjectId, searching team members...');
        const teamMember = teamMembers.find(member => 
          member._id === meeting.organizer || 
          member.id === meeting.organizer
        );
        if (teamMember && teamMember.role) {
          console.log('Found team member by ID:', teamMember.role);
          return teamMember.role;
        }
        
        // Check if it's current user
        if (meeting.organizer === currentUser?.id && currentUser?.role) {
          console.log('Found current user by ID:', currentUser.role);
          return currentUser.role;
        }
      } else {
        // If it's a name string, try to find in team members by name
        console.log('Organizer is name string, searching team members by name...');
        console.log('Available team members:', teamMembers.map(m => ({ 
          name: m.name, 
          firstName: m.firstName, 
          lastName: m.lastName, 
          role: m.role 
        })));
        
        const teamMember = teamMembers.find(member => {
          const memberName = `${member.firstName} ${member.lastName}`.trim();
          const memberFullName = member.name || member.fullName;
          return memberName === meeting.organizer || 
                 memberFullName === meeting.organizer ||
                 member.firstName === meeting.organizer ||
                 member.lastName === meeting.organizer;
        });
        
        if (teamMember && teamMember.role) {
          console.log('Found team member by name:', teamMember.role);
          return teamMember.role;
        }
        
        // Check if it matches current user name
        if (currentUser && (
          currentUser.name === meeting.organizer ||
          `${currentUser.firstName} ${currentUser.lastName}`.trim() === meeting.organizer
        ) && currentUser.role) {
          console.log('Found current user by name:', currentUser.role);
          return currentUser.role;
        }
      }
    }
    
    console.log('No role found for organizer:', meeting.organizer);
    return null;
  };

  const formatRoleDisplay = (role: string | null) => {
    if (!role) return null;
    
    // Convert role to display format
    switch (role.toLowerCase()) {
      case 'department_head':
        return 'Department Head';
      case 'manager':
        return 'Manager';
      case 'member':
        return 'Member';
      case 'admin':
        return 'Admin';
      case 'super_admin':
        return 'Super Admin';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const isCurrentUserOrganizer = (meeting: any) => {
    if (!currentUser) return false;
    
    // If organizer is an object
    if (meeting.organizer && typeof meeting.organizer === 'object') {
      return meeting.organizer.id === currentUser.id || 
             meeting.organizer._id === currentUser.id ||
             meeting.organizer.email === currentUser.email;
    }
    
    // If organizer is a string (ID or name)
    if (typeof meeting.organizer === 'string') {
      return meeting.organizer === currentUser.id ||
             meeting.organizer === currentUser.email ||
             meeting.organizer === currentUser.name ||
             meeting.organizer === `${currentUser.firstName} ${currentUser.lastName}`.trim();
    }
    
    return false;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isUpcoming = (date: Date) => {
    return date > new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Meetings</h1>
          <p className="text-muted-foreground">
            Manage meetings for your team members
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowScheduleDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Meeting
          </Button>
          <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <Video className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Today's Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{todayMeetings.length}</div>
            <p className="text-xs text-blue-700 dark:text-blue-300">Scheduled for today</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">This Week</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{thisWeekMeetings.length}</div>
            <p className="text-xs text-green-700 dark:text-green-300">Next 7 days</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{completedMeetings.length}</div>
            <p className="text-xs text-purple-700 dark:text-purple-300">Total completed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Total Meetings</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{teamMeetings.length}</div>
            <p className="text-xs text-orange-700 dark:text-orange-300">All team meetings</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Meetings Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Meetings List
          </TabsTrigger>
          <TabsTrigger value="today" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today ({todayMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  All Team Meetings
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search meetings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMeetings.length > 0 ? filteredMeetings.map((meeting) => (
                  <Card key={meeting.id} className={`border-2 transition-all duration-200 hover:shadow-md ${
                    isToday(meeting.date) ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/10' : ''
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            isToday(meeting.date) 
                              ? 'bg-blue-100 dark:bg-blue-900'
                              : 'bg-gray-100 dark:bg-gray-800'
                          }`}>
                            <Video className={`h-6 w-6 ${
                              isToday(meeting.date) ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{meeting.title}</h3>
                              <Badge className={getStatusColor(meeting.status)}>
                                {getStatusIcon(meeting.status)}
                                <span className="ml-1">{meeting.status.replace('_', ' ')}</span>
                              </Badge>
                              {/* Show Organizer badge if current user created this meeting */}
                              {getOrganizerId(meeting.organizer) === currentUser?.id && (
                                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Organizer
                                </Badge>
                              )}
                              {isToday(meeting.date) && (
                                <Badge variant="destructive" className="text-xs">Today</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {meeting.description}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Date & Time:</p>
                                  <p className="text-muted-foreground">
                                    {meeting.date.toLocaleDateString()} at {meeting.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Timer className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Duration:</p>
                                  <p className="text-muted-foreground">{formatDuration(meeting.duration)}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Attendees:</p>
                                  <p className="text-muted-foreground">{meeting.attendees.length} team members</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Organizer:</p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-muted-foreground">{getUserName(meeting.organizer)}</p>
                                    {(() => {
                                      console.log('Organizer Debug:', {
                                        organizer: meeting.organizer,
                                        type: typeof meeting.organizer,
                                        hasRole: meeting.organizer?.role,
                                        role: meeting.organizer?.role,
                                        organizerRole: (meeting as any).organizerRole,
                                        meetingId: meeting.id
                                      });
                                      return null;
                                    })()}
                                    {(() => {
                                      const role = getOrganizerRole(meeting);
                                      if (role) {
                                        return (
                                          <Badge variant="outline" className="text-xs">
                                            {formatRoleDisplay(role)}
                                          </Badge>
                                        );
                                      }
                                      return null;
                                    })()}
                                    {isCurrentUserOrganizer(meeting) && (
                                      <Badge variant="default" className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
                                        <Crown className="w-3 h-3 mr-1" />
                                        Organizer
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {meeting.location && (
                              <div className="flex items-center gap-2 mt-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{meeting.location}</span>
                              </div>
                            )}

                            {(meeting.meetingLink && (
                              // Show link if current user is the organizer (created the meeting)
                              isCurrentUserOrganizer(meeting) ||
                              // OR if current user is invited to the meeting
                              (meeting.attendees?.includes(currentUser?.id) || meeting.attendees?.includes(currentUser?.name))
                            )) && (
                              <div className="flex items-center gap-2 mt-2">
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" 
                                   className="text-sm text-blue-600 hover:underline">
                                  Join Meeting Link
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {/* Show controls only for organizer */}
                          {isCurrentUserOrganizer(meeting) && (
                            <>
                              <Select
                                value={meeting.status}
                                onValueChange={(value) => handleUpdateMeetingStatus(meeting.id, value as MeetingStatus)}
                              >
                                <SelectTrigger className="w-28 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="scheduled">Scheduled</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditMeeting(meeting)}
                                title="Edit Meeting"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteMeeting(meeting.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete Meeting"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="text-center py-12">
                    <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No meetings found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'Try adjusting your search filters'
                        : 'No meetings scheduled for your team'}
                    </p>
                    <Button onClick={() => setShowScheduleDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Schedule First Meeting
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Meetings ({todayMeetings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayMeetings.length > 0 ? (
                <div className="space-y-4">
                  {todayMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <Video className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-blue-900 dark:text-blue-100">{meeting.title}</h3>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {meeting.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {formatDuration(meeting.duration)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {meeting.location && (
                              <Badge variant="outline" className="text-xs">
                                <MapPin className="w-3 h-3 mr-1" />
                                {meeting.location}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {meeting.attendees.length} attendees
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Crown className="w-3 h-3 mr-1" />
                              {getUserName(meeting.organizer)}
                              {(() => {
                                const role = getOrganizerRole(meeting);
                                return role ? ` (${formatRoleDisplay(role)})` : '';
                              })()}
                            </Badge>
                            {isCurrentUserOrganizer(meeting) && (
                              <Badge variant="default" className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
                                <Crown className="w-3 h-3 mr-1" />
                                Organizer
                              </Badge>
                            )}
                            <Badge className={getStatusColor(meeting.status)}>
                              {getStatusIcon(meeting.status)}
                              <span className="ml-1">{meeting.status}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(meeting.meetingLink && (
                          // Show link if current user is the organizer (created the meeting)
                          isCurrentUserOrganizer(meeting) ||
                          // OR if current user is invited to the meeting
                          (meeting.attendees?.includes(currentUser?.id) || meeting.attendees?.includes(currentUser?.name))
                        )) && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Join
                            </a>
                          </Button>
                        )}
                        {/* Show controls only for organizer */}
                        {isCurrentUserOrganizer(meeting) && (
                          <>
                            <Select
                              value={meeting.status}
                              onValueChange={(value) => handleUpdateMeetingStatus(meeting.id, value as MeetingStatus)}
                            >
                              <SelectTrigger className="w-28 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button variant="outline" size="sm" onClick={() => handleEditMeeting(meeting)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMeeting(meeting.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete Meeting"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No meetings today</h3>
                  <p className="text-muted-foreground mb-4">
                    No meetings scheduled for today
                  </p>
                  <Button onClick={() => setShowScheduleDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Meeting for Today
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Meeting Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Meetings</span>
                    <Badge variant="outline">{teamMeetings.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completed</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {completedMeetings.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Upcoming</span>
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      {upcomingMeetings.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cancelled</span>
                    <Badge variant="default" className="bg-red-100 text-red-800">
                      {cancelledMeetings.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Duration</span>
                    <Badge variant="outline">
                      {teamMeetings.length > 0 
                        ? formatDuration(Math.round(teamMeetings.reduce((acc, m) => acc + m.duration, 0) / teamMeetings.length))
                        : '0m'
                      }
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Participation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Team Members</span>
                    <Badge variant="outline">{teamMembers.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Meeting Organizer</span>
                    <Badge variant="default" className="bg-purple-100 text-purple-800">
                      {currentUser?.name || 'Manager'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Attendees</span>
                    <Badge variant="outline">
                      {teamMeetings.length > 0 
                        ? Math.round(teamMeetings.reduce((acc, m) => acc + m.attendees.length, 0) / teamMeetings.length)
                        : 0
                      }
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <CreateMeetingDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        onCreated={(m) => {
          const created = m.data || m.meeting || m;
          const id = created.id || created._id;
          setMeetings(prev => [...prev, { ...(created), id } as any]);
        }}
      />

      <CreateMeetingDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        meetingToEdit={selectedMeeting}
        onUpdated={(updated) => {
          const u = updated.data || updated.meeting || updated;
          const id = u.id || u._id;
          setMeetings(prev => prev.map(meet => (meet.id === id ? (u as any) : meet)));
          setSelectedMeeting(null);
        }}
      />
    </div>
  );
}