import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Minus, Crown, UserCheck, Users } from 'lucide-react';
import { mockUsers } from '@/data/mockData';
import { Department, User } from '@/types/company';

interface EnhancedManageMembersDialogProps {
  open: boolean;
  department: Department | null;
  onClose: () => void;
  onUpdateMembers: (departmentId: string, memberIds: string[], managerIds: string[], headId?: string) => void;
}

export default function EnhancedManageMembersDialog({
  open,
  department,
  onClose,
  onUpdateMembers
}: EnhancedManageMembersDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [localHeadId, setLocalHeadId] = useState<string | undefined>();
  const [localManagerIds, setLocalManagerIds] = useState<string[]>([]);
  const [localMemberIds, setLocalMemberIds] = useState<string[]>([]);

  // Update local state when department changes
  useEffect(() => {
    if (department) {
      setLocalHeadId(department.headId);
      setLocalManagerIds(department.managerIds || []);
      setLocalMemberIds(department.memberIds || []);
    }
  }, [department]);

  if (!department) return null;

  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentHead = localHeadId ? mockUsers.find(u => u.id === localHeadId) : null;
  const currentManagers = localManagerIds.map(id => mockUsers.find(u => u.id === id)).filter(Boolean) as User[];
  const currentMembers = localMemberIds.map(id => mockUsers.find(u => u.id === id)).filter(Boolean) as User[];
  
  const availableUsers = filteredUsers.filter(user => 
    !localMemberIds.includes(user.id)
  );

  const setAsHead = (userId: string) => {
    // Remove previous head if exists
    if (localHeadId) {
      setLocalManagerIds(prev => prev.filter(id => id !== localHeadId));
    }
    
    setLocalHeadId(userId);
    // Add to members if not already included
    if (!localMemberIds.includes(userId)) {
      setLocalMemberIds(prev => [...prev, userId]);
    }
    // Remove from managers if they were a manager
    setLocalManagerIds(prev => prev.filter(id => id !== userId));
  };

  const setAsManager = (userId: string) => {
    // Cannot be manager if they are the head
    if (localHeadId === userId) {
      setLocalHeadId(undefined);
    }
    
    if (!localManagerIds.includes(userId)) {
      setLocalManagerIds(prev => [...prev, userId]);
    }
    // Add to members if not already included
    if (!localMemberIds.includes(userId)) {
      setLocalMemberIds(prev => [...prev, userId]);
    }
  };

  const addMember = (userId: string) => {
    // Just add as regular member (not head or manager)
    if (!localMemberIds.includes(userId)) {
      setLocalMemberIds(prev => [...prev, userId]);
    }
  };

  const removeMember = (userId: string) => {
    // Remove from all roles
    setLocalMemberIds(prev => prev.filter(id => id !== userId));
    setLocalManagerIds(prev => prev.filter(id => id !== userId));
    if (localHeadId === userId) {
      setLocalHeadId(undefined);
    }
  };

  const removeFromRole = (userId: string, role: 'head' | 'manager') => {
    if (role === 'head') {
      setLocalHeadId(undefined);
      // Keep them as regular member
    } else if (role === 'manager') {
      setLocalManagerIds(prev => prev.filter(id => id !== userId));
      // Keep them as regular member
    }
  };

  const handleSave = () => {
    // Ensure memberIds includes head and all managers
    let allMemberIds = [...localMemberIds];
    
    // Add head to members if not already included
    if (localHeadId && !allMemberIds.includes(localHeadId)) {
      allMemberIds.push(localHeadId);
    }
    
    // Add all managers to members if not already included
    localManagerIds.forEach(managerId => {
      if (!allMemberIds.includes(managerId)) {
        allMemberIds.push(managerId);
      }
    });
    
    onUpdateMembers(department.id, allMemberIds, localManagerIds, localHeadId);
    onClose();
  };

  const UserCard = ({ user, showActions = true, currentRole }: { 
    user: User; 
    showActions?: boolean; 
    currentRole?: 'head' | 'manager' | 'member' | 'none';
  }) => (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <Avatar className="w-10 h-10">
        <AvatarFallback>
          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-medium text-sm">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
        <Badge variant="outline" className="text-xs mt-1">
          {user.role.replace('_', ' ')}
        </Badge>
      </div>
      {showActions && (
        <div className="flex items-center gap-1">
          {currentRole === 'none' ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setAsHead(user.id)}>
                <Crown className="w-3 h-3 mr-1" />
                Head
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAsManager(user.id)}>
                <UserCheck className="w-3 h-3 mr-1" />
                Manager
              </Button>
              <Button size="sm" variant="outline" onClick={() => addMember(user.id)}>
                <Plus className="w-3 h-3 mr-1" />
                Member
              </Button>
            </>
          ) : (
            <>
              {currentRole !== 'head' && (
                <Button size="sm" variant="outline" onClick={() => setAsHead(user.id)}>
                  <Crown className="w-3 h-3" />
                </Button>
              )}
              {currentRole !== 'manager' && currentRole !== 'head' && (
                <Button size="sm" variant="outline" onClick={() => setAsManager(user.id)}>
                  <UserCheck className="w-3 h-3" />
                </Button>
              )}
              {currentRole === 'head' && (
                <Button size="sm" variant="outline" onClick={() => removeFromRole(user.id, 'head')}>
                  Remove Head
                </Button>
              )}
              {currentRole === 'manager' && (
                <Button size="sm" variant="outline" onClick={() => removeFromRole(user.id, 'manager')}>
                  Remove Manager
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => removeMember(user.id)}>
                <Minus className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: department.color }}
            />
            Manage {department.name} Department Members
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Current Members</TabsTrigger>
            <TabsTrigger value="available">Add Members</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {/* Department Head */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Department Head
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentHead ? (
                  <UserCard user={currentHead} currentRole="head" />
                ) : (
                  <p className="text-muted-foreground text-center py-4">No head assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Managers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-500" />
                  Managers ({currentManagers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {currentManagers.length > 0 ? (
                  currentManagers.map(manager => (
                    <UserCard key={manager.id} user={manager} currentRole="manager" />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No managers assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Regular Members */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-500" />
                  Members ({currentMembers.filter(m => 
                    m.id !== localHeadId && !localManagerIds.includes(m.id)
                  ).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {currentMembers
                  .filter(member => member.id !== localHeadId && !localManagerIds.includes(member.id))
                  .map(member => (
                    <UserCard key={member.id} user={member} currentRole="member" />
                  ))
                }
                {currentMembers.filter(m => 
                  m.id !== localHeadId && !localManagerIds.includes(m.id)
                ).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No regular members</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="available" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableUsers.map(user => (
                <UserCard key={user.id} user={user} currentRole="none" />
              ))}
              {availableUsers.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  {searchTerm ? 'No users found matching your search' : 'All users are already members'}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Total: {localMemberIds.length} members 
            {localHeadId && ` (1 head, ${localManagerIds.length} managers)`}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}