import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Calendar, Clock, Users, MapPin, Video, BarChart3 } from 'lucide-react';
import { Meeting } from '@/types/meetings';
import { mockUsers, mockDepartments } from '@/data/mockData';
import { meetingService } from '@/services/meetingService';
import { useAuth } from '@/components/Auth/AuthProvider';
import MeetingsList from './MeetingsList';
import MeetingsCalendar from './MeetingsCalendar';
import MeetingStats from './MeetingStats';
import { CreateMeetingDialog } from './index';

export default function HRMeetingsManagement() {
  const { currentUser } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [meetingToEdit, setMeetingToEdit] = useState<any | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Fetch meetings from API
  useEffect(() => {
    const fetchMeetings = async () => {
      if (!currentUser) {
        console.log('No current user, skipping fetch');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('HR Meetings: Attempting to fetch meetings...');
        console.log('HR Meetings: Current user:', currentUser);
        console.log('HR Meetings: API Base URL:', 'http://localhost:5000/api/meetings');
        
        // Test direct API call first
        try {
          const testResponse = await fetch('http://localhost:5000/api/meetings', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          console.log('HR Meetings: Direct API test - Status:', testResponse.status);
          console.log('HR Meetings: Direct API test - OK:', testResponse.ok);
          if (!testResponse.ok) {
            const errorText = await testResponse.text();
            console.log('HR Meetings: Direct API test - Error:', errorText);
          }
        } catch (directError) {
          console.error('HR Meetings: Direct API test failed:', directError);
        }
        
        const response = await meetingService.getMeetings();
        console.log('HR Meetings: Fetched meetings response:', response);
        console.log('HR Meetings: Response success:', response?.success);
        console.log('HR Meetings: Response data:', response?.data);
        
        if (response && response.success && (response.data || (response as any).meetings)) {
          // Support both paginated (`data`) and legacy (`meetings`) response shapes
          const meetingsArray = response.data ?? (response as any).meetings;
          // Transform backend response to match frontend interface
          const transformedMeetings = meetingsArray.map((meeting: any) => ({
            id: meeting.id || meeting._id,
            title: meeting.title || 'Untitled Meeting',
            description: meeting.description || '',
            type: 'department' as const, // Default type
            date: new Date(meeting.startTime),
            duration: meeting.endTime ? 
              Math.round((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / (1000 * 60)) : 60,
            location: meeting.location || '',
            meetingLink: meeting.meetingLink,
            organizer: meeting.organizer?.firstName + ' ' + meeting.organizer?.lastName || 'Unknown',
            // Prefer participants.user objects (full user data) then fallback to inviteeUserIds
            attendees: meeting.participants?.map((p: any) => p.user) || meeting.inviteeUserIds?.map((user: any) => user) || [],
            // Preserve populated department objects when available, otherwise fallback to ids
            departments: Array.isArray(meeting.departments) && meeting.departments.length > 0
              ? meeting.departments
              : meeting.department ? [meeting.department] : [],
            status: meeting.status || 'scheduled',
            createdAt: new Date(meeting.createdAt || Date.now()),
            updatedAt: new Date(meeting.updatedAt || Date.now())
          }));
          
          setMeetings(transformedMeetings);
        } else {
          console.warn('HR Meetings: Invalid response format:', response);
          setMeetings([]);
        }
      } catch (error) {
        console.error('HR Meetings: Failed to fetch meetings:', error);
        console.error('HR Meetings: Error details:', error);
        setMeetings([]);
        // Show error to user (remove alert for now)
        console.error('HR Meetings: Meeting fetch failed - check backend server and authentication');
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">HR Meeting Management</h1>
            <p className="text-muted-foreground">Manage and schedule meetings for your company</p>
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

  const filteredMeetings = meetings.filter(meeting => {
    if (!meeting) return false;
    
    const title = meeting.title || '';
    const description = meeting.description || '';
    const query = searchQuery.toLowerCase();
    
    return title.toLowerCase().includes(query) || 
           description.toLowerCase().includes(query);
  });

  const refreshMeetings = async () => {
    try {
      const response = await meetingService.getMeetings();
      if (response && response.success && (response.data || (response as any).meetings)) {
        const meetingsArray = response.data ?? (response as any).meetings;
        const transformedMeetings = meetingsArray.map((meeting: any) => ({
          id: meeting.id || meeting._id,
          title: meeting.title || 'Untitled Meeting',
          description: meeting.description || '',
          type: 'department' as const,
          date: new Date(meeting.startTime),
          duration: meeting.endTime ? 
            Math.round((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / (1000 * 60)) : 60,
          location: meeting.location || '',
          meetingLink: meeting.meetingLink,
          organizer: meeting.organizer?.firstName + ' ' + meeting.organizer?.lastName || 'Unknown',
          // Prefer participants.user objects (full user data) then fallback to inviteeUserIds
          attendees: meeting.participants?.map((p: any) => p.user) || meeting.inviteeUserIds?.map((user: any) => user) || [],
          // Preserve populated department objects when available, otherwise fallback to ids
          departments: Array.isArray(meeting.departments) && meeting.departments.length > 0
            ? meeting.departments
            : meeting.department ? [meeting.department] : [],
          status: meeting.status || 'scheduled',
          createdAt: new Date(meeting.createdAt || Date.now()),
          updatedAt: new Date(meeting.updatedAt || Date.now())
        }));
        setMeetings(transformedMeetings);
      }
    } catch (error) {
      console.error('HR Meetings: Failed to refresh meetings:', error);
    }
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

  const getUserName = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getDepartmentNames = (deptIds?: string[]) => {
    if (!deptIds) return 'N/A';
    return deptIds.map(id => {
      const dept = mockDepartments.find(d => d.id === id);
      return dept ? dept.name : 'Unknown';
    }).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">HR Meetings Management</h1>
        <Button onClick={() => setShowMeetingDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Meetings List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Meetings</CardTitle>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search meetings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">Loading meetings...</div>
                </div>
              ) : filteredMeetings.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">
                    {meetings.length === 0 ? 'No meetings found' : 'No meetings match your search'}
                  </div>
                </div>
              ) : (
                <MeetingsList meetings={filteredMeetings} onStatusChange={refreshMeetings} onEdit={(m) => {
                  // Open create/edit modal with meeting prefilled
                  setMeetingToEdit(m);
                  setShowMeetingDialog(true);
                }} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <MeetingsCalendar meetings={meetings} />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <MeetingStats meetings={meetings} />
        </TabsContent>
      </Tabs>

      <CreateMeetingDialog
        open={showMeetingDialog}
        onOpenChange={(open) => {
          setShowMeetingDialog(open);
          if (!open) setMeetingToEdit(undefined);
        }}
        onCreated={(meeting) => {
          console.log('HR Meetings: New meeting created:', meeting);
          refreshMeetings();
        }}
        meetingToEdit={meetingToEdit}
        onUpdated={(meeting) => {
          console.log('HR Meetings: Meeting updated:', meeting);
          refreshMeetings();
          setMeetingToEdit(undefined);
        }}
      />
    </div>
  );
}


