import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Building2,
  Shield,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader
} from 'lucide-react';
import { toast } from 'sonner';
import { saasAuthService } from '@/services/saasAuthService';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobileNumber?: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin?: string;
  loginCount?: number;
  department?: {
    _id: string;
    name: string;
  };
}

interface CompanyUsersManagementProps {
  companyId: string;
  companyName: string;
}

export default function CompanyUsersManagement({ companyId, companyName }: CompanyUsersManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingUser, setAddingUser] = useState(false);
  const [executingAction, setExecutingAction] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserActions, setShowUserActions] = useState(false);
  const [actionType, setActionType] = useState<string>('');

  // New user form
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobileNumber: '',
    role: 'member',
    department: ''
  });

  // Edit user form
  const [editUser, setEditUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: ''
  });

  // Get unique departments from users
  const getUniqueDepartments = () => {
    const departments = users
      .map(user => user.department)
      .filter(dept => dept && dept._id && dept.name)
      .filter((dept, index, self) =>
        self.findIndex(d => d._id === dept._id) === index
      );
    return departments;
  };

  useEffect(() => {
    fetchUsers();
  }, [companyId]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Remove pre-API authentication check - let authenticatedFetch handle it

      console.log('🔍 Fetching company users for company:', companyId);
      const response = await saasAuthService.authenticatedFetch(
        `/api/saas/companies/${companyId}/users`
      );

      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Users data received:', data);
        setUsers(data.data.users || []);
        toast.success(`Loaded ${data.data.users?.length || 0} users`);
      } else {
        const errorData = await response.text();
        console.error('❌ API Error:', errorData);
        toast.error(`Failed to fetch users: ${response.status} ${response.statusText}`);
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
      toast.error('Network error: Unable to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
    
    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleAddUser = async () => {
    setAddingUser(true);
    try {
      // Remove pre-API authentication check - let authenticatedFetch handle it

      console.log('➕ Adding user to company:', companyId);
      const response = await saasAuthService.authenticatedFetch(
        `/api/saas/companies/${companyId}/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newUser)
        }
      );

      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        toast.success('User added successfully');
        setShowAddUserDialog(false);
        setNewUser({ firstName: '', lastName: '', email: '', phone: '', mobileNumber: '', role: 'member', department: '' });
        fetchUsers();
      } else {
        let errorMessage = 'Failed to add user';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error('❌ API Error:', errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
      toast.error('Network error: Unable to add user');
    } finally {
      setAddingUser(false);
    }
  };

  const handleUserAction = async (user: User, action: string) => {
    setSelectedUser(user);
    setActionType(action);

    if (action === 'edit') {
      // Populate edit form with user data
      setEditUser({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        mobileNumber: user.mobileNumber || ''
      });
    }

    setShowUserActions(true);
  };

  const executeUserAction = async () => {
    if (!selectedUser || !actionType) return;

    setExecutingAction(true);
    try {
      // Remove pre-API authentication check - let authenticatedFetch handle it

      if (actionType === 'delete') {
        console.log('🗑️ Deleting user:', selectedUser._id);
        const response = await saasAuthService.authenticatedFetch(
          `/api/saas/companies/${companyId}/users/${selectedUser._id}`,
          {
            method: 'DELETE'
          }
        );

        console.log('📡 API Response status:', response.status);

        if (response.ok) {
          toast.success('User removed successfully');
          fetchUsers();
        } else {
          let errorMessage = 'Failed to remove user';
          try {
            const error = await response.json();
            errorMessage = error.message || errorMessage;
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          console.error('❌ API Error:', errorMessage);
          toast.error(errorMessage);
        }
      } else if (actionType === 'edit') {
        console.log('✏️ Editing user:', selectedUser._id);
        const response = await saasAuthService.authenticatedFetch(
          `/api/saas/companies/${companyId}/users/${selectedUser._id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(editUser)
          }
        );

        console.log('📡 API Response status:', response.status);

        if (response.ok) {
          toast.success('User updated successfully');
          fetchUsers();
        } else {
          let errorMessage = 'Failed to update user';
          try {
            const error = await response.json();
            errorMessage = error.message || errorMessage;
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          console.error('❌ API Error:', errorMessage);
          toast.error(errorMessage);
        }
      } else if (actionType === 'suspend' || actionType === 'activate') {
        console.log(`🔄 ${actionType} user:`, selectedUser._id);
        const response = await saasAuthService.authenticatedFetch(
          `/api/saas/companies/${companyId}/users/${selectedUser._id}/status`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: actionType === 'suspend' ? 'suspended' : 'active'
            })
          }
        );

        console.log('📡 API Response status:', response.status);

        if (response.ok) {
          toast.success(`User ${actionType === 'suspend' ? 'suspended' : 'activated'} successfully`);
          fetchUsers();
        } else {
          let errorMessage = `Failed to ${actionType} user`;
          try {
            const error = await response.json();
            errorMessage = error.message || errorMessage;
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          console.error('❌ API Error:', errorMessage);
          toast.error(errorMessage);
        }
      } else {
        // Handle other actions if any
        console.log(`🔄 ${actionType} user:`, selectedUser._id);
        toast.success(`User ${actionType} successful`);
        fetchUsers();
      }

      setShowUserActions(false);
      setSelectedUser(null);
      setActionType('');
    } catch (error) {
      console.error('❌ Network Error:', error);
      toast.error('Network error: Action failed');
    } finally {
      setExecutingAction(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'hr': return 'bg-green-100 text-green-800';
      case 'department_head': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRole = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrator',
      'manager': 'Manager',
      'member': 'Member',
      'hr': 'HR',
      'department_head': 'Department Head'
    };
    return roleMap[role] || role;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Users in {companyName}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage users and their roles within the company
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-3" />
              <div>
                <div className="text-lg sm:text-2xl font-bold">{users.length}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mr-3" />
              <div>
                <div className="text-lg sm:text-2xl font-bold">
                  {users.filter(u => u.status === 'active').length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Active Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <UserX className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 mr-3" />
              <div>
                <div className="text-lg sm:text-2xl font-bold">
                  {users.filter(u => u.status === 'suspended').length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Suspended</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mr-3" />
              <div>
                <div className="text-lg sm:text-2xl font-bold">
                  {users.filter(u => u.role === 'admin').length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Administrators</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="department_head">Department Head</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="w-full sm:w-auto"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-base sm:text-lg">Users ({filteredUsers.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchUsers} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
          </div>
        </CardHeader>
        
        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4 p-4">
          {paginatedUsers.map((user) => (
            <Card key={user._id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-blue-600">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getStatusColor(user.status)}`}>
                    {user.status}
                  </Badge>
                  <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                    {formatRole(user.role)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-500">Department</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center">
                    <Building2 className="h-3 w-3 mr-1 text-gray-400" />
                    {user.department?.name || 'No Department'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Phone</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center">
                    <Phone className="h-3 w-3 mr-1 text-gray-400" />
                    {user.phone || user.mobileNumber || 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-500">Last Login</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Login Count</div>
                  <div className="text-sm font-medium text-blue-600">
                    {user.loginCount || 0}
                  </div>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="text-xs text-gray-500">Joined</div>
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(user.createdAt)}
                </div>
              </div>
              
              <div className="flex items-center justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => handleUserAction(user, 'edit')}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit User
                    </DropdownMenuItem>
                    
                    {user.status === 'active' && (
                      <DropdownMenuItem 
                        onClick={() => handleUserAction(user, 'suspend')}
                        className="text-orange-600"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Suspend User
                      </DropdownMenuItem>
                    )}
                    
                    {user.status === 'suspended' && (
                      <DropdownMenuItem 
                        onClick={() => handleUserAction(user, 'activate')}
                        className="text-green-600"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Activate User
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem 
                      onClick={() => handleUserAction(user, 'delete')}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">User</TableHead>
                <TableHead className="text-xs sm:text-sm">Role</TableHead>
                <TableHead className="text-xs sm:text-sm hidden md:table-cell">Department</TableHead>
                <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Phone</TableHead>
                <TableHead className="text-xs sm:text-sm">Status</TableHead>
                <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Last Login</TableHead>
                <TableHead className="text-xs sm:text-sm hidden xl:table-cell">Login Count</TableHead>
                <TableHead className="text-xs sm:text-sm hidden xl:table-cell">Joined</TableHead>
                <TableHead className="text-xs sm:text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                        <span className="text-xs sm:text-sm font-bold text-blue-600">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                      {formatRole(user.role)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center">
                      <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-400" />
                      <span className="text-xs sm:text-sm">{user.department?.name || 'No Department'}</span>
                    </div>
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-1 text-gray-400" />
                      <span className="text-xs sm:text-sm">{user.phone || user.mobileNumber || 'N/A'}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge className={`text-xs ${getStatusColor(user.status)}`}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="hidden lg:table-cell">
                    <div className="text-xs sm:text-sm">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </div>
                  </TableCell>
                  
                  <TableCell className="hidden xl:table-cell">
                    <div className="text-xs sm:text-sm font-medium text-blue-600">
                      {user.loginCount || 0}
                    </div>
                  </TableCell>
                  
                  <TableCell className="hidden xl:table-cell">
                    <div className="text-xs sm:text-sm">
                      {formatDate(user.createdAt)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => handleUserAction(user, 'edit')}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        
                        {user.status === 'active' && (
                          <DropdownMenuItem 
                            onClick={() => handleUserAction(user, 'suspend')}
                            className="text-orange-600"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Suspend User
                          </DropdownMenuItem>
                        )}
                        
                        {user.status === 'suspended' && (
                          <DropdownMenuItem 
                            onClick={() => handleUserAction(user, 'activate')}
                            className="text-green-600"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Activate User
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          onClick={() => handleUserAction(user, 'delete')}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 gap-4">
            <div className="text-xs sm:text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="text-xs sm:text-sm"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (page > totalPages) return null;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs sm:text-sm"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Add a new user to {companyName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                  placeholder="Last name"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="user@company.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mobile</label>
                <Input
                  type="tel"
                  value={newUser.mobileNumber}
                  onChange={(e) => setNewUser({...newUser, mobileNumber: e.target.value})}
                  placeholder="+1 (555) 987-6543"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Role</label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="department_head">Department Head</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowAddUserDialog(false)}
                disabled={addingUser}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={addingUser}
              >
                {addingUser ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add User'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Action Dialog */}
      <Dialog open={showUserActions} onOpenChange={setShowUserActions}>
        <DialogContent className={actionType === 'edit' ? 'max-w-2xl' : 'max-w-md'}>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'delete' && 'Remove User'}
              {actionType === 'suspend' && 'Suspend User'}
              {actionType === 'activate' && 'Activate User'}
              {actionType === 'edit' && 'Edit User'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  {actionType === 'delete' && `Are you sure you want to remove ${selectedUser.firstName} ${selectedUser.lastName} from the company?`}
                  {actionType === 'suspend' && `Are you sure you want to suspend ${selectedUser.firstName} ${selectedUser.lastName}?`}
                  {actionType === 'activate' && `Are you sure you want to activate ${selectedUser.firstName} ${selectedUser.lastName}?`}
                  {actionType === 'edit' && `Edit details for ${selectedUser.firstName} ${selectedUser.lastName}`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {actionType === 'edit' && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    value={editUser.firstName}
                    onChange={(e) => setEditUser({...editUser, firstName: e.target.value})}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    value={editUser.lastName}
                    onChange={(e) => setEditUser({...editUser, lastName: e.target.value})}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Mobile</label>
                <Input
                  value={editUser.mobileNumber}
                  onChange={(e) => setEditUser({...editUser, mobileNumber: e.target.value})}
                  placeholder="Enter mobile number"
                />
              </div>


            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowUserActions(false)}
              disabled={executingAction}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'delete' ? 'destructive' : 'default'}
              onClick={executeUserAction}
              disabled={executingAction}
            >
              {executingAction ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  {actionType === 'delete' && 'Remove User'}
                  {actionType === 'suspend' && 'Suspend User'}
                  {actionType === 'activate' && 'Activate User'}
                  {actionType === 'edit' && 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
