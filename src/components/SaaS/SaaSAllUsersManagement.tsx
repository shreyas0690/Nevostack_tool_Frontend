import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Download,
  RefreshCw,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Shield,
  Activity,
  Mail,
  Phone,
  Calendar,
  Monitor,
  Smartphone,
  Globe,
  Key,
  UserCheck,
  LogOut,
  History,
  MessageSquare,
  FileText,
  Crown,
  Star,
  Zap,
  ChevronRight,
  ChevronLeft,
  Ban,
  PlayCircle,
  PauseCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { saasAuthService } from '@/services/saasAuthService';

// Enhanced User Interface
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string;
  role: 'admin' | 'department_head' | 'manager' | 'member' | 'hr' | 'hr_manager';
  status: 'active' | 'blocked' | 'suspended' | 'pending';
  companyId: string;
  companyName: string;
  department?: string;
  lastLogin: string;
  createdAt: string;
  isEmailVerified: boolean;
  profile: {
    jobTitle?: string;
    employeeId?: string;
    dateOfJoining?: string;
  };
  permissions: string[];
  loginHistory: {
    ip: string;
    device: string;
    location: string;
    timestamp: string;
  }[];
  activityStats: {
    tasksCreated: number;
    leavesRequested: number;
    meetingsOrganized: number;
    meetingsAttended: number;
    totalLogins: number;
  };
  loginCount?: number;
}


export default function SaaSAllUsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [actionReason, setActionReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [uniqueCompanies, setUniqueCompanies] = useState<string[]>([]);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    suspendedUsers: 0,
    pendingUsers: 0,
    roleStats: [],
    companyStats: []
  });

  // Fetch users from backend
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);

      // Remove pre-API authentication check - let authenticatedFetch handle it
      // This allows refresh token to work automatically

      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        search: debouncedSearchTerm,
        role: roleFilter,
        status: statusFilter,
        company: companyFilter
      });

      console.log('👥 Fetching users with params:', params.toString());

      const response = await saasAuthService.authenticatedFetch(
        `/api/saas/users?${params.toString()}`
      );

      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();

        console.log('📊 Users data received:', data.data.users.length, 'users');
        console.log('🔍 Sample user data:', data.data.users[0]);

        setUsers(data.data.users);
        setFilteredUsers(data.data.users);
        setTotalUsers(data.data.pagination.totalUsers);
        setTotalPages(data.data.pagination.totalPages);
        setUniqueCompanies(data.data.filters.companies);

        // Extract stats data from the response
        if (data.data && data.data.stats) {
          setUserStats(prevStats => ({
            ...prevStats,
            ...data.data.stats
          }));
        }
      } else {
        const errorData = await response.text();
        console.error('❌ API Error:', errorData);
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
      toast.error('Network error: Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };


  // Debounce search term to avoid too many API calls
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setSearchLoading(true);
    }

    const timer = setTimeout(() => {
      // Only search if term is at least 2 characters or empty
      if (searchTerm.length >= 2 || searchTerm.length === 0) {
        setDebouncedSearchTerm(searchTerm);
      }
      setSearchLoading(false);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  // Fetch users and stats on component mount and when filters change
  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, debouncedSearchTerm, roleFilter, statusFilter, companyFilter]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Export users to Excel
  const handleExportUsers = async () => {
    try {
      setExportLoading(true);

      // Remove pre-API authentication check - let authenticatedFetch handle it

      // Get all users for export (without pagination)
      const params = new URLSearchParams({
        limit: '10000', // Large limit to get all users
        search: debouncedSearchTerm,
        role: roleFilter,
        status: statusFilter,
        company: companyFilter
      });

      const response = await saasAuthService.authenticatedFetch(
        `/api/saas/users?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        const usersToExport = data.data?.users || [];
        
        if (usersToExport.length === 0) {
          toast.info('No users found to export');
          return;
        }

        // Create CSV content
        const headers = [
          'Name',
          'Email',
          'Role',
          'Status',
          'Company',
          'Department',
          'Phone',
          'Last Login',
          'Login Count',
          'Email Verified',
          'Created At'
        ];

        const csvContent = [
          headers.join(','),
          ...usersToExport.map((user: User) => [
            `${(user.firstName || '')} ${(user.lastName || '')}`,
            user.email || '',
            user.role || '',
            user.status || '',
            user.companyName || 'No Company',
            user.department || '',
            user.phone || '',
            user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
            user.loginCount || 0,
            user.isEmailVerified ? 'Yes' : 'No',
            user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'
          ].join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Successfully exported ${usersToExport.length} users`);
      } else {
        const errorData = await response.text();
        console.error('❌ Export Error:', errorData);
        toast.error('Failed to export users');
      }
    } catch (error) {
      console.error('❌ Export Error:', error);
      toast.error('Network error: Failed to export users');
    } finally {
      setExportLoading(false);
    }
  };

  const handleUserAction = async (user: User, action: string) => {
    setSelectedUser(user);
    setActionType(action);
    setShowActionDialog(true);
  };

  const executeAction = async () => {
    if (!selectedUser || !actionType) return;

    try {
      // Remove pre-API authentication check - let authenticatedFetch handle it

      if (actionType === 'delete') {
        // Validate reason for delete
        if (!actionReason.trim()) {
          toast.error('Please provide a reason for deleting the user');
          return;
        }

        const response = await saasAuthService.authenticatedFetch(
          `/api/saas/users/${selectedUser._id}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason: actionReason })
          }
        );

        if (response.ok) {
          toast.success('User deleted successfully');
          fetchUsers(currentPage); // Refresh the list
        } else {
          const errorData = await response.text();
          console.error('❌ Delete Error:', errorData);
          toast.error('Failed to delete user');
        }
      } else if (actionType === 'reset_password') {
        // Handle password reset
        const requestBody = newPassword.trim() ? { newPassword: newPassword.trim() } : {};

        const response = await saasAuthService.authenticatedFetch(
          `/api/saas/users/${selectedUser._id}/reset-password`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          }
        );

        if (response.ok) {
          const data = await response.json();
          const passwordMessage = data.data?.isTemporary
            ? `Generated password: "${data.data.newPassword}" - Please share this with the user securely.`
            : 'Password has been updated successfully.';

          toast.success(`${selectedUser.firstName} ${selectedUser.lastName}'s password has been reset. ${passwordMessage}`);
          console.log('✅ Password reset response:', data);
        } else {
          const errorData = await response.json();
          console.error('❌ Password Reset Error:', errorData);
          toast.error(errorData.message || 'Failed to reset password');
        }
      } else if (actionType === 'force_logout') {
        // Handle force logout
        const response = await saasAuthService.authenticatedFetch(
          `/api/saas/users/${selectedUser._id}/force-logout`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          toast.success(`${selectedUser.firstName} ${selectedUser.lastName} has been forcefully logged out.`);
          console.log('✅ Force logout response:', data);
        } else {
          const errorData = await response.text();
          console.error('❌ Force Logout Error:', errorData);
          toast.error('Failed to force logout');
        }
      } else {
        // Handle status updates
        const statusMap = {
          block: 'blocked',
          unblock: 'active',
          suspend: 'suspended',
          activate: 'active'
        };

        const response = await saasAuthService.authenticatedFetch(
          `/api/saas/users/${selectedUser._id}/status`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              status: statusMap[actionType as keyof typeof statusMap],
              reason: actionReason
            })
          }
        );

        if (response.ok) {
          toast.success(`${actionType} action completed for ${selectedUser.firstName} ${selectedUser.lastName}`);
          fetchUsers(currentPage); // Refresh the list
        } else {
          const errorData = await response.text();
          console.error('❌ Status Update Error:', errorData);
          toast.error('Failed to update user status');
        }
      }
      
      setShowActionDialog(false);
      setActionReason('');
      setNewPassword('');
      setSelectedUser(null);
    } catch (error) {
      console.error('❌ Network Error:', error);
      toast.error('Network error: Action failed');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'department_head': return <Star className="h-4 w-4" />;
      case 'manager': return <Zap className="h-4 w-4" />;
      case 'hr': case 'hr_manager': return <UserCheck className="h-4 w-4" />;
      case 'member': return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'department_head': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-green-100 text-green-800';
      case 'hr': case 'hr_manager': return 'bg-orange-100 text-orange-800';
      case 'member': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLastLogin = (lastLogin: string) => {
    if (!lastLogin) return 'Never';

    const now = Date.now();
    const loginTime = new Date(lastLogin).getTime();

    if (isNaN(loginTime)) return 'Never';

    const diffMinutes = Math.floor((now - loginTime) / (1000 * 60));
    
    if (diffMinutes < 0) return 'Never'; // Future date
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Loading Users...
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Fetching user data from all companies
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            User Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
            Manage users across all companies, roles, permissions, and security settings
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportUsers}
            disabled={exportLoading}
          >
            {exportLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Users
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards - Platform Dashboard Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {userStats.totalUsers}
            </div>
            <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Across all companies
            </div>
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              Growing user base
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Active Users
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {userStats.activeUsers}
            </div>
            <div className="mt-1 text-sm text-green-700 dark:text-green-300">
              Currently active
            </div>
            <div className="mt-2 text-xs text-green-600 dark:text-green-400">
              Good engagement
            </div>
          </CardContent>
        </Card>

        {/* Blocked Users */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
              Blocked Users
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
              {userStats.blockedUsers}
            </div>
            <div className="mt-1 text-sm text-red-700 dark:text-red-300">
              Access restricted
            </div>
            <div className="mt-2 text-xs text-red-600 dark:text-red-400">
              Security actions
            </div>
          </CardContent>
        </Card>

        {/* Pending Users */}
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              Pending Users
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {userStats.pendingUsers}
            </div>
            <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              Awaiting approval
            </div>
            <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
              Needs review
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Panel */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                {searchLoading ? (
                  <RefreshCw className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                )}
                <Input
                  placeholder="Search users by name, email, or company... (min 2 chars)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 border-gray-300 focus:border-blue-500"
                />
                {searchTerm.length === 1 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                    Type more...
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-10 border-gray-300 w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="department_head">Department Head</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="hr_manager">HR Manager</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 border-gray-300 w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="h-10 border-gray-300 w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {uniqueCompanies.map(company => (
                  <SelectItem key={company} value={company}>{company}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
                setCompanyFilter('all');
              }}
              size="sm"
                className="h-10 w-full sm:w-auto"
            >
              Clear Filters
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              User Directory
            </CardTitle>
            <Badge variant="outline" className="text-xs sm:text-sm">
              {filteredUsers.length} users
            </Badge>
          </div>
        </CardHeader>
        
        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4 p-4">
          {users.map((user) => (
            <Card key={user._id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <Avatar className="w-10 h-10 mr-3">
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {user.profile.employeeId}
                    </div>
                    {!user.isEmailVerified && (
                      <div className="text-xs text-red-500 flex items-center mt-0.5">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Email not verified
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getStatusColor(user.status)}`}>
                    {user.status}
                  </Badge>
                  <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                    {user.role.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center">
                    <Mail className="h-3 w-3 mr-1 text-gray-400" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Phone</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center">
                    <Phone className="h-3 w-3 mr-1 text-gray-400" />
                    <span>{user.phone && user.phone !== 'null' && user.phone !== 'undefined' ? user.phone : 'Not provided'}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-500">Company</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">{user.companyName}</div>
                  <div className="text-xs text-gray-500">{user.department || 'No department'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Last Login</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {formatLastLogin(user.lastLogin)}
                  </div>
                  <div className="text-xs text-gray-500">{user.loginCount || 0} total logins</div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedUser(user);
                    setShowUserProfile(true);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {user.status === 'active' && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleUserAction(user, 'block')}
                          className="text-red-600"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Block User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUserAction(user, 'suspend')}
                          className="text-orange-600"
                        >
                          <PauseCircle className="h-4 w-4 mr-2" />
                          Suspend User
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {user.status === 'blocked' && (
                      <DropdownMenuItem
                        onClick={() => handleUserAction(user, 'unblock')}
                        className="text-green-600"
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Unblock User
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      onClick={() => handleUserAction(user, 'reset_password')}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleUserAction(user, 'force_logout')}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Force Logout
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      onClick={() => toast.info('Send Notification feature coming soon!')}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Notification
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => toast.info('Active Logs feature coming soon!')}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Active Logs
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleUserAction(user, 'delete')}
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
              <TableRow className="border-b border-gray-200 dark:border-gray-700">
                <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </TableHead>
                <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Email & Contact
                </TableHead>
                <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </TableHead>
                <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Company
                </TableHead>
                <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Last Login
                </TableHead>
                <TableHead className="text-center py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <TableRow key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {/* User Details */}
                  <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className="flex items-center">
                      <Avatar className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3">
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-xs sm:text-sm">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {user.profile.employeeId}
                        </div>
                        {!user.isEmailVerified && (
                          <div className="text-xs text-red-500 flex items-center mt-0.5">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Email not verified
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Email & Contact */}
                  <TableCell className="py-3 sm:py-4 px-2 sm:px-4 hidden lg:table-cell">
                    <div className="space-y-1">
                      <div className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 flex items-center">
                        <Mail className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="truncate max-w-48">{user.email}</span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Phone className="h-3 w-3 mr-1 text-gray-400" />
                        <span>{user.phone && user.phone !== 'null' && user.phone !== 'undefined' ? user.phone : 'Not provided'}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Role */}
                  <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className="space-y-1">
                      <Badge className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        <div className="mr-1">
                          {getRoleIcon(user.role)}
                        </div>
                        {user.role.replace('_', ' ')}
                      </Badge>
                      {user.profile.jobTitle && (
                        <div className="text-xs text-gray-500">
                          {user.profile.jobTitle}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Company */}
                  <TableCell className="py-3 sm:py-4 px-2 sm:px-4 hidden md:table-cell">
                    <div className="space-y-1">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.companyName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.department || 'No department'}
                      </div>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                    <Badge className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        user.status === 'active' ? 'bg-green-500' :
                        user.status === 'blocked' ? 'bg-red-500' :
                        user.status === 'suspended' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      {user.status}
                    </Badge>
                  </TableCell>

                  {/* Last Login */}
                  <TableCell className="py-3 sm:py-4 px-2 sm:px-4 hidden lg:table-cell">
                    <div className="space-y-1">
                      <div className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        {formatLastLogin(user.lastLogin)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.loginCount || 0} total logins
                      </div>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className="flex items-center justify-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserProfile(true);
                        }}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                            <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                          <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          {user.status === 'active' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleUserAction(user, 'block')}
                                className="text-red-600"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Block User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUserAction(user, 'suspend')}
                                className="text-orange-600"
                              >
                                <PauseCircle className="h-4 w-4 mr-2" />
                                Suspend User
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {user.status === 'blocked' && (
                            <DropdownMenuItem
                              onClick={() => handleUserAction(user, 'unblock')}
                              className="text-green-600"
                            >
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Unblock User
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem
                            onClick={() => handleUserAction(user, 'reset_password')}
                          >
                            <Key className="h-4 w-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUserAction(user, 'force_logout')}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Force Logout
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem
                            onClick={() => toast.info('Send Notification feature coming soon!')}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Notification
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toast.info('Active Logs feature coming soon!')}
                          >
                            <History className="h-4 w-4 mr-2" />
                            Active Logs
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleUserAction(user, 'delete')}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 gap-4">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-medium text-gray-900 dark:text-gray-100">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {Math.min(currentPage * itemsPerPage, totalUsers)}
            </span> of{' '}
            <span className="font-medium text-gray-900 dark:text-gray-100">{totalUsers}</span> users
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 text-xs sm:text-sm"
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
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <span className="px-2 text-gray-400">...</span>
              )}
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Profile Dialog (Simplified) */}
      <Dialog open={showUserProfile} onOpenChange={setShowUserProfile}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Avatar className="w-12 h-12 mr-4">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-bold">
                  {selectedUser?.firstName?.charAt(0)}{selectedUser?.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {selectedUser?.firstName} {selectedUser?.lastName} - User Profile
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="font-semibold">{selectedUser.firstName} {selectedUser.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="font-semibold break-words text-sm leading-relaxed overflow-hidden">{selectedUser.email}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="font-semibold">{selectedUser.phone || 'Not provided'}</p>
                    </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Employee ID</label>
                        <p className="font-semibold">{selectedUser.profile.employeeId}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company & Role */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Company & Role
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Company</label>
                      <p className="font-semibold">{selectedUser.companyName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Department</label>
                      <p className="font-semibold">{selectedUser.department || 'Not assigned'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Role</label>
                      <div className="flex items-center">
                        <div className={`p-1 rounded mr-2 ${getRoleColor(selectedUser.role)}`}>
                          {getRoleIcon(selectedUser.role)}
                        </div>
                        <span className="font-semibold capitalize">{selectedUser.role.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Job Title</label>
                      <p className="font-semibold">{selectedUser.profile.jobTitle || 'Not specified'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Activity Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedUser.activityStats.tasksCreated}
                      </div>
                      <div className="text-sm text-gray-600">Tasks Created</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold text-green-600">
                        {selectedUser.activityStats.meetingsOrganized}
                      </div>
                      <div className="text-sm text-gray-600">Meetings Organized</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedUser.activityStats.meetingsAttended}
                      </div>
                      <div className="text-sm text-gray-600">Meetings Attended</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedUser.activityStats.leavesRequested}
                      </div>
                      <div className="text-sm text-gray-600">Leave Requests</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {actionType === 'block' && <Ban className="h-5 w-5 mr-2 text-red-600" />}
              {actionType === 'unblock' && <PlayCircle className="h-5 w-5 mr-2 text-green-600" />}
              {actionType === 'suspend' && <PauseCircle className="h-5 w-5 mr-2 text-orange-600" />}
              {actionType === 'reset_password' && <Key className="h-5 w-5 mr-2 text-blue-600" />}
              {actionType === 'force_logout' && <LogOut className="h-5 w-5 mr-2 text-purple-600" />}
              {actionType === 'delete' && <Trash2 className="h-5 w-5 mr-2 text-red-600" />}
              
              {actionType === 'block' && 'Block User'}
              {actionType === 'unblock' && 'Unblock User'}
              {actionType === 'suspend' && 'Suspend User'}
              {actionType === 'reset_password' && 'Reset Password'}
              {actionType === 'force_logout' && 'Force Logout'}
              {actionType === 'delete' && 'Delete User'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <div className="mt-2">
                  {actionType === 'reset_password' ? (
                    <div>
                      You are about to <strong>reset the password</strong> for{' '}
                      <strong>"{selectedUser.firstName} {selectedUser.lastName}"</strong> from{' '}
                      <strong>{selectedUser.companyName}</strong>.
                      <div className="text-blue-600 font-medium mt-2">
                        🔑 The user will receive password reset instructions via email.
                      </div>
                    </div>
                  ) : actionType === 'force_logout' ? (
                    <div>
                      You are about to <strong>force logout</strong> the user{' '}
                      <strong>"{selectedUser.firstName} {selectedUser.lastName}"</strong> from{' '}
                      <strong>{selectedUser.companyName}</strong>.
                      <div className="text-purple-600 font-medium mt-2">
                        🚪 This will terminate all active sessions for this user.
                      </div>
                    </div>
                  ) : (
                    <div>
                  You are about to <strong>{actionType.replace('_', ' ')}</strong> the user{' '}
                  <strong>"{selectedUser.firstName} {selectedUser.lastName}"</strong> from{' '}
                  <strong>{selectedUser.companyName}</strong>.
                  {actionType === 'delete' && (
                    <div className="text-red-600 font-medium mt-2">
                      ⚠️ This action cannot be undone and will permanently delete the user account.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {actionType === 'reset_password' ? (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password (Optional)
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave empty to generate a temporary password"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If left empty, a secure temporary password will be generated and shown to you.
                </p>
              </div>
            ) : (actionType === 'force_logout') ? null : (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason {actionType === 'delete' ? '(Required)' : '(Optional)'}
              </label>
              <Textarea 
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={`Enter reason for ${actionType.replace('_', ' ')} action...`}
                rows={3}
                className="mt-1"
              />
            </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowActionDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant={actionType === 'delete' ? 'destructive' : 'default'}
                onClick={executeAction}
                disabled={actionType === 'delete' && !actionReason.trim()}
              >
                {actionType === 'delete' && <AlertTriangle className="h-4 w-4 mr-2" />}
                {actionType === 'reset_password' && <Key className="h-4 w-4 mr-2" />}
                {actionType === 'force_logout' && <LogOut className="h-4 w-4 mr-2" />}
                {actionType === 'block' && <Ban className="h-4 w-4 mr-2" />}
                {actionType === 'unblock' && <PlayCircle className="h-4 w-4 mr-2" />}
                {actionType === 'suspend' && <PauseCircle className="h-4 w-4 mr-2" />}
                Confirm {actionType.replace('_', ' ')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
