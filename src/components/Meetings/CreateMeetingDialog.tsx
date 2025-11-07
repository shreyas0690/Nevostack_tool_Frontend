import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/Auth/AuthProvider';
import { departmentService } from '@/services/departmentService';
import { userService } from '@/services/userService';
import { meetingService } from '@/services/meetingService';
import { hodService } from '@/services/api/hodService';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, Calendar as CalendarIcon, Users, Crown, Shield, User, CalendarDays, Clock, MapPin, Video, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'department_head' | 'manager' | 'member';
  managerId?: string;
  avatar?: string;
}

interface DepartmentHierarchy {
  departmentHead?: Employee;
  managers: Employee[];
  members: Employee[];
  managerTeams: Array<{
    manager: Employee;
    teamMembers: Employee[];
  }>;
  unassignedMembers: Employee[];
}

// Helper to extract an employee id/email string
function getEmployeeId(emp: any) {
  if (!emp) return '';
  return String(emp.id || emp._id || emp.user?.id || emp.user?._id || emp.email || '');
}

// Helper to check whether an employee object refers to the current user
function isCurrentUserHelper(emp: any, currentUser: any) {
  if (!emp || !currentUser) return false;
  const empId = String(emp.id || emp._id || emp.user?.id || emp.user?._id || emp.email || '');
  const curId = String(currentUser.id || (currentUser as any)._id || '');
  return empId !== '' && empId === curId;
}

interface CreateMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (meeting: any) => void;
  meetingToEdit?: any;
  onUpdated?: (meeting: any) => void;
}

export default function CreateMeetingDialog({ open, onOpenChange, onCreated, meetingToEdit, onUpdated }: CreateMeetingDialogProps) {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [departmentHierarchies, setDepartmentHierarchies] = useState<Record<string, DepartmentHierarchy>>({});
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [meetingLink, setMeetingLink] = useState<string>('');
  const [meetingType, setMeetingType] = useState<'physical' | 'virtual' | 'hybrid'>('physical');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({});

  useEffect(() => {
    // fetch departments once
    (async () => {
      try {
        const res: any = await departmentService.getDepartments({ limit: 1000 });
        let arr: any[] = [];
        if (Array.isArray(res)) arr = res;
        else if (Array.isArray(res?.data)) arr = res.data;
        else if (Array.isArray(res?.departments)) arr = res.departments;
        setDepartments(arr);
      } catch (e) {
        console.warn('CreateMeetingDialog: failed to fetch departments', e);
      }
    })();

    // Auto-select current user's department for HOD and Manager only
    if (currentUser?.departmentId && (currentUser.role === 'department_head' || currentUser.role === 'manager')) {
      setSelectedDepartments([String(currentUser.departmentId)]);
    }
    // HR users can manually select departments, no auto-selection
  }, [currentUser]);

  useEffect(() => {
    // when departments selected, fetch hierarchies for all selected departments
    if (selectedDepartments.length === 0) {
      setDepartmentHierarchies({});
      return;
    }

    (async () => {
      setIsLoadingHierarchy(true);
      try {
        const hierarchies: Record<string, DepartmentHierarchy> = {};
        
        // Fetch hierarchy for each selected department
        await Promise.all(
          selectedDepartments.map(async (deptId) => {
            try {
              // Use hodService to get proper department hierarchy
              const res: any = await hodService.getDepartmentHierarchy(deptId);

              let h: any = {};
              
              if (res?.success && res?.data) {
                console.log('Department hierarchy data:', res.data);
                console.log('Department hierarchy - managers:', res.data.managers?.length || 0);
                console.log('Department hierarchy - managerTeams:', res.data.managerTeams?.length || 0);
                h = res.data;
                // Try to get department name from department service
                try {
                  const deptRes = await departmentService.getDepartmentById(deptId);
                  h.departmentName = deptRes?.data?.name || `Department ${deptId}`;
                } catch (deptErr) {
                  console.warn('Could not fetch department name:', deptErr);
                  h.departmentName = `Department ${deptId}`;
                }
              } else {
                // Fallback: try to build hierarchy from department employees
                console.warn(`CreateMeetingDialog: Hierarchy API failed for dept ${deptId}, using fallback`);
                try {
                  const usersResp: any = await userService.getUsers({ departmentId: deptId, limit: 1000 });
                  const usersList = usersResp?.data || usersResp?.users || usersResp || [];

                  // Simple hierarchy building
                  h.members = (usersList || []).filter((u: any) => u.role === 'member').map((u: any) => ({
                    id: u.id || u._id || String(u._id || ''),
                    name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
                    firstName: u.firstName || '',
                    lastName: u.lastName || '',
                    email: u.email || u.emailAddress,
                    role: 'member',
                    managerId: u.managerId || u.manager || undefined,
                    avatar: u.avatar || undefined
                  }));
                  
                  h.managers = (usersList || []).filter((u: any) => u.role === 'manager').map((u: any) => ({
                    id: u.id || u._id || String(u._id || ''),
                        name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
                        firstName: u.firstName || '',
                        lastName: u.lastName || '',
                        email: u.email || u.emailAddress,
                    role: 'manager',
                        avatar: u.avatar || undefined
                      }));

                  h.departmentHead = (usersList || []).find((u: any) => u.role === 'department_head');

                  // Simple manager teams - try multiple matching strategies
                  h.managerTeams = (h.managers || []).map((mgr: any) => {
                    // Try to match by managerId first
                    let teamMembers = (h.members || []).filter((m: any) => m.managerId === mgr.id);

                    // If no matches, try matching by manager name/email (fallback)
                    if (teamMembers.length === 0) {
                      const mgrName = mgr.name?.toLowerCase();
                      const mgrEmail = mgr.email?.toLowerCase();
                      teamMembers = (h.members || []).filter((m: any) => {
                        const mMgrName = m.manager?.name?.toLowerCase();
                        const mMgrEmail = m.manager?.email?.toLowerCase();
                        return mMgrName === mgrName || mMgrEmail === mgrEmail;
                      });
                    }

                    return {
                      manager: mgr,
                      teamMembers: teamMembers
                    };
                  });

                  console.log('CreateMeetingDialog: Built manager teams in fallback:', h.managerTeams.map(t => ({
                    manager: t.manager.name,
                    teamMembersCount: t.teamMembers.length,
                    teamMemberNames: t.teamMembers.map(m => m.name)
                  })));
                  console.log('CreateMeetingDialog: Fallback hierarchy summary:', {
                    departmentHead: h.departmentHead?.name,
                    managersCount: h.managers?.length || 0,
                    membersCount: h.members?.length || 0,
                    managerTeamsCount: h.managerTeams?.length || 0
                  });

                  // Add unassigned members
                const assignedMemberIds = new Set();
                  h.managerTeams.forEach((team: any) => {
                    team.teamMembers.forEach((member: any) => {
                      assignedMemberIds.add(member.id);
                  });
                });
                
                  const unassignedMembers = (h.members || []).filter((m: any) => !assignedMemberIds.has(m.id));
                if (unassignedMembers.length > 0) {
                    h.managerTeams.push({
                      manager: { id: 'unassigned', name: 'Unassigned Members', email: '', role: 'unassigned' },
                    teamMembers: unassignedMembers 
                  });
                }
                
                  h.departmentName = `Department ${deptId}`;
                } catch (fallbackErr) {
                  console.error(`CreateMeetingDialog: Fallback failed for dept ${deptId}`, fallbackErr);
                  h = {
                    departmentHead: null,
                    managers: [],
                    members: [],
                    managerTeams: [],
                    departmentName: `Department ${deptId}`
                  };
                }
              }

              // Debug logging for hierarchy
              console.log(`CreateMeetingDialog: Final hierarchy for department ${deptId}:`, {
                departmentHead: h.departmentHead ? { id: h.departmentHead.id, name: h.departmentHead.name, role: h.departmentHead.role } : null,
                managersCount: (h.managers || []).length,
                membersCount: (h.members || []).length,
                managerTeamsCount: (h.managerTeams || []).length,
                departmentName: h.departmentName
              });

              hierarchies[deptId] = h as DepartmentHierarchy & { departmentName?: string };
            } catch (e) {
              console.warn(`CreateMeetingDialog: failed to fetch hierarchy for dept ${deptId}`, e);
            }
          })
        );
        
        setDepartmentHierarchies(hierarchies);
      } catch (e) {
        console.warn('CreateMeetingDialog: failed to fetch dept hierarchies', e);
        setDepartmentHierarchies({});
      } finally {
        setIsLoadingHierarchy(false);
      }
    })();
  }, [selectedDepartments]);

  // Prefill when editing
  useEffect(() => {
    if (!meetingToEdit) {
      // Reset form when no meeting to edit
      resetForm();
      return;
    }
    
    try {
      console.log('Prefilling meeting data:', meetingToEdit);
      setTitle(meetingToEdit.title || '');
      setDescription(meetingToEdit.description || '');
      
      // Handle different time formats from ManagerMeetingsManagement
      let start, end;
      if (meetingToEdit.startTime || meetingToEdit.start) {
        // If startTime/start exists, use it
        start = meetingToEdit.startTime || meetingToEdit.start;
        end = meetingToEdit.endTime || meetingToEdit.end;
      } else if (meetingToEdit.date) {
        // If only date exists (from ManagerMeetingsManagement), calculate start and end
        const meetingDate = new Date(meetingToEdit.date);
        start = meetingDate;
        // Calculate end time based on duration (default 60 minutes if not specified)
        const duration = meetingToEdit.duration || 60;
        end = new Date(meetingDate.getTime() + duration * 60000);
      }
      
      // Format time properly for datetime-local input (YYYY-MM-DDTHH:MM)
      const formatDateTimeLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      
      setStartTime(start ? formatDateTimeLocal(new Date(start)) : '');
      setEndTime(end ? formatDateTimeLocal(new Date(end)) : '');
      setMeetingLink(meetingToEdit.meetingLink || '');
      
      // Handle meeting type mapping
      let meetingTypeValue = 'physical'; // Default fallback
      
      // Check if the meeting type is already in the correct format
      if (meetingToEdit.type === 'physical' || meetingToEdit.type === 'virtual' || meetingToEdit.type === 'hybrid') {
        meetingTypeValue = meetingToEdit.type;
      } 
      // Handle legacy types or other formats
      else if (meetingToEdit.type === 'user' || meetingToEdit.type === 'team' || meetingToEdit.type === 'department') {
        // If it's a user/team/department meeting, determine type based on meeting link
        meetingTypeValue = meetingToEdit.meetingLink ? 'virtual' : 'physical';
      }
      // Handle any other type values
      else if (meetingToEdit.type) {
        // Try to map other possible values
        const typeLower = meetingToEdit.type.toLowerCase();
        if (typeLower.includes('virtual') || typeLower.includes('online')) {
          meetingTypeValue = 'virtual';
        } else if (typeLower.includes('hybrid') || typeLower.includes('mixed')) {
          meetingTypeValue = 'hybrid';
        } else if (typeLower.includes('physical') || typeLower.includes('in-person') || typeLower.includes('office')) {
          meetingTypeValue = 'physical';
        } else {
          // Default to physical if we can't determine
          meetingTypeValue = 'physical';
        }
      }
      
      console.log('Meeting Type Debug:', {
        originalType: meetingToEdit.type,
        meetingLink: meetingToEdit.meetingLink,
        mappedType: meetingTypeValue,
        meetingTitle: meetingToEdit.title
      });
      
      setMeetingType(meetingTypeValue as 'physical' | 'virtual' | 'hybrid');
      
      // Additional debug log to confirm the state is set
      console.log('Meeting Type State Set:', meetingTypeValue);
      
      // Handle priority mapping
      let priorityValue = 'medium';
      if (meetingToEdit.priority === 'low' || meetingToEdit.priority === 'medium' || meetingToEdit.priority === 'high' || meetingToEdit.priority === 'urgent') {
        priorityValue = meetingToEdit.priority;
      } else if (meetingToEdit.priority) {
        // Handle any other priority values
        priorityValue = 'medium';
      }
      
      console.log('Priority Debug:', {
        originalPriority: meetingToEdit.priority,
        mappedPriority: priorityValue,
        meetingTitle: meetingToEdit.title
      });
      
      setPriority(priorityValue as 'low' | 'medium' | 'high' | 'urgent');

      if (Array.isArray(meetingToEdit.departments) && meetingToEdit.departments.length > 0) {
        const deptIds = meetingToEdit.departments.map((d: any) => d.id || d._id || d);
        setSelectedDepartments(deptIds);
      } else if (meetingToEdit.department) {
        setSelectedDepartments([meetingToEdit.department.id || meetingToEdit.department._id || meetingToEdit.department]);
      } else {
        setSelectedDepartments([]);
      }

      const inviteeSet = new Set<string>();
      
      // Handle attendees from ManagerMeetingsManagement
      if (Array.isArray(meetingToEdit.attendees) && meetingToEdit.attendees.length > 0) {
        meetingToEdit.attendees.forEach((attendee: any) => {
          if (typeof attendee === 'string') {
            inviteeSet.add(attendee);
          } else if (attendee && (attendee.id || attendee._id)) {
            inviteeSet.add(String(attendee.id || attendee._id));
          }
        });
      }
      
      // Handle participants
      if (Array.isArray(meetingToEdit.participants) && meetingToEdit.participants.length > 0) {
        meetingToEdit.participants.forEach((p: any) => {
          const userObj = p.user || p;
          if (!userObj) return;
          const id = (typeof userObj === 'string') ? userObj : (userObj.id || userObj._id);
          const email = userObj.email;
          const name = (userObj.firstName || userObj.lastName) ? `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() : undefined;
          if (id !== undefined && id !== null) inviteeSet.add(String(id));
          if (email) inviteeSet.add(String(email));
          if (name) inviteeSet.add(String(name));
        });
      }
      
      // Handle inviteeUserIds
      if (Array.isArray(meetingToEdit.inviteeUserIds)) {
        meetingToEdit.inviteeUserIds.forEach((u: any) => {
          const id = (typeof u === 'string') ? u : (u.id || u._id);
          const email = u.email;
          const name = (u.firstName || u.lastName) ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : undefined;
          if (id !== undefined && id !== null) inviteeSet.add(String(id));
          if (email) inviteeSet.add(String(email));
          if (name) inviteeSet.add(String(name));
        });
      }
      
      const finalInvitees = Array.from(inviteeSet);
      console.log('CreateMeetingDialog: prefilled invitee keys:', finalInvitees);
      console.log('CreateMeetingDialog: original attendees:', meetingToEdit.attendees);
      setSelectedInvitees(finalInvitees);
    } catch (e) {
      console.warn('CreateMeetingDialog: failed to prefill edit meeting', e);
    }
  }, [meetingToEdit]);

  // Debug useEffect to track meetingType changes
  useEffect(() => {
    console.log('Meeting Type State Changed:', meetingType);
  }, [meetingType]);

  // Get all employees from selected departments
  const getAllEmployeesFromSelectedDepartments = React.useMemo(() => {
    if (!currentUser || selectedDepartments.length === 0) return [];
    
    const allEmployees: Employee[] = [];
    
    selectedDepartments.forEach(deptId => {
      const hierarchy = departmentHierarchies[deptId];
      if (hierarchy) {
        if (hierarchy.departmentHead) allEmployees.push(hierarchy.departmentHead);
        allEmployees.push(...hierarchy.managers);
        allEmployees.push(...hierarchy.members);
      }
    });

    // Remove duplicates (in case same employee is in multiple departments)
    const uniqueEmployees = allEmployees.filter((emp, index, arr) => 
      arr.findIndex(e => e.id === emp.id) === index
    );

    // Manager: prefer extracting team members from departmentHierarchies managerTeams where manager is current user
    if (currentUser.role === 'manager') {
      const myId = String(currentUser.id || (currentUser as any)._id || '');
      const teamMembersFromHierarchy: Employee[] = [];
      selectedDepartments.forEach(deptId => {
        const h = departmentHierarchies[deptId] as any;
        if (!h) return;
        const mgrTeams = h.managerTeams || [];
        mgrTeams.forEach((team: any) => {
          const mgrId = String(team.manager?.id || team.manager?._id || team.manager || '');
          if (mgrId === myId && Array.isArray(team.teamMembers)) {
            team.teamMembers.forEach((m: any) => teamMembersFromHierarchy.push(m));
          }
        });
      });
      // fall back to uniqueEmployees if no managerTeams found
      if (teamMembersFromHierarchy.length > 0) {
        return teamMembersFromHierarchy.filter((emp, idx, arr) => arr.findIndex(e => e.id === emp.id) === idx);
      }
      const managedIds = new Set((currentUser as any).managedMemberIds?.map(String) || []);
      return uniqueEmployees.filter(emp => managedIds.has(String(emp.id)));
    }

    // HOD: hide themselves from invitee lists
    if (currentUser?.role === 'department_head') {
      const myId = String(currentUser.id || (currentUser as any)._id);
      return uniqueEmployees.filter(emp => String(emp.id) !== myId);
    }

    // Admin and others can see all employees
    return uniqueEmployees;
  }, [departmentHierarchies, selectedDepartments, currentUser]);

  const getEmployeeId = (emp: any) => {
    if (!emp) return '';
    const e = emp as any;
    return String(e.id || e._id || e.user?.id || e.user?._id || e.email || '');
  };

  const isEmployeeSelected = (emp: any) => {
    const id = getEmployeeId(emp);
    if (!id) return false;
    return selectedInvitees.includes(id) || selectedInvitees.includes(emp.email) || selectedInvitees.includes(emp.name);
  };

  const validate = () => {
    const e: Record<string,string> = {};
    if (!title.trim()) e.title = 'Title required';
    if (!startTime) e.startTime = 'Start time required';
    if (endTime && new Date(endTime) <= new Date(startTime)) e.endTime = 'End time must be after start time';
    if (selectedDepartments.length === 0 && selectedInvitees.length === 0) e.invitees = 'Select at least one department or invitee';
    if (meetingType === 'virtual' && !meetingLink) e.meetingLink = 'Meeting link required for virtual meetings';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    if (!validate()) {
      toast.error('Please fill in all required fields! ⚠️', {
        duration: 3000,
        style: {
          background: '#1f2937',
          color: '#ffffff',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
        },
      });
      return;
    }
    setIsSubmitting(true);
    
    try {
      const payload = {
        title,
        description,
        startTime: new Date(startTime).toISOString(),
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
        meetingLink: meetingLink || undefined,
        type: meetingType,
        priority,
        departmentId: selectedDepartments.length === 1 ? selectedDepartments[0] : undefined,
        departmentIds: selectedDepartments.length > 1 ? selectedDepartments : undefined,
        inviteeUserIds: selectedInvitees.length > 0 ? selectedInvitees : undefined,
        // Add participants for team members update
        participants: selectedInvitees.length > 0 ? selectedInvitees.map(userId => ({ user: userId })) : undefined
      };

      console.log('Frontend - Selected departments:', selectedDepartments);
      console.log('Frontend - Selected invitees:', selectedInvitees);
      console.log('Frontend - Payload:', payload);

      if (meetingToEdit) {
        const res = await meetingService.updateMeeting(meetingToEdit.id || meetingToEdit._id, payload);
      if (res && res.success) {
          toast.success(`Meeting "${title}" updated successfully! ✏️`, {
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#ffffff',
              border: '1px solid #059669',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
          });
          onUpdated && onUpdated(res.data || res);
        onOpenChange(false);
        } else {
          console.warn('CreateMeetingDialog: unexpected update response', res);
          toast.error('Failed to update meeting. Please try again. ❌', {
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#ffffff',
              border: '1px solid #dc2626',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
          });
        }
      } else {
        const res = await meetingService.createMeeting(payload);
      if (res && res.success) {
          toast.success(`Meeting "${title}" created successfully! 🎉`, {
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#ffffff',
              border: '1px solid #059669',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
          });
          onCreated && onCreated(res.data || res);
        onOpenChange(false);
          // reset form
          resetForm();
      } else {
        console.warn('CreateMeetingDialog: unexpected response', res);
          toast.error('Failed to create meeting. Please try again. ❌', {
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#ffffff',
              border: '1px solid #dc2626',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
          });
        }
      }
    } catch (err) {
      console.error('CreateMeetingDialog: failed to create meeting', err);
      const errorMessage = meetingToEdit ? 'Failed to update meeting' : 'Failed to create meeting';
      toast.error(`${errorMessage}. Please try again. ❌`, {
        duration: 4000,
        style: {
          background: '#1f2937',
          color: '#ffffff',
          border: '1px solid #dc2626',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
        },
      });
      setErrors({ submit: 'Failed to create meeting. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedDepartments(currentUser?.role === 'department_head' || currentUser?.role === 'manager' ? [String(currentUser.departmentId)] : []);
    setSelectedInvitees([]);
    setStartTime('');
    setEndTime('');
    setMeetingLink('');
    setMeetingType('physical');
    setPriority('medium');
    setErrors({});
  };

  const toggleInvitee = (employeeId: string) => {
    setSelectedInvitees(prev => {
      const newSelection = prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId];
      return newSelection;
    });
  };

  const selectAllInTeam = (teamMembers: Employee[]) => {
    const teamIds = teamMembers.map(member => member.id);
    setSelectedInvitees(prev => {
      const newSet = new Set([...prev, ...teamIds]);
      return Array.from(newSet);
    });
    toast.success(`Selected all ${teamMembers.length} team members! 👥`, {
      duration: 2000,
      style: {
        background: '#1f2937',
        color: '#ffffff',
        border: '1px solid #059669',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  };

  const toggleDepartment = (deptId: string) => {
    try {
      console.log('toggleDepartment called with:', deptId);
      console.log('currentUser role:', currentUser?.role);
      console.log('selectedDepartments before:', selectedDepartments);
      
      if (!currentUser) {
        console.log('No current user, returning');
        return;
      }
      
      if (currentUser.role === 'department_head' || currentUser.role === 'manager') {
        console.log('Access denied for role:', currentUser.role);
        return;
      }
      
      // HR and HR Manager can select any department
      if (currentUser.role === 'hr' || currentUser.role === 'hr_manager') {
        // Allow department selection for HR users
      }
      
      setSelectedDepartments(prev => {
        const newSelection = prev.includes(deptId) 
          ? prev.filter(id => id !== deptId)
          : [...prev, deptId];
        console.log('selectedDepartments after:', newSelection);
        return newSelection;
      });
    } catch (error) {
      console.error('Error in toggleDepartment:', error);
    }
  };

  const selectAllFromDepartment = (deptId: string) => {
    const hierarchy = departmentHierarchies[deptId];
    if (!hierarchy) return;

    const allDeptEmployees: string[] = [];
    if (hierarchy.departmentHead) allDeptEmployees.push(hierarchy.departmentHead.id);
    allDeptEmployees.push(...hierarchy.managers.map(m => m.id));
    allDeptEmployees.push(...hierarchy.members.map(m => m.id));

    setSelectedInvitees(prev => {
      const newSet = new Set([...prev, ...allDeptEmployees]);
      return Array.from(newSet);
    });
    
    const dept = departments.find(d => String(d.id || d._id) === deptId);
    const deptName = dept?.name || 'Department';
    toast.success(`Selected all members from ${deptName}! 🏢`, {
      duration: 2000,
      style: {
        background: '#1f2937',
        color: '#ffffff',
        border: '1px solid #059669',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'department_head': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'manager': return <Users className="h-4 w-4 text-green-500" />;
      case 'member': return <User className="h-4 w-4 text-gray-500" />;
      default: return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!currentUser) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading user information...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {meetingToEdit ? 'Update Meeting' : 'Schedule New Meeting'}
          </DialogTitle>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                {meetingToEdit ? 'Modify meeting details and participants' : 'Create a new meeting with your team'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Meeting Information */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Meeting Details</h3>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Meeting Title *</Label>
                <Input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Enter meeting title"
                    className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400"
                />
                  {errors.title && <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.title}
                  </p>}
              </div>

              <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Priority Level</Label>
                <Select value={priority} onValueChange={(v: any) => {
                  console.log('Priority Changed:', v);
                  setPriority(v);
                }}>
                    <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="low">🟢 Low Priority</SelectItem>
                      <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                      <SelectItem value="high">🟠 High Priority</SelectItem>
                      <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          </div>

          <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</Label>
              <Textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                placeholder="Meeting description (optional)"
                rows={3}
                  className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400"
              />
              </div>
            </div>
          </div>

          {/* Meeting Schedule & Type */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Schedule & Type</h3>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Meeting Type</Label>
                <Select value={meetingType} onValueChange={(v: any) => {
                  console.log('Meeting Type Changed:', v);
                  setMeetingType(v);
                }}>
                    <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400">
                      <SelectValue placeholder="Select meeting type">
                        {meetingType === 'physical' && 'Physical Meeting'}
                        {meetingType === 'virtual' && 'Virtual Meeting'}
                        {meetingType === 'hybrid' && 'Hybrid Meeting'}
                      </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="physical">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Physical Meeting
                        </div>
                      </SelectItem>
                      <SelectItem value="virtual">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Virtual Meeting
                        </div>
                      </SelectItem>
                      <SelectItem value="hybrid">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Hybrid Meeting
                        </div>
                      </SelectItem>
                  </SelectContent>
                </Select>
            </div>

              <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Start Time *</Label>
                <Input 
                  type="datetime-local" 
                  value={startTime} 
                  onChange={e => setStartTime(e.target.value)} 
                    className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400"
                />
                  {errors.startTime && <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.startTime}
                  </p>}
            </div>

              <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">End Time</Label>
                <Input 
                  type="datetime-local" 
                  value={endTime} 
                  onChange={e => setEndTime(e.target.value)} 
                    className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400"
                />
                  {errors.endTime && <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.endTime}
                  </p>}
            </div>
          </div>

            {meetingType !== 'physical' && (
              <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Meeting Link {meetingType === 'virtual' ? '*' : ''}
                  </Label>
                <Input 
                  placeholder="https://zoom.us/j/..." 
                  value={meetingLink} 
                  onChange={e => setMeetingLink(e.target.value)} 
                    className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400"
                />
                  {errors.meetingLink && <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.meetingLink}
                  </p>}
              </div>
            )}
            </div>
          </div>

          {/* Department Selection (only for Admins and HR). HOD/Manager panel will not show department selector */}
          {currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'hr' || currentUser?.role === 'hr_manager' ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex items-center justify-between flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Departments</h3>
                {selectedDepartments.length > 0 && (
                    <Badge variant="outline" className="text-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                    {selectedDepartments.length} selected
                  </Badge>
                )}
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto bg-white dark:bg-slate-800">
                {!Array.isArray(departments) ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin border-t-red-600 mx-auto mb-4"></div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Loading departments...</p>
                    </div>
                  </div>
                ) : departments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">No departments found</p>
                  </div>
                ) : (
                  departments.map((dept: any) => {
                    try {
                      const deptId = String(dept.id || dept._id);
                      const isSelected = selectedDepartments.includes(deptId);

                      if (!dept || !deptId || deptId === 'undefined') {
                        console.warn('Invalid department data:', dept);
                        return null;
                      }

                      return (
                        <div 
                          key={deptId}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={isSelected} 
                              onCheckedChange={() => toggleDepartment(deptId)}
                              className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                            />
                            <div 
                              className="flex items-center gap-3 cursor-pointer flex-1"
                              onClick={() => toggleDepartment(deptId)}
                            >
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-red-100 dark:bg-red-900/30' 
                                  : 'bg-slate-100 dark:bg-slate-700'
                              }`}>
                                <Users className={`h-5 w-5 ${
                                  isSelected 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : 'text-slate-600 dark:text-slate-400'
                                }`} />
                              </div>
          <div>
                                <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{dept.name}</div>
                                {dept.description && (
                                  <div className="text-xs text-slate-600 dark:text-slate-400">{dept.description}</div>
                                )}
                    </div>
                  </div>
                </div>

                          {isSelected && departmentHierarchies[deptId] && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectAllFromDepartment(deptId);
                              }}
                              className="text-xs h-7 px-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
                            >
                              Select All
                            </Button>
                          )}
                        </div>
                      );
                    } catch (error) {
                      console.error('Error rendering department:', dept, error);
                      return null;
                    }
                  }).filter(Boolean)
                )}
              </div>
            </div>
          ) : null}

          {/* Invitees Selection with Hierarchy */}
          {selectedDepartments.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex items-center justify-between flex-1">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Meeting Participants
                    </h3>
                  {selectedDepartments.length > 1 && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        From {selectedDepartments.length} departments
                      </p>
                    )}
                  </div>
                {selectedInvitees.length > 0 && (
                    <Badge variant="outline" className="text-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                    {selectedInvitees.length} selected
                  </Badge>
                )}
                </div>
              </div>

              {isLoadingHierarchy ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin border-t-red-600 mx-auto mb-4"></div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Loading department hierarchies...</p>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 space-y-6 max-h-96 overflow-y-auto bg-white dark:bg-slate-800">
                  {currentUser?.role === 'manager' ? (
                    // For managers, show only their managed team members across selected departments
                    (() => {
                      const teamEmployees = getAllEmployeesFromSelectedDepartments;
                      if (!teamEmployees || teamEmployees.length === 0) {
                        return (
                          <div className="text-center py-6 text-muted-foreground">No team members available</div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                                <Users className="h-3 w-3 text-blue-600" />
                              </div>
                              <h4 className="font-medium text-sm">Team Members</h4>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => selectAllInTeam(teamEmployees as any)} className="text-xs h-6">Select All</Button>
                          </div>

                          <div className="ml-4 space-y-1">
                            {teamEmployees.map((member: any) => (
                              <EmployeeCheckbox
                                key={getEmployeeId(member) || member.id}
                                employee={member}
                                isSelected={isEmployeeSelected(member)}
                                onToggle={() => toggleInvitee(getEmployeeId(member))}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    // existing hierarchy rendering for HOD/Admin
                    selectedDepartments.map((deptId) => {
                      const dept = departments.find(d => String(d.id || d._id) === deptId);
                      const hierarchy = departmentHierarchies[deptId];
                      
                      if (!hierarchy) {
                        const displayDeptNameLoading = dept?.name || String(deptId).slice(0,8) || 'department';
                        return (
                          <div key={deptId} className="text-center py-4 text-muted-foreground text-sm">
                            Loading {displayDeptNameLoading} hierarchy...
                          </div>
                        );
                      }

                      return (
                        <div key={deptId} className="space-y-4">
                          {/* Department Header */}
                          <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                                <Users className="h-3 w-3 text-blue-600" />
                              </div>
                              {
                                (() => {
                                  const displayDeptName = dept?.name || (departmentHierarchies[deptId] as any)?.departmentName || (departmentHierarchies[deptId] as any)?.department?.name || 'Unknown Department';
                                  return <h4 className="font-medium text-sm">{displayDeptName}</h4>;
                                })()
                              }
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => selectAllFromDepartment(deptId)}
                              className="text-xs h-6"
                            >
                              Select All
                            </Button>
                          </div>

                          {/* Department Head */}
                          {hierarchy.departmentHead && !isCurrentUserHelper(hierarchy.departmentHead, currentUser) && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                                <Shield className="h-3 w-3" />
                                Department Head
                              </div>
                              <div className="ml-4">
                                <EmployeeCheckbox 
                                  employee={hierarchy.departmentHead}
                                  isSelected={isEmployeeSelected(hierarchy.departmentHead)}
                                  onToggle={() => toggleInvitee(getEmployeeId(hierarchy.departmentHead))}
                                />
                              </div>
                            </div>
                          )}

                          {/* Managers - Display like Department Head */}
                          {((hierarchy.managerTeams && hierarchy.managerTeams.length > 0) ||
                            (hierarchy.managers && hierarchy.managers.length > 0)) && (
                            <>
                              {console.log('Rendering hierarchy:', {
                                hasManagerTeams: !!(hierarchy.managerTeams && hierarchy.managerTeams.length > 0),
                                managerTeamsCount: hierarchy.managerTeams?.length || 0,
                                hasManagers: !!(hierarchy.managers && hierarchy.managers.length > 0),
                                managersCount: hierarchy.managers?.length || 0,
                                hasMembers: !!(hierarchy.members && hierarchy.members.length > 0),
                                membersCount: hierarchy.members?.length || 0
                              })}

                              {/* Show managers from managerTeams with their members */}
                              {hierarchy.managerTeams && hierarchy.managerTeams
                                .filter(team => team.manager.id !== 'unassigned') // Filter out unassigned team first
                                .map((team) => (
                                <div key={team.manager.id} className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                                    <Users className="h-3 w-3" />
                                    Manager: {team.manager.name}
                                  </div>
                                  <div className="ml-4">
                                    <EmployeeCheckbox
                                      employee={team.manager}
                                      isSelected={isEmployeeSelected(team.manager)}
                                      onToggle={() => toggleInvitee(getEmployeeId(team.manager))}
                                    />
                                  </div>
                                  {/* Show team members under this manager */}
                                  {team.teamMembers.length > 0 && (
                                    <div className="ml-4 space-y-1 border-l-2 border-green-200 pl-3">
                                      <div className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                                        <span>Team Members ({team.teamMembers.length})</span>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => selectAllInTeam(team.teamMembers)}
                                          className="text-xs h-5"
                                        >
                                          Select All
                                        </Button>
                                      </div>
                                      {team.teamMembers.filter((m: any) => !isCurrentUserHelper(m, currentUser)).map(member => (
                                        <EmployeeCheckbox
                                          key={getEmployeeId(member) || member.id}
                                          employee={member}
                                          isSelected={isEmployeeSelected(member)}
                                          onToggle={() => toggleInvitee(getEmployeeId(member))}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}

                              {/* Show managers without teams if no managerTeams exist */}
                              {(!hierarchy.managerTeams || hierarchy.managerTeams.length === 0) &&
                               hierarchy.managers && hierarchy.managers
                                .filter((m: any) => !isCurrentUserHelper(m, currentUser))
                                .map(manager => {
                                  // Find members for this manager
                                  const managerMembers = (hierarchy.members || []).filter((m: any) =>
                                    m.managerId === manager.id ||
                                    getEmployeeId(m.manager) === getEmployeeId(manager)
                                  );
                                  return (
                                  <div key={manager.id} className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                                      <Users className="h-3 w-3" />
                                      Manager: {manager.name}
                                    </div>
                                    <div className="ml-4">
                                      <EmployeeCheckbox
                                        employee={manager}
                                        isSelected={isEmployeeSelected(manager)}
                                        onToggle={() => toggleInvitee(getEmployeeId(manager))}
                                      />
                                    </div>
                                    {/* Show team members under this manager */}
                                    {managerMembers.length > 0 && (
                                      <div className="ml-4 space-y-1 border-l-2 border-green-200 pl-3">
                                        <div className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                                          <span>Team Members ({managerMembers.length})</span>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => selectAllInTeam(managerMembers)}
                                            className="text-xs h-5"
                                          >
                                            Select All
                                          </Button>
                                        </div>
                                        {managerMembers.map(member => (
                                          <EmployeeCheckbox
                                            key={getEmployeeId(member) || member.id}
                                            employee={member}
                                            isSelected={isEmployeeSelected(member)}
                                            onToggle={() => toggleInvitee(getEmployeeId(member))}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </>
                          )}

                          {/* Show unassigned members if they exist */}
                          {(() => {
                            // Calculate assigned members
                            const assignedMemberIds = new Set();
                            if (hierarchy.managerTeams && hierarchy.managerTeams.length > 0) {
                              hierarchy.managerTeams.forEach(team => {
                                if (team.teamMembers) {
                                  team.teamMembers.forEach(member => {
                                    assignedMemberIds.add(getEmployeeId(member));
                                  });
                                }
                              });
                            } else if (hierarchy.managers && hierarchy.managers.length > 0) {
                              hierarchy.managers.forEach(manager => {
                                const managerMembers = (hierarchy.members || []).filter((m: any) =>
                                  m.managerId === manager.id ||
                                  getEmployeeId(m.manager) === getEmployeeId(manager)
                                );
                                managerMembers.forEach(member => {
                                  assignedMemberIds.add(getEmployeeId(member));
                                });
                              });
                            }

                            const unassignedMembers = (hierarchy.members || []).filter((m: any) =>
                              !assignedMemberIds.has(getEmployeeId(m)) && !isCurrentUserHelper(m, currentUser)
                            );

                            return unassignedMembers.length > 0 ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                  <User className="h-3 w-3" />
                                  Unassigned Members ({unassignedMembers.length})
                                </div>
                                <div className="ml-4 space-y-1">
                                  {unassignedMembers.map(member => (
                                    <EmployeeCheckbox
                                      key={getEmployeeId(member) || member.id}
                                      employee={member}
                                      isSelected={isEmployeeSelected(member)}
                                      onToggle={() => toggleInvitee(getEmployeeId(member))}
                                    />
                                  ))}
                                </div>
                              </div>
                            ) : null;
                          })()}



                          {!hierarchy.departmentHead && hierarchy.managers.length === 0 && hierarchy.members.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                              No team members available in {dept?.name || String(deptId).slice(0,8)}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              
            {errors.invitees && <p className="text-xs text-red-600">{errors.invitees}</p>}
          </div>
          )}

          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
          </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isSubmitting}
              className="px-6 py-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="min-w-[160px] bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {meetingToEdit ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {meetingToEdit ? 'Update Meeting' : 'Create Meeting'}
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Employee Checkbox Component
interface EmployeeCheckboxProps {
  employee: Employee;
  isSelected: boolean;
  onToggle: () => void;
}

function EmployeeCheckbox({ employee, isSelected, onToggle }: EmployeeCheckboxProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'department_head': return <Shield className="h-3 w-3 text-blue-500" />;
      case 'manager': return <Users className="h-3 w-3 text-green-500" />;
      case 'member': return <User className="h-3 w-3 text-gray-500" />;
      default: return <User className="h-3 w-3 text-gray-500" />;
    }
  };

  // Debug: show matching info in console when rendering (temporary)
  try {
    const empAny = employee as any;
    const debugId = empAny && (empAny.id || empAny._id || empAny.user?.id || empAny.user?._id || empAny.email || '');
    // eslint-disable-next-line no-console
    console.log('EmployeeCheckbox render -', { debugId, name: empAny?.name, email: empAny?.email, isSelected });
  } catch (e) {}

  return (
    <div 
      className={`flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
          : 'hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent'
      }`}
    >
      <Checkbox 
        checked={isSelected} 
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
      />
      <div 
        className="flex items-center gap-3 flex-1 cursor-pointer"
        onClick={onToggle}
      >
        <Avatar className="h-9 w-9">
          <AvatarFallback className={`text-xs font-medium ${
            isSelected 
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
              {employee.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
            <span className={`text-sm font-medium truncate ${
              isSelected 
                ? 'text-red-900 dark:text-red-100' 
                : 'text-slate-900 dark:text-slate-100'
            }`}>
              {employee.name}
            </span>
              {getRoleIcon(employee.role)}
            </div>
          <div className={`text-xs truncate ${
            isSelected 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-slate-600 dark:text-slate-400'
          }`}>
            {employee.email}
          </div>
          </div>
        </div>
    </div>
  );
}


