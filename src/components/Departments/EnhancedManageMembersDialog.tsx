import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Minus, Crown, UserCheck, Users } from 'lucide-react';
import { Department, User } from '@/types/company';

interface EnhancedManageMembersDialogProps {
  open: boolean;
  department: Department | null;
  users?: User[]; // pass real users from parent
  onClose: () => void;
  onUpdateMembers: (departmentId: string, memberIds: string[], managerIds: string[], headId?: string) => void;
}

export default function EnhancedManageMembersDialog({
  open,
  department,
  users = [],
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
      setLocalHeadId(department.headId || (department.head ? department.head.id : undefined));
      // support department objects that provide managerIds/memberIds or managers/members arrays
      const mgrIds = department.managerIds && department.managerIds.length ? department.managerIds : (department.managers && department.managers.length ? department.managers.map((m: any) => m.id) : []);
      const memIds = department.memberIds && department.memberIds.length ? department.memberIds : (department.members && department.members.length ? department.members.map((m: any) => m.id) : []);
      setLocalManagerIds(mgrIds || []);
      setLocalMemberIds(memIds || []);
    }
  }, [department]);

  if (!department) return null;

  const allUsers = users && users.length ? users : [];

  const filteredUsers = allUsers.filter(user => 
    (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentHead = localHeadId ? allUsers.find(u => u.id === localHeadId) : null;
  const currentManagers = localManagerIds.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[];
  const currentMembers = localMemberIds.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[];
  
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
    // Do NOT force-add manager into member list; manager should remain separate
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
    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
      <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
        <AvatarFallback className="text-xs">
          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-xs sm:text-sm truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        <Badge variant="outline" className="text-xs mt-1 hidden sm:inline-flex">
          {user.role.replace('_', ' ')}
        </Badge>
      </div>
      {showActions && (
        <div className="flex items-center gap-1 flex-wrap">
          {currentRole === 'none' ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setAsHead(user.id)} className="text-xs px-2 py-1">
                <Crown className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Head</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAsManager(user.id)} className="text-xs px-2 py-1">
                <UserCheck className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Manager</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => addMember(user.id)} className="text-xs px-2 py-1">
                <Plus className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Member</span>
              </Button>
            </>
          ) : (
            <>
              {currentRole !== 'head' && (
                <Button size="sm" variant="outline" onClick={() => setAsHead(user.id)} className="text-xs px-2 py-1">
                  <Crown className="w-3 h-3" />
                </Button>
              )}
              {currentRole !== 'manager' && currentRole !== 'head' && (
                <Button size="sm" variant="outline" onClick={() => setAsManager(user.id)} className="text-xs px-2 py-1">
                  <UserCheck className="w-3 h-3" />
                </Button>
              )}
              {currentRole === 'head' && (
                <Button size="sm" variant="outline" onClick={() => removeFromRole(user.id, 'head')} className="text-xs px-2 py-1">
                  <span className="hidden sm:inline">Remove Head</span>
                  <span className="sm:hidden">Remove</span>
                </Button>
              )}
              {currentRole === 'manager' && (
                <Button size="sm" variant="outline" onClick={() => removeFromRole(user.id, 'manager')} className="text-xs px-2 py-1">
                  <span className="hidden sm:inline">Remove Manager</span>
                  <span className="sm:hidden">Remove</span>
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => removeMember(user.id)} className="text-xs px-2 py-1">
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
      <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 border-0 shadow-2xl mx-2 sm:mx-4">
        <DialogHeader className="flex-shrink-0 pb-4 sm:pb-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 sm:gap-3">
                  <div 
                    className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-sm flex-shrink-0" 
                    style={{ backgroundColor: department.color }}
                  />
                  <span className="hidden sm:inline">Manage {department.name} Department Members</span>
                  <span className="sm:hidden">Manage {department.name}</span>
                </DialogTitle>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  <span className="hidden sm:inline">Add, remove, and manage department team members</span>
                  <span className="sm:hidden">Manage team members</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">Live Data</span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <Tabs defaultValue="current" className="w-full">
            <div className="border-b border-slate-200 dark:border-slate-700">
              <TabsList className="grid w-full grid-cols-2 h-auto bg-transparent p-0">
                <TabsTrigger 
                  value="current" 
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-500 dark:data-[state=active]:bg-green-900/20 dark:data-[state=active]:text-green-400 rounded-none text-xs sm:text-sm"
                >
                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-medium hidden sm:inline">Current Members</span>
                  <span className="sm:hidden">Current</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="available" 
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-400 rounded-none text-xs sm:text-sm"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-medium hidden sm:inline">Add Members</span>
                  <span className="sm:hidden">Add</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="current" className="p-3 sm:p-6 space-y-4 sm:space-y-6">
              {/* Department Head */}
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100/30 dark:from-yellow-900/20 dark:to-yellow-800/10 rounded-xl border border-yellow-200 dark:border-yellow-800 p-6">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  Department Head
                </h4>
                {currentHead ? (
                  <UserCard user={currentHead} currentRole="head" />
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Crown className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <p className="text-yellow-700 dark:text-yellow-400 font-medium">No head assigned</p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-500">Assign a department head for better management</p>
                  </div>
                )}
              </div>

              {/* Managers */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100/30 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-3 text-blue-700 dark:text-blue-400">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-white" />
                  </div>
                  Managers ({currentManagers.length})
                </h4>
                <div className="space-y-3">
                  {currentManagers.length > 0 ? (
                    currentManagers.map(manager => (
                      <UserCard key={manager.id} user={manager} currentRole="manager" />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-blue-700 dark:text-blue-400 font-medium">No managers assigned</p>
                      <p className="text-sm text-blue-600 dark:text-blue-500">Add managers to help coordinate the team</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Regular Members */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100/30 dark:from-slate-800/20 dark:to-slate-700/10 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-3 text-slate-700 dark:text-slate-400">
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Team Members ({currentMembers.filter(m => 
                    m.id !== localHeadId && !localManagerIds.includes(m.id)
                  ).length})
                </h4>
                <div className="space-y-3">
                  {currentMembers
                    .filter(member => member.id !== localHeadId && !localManagerIds.includes(member.id))
                    .map(member => (
                      <UserCard key={member.id} user={member} currentRole="member" />
                    ))
                  }
                  {currentMembers.filter(m => 
                    m.id !== localHeadId && !localManagerIds.includes(m.id)
                  ).length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                      </div>
                      <p className="text-slate-700 dark:text-slate-400 font-medium">No team members</p>
                      <p className="text-sm text-slate-600 dark:text-slate-500">Add team members to build your department</p>
                    </div>
                  )}
                </div>
              </div>
          </TabsContent>

            <TabsContent value="available" className="p-3 sm:p-6 space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100/30 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-3 text-blue-700 dark:text-blue-400">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  Add New Members
                </h4>
                
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600"
                  />
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {availableUsers.map(user => (
                    <UserCard key={user.id} user={user} currentRole="none" />
                  ))}
                  {availableUsers.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-2">
                        {searchTerm ? 'No Users Found' : 'All Users Added'}
                      </h3>
                      <p className="text-sm text-blue-600 dark:text-blue-500">
                        {searchTerm ? 'Try adjusting your search terms' : 'All available users are already members of this department'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

        </div>

        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium">Total: {localMemberIds.length} members</span>
              {localHeadId && (
                <span className="ml-2">
                  (1 head, {localManagerIds.length} managers)
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
