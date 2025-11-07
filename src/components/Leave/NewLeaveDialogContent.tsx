import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { leaveTypeConfig } from '@/types/leave';
import { differenceInDays } from 'date-fns';
import { userService } from '@/services/userService';
import { leaveService } from '@/services/leaveService';
import { useToast } from '@/hooks/use-toast';
import { currentUser } from '@/data/mockData';
import { 
  Calendar, 
  User, 
  FileText, 
  Phone, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface NewLeaveDialogContentProps {
  onClose?: () => void;
}

export default function NewLeaveDialogContent({ onClose }: NewLeaveDialogContentProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ userId: '', type: '', startDate: '', endDate: '', reason: '', emergencyContact: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    const loadUsers = async () => {
      setLoading(true);
      try {
        // Fetch users for current user's company only
        const params: any = { limit: 200 };
        if (currentUser && (currentUser as any).companyId) params.companyId = (currentUser as any).companyId;
        const res = await userService.getUsers(params);
        if (!mounted) return;
        // Prefer standardized `data` from ApiResponse; fallback to empty array
        const fetched = (res && res.data) ? res.data : [];
        // Exclude admin and super_admin from selection
        const filtered = fetched.filter((u: any) => u.role !== 'admin' && u.role !== 'super_admin');
        setUsers(filtered);
      } catch (err) {
        // On error, show none (do not fallback to global mock users)
        setUsers([]);
        toast({ title: 'Failed to load users', description: 'Could not fetch company users.' });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadUsers();
    return () => { mounted = false; };
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.type) newErrors.type = 'Leave type is required';
    if (!form.startDate) newErrors.startDate = 'Start date is required';
    if (!form.endDate) newErrors.endDate = 'End date is required';
    if (!form.reason.trim()) newErrors.reason = 'Reason is required';
    
    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (end < start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      toast({ 
        title: 'Validation Error', 
        description: 'Please fill in all required fields correctly.',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const s = new Date(form.startDate);
      const e = new Date(form.endDate);
      let days = differenceInDays(e, s) + 1;
      if (isNaN(days) || days < 0) days = 0;

      const payload: any = {
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
        emergencyContact: form.emergencyContact.trim() || '',
        days
      };
      if (form.userId) payload.userId = form.userId;

      const res: any = await leaveService.createLeave(payload);
      if (res && res.success) {
        toast({ 
          title: 'Leave Request Created Successfully! 🎉', 
          description: res.message || 'Your leave request has been submitted for approval.',
        });
        // Reset form
        setForm({ userId: '', type: '', startDate: '', endDate: '', reason: '', emergencyContact: '' });
        setErrors({});
        // Close modal
        if (onClose) onClose();
      } else {
        throw new Error(res?.message || 'Create failed');
      }
    } catch (err: any) {
      console.error('Create leave failed:', err);
      toast({ 
        title: 'Failed to Create Leave Request ❌', 
        description: err?.message || 'Could not create leave request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onClose) onClose();
  };

  const getLeaveTypeIcon = (type: string) => {
    const config = leaveTypeConfig[type];
    return config?.icon || '📅';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DialogHeader className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
            <Calendar className="h-6 w-6 text-white" />
          </div>
        <div>
            <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Create New Leave Request
            </DialogTitle>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Submit a new leave request for approval
            </p>
          </div>
        </div>
      </DialogHeader>

      {/* Form Sections */}
      <div className="space-y-6">
        {/* Employee Selection */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <User className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Employee Selection</h3>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Apply On Behalf Of</Label>
          <Select value={form.userId} onValueChange={(v) => setForm(prev => ({ ...prev, userId: v }))}>
              <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400">
                <SelectValue placeholder={loading ? 'Loading users...' : 'Select employee'} />
            </SelectTrigger>
            <SelectContent>
              {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{u.name}</span>
                      <span className="text-slate-500 text-sm">• {u.email}</span>
                    </div>
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        </div>

        {/* Leave Details */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Leave Details</h3>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Leave Type *</Label>
          <Select value={form.type} onValueChange={(v) => setForm(prev => ({ ...prev, type: v }))}>
              <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400">
              <SelectValue placeholder="Select leave type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(leaveTypeConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{getLeaveTypeIcon(key)}</span>
                      <span>{cfg.label}</span>
                    </div>
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>
            {errors.type && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.type}</span>
              </div>
            )}
          </div>
        </div>

        {/* Date Selection */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Date Range</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Start Date *</Label>
              <Input 
                type="date" 
                value={form.startDate} 
                onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400"
              />
              {errors.startDate && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.startDate}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">End Date *</Label>
              <Input 
                type="date" 
                value={form.endDate} 
                onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400"
              />
              {errors.endDate && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.endDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Additional Information</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Reason for Leave *</Label>
              <Textarea 
                value={form.reason} 
                onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Please provide a detailed reason for your leave request..."
                rows={3}
                className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400"
              />
              {errors.reason && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.reason}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Emergency Contact</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Contact number during leave (optional)" 
                  value={form.emergencyContact} 
                  onChange={(e) => setForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  className="pl-10 border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400"
                />
              </div>
            </div>
        </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
        <Button 
          variant="outline" 
          onClick={handleCancel}
          disabled={submitting}
          className="px-6 py-2.5 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleCreate}
          disabled={submitting}
          className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25 rounded-xl font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Request...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Create Request
            </>
          )}
        </Button>
      </div>
    </div>
  );
}


