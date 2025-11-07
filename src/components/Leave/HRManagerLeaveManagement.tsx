import { useState } from 'react';
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
  Users
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
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

interface LeaveFormData {
  leaveType: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  reason: string;
  emergencyContact: string;
  documents: string;
  selectedUserId?: string;
}

export default function HRManagerLeaveManagement() {
  const { currentUser } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<LeaveFormData>({
    leaveType: '',
    startDate: undefined,
    endDate: undefined,
    reason: '',
    emergencyContact: '',
    documents: ''
  });
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Filters for manage requests tab
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<string>('');
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string>('');
  const [customRejectionReason, setCustomRejectionReason] = useState<string>('');

  // Get HR Manager's personal leave requests
  const hrManagerLeaveRequests = mockLeaveRequests.filter(request =>
    request.employeeId === currentUser?.id
  );

  // Get all leave requests for management (HR Manager can see all)
  const allLeaveRequests = mockLeaveRequests;

  // Filter leave requests for manage tab
  const filteredLeaveRequests = allLeaveRequests.filter(request => {
    const employee = mockUsers.find(u => u.id === request.employeeId);
    const matchesSearch = employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.leaveType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || employee?.departmentId === departmentFilter;
    const matchesType = typeFilter === 'all' || request.leaveType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesType;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      alert('Please fill in all required fields');
      return;
    }

    // Here you would normally submit to an API
    const employeeId = selectedUserId || currentUser?.id;
    const employeeName = mockUsers.find(u => u.id === employeeId)?.name || currentUser?.name;

    console.log('Leave request submitted:', {
      ...formData,
      totalDays: calculateDays(),
      employeeId,
      employeeName,
      appliedDate: new Date(),
      status: 'pending'
    });

    alert('Leave request submitted successfully!');
    
    // Reset form
    setFormData({
      leaveType: '',
      startDate: undefined,
      endDate: undefined,
      reason: '',
      emergencyContact: '',
      documents: ''
    });
  };

  const handleInputChange = (field: keyof LeaveFormData, value: string | Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApprove = (requestId: string) => {
    console.log('Approving request:', requestId);
    alert('Leave request approved successfully!');
  };

  const handleReject = (requestId: string) => {
    const reason = selectedRejectionReason === 'Other' ? customRejectionReason : selectedRejectionReason;
    console.log('Rejecting request:', requestId, 'Reason:', reason);
    alert(`Leave request rejected. Reason: ${reason}`);
    setSelectedRejectionReason('');
    setCustomRejectionReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">
            Apply for leave and manage company-wide leave requests
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <User className="w-4 h-4 mr-2" />
          HR Manager Panel
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
            Manage Requests
          </TabsTrigger>
        </TabsList>

        {/* Leave Apply Tab */}
        <TabsContent value="apply">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Apply for Leave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Leave Type */}
                  <div className="space-y-2">
                    <Label htmlFor="leaveType">Leave Type *</Label>
                    <Select value={formData.leaveType} onValueChange={(value) => handleInputChange('leaveType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Annual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="emergency">Emergency Leave</SelectItem>
                        <SelectItem value="compensatory">Compensatory Leave</SelectItem>
                        <SelectItem value="maternity">Maternity Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      placeholder="Contact number during leave"
                      value={formData.emergencyContact}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    />
                  </div>
                  
                  {/* User Selector for HR/Admin */}
                  <div className="space-y-2">
                    <Label htmlFor="userSelect">Apply On Behalf Of (optional)</Label>
                    <Select value={selectedUserId} onValueChange={(value) => setSelectedUserId(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user (leave blank for yourself)" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-3 w-full">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{user.name}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Select a user to create the leave on their behalf.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startDate ? format(formData.startDate, "PPP") : "Pick start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
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
                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endDate ? format(formData.endDate, "PPP") : "Pick end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
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

                {/* Duration Display */}
                {formData.startDate && formData.endDate && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        Total Leave Duration: {calculateDays()} day{calculateDays() > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Leave *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Please provide a detailed reason for your leave request..."
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Documents */}
                <div className="space-y-2">
                  <Label htmlFor="documents">Supporting Documents</Label>
                  <Input
                    id="documents"
                    placeholder="List any supporting documents (if applicable)"
                    value={formData.documents}
                    onChange={(e) => handleInputChange('documents', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Medical certificates, travel documents, etc.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
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
                  >
                    Reset Form
                  </Button>
                  <Button type="submit" className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit Leave Request
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
                {hrManagerLeaveRequests.length > 0 ? hrManagerLeaveRequests.map((request) => (
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Manage All Leave Requests
                <Badge variant="secondary" className="ml-2">
                  HR Manager Authority
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="annual">Annual Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="emergency">Emergency Leave</SelectItem>
                    <SelectItem value="compensatory">Compensatory Leave</SelectItem>
                    <SelectItem value="maternity">Maternity Leave</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {mockDepartments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDepartmentFilter('all');
                    setTypeFilter('all');
                  }}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Clear
                </Button>
              </div>

              {/* Leave Requests List */}
              <div className="space-y-4">
                {filteredLeaveRequests.length > 0 ? filteredLeaveRequests.map((request) => {
                  const employee = mockUsers.find(u => u.id === request.employeeId);
                  const department = mockDepartments.find(d => d.id === employee?.departmentId);
                  
                  return (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {employee?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{employee?.name}</h3>
                              <p className="text-sm text-muted-foreground">{department?.name}</p>
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

                        {request.status === 'pending' && (
                          <div className="flex gap-2 pt-4 border-t">
                            <Button 
                              size="sm" 
                              onClick={() => handleApprove(request.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="h-4 w-4 mr-1" />
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
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Reject Leave Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Rejection Reason</Label>
                                    <Select value={selectedRejectionReason} onValueChange={setSelectedRejectionReason}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select reason" />
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
                                    <div>
                                      <Label>Custom Reason</Label>
                                      <Textarea 
                                        value={customRejectionReason}
                                        onChange={(e) => setCustomRejectionReason(e.target.value)}
                                        placeholder="Please provide a specific reason..."
                                      />
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setSelectedRejectionReason('')}>
                                      Cancel
                                    </Button>
                                    <Button 
                                      onClick={() => handleReject(request.id)}
                                      disabled={!selectedRejectionReason || (selectedRejectionReason === 'Other' && !customRejectionReason)}
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      Reject Request
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}

                        {request.status === 'rejected' && request.rejectionReason && (
                          <div className="pt-4 border-t">
                            <p className="text-sm font-medium text-red-600">Rejection Reason:</p>
                            <p className="text-sm text-muted-foreground">{request.rejectionReason}</p>
                          </div>
                        )}

                        {request.status === 'approved' && (
                          <div className="pt-4 border-t">
                            <p className="text-sm text-green-600">
                              ✓ Approved on {request.approvedDate?.toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                }) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No leave requests found</h3>
                    <p className="text-muted-foreground">
                      No leave requests match your current filter criteria.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}