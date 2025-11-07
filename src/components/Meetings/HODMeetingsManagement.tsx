import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { meetingService } from '@/services/meetingService';
import { toast } from 'sonner';
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
  Target,
  User,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { hodService } from '@/services/api/hodService';
import { mockMeetings } from '@/data/meetingsData';
import { mockUsers, mockDepartments } from '@/data/mockData';
import { Meeting, MeetingStatus } from '@/types/meetings';

export default function HODMeetingsManagement() {
  const { currentUser } = useAuth();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingMeetingId, setUpdatingMeetingId] = useState<string | null>(null);
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);

  // Form state for scheduling meetings
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    duration: 60,
    meetingLink: '',
    selectedAttendees: [] as string[],
    status: 'scheduled' as MeetingStatus
  });

  // State management for meetings (following ManagerMeetingsManagement pattern)
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState<boolean>(true);

  // Fetch meetings from backend API (following ManagerMeetingsManagement pattern)
  useEffect(() => {
    let mounted = true;
    const fetchMeetings = async () => {
      try {
        console.log('HOD Meetings: Fetching meetings from backend');
        console.log('HOD Meetings: Current user info:', {
          id: currentUser?.id,
          role: currentUser?.role,
          departmentId: currentUser?.departmentId
        });

        setIsLoadingMeetings(true);
        const response = await meetingService.getMeetings();

        console.log('HOD Meetings: Raw response from meetingService:', response);
        console.log('HOD Meetings: Response success:', response?.success);
        console.log('HOD Meetings: Response has data:', !!response?.data);

        if (response && response.success && (response.data || (response as any).meetings)) {
          const meetingsArray = response.data ?? (response as any).meetings;
          console.log('HOD Meetings: Meetings array received:', Array.isArray(meetingsArray), 'Length:', meetingsArray?.length || 0);

          const transformed = meetingsArray.map((meeting: any) => {
            // Helper function to extract ID from various formats
            const toId = (v: any) => {
              if (!v && v !== 0) return '';
              if (typeof v === 'string') return v;
              if (typeof v === 'object') return String(v._id || v.id || v);
              return String(v);
            };

            // Extract department IDs
            const deptIds: string[] = [];
            if (Array.isArray(meeting.departments) && meeting.departments.length > 0) {
              meeting.departments.forEach((d: any) => {
                const id = toId(d);
                if (id) deptIds.push(id);
              });
            } else if (meeting.department) {
              const id = toId(meeting.department);
              if (id) deptIds.push(id);
            } else if (meeting.departmentId) {
              deptIds.push(String(meeting.departmentId));
            }

            // Extract attendee IDs
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

            // Transform meeting data
            let organizerInfo: any = '';
            if (meeting.organizer) {
              if (typeof meeting.organizer === 'object' && meeting.organizer !== null) {
                // If organizer is an object, preserve it for name extraction
                organizerInfo = meeting.organizer;
              } else {
                // If it's a string, use it as ID
                organizerInfo = toId(meeting.organizer);
              }
            }

            return {
              id: toId(meeting.id || meeting._id),
              title: meeting.title || meeting.name || 'Untitled Meeting',
              description: meeting.description || '',
              type: meeting.type || 'department',
              date: meeting.startTime ? new Date(meeting.startTime) : (meeting.date ? new Date(meeting.date) : new Date()),
              duration: meeting.endTime ? Math.round((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / (1000 * 60)) : (meeting.duration || 60),
              location: meeting.location?.physical?.room ?? meeting.location?.virtual?.meetingUrl ?? (typeof meeting.location === 'string' ? meeting.location : ''),
              meetingLink: meeting.meetingLink,
              organizer: organizerInfo,
              attendees: attendeesIds,
              departments: deptIds,
              status: meeting.status || 'scheduled',
              createdAt: meeting.createdAt ? new Date(meeting.createdAt) : new Date(),
              updatedAt: meeting.updatedAt ? new Date(meeting.updatedAt) : new Date()
            } as Meeting;
          });

          console.log('HOD Meetings: Successfully transformed', transformed.length, 'meetings');
          console.log('HOD Meetings: Sample transformed meeting:', transformed[0] || 'No meetings');

          if (mounted) setMeetings(transformed);
        } else {
          console.warn('HOD Meetings: API call failed or returned no data');
          if (mounted) setMeetings([]);
        }
      } catch (error) {
        console.error('HOD Meetings: Error fetching meetings:', error);
        console.error('HOD Meetings: Error details:', {
          message: error?.message,
          stack: error?.stack
        });
        if (mounted) setMeetings([]);
      } finally {
        if (mounted) setIsLoadingMeetings(false);
      }
    };

    if (currentUser?.id) {
      fetchMeetings();
    }

    return () => { mounted = false; };
  }, [currentUser]);

  // Refetch function for manual refresh
  const refetch = async () => {
    if (!currentUser?.id) return;

    try {
      console.log('HOD Meetings: Manual refetch triggered');
      setIsLoadingMeetings(true);
      const response = await meetingService.getMeetings();

      if (response && response.success && (response.data || (response as any).meetings)) {
        const meetingsArray = response.data ?? (response as any).meetings;
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
          } else if (meeting.departmentId) {
            deptIds.push(String(meeting.departmentId));
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
            type: meeting.type || 'department',
            date: meeting.startTime ? new Date(meeting.startTime) : (meeting.date ? new Date(meeting.date) : new Date()),
            duration: meeting.endTime ? Math.round((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / (1000 * 60)) : (meeting.duration || 60),
            location: meeting.location?.physical?.room ?? meeting.location?.virtual?.meetingUrl ?? (typeof meeting.location === 'string' ? meeting.location : ''),
            meetingLink: meeting.meetingLink,
            organizer: toId(meeting.organizer?._id || meeting.organizer?.id || meeting.organizer || ''),
            attendees: attendeesIds,
            departments: deptIds,
            status: meeting.status || 'scheduled',
            createdAt: meeting.createdAt ? new Date(meeting.createdAt) : new Date(),
            updatedAt: meeting.updatedAt ? new Date(meeting.updatedAt) : new Date()
          } as Meeting;
        });

        setMeetings(transformed);
        console.log('HOD Meetings: Refetch completed, meetings updated');
      }
    } catch (error) {
      console.error('HOD Meetings: Refetch error:', error);
    } finally {
      setIsLoadingMeetings(false);
    }
  };

  // Fetch department members using API (similar to admin panel approach)
  const { data: departmentMembersData, isLoading: isLoadingMembers, error: membersError } = useQuery({
    queryKey: ['hod-meetings', 'department-members', currentUser?.departmentId],
    queryFn: async () => {
      try {
        const departmentId = currentUser?.departmentId;

        if (!departmentId) {
          console.log('HOD Meetings: No department ID available');
          return [];
        }

        console.log('HOD Meetings: Fetching department members for department:', departmentId);
        const res: any = await hodService.getDepartmentUsers(departmentId);
        console.log('HOD Meetings: Department members response:', res);

        if (res?.success && res?.data) {
          console.log('HOD Meetings: API returned data:', res.data.length, 'users');
          return res.data;
        } else {
          console.warn('HOD Meetings: API call failed, using mock data');
          console.log('HOD Meetings: Current user department ID:', currentUser?.departmentId);
          
          // Fallback to mock data
          const userDepartment = currentUser?.departmentId ?
            mockDepartments.find(d => String(d.id) === String(currentUser.departmentId)) : null;

          console.log('HOD Meetings: FALLBACK DEBUG:', {
            currentUserDepartmentId: currentUser?.departmentId,
            foundDepartment: userDepartment,
            allDepartments: mockDepartments.map(d => ({ id: d.id, name: d.name, memberIds: d.memberIds })),
            allUsers: mockUsers.map(u => ({ id: u.id, name: u.name, departmentId: u.departmentId }))
          });

          let mockData = [];
          if (userDepartment?.memberIds) {
            mockData = mockUsers.filter(u => userDepartment.memberIds.includes(u.id));
            console.log('HOD Meetings: Filtered by memberIds:', mockData.length, 'users');
          } else {
            // If no department found, try to get users by departmentId directly
            mockData = mockUsers.filter(u => String(u.departmentId) === String(departmentId));
            console.log('HOD Meetings: Filtered by departmentId:', mockData.length, 'users');
          }

          console.log('HOD Meetings: Final mock data users:', mockData.map(u => ({ id: u.id, name: u.name, role: u.role, departmentId: u.departmentId })));
          
          return mockData;
        }
      } catch (e) {
        console.error('HOD Meetings: Department members error:', e);
        // Fallback to mock data on error
        console.log('HOD Meetings: ERROR FALLBACK DEBUG:', {
          currentUserDepartmentId: currentUser?.departmentId,
          allDepartments: mockDepartments.map(d => ({ id: d.id, name: d.name, memberIds: d.memberIds })),
          allUsersSample: mockUsers.slice(0, 5).map(u => ({ id: u.id, name: u.name, departmentId: u.departmentId }))
        });

        const userDepartment = currentUser?.departmentId ?
          mockDepartments.find(d => String(d.id) === String(currentUser.departmentId)) : null;

        console.log('HOD Meetings: Error fallback - Found user department:', userDepartment);
        
        let mockData = [];
        if (userDepartment?.memberIds) {
          mockData = mockUsers.filter(u => userDepartment.memberIds.includes(u.id));
        } else {
          // If no department found, try to get users by departmentId directly
          mockData = mockUsers.filter(u => String(u.departmentId) === String(currentUser?.departmentId));
        }
        
        console.log('HOD Meetings: Error fallback - Mock data:', mockData.length, 'users');
        console.log('HOD Meetings: Error fallback - Mock users:', mockData.map(u => ({ id: u.id, name: u.name, role: u.role })));
        
        return mockData;
      }
    },
    enabled: !!currentUser?.departmentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true
  });

  // Fetch department details using API
  const { data: departmentDetailsData, isLoading: isLoadingDepartmentDetails } = useQuery({
    queryKey: ['hod-department-details', currentUser?.departmentId],
    queryFn: async () => {
      try {
        if (!currentUser?.departmentId) {
          console.log('HOD Meetings - No departmentId available');
          return null;
        }

        console.log('HOD Meetings - Fetching department details for:', currentUser.departmentId);
        const res: any = await hodService.getDepartmentDetails(currentUser.departmentId);
        console.log('HOD Meetings - Department details response:', res);

        if (res?.success && res?.data) {
          return res.data;
        } else {
          console.warn('HOD Meetings - Department details API failed');
          return null;
        }
      } catch (e) {
        console.error('HOD Meetings - Department details error:', e);
        return null;
      }
    },
    enabled: !!currentUser?.departmentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Show loading state while fetching meetings and members
  const isLoading = isLoadingMeetings || isLoadingMembers;

  // Find user's department - try multiple approaches
  let userDepartment = null;

  // First try to get from API response
  if (departmentDetailsData) {
    userDepartment = departmentDetailsData;
    console.log('HOD Meetings - Using department from API:', departmentDetailsData.name);
  }

  // Fallback to mock departments
  if (!userDepartment && currentUser?.departmentId) {
    userDepartment = mockDepartments.find(d => String(d.id) === String(currentUser.departmentId));
    console.log('HOD Meetings - Department lookup from mock data:', {
      userDepartmentId: currentUser.departmentId,
      foundDepartment: userDepartment ? userDepartment.name : 'Not found'
    });
  }

  // Get department meetings (HOD can see all department meetings)
  const departmentToUse = userDepartment || {
    id: currentUser?.departmentId || 'default-dept',
    name: currentUser?.departmentId ? `Department ${currentUser.departmentId}` : 'Your Department',
    memberIds: [],
    color: '#3B82F6'
  };

  // Use API data or fallback to mock data
  const departmentMembers = departmentMembersData || [];
  console.log("agamon",departmentMembers)

  console.log('HOD Meetings - DEBUG INFO:', {
    currentUser: {
      id: currentUser?.id,
      departmentId: currentUser?.departmentId,
      role: currentUser?.role,
      name: currentUser?.name
    },
    departmentMembersData: departmentMembersData,
    departmentMembersCount: departmentMembers.length,
    isLoadingMembers,
    membersError,
    departmentMembersDataCount: departmentMembersData?.length || 0,
    departmentId: currentUser?.departmentId,
    departmentToUse: departmentToUse.name
  });

  // Debug: Log all meetings received from API
  console.log('HOD Meetings: All meetings from API:', meetings.map(m => ({
    id: m.id,
    title: m.title,
    organizer: m.organizer,
    status: m.status,
    departments: m.departments
  })));

  // Backend already filters meetings for HOD (organized by HOD + invited to HOD + department meetings)
  // Only apply frontend filtering for search and status
  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         meeting.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || meeting.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  console.log('HOD Meetings: All meetings from backend:', meetings.length);
  console.log('HOD Meetings: Filtered meetings for display:', filteredMeetings.length);
  console.log('HOD Meetings: Search query:', searchQuery, 'Status filter:', statusFilter);

  // Debug: Show basic meeting info
  if (filteredMeetings.length > 0) {
    console.log('HOD Meetings: Showing', filteredMeetings.length, 'meetings to user');
  }

  // Debug: Show sample of actual meetings being displayed
  if (filteredMeetings.length > 0) {
    console.log('HOD Meetings: Sample displayed meetings:', filteredMeetings.slice(0, 3).map(m => ({
      id: m.id,
      title: m.title,
      organizer: m.organizer,
      status: m.status,
      attendees: m.attendees?.length || 0
    })));
  } else {
    console.log('HOD Meetings: No meetings to display after filtering');
  }

  // For statistics, use the filtered meetings
  const departmentMeetings = filteredMeetings;

  // Meeting statistics
  const now = new Date();
  const upcomingMeetings = departmentMeetings.filter(m => m.date >= now && m.status === 'scheduled');
  const todayMeetings = departmentMeetings.filter(m => {
    const today = new Date();
    return m.date.toDateString() === today.toDateString();
  });
  const thisWeekMeetings = departmentMeetings.filter(m => {
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return m.date >= now && m.date <= weekFromNow;
  });
  const completedMeetings = departmentMeetings.filter(m => m.status === 'completed');
  const cancelledMeetings = departmentMeetings.filter(m => m.status === 'cancelled');

  // Validation function - matching admin panel
  const validate = () => {
    const e: Record<string, string> = {};
    if (!meetingForm.title.trim()) e.title = 'Title is required';
    if (!meetingForm.date || !meetingForm.time) e.startTime = 'Start time is required';
    if (meetingForm.selectedAttendees.length === 0) e.invitees = 'Select at least one team member';
    if ((meetingForm.status === 'in_progress' || meetingForm.status === 'completed') && !meetingForm.meetingLink) {
      e.meetingLink = 'Meeting link is required for virtual/hybrid meetings';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // CRUD Functions
  const handleScheduleMeeting = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Validate required data before creating/updating meeting
      if (!meetingForm.date || !meetingForm.time) {
        throw new Error('Date and time are required');
      }

      if (!currentUser) {
        throw new Error('User information is required');
      }

      // Use userDepartment or create fallback
      const departmentToUse = userDepartment || {
        id: currentUser?.departmentId || 'default-dept',
        name: currentUser?.departmentId ? `Department ${currentUser.departmentId}` : 'Your Department',
        memberIds: [],
        color: '#3B82F6'
      };

      // Prepare meeting data for backend API (similar to admin panel)
    const meetingDateTime = new Date(`${meetingForm.date}T${meetingForm.time}`);
      const endDateTime = meetingForm.endTime ?
        new Date(meetingForm.endTime) :
        new Date(meetingDateTime.getTime() + (meetingForm.duration * 60000));

      if (isNaN(meetingDateTime.getTime())) {
        throw new Error('Invalid date and time format');
      }

      // Prepare payload for backend API (matching admin panel format)
      const payload = {
      title: meetingForm.title,
        description: meetingForm.description || '',
        startTime: meetingDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        meetingLink: meetingForm.meetingLink || undefined,
        type: 'physical' as const, // HOD meetings are department meetings
        priority: 'medium' as const, // Default priority
        departmentId: departmentToUse.id,
        inviteeUserIds: meetingForm.selectedAttendees.length > 0 ? meetingForm.selectedAttendees : undefined
      };

      let res;
      if (selectedMeeting) {
        // Update existing meeting
        console.log('HOD Meeting Update - Payload:', payload);
        console.log('HOD Meeting Update - Selected meeting ID:', selectedMeeting.id);
        res = await meetingService.updateMeeting(selectedMeeting.id, payload);
      } else {
        // Create new meeting
      console.log('HOD Meeting Creation - Payload:', payload);
      console.log('HOD Meeting Creation - Selected attendees:', meetingForm.selectedAttendees);
        res = await meetingService.createMeeting(payload);
      }

      if (res && res.success) {
        console.log(selectedMeeting ? 'HOD Meeting Update - Success:' : 'HOD Meeting Creation - Success:', res);

        // Refresh meetings list to show the new/updated meeting
        await refetch();

        // Show success message
        toast.success(selectedMeeting ? 'Meeting has been updated successfully' : 'Meeting has been scheduled successfully');

        // Reset form and close dialog
    resetForm();
    setSelectedMeeting(null);
    setShowScheduleDialog(false);

      } else {
        console.error(selectedMeeting ? 'HOD Meeting Update - API response:' : 'HOD Meeting Creation - API response:', res);
        throw new Error(selectedMeeting ? 'Failed to update meeting' : 'Failed to create meeting');
      }

    } catch (error) {
      console.error('Error scheduling/updating meeting:', error);
      toast.error(error instanceof Error ? error.message : `Failed to ${selectedMeeting ? 'update' : 'schedule'} meeting. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    
    // Calculate end time from start time and duration
    const startTime = new Date(meeting.date);
    const endTime = new Date(startTime.getTime() + (meeting.duration * 60000));
    
    // Process attendees to ensure they are in the correct format
    let processedAttendees: string[] = [];
    if (Array.isArray(meeting.attendees)) {
      processedAttendees = meeting.attendees.map((attendee: any) => {
        // Handle different attendee formats
        if (typeof attendee === 'string') {
          return attendee;
        } else if (typeof attendee === 'object' && attendee !== null) {
          return attendee.id || attendee._id || attendee.email || attendee.name || String(attendee);
        }
        return String(attendee);
      }).filter((attendee: string) => attendee && attendee.trim() !== '');
    }
    
    console.log('HOD Meeting Edit - Processing attendees:', {
      originalAttendees: meeting.attendees,
      processedAttendees: processedAttendees,
      meetingId: meeting.id,
      meetingTitle: meeting.title
    });
    
    // Format endTime for datetime-local input (YYYY-MM-DDTHH:MM)
    const endTimeFormatted = endTime.toISOString().slice(0, 16);
    
    console.log('HOD Meeting Edit - Time calculations:', {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      endTimeFormatted: endTimeFormatted,
      duration: meeting.duration,
      date: meeting.date.toISOString().split('T')[0],
      time: meeting.date.toTimeString().slice(0, 5)
    });
    
    setMeetingForm({
      title: meeting.title,
      description: meeting.description,
      date: meeting.date.toISOString().split('T')[0],
      time: meeting.date.toTimeString().slice(0, 5),
      endTime: endTimeFormatted, // Properly formatted for datetime-local input
      duration: meeting.duration,
      meetingLink: meeting.meetingLink || '',
      selectedAttendees: processedAttendees,
      status: meeting.status
    });
    setShowScheduleDialog(true);
  };


  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      setDeletingMeetingId(meetingId);
      console.log('HOD Meeting Delete - Meeting ID:', meetingId);

      // Use the actual backend API for deleting (same as admin panel)
      const res = await meetingService.deleteMeeting(meetingId);

      if (res && res.success) {
        console.log('HOD Meeting Delete - Success:', res);

        // Refresh meetings list to reflect the deletion
        await refetch();

        // Show success message
        toast.success('Meeting has been deleted successfully');

      } else {
        console.error('HOD Meeting Delete - API response:', res);
        throw new Error('Failed to delete meeting');
      }

    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete meeting. Please try again.');
    } finally {
      setDeletingMeetingId(null);
    }
  };

  const handleUpdateMeetingStatus = async (meetingId: string, newStatus: MeetingStatus) => {
    try {
      setUpdatingMeetingId(meetingId);
      console.log('HOD Meeting Status Update - Meeting ID:', meetingId, 'New Status:', newStatus);

      // Use the actual backend API for status updates (same as admin panel)
      const res = await meetingService.updateMeetingStatus(meetingId, newStatus);

      if (res && res.success) {
        console.log('HOD Meeting Status Update - Success:', res);

        // Refresh meetings list to show the updated status
        await refetch();

        // Show success message
        toast.success(`Meeting status has been updated to ${newStatus}`);

      } else {
        console.error('HOD Meeting Status Update - API response:', res);
        throw new Error('Failed to update meeting status');
      }

    } catch (error) {
      console.error('Error updating meeting status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update meeting status. Please try again.');
    } finally {
      setUpdatingMeetingId(null);
    }
  };

  const resetForm = () => {
    setMeetingForm({
      title: '',
      description: '',
      date: '',
      time: '',
      endTime: '',
      duration: 60,
      meetingLink: '',
      selectedAttendees: [],
      status: 'scheduled'
    });
    setErrors({});
    setIsSubmitting(false);
    setSelectedMeeting(null); // Clear selected meeting when resetting
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

  const getUserName = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
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

  // Helper functions for organizer and invitation checks
  const getOrganizerInfo = (organizerId: string) => {
    let name = '';
    let role = '';

    // If organizerId is not a string, try to extract name and role from object
    if (typeof organizerId === 'object' && organizerId !== null) {
      const orgObj = organizerId as any;
      if (orgObj.firstName && orgObj.lastName) {
        name = `${orgObj.firstName} ${orgObj.lastName}`;
      } else if (orgObj.name) {
        name = orgObj.name;
      } else if (orgObj.email) {
        name = orgObj.email.split('@')[0]; // Use part before @ as name
      }

      if (orgObj.role) {
        role = orgObj.role.replace('_', ' ').toLowerCase();
        // Capitalize first letter
        role = role.charAt(0).toUpperCase() + role.slice(1);
      }
    }

    // If it's still a string, try to find in department members
    if (typeof organizerId === 'string' && !name) {
      const organizer = departmentMembers.find(member => member.id === organizerId);
      if (organizer) {
        name = organizer.name;
        role = 'Team Member'; // Default role for department members
      }

      // If not found in department members, check mock users
      if (!name) {
        const mockUser = mockUsers.find(user => user.id === organizerId);
        if (mockUser) {
          name = mockUser.name;
          role = mockUser.role?.replace('_', ' ').toLowerCase() || 'User';
          role = role.charAt(0).toUpperCase() + role.slice(1);
        }
      }
    }

    // Fallback to showing the ID
    if (!name && typeof organizerId === 'string' && organizerId.length > 0) {
      name = organizerId;
      role = 'Unknown';
    }

    // Final fallback
    if (!name) {
      name = 'Unknown Organizer';
      role = 'Unknown';
    }

    return { name, role };
  };

  const getOrganizerName = (organizerId: string) => {
    return getOrganizerInfo(organizerId).name;
  };

  const isCurrentUserInvited = (meeting: Meeting) => {
    return meeting.attendees?.includes(currentUser?.id || '');
  };

  const isCurrentUserOrganizer = (meeting: Meeting) => {
    const organizerId = typeof meeting.organizer === 'object' ?
      meeting.organizer.id || meeting.organizer._id :
      meeting.organizer;
    return organizerId === currentUser?.id;
  };

  // Show loading state while data is being fetched (following HODDepartmentManagement pattern)
  if (isLoadingMeetings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading department meetings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Loading Overlay for Operations */}
        {(updatingMeetingId || deletingMeetingId) && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {updatingMeetingId ? 'Updating meeting status...' : 'Deleting meeting...'}
              </p>
            </div>
          </div>
        )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Department Meetings</h1>
          <p className="text-muted-foreground">
            Manage meetings for {departmentToUse.name} department team
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowScheduleDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Meeting
          </Button>
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm"
            style={{ backgroundColor: (departmentToUse as any).color || '#3B82F6' }}
          >
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
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{departmentMeetings.length}</div>
            <p className="text-xs text-orange-700 dark:text-orange-300">All department meetings</p>
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
                  All Department Meetings
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
                              {isToday(meeting.date) && (
                                <Badge variant="destructive" className="text-xs">Today</Badge>
                              )}
                              {isCurrentUserOrganizer(meeting) && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                  Organizer
                                </Badge>
                              )}
                              {isCurrentUserInvited(meeting) && !isCurrentUserOrganizer(meeting) && (
                                <Badge variant="outline" className="text-xs">
                                  Invited
                                </Badge>
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
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Organizer:</p>
                                  <p className="text-muted-foreground">
                                    {(() => {
                                      const organizerInfo = getOrganizerInfo(meeting.organizer);
                                      return `${organizerInfo.name} (${organizerInfo.role})`;
                                    })()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Attendees:</p>
                                  <p className="text-muted-foreground">{meeting.attendees.length} team members</p>
                                </div>
                              </div>
                            </div>


                            {meeting.meetingLink && (isCurrentUserOrganizer(meeting) || isCurrentUserInvited(meeting)) && (
                              <div className="flex items-center gap-2 mt-2">
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" 
                                   className="text-sm text-blue-600 hover:underline">
                                  Join Meeting
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {isCurrentUserOrganizer(meeting) && (
                            <>
                          <Select
                            value={meeting.status}
                            onValueChange={(value) => handleUpdateMeetingStatus(meeting.id, value as MeetingStatus)}
                            disabled={updatingMeetingId === meeting.id}
                          >
                            <SelectTrigger className="w-28 h-8">
                              {updatingMeetingId === meeting.id ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                                  <span>Updating...</span>
                                </div>
                              ) : (
                              <SelectValue />
                              )}
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
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMeeting(meeting.id)}
                            disabled={deletingMeetingId === meeting.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deletingMeetingId === meeting.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                            <Trash2 className="h-4 w-4" />
                            )}
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
                        : 'No meetings scheduled for your department'}
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
                            <Badge variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {meeting.attendees.length} attendees
                            </Badge>
                            <Badge className={getStatusColor(meeting.status)}>
                              {getStatusIcon(meeting.status)}
                              <span className="ml-1">{meeting.status}</span>
                            </Badge>
                            {isCurrentUserOrganizer(meeting) && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                Organizer
                              </Badge>
                            )}
                            {isCurrentUserInvited(meeting) && !isCurrentUserOrganizer(meeting) && (
                              <Badge variant="outline" className="text-xs">
                                Invited
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {meeting.meetingLink && (isCurrentUserOrganizer(meeting) || isCurrentUserInvited(meeting)) && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Join Meeting
                            </a>
                          </Button>
                        )}
                        {isCurrentUserOrganizer(meeting) && (
                        <Button variant="outline" size="sm" onClick={() => handleEditMeeting(meeting)}>
                          <Edit className="w-4 h-4" />
                        </Button>
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
                    <Badge variant="outline">{departmentMeetings.length}</Badge>
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
                      {departmentMeetings.length > 0 
                        ? formatDuration(Math.round(departmentMeetings.reduce((acc, m) => acc + m.duration, 0) / departmentMeetings.length))
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
                    <span className="text-sm font-medium">Department Members</span>
                    <Badge variant="outline">{departmentMembers.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Meeting Organizer</span>
                    <Badge variant="default" className="bg-purple-100 text-purple-800">
                      {currentUser?.name || 'HOD'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Attendees</span>
                    <Badge variant="outline">
                      {departmentMeetings.length > 0 
                        ? Math.round(departmentMeetings.reduce((acc, m) => acc + m.attendees.length, 0) / departmentMeetings.length)
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

      {/* Schedule Meeting Dialog - Matching Admin Panel Design */}
      <Dialog open={showScheduleDialog} onOpenChange={(open) => {
        setShowScheduleDialog(open);
        if (!open) {
          // Reset form when dialog is closed
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMeeting ? (
                <>
                  <Edit className="h-5 w-5 text-blue-600" />
                  Edit Meeting
                </>
              ) : (
                <>
              <Plus className="h-5 w-5 text-blue-600" />
              Schedule New Meeting
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleScheduleMeeting(); }} className="space-y-6">
            {/* Basic Meeting Information */}
            <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                <Input
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  placeholder="Enter meeting title"
                />
                  {(!meetingForm.title || meetingForm.title.trim() === '') && <p className="text-xs text-red-600">Title is required</p>}
              </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={meetingForm.status} onValueChange={(value) => setMeetingForm({ ...meetingForm, status: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="scheduled">Low</SelectItem>
                      <SelectItem value="in_progress">Medium</SelectItem>
                      <SelectItem value="completed">High</SelectItem>
                      <SelectItem value="cancelled">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

              <div className="space-y-2">
                <Label>Description</Label>
              <Textarea
                value={meetingForm.description}
                onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                  placeholder="Meeting description (optional)"
                rows={3}
              />
              </div>
            </div>

            {/* Meeting Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Meeting Type</Label>
                  <Select value={meetingForm.status} onValueChange={(value) => setMeetingForm({ ...meetingForm, status: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Physical</SelectItem>
                      <SelectItem value="in_progress">Virtual</SelectItem>
                      <SelectItem value="completed">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
              </div>

                <div className="space-y-2">
                  <Label>Start Time *</Label>
                <Input
                    type="datetime-local"
                    value={(() => {
                      // Only show combined datetime if both date and time are available
                      if (meetingForm.date && meetingForm.time) {
                        try {
                          const combined = `${meetingForm.date}T${meetingForm.time}`;
                          const testDate = new Date(combined);
                          if (!isNaN(testDate.getTime())) {
                            return combined;
                          }
                        } catch (error) {
                          console.warn('Error creating start time:', error);
                        }
                      }
                      return '';
                    })()}
                    onChange={(e) => {
                      if (e.target.value) {
                        try {
                          const dateTime = new Date(e.target.value);
                          if (!isNaN(dateTime.getTime())) {
                            const date = dateTime.toISOString().split('T')[0];
                            const time = dateTime.toTimeString().slice(0, 5);
                            setMeetingForm({
                              ...meetingForm,
                              date,
                              time,
                              endTime: '' // Clear manually set end time when start time changes
                            });
                          }
                        } catch (error) {
                          console.warn('Error parsing start time:', error);
                        }
                      }
                    }}
                  />
                  {(!meetingForm.date || !meetingForm.time) && <p className="text-xs text-red-600">Start time is required</p>}
            </div>

                <div className="space-y-2">
                  <Label>End Time</Label>
                <Input
                    type="datetime-local"
                    value={meetingForm.endTime || (() => {
                      // Calculate end time from start time and duration if not manually set
                      if (meetingForm.date && meetingForm.time && meetingForm.duration) {
                        try {
                          const startDateTime = new Date(`${meetingForm.date}T${meetingForm.time}`);
                          if (!isNaN(startDateTime.getTime())) {
                            const endDateTime = new Date(startDateTime.getTime() + (meetingForm.duration * 60000));
                            if (!isNaN(endDateTime.getTime())) {
                              return endDateTime.toISOString().slice(0, 16);
                            }
                          }
                        } catch (error) {
                          console.warn('Error calculating end time:', error);
                        }
                      }
                      return '';
                    })()}
                    onChange={(e) => {
                      const newEndTime = e.target.value;
                      
                      setMeetingForm({
                        ...meetingForm,
                        endTime: newEndTime
                      });

                      // Calculate duration when end time changes
                      if (meetingForm.date && meetingForm.time && newEndTime) {
                        try {
                          const startDateTime = new Date(`${meetingForm.date}T${meetingForm.time}`);
                          const endDateTime = new Date(newEndTime);

                          if (!isNaN(startDateTime.getTime()) && !isNaN(endDateTime.getTime())) {
                            const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000);
                            if (durationMinutes > 0) {
                              setMeetingForm({
                                ...meetingForm,
                                endTime: newEndTime as string,
                                duration: durationMinutes
                              });
                            }
                          }
                        } catch (error) {
                          console.warn('Error updating duration from end time:', error);
                        }
                      }
                    }}
                  />
                  {meetingForm.duration && meetingForm.duration > 0 && (
                    <p className="text-xs text-muted-foreground">Duration: {meetingForm.duration} minutes</p>
                  )}
                </div>
              </div>


              {(meetingForm.status === 'in_progress' || meetingForm.status === 'completed') && (
                <div className="space-y-2">
                  <Label>Meeting Link {meetingForm.status === 'in_progress' ? '*' : ''}</Label>
                <Input
                    placeholder="https://zoom.us/j/..."
                  value={meetingForm.meetingLink}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meetingLink: e.target.value })}
                />
                  {errors.meetingLink && <p className="text-xs text-red-600">{errors.meetingLink}</p>}
              </div>
              )}
            </div>

            {/* Attendees Selection with Department Structure */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Invite Team Members
                </Label>
                {meetingForm.selectedAttendees.length > 0 && (
                  <Badge variant="outline" className="text-sm">
                    {meetingForm.selectedAttendees.length} selected
                  </Badge>
                )}
              </div>

              <div className="border rounded-lg p-4 space-y-4 max-h-64 overflow-y-auto">
                {/* Department Header */}
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                      <Users className="h-3 w-3 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-sm">{departmentToUse.name} Team</h4>
                  </div>
                  {!isLoadingMembers && departmentMembers.length > 0 && (
                    <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Select all available members (excluding current user)
                        const availableMembers = departmentMembers.filter(member => {
                          if (!member) return false;
                          const memberId = member.id || (member as any)._id;
                          const currentUserId = currentUser?.id || (currentUser as any)?._id;
                          return memberId !== currentUserId;
                        });
                        const allAvailableMemberIds = availableMembers.map(m => m.id || (m as any)._id || m.email || m.name);
                        setMeetingForm({
                          ...meetingForm,
                          selectedAttendees: allAvailableMemberIds
                        });
                      }}
                      className="text-xs h-6"
                    >
                      Select All
                      </Button>
                      {meetingForm.selectedAttendees.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setMeetingForm({
                              ...meetingForm,
                              selectedAttendees: []
                            });
                          }}
                          className="text-xs h-6 text-red-600 hover:text-red-700"
                        >
                          Clear All
                    </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Team Members List - Enhanced with Update Logic */}
                <div className="space-y-4">
                  {isLoadingMembers ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading team members...</span>
                      </div>
                    </div>
                  ) : (() => {
                    // Filter out only the current user (department head) but keep other department heads/managers
                    const availableMembers = departmentMembers.filter(member => {
                      if (!member) return false;
                      const memberId = member.id || member._id;
                      const currentUserId = currentUser?.id || (currentUser as any)?._id;
                      return memberId !== currentUserId;
                    });

                    console.log('HOD Meetings - UI RENDER DEBUG:', {
                      totalMembers: departmentMembers.length,
                      availableMembers: availableMembers.length,
                      currentUserId: currentUser?.id,
                      currentUserRole: currentUser?.role,
                      selectedAttendees: meetingForm.selectedAttendees,
                      isEditMode: !!selectedMeeting,
                      departmentMembersSample: departmentMembers.slice(0, 3).map(m => ({
                        id: m.id,
                        name: m.name,
                        role: m.role,
                        departmentId: m.departmentId
                      })),
                      availableMembersSample: availableMembers.slice(0, 3).map(m => ({
                        id: m.id,
                        name: m.name,
                        role: m.role
                      }))
                    });

                    // Group members by their managers
                    const managerTeams: { [managerId: string]: { manager: any; members: any[] } } = {};

                    // First, add all managers (even those without members) except current user
                    departmentMembers.forEach(member => {
                      if ((member.role === 'manager' || member.role === 'department_head')) {
                        const memberId = member.id || (member as any)._id;
                        const currentUserId = currentUser?.id || (currentUser as any)?._id;
                        if (memberId !== currentUserId) {
                          const mgrId = member.id || member._id || member.email || member.name;
                          if (!managerTeams[mgrId]) {
                            managerTeams[mgrId] = { manager: member, members: [] };
                          }
                        }
                      }
                    });

                    // Then, assign members to their managers
                    availableMembers.forEach(member => {
                      const memberId = member.id || member._id || member.email || member.name;
                      const managerId = member.managerId;

                      if (managerId) {
                        // Find the manager
                        const manager = departmentMembers.find(m =>
                          (m.id === managerId || m._id === managerId) &&
                          (m.role === 'manager' || m.role === 'department_head')
                        );

                        if (manager) {
                          const mgrId = manager.id || manager._id || manager.email || manager.name;
                          // Manager is already in managerTeams, just add the member
                          if (managerTeams[mgrId]) {
                            managerTeams[mgrId].members.push(member);
                          }
                        }
                      }
                    });

                    // Helper function to handle team member selection/deselection
                    const handleMemberSelection = (memberId: string, isSelected: boolean) => {
                      if (isSelected) {
                        setMeetingForm({
                          ...meetingForm,
                          selectedAttendees: [...meetingForm.selectedAttendees, memberId]
                        });
                      } else {
                        setMeetingForm({
                          ...meetingForm,
                          selectedAttendees: meetingForm.selectedAttendees.filter(id => id !== memberId)
                        });
                      }
                    };

                    // Helper function to handle manager selection (selects all team members under manager)
                    const handleManagerSelection = (managerId: string, isSelected: boolean) => {
                      const team = managerTeams[managerId];
                      if (!team) return;

                      const allTeamMemberIds = [managerId, ...team.members.map(m => m.id || m._id || m.email || m.name)];
                      
                      if (isSelected) {
                        // Add all team members
                        const newAttendees = [...meetingForm.selectedAttendees];
                        allTeamMemberIds.forEach(id => {
                          if (!newAttendees.includes(id)) {
                            newAttendees.push(id);
                          }
                        });
                        setMeetingForm({
                          ...meetingForm,
                          selectedAttendees: newAttendees
                        });
                      } else {
                        // Remove all team members
                        setMeetingForm({
                          ...meetingForm,
                          selectedAttendees: meetingForm.selectedAttendees.filter(id => !allTeamMemberIds.includes(id))
                        });
                      }
                    };

                    return availableMembers.length > 0 ? (
                      <>
                        {/* Managers and their teams */}
                        {Object.values(managerTeams).map(({ manager, members }) => {
                          const managerId = manager.id || manager._id || manager.email || manager.name;
                          const managerName = manager.name || `${manager.firstName || ''} ${manager.lastName || ''}`.trim();

                          return (
                            <div key={managerId} className="space-y-2">
                              {/* Manager */}
                              <div className="flex items-center gap-3 py-2 px-2 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                    <Checkbox
                                  id={managerId}
                                  checked={meetingForm.selectedAttendees.includes(managerId)}
                      onCheckedChange={(checked) => {
                        handleManagerSelection(managerId, checked as boolean);
                      }}
                    />
                                <div
                                  className="flex items-center gap-3 flex-1 cursor-pointer"
                                  onClick={() => {
                                    const isSelected = meetingForm.selectedAttendees.includes(managerId);
                                    handleManagerSelection(managerId, !isSelected);
                                  }}
                                >
                                  <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                                      {managerName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium truncate">{managerName}</span>
                                      <Shield className="h-3 w-3 text-blue-500" />
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">{manager.email}</div>
                                  </div>
                      <Badge variant="outline" className="text-xs">
                                    Manager
                      </Badge>
                  </div>
              </div>

                              {/* Team Members under this manager */}
                              <div className="ml-8 space-y-1">
                                {members.map((member) => {
                                  const memberId = member.id || member._id || member.email || member.name;
                                  const memberName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim();
                                  const memberEmail = member.email;

                                  return (
                                    <div
                                      key={memberId}
                                      className="flex items-center gap-3 py-2 px-2 rounded cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                      <Checkbox
                                        id={memberId}
                                        checked={meetingForm.selectedAttendees.includes(memberId)}
                                        onCheckedChange={(checked) => {
                                          handleMemberSelection(memberId, checked as boolean);
                                        }}
                                      />
                                      <div
                                        className="flex items-center gap-3 flex-1 cursor-pointer"
                                        onClick={() => {
                                          const isSelected = meetingForm.selectedAttendees.includes(memberId);
                                          handleMemberSelection(memberId, !isSelected);
                                        }}
                                      >
                                        <Avatar className="h-6 w-6">
                                          <AvatarFallback className="text-xs">
                                            {memberName.split(' ').map(n => n[0]).join('')}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm truncate">{memberName}</span>
                                            <User className="h-2 w-2 text-gray-500" />
                                          </div>
                                          <div className="text-xs text-muted-foreground truncate">{memberEmail}</div>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          Member
                                        </Badge>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No team members found</p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {meetingForm.selectedAttendees.length} of {departmentMembers.filter(member => {
                  if (!member) return false;
                  const memberId = member.id || (member as any)._id;
                  const currentUserId = currentUser?.id || (currentUser as any)?._id;
                  return memberId !== currentUserId;
                }).length} members selected
              </p>
                {selectedMeeting && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                    <Edit className="w-3 h-3 mr-1" />
                    Updating attendees
                  </Badge>
                )}
              </div>
              
              {/* Debug info for attendees */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs">
                  <p className="font-medium text-gray-700 dark:text-gray-300">Debug - Current Attendees:</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Selected: [{meetingForm.selectedAttendees.join(', ')}]
                  </p>
                  {selectedMeeting && (
                    <p className="text-gray-600 dark:text-gray-400">
                      Original: [{selectedMeeting.attendees?.join(', ') || 'None'}]
                    </p>
                  )}
                </div>
              )}
              {errors.invitees && <p className="text-xs text-red-600">{errors.invitees}</p>}
              
              {/* Show selected attendees summary */}
              {meetingForm.selectedAttendees.length > 0 && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                  <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                    Selected Team Members:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {meetingForm.selectedAttendees.slice(0, 5).map((attendeeId) => {
                      const member = departmentMembers.find(m => 
                        (m.id || m._id || m.email || m.name) === attendeeId
                      );
                      const memberName = member ? 
                        (member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim()) : 
                        'Unknown Member';
                      return (
                        <Badge key={attendeeId} variant="secondary" className="text-xs">
                          {memberName}
                        </Badge>
                      );
                    })}
                    {meetingForm.selectedAttendees.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{meetingForm.selectedAttendees.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-4">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowScheduleDialog(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    {selectedMeeting ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {selectedMeeting ? (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Update Meeting
                  </>
                ) : (
                  <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Meeting
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}