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
  if (!department || !users) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Unable to load department hierarchy</p>
      </div>
    );
  }

  const getUser = (userId: string) => users.find(u => u.id === userId);

  const head = department.headId ? getUser(department.headId) : null;

  // Managers: prefer explicit `department.managerIds`; fallback to users with role 'manager' in this department
  const managers = (() => {
    if (department.managerIds && department.managerIds.length) {
      return (department.managerIds || []).map(id => getUser(id)).filter(Boolean) as User[];
    }
    return users.filter((u: any) => {
      if (u.role !== 'manager') return false; // only managers, never treat head as manager
      const uDeptId = String(u.departmentId || (u.department && (u.department._id || u.department.id)) || '');
      if (u.id && department.headId && String(u.id) === String(department.headId)) return false;
      return uDeptId === String(department.id);
    });
  })();

  // Members: prefer explicit `department.memberIds`; fallback to users whose department matches and who are not managers/head
  const members = (() => {
    if (department.memberIds && department.memberIds.length) {
      return (department.memberIds || []).map(id => getUser(id)).filter(Boolean) as User[];
    }
    return users.filter((u: any) => {
      const uDeptId = String(u.departmentId || (u.department && (u.department._id || u.department.id)) || '');
      return uDeptId === String(department.id) && u.role !== 'manager' && u.role !== 'department_head';
    });
  })();
  
  // Filter out head and managers from members list to avoid duplication
  const regularMembers = members.filter(member => 
    member && member.id !== department.headId && 
    !(department.managerIds || []).includes(member.id)
  );

  const isEmptyDepartment = !head && managers.length === 0 && regularMembers.length === 0;

  const UserCard = ({ user, role }: { user: User; role: 'head' | 'manager' | 'member' }) => {
    const getRoleStyles = () => {
      switch (role) {
        case 'head':
          return {
            cardBg: 'bg-gradient-to-r from-yellow-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-800/10',
            borderColor: 'border-yellow-200 dark:border-yellow-800',
            hoverBg: 'hover:from-yellow-100 hover:to-yellow-200/50 dark:hover:from-yellow-900/30 dark:hover:to-yellow-800/20',
            iconColor: 'text-yellow-600 dark:text-yellow-400',
            badgeStyle: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
          };
        case 'manager':
          return {
            cardBg: 'bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10',
            borderColor: 'border-blue-200 dark:border-blue-800',
            hoverBg: 'hover:from-blue-100 hover:to-blue-200/50 dark:hover:from-blue-900/30 dark:hover:to-blue-800/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
            badgeStyle: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
          };
        default:
          return {
            cardBg: 'bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/20 dark:to-slate-700/10',
            borderColor: 'border-slate-200 dark:border-slate-700',
            hoverBg: 'hover:from-slate-100 hover:to-slate-200/50 dark:hover:from-slate-800/30 dark:hover:to-slate-700/20',
            iconColor: 'text-slate-600 dark:text-slate-400',
            badgeStyle: 'bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-400'
          };
      }
    };

    const styles = getRoleStyles();

    return (
      <div className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 ${styles.cardBg} ${styles.borderColor} ${styles.hoverBg} rounded-xl border transition-all duration-200 hover:shadow-md`}>
        <div className="relative">
          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-md">
            <AvatarFallback className="text-xs sm:text-sm font-bold bg-white dark:bg-slate-700">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full ${styles.cardBg} ${styles.borderColor} border-2 flex items-center justify-center`}>
            {role === 'head' && <Crown className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${styles.iconColor}`} />}
            {role === 'manager' && <UserCheck className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${styles.iconColor}`} />}
            {role === 'member' && <Users className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${styles.iconColor}`} />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm sm:text-base">{user.name}</p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">{user.email}</p>
          {user.mobileNumber && (
            <p className="text-xs text-slate-500 dark:text-slate-500 truncate">{user.mobileNumber}</p>
          )}
        </div>
        <Badge className={`text-xs font-medium px-2 sm:px-3 py-1 ${styles.badgeStyle} hidden sm:inline-flex`}>
          {role === 'head' ? 'Department Head' : role === 'manager' ? 'Manager' : 'Team Member'}
        </Badge>
        <Badge className={`text-xs font-medium px-2 py-1 ${styles.badgeStyle} sm:hidden`}>
          {role === 'head' ? 'Head' : role === 'manager' ? 'Mgr' : 'Member'}
        </Badge>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-800/10 rounded-xl border border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all duration-200">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-lg">
            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">{head ? 1 : 0}</p>
          <p className="text-xs sm:text-sm font-medium text-yellow-700 dark:text-yellow-300">Department Head</p>
        </div>
        <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-200">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-lg">
            <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{managers.length}</p>
          <p className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">Managers</p>
        </div>
        <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/20 dark:to-slate-700/10 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-lg">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-600 dark:text-slate-400">{regularMembers.length}</p>
          <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Team Members</p>
        </div>
      </div>

      {/* Enhanced Hierarchy Structure */}
      <div className="space-y-4 sm:space-y-6">
        {/* Department Head */}
        {head ? (
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100/30 dark:from-yellow-900/20 dark:to-yellow-800/10 rounded-xl border border-yellow-200 dark:border-yellow-800 p-4 sm:p-6">
            <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 text-yellow-700 dark:text-yellow-400">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              Department Head
            </h4>
            <UserCard user={head} role="head" />
          </div>
        ) : (
          <div className="text-center py-12 bg-gradient-to-r from-yellow-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-800/10 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 mb-2">No Department Head Assigned</h3>
            <p className="text-sm text-yellow-600 dark:text-yellow-500">This department needs a head to be assigned for proper management</p>
          </div>
        )}

        {/* Managers */}
        {managers.length > 0 ? (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/30 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200 dark:border-blue-800 p-4 sm:p-6">
            <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 text-blue-700 dark:text-blue-400">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="hidden sm:inline">Managers ({managers.length})</span>
              <span className="sm:hidden">Managers ({managers.length})</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {managers.map(manager => (
                <UserCard key={manager.id} user={manager} role="manager" />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-2">No Managers Assigned</h3>
            <p className="text-sm text-blue-600 dark:text-blue-500">Consider assigning managers to help with team coordination</p>
          </div>
        )}

        {/* Regular Members */}
        {regularMembers.length > 0 ? (
          <div className="bg-gradient-to-r from-slate-50 to-slate-100/30 dark:from-slate-800/20 dark:to-slate-700/10 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 text-slate-700 dark:text-slate-400">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="hidden sm:inline">Team Members ({regularMembers.length})</span>
              <span className="sm:hidden">Members ({regularMembers.length})</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-h-96 overflow-y-auto pr-2">
              {regularMembers.map(member => (
                <UserCard key={member.id} user={member} role="member" />
              ))}
            </div>
            {regularMembers.length > 8 && (
              <div className="text-center mt-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 inline-block">
                  Scroll to view all {regularMembers.length} team members
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/20 dark:to-slate-700/10 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-400 mb-2">No Team Members</h3>
            <p className="text-sm text-slate-600 dark:text-slate-500">Add team members to build your department</p>
          </div>
        )}

        {isEmptyDepartment && (
          <div className="text-center py-12 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 rounded-xl border border-red-200 dark:border-red-800">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Empty Department</h3>
            <p className="text-sm text-red-600 dark:text-red-500">No members assigned to this department yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
