import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Department } from '@/types/company';
import { Crown, UserCheck, Users } from 'lucide-react';

interface DepartmentHierarchyProps {
  department: Department;
  users: User[];
}

export default function DepartmentHierarchy({ department, users }: DepartmentHierarchyProps) {
  const getUser = (userId: string) => users.find(u => u.id === userId);
  
  const head = department.headId ? getUser(department.headId) : null;
  const managers = department.managerIds.map(id => getUser(id)).filter(Boolean) as User[];
  const members = department.memberIds.map(id => getUser(id)).filter(Boolean) as User[];
  
  // Filter out head and managers from members list to avoid duplication
  const regularMembers = members.filter(member => 
    member.id !== department.headId && 
    !department.managerIds.includes(member.id)
  );

  const UserCard = ({ user, role }: { user: User; role: 'head' | 'manager' | 'member' }) => (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <Avatar className="w-10 h-10">
        <AvatarFallback>
          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-medium text-sm">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </div>
      <div className="flex items-center gap-2">
        {role === 'head' && <Crown className="w-4 h-4 text-yellow-500" />}
        {role === 'manager' && <UserCheck className="w-4 h-4 text-blue-500" />}
        {role === 'member' && <Users className="w-4 h-4 text-gray-500" />}
        <Badge variant={role === 'head' ? 'default' : role === 'manager' ? 'secondary' : 'outline'} className="text-xs">
          {role === 'head' ? 'Department Head' : role === 'manager' ? 'Manager' : 'Member'}
        </Badge>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: department.color }}
          />
          {department.name} - Hierarchy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Department Head */}
        {head ? (
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              Department Head
            </h4>
            <UserCard user={head} role="head" />
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Crown className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm">No department head assigned</p>
          </div>
        )}

        {/* Managers */}
        {managers.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-500" />
              Managers ({managers.length})
            </h4>
            <div className="space-y-2">
              {managers.map(manager => (
                <UserCard key={manager.id} user={manager} role="manager" />
              ))}
            </div>
          </div>
        )}

        {/* Regular Members */}
        {regularMembers.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              Members ({regularMembers.length})
            </h4>
            <div className="space-y-2">
              {regularMembers.map(member => (
                <UserCard key={member.id} user={member} role="member" />
              ))}
            </div>
          </div>
        )}

        {members.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm">No members in this department</p>
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-yellow-600">{head ? 1 : 0}</p>
              <p className="text-xs text-muted-foreground">Head</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{managers.length}</p>
              <p className="text-xs text-muted-foreground">Managers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">{regularMembers.length}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}