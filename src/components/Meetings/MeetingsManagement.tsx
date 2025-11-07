
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Calendar, Clock, Users, MapPin, Video, BarChart3, CalendarDays, List, PieChart } from 'lucide-react';
import { Meeting } from '@/types/meetings';
import { mockUsers, mockDepartments } from '@/data/mockData';
import { meetingService } from '@/services/meetingService';
import { useAuth } from '@/components/Auth/AuthProvider';
import MeetingsList from './MeetingsList';
import MeetingsCalendar from './MeetingsCalendar';
import MeetingStats from './MeetingStats';
import { CreateMeetingDialog } from './index';

export default function MeetingsManagement() {
  const { currentUser } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [meetingToEdit, setMeetingToEdit] = useState<any | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Beautiful Loading Component (same as analytics)
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin border-t-red-600"></div>
        {/* Inner ring */}
        <div className="absolute top-2 left-2 w-12 h-12 border-4 border-slate-100 dark:border-slate-600 rounded-full animate-spin border-t-red-400" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        {/* Center dot */}
        <div className="absolute top-6 left-6 w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Loading Meetings</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">Fetching your meeting data...</p>
        <div className="flex justify-center space-x-1 mt-4">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );

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
        console.log('Attempting to fetch meetings...');
        console.log('Current user:', currentUser);
        console.log('API Base URL:', 'http://localhost:5000/api/meetings');
        
        // Test direct API call first
        try {
          const testResponse = await fetch('http://localhost:5000/api/meetings', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          console.log('Direct API test - Status:', testResponse.status);
          console.log('Direct API test - OK:', testResponse.ok);
          if (!testResponse.ok) {
            const errorText = await testResponse.text();
            console.log('Direct API test - Error:', errorText);
          }
        } catch (directError) {
          console.error('Direct API test failed:', directError);
        }
        
        const response = await meetingService.getMeetings();
        console.log('Fetched meetings response:', response);
        console.log('Response success:', response?.success);
        console.log('Response data:', response?.data);
        
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
          console.warn('Invalid response format:', response);
          setMeetings([]);
        }
      } catch (error) {
        console.error('Failed to fetch meetings:', error);
        console.error('Error details:', error);
        setMeetings([]);
        // Show error to user (remove alert for now)
        console.error('Meeting fetch failed - check backend server and authentication');
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [currentUser]);

  if (loading) {
    return <LoadingSpinner />;
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
      console.error('Failed to refresh meetings:', error);
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
    <div className="space-y-4 sm:space-y-6">
      {/* Meeting Management Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent rounded-xl"></div>
        <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">Meeting Management</h1>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">Manage and schedule meetings for your team</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowMeetingDialog(true)}
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 text-xs sm:text-sm px-3 sm:px-4 py-2"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Schedule Meeting</span>
              <span className="sm:hidden">Schedule</span>
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <TabsTrigger value="list" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400">Meetings List</TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400">Calendar View</TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 sm:space-y-6">
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <List className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-base sm:text-lg">All Meetings</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                    <Input
                      placeholder="Search meetings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 sm:pl-10 w-full sm:w-64 border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400 text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <div className="text-center">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin border-t-red-600 mx-auto mb-3 sm:mb-4"></div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Loading meetings...</div>
                  </div>
                </div>
              ) : filteredMeetings.length === 0 ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {meetings.length === 0 ? 'No meetings found' : 'No meetings match your search'}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                      {meetings.length === 0 ? 'Start by scheduling your first meeting' : 'Try adjusting your search criteria'}
                    </p>
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

        <TabsContent value="calendar" className="space-y-3 sm:space-y-4">
          <MeetingsCalendar meetings={meetings} />
        </TabsContent>

        <TabsContent value="stats" className="space-y-3 sm:space-y-4">
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
          console.log('New meeting created:', meeting);
          refreshMeetings();
        }}
        meetingToEdit={meetingToEdit}
        onUpdated={(meeting) => {
          console.log('Meeting updated:', meeting);
          refreshMeetings();
          setMeetingToEdit(undefined);
        }}
      />
    </div>
  );
}
