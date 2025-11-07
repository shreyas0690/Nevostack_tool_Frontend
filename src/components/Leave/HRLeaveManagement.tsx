import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Plus,
  FileText,
  Send,
  Check,
  X,
  Search,
  Filter,
  Settings,
  Users,
  Undo2,
  Loader2,
  Edit
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as UICalendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/Auth/AuthProvider';
import { mockLeaveRequests } from '@/data/leaveData';
import { mockUsers, mockDepartments } from '@/data/mockData';
import { leaveService } from '@/services/leaveService';
import { userService } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { leaveTypeConfig, LeaveStatus } from '@/types/leave';
import NewLeaveDialogContent from './NewLeaveDialogContent';

interface LeaveFormData {
  leaveType: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  reason: string;
  emergencyContact: string;
  documents: string;
}

export default function HRLeaveManagement() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState<LeaveFormData>({
    leaveType: '',
    startDate: undefined,
    endDate: undefined,
    reason: '',
    emergencyContact: '',
    documents: ''
  });

  const [hrRequests, setHrRequests] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Filters for manage requests tab
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<string>('');
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string>('');
  const [customRejectionReason, setCustomRejectionReason] = useState<string>('');
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);

  // Dialog states
  const [isNewRequestDialogOpen, setIsNewRequestDialogOpen] = useState(false);

  // Edit form states
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    status: '',
    rejectionReason: ''
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoadingHistory(true);
        const res: any = await leaveService.getLeaves({ userId: currentUser?.id, limit: 200 });
        const fetched = res && (res.leaves || res.data) ? (res.leaves || res.data) : [];
        if (!mounted) return;
        setHrRequests(fetched.map((l: any) => ({
          id: l._id || l.id,
          startDate: new Date(l.startDate),
          endDate: new Date(l.endDate),
          leaveType: l.type || l.leaveType,
          totalDays: l.days || 0,
          reason: l.reason,
          status: l.status,
          appliedDate: new Date(l.createdAt || l.appliedDate),
          rejectionReason: l.rejectionReason || null,
          approvedBy: l.approvedBy || null,
          approvedDate: l.approvedAt ? new Date(l.approvedAt) : null
        })));
      } catch (err) {
        console.error('Load HR leaves failed:', err);
        setHrRequests([]);
      } finally {
        if (mounted) {
          setIsLoadingHistory(false);
        }
      }
    };

    load();
    return () => { mounted = false; };
  }, [currentUser]);

  // Load all requests for management (exact same as admin panel)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        // Use new HR Management API that excludes HR's own requests
        const res: any = await leaveService.getHRManagementLeaves({ limit: 200 });
        console.log('🔍 HR Management API Call Debug:', {
          apiCall: 'leaveService.getHRManagementLeaves({ limit: 200 })',
          currentUserRole: currentUser?.role,
          currentUserId: currentUser?.id,
          companyId: currentUser?.companyId,
          note: 'HR Management API - excludes HR own requests'
        });
        const fetched = res && (res.leaves || res.data) ? (res.leaves || res.data) : [];
        console.log('🔍 HR Management Leave Data Debug:', {
          rawResponse: res,
          fetchedData: fetched,
          fetchedLength: fetched.length,
          currentUser: currentUser,
          note: 'Using HR Management API - excludes HR own requests'
        });
        
        // Additional debug for API response
        console.log('🔍 HR Management API Response Details:', {
          responseKeys: Object.keys(res || {}),
          responseData: res?.data,
          responseLeaves: res?.leaves,
          responseSuccess: res?.success,
          responseMessage: res?.message,
          total: res?.total,
          filters: res?.filters
        });
        if (!mounted) return;
        const mappedRequests = fetched.map((l: any) => ({
          id: l.id || l._id,
          employeeId: l.user?._id || l.userId,
          employeeName: l.user ? `${l.user.firstName || ''} ${l.user.lastName || ''}`.trim() : (l.user?.name || 'Unknown'),
          departmentId: l.departmentId?._id || l.departmentId,
          managerId: l.managerId || null,
          leaveType: l.type,
          startDate: new Date(l.startDate),
          endDate: new Date(l.endDate),
          totalDays: l.days || l.totalDays,
          reason: l.reason,
          status: l.status,
          appliedDate: new Date(l.createdAt),
          approvedDate: l.approvedAt ? new Date(l.approvedAt) : null,
          rejectionReason: l.rejectionReason || null
        }));
        
        console.log('🔍 HR Management Mapped Requests Debug:', {
          mappedRequests: mappedRequests,
          mappedLength: mappedRequests.length,
          sampleRequest: mappedRequests[0],
          note: 'These requests exclude HR own requests'
        });
        
        setRequests(mappedRequests);
        // Load company users for manager/team filtering
        try {
          // Build params separately and cast to any to avoid strict param typing mismatch
          const userParams: any = { limit: 500, companyId: currentUser?.companyId };
          const uRes: any = await userService.getUsers(userParams);
          const users = (uRes && uRes.data) ? uRes.data : [];
          if (mounted) setCompanyUsers(users);
        } catch (uerr) {
          console.warn('Failed to load company users for leave management:', uerr);
          if (mounted) setCompanyUsers([]);
        }
      } catch (err) {
        console.error('Load HR management leaves failed:', err);
        // Fallback to regular API if HR management API fails
        try {
          console.log('🔄 Falling back to regular leaves API...');
          const fallbackRes: any = await leaveService.getLeaves({ limit: 200 });
          const fallbackFetched = fallbackRes && (fallbackRes.leaves || fallbackRes.data) ? (fallbackRes.leaves || fallbackRes.data) : [];
          if (mounted) {
            const fallbackMapped = fallbackFetched.map((l: any) => ({
              id: l.id || l._id,
              employeeId: l.user?._id || l.userId,
              employeeName: l.user ? `${l.user.firstName || ''} ${l.user.lastName || ''}`.trim() : (l.user?.name || 'Unknown'),
              departmentId: l.departmentId?._id || l.departmentId,
              managerId: l.managerId || null,
              leaveType: l.type,
              startDate: new Date(l.startDate),
              endDate: new Date(l.endDate),
              totalDays: l.days || l.totalDays,
              reason: l.reason,
              status: l.status,
              appliedDate: new Date(l.createdAt),
              approvedDate: l.approvedAt ? new Date(l.approvedAt) : null,
              rejectionReason: l.rejectionReason || null
            }));
            setRequests(fallbackMapped);
          }
        } catch (fallbackErr) {
          console.error('Fallback API also failed:', fallbackErr);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  // Get HR's personal leave requests
  const hrLeaveRequests = hrRequests;

  // Use admin's Request Management data structure (same as admin panel)
  const getFilteredRequests = () => {
    let filteredRequests = requests;
    
    console.log('🔍 HR Panel - Using Admin Data Structure:', {
      currentUserRole: currentUser?.role,
      totalRequests: requests.length,
      companyUsers: companyUsers.length
    });
    
    // HR panel now uses admin-level data access (same as admin panel)
    // No role-based filtering - HR sees all requests like admin
    // This replaces the previous "Manage Request" section with admin's "Request Management" data
    console.log('🔓 HR Panel - Showing all requests (Admin level access):', filteredRequests.length);

    // Apply search filter
    if (searchTerm) {
      filteredRequests = filteredRequests.filter(r => 
        r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filteredRequests = filteredRequests.filter(r => r.status === statusFilter);
    }

    return filteredRequests.sort((a, b) => 
      new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
    );
  };

  const filteredLeaveRequests = getFilteredRequests();
  
  console.log('🔍 HR Filtered Requests Debug:', {
    totalRequests: requests.length,
    filteredRequests: filteredLeaveRequests.length,
    searchTerm,
    statusFilter,
    currentUserRole: currentUser?.role,
    companyUsers: companyUsers.length
  });

  const predefinedRejectionReasons = [
    'Insufficient leave balance',
    'Overlapping leave requests',
    'Critical project deadlines',
    'Team availability constraints',
    'Documentation incomplete',
    'Leave policy violation',
    'Business critical period',
    'Other'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'annual': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'sick': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'emergency': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'compensatory': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'maternity': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const timeDiff = formData.endDate.getTime() - formData.startDate.getTime();
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      return dayDiff > 0 ? dayDiff : 0;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        type: formData.leaveType,
        startDate: formData.startDate?.toISOString().split('T')[0],
        endDate: formData.endDate?.toISOString().split('T')[0],
        reason: formData.reason,
        emergencyContact: formData.emergencyContact || '',
        days: calculateDays()
      };

      const res: any = await leaveService.createLeave(payload);
      if (res && res.success) {
        setHrRequests(prev => [{
          id: res.leave?.id || Date.now().toString(),
          startDate: new Date(payload.startDate),
          endDate: new Date(payload.endDate),
          totalDays: payload.days,
          reason: payload.reason,
          status: 'pending',
      appliedDate: new Date(),
          rejectionReason: null,
          approvedBy: null,
          approvedDate: null,
          leaveType: payload.type
        }, ...prev]);

        toast({ title: 'Leave Submitted', description: res.message || 'Leave request submitted.' });
        setFormData({ leaveType: '', startDate: undefined, endDate: undefined, reason: '', emergencyContact: '', documents: '' });
      } else {
        throw new Error(res?.message || 'Submission failed');
      }
    } catch (err: any) {
      console.error('Submit leave failed:', err);
      toast({ title: 'Submission Failed', description: err?.message || 'Could not submit leave request.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof LeaveFormData, value: string | Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApprove = (requestId: string) => {
    (async () => {
      try {
        const res: any = await leaveService.approveLeave(requestId);
        if (res && res.success) {
          setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: 'approved' as LeaveStatus, approvedBy: currentUser?.id, approvedDate: new Date() } : req));
          toast({ title: 'Leave Approved', description: res.message || 'The leave request has been approved successfully.' });
        }
      } catch (err) {
        console.error('Approve failed:', err);
        toast({ title: 'Approve Failed', description: 'Could not approve leave.' });
      }
    })();
  };

  const handleReject = (requestId: string) => {
    const finalReason = selectedRejectionReason === 'Other' 
      ? customRejectionReason.trim() 
      : selectedRejectionReason;
    
    if (!finalReason) {
      toast({
        title: "Rejection Reason Required",
        description: "Please select or provide a reason for rejecting this leave request.",
        variant: "destructive"
      });
      return;
    }
    
    (async () => {
      try {
        const res: any = await leaveService.rejectLeave(requestId, finalReason);
        if (res && res.success) {
          setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: 'rejected' as LeaveStatus, approvedBy: currentUser?.id, approvedDate: new Date(), rejectionReason: finalReason } : req));
          toast({ title: 'Leave Rejected', description: res.message || 'The leave request has been rejected.' });
        }
      } catch (err) {
        console.error('Reject failed:', err);
        toast({ title: 'Reject Failed', description: 'Could not reject leave.' });
      } finally {
        setSelectedRequest('');
    setSelectedRejectionReason('');
    setCustomRejectionReason('');
      }
    })();
  };

  const handleCancel = (requestId: string) => {
    (async () => {
      const reason = prompt('Please enter reason for cancellation (optional)');
      try {
        const res: any = await leaveService.cancelLeave(requestId, reason || '');
        if (res && res.success) {
          setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: 'cancelled' as LeaveStatus, rejectionReason: reason || req.rejectionReason } : req));
          toast({ title: 'Leave Cancelled', description: res.message || 'The leave request has been cancelled.' });
        }
      } catch (err) {
        console.error('Cancel failed:', err);
        toast({ title: 'Cancel Failed', description: 'Could not cancel leave.' });
      }
    })();
  };

  const getStatusBadge = (status: LeaveStatus) => {
    const variants = {
      pending: 'outline',
      approved: 'default',
      rejected: 'destructive',
      cancelled: 'secondary'
    } as const;
    
    return variants[status] || 'outline';
  };

  const handleEdit = (request: any) => {
    setEditingRequest(request);
    setEditForm({
      leaveType: request.leaveType,
      startDate: format(request.startDate, 'yyyy-MM-dd'),
      endDate: format(request.endDate, 'yyyy-MM-dd'),
      reason: request.reason,
      status: request.status,
      rejectionReason: request.rejectionReason || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRequest) {
      toast({ title: 'Error', description: 'No request selected for editing.', variant: 'destructive' });
      return;
    }

    if (!editForm.startDate || !editForm.endDate || !editForm.reason) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    if (['rejected', 'cancelled'].includes(editForm.status) && !(editForm.rejectionReason && editForm.rejectionReason.trim())) {
      toast({ title: 'Reason Required', description: 'Please provide a reason for rejection/cancellation.', variant: 'destructive' });
      return;
    }

    try {
      const payload: any = {
        type: editForm.leaveType,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        reason: editForm.reason,
        status: editForm.status
      };
      if (['rejected', 'cancelled'].includes(editForm.status)) {
        payload.rejectionReason = editForm.rejectionReason;
      }

      const res: any = await leaveService.updateLeave(editingRequest.id, payload);
      if (res && res.success) {
        const startDate = new Date(editForm.startDate);
        const endDate = new Date(editForm.endDate);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        setRequests(prev => prev.map(req => req.id === editingRequest.id ? {
          ...req,
          leaveType: editForm.leaveType as any,
          startDate,
          endDate,
          totalDays,
          reason: editForm.reason.trim(),
          status: editForm.status as LeaveStatus,
          rejectionReason: payload.rejectionReason || req.rejectionReason
        } : req));

        toast({ title: 'Leave Updated', description: res.message || 'The leave request has been updated successfully.' });
        setEditingRequest(null);
      }
    } catch (err) {
      console.error('Save edit failed:', err);
      toast({ title: 'Save Failed', description: 'Could not save changes.' });
    }
  };

  const canApprove = (request: any) => {
    return request.status === 'pending';
  };

  const canEdit = (request: any) => {
    return true; // HR can edit any request
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">
            Apply for leave and manage company-wide leave requests (excluding HR own requests)
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <User className="w-4 h-4 mr-2" />
          HR Panel
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="apply" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="apply" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Leave Apply
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            My History
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Request Management
          </TabsTrigger>
        </TabsList>

        {/* Leave Apply Tab */}
        <TabsContent value="apply">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-indigo-950/20">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Apply for Leave
                  </h2>
                  <p className="text-sm font-normal text-gray-600 dark:text-gray-400 mt-1">
                    Submit your leave request with all necessary details
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Leave Type Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Leave Details</h3>
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Leave Type */}
                    <div className="space-y-3">
                      <Label htmlFor="leaveType" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Leave Type *
                      </Label>
                      <Select value={formData.leaveType} onValueChange={(value) => handleInputChange('leaveType', value)} disabled={isSubmitting}>
                        <SelectTrigger className="h-11 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed">
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="annual" className="cursor-pointer">🏖️ Annual Leave</SelectItem>
                          <SelectItem value="sick" className="cursor-pointer">🏥 Sick Leave</SelectItem>
                          <SelectItem value="emergency" className="cursor-pointer">🚨 Emergency Leave</SelectItem>
                          <SelectItem value="compensatory" className="cursor-pointer">💼 Compensatory Leave</SelectItem>
                          <SelectItem value="maternity" className="cursor-pointer">👶 Maternity Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Emergency Contact */}
                    <div className="space-y-3">
                      <Label htmlFor="emergencyContact" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Emergency Contact
                      </Label>
                    <Input
                      id="emergencyContact"
                      placeholder="Contact number during leave"
                        className="h-11 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      value={formData.emergencyContact}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                        disabled={isSubmitting}
                    />
                    </div>
                  </div>
                </div>

                {/* Date Selection Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Select Dates</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Start Date */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        Start Date *
                      </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                            disabled={isSubmitting}
                          className={cn(
                              "w-full h-11 justify-start text-left font-normal border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed",
                            !formData.startDate && "text-muted-foreground"
                          )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-purple-500" />
                            {formData.startDate ? format(formData.startDate, 'PPP') : 'Pick start date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                          <UICalendar
                          mode="single"
                          selected={formData.startDate}
                          onSelect={(date) => handleInputChange('startDate', date)}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* End Date */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        End Date *
                      </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                            disabled={isSubmitting}
                          className={cn(
                              "w-full h-11 justify-start text-left font-normal border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed",
                            !formData.endDate && "text-muted-foreground"
                          )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-purple-500" />
                            {formData.endDate ? format(formData.endDate, 'PPP') : 'Pick end date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                          <UICalendar
                          mode="single"
                          selected={formData.endDate}
                          onSelect={(date) => handleInputChange('endDate', date)}
                          disabled={(date) => date < (formData.startDate || new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    </div>
                  </div>
                </div>

                {/* Duration Display */}
                {formData.startDate && formData.endDate && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-xl"></div>
                    <div className="relative p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Leave Duration</p>
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {calculateDays()} day{calculateDays() > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reason Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Leave Reason</h3>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="reason" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      Reason for Leave *
                    </Label>
                  <Textarea
                    id="reason"
                      placeholder="Please provide a detailed reason for your leave request. Include any relevant information that will help with approval process..."
                      className="min-h-[120px] border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      💡 Tip: Be specific and provide context to help with faster approval.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setFormData({
                      leaveType: '',
                      startDate: undefined,
                      endDate: undefined,
                      reason: '',
                      emergencyContact: '',
                      documents: ''
                    })}
                    className="h-11 px-6 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Undo2 className="w-4 h-4 mr-2" />
                    Reset Form
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                    Submit Leave Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                My Leave History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <div className="space-y-2">
                        <p className="text-lg font-medium">Loading Leave History</p>
                        <p className="text-sm text-muted-foreground">
                          Fetching your leave requests...
                        </p>
                      </div>
                    </div>
                  </div>
                ) : hrLeaveRequests.length > 0 ? hrLeaveRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {currentUser?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{currentUser?.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`text-xs ${getLeaveTypeColor(request.leaveType)}`}>
                                {request.leaveType.replace('_', ' ')}
                              </Badge>
                              <Badge variant={getStatusColor(request.status)} className="text-xs flex items-center gap-1">
                                {getStatusIcon(request.status)}
                                {request.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{request.totalDays} day{request.totalDays > 1 ? 's' : ''}</p>
                          <p>Applied: {request.appliedDate.toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Leave Period</p>
                          <p className="text-sm">
                            {request.startDate.toLocaleDateString()} - {request.endDate.toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Reason</p>
                          <p className="text-sm">{request.reason}</p>
                        </div>
                      </div>

                      {request.status === 'rejected' && request.rejectionReason && (
                        <div className="pt-4 border-t">
                          <p className="text-sm font-medium text-red-600">Rejection Reason:</p>
                          <p className="text-sm text-muted-foreground">{request.rejectionReason}</p>
                        </div>
                      )}

                      {request.status === 'approved' && request.approvedBy && (
                        <div className="pt-4 border-t">
                          <p className="text-sm text-green-600">
                            Approved on {request.approvedDate?.toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {request.status === 'pending' && (
                        <div className="pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <p className="text-sm text-orange-600">
                              Request is under review
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No leave history found</h3>
                    <p className="text-muted-foreground">
                      You haven't submitted any leave requests yet. Use the "Leave Apply" tab to submit your first request.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Requests Tab */}
        <TabsContent value="manage">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading leave requests...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
                  <p className="text-muted-foreground mt-1">Overview of leave requests, quick actions, and processing</p>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={isNewRequestDialogOpen} onOpenChange={setIsNewRequestDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="px-3">New Request</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                      <NewLeaveDialogContent onClose={() => setIsNewRequestDialogOpen(false)} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                        <p className="text-2xl font-bold">{requests.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">All requests in system</p>
                      </div>
                      <CalendarIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {requests.filter(r => r.status === 'pending').length}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Awaiting processing</p>
                      </div>
                      <Clock className="h-10 w-10 text-amber-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Approved</p>
                        <p className="text-2xl font-bold text-green-600">
                          {requests.filter(r => r.status === 'approved').length}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Processed approvals</p>
                      </div>
                      <Check className="h-10 w-10 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                        <p className="text-2xl font-bold text-red-600">
                          {requests.filter(r => r.status === 'rejected').length}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Requests declined</p>
                      </div>
                      <X className="h-10 w-10 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Leave Requests Management
              </CardTitle>
            </CardHeader>
            <CardContent>
                  <div className="flex gap-4 mb-6 items-center">
                    <div className="flex-1">
                <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                          placeholder="Search by employee name or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                  />
                </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={statusFilter} onValueChange={(value: LeaveStatus | 'all') => setStatusFilter(value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                      <Button variant="outline" size="sm">Filter</Button>
                    </div>
                  </div>

                  {/* Requests List */}
                  <div className="space-y-4">
                    
                    {filteredLeaveRequests.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No leave requests found
                      </div>
                    ) : (
                      filteredLeaveRequests.map((request) => {
                        const leaveConfig = leaveTypeConfig[request.leaveType];
                        
                        return (
                          <div key={request.id} className="border rounded-lg p-4 space-y-3 hover:shadow transition-all">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: leaveConfig.color }}>
                                    <User className="h-5 w-5 text-white" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-lg">{request.employeeName}</span>
                                      <Badge 
                                        style={{ backgroundColor: leaveConfig.color, color: 'white' }}
                                        className="text-xs"
                                      >
                                        {leaveConfig.label}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                      <div className="flex items-center gap-1">
                                        <CalendarIcon className="h-3 w-3" />
                                        {format(request.startDate, 'MMM dd')} - {format(request.endDate, 'MMM dd, yyyy')}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {request.totalDays} day{request.totalDays !== 1 ? 's' : ''}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <p className="text-sm mt-2">{request.reason}</p>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Applied: {format(request.appliedDate, 'MMM dd, yyyy')}
                                  {request.approvedDate && (
                                    <span> • Processed: {format(request.approvedDate, 'MMM dd, yyyy')}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <Badge variant={getStatusBadge(request.status)}>
                                  {request.status.replace('_', ' ')}
                                </Badge>

                                <div className="flex items-center gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleEdit(request)}
                                        disabled={!canEdit(request)}
                                        className={`h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 ${!canEdit(request) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                      <DialogHeader>
                                        <DialogTitle>Edit Leave Request</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <Label htmlFor="edit-leave-type">Leave Type</Label>
                                          <Select value={editForm.leaveType} onValueChange={(value) => setEditForm(prev => ({ ...prev, leaveType: value }))}>
                  <SelectTrigger>
                                              <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                                              {Object.entries(leaveTypeConfig).map(([key, config]) => (
                                                <SelectItem key={key} value={key}>
                                                  {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                            <Label htmlFor="edit-start-date">Start Date</Label>
                                            <Input
                                              id="edit-start-date"
                                              type="date"
                                              value={editForm.startDate}
                                              onChange={(e) => setEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                                            />
                              </div>
                                          <div>
                                            <Label htmlFor="edit-end-date">End Date</Label>
                                            <Input
                                              id="edit-end-date"
                                              type="date"
                                              value={editForm.endDate}
                                              onChange={(e) => setEditForm(prev => ({ ...prev, endDate: e.target.value }))}
                                            />
                          </div>
                        </div>

                          <div>
                                          <Label htmlFor="edit-reason">Reason</Label>
                                          <Textarea
                                            id="edit-reason"
                                            placeholder="Enter reason for leave..."
                                            value={editForm.reason}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, reason: e.target.value }))}
                                            rows={3}
                                          />
                          </div>

                          <div>
                                          <Label htmlFor="edit-status">Status</Label>
                                          <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value, rejectionReason: (value === 'rejected' || value === 'cancelled') ? prev.rejectionReason : '' }))}>
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="pending">Pending</SelectItem>
                                              <SelectItem value="approved">Approved</SelectItem>
                                              <SelectItem value="rejected">Rejected</SelectItem>
                                              <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                          </Select>

                                          {(editForm.status === 'rejected' || editForm.status === 'cancelled') && (
                                            <div className="mt-3 space-y-2">
                                              <Label>Reason</Label>
                                              <Select value={editForm.rejectionReason} onValueChange={(v) => setEditForm(prev => ({ ...prev, rejectionReason: v }))}>
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Select a reason" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {predefinedRejectionReasons.map((reason) => (
                                                    <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                                                  ))}
                                                  <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                              </Select>

                                              {editForm.rejectionReason === 'Other' && (
                                                <Textarea placeholder="Provide custom reason" value={editForm.rejectionReason === 'Other' ? '' : editForm.rejectionReason} onChange={(e) => setEditForm(prev => ({ ...prev, rejectionReason: e.target.value }))} />
                                              )}
                          </div>
                                          )}
                        </div>

                                        <div className="flex gap-2 justify-end">
                                          <Button variant="outline" onClick={() => setEditingRequest(null)}>
                                            Cancel
                                          </Button>
                                          <Button onClick={handleSaveEdit}>
                                            Save Changes
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>

                                  {canApprove(request) && (
                                    <div className="flex gap-1">
                            <Button 
                              size="sm" 
                                        variant="outline"
                              onClick={() => handleApprove(request.id)}
                                        className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                                        <Check className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRequest(request.id);
                                    setSelectedRejectionReason('');
                                    setCustomRejectionReason('');
                                  }}
                                            className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                            <X className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Reject Leave Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                            <div className="text-sm text-muted-foreground">
                                              <p className="font-medium text-foreground mb-2">Employee: {request.employeeName}</p>
                                              <p>Leave Period: {format(request.startDate, 'MMM dd')} - {format(request.endDate, 'MMM dd, yyyy')}</p>
                                              <p>Duration: {request.totalDays} day{request.totalDays !== 1 ? 's' : ''}</p>
                                            </div>
                                            
                                            <div className="space-y-2">
                                              <Label>Reason for Rejection</Label>
                                              <Select 
                                                value={selectedRejectionReason} 
                                                onValueChange={setSelectedRejectionReason}
                                              >
                                      <SelectTrigger>
                                                  <SelectValue placeholder="Select a reason" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {predefinedRejectionReasons.map((reason) => (
                                          <SelectItem key={reason} value={reason}>
                                            {reason}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  {selectedRejectionReason === 'Other' && (
                                              <div className="space-y-2">
                                      <Label>Custom Reason</Label>
                                      <Textarea 
                                                  placeholder="Please specify the reason for rejection..."
                                        value={customRejectionReason}
                                        onChange={(e) => setCustomRejectionReason(e.target.value)}
                                                  rows={3}
                                      />
                                    </div>
                                  )}
                                  
                                            <div className="flex gap-2 justify-end">
                                              <Button 
                                                variant="outline" 
                                                onClick={() => {
                                                  setSelectedRequest('');
                                                  setSelectedRejectionReason('');
                                                  setCustomRejectionReason('');
                                                }}
                                              >
                                      Cancel
                                    </Button>
                                    <Button 
                                                variant="destructive"
                                      onClick={() => handleReject(request.id)}
                                                disabled={
                                                  !selectedRejectionReason || 
                                                  (selectedRejectionReason === 'Other' && !customRejectionReason.trim())
                                                }
                                    >
                                      Reject Request
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}

                                  {request.employeeId === currentUser?.id && request.status === 'pending' && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleCancel(request.id)}
                                      className="h-8 px-3 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {request.rejectionReason && (
                              <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded text-sm">
                                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                                <div>
                                  <span className="font-medium text-destructive">Rejection Reason: </span>
                                  <span className="text-destructive">{request.rejectionReason}</span>
                                </div>
                          </div>
                        )}
                  </div>
                        );
                      })
                )}
              </div>
            </CardContent>
          </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}