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
  Loader2,
  Phone,
  ClipboardList
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Calculate statistics
  const stats = {
    total: hodRequests.length,
    pending: hodRequests.filter(r => r.status === 'pending').length,
    approved: hodRequests.filter(r => r.status === 'approved').length,
    rejected: hodRequests.filter(r => r.status === 'rejected').length
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
          >
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Leave Management</h1>
            <p className="text-muted-foreground text-sm">
              Apply for leave and track your request history
            </p>
          </div>
        </div>
        <Badge variant="outline" className="px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
          <User className="w-4 h-4 mr-2" />
          HOD Panel
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 opacity-50" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Leaves</CardTitle>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">All time requests</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-orange-100 dark:bg-orange-900/20 opacity-50" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.pending}</div>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/20 opacity-50" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{stats.approved}</div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">Successfully granted</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-red-100 dark:bg-red-900/20 opacity-50" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.rejected}</div>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">Declined requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="apply" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70 shadow-inner">
          <TabsTrigger value="apply" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900">
            <Plus className="w-4 h-4" />
            Leave Apply
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900">
            <FileText className="w-4 h-4" />
            Leave History
          </TabsTrigger>
        </TabsList>

        {/* Leave Apply Tab */}
        <TabsContent value="apply">
          <div className="grid grid-cols-1 gap-6">
            {/* Main Form Section */}
            <div>
              <Card className="relative overflow-hidden border border-slate-200/70 dark:border-slate-800/70 shadow-xl bg-white/90 dark:bg-slate-900/70 backdrop-blur">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.12),transparent_50%)]" />
                <CardHeader className="relative z-10 overflow-hidden bg-gradient-to-r from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900/70 dark:to-slate-900 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="absolute inset-y-0 right-0 w-40 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_70%)]" />
                  <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-blue-100/80 dark:bg-blue-900/30 p-2.5">
                        <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                          New Leave Request
                        </CardTitle>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Quick form for your next leave request.
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="w-fit rounded-full border-blue-200/70 bg-white/80 text-xs text-blue-700 dark:border-blue-900/50 dark:bg-slate-900/60 dark:text-blue-300">
                      HOD Request
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 p-6">
                  <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-6">
                    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/80 dark:bg-slate-900/50 p-5 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <ClipboardList className="h-4 w-4" />
                        </span>
                        Request Guide
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/60 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Leave Type</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formData.leaveType
                              ? `${formData.leaveType.charAt(0).toUpperCase()}${formData.leaveType.slice(1).replace('_', ' ')}`
                              : 'Not selected'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/60 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Duration</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {calculateDays()} day{calculateDays() !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/60 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Dates</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formData.startDate && formData.endDate
                              ? `${format(formData.startDate, 'MMM d')} - ${format(formData.endDate, 'MMM d')}`
                              : 'Select dates'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-dashed border-slate-300/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/50 p-3 text-[11px] text-muted-foreground">
                          <p className="font-semibold text-slate-700 dark:text-slate-200">Quick tips</p>
                          <ul className="mt-2 space-y-1">
                            <li>Keep the reason short and clear.</li>
                            <li>Double-check start and end dates.</li>
                            <li>Emergency leave needs details.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Leave Type & Contact */}
                      <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/60 p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.7)]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                              <User className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Leave Details</p>
                              <p className="text-xs text-muted-foreground">Type and emergency contact</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[11px]">Step 1</Badge>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="leaveType" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Leave Type
                            </Label>
                            <Select value={formData.leaveType} onValueChange={(value) => handleInputChange('leaveType', value)} disabled={isSubmitting}>
                              <SelectTrigger className="h-11 bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all">
                                <SelectValue placeholder="Select type" />
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

                          <div className="space-y-2">
                            <Label htmlFor="emergencyContact" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Emergency Contact
                            </Label>
                            <Input
                              id="emergencyContact"
                              placeholder="+91 98765 43210"
                              className="h-11 bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 shadow-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                              value={formData.emergencyContact}
                              onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Date Selection */}
                      <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/60 p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.7)]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                              <CalendarIcon className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Duration</p>
                              <p className="text-xs text-muted-foreground">Start and end dates</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[11px]">Step 2</Badge>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  disabled={isSubmitting}
                                  className={cn(
                                    "w-full h-11 justify-start text-left font-normal bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 hover:bg-white dark:hover:bg-slate-950 focus:ring-2 focus:ring-purple-500 transition-all",
                                    !formData.startDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4 text-purple-500" />
                                  {formData.startDate ? format(formData.startDate, 'PPP') : 'Select start date'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
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

                          <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">End Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  disabled={isSubmitting}
                                  className={cn(
                                    "w-full h-11 justify-start text-left font-normal bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 hover:bg-white dark:hover:bg-slate-950 focus:ring-2 focus:ring-purple-500 transition-all",
                                    !formData.endDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4 text-purple-500" />
                                  {formData.endDate ? format(formData.endDate, 'PPP') : 'Select end date'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
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

                      {/* Reason */}
                      <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/60 p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.7)]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                              <FileText className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Reason</p>
                              <p className="text-xs text-muted-foreground">Short explanation for approval</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[11px]">Step 3</Badge>
                        </div>
                        <Textarea
                          id="reason"
                          placeholder="Please explain why you need this leave..."
                          className="mt-4 min-h-[160px] bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 shadow-sm focus:ring-2 focus:ring-orange-500 resize-none transition-all"
                          value={formData.reason}
                          onChange={(e) => handleInputChange('reason', e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/80 dark:bg-slate-900/40 p-4 md:flex-row md:items-center md:justify-between">
                        <p className="text-xs text-muted-foreground">
                          Please review your dates and reason before submitting.
                        </p>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setFormData({
                              leaveType: '',
                              startDate: undefined,
                              endDate: undefined,
                              reason: '',
                              emergencyContact: '',
                              documents: ''
                            })}
                            className="text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100"
                          >
                            <Undo2 className="w-4 h-4 mr-2" />
                            Reset
                          </Button>
                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all px-8"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Submit Request
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Leave History Tab */}
        <TabsContent value="history">
          <Card className="border border-slate-200/70 dark:border-slate-800/70 rounded-2xl bg-white/70 dark:bg-slate-900/60 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">My Leave History</h3>
                  <p className="text-sm text-muted-foreground">View past and current leave requests</p>
                </div>
              </div>
            </div>

            <CardContent className="p-0">
              <div className="space-y-4">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                      <div className="space-y-2">
                        <p className="text-lg font-medium">Loading Leave History</p>
                        <p className="text-sm text-muted-foreground">
                          Fetching your leave requests...
                        </p>
                      </div>
                    </div>
                  </div>
                ) : hodRequests.length > 0 ? (
                  <>
                    {hodRequests
                      .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                      .map((request) => (
                        <Card key={request.id} className={`group overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800/70 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 ${request.status === 'approved' ? 'border-l-emerald-500' :
                          request.status === 'pending' ? 'border-l-orange-500' :
                            request.status === 'rejected' ? 'border-l-red-500' :
                              'border-l-gray-500'
                          } bg-white/90 dark:bg-slate-900/80`}>
                          <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row">
                              {/* Date Section */}
                              <div className="p-4 md:w-40 flex flex-row md:flex-col items-center justify-center gap-4 md:gap-2 border-b md:border-b-0 md:border-r bg-slate-50/80 dark:bg-slate-900/40">
                                <div className="flex flex-col items-center justify-center bg-white/90 dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/70 dark:border-slate-800/70 p-2 w-20 h-20">
                                  <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
                                    {request.startDate.toLocaleString('default', { month: 'short' })}
                                  </span>
                                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {request.startDate.getDate()}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground uppercase">
                                    {request.startDate.toLocaleString('default', { weekday: 'short' })}
                                  </span>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs font-semibold text-muted-foreground">
                                    {request.totalDays} Day{request.totalDays > 1 ? 's' : ''}
                                  </div>
                                </div>
                              </div>

                              {/* Main Content */}
                              <div className="flex-1 p-4 md:p-6">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                        {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1).replace('_', ' ')} Leave
                                      </h3>
                                      <Badge variant="outline" className={`${request.status === 'approved' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                                        request.status === 'pending' ? 'text-orange-600 border-orange-200 bg-orange-50' :
                                          request.status === 'rejected' ? 'text-red-600 border-red-200 bg-red-50' :
                                            'text-gray-600 border-gray-200 bg-gray-50'
                                        } capitalize`}>
                                        {request.status}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      Applied on {request.appliedDate.toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div className="bg-slate-50/80 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Duration</p>
                                    <p className="text-sm font-medium">
                                      {request.startDate.toLocaleDateString()} - {request.endDate.toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="bg-slate-50/80 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Reason</p>
                                    <p className="text-sm line-clamp-2" title={request.reason}>{request.reason}</p>
                                  </div>
                                </div>

                                {request.status === 'rejected' && request.rejectionReason && (
                                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg">
                                    <p className="text-xs font-medium text-red-600 mb-1">Rejection Reason</p>
                                    <p className="text-sm text-red-700 dark:text-red-300">{request.rejectionReason}</p>
                                  </div>
                                )}

                                {request.status === 'approved' && request.approvedDate && (
                                  <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
                                    <CheckCircle className="h-4 w-4" />
                                    Approved on {request.approvedDate.toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                    {/* Pagination Controls */}
                    {hodRequests.length > ITEMS_PER_PAGE && (
                      <div className="flex items-center justify-between pt-4 mt-6">
                        <div className="text-sm text-muted-foreground">
                          Showing <span className="font-medium">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, hodRequests.length)}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, hodRequests.length)}</span> of <span className="font-medium">{hodRequests.length}</span> requests
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
                            {Array.from({ length: Math.ceil(hodRequests.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
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
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(hodRequests.length / ITEMS_PER_PAGE)))}
                            disabled={currentPage === Math.ceil(hodRequests.length / ITEMS_PER_PAGE)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200/70 dark:border-slate-800/70">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No leave history found</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      You haven't submitted any leave requests yet. Use the "Leave Apply" tab to submit your first request.
                    </p>
                    <Button onClick={() => document.querySelector('[value="apply"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}>
                      Apply for Leave
                    </Button>
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
