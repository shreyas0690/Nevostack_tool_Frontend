import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, FileText, AlertCircle } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { leaveTypeConfig, LeaveType } from '@/types/leave';
import { currentUser } from '@/data/mockData';
import { userService } from '@/services/userService';
import { leaveService } from '@/services/leaveService';

export default function LeaveRequestForm() {
  const { toast } = useToast();
  // Defensive: if currentUser not available (auth not ready), avoid rendering to prevent runtime errors
  if (!currentUser) {
    return <div />;
  }
  const [formData, setFormData] = useState({
    leaveType: '' as LeaveType,
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    reason: '',
    emergencyContact: ''
  });
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [fetchUsersFailed, setFetchUsersFailed] = useState(false);

  const selectedUser = users.find(u => u.id === selectedUserId);

  useEffect(() => {
    let mounted = true;
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const params: any = { limit: 200 };
        if (currentUser && (currentUser as any).companyId) params.companyId = (currentUser as any).companyId;
        const res: any = await userService.getUsers(params);
        const fetched = (res && res.data) ? res.data : [];
        // Normalize and exclude admin/super_admin; ensure id exists
        const normalized = (fetched || []).map((u: any) => ({
          id: u.id || u._id || (u._id && String(u._id)) || '',
          name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unknown',
          email: u.email || '',
          role: u.role || ''
        })).filter((u: any) => u.id);
        const filtered = normalized.filter((u: any) => u.role !== 'admin' && u.role !== 'super_admin');
        if (mounted) setUsers(filtered);
      } catch (err) {
        // leave users empty and mark failure for UI
        console.error('Failed to load users for leave form:', err);
        if (mounted) {
          setUsers([]);
          setFetchUsersFailed(true);
        }
      } finally {
        if (mounted) setLoadingUsers(false);
      }
    };

    loadUsers();
    return () => { mounted = false; };
  }, []);

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const days = differenceInDays(formData.endDate, formData.startDate) + 1;
    return days;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalDays = calculateDays();

    try {
      const payload: any = {
        type: formData.leaveType,
        startDate: formData.startDate?.toISOString().split('T')[0],
        endDate: formData.endDate?.toISOString().split('T')[0],
        reason: formData.reason,
        emergencyContact: formData.emergencyContact || '',
        days: totalDays
      };
      if (selectedUser) payload.userId = selectedUser.id;

      const res: any = await leaveService.createLeave(payload);
      if (res && res.success) {
        toast({ title: selectedUser ? 'Leave Created' : 'Leave Submitted', description: res.message || 'Leave request submitted.' });
        setFormData({ leaveType: '' as LeaveType, startDate: undefined, endDate: undefined, reason: '' });
      } else {
        throw new Error(res?.message || 'Submission failed');
      }
    } catch (err: any) {
      console.error('Submit leave failed:', err);
      toast({ title: 'Submission Failed', description: err?.message || 'Could not submit leave request.' });
    }
  };

  // Compute submit disabled state and reason for user feedback
  const missingFields: string[] = [];
  if (!formData.leaveType) missingFields.push('Leave type');
  if (!formData.startDate) missingFields.push('Start date');
  if (!formData.endDate) missingFields.push('End date');
  if (!formData.reason || !formData.reason.trim()) missingFields.push('Reason');

  const isSubmitDisabled = missingFields.length > 0;

  let disabledReason = '';
  if (missingFields.length > 0) {
    disabledReason = `Please fill: ${missingFields.join(', ')}`;
  }

  return (
    <Card className="max-w-3xl shadow-lg ring-1 ring-neutral-100 rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Apply for Leave
        </CardTitle>
        <p className="text-muted-foreground mt-1">Quickly request leave with validation and balance checks.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main form */}
          <div className="space-y-4">
            {/* Apply on behalf (admins/hr) */}
            {['admin', 'super_admin', 'hr_manager'].includes(currentUser.role) && (
              <div className="space-y-2">
                <Label htmlFor="userSelect">Apply On Behalf Of (optional)</Label>
                <Select value={selectedUserId} onValueChange={(value) => setSelectedUserId(value && value.startsWith('__') ? '' : value)}>
                  <SelectTrigger className="rounded-md shadow-sm">
                    <SelectValue placeholder="Select user (leave blank for self)" />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={8}>
                    {loadingUsers ? (
                      <SelectItem value="__loading" disabled>Loading users...</SelectItem>
                    ) : fetchUsersFailed ? (
                      <SelectItem value="__failed" disabled>Failed to load users</SelectItem>
                    ) : users && users.length > 0 ? (
                      users
                        .filter(user => user && user.id)
                        .map(user => (
                          <SelectItem key={String(user.id)} value={String(user.id)}>
                            {user.name} • {user.email}
                          </SelectItem>
                        ))
                    ) : (
                      <SelectItem value="__none" disabled>No users available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Select a user to create the leave request on their behalf.</p>
              </div>
            )}

            {/* Leave Type */}
            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select value={formData.leaveType} onValueChange={(value: LeaveType) => 
                setFormData(prev => ({ ...prev, leaveType: value }))
              }>
                <SelectTrigger className="rounded-md shadow-sm">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent side="bottom" sideOffset={8}>
                  {Object.entries(leaveTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span>{config.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Choose the leave category. Remaining balance shown per type.</p>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-md shadow-sm",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => setFormData(prev => ({ 
                        ...prev, 
                        startDate: date,
                        endDate: date && !prev.endDate ? date : prev.endDate
                      }))}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-md shadow-sm",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                      disabled={(date) => 
                        date < new Date() || 
                        (formData.startDate && date < formData.startDate)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Quick summary */}
            {formData.startDate && formData.endDate && (
              <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Total Days</div>
                  <div className="text-lg font-bold">{calculateDays()} {calculateDays() === 0.5 ? 'day (Half day)' : 'days'}</div>
                </div>
                {/* Remaining balance display removed */}
              </div>
            )}

            {/* Half day option removed as requested */}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Leave</Label>
              <Textarea
                id="reason"
                placeholder="Briefly explain why you need this leave (mandatory)"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                rows={4}
                className="rounded-md shadow-sm"
              />
              <p className="text-xs text-muted-foreground">Tip: Keep the reason concise and include important dates or dependencies.</p>
            </div>
            {/* Balance warnings removed per request */}

            <div className="flex gap-2">
              <Button 
                type="submit" 
                className="flex-1 shadow-md"
                disabled={isSubmitDisabled}
                title={isSubmitDisabled ? disabledReason : ''}
              >
                Submit Leave Request
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}