import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, UserPlus, UserMinus } from 'lucide-react';
import { Department, User } from '@/types/company';
import { mockUsers } from '@/data/mockData';

interface ManageMembersDialogProps {
  open: boolean;
  department: Department | null;
  onClose: () => void;
  onUpdateMembers: (departmentId: string, userIds: string[]) => void;
}

export default function ManageMembersDialog({ 
  open, 
  department, 
  onClose, 
  onUpdateMembers 
}: ManageMembersDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const currentMembers = mockUsers.filter(user => user.departmentId === department?.id);
  const availableUsers = mockUsers.filter(user => 
    !user.departmentId || user.departmentId !== department?.id
  );

  const filteredAvailable = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addMember = (userId: string) => {
    if (department) {
      const updatedMemberIds = [...currentMembers.map(m => m.id), userId];
      onUpdateMembers(department.id, updatedMemberIds);
    }
  };

  const removeMember = (userId: string) => {
    if (department) {
      const updatedMemberIds = currentMembers.filter(m => m.id !== userId).map(m => m.id);
      onUpdateMembers(department.id, updatedMemberIds);
    }
  };

  if (!department) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Members - {department.name}</DialogTitle>
          <DialogDescription>
            Add or remove members from this department.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Current Members */}
          <div className="space-y-3">
            <h3 className="font-medium">Current Members ({currentMembers.length})</h3>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {currentMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members assigned to this department.</p>
              ) : (
                currentMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {member.role.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMember(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Users */}
          <div className="space-y-3">
            <div className="space-y-2">
              <h3 className="font-medium">Available Users</h3>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-2">
              {filteredAvailable.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? 'No users found matching your search.' : 'No available users.'}
                </p>
              ) : (
                filteredAvailable.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addMember(user.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}