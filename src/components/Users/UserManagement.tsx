import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  UserPlus, Search, Filter, Edit, Trash2, Mail, Building2, 
  Users, CheckCircle, XCircle, Crown, Shield, User as UserIcon, Key, Phone,
  Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { mockDepartments } from '@/data/mockData';
import { User, UserRole } from '@/types/company';
import toast from 'react-hot-toast';
import { userService } from '@/services/userService';
import { departmentService } from '@/services/departmentService';
import { useQuery } from '@tanstack/react-query';
import AddUserDialog from './AddUserDialog';
import EditUserDialog from './EditUserDialog';
import PasswordManagementDialog from './PasswordManagementDialog';

export default function UserManagement() {

  // Helper to safely format createdAt which can be Date or string
  const formatDate = (value: string | Date | undefined) => {
    if (!value) return '';
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN((d as Date).getTime())) return '';
    return (d as Date).toLocaleDateString();
  };

  // State variables
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(1000); // Show all users by default

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['users', currentPage, usersPerPage, statusFilter, roleFilter, departmentFilter],
    queryFn: async () => {
      // For now, get all users and handle pagination client-side
      // In future, can switch to server-side pagination by using:
      // const response = await userService.getUsers({
      //   page: currentPage,
      //   limit: usersPerPage,
      //   search: searchTerm,
      //   role: roleFilter !== 'all' ? roleFilter : undefined,
      //   status: statusFilter !== 'all' ? statusFilter : undefined,
      //   departmentId: departmentFilter !== 'all' ? departmentFilter : undefined,
      // });
      
      // Try to get all users from backend
      let allUsers: any[] = [];
      let page = 1;
      let hasMore = true;
      const limit = 100; // Reasonable page size
      
      while (hasMore) {
        const response = await userService.getUsers({
          limit,
          page,
          sort: 'createdAt',
          order: 'desc'
        });
        
        const list = (response as any).data || (response as any).users || [];
        allUsers = [...allUsers, ...list];
        
        console.log(`📄 Page ${page}: ${list.length} users, Total so far: ${allUsers.length}`);
        
        // Check if we got fewer users than requested (indicating last page)
        if (list.length < limit) {
          hasMore = false;
        } else {
          page++;
        }
        
        // Safety break to prevent infinite loops
        if (page > 50) {
          console.warn('⚠️ Reached safety limit of 50 pages');
          hasMore = false;
        }
      }
      
      console.log('🔍 Final total users from backend:', allUsers.length);
      const list = allUsers;
      // Ensure each user has firstName and lastName fields and normalize department info
      return list.map((u: any) => {
        const firstName = u.firstName || (u.name ? u.name.split(' ')[0] : '');
        const lastName = u.lastName || (u.name ? u.name.split(' ').slice(1).join(' ') : '');

        // Backend may return a populated `department` object or a `departmentId` string.
        const deptObj = u.department;
        const rawDeptId = deptObj ? (deptObj._id || deptObj.id || u.departmentId) : u.departmentId;
        const departmentId = rawDeptId ? String(rawDeptId) : undefined;
        const departmentName = deptObj && deptObj.name ? deptObj.name : (departmentId ? (mockDepartments.find((d) => d.id === departmentId)?.name || undefined) : undefined);

        // Convert backend status string to isActive boolean for frontend
        const isActive = u.status === 'active';

        return {
          ...u,
          firstName,
          lastName,
          departmentId,
          departmentName,
          isActive
        };
      });
    }
  });

  // Fetch departments for filter dropdown
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      try {
        const response = await departmentService.getDepartments({ limit: 1000 });
        return response.data || [];
      } catch (error) {
        console.warn('Failed to fetch departments, using mock data:', error);
        return mockDepartments; // Fallback to mock data
      }
    }
  });

  // Filter users based on search and filters
  const allFilteredUsers = users.filter(user => {
    const matchesSearch = (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesDepartment = departmentFilter === 'all' || user.departmentId === departmentFilter;

    return matchesSearch && matchesStatus && matchesRole && matchesDepartment;
  });

  // Pagination calculations
  const totalUsers = allFilteredUsers.length;
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const filteredUsers = allFilteredUsers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter, departmentFilter]);

  

  const handleAddUser = async (newUser: User) => {
    const nameParts = newUser.name?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || 'User'; // Default to 'User' if no lastName
    
    const payload: any = {
      firstName,
      lastName,
      email: newUser.email,
      password: newUser.password,
      mobileNumber: newUser.mobileNumber,
      role: newUser.role,
      departmentId: newUser.departmentId
    };


    // Attach hodId if provided by dialog (for managers)
    if ((newUser as any).hodId) payload.hodId = (newUser as any).hodId;
    // Attach managerId if provided by dialog (for members)
    if ((newUser as any).managerId !== undefined) payload.managerId = (newUser as any).managerId;

    try {
      await userService.createUser(payload);
      refetch();
      toast.success(`${newUser.name} has been added successfully.`);
    } catch (error) {
      console.error('User creation error:', error);
      console.log('Payload being sent:', payload);

      // Show detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to add user: ${errorMessage}`);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const nameParts = updatedUser.name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || 'User'; // Default to 'User' if no lastName

      const payload: any = {
        firstName,
        lastName,
        email: updatedUser.email,
        mobileNumber: updatedUser.mobileNumber,
        role: updatedUser.role,
        departmentId: updatedUser.departmentId,
      };

      // Include managerId and hodId when provided by the dialog
      if ((updatedUser as any).managerId !== undefined) payload.managerId = (updatedUser as any).managerId;
      if ((updatedUser as any).hodId) payload.hodId = (updatedUser as any).hodId;

      // Backend will handle all role change logic automatically
      await userService.updateUser(updatedUser.id, payload);
      refetch();
      toast.success(`${updatedUser.name} has been updated successfully.`);
    } catch (error) {
      toast.error("Failed to update user.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const userToDelete = users.find(u => u.id === userId);
      await userService.deleteUser(userId);
      refetch();
      toast.success(`${userToDelete?.name} has been deleted successfully.`);
    } catch (error) {
      toast.error("Failed to delete user.");
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      const newStatus = user?.isActive ? 'inactive' : 'active';

      await userService.toggleUserStatus(userId, newStatus);
      refetch();

      toast.success(`${user?.name} has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`);
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error("Failed to update user status.");
    }
  };

  const handlePasswordChanged = (userId: string, userName: string) => {
    toast.success(`Password has been updated for ${userName}.`);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'department_head':
        return <Building2 className="h-4 w-4" />;
      case 'manager':
        return <Users className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'department_head':
        return 'outline';
      case 'manager':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return 'No Department';
    const department = departments.find(d => d.id === departmentId);
    return department ? department.name : 'Unknown Department';
  };

  const getManagerName = (managerId?: string) => {
    if (!managerId) return 'No Manager';
    const manager = users.find(u => u.id === managerId);
    return manager ? manager.name : 'Unknown Manager';
  };

  // Statistics (use original users array, not filtered)
  const totalUsersCount = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = totalUsersCount - activeUsers;
  const adminUsers = users.filter(u => u.role === 'admin' || u.role === 'super_admin').length;

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-50/50 dark:bg-slate-900/50 p-6 overflow-x-hidden w-full">
        <div className="w-full max-w-none space-y-8 overflow-x-hidden h-full overflow-y-auto scrollbar-hide">
          {/* Header */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent rounded-xl"></div>
            <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-lg shadow-red-500/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 dark:from-red-400 dark:via-red-500 dark:to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">User Management</h1>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Manage user accounts, roles, and permissions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Loading Spinner */}
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <div className="relative">
              {/* Outer ring */}
              <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin border-t-red-600"></div>
              {/* Inner ring */}
              <div className="absolute top-2 left-2 w-12 h-12 border-4 border-slate-100 dark:border-slate-600 rounded-full animate-spin border-t-red-400" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              {/* Center dot */}
              <div className="absolute top-6 left-6 w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Loading Users</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Fetching user data...</p>
              <div className="flex justify-center space-x-1 mt-4">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50/50 dark:bg-slate-900/50 p-2 sm:p-4 lg:p-6 overflow-x-hidden w-full">
      <div className="w-full max-w-none space-y-4 sm:space-y-6 lg:space-y-8 overflow-x-hidden h-full overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="relative overflow-hidden w-full">
          <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent rounded-xl"></div>
          <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-3 sm:p-4 lg:p-6 shadow-lg shadow-red-500/5 overflow-hidden">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 dark:from-red-400 dark:via-red-500 dark:to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">User Management</h1>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">Manage user accounts, roles, and permissions</p>
                  <div className="flex items-center gap-2 sm:gap-4 mt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>System Active</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Users className="h-3 w-3" />
                      <span>{totalUsersCount} Total Users</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <Button 
                  variant="outline" 
                  onClick={() => setPasswordDialogOpen(true)}
                  className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-red-300 dark:hover:border-red-600 rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 py-2"
                >
                  <Key className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Passwords</span>
                  <span className="sm:hidden">Pass</span>
                </Button>
                <Button 
                  onClick={() => setAddDialogOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-xs sm:text-sm px-2 sm:px-3 py-2"
                >
                  <UserPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Add User</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 overflow-hidden">
          <Card className="group border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-sm transition-shadow duration-200 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Total Users</CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{totalUsersCount}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                All registered users
              </p>
            </CardContent>
          </Card>

          <Card className="group border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-sm transition-shadow duration-200 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Active Users</CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{activeUsers}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Currently active accounts
              </p>
            </CardContent>
          </Card>

          <Card className="group border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-sm transition-shadow duration-200 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Inactive Users</CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{inactiveUsers}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Deactivated accounts
              </p>
            </CardContent>
          </Card>

          <Card className="group border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-sm transition-shadow duration-200 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Admin Users</CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{adminUsers}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Admin level access
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-slate-900 dark:text-slate-100">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-base sm:text-lg font-bold">User Filters</span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Filter and search through your user database</p>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 h-10 sm:h-12 rounded-xl border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400 text-sm"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 sm:h-12 rounded-xl border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400 text-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-10 sm:h-12 rounded-xl border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400 text-sm">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="department_head">Department Head</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="h-10 sm:h-12 rounded-xl border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400 text-sm">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-slate-900 dark:text-slate-100">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-base sm:text-lg font-bold">
                <span className="hidden sm:inline">Users ({totalUsers} total, showing {filteredUsers.length})</span>
                <span className="sm:hidden">Users ({filteredUsers.length})</span>
              </span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Manage and view all user accounts in your system</p>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block w-full overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100 px-2 w-16 text-sm">SL No</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100 px-2 w-48 text-sm">User</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100 px-2 w-32 text-sm">Role</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100 px-2 w-36 text-sm">Department</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100 px-2 w-32 text-sm">Manager</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100 px-2 w-32 text-sm">Mobile</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100 px-2 w-24 text-sm">Status</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100 px-2 w-28 text-sm">Created</TableHead>
                      <TableHead className="text-right font-semibold text-slate-900 dark:text-slate-100 px-2 w-20 text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                  <TableCell colSpan={9} className="text-center py-16">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <Search className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                          </div>
                          <div className="text-center space-y-2">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No users found</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
                              {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' || departmentFilter !== 'all'
                                ? "Try adjusting your search or filter criteria to find users."
                                : "No users have been added to your system yet."}
                            </p>
                            {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all' || departmentFilter !== 'all') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSearchTerm('');
                                  setStatusFilter('all');
                                  setRoleFilter('all');
                                  setDepartmentFilter('all');
                                }}
                                className="mt-4"
                              >
                                Clear all filters
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user, index) => (
                    <TableRow key={user.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <TableCell className="py-3 sm:py-4 px-2 w-16">
                        <div className="text-center">
                          <span className="text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm">
                            {startIndex + index + 1}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 w-48">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-slate-200 dark:border-slate-600 flex-shrink-0">
                            <AvatarFallback className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-xs sm:text-sm">{user.name}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 w-32">
                        <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1 w-fit px-2 py-1 text-xs">
                          {getRoleIcon(user.role)}
                          <span className="truncate">{formatRole(user.role)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 w-36">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300 truncate text-xs sm:text-sm">{getDepartmentName(user.departmentId)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 w-32">
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300 truncate text-xs sm:text-sm">{getManagerName(user.managerId)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 w-32">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300 truncate text-xs sm:text-sm">
                            {user.mobileNumber || user.phoneNumber || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                    
                      <TableCell className="py-3 sm:py-4 px-2 w-24">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id)}
                          className="h-auto p-0 hover:bg-transparent"
                        >
                          <Badge 
                            variant={user.isActive ? 'default' : 'secondary'}
                            className={`px-2 py-1 text-xs ${
                              user.isActive 
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' 
                                : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                            }`}
                          >
                            {user.isActive ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </Button>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 w-28">
                        <span className="text-slate-700 dark:text-slate-300 text-xs truncate">{formatDate(user.createdAt)}</span>
                      </TableCell>
                      <TableCell className="text-right py-3 sm:py-4 px-2 w-20">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            <Edit className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border-slate-200 dark:border-slate-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-slate-900 dark:text-slate-100">Delete User</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                                  Are you sure you want to delete {user.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-slate-200 dark:border-slate-600">Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden p-3 sm:p-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No users found</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                      {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' || departmentFilter !== 'all'
                        ? "Try adjusting your search or filter criteria to find users."
                        : "No users have been added to your system yet."}
                    </p>
                    {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all' || departmentFilter !== 'all') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setRoleFilter('all');
                          setDepartmentFilter('all');
                        }}
                        className="mt-4"
                      >
                        Clear all filters
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((user, index) => (
                    <Card key={user.id} className="border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="w-10 h-10 border-2 border-slate-200 dark:border-slate-600 flex-shrink-0">
                              <AvatarFallback className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">{user.name}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              <Edit className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="border-slate-200 dark:border-slate-700">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-slate-900 dark:text-slate-100">Delete User</AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                                    Are you sure you want to delete {user.name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-slate-200 dark:border-slate-600">Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1 w-fit px-2 py-1 text-xs">
                              {getRoleIcon(user.role)}
                              <span className="truncate">{formatRole(user.role)}</span>
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                            <span className="text-slate-700 dark:text-slate-300 truncate">{getDepartmentName(user.departmentId)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-3 w-3 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                            <span className="text-slate-700 dark:text-slate-300 truncate">{getManagerName(user.managerId)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                            <span className="text-slate-700 dark:text-slate-300 truncate">
                              {user.mobileNumber || user.phoneNumber || 'N/A'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                            <span className="text-slate-700 dark:text-slate-300 truncate">{formatDate(user.createdAt)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleUserStatus(user.id)}
                              className="h-auto p-0 hover:bg-transparent"
                            >
                              <Badge 
                                variant={user.isActive ? 'default' : 'secondary'}
                                className={`px-2 py-1 text-xs ${
                                  user.isActive 
                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' 
                                    : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                                }`}
                              >
                                {user.isActive ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inactive
                                  </>
                                )}
                              </Badge>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            {/* Pagination Controls */}
            {totalUsers > 0 && (
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-3 sm:p-4 lg:p-6 border-t border-slate-200 dark:border-slate-700 gap-4 overflow-hidden">
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:gap-4">
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalUsers)} of {totalUsers} users
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Users per page:</label>
                    <select
                      value={usersPerPage}
                      onChange={(e) => {
                        setUsersPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 sm:px-3 py-1 border border-slate-200 dark:border-slate-600 rounded-md text-xs sm:text-sm bg-white dark:bg-slate-800"
                    >
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                      <option value={200}>200 per page</option>
                      <option value={500}>500 per page</option>
                      <option value={1000}>1000 per page</option>
                      <option value={totalUsers}>Show All ({totalUsers})</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1 mx-1 sm:mx-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <AddUserDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onUserAdded={handleAddUser}
        />

        <EditUserDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={selectedUser}
          onUserUpdated={handleUpdateUser}
        />

        <PasswordManagementDialog
          open={passwordDialogOpen}
          onOpenChange={setPasswordDialogOpen}
          users={users}
          onPasswordChanged={handlePasswordChanged}
        />
      </div>
    </div>
  );
}