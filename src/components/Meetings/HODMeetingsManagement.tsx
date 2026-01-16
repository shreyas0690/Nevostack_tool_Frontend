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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Reset pagination when filters change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Form state for scheduling meetings
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    duration: 60,
    meetingLink: '',
    meetingType: 'physical' as 'physical' | 'virtual' | 'hybrid',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    selectedAttendees: [] as string[],
    status: 'scheduled' as MeetingStatus
  });

  const toId = (value: any) => {
    if (!value && value !== 0) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return String(value._id || value.id || value);
    return String(value);
  };

  const toLocalInputValue = (date: Date) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const normalizeMeetingType = (meeting: any): 'physical' | 'virtual' | 'hybrid' => {
    const rawType = meeting?.type;
    if (rawType === 'physical' || rawType === 'virtual' || rawType === 'hybrid') {
      return rawType;
    }
    if (meeting?.meetingLink || meeting?.location?.virtual?.meetingUrl) {
      return 'virtual';
    }
    return 'physical';
  };

  const normalizePriority = (meeting: any): 'low' | 'medium' | 'high' | 'urgent' => {
    const rawPriority = meeting?.priority;
    if (rawPriority === 'low' || rawPriority === 'medium' || rawPriority === 'high' || rawPriority === 'urgent') {
      return rawPriority;
    }
    return 'medium';
  };

  const normalizeMeeting = (meeting: any): Meeting => {
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

    const organizerInfo = meeting.organizer && typeof meeting.organizer === 'object' ? meeting.organizer : toId(meeting.organizer);
    const meetingLink = meeting.meetingLink || meeting.location?.virtual?.meetingUrl || '';
    const startTime = meeting.startTime ? new Date(meeting.startTime) : (meeting.date ? new Date(meeting.date) : new Date());
    const endTime = meeting.endTime ? new Date(meeting.endTime) : null;

    return {
      id: toId(meeting.id || meeting._id),
      title: meeting.title || meeting.name || 'Untitled Meeting',
      description: meeting.description || '',
      type: meeting.type || normalizeMeetingType(meeting),
      date: startTime,
      duration: endTime ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) : (meeting.duration || 60),
      location: meeting.location?.physical?.room ?? meeting.location?.virtual?.meetingUrl ?? (typeof meeting.location === 'string' ? meeting.location : ''),
      meetingLink: meetingLink || undefined,
      organizer: organizerInfo,
      attendees: attendeesIds,
      departments: deptIds,
      status: meeting.status || 'scheduled',
      priority: normalizePriority(meeting),
      createdAt: meeting.createdAt ? new Date(meeting.createdAt) : new Date(),
      updatedAt: meeting.updatedAt ? new Date(meeting.updatedAt) : new Date()
    } as Meeting;
  };

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

          const transformed = meetingsArray.map(normalizeMeeting);

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
        const transformed = meetingsArray.map(normalizeMeeting);

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
  console.log("agamon", departmentMembers)

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
    if ((meetingForm.meetingType === 'virtual' || meetingForm.meetingType === 'hybrid') && !meetingForm.meetingLink) {
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
        type: meetingForm.meetingType,
        priority: meetingForm.priority,
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
    const startLocalValue = toLocalInputValue(startTime);
    const [localDate, localTime] = startLocalValue.split('T');

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

    const meetingType = normalizeMeetingType(meeting);
    const meetingPriority = normalizePriority(meeting);

    // Format endTime for datetime-local input (YYYY-MM-DDTHH:MM) in local time
    const endTimeFormatted = toLocalInputValue(endTime);

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
      date: localDate,
      time: localTime,
      endTime: endTimeFormatted, // Properly formatted for datetime-local input
      duration: meeting.duration,
      meetingLink: meeting.meetingLink || '',
      meetingType: meetingType,
      priority: meetingPriority,
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
      meetingType: 'physical',
      priority: 'medium',
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
  const getOrganizerInfo = (organizer: string | any) => {
    let name = '';
    let role = '';

    // If organizer is an object, try to extract name and role from object
    if (typeof organizer === 'object' && organizer !== null) {
      const orgObj = organizer as any;
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

    const organizerId = typeof organizer === 'string' ? organizer : toId(organizer);

    // If it's still a string, try to find in department members
    if (organizerId && !name) {
      const organizerMember = departmentMembers.find(member => {
        const memberId = member.id || (member as any)._id;
        return String(memberId) === String(organizerId);
      });
      if (organizerMember) {
        name = organizerMember.name || `${organizerMember.firstName || ''} ${organizerMember.lastName || ''}`.trim() || organizerMember.email || '';
        if (organizerMember.role) {
          role = organizerMember.role.replace('_', ' ').toLowerCase();
          role = role.charAt(0).toUpperCase() + role.slice(1);
        } else {
          role = 'Team Member';
        }
      }

      // If not found in department members, check mock users
      if (!name) {
        const mockUser = mockUsers.find(user => user.id === organizerId || (user as any)._id === organizerId);
        if (mockUser) {
          name = mockUser.name;
          role = mockUser.role?.replace('_', ' ').toLowerCase() || 'User';
          role = role.charAt(0).toUpperCase() + role.slice(1);
        }
      }
    }

    // Fallback to showing the ID
    if (!name && organizerId) {
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

  const getOrganizerName = (organizerId: string | any) => {
    return getOrganizerInfo(organizerId).name;
  };

  const getDisplayName = (user: any) => {
    if (!user) return '';
    if (user.name) return user.name;
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (fullName) return fullName;
    if (user.email) return user.email.split('@')[0];
    return '';
  };

  const resolveAttendeeName = (attendee: any) => {
    if (!attendee && attendee !== 0) return '';

    if (typeof attendee === 'object') {
      const objectName = getDisplayName(attendee);
      if (objectName) return objectName;
      const idFromObject = toId(attendee);
      if (!idFromObject) return '';
      return resolveAttendeeName(idFromObject);
    }

    const attendeeId = String(attendee);
    const member = departmentMembers.find(m => {
      const memberId = String(m.id || (m as any)._id || '');
      const memberEmail = String(m.email || '');
      return memberId === attendeeId || memberEmail === attendeeId;
    });
    if (member) return getDisplayName(member);

    const mockUser = mockUsers.find(u => {
      const mockId = String(u.id || (u as any)._id || '');
      const mockEmail = String(u.email || '');
      return mockId === attendeeId || mockEmail === attendeeId;
    });
    if (mockUser) return getDisplayName(mockUser);

    return 'Unknown';
  };

  const getAttendeeSummary = (attendees: any[], maxNames = 3) => {
    if (!Array.isArray(attendees) || attendees.length === 0) {
      return { summary: '', total: 0 };
    }

    const resolvedNames = attendees
      .map(resolveAttendeeName)
      .filter((name) => name && name.trim() !== '');

    const uniqueNames = Array.from(new Set(resolvedNames));
    const displayed = uniqueNames.slice(0, maxNames);
    const remaining = Math.max(uniqueNames.length - displayed.length, 0);
    const summary = displayed.join(', ') + (remaining > 0 ? ` +${remaining} more` : '');

    return { summary, total: uniqueNames.length };
  };

  const isCurrentUserInvited = (meeting: Meeting) => {
    return meeting.attendees?.includes(currentUser?.id || '');
  };

  const isCurrentUserOrganizer = (meeting: Meeting) => {
    const organizerId = toId(meeting.organizer);
    return organizerId && organizerId === String(currentUser?.id || '');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white"
          >
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Department Meetings</h1>
            <p className="text-muted-foreground text-sm">
              Manage schedules and coordinate with the {departmentToUse.name} team
            </p>
          </div>
        </div>
        <Button onClick={() => setShowScheduleDialog(true)} size="lg" className="shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-5 w-5" />
          Schedule Meeting
        </Button>
      </div>

      {/* Enhanced Statistics */}
      {/* Enhanced Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 opacity-50" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Today's Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{todayMeetings.length}</div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/20 opacity-50" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">This Week</CardTitle>
            <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{thisWeekMeetings.length}</div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">Next 7 days</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-purple-100 dark:bg-purple-900/20 opacity-50" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{completedMeetings.length}</div>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">Total completed</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-orange-100 dark:bg-orange-900/20 opacity-50" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Total Meetings</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{departmentMeetings.length}</div>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">All department meetings</p>
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
            <div className="p-6 border-b bg-gray-50/50 dark:bg-gray-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">All Department Meetings</h3>
                  <p className="text-sm text-muted-foreground">View and manage all scheduled sessions</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search meetings..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-9 bg-white dark:bg-slate-950"
                  />
                </div>
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-[140px] bg-white dark:bg-slate-950">
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
            <CardContent>
              <div className="space-y-4">
                {filteredMeetings.length > 0 ? (
                  <>
                    {filteredMeetings
                      .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                      .map((meeting) => {
                        const attendeeSummary = getAttendeeSummary(meeting.attendees);

                        return (
                        <Card key={meeting.id} className={`group overflow-hidden transition-all duration-300 hover:shadow-lg border-l-4 ${meeting.status === 'scheduled' ? 'border-l-blue-500' :
                          meeting.status === 'in_progress' ? 'border-l-green-500' :
                            meeting.status === 'completed' ? 'border-l-gray-500' :
                              'border-l-red-500'
                          } ${isToday(meeting.date) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                          <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row">
                              {/* Date & Time Section */}
                              <div className="p-4 md:w-48 flex flex-row md:flex-col items-center justify-center gap-4 md:gap-2 border-b md:border-b-0 md:border-r bg-gray-50/50 dark:bg-gray-900/50">
                                <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border p-2 w-20 h-20">
                                  <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
                                    {meeting.date.toLocaleString('default', { month: 'short' })}
                                  </span>
                                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {meeting.date.getDate()}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground uppercase">
                                    {meeting.date.toLocaleString('default', { weekday: 'short' })}
                                  </span>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {meeting.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    <Timer className="h-3 w-3" />
                                    {formatDuration(meeting.duration)}
                                  </div>
                                </div>
                              </div>

                              {/* Main Content */}
                              <div className="flex-1 p-4 md:p-6 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                                        {meeting.title}
                                      </h3>
                                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <Badge variant="outline" className={`${getStatusColor(meeting.status)} border-none`}>
                                          {getStatusIcon(meeting.status)}
                                          <span className="ml-1 capitalize">{meeting.status.replace('_', ' ')}</span>
                                        </Badge>
                                        {isToday(meeting.date) && (
                                          <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-none animate-pulse">
                                            Today
                                          </Badge>
                                        )}
                                        {isCurrentUserOrganizer(meeting) && (
                                          <Badge variant="secondary" className="text-xs">
                                            Organizer
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {isCurrentUserOrganizer(meeting) && (
                                        <>
                                          <Select
                                            value={meeting.status}
                                            onValueChange={(value) => handleUpdateMeetingStatus(meeting.id, value as MeetingStatus)}
                                            disabled={updatingMeetingId === meeting.id}
                                          >
                                            <SelectTrigger className="w-28 h-8 text-xs">
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
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                            onClick={() => handleEditMeeting(meeting)}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>

                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                            onClick={() => handleDeleteMeeting(meeting.id)}
                                            disabled={deletingMeetingId === meeting.id}
                                          >
                                            {deletingMeetingId === meeting.id ? (
                                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                                            ) : (
                                              <Trash2 className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                    {meeting.description || "No description provided."}
                                  </p>

                                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                                      <User className="h-3.5 w-3.5" />
                                      <span className="text-xs">
                                        By: <span className="font-medium text-gray-900 dark:text-gray-100">{getOrganizerInfo(meeting.organizer).name}</span>
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                                      <Users className="h-3.5 w-3.5" />
                                      <div className="text-xs">
                                        <div>{attendeeSummary.total} Attendees</div>
                                        {attendeeSummary.total > 0 && (
                                          <div className="text-[11px] text-muted-foreground line-clamp-1">
                                            {attendeeSummary.summary}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Join Button Area */}
                                {meeting.meetingLink && (isCurrentUserOrganizer(meeting) || isCurrentUserInvited(meeting)) && (
                                  <div className="mt-4 pt-4 border-t flex justify-end">
                                    <Button
                                      className={`gap-2 ${isToday(meeting.date) ? 'w-full md:w-auto shadow-md shadow-blue-500/20' : ''}`}
                                      variant={isToday(meeting.date) ? "default" : "outline"}
                                      asChild
                                    >
                                      <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                                        <Video className="h-4 w-4" />
                                        Join Meeting
                                        <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
                                      </a>
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {/* Pagination Controls */}
                    {filteredMeetings.length > ITEMS_PER_PAGE && (
                      <div className="flex items-center justify-between pt-4 border-t mt-6">
                        <div className="text-sm text-muted-foreground">
                          Showing <span className="font-medium">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredMeetings.length)}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredMeetings.length)}</span> of <span className="font-medium">{filteredMeetings.length}</span> meetings
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.ceil(filteredMeetings.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "ghost"}
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredMeetings.length / ITEMS_PER_PAGE)))}
                            disabled={currentPage === Math.ceil(filteredMeetings.length / ITEMS_PER_PAGE)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
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
                  {todayMeetings.map((meeting) => {
                    const attendeeSummary = getAttendeeSummary(meeting.attendees);

                    return (
                    <Card key={meeting.id} className="group overflow-hidden border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10 hover:shadow-md transition-all">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border p-2 w-16 h-16 min-w-[4rem]">
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                              {meeting.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[0]}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase">
                              {meeting.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[1]}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                              {meeting.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="bg-white dark:bg-slate-800">
                                <Timer className="w-3 h-3 mr-1" />
                                {formatDuration(meeting.duration)}
                              </Badge>
                              <Badge variant="outline" className="bg-white dark:bg-slate-800">
                                <Users className="w-3 h-3 mr-1" />
                                {attendeeSummary.total} attendees
                              </Badge>
                              <Badge className={getStatusColor(meeting.status)}>
                                {getStatusIcon(meeting.status)}
                                <span className="ml-1 capitalize">{meeting.status}</span>
                              </Badge>
                            </div>
                            {attendeeSummary.total > 0 && (
                              <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
                                Attendees: {attendeeSummary.summary}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {meeting.meetingLink && (
                            <Button size="sm" className="gap-2 shadow-sm" asChild>
                              <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                                <Video className="w-4 h-4" />
                                Join
                              </a>
                            </Button>
                          )}

                          {isCurrentUserOrganizer(meeting) && (
                            <div className="flex items-center gap-1 border-l pl-2 ml-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditMeeting(meeting)}>
                                <Edit className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
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
                  <Select
                    value={meetingForm.priority}
                    onValueChange={(value) => setMeetingForm({ ...meetingForm, priority: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
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
                  <Select
                    value={meetingForm.meetingType}
                    onValueChange={(value) => setMeetingForm({ ...meetingForm, meetingType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">Physical</SelectItem>
                      <SelectItem value="virtual">Virtual</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
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
                            const localValue = toLocalInputValue(dateTime);
                            const [date, time] = localValue.split('T');
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
                              return toLocalInputValue(endDateTime);
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


              {(meetingForm.meetingType === 'virtual' || meetingForm.meetingType === 'hybrid') && (
                <div className="space-y-2">
                  <Label>Meeting Link {meetingForm.meetingType === 'virtual' ? '*' : ''}</Label>
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
                    const assignedMemberIds = new Set<string>();

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
                            assignedMemberIds.add(String(memberId));
                          }
                        }
                      }
                    });

                    const unassignedMembers = availableMembers.filter(member => {
                      const memberId = member.id || member._id || member.email || member.name;
                      const isManager = member.role === 'manager' || member.role === 'department_head';
                      return !isManager && !assignedMemberIds.has(String(memberId));
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

                        {unassignedMembers.length > 0 && (
                          <div className="space-y-2">
                            <div className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Other Team Members
                            </div>
                            <div className="space-y-1">
                              {unassignedMembers.map((member) => {
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
                        )}

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
