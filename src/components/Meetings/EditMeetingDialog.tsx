import { useState, useEffect } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { mockUsers, mockDepartments } from '@/data/mockData';
import { Users, Building2, Calendar, MapPin, Video, FileVideo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Meeting } from '@/types/meetings';

interface EditMeetingDialogProps {
  open: boolean;
  onClose: () => void;
  meeting: Meeting | null;
}

export default function EditMeetingDialog({ open, onClose, meeting }: EditMeetingDialogProps) {
  const [meetingData, setMeetingData] = useState({
    title: '',
    type: 'department' as 'department' | 'user',
    selectedDepartments: [] as string[],
    selectedUsers: [] as string[],
    meetingDate: '',
    meetingTime: '',
    meetingLocation: '',
    meetingLink: '',
    recordingLink: '',
    description: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    if (meeting) {
      const date = new Date(meeting.date);
      setMeetingData({
        title: meeting.title,
        type: meeting.type,
        selectedDepartments: meeting.departments || [],
        selectedUsers: meeting.attendees,
        meetingDate: date.toISOString().split('T')[0],
        meetingTime: date.toTimeString().slice(0, 5),
        meetingLocation: meeting.location,
        meetingLink: meeting.meetingLink || '',
        recordingLink: '',
        description: meeting.description
      });
    }
  }, [meeting]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!meetingData.title || !meetingData.meetingDate || !meetingData.meetingTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in title, date, and time for the meeting.",
        variant: "destructive",
      });
      return;
    }

    if (meetingData.type === 'department' && meetingData.selectedDepartments.length === 0) {
      toast({
        title: "No Departments Selected",
        description: "Please select at least one department for the meeting.",
        variant: "destructive",
      });
      return;
    }

    if (meetingData.type === 'user' && meetingData.selectedUsers.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select at least one user for the meeting.",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically update the meeting data
    toast({
      title: "Meeting Updated",
      description: `${meetingData.title} has been updated successfully.`,
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Edit Meeting
          </DialogTitle>
          <DialogDescription>
            Update meeting details and attendees.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="meetingTitle">Meeting Title</Label>
            <Input
              id="meetingTitle"
              value={meetingData.title}
              onChange={(e) => setMeetingData({ ...meetingData, title: e.target.value })}
              placeholder="Enter meeting title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={meetingData.description}
              onChange={(e) => setMeetingData({ ...meetingData, description: e.target.value })}
              placeholder="Meeting agenda or description"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Meeting Type</Label>
                <RadioGroup 
                  value={meetingData.type} 
                  onValueChange={(value: 'department' | 'user') => setMeetingData({ ...meetingData, type: value })}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="department" id="department-meeting" />
                    <Label htmlFor="department-meeting" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      By Department
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="user" id="user-meeting" />
                    <Label htmlFor="user-meeting" className="flex items-center gap-2">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meeting Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meetingDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date
                  </Label>
                  <Input
                    id="meetingDate"
                    type="date"
                    value={meetingData.meetingDate}
                    onChange={(e) => setMeetingData({ ...meetingData, meetingDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meetingTime">Time</Label>
                  <Input
                    id="meetingTime"
                    type="time"
                    value={meetingData.meetingTime}
                    onChange={(e) => setMeetingData({ ...meetingData, meetingTime: e.target.value })}
                    required
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

              <div className="space-y-2">
                <Label htmlFor="recordingLink" className="flex items-center gap-2">
                  <FileVideo className="w-4 h-4" />
                  Recording Link (Optional)
                </Label>
                <Input
                  id="recordingLink"
                  type="url"
                  value={meetingData.recordingLink}
                  onChange={(e) => setMeetingData({ ...meetingData, recordingLink: e.target.value })}
                  placeholder="https://drive.google.com/..."
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Update Meeting</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}