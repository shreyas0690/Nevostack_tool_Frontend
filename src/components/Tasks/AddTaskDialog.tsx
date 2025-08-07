import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Task, TaskPriority, User, Department } from '@/types/company';
import { mockUsers, mockDepartments } from '@/data/mockData';
import { Users, Building2, Calendar, MapPin, Video } from 'lucide-react';

interface AddTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => void;
  currentUserId: string;
}

export default function AddTaskDialog({ open, onClose, onAdd, currentUserId }: AddTaskDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'assigned' as const,
    priority: 'medium' as TaskPriority,
    assignedTo: '',
    departmentId: '',
    dueDate: ''
  });

  const [meetingData, setMeetingData] = useState({
    enabled: false,
    type: 'department' as 'department' | 'user',
    selectedDepartments: [] as string[],
    selectedUsers: [] as string[],
    meetingDate: '',
    meetingTime: '',
    meetingLocation: '',
    meetingLink: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      assignedTo: formData.assignedTo,
      assignedBy: currentUserId,
      departmentId: formData.departmentId,
      dueDate: new Date(formData.dueDate),
      meeting: meetingData.enabled ? {
        enabled: true,
        type: meetingData.type,
        selectedDepartments: meetingData.selectedDepartments,
        selectedUsers: meetingData.selectedUsers,
        meetingDate: meetingData.meetingDate ? new Date(meetingData.meetingDate) : undefined,
        meetingTime: meetingData.meetingTime,
        meetingLocation: meetingData.meetingLocation,
        meetingLink: meetingData.meetingLink
      } : undefined
    });
    setFormData({
      title: '',
      description: '',
      status: 'assigned',
      priority: 'medium',
      assignedTo: '',
      departmentId: '',
      dueDate: ''
    });
    setMeetingData({
      enabled: false,
      type: 'department',
      selectedDepartments: [],
      selectedUsers: [],
      meetingDate: '',
      meetingTime: '',
      meetingLocation: '',
      meetingLink: ''
    });
    onClose();
  };

  const handleDepartmentToggle = (deptId: string) => {
    setMeetingData(prev => ({
      ...prev,
      selectedDepartments: prev.selectedDepartments.includes(deptId)
        ? prev.selectedDepartments.filter(id => id !== deptId)
        : [...prev.selectedDepartments, deptId]
    }));
  };

  const handleUserToggle = (userId: string) => {
    setMeetingData(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId]
    }));
  };

  const availableUsers = mockUsers.filter(user => user.isActive);
  const selectedDeptUsers = formData.departmentId 
    ? availableUsers.filter(user => user.departmentId === formData.departmentId)
    : availableUsers;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Assign a new task to team members.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value, assignedTo: '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {mockDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select value={formData.assignedTo} onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {selectedDeptUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role.replace('_', ' ')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>

          {/* Meeting Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Meeting Setup
                <Checkbox
                  checked={meetingData.enabled}
                  onCheckedChange={(checked) => setMeetingData({ ...meetingData, enabled: !!checked })}
                />
              </CardTitle>
            </CardHeader>
            {meetingData.enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Meeting Type</Label>
                  <RadioGroup 
                    value={meetingData.type} 
                    onValueChange={(value: 'department' | 'user') => setMeetingData({ ...meetingData, type: value })}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="department" id="department" />
                      <Label htmlFor="department" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Department
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="user" id="user" />
                      <Label htmlFor="user" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Individual Users
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {meetingData.type === 'department' && (
                  <div className="space-y-3">
                    <Label>Select Departments</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {mockDepartments.map((dept) => (
                        <div key={dept.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={meetingData.selectedDepartments.includes(dept.id)}
                            onCheckedChange={() => handleDepartmentToggle(dept.id)}
                          />
                          <Label className="flex items-center gap-2 text-sm">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: dept.color }}
                            />
                            {dept.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {meetingData.selectedDepartments.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {meetingData.selectedDepartments.map(deptId => {
                          const dept = mockDepartments.find(d => d.id === deptId);
                          return dept ? (
                            <Badge key={deptId} variant="secondary" className="text-xs">
                              {dept.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}

                {meetingData.type === 'user' && (
                  <div className="space-y-3">
                    <Label>Select Users</Label>
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                      {mockUsers.filter(user => user.isActive).map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={meetingData.selectedUsers.includes(user.id)}
                            onCheckedChange={() => handleUserToggle(user.id)}
                          />
                          <Label className="text-sm">
                            {user.name} ({user.role.replace('_', ' ')})
                          </Label>
                        </div>
                      ))}
                    </div>
                    {meetingData.selectedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {meetingData.selectedUsers.map(userId => {
                          const user = mockUsers.find(u => u.id === userId);
                          return user ? (
                            <Badge key={userId} variant="secondary" className="text-xs">
                              {user.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meetingDate" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Meeting Date
                    </Label>
                    <Input
                      id="meetingDate"
                      type="date"
                      value={meetingData.meetingDate}
                      onChange={(e) => setMeetingData({ ...meetingData, meetingDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meetingTime">Time</Label>
                    <Input
                      id="meetingTime"
                      type="time"
                      value={meetingData.meetingTime}
                      onChange={(e) => setMeetingData({ ...meetingData, meetingTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meetingLocation" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </Label>
                  <Input
                    id="meetingLocation"
                    value={meetingData.meetingLocation}
                    onChange={(e) => setMeetingData({ ...meetingData, meetingLocation: e.target.value })}
                    placeholder="Meeting room or address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meetingLink" className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Meeting Link (Optional)
                  </Label>
                  <Input
                    id="meetingLink"
                    type="url"
                    value={meetingData.meetingLink}
                    onChange={(e) => setMeetingData({ ...meetingData, meetingLink: e.target.value })}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              </CardContent>
            )}
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}