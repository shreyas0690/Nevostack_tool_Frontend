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
  Undo2,
  Loader2
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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/Auth/AuthProvider';
import { leaveService } from '@/services/leaveService';
import { useToast } from '@/hooks/use-toast';


interface LeaveFormData {
  leaveType: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  reason: string;
  emergencyContact: string;
  documents: string;
}

export default function HODLeaveManagement() {
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

  const [hodRequests, setHodRequests] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoadingHistory(true);
        const res: any = await leaveService.getLeaves({ userId: currentUser?.id, limit: 200 });
        const fetched = res && (res.leaves || res.data) ? (res.leaves || res.data) : [];
        if (!mounted) return;
        setHodRequests(fetched.map((l: any) => ({
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
        console.error('Load HOD leaves failed:', err);
        setHodRequests([]);
      } finally {
        if (mounted) {
          setIsLoadingHistory(false);
        }
      }
    };

    load();
    return () => { mounted = false; };
  }, [currentUser]);

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

  const { toast } = useToast();

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
        setHodRequests(prev => [{
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">
            Apply for leave and manage your leave requests
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <User className="w-4 h-4 mr-2" />
          HOD Panel
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="apply" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="apply" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Leave Apply
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Leave History
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
                ) : hodRequests.length > 0 ? hodRequests.map((request) => (
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
      </Tabs>
    </div>
  );
}
