import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Filter,
  Check,
  X,
  Eye,
  Calendar,
  User,
  Clock,
  AlertCircle,
  Edit,
  CalendarDays,
  Users,
  FileText,
  TrendingUp,
  Plus,
  CheckCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { leaveService } from '@/services/leaveService';
import { leaveTypeConfig, LeaveStatus } from '@/types/leave';
import { useAuth } from '@/components/Auth/AuthProvider';
import { userService } from '@/services/userService';
import NewLeaveDialogContent from './NewLeaveDialogContent';

const predefinedRejectionReasons = [
  'Insufficient leave balance',
  'Business critical period - operations cannot be disrupted',
  'Too many team members already on leave during this period',
  'Advance notice period not met (minimum 48 hours required)',
  'Peak business season - all hands required',
  'Client commitments during requested period',
  'Documentation incomplete or insufficient',
  'Previous leave request conflicts',
  'Other'
];

interface LeaveManagementProps {
  showHeader?: boolean;
  onTotalRequestsChange?: (count: number) => void;
}

export default function LeaveManagement({ showHeader = true, onTotalRequestsChange }: LeaveManagementProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedRejectionReason, setSelectedRejectionReason] = useState('');
  const [customRejectionReason, setCustomRejectionReason] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const res: any = await leaveService.getLeaves({ limit: 200 });
        const fetched = res && (res.leaves || res.data) ? (res.leaves || res.data) : [];

        if (!mounted) return;
        setRequests(fetched.map((l: any) => ({
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
        })));

        // Load company users for manager/team filtering
        try {
          const userParams: any = { limit: 500, companyId: currentUser?.companyId };
          const uRes: any = await userService.getUsers(userParams);
          const users = (uRes && uRes.data) ? uRes.data : [];
          if (mounted) setCompanyUsers(users);
        } catch (uerr) {
          console.warn('Failed to load company users for leave management:', uerr);
          if (mounted) setCompanyUsers([]);
        }
      } catch (err) {
        console.error('Load leaves failed:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();

    // Listen for WebSocket notifications to auto-refresh
    const handleNotification = (event: any) => {
      const notification = event.detail;
      if (
        notification.type === 'leave_request' ||
        notification.type === 'leave_approved' ||
        notification.type === 'leave_rejected' ||
        notification.type === 'leave_cancelled'
      ) {
        console.log('🔄 Refreshing admin leave management due to notification:', notification.type);
        load();

        // Show toast for the update
        toast({
          title: 'Update Received',
          description: notification.message || 'Leave requests have been updated.',
        });
      }
    };

    window.addEventListener('websocket-notification', handleNotification as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('websocket-notification', handleNotification as EventListener);
    };
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    onTotalRequestsChange?.(requests.length);
  }, [requests.length, onTotalRequestsChange]);

  if (isLoading) {
    return (
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
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Loading Leave Management</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Fetching your leave data...</p>
          <div className="flex justify-center space-x-1 mt-4">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Filter requests based on user role
  const getFilteredRequests = () => {
    let filteredRequests = requests;

    // Role-based filtering
    if (currentUser.role === 'manager') {
      const teamMembers = companyUsers.filter(u => u.managerId === currentUser.id).map(u => u.id);
      filteredRequests = filteredRequests.filter(r => teamMembers.includes(r.employeeId));
    } else if (currentUser.role === 'department_head') {
      filteredRequests = filteredRequests.filter(r => r.departmentId === currentUser.departmentId);
    } else if (currentUser.role === 'member') {
      filteredRequests = filteredRequests.filter(r => r.employeeId === currentUser.id);
    }

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

  const handleApprove = (requestId: string) => {
    (async () => {
      try {
        const res: any = await leaveService.approveLeave(requestId);
        if (res && res.success) {
          setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: 'approved' as LeaveStatus, approvedBy: currentUser.id, approvedDate: new Date() } : req));
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
          setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: 'rejected' as LeaveStatus, approvedBy: currentUser.id, approvedDate: new Date(), rejectionReason: finalReason } : req));
          toast({ title: 'Leave Rejected', description: res.message || 'The leave request has been rejected.' });
        }
      } catch (err) {
        console.error('Reject failed:', err);
        toast({ title: 'Reject Failed', description: 'Could not reject leave.' });
      } finally {
        setSelectedRequest(null);
        setSelectedRejectionReason('');
        setCustomRejectionReason('');
        setRejectionReason('');
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
    setIsEditDialogOpen(true);
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

    setIsSavingEdit(true);
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

        toast({
          title: 'Leave Request Updated Successfully! ✅',
          description: res.message || 'The leave request has been updated successfully.'
        });
        setEditingRequest(null);
        setIsEditDialogOpen(false);
      }
    } catch (err) {
      console.error('Save edit failed:', err);
      toast({
        title: 'Failed to Update Leave Request ❌',
        description: 'Could not save changes. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCloseEdit = () => {
    setEditingRequest(null);
    setIsEditDialogOpen(false);
    setEditForm({
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: '',
      status: '',
      rejectionReason: ''
    });
  };

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;

    setIsDeleting(true);
    try {
      const res: any = await leaveService.deleteLeave(requestToDelete.id);
      if (res && res.success) {
        setRequests(prev => prev.filter(req => req.id !== requestToDelete.id));
        toast({
          title: 'Leave Request Deleted Successfully! 🗑️',
          description: res.message || 'The leave request has been deleted successfully.'
        });
        setRequestToDelete(null);
        setShowDeleteDialog(false);
      } else {
        throw new Error(res?.message || 'Delete failed');
      }
    } catch (err: any) {
      console.error('Delete leave failed:', err);
      toast({
        title: 'Failed to Delete Leave Request ❌',
        description: err?.message || 'Could not delete leave request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (request: any) => {
    setRequestToDelete(request);
    setShowDeleteDialog(true);
  };

  const canApprove = (request: any) => {
    return ['manager', 'department_head', 'admin', 'super_admin'].includes(currentUser.role) &&
      request.status === 'pending';
  };

  const canEdit = (request: any) => {
    if (['admin', 'super_admin'].includes(currentUser.role)) return true;
    if (request.employeeId === currentUser.id) return true;
    if (currentUser.role === 'manager') {
      const teamMembers = companyUsers.filter(u => u.managerId === currentUser.id).map(u => u.id);
      return teamMembers.includes(request.employeeId);
    }
    if (currentUser.role === 'department_head') {
      return request.departmentId === currentUser.departmentId;
    }
    return false;
  };

  const canDelete = (request: any) => {
    // Only admin and super_admin can delete leave requests
    if (['admin', 'super_admin'].includes(currentUser.role)) return true;
    // Users can delete their own pending requests
    if (request.employeeId === currentUser.id && request.status === 'pending') return true;
    return false;
  };

  const filteredRequests = getFilteredRequests();

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
        {showHeader && (
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-50/80 via-red-50/40 to-transparent dark:from-red-900/20 dark:via-red-900/10 dark:to-transparent rounded-xl"></div>
            <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg shadow-red-500/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                  <div className="relative">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 dark:from-red-400 dark:via-red-500 dark:to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                      <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 bg-green-500 rounded-full border-2 sm:border-3 border-white dark:border-slate-800 flex items-center justify-center">
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                      <span className="hidden sm:inline">Leave Management</span>
                      <span className="sm:hidden">Leave Management</span>
                    </h1>
                    <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400">
                      <span className="hidden sm:inline">Manage leave requests, track balances, and view team availability</span>
                      <span className="sm:hidden">Manage leave requests and track balances</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                      <div className="flex items-center gap-1 sm:gap-2 text-xs text-slate-500 dark:text-slate-500">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full"></div>
                        <span className="hidden sm:inline">System Active</span>
                        <span className="sm:hidden">Active</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 text-xs text-slate-500 dark:text-slate-500">
                        <Users className="h-3 w-3" />
                        <span className="hidden sm:inline">{requests.length} Total Requests</span>
                        <span className="sm:hidden">{requests.length} Requests</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => setShowNewRequestDialog(true)}
                        className="group relative px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
                        <span>New Request</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <NewLeaveDialogContent onClose={() => setShowNewRequestDialog(false)} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <Card className="group border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                        <span className="hidden sm:inline">Total Requests</span>
                        <span className="sm:hidden">Total</span>
                      </p>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mt-1 sm:mt-2">{requests.length}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 sm:mt-2">
                        <span className="hidden sm:inline">All requests in system</span>
                        <span className="sm:hidden">All requests</span>
                      </p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Pending</p>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-600 dark:text-amber-400 mt-1 sm:mt-2">
                        {requests.filter(r => r.status === 'pending').length}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 sm:mt-2">
                        <span className="hidden sm:inline">Awaiting processing</span>
                        <span className="sm:hidden">Awaiting</span>
                      </p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Approved</p>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600 dark:text-green-400 mt-1 sm:mt-2">
                        {requests.filter(r => r.status === 'approved').length}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 sm:mt-2">
                        <span className="hidden sm:inline">Processed approvals</span>
                        <span className="sm:hidden">Approved</span>
                      </p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Check className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Rejected</p>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600 dark:text-red-400 mt-1 sm:mt-2">
                        {requests.filter(r => r.status === 'rejected').length}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 sm:mt-2">
                        <span className="hidden sm:inline">Requests declined</span>
                        <span className="sm:hidden">Declined</span>
                      </p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <X className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-6">
                <CardTitle className="flex items-center gap-2 sm:gap-3 lg:gap-4 text-slate-900 dark:text-slate-100">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold">
                      <span className="hidden sm:inline">Leave Requests Management</span>
                      <span className="sm:hidden">Requests</span>
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400">
                      <span className="hidden sm:inline">Filter and search through leave requests</span>
                      <span className="sm:hidden">Filter and search requests</span>
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 items-center">
                  <div className="flex-1 w-full">
                    <div className="relative">
                      <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                      <Input
                        placeholder="Search by employee name or reason..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 sm:pl-12 h-9 sm:h-10 lg:h-12 border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400 rounded-lg sm:rounded-xl text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    <Select value={statusFilter} onValueChange={(value: LeaveStatus | 'all') => setStatusFilter(value)}>
                      <SelectTrigger className="w-full sm:w-40 lg:w-48 h-9 sm:h-10 lg:h-12 border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400 rounded-lg sm:rounded-xl text-sm sm:text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-sm sm:text-base">All Status</SelectItem>
                        <SelectItem value="pending" className="text-sm sm:text-base">Pending</SelectItem>
                        <SelectItem value="approved" className="text-sm sm:text-base">Approved</SelectItem>
                        <SelectItem value="rejected" className="text-sm sm:text-base">Rejected</SelectItem>
                        <SelectItem value="cancelled" className="text-sm sm:text-base">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="h-9 sm:h-10 lg:h-12 px-4 sm:px-6 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base">
                      <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Apply Filter</span>
                      <span className="sm:hidden">Filter</span>
                    </Button>
                  </div>
                </div>

                {/* Requests List */}
                <div className="space-y-3 sm:space-y-4">
                  {filteredRequests.length === 0 ? (
                    <div className="flex items-center justify-center py-8 sm:py-12">
                      <div className="text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                          {requests.length === 0 ? 'No leave requests found' : 'No leave requests match your search'}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                          {requests.length === 0 ? 'Start by creating your first leave request' : 'Try adjusting your search criteria'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    paginatedRequests.map((request) => {
                      const leaveConfig = leaveTypeConfig[request.leaveType] || {
                        label: 'Unknown Leave',
                        color: '#6B7280',
                        maxDays: 0
                      };

                      return (
                        <div key={request.id} className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4 hover:shadow-md transition-shadow duration-200 overflow-hidden">

                          <div className="relative">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                              <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div className="relative">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: leaveConfig.color }}>
                                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-white dark:bg-slate-800 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full"></div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                      <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                                        {request.employeeName}
                                      </h3>
                                      <Badge
                                        style={{ backgroundColor: leaveConfig.color, color: 'white' }}
                                        className="text-xs px-2 sm:px-3 py-1 rounded-full font-medium"
                                      >
                                        {leaveConfig.label}
                                      </Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                      <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span className="font-medium">{format(request.startDate, 'MMM dd')} - {format(request.endDate, 'MMM dd, yyyy')}</span>
                                      </div>
                                      <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span className="font-medium">{request.totalDays} day{request.totalDays !== 1 ? 's' : ''}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="ml-0 sm:ml-12 lg:ml-16">
                                  <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                                    <div className="flex items-start gap-2">
                                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-50 dark:bg-red-900/30 rounded-md flex items-center justify-center flex-shrink-0">
                                        <FileText className="h-3 w-3 text-red-600 dark:text-red-400" />
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">Reason</h4>
                                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{request.reason}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-500 dark:text-slate-500 mt-2">
                                    <span className="flex items-center gap-1">
                                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full"></div>
                                      Applied: {format(request.appliedDate, 'MMM dd, yyyy')}
                                    </span>
                                    {request.approvedDate && (
                                      <span className="flex items-center gap-1">
                                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full"></div>
                                        Processed: {format(request.approvedDate, 'MMM dd, yyyy')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col sm:items-end gap-2 sm:gap-3">
                                <Badge
                                  variant={getStatusBadge(request.status)}
                                  className="px-3 sm:px-4 py-1 sm:py-1.5 text-xs font-semibold rounded-full"
                                >
                                  {request.status.replace('_', ' ')}
                                </Badge>

                                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(request)}
                                    disabled={!canEdit(request)}
                                    className={`h-7 sm:h-8 px-2 sm:px-3 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium ${!canEdit(request) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    <span className="hidden sm:inline">Edit</span>
                                    <span className="sm:hidden">Edit</span>
                                  </Button>

                                  {canDelete(request) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteClick(request)}
                                      className="h-7 sm:h-8 px-2 sm:px-3 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xs font-medium"
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      <span className="hidden sm:inline">Delete</span>
                                      <span className="sm:hidden">Delete</span>
                                    </Button>
                                  )}

                                  {canApprove(request) && (
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleApprove(request.id)}
                                        className="h-7 sm:h-8 px-2 sm:px-3 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg text-xs font-medium"
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        <span className="hidden sm:inline">Approve</span>
                                        <span className="sm:hidden">Approve</span>
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
                                            className="h-7 sm:h-8 px-2 sm:px-3 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xs font-medium"
                                          >
                                            <X className="h-3 w-3 mr-1" />
                                            <span className="hidden sm:inline">Reject</span>
                                            <span className="sm:hidden">Reject</span>
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
                                                  setSelectedRequest(null);
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

                                  {request.employeeId === currentUser.id && request.status === 'pending' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCancel(request.id)}
                                      className="h-7 sm:h-8 px-2 sm:px-3 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg text-xs font-medium"
                                    >
                                      <span className="hidden sm:inline">Cancel</span>
                                      <span className="sm:hidden">Cancel</span>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {request.rejectionReason && (
                            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                              <div className="flex items-start gap-2 sm:gap-3">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-100 dark:bg-red-900/40 rounded-md flex items-center justify-center flex-shrink-0">
                                  <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-xs font-bold text-red-800 dark:text-red-200 mb-1">Rejection Reason</h4>
                                  <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">{request.rejectionReason}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Pagination */}
                {filteredRequests.length > 0 && totalPages > 1 && (
                  <div className="flex items-center justify-center pt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800'}
                          />
                        </PaginationItem>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className={`cursor-pointer ${currentPage === page
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Leave Request Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                      <Edit className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
                        <span className="hidden sm:inline">Edit Leave Request</span>
                        <span className="sm:hidden">Edit Request</span>
                      </DialogTitle>
                      <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
                        <span className="hidden sm:inline">Modify leave request details and status</span>
                        <span className="sm:hidden">Modify request details</span>
                      </p>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 sm:space-y-6">
                  {/* Leave Details */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 sm:p-4 lg:p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                        <span className="hidden sm:inline">Leave Details</span>
                        <span className="sm:hidden">Details</span>
                      </h3>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                          <span className="hidden sm:inline">Leave Type</span>
                          <span className="sm:hidden">Type</span>
                        </Label>
                        <Select value={editForm.leaveType} onValueChange={(value) => setEditForm(prev => ({ ...prev, leaveType: value }))}>
                          <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400 h-9 sm:h-10 text-sm sm:text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(leaveTypeConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key} className="text-sm sm:text-base">
                                <div className="flex items-center gap-2">
                                  <span>📅</span>
                                  <span>{config.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                            <span className="hidden sm:inline">Start Date</span>
                            <span className="sm:hidden">Start</span>
                          </Label>
                          <Input
                            type="date"
                            value={editForm.startDate}
                            onChange={(e) => setEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                            className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400 h-9 sm:h-10 text-sm sm:text-base"
                          />
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                            <span className="hidden sm:inline">End Date</span>
                            <span className="sm:hidden">End</span>
                          </Label>
                          <Input
                            type="date"
                            value={editForm.endDate}
                            onChange={(e) => setEditForm(prev => ({ ...prev, endDate: e.target.value }))}
                            className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400 h-9 sm:h-10 text-sm sm:text-base"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                          <span className="hidden sm:inline">Reason for Leave</span>
                          <span className="sm:hidden">Reason</span>
                        </Label>
                        <Textarea
                          placeholder="Enter reason for leave..."
                          value={editForm.reason}
                          onChange={(e) => setEditForm(prev => ({ ...prev, reason: e.target.value }))}
                          rows={3}
                          className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400 text-sm sm:text-base"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status Management (Admin Only) */}
                  {['admin', 'super_admin'].includes(currentUser.role) && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 sm:p-4 lg:p-6 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                          <span className="hidden sm:inline">Status Management</span>
                          <span className="sm:hidden">Status</span>
                        </h3>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Status</Label>
                          <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value, rejectionReason: (value === 'rejected' || value === 'cancelled') ? prev.rejectionReason : '' }))}>
                            <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400 h-9 sm:h-10 text-sm sm:text-base">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending" className="text-sm sm:text-base">Pending</SelectItem>
                              <SelectItem value="approved" className="text-sm sm:text-base">Approved</SelectItem>
                              <SelectItem value="rejected" className="text-sm sm:text-base">Rejected</SelectItem>
                              <SelectItem value="cancelled" className="text-sm sm:text-base">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {(editForm.status === 'rejected' || editForm.status === 'cancelled') && (
                          <div className="space-y-2">
                            <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Reason</Label>
                            <Select value={editForm.rejectionReason} onValueChange={(v) => setEditForm(prev => ({ ...prev, rejectionReason: v }))}>
                              <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400 h-9 sm:h-10 text-sm sm:text-base">
                                <SelectValue placeholder="Select a reason" />
                              </SelectTrigger>
                              <SelectContent>
                                {predefinedRejectionReasons.map((reason) => (
                                  <SelectItem key={reason} value={reason} className="text-sm sm:text-base">{reason}</SelectItem>
                                ))}
                                <SelectItem value="Other" className="text-sm sm:text-base">Other</SelectItem>
                              </SelectContent>
                            </Select>

                            {editForm.rejectionReason === 'Other' && (
                              <Textarea
                                placeholder="Provide custom reason"
                                value={editForm.rejectionReason === 'Other' ? '' : editForm.rejectionReason}
                                onChange={(e) => setEditForm(prev => ({ ...prev, rejectionReason: e.target.value }))}
                                className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400 text-sm sm:text-base"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      variant="outline"
                      onClick={handleCloseEdit}
                      disabled={isSavingEdit}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base"
                    >
                      <span className="hidden sm:inline">Cancel</span>
                      <span className="sm:hidden">Cancel</span>
                    </Button>
                    <Button
                      onClick={handleSaveEdit}
                      disabled={isSavingEdit}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25 rounded-lg sm:rounded-xl font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm sm:text-base"
                    >
                      {isSavingEdit ? (
                        <>
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                          <span className="hidden sm:inline">Saving Changes...</span>
                          <span className="sm:hidden">Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Save Changes</span>
                          <span className="sm:hidden">Save</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    Delete Leave Request
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                    Are you sure you want to delete this leave request? This action cannot be undone.
                    {requestToDelete && (
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          Employee: {requestToDelete.employeeName}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Leave Type: {leaveTypeConfig[requestToDelete.leaveType]?.label || requestToDelete.leaveType}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Period: {format(requestToDelete.startDate, 'MMM dd')} - {format(requestToDelete.endDate, 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Status: {requestToDelete.status}
                        </p>
                      </div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => {
                      setRequestToDelete(null);
                      setShowDeleteDialog(false);
                    }}
                    disabled={isDeleting}
                    className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteRequest}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Request
                      </>
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
    </div>
  );
}
