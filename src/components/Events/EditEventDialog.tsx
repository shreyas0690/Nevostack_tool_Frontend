import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Event, EventType, EventVisibility, EventFile } from '@/types/events';
import { UserRole } from '@/types/company';
import { mockDepartments, mockUsers } from '@/data/mockData';

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onEditEvent: (event: Event) => void;
}

export default function EditEventDialog({ open, onOpenChange, event, onEditEvent }: EditEventDialogProps) {
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description,
    type: event.type,
    startDate: event.startDate.toISOString().slice(0, 16),
    endDate: event.endDate.toISOString().slice(0, 16),
    posterImage: event.posterImage || '',
    attachedFiles: event.attachedFiles || [],
    isOnline: event.isOnline,
    meetingLink: event.meetingLink || '',
    visibility: event.visibility,
    allowedDepartments: event.allowedDepartments || [],
    allowedRoles: event.allowedRoles || [],
    allowedUsers: event.allowedUsers || [],
    isActive: event.isActive,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedEvent: Event = {
      ...event,
      ...formData,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
    };

    onEditEvent(updatedEvent);
    onOpenChange(false);
  };

  const handleDepartmentChange = (departmentId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        allowedDepartments: [...prev.allowedDepartments, departmentId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        allowedDepartments: prev.allowedDepartments.filter(id => id !== departmentId)
      }));
    }
  };

  const handleRoleChange = (role: UserRole, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        allowedRoles: [...prev.allowedRoles, role]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        allowedRoles: prev.allowedRoles.filter(r => r !== role)
      }));
    }
  };

  const handleUserChange = (userId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        allowedUsers: [...prev.allowedUsers, userId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        allowedUsers: prev.allowedUsers.filter(id => id !== userId)
      }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile: EventFile = {
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name,
          url: e.target?.result as string,
          size: file.size,
          type: file.type,
          uploadedAt: new Date(),
        };
        setFormData(prev => ({
          ...prev,
          attachedFiles: [...prev.attachedFiles, newFile]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePosterUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          posterImage: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (fileId: string) => {
    setFormData(prev => ({
      ...prev,
      attachedFiles: prev.attachedFiles.filter(f => f.id !== fileId)
    }));
  };

  const removePoster = () => {
    setFormData(prev => ({ ...prev, posterImage: '' }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const roles: UserRole[] = ['super_admin', 'admin', 'department_head', 'manager', 'member'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Event Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as EventType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="celebration">Celebration</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date & Time</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date & Time</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isOnline"
              checked={formData.isOnline}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isOnline: checked }))}
            />
            <Label htmlFor="isOnline">Online Event</Label>
          </div>

          {formData.isOnline && (
            <div className="space-y-2">
              <Label htmlFor="meetingLink">Meeting Link</Label>
              <Input
                id="meetingLink"
                type="url"
                value={formData.meetingLink}
                onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          )}

          {/* Poster Upload */}
          <div className="space-y-2">
            <Label htmlFor="poster">Event Poster</Label>
            <Input
              id="poster"
              type="file"
              accept="image/*"
              onChange={handlePosterUpload}
            />
            {formData.posterImage && (
              <div className="relative">
                <img 
                  src={formData.posterImage} 
                  alt="Event poster preview" 
                  className="w-full h-32 object-cover rounded-md border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removePoster}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>

          {/* File Attachments */}
          <div className="space-y-2">
            <Label htmlFor="files">Attach Files</Label>
            <Input
              id="files"
              type="file"
              multiple
              onChange={handleFileUpload}
            />
            {formData.attachedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Attached Files:</Label>
                {formData.attachedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Event Visibility</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                visibility: value as EventVisibility,
                allowedDepartments: value !== 'department_specific' ? [] : prev.allowedDepartments,
                allowedRoles: value !== 'role_specific' ? [] : prev.allowedRoles,
                allowedUsers: value !== 'user_specific' ? [] : prev.allowedUsers
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="managers_only">Managers Only</SelectItem>
                <SelectItem value="department_specific">Specific Departments</SelectItem>
                <SelectItem value="role_specific">Specific Roles</SelectItem>
                <SelectItem value="user_specific">Specific Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.visibility === 'department_specific' && (
            <div className="space-y-2">
              <Label>Select Departments</Label>
              <div className="grid grid-cols-2 gap-2">
                {mockDepartments.map((dept) => (
                  <div key={dept.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={dept.id}
                      checked={formData.allowedDepartments.includes(dept.id)}
                      onCheckedChange={(checked) => handleDepartmentChange(dept.id, checked as boolean)}
                    />
                    <Label htmlFor={dept.id} className="text-sm">{dept.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.visibility === 'role_specific' && (
            <div className="space-y-2">
              <Label>Select Roles</Label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={role}
                      checked={formData.allowedRoles.includes(role)}
                      onCheckedChange={(checked) => handleRoleChange(role, checked as boolean)}
                    />
                    <Label htmlFor={role} className="text-sm capitalize">{role.replace('_', ' ')}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.visibility === 'user_specific' && (
            <div className="space-y-2">
              <Label>Select Users</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {mockUsers.filter(user => user.isActive).map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={formData.allowedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleUserChange(user.id, checked as boolean)}
                    />
                    <Label htmlFor={`user-${user.id}`} className="text-sm">{user.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">Active Event</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Event</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}