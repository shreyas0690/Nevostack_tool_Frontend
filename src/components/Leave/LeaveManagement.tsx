import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { mockLeaveRequests } from '@/data/leaveData';
import { leaveTypeConfig, LeaveStatus } from '@/types/leave';
import { mockUsers, currentUser } from '@/data/mockData';

export default function LeaveManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [requests, setRequests] = useState(mockLeaveRequests);
  
  // Edit form states
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    status: ''
  });

  // Filter requests based on user role
  const getFilteredRequests = () => {
    let filteredRequests = requests;
    
    // Role-based filtering
    if (currentUser.role === 'manager') {
      // Managers see their team's requests
      const teamMembers = mockUsers.filter(u => u.managerId === currentUser.id);
      filteredRequests = filteredRequests.filter(r => teamMembers.some(tm => tm.id === r.employeeId));
    } else if (currentUser.role === 'department_head') {
      // Department heads see all requests in their department
      filteredRequests = filteredRequests.filter(r => r.departmentId === currentUser.departmentId);
    } else if (currentUser.role === 'executive') {
      // Executives see only their own requests
      filteredRequests = filteredRequests.filter(r => r.employeeId === currentUser.id);
    }
    // Super admin and admin see all requests

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
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            status: 'approved' as LeaveStatus, 
            approvedBy: currentUser.id, 
            approvedDate: new Date() 
          }
        : req
    ));
    
    toast({
      title: "Leave Approved",
      description: "The leave request has been approved successfully.",
    });
  };

  const handleReject = (requestId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this leave request.",
        variant: "destructive"
      });
      return;
    }
    
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            status: 'rejected' as LeaveStatus, 
            approvedBy: currentUser.id, 
            approvedDate: new Date(),
            rejectionReason: rejectionReason.trim()
          }
        : req
    ));
    
    toast({
      title: "Leave Rejected",
      description: "The leave request has been rejected.",
    });
    setSelectedRequest(null);
    setRejectionReason('');
  };

  const handleCancel = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: 'cancelled' as LeaveStatus }
        : req
    ));
    
    toast({
      title: "Leave Cancelled",
      description: "The leave request has been cancelled.",
    });
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
      status: request.status
    });
  };

  const handleSaveEdit = () => {
    if (!editingRequest) {
      toast({
        title: "Error",
        description: "No request selected for editing.",
        variant: "destructive"
      });
      return;
    }

    if (!editForm.startDate || !editForm.endDate || !editForm.reason) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const startDate = new Date(editForm.startDate);
    const endDate = new Date(editForm.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    setRequests(prev => prev.map(req => 
      req.id === editingRequest.id 
        ? { 
            ...req, 
            leaveType: editForm.leaveType as any,
            startDate,
            endDate,
            totalDays,
            reason: editForm.reason.trim(),
            status: editForm.status as LeaveStatus
          }
        : req
    ));
    
    toast({
      title: "Leave Updated",
      description: "The leave request has been updated successfully.",
    });
    setEditingRequest(null);
  };

  const canApprove = (request: any) => {
    // Only managers, department heads, admin, and super admin can approve
    return ['manager', 'department_head', 'admin', 'super_admin'].includes(currentUser.role) &&
           request.status === 'pending';
  };

  const canEdit = (request: any) => {
    // Own requests can be edited if pending, or admin/super_admin can edit any
    return (request.employeeId === currentUser.id && request.status === 'pending') ||
           ['admin', 'super_admin'].includes(currentUser.role);
  };

  const filteredRequests = getFilteredRequests();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {requests.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {requests.filter(r => r.status === 'rejected').length}
                </p>
              </div>
              <X className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Requests Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
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
          </div>

          {/* Requests List */}
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leave requests found
              </div>
            ) : (
              filteredRequests.map((request) => {
                const leaveConfig = leaveTypeConfig[request.leaveType];
                
                return (
                  <div key={request.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{request.employeeName}</span>
                          <Badge 
                            style={{ backgroundColor: leaveConfig.color, color: 'white' }}
                            className="text-xs"
                          >
                            {leaveConfig.label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(request.startDate, 'MMM dd')} - {format(request.endDate, 'MMM dd, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {request.totalDays} day{request.totalDays !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        <p className="text-sm">{request.reason}</p>
                        
                        <div className="text-xs text-muted-foreground">
                          Applied: {format(request.appliedDate, 'MMM dd, yyyy')}
                          {request.approvedDate && (
                            <span> • Processed: {format(request.approvedDate, 'MMM dd, yyyy')}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadge(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                        
                        {canEdit(request) && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEdit(request)}
                                className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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

                                {['admin', 'super_admin'].includes(currentUser.role) && (
                                  <div>
                                    <Label htmlFor="edit-status">Status</Label>
                                    <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
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
                                  </div>
                                )}

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
                        )}

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
                                  onClick={() => setSelectedRequest(request.id)}
                                  className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Leave Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p className="text-sm text-muted-foreground">
                                    Please provide a reason for rejecting {request.employeeName}'s leave request:
                                  </p>
                                  <Textarea
                                    placeholder="Enter rejection reason..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={3}
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                                      Cancel
                                    </Button>
                                    <Button 
                                      variant="destructive"
                                      onClick={() => handleReject(request.id)}
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
                            className="h-8 px-3 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            Cancel
                          </Button>
                        )}
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
  );
}