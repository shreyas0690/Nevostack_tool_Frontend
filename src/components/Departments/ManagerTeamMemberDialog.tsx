import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/Auth/AuthProvider';
import { mockUsers, mockDepartments } from '@/data/mockData';
import type { User } from '@/types/company';

interface ManagerTeamMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onAddMember?: (memberData: any) => void;
  onUpdateMember?: (memberId: string, memberData: any) => void;
  member?: User | null;
  mode: 'add' | 'edit';
}

export default function ManagerTeamMemberDialog({
  open,
  onClose,
  onAddMember,
  onUpdateMember,
  member,
  mode,
}: ManagerTeamMemberDialogProps) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'member' as 'manager' | 'member',
    departmentId: currentUser?.departmentId || '',
    managerId: currentUser?.id || '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && member) {
        setFormData({
          name: member.name,
          email: member.email,
          role: member.role as 'manager' | 'member',
          departmentId: member.departmentId || currentUser?.departmentId || '',
          managerId: member.managerId || currentUser?.id || '',
          isActive: member.isActive ?? true,
        });
      } else {
        setFormData({
          name: '',
          email: '',
          role: 'member',
          departmentId: currentUser?.departmentId || '',
          managerId: currentUser?.id || '',
          isActive: true,
        });
      }
      setErrors({});
    }
  }, [open, mode, member, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'add' && onAddMember) {
        await onAddMember(formData);
      } else if (mode === 'edit' && onUpdateMember && member) {
        await onUpdateMember(member.id, formData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save team member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const departments = mockDepartments.filter(dept => dept.id === currentUser?.departmentId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add Team Member' : 'Edit Team Member'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'manager' | 'member') =>
                setFormData(prev => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Team Member</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Department (read-only for managers) */}
          <div className="space-y-2">
            <Label>Department</Label>
            <div className="p-2 bg-muted rounded-md">
              {departments[0]?.name || 'Unknown Department'}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="isActive">Active Member</Label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? (mode === 'add' ? 'Adding...' : 'Updating...')
                : (mode === 'add' ? 'Add Member' : 'Update Member')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

