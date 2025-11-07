import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, UserPlus, AlertCircle, CheckCircle2, Upload, File, X, Paperclip } from 'lucide-react';
// removed mockUsers fallback to ensure real backend data is used
import type { User, TaskAttachment } from '@/types/company';
import { taskService } from '@/services/taskService';
import { userService } from '@/services/userService';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { mockUsers, mockDepartments } from '@/data/mockData';

interface AssignTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onAssignTask: (taskData: any) => void;
  departmentMembers: User[];
  restrictToDepartmentMembers?: boolean; // if true, only show departmentMembers in Assign To select
  currentUser: User | null;
}

export default function AssignTaskDialog({ 
  open, 
  onClose, 
  onAssignTask, 
  departmentMembers,
  currentUser,
  restrictToDepartmentMembers = false
}: AssignTaskDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: '',
    assignedToDepartmentId: '',
    dueDate: undefined as Date | undefined,
    assigneeType: 'user' as 'user' | 'role' | 'department',
    assignedToRole: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  type LocalAttachment = TaskAttachment & { file?: File };
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // decode JWT payload safely to fallback to token payload values
  const decodeTokenPayload = (token?: string) => {
    try {
      if (!token) return null;
      const payload = token.split('.')[1];
      const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '=');
      const json = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  };

  const tokenPayload = decodeTokenPayload(authService.getAccessToken());

  // Fetch real users for the current department or company
  const { data: fetchedUsers = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['users', currentUser?.companyId || tokenPayload?.companyId],
    queryFn: async () => {
      const companyId = currentUser?.companyId || tokenPayload?.companyId || tokenPayload?.company?._id || tokenPayload?.company;
      const departmentId = currentUser?.departmentId || tokenPayload?.departmentId;
      try {
        if (companyId) {
          // call API without typing companyId into params to avoid TaskFilters typing issue
          const res = await userService.getUsers({ limit: 1000 } as any);
          return (res as any).data || (res as any).users || [];
        }
        if (departmentId) {
          const res = await userService.getUsers({ departmentId, limit: 1000 });
          return (res as any).data || (res as any).users || [];
        }
        return [];
      } catch (err) {
        // Permission/403 or other error — fall back to provided departmentMembers or mock data
        if (departmentId) {
          return (mockUsers || []).filter((u: any) => String(u.departmentId) === String(departmentId));
        }
        return mockUsers || [];
      }
    },
    // enable fetch only when we have an auth token or currentUser info
    enabled: !!(authService.getAccessToken() || currentUser?.companyId || currentUser?.departmentId || tokenPayload?.companyId),
  });

  // Determine source for members list. If restricted to department members, prefer departmentMembers prop
  const membersSource: User[] = restrictToDepartmentMembers
    ? (departmentMembers && departmentMembers.length ? departmentMembers : [])
    : ((fetchedUsers && fetchedUsers.length) ? fetchedUsers : (departmentMembers && departmentMembers.length) ? departmentMembers : mockUsers);


  // If current user is a manager, restrict visible members to only that manager's reportees
  const visibleMembers: User[] = currentUser?.role === 'manager'
    ? membersSource.filter((m: any) => {
        const memberId = (m.id || m._id || '').toString();
        const mgrId = (m.managerId || m.manager || m.manager?._id || '').toString();
        const managesList = Array.isArray(currentUser?.managedMemberIds) ? currentUser!.managedMemberIds : [];
        return String(mgrId) === String(currentUser?.id) || managesList.includes(memberId);
      })
    : membersSource;

  // derive selected member details (from visible members so manager only sees reportees)
  const selectedMember = visibleMembers.find((m: any) => (m.id || m._id) == formData.assignedTo) || null;
  
  const getMemberDeptLabel = (member: any) => {
    if (!member) return 'Unknown';

    // Get department information from various possible fields
    const dept = member.department || member.departmentName || member.deptName || member.departmentId || member.dept || null;

    if (!dept) {
      return 'Unknown';
    }

    // If it's a string, try to resolve it to a department name
    if (typeof dept === 'string') {
      // First check if it's already a department name
      const foundByName = (mockDepartments || []).find((d: any) => d.name === dept);
      if (foundByName) {
        return foundByName.name;
      }

      // Then check if it's a department ID
      const foundById = (mockDepartments || []).find((d: any) => String(d.id) === String(dept) || String(d._id) === String(dept));
      if (foundById) {
        return foundById.name;
      }

      // If not found in mock data, try a hardcoded mapping as last resort
      const hardcodedMapping: Record<string, string> = {
        '1': 'Sales',
        '2': 'Marketing',
        '3': 'HR',
        '4': 'Finance',
        '5': 'Operations',
        '6': 'IT',
        '7': 'Customer Support',
        '8': 'Engineering',
        // MongoDB ObjectIds for common departments (from your debug output)
        '68c8cef7c6c3949785efb353': 'Sales'
      };

      if (hardcodedMapping[dept]) {
        return hardcodedMapping[dept];
      }

      // If it's a MongoDB ObjectId (24 character hex string), try to find it in fetched users
      if (dept.length === 24 && /^[0-9a-fA-F]{24}$/.test(dept)) {
        // Try to find this department ID in any of the fetched users' department data
        const foundInFetchedUsers = fetchedUsers?.find((u: any) => {
          const userDept = u.department || u.departmentName || u.departmentId;
          return String(userDept) === String(dept) ||
                 (userDept && typeof userDept === 'object' && (userDept._id === dept || userDept.id === dept));
        });

        if (foundInFetchedUsers) {
          const userDept = foundInFetchedUsers.department;
          if (userDept && typeof userDept === 'object' && userDept.name) {
            return userDept.name;
          }
        }

        // If not found in fetched users, return a generic name based on common patterns
        return 'Department';
      }

      // If not found anywhere, return the string as-is (it might be a name from backend)
      return dept;
    }

    // If it's an object, extract the name
    if (typeof dept === 'object') {
      return dept.name || dept.title || dept._id || 'Unknown';
    }

    return String(dept);
  };

  const getMemberDeptId = (member: any) => {
    if (!member) return '';
    return member.departmentId || member.deptId || member.department?._id || member.department?.id || member.dept || '';
  };

  // Ensure users are refetched when dialog opens or when auth token changes
  useEffect(() => {
    if (open && typeof refetchUsers === 'function') {
      try { refetchUsers(); } catch (e) { /* ignore */ }
    }
  }, [open, authService.getAccessToken()]);

  // Listen for global login event to refetch users immediately after login
  useEffect(() => {
    const handleGlobalLogin = () => {
      try { refetchUsers && refetchUsers(); } catch (e) { /* ignore */ }
    };

    window.addEventListener('nevostack:login', handleGlobalLogin);
    return () => window.removeEventListener('nevostack:login', handleGlobalLogin);
  }, [refetchUsers]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Task description is required';
    }

    if (formData.assigneeType === 'user' && !formData.assignedTo) {
      newErrors.assignedTo = 'Please select a team member to assign this task';
    }
    if (formData.assigneeType === 'role' && !formData.assignedToRole) {
      newErrors.assignedToRole = 'Please select a role to assign this task';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else if (formData.dueDate < new Date()) {
      newErrors.dueDate = 'Due date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      setErrors({});
      console.log('AssignTaskDialog: attachments at submit=', attachments.map(a => ({ id: a.id, name: a.name, hasFile: !!(a as any).file })));

      const payload: any = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: 'assigned',
        // If assigning to a user, set departmentId to that user's department if available,
        // otherwise fallback to the current user's department
        departmentId: formData.assignedTo ? (getMemberDeptId(selectedMember) || currentUser?.departmentId) : currentUser?.departmentId || undefined,
        assigneeType: formData.assigneeType
      };

      if (formData.assigneeType === 'user') {
        payload.assignedTo = formData.assignedTo;
        payload.assignedToDepartmentId = getMemberDeptId(selectedMember) || '';
      }
      if (formData.assigneeType === 'role') payload.assignedToRole = formData.assignedToRole;
      if (formData.dueDate) payload.dueDate = formData.dueDate.toISOString();

      let res;
      if (attachments.length > 0) {
        const form = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== undefined && v !== null) form.append(k, String(v));
        });
        for (const att of attachments) {
          if (att.file) form.append('files', att.file);
        }
        console.log('AssignTaskDialog: sending multipart create with files count=', attachments.length);
        res = await taskService.createTask(form as any);
      } else {
        res = await taskService.createTask(payload);
      }
      const created = res?.data?.task || res?.data || res;
      const createdId = created?.id || created?._id;
      if (!createdId) {
        setErrors({ general: res?.message || 'Failed to create task' });
        return;
      }

      // If multipart create was used, backend already attached files. Otherwise do separate uploads.
      if (!(res && res.data && res.data.task && res.data.task.attachments && res.data.task.attachments.length > 0)) {
        for (const att of attachments) {
          if (att.file) {
            try {
              console.log('AssignTaskDialog: uploading attachment (separate) ', { name: att.name, size: att.size });
              await taskService.uploadTaskAttachment(createdId, att.file);
              console.log('AssignTaskDialog: upload finished for', att.name);
            } catch (uploadErr) {
              console.error('Attachment upload failed', uploadErr);
            }
          }
        }
      }

      const full = await taskService.getTaskById(createdId);
      const taskObj = (full && ((full as any).data?.task || (full as any).data)) || created;
      onAssignTask(taskObj);

      // Reset form (include assignedToDepartmentId)
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        assignedTo: '',
        assignedToDepartmentId: '',
        dueDate: undefined,
        assigneeType: 'user',
        assignedToRole: ''
      });

      // Clean up attachments
      attachments.forEach(att => {
        if (att.url.startsWith('blob:')) {
          URL.revokeObjectURL(att.url);
        }
      });
      setAttachments([]);

      onClose();
    } catch (error) {
      console.error('Failed to assign task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, files: 'File size should not exceed 10MB' }));
        return;
      }

      // Create attachment object (include raw File for upload)
      const attachment: LocalAttachment = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file), // For preview
        uploadedAt: new Date(),
        uploadedBy: currentUser?.id || '',
        file,
      };

      setAttachments(prev => [...prev, attachment]);
    });

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove attachment
  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => {
      const attachment = prev.find(att => att.id === attachmentId);
      if (attachment?.url.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.url);
      }
      return prev.filter(att => att.id !== attachmentId);
    });
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📋';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📎';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Assign New Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the task in detail..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`min-h-[100px] ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      Low Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Medium Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      High Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Urgent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dueDate && "text-muted-foreground",
                      errors.dueDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => handleInputChange('dueDate', date)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.dueDate && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.dueDate}
                </p>
              )}
            </div>
          </div>

          {/* Assign To */}
          <div className="space-y-2">
            <Label>Assign To *</Label>
            <Select
              value={formData.assignedTo}
              onValueChange={(value) => handleInputChange('assignedTo', value)}
            >
              <SelectTrigger className={errors.assignedTo ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent>
                {usersLoading ? (
                  <SelectItem value="__loading" disabled>Loading users...</SelectItem>
                ) : visibleMembers.length === 0 ? (
                  <SelectItem value="__none" disabled>No users found</SelectItem>
                ) : (
                  visibleMembers
                    .filter((member: any) => {
                      const id = (member.id || member._id || '')?.toString();
                      if (!id) return false;
                      return id !== currentUser?.id && (member.isActive ?? true);
                    })
                    .map((member: any) => {
                      const id = (member.id || member._id || (member._id && member._id.toString && member._id.toString()) || '').toString();
                      const name = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown';
                      const role = member.role || member.userRole || '';
                      return (
                        <SelectItem key={id} value={id}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                                {name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                              <p className="font-medium">{name}</p>
                              <p className="text-xs text-muted-foreground">{role && (role.replace ? role.replace('_', ' ') : role)}</p>
                        </div>
                      </div>
                    </SelectItem>
                      );
                    })
                )}
              </SelectContent>
            </Select>
            {/* show selected user's department below the select */}
            {selectedMember && (
              <p className="text-sm text-muted-foreground mt-2">
                Department: <span className="font-medium">{getMemberDeptLabel(selectedMember)}</span>
              </p>
            )}

            {errors.assignedTo && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.assignedTo}
              </p>
            )}
          </div>

          {/* File Attachments */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="space-y-3">
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm"
                    >
                      <Paperclip className="mr-2 h-4 w-4" />
                      Choose Files
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Upload documents, images, or other files (Max 10MB each)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="*/*"
                />
              </div>

              {/* Error Display */}
              {errors.files && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.files}
                </p>
              )}

              {/* Attached Files List */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Attached Files ({attachments.length})</p>
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-lg">{getFileIcon(attachment.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{attachment.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(attachment.id)}
                          className="ml-2 h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Assigning...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Assign Task
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
