import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Building2, 
  Users, 
  CreditCard, 
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Mail,
  Phone,
  Globe,
  MapPin,
  Shield,
  Activity,
  Database,
  FileText,
  MessageSquare,
  Loader,
  Settings,
  UserCheck,
  UserX,
  Crown,
  Star,
  Zap,
  TrendingUp,
  TrendingDown,
  Timer,
  Archive,
  AlertTriangle,
  Send,
  History,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Copy,
  Ban,
  PlayCircle,
  PauseCircle,
  Server,
  Key
} from 'lucide-react';
import { toast } from 'sonner';
import CompanyAnalytics from './CompanyAnalytics';
import CompanyUsersManagement from './CompanyUsersManagement';
import APIConnectionDebug from './APIConnectionDebug';
import SaaSAuthHelper from './SaaSAuthHelper';
import { saasAuthService } from '@/services/saasAuthService';

// Mock data interface
interface Company {
  _id: string;
  // API transformed fields
  companyName: string;
  domain: string;
  email: string;
  phone?: string;
  industry?: string;
  employeeCount?: string;
  status: 'active' | 'suspended' | 'pending' | 'inactive';
  subscriptionPlan: string;
  subscriptionStatus: string;
  currentUsers: number;
  totalDepartments: number;
  totalTasks: number;
  totalMeetings: number;
  totalLeaves: number;
  storageUsed: number;
  lastLogin?: string;
  createdAt: string;
  // Legacy fields for compatibility
  name?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  subscription?: {
    plan: 'basic' | 'pro' | 'enterprise';
    status: 'active' | 'trial' | 'expired' | 'cancelled';
    startDate: string;
    endDate?: string;
    amount: number;
    billingCycle: 'monthly' | 'quarterly' | 'yearly';
  };
  stats?: {
    totalUsers: number;
    totalDepartments: number;
    totalTasks: number;
    totalMeetings: number;
    totalLeaves: number;
    storageUsed: number;
  lastActivity: string;
  };
  ownerEmail: string;
}

// No mock data - using real backend APIs only

export default function SaaSCompaniesManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyProfile, setShowCompanyProfile] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [executingAction, setExecutingAction] = useState(false);
  const [editCompany, setEditCompany] = useState({
    name: '',
    domain: '',
    email: '',
    phone: '',
    industry: '',
    employeeCount: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    }
  });
  const [actionType, setActionType] = useState<string>('');
  const [actionReason, setActionReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);

  // Fetch companies from API
  useEffect(() => {
    // Only show loading for page changes, not for search/filter changes
    if (currentPage === 1 && !searchTerm && statusFilter === 'all' && planFilter === 'all') {
      // Initial load - show loading
      fetchCompanies();
    } else {
      // Search/filter/pagination - don't show loading
      fetchCompaniesWithoutLoading();
    }
  }, [currentPage, searchTerm, statusFilter, planFilter]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);

      // Remove pre-API authentication check - let authenticatedFetch handle it
      // This allows refresh token to work automatically

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        status: statusFilter,
        plan: planFilter
      });

      console.log('🔍 Fetching companies with params:', params.toString());

      const response = await saasAuthService.authenticatedFetch(
        `/api/saas/companies?${params}`
      );

      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Companies data received:', data);
        const companiesData = data?.data?.companies || [];
        const totalCount = data?.data?.pagination?.totalCompanies || 0;

        // Ensure companies is always an array
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
        setTotalCompanies(typeof totalCount === 'number' ? totalCount : 0);
      } else {
        const errorData = await response.text();
        console.error('❌ API Error:', errorData);
        toast.error(`Failed to fetch companies: ${response.status} ${response.statusText}`);
        setCompanies([]);
        setTotalCompanies(0);
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
      toast.error('Network error: Unable to fetch companies');
      setCompanies([]);
      setTotalCompanies(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompaniesWithoutLoading = async () => {
    try {
      // Remove pre-API authentication check - let authenticatedFetch handle it
      // This allows refresh token to work automatically

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        status: statusFilter,
        plan: planFilter
      });

      console.log('🔍 Fetching companies with params:', params.toString());

      const response = await saasAuthService.authenticatedFetch(
        `/api/saas/companies?${params}`
      );

      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Companies data received:', data);
        const companiesData = data?.data?.companies || [];
        const totalCount = data?.data?.pagination?.totalCompanies || 0;

        // Ensure companies is always an array
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
        setTotalCompanies(typeof totalCount === 'number' ? totalCount : 0);
      } else {
        const errorData = await response.text();
        console.error('❌ API Error:', errorData);
        toast.error(`Failed to fetch companies: ${response.status} ${response.statusText}`);
        setCompanies([]);
        setTotalCompanies(0);
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
      toast.error('Network error: Unable to fetch companies');
      setCompanies([]);
      setTotalCompanies(0);
    }
  };

  // Filter and search logic
  useEffect(() => {
    if (!companies || !Array.isArray(companies)) {
      setFilteredCompanies([]);
      return;
    }

    let filtered = companies.filter(company => {
      // Safety check for company object
      if (!company || typeof company !== 'object') {
        return false;
      }

      const matchesSearch = ((company.companyName || '').toString()).toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ((company.email || '').toString()).toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ((company.domain || '').toString()).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
      const matchesPlan = planFilter === 'all' || (company.subscriptionPlan === planFilter);
      
      return matchesSearch && matchesStatus && matchesPlan;
    });
    
    setFilteredCompanies(filtered);
  }, [searchTerm, statusFilter, planFilter, companies]);

  // Pagination - Use companies directly since API handles pagination
  const totalPages = Math.ceil(totalCompanies / itemsPerPage);
  const paginatedCompanies = companies; // API already returns paginated data

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setEditCompany({
      name: company.companyName || '',
      domain: company.domain || '',
      email: company.email || '',
      phone: company.phone || '',
      industry: company.industry || '',
      employeeCount: company.employeeCount || '',
      address: {
        street: company.address?.street || '',
        city: company.address?.city || '',
        state: company.address?.state || '',
        country: company.address?.country || '',
        zipCode: company.address?.zipCode || ''
      }
    });
    setShowEditDialog(true);
  };

  const handleCompanyAction = async (company: Company, action: string) => {
    setSelectedCompany(company);
    setActionType(action);
    setShowActionDialog(true);
  };


  const handleSaveEdit = async () => {
    if (!selectedCompany) return;

    setSavingEdit(true);
    try {
      // Remove pre-API authentication check - let authenticatedFetch handle it

      console.log('💾 Saving company details:', editCompany);
      const response = await saasAuthService.authenticatedFetch(
        `/api/saas/companies/${selectedCompany._id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(editCompany)
        }
      );

      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Company updated:', data);
        console.log('🔄 Refreshing companies list...');
        toast.success('Company details updated successfully');
        setShowEditDialog(false);
        await fetchCompanies(); // Refresh the companies list
        console.log('✅ Companies list refreshed');
      } else {
        let errorMessage = 'Failed to update company';
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
      toast.error('Network error: Unable to update company');
    } finally {
      setSavingEdit(false);
    }
  };

  const executeAction = async () => {
    if (!selectedCompany || !actionType) return;

    setExecutingAction(true);
    try {
      // Remove pre-API authentication check - let authenticatedFetch handle it

      let endpoint = '';
      let method = 'PATCH';
      let body = {};

      switch (actionType) {
        case 'approve':
        case 'activate':
          endpoint = `/api/saas/companies/${selectedCompany._id}/status`;
          body = { status: 'active' };
          break;
        case 'suspend':
          endpoint = `/api/saas/companies/${selectedCompany._id}/status`;
          body = { status: 'suspended' };
          break;
        case 'delete':
          endpoint = `/api/saas/companies/${selectedCompany._id}`;
          method = 'DELETE';
          break;
        default:
          throw new Error('Invalid action');
      }

      const response = await saasAuthService.authenticatedFetch(endpoint, {
        method,
        body: method !== 'DELETE' ? JSON.stringify(body) : undefined
      });

      if (response.ok) {
        toast.success(`${actionType} action completed for ${selectedCompany.name}`);
        fetchCompanies(); // Refresh the list
      } else {
        const error = await response.text();
        console.error('❌ Action failed:', error);
        toast.error(`Action failed: ${response.status} ${response.statusText}`);
      }
      
      setShowActionDialog(false);
      setActionReason('');
      setSelectedCompany(null);
    } catch (error) {
      console.error('Error executing action:', error);
      toast.error('Action failed. Please try again.');
    } finally {
      setExecutingAction(false);
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'basic': return <Star className="h-4 w-4" />;
      case 'pro': return <Zap className="h-4 w-4" />;
      case 'enterprise': return <Crown className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatActiveTime = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      const remainingHours = diffHours - (diffDays * 24);
      if (remainingHours > 0) {
        return `${diffDays}d ${remainingHours}h`;
      } else {
        return `${diffDays}d`;
      }
    } else if (diffHours > 0) {
      const remainingMinutes = diffMinutes - (diffHours * 60);
      if (remainingMinutes > 0) {
        return `${diffHours}h ${remainingMinutes}m`;
      } else {
        return `${diffHours}h`;
      }
    } else {
      return `${diffMinutes}m`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Loading Companies...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Fetching data from backend
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
            Companies Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
            Manage all registered companies, subscriptions, users, and business activities
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={fetchCompanies} className="text-xs sm:text-sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)} className="text-xs sm:text-sm">
            <Server className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{showDebug ? 'Hide' : 'Show'} Debug</span>
            <span className="sm:hidden">Debug</span>
          </Button>
          <Button size="sm" className="text-xs sm:text-sm">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Company</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Auth Helper Panel */}
      {showAuth && (
        <div className="flex justify-center">
          <SaaSAuthHelper onAuthSet={(token) => {
            if (token) {
              fetchCompanies(); // Refresh data when token is set
            }
          }} />
        </div>
      )}

      {/* Debug Panel */}
      {showDebug && (
        <div className="flex justify-center">
          <APIConnectionDebug onConnectionTest={setApiConnected} />
        </div>
      )}

      {/* Stats Cards - Platform Dashboard Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Active Companies */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Active Companies
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {companies.filter(c => c.status === 'active').length}
            </div>
            <div className="mt-1 text-sm text-green-700 dark:text-green-300">
              Platform active
            </div>
            <div className="mt-2 text-xs text-green-600 dark:text-green-400">
              {totalCompanies > 0 ? `${Math.round((companies.filter(c => c.status === 'active').length / totalCompanies) * 100)}% of total` : '0% of total'}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approval */}
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              Pending Approval
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {companies.filter(c => c.status === 'pending').length}
            </div>
            <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              Awaiting review
            </div>
            <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
              {companies.filter(c => c.status === 'pending').length > 0 ? 'Requires attention' : 'All approved'}
            </div>
          </CardContent>
        </Card>

        {/* Suspended */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
              Suspended
            </CardTitle>
            <Ban className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
              {companies.filter(c => c.status === 'suspended').length}
            </div>
            <div className="mt-1 text-sm text-red-700 dark:text-red-300">
              Access blocked
            </div>
            <div className="mt-2 text-xs text-red-600 dark:text-red-400">
              {companies.filter(c => c.status === 'suspended').length > 0 ? 'Need resolution' : 'All active'}
            </div>
          </CardContent>
        </Card>

        {/* Total Companies */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Total Companies
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {totalCompanies}
            </div>
            <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Platform registered
            </div>
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              {companies.length} currently loaded
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Panel - Clean Design */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search companies by name, email, or domain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 border-gray-300 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 h-10 border-gray-300 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full sm:w-32 h-10 border-gray-300 text-sm">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPlanFilter('all');
                }}
                className="h-10 text-sm"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table - Clean Design */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Company Directory
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {companies.length} companies loaded
            </Badge>
          </div>
        </CardHeader>
        
        {companies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Companies Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' || planFilter !== 'all' 
                ? 'No companies match your current filters. Try adjusting your search criteria.'
                : 'No companies are registered yet. Add your first company to get started.'
              }
            </p>
            <div className="flex justify-center gap-3">
              {(searchTerm || statusFilter !== 'all' || planFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPlanFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
              <Button onClick={fetchCompanies}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
        <div className="lg:hidden space-y-4 p-4">
          {(paginatedCompanies || []).map((company, index) => (
            <Card key={company._id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-blue-600">
                      {company.companyName && company.companyName.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {company.companyName || 'Unknown Company'}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <Globe className="h-3 w-3 mr-1" />
                      {company.domain || 'N/A'}
                    </div>
                  </div>
                </div>
                <Badge className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(company.status || 'inactive')}`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    (company.status === 'active') ? 'bg-green-500' :
                    (company.status === 'pending') ? 'bg-yellow-500' :
                    (company.status === 'suspended') ? 'bg-red-500' :
                    'bg-gray-500'
                  }`} />
                  {company.status || 'inactive'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100 truncate">{company.email || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Phone</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">{company.phone || 'N/A'}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{company.currentUsers || 0}</div>
                  <div className="text-xs text-gray-500">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{company.totalDepartments || 0}</div>
                  <div className="text-xs text-gray-500">Depts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{company.totalTasks || 0}</div>
                  <div className="text-xs text-gray-500">Tasks</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Joined: {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCompany(company);
                      setShowCompanyProfile(true);
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
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Company Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {company.status === 'pending' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleCompanyAction(company, 'approve')}
                            className="text-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Company
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCompanyAction(company, 'reject')}
                            className="text-red-600"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Reject Application
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleCompanyAction(company, 'delete')}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Company
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table className="min-w-[1400px]">
            <TableHeader>
              <TableRow className="border-b border-gray-200 dark:border-gray-700">
                <TableHead className="text-center py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px]">
                  SL
                </TableHead>
                <TableHead className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  Company
                </TableHead>
                <TableHead className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                  Contact Info
                </TableHead>
                <TableHead className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                  Plan & Billing
                </TableHead>
                <TableHead className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Status
                </TableHead>
                <TableHead className="text-center py-4 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                  Users
                </TableHead>
                <TableHead className="text-center py-4 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Departments
                </TableHead>
                <TableHead className="text-center py-4 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                  Tasks
                </TableHead>
                <TableHead className="text-center py-4 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">
                  Meetings
                </TableHead>
                <TableHead className="text-center py-4 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[110px]">
                  Leave Requests
                </TableHead>
                <TableHead className="text-center py-4 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                  Active
                </TableHead>
                <TableHead className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Activity
                </TableHead>
                <TableHead className="text-center py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {(paginatedCompanies || []).map((company, index) => (
                <TableRow key={company._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {/* SL Number */}
                  <TableCell className="py-4 px-4 text-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {((currentPage - 1) * itemsPerPage) + index + 1}
                    </span>
                  </TableCell>

                  {/* Company Details */}
                  <TableCell className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-blue-600">
                          {company.companyName && company.companyName.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {company.companyName || 'Unknown Company'}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <Globe className="h-3 w-3 mr-1" />
                          {company.domain || 'N/A'}
                        </div>
                        {company.address && company.address.city && company.address.country && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {company.address.city}, {company.address.country}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact Info */}
                  <TableCell className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center">
                        <Mail className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="truncate max-w-32">{company.email || 'N/A'}</span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Phone className="h-3 w-3 mr-1 text-gray-400" />
                        <span>{company.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Plan & Billing */}
                  <TableCell className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <div className={`p-1 rounded mr-2 ${
                          (company.subscriptionPlan === 'Enterprise') ? 'bg-purple-100 text-purple-600' :
                          (company.subscriptionPlan === 'Professional') ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {getPlanIcon(company.subscriptionPlan === 'Enterprise' ? 'enterprise' :
                                      company.subscriptionPlan === 'Professional' ? 'pro' : 'basic')}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {company.subscriptionPlan || 'Starter'}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-green-600">
                          {formatCurrency((company.subscription?.amount || (company as any).subscriptionAmount || 0))}
                        </span>
                        <span className="text-gray-500">
                          /{(company.subscription?.billingCycle || (company as any).billingCycle) === 'monthly' ? 'mo' : 
                            (company.subscription?.billingCycle || (company as any).billingCycle) === 'yearly' ? 'yr' : 'qtr'}
                        </span>
                      </div>
                      <Badge 
                        variant="outline"
                        className={`text-xs ${
                          (company.subscriptionStatus === 'active')
                            ? 'text-green-700 border-green-200 bg-green-50' :
                          (company.subscriptionStatus === 'trial')
                            ? 'text-blue-700 border-blue-200 bg-blue-50' :
                            'text-red-700 border-red-200 bg-red-50'
                        }`}
                      >
                        {company.subscriptionStatus || 'inactive'}
                      </Badge>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-4 px-4">
                    <Badge className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(company.status || 'inactive')}`}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        (company.status === 'active') ? 'bg-green-500' :
                        (company.status === 'pending') ? 'bg-yellow-500' :
                        (company.status === 'suspended') ? 'bg-red-500' :
                        'bg-gray-500'
                      }`} />
                      {company.status || 'inactive'}
                    </Badge>
                  </TableCell>

                  {/* Users */}
                  <TableCell className="py-4 px-3 text-center">
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-blue-600">
                        {company.currentUsers || 0}
                      </div>
                      <div className="text-xs text-gray-500">
                        total users
                      </div>
                      <div className="text-xs text-gray-400">
                        {company.storageUsed || 0} GB
                      </div>
                    </div>
                  </TableCell>

                  {/* Departments */}
                  <TableCell className="py-4 px-3 text-center">
                    <div className="space-y-1">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <Building2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {company.totalDepartments || 0}
                      </div>
                      <div className="text-xs text-gray-500">
                        departments
                      </div>
                    </div>
                  </TableCell>

                  {/* Tasks */}
                  <TableCell className="py-4 px-3 text-center">
                    <div className="space-y-1">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <FileText className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="text-lg font-bold text-purple-600">
                        {company.totalTasks || 0}
                      </div>
                      <div className="text-xs text-gray-500">
                        tasks
                      </div>
                    </div>
                  </TableCell>

                  {/* Meetings */}
                  <TableCell className="py-4 px-3 text-center">
                    <div className="space-y-1">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <Calendar className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="text-lg font-bold text-orange-600">
                        {company.totalMeetings || 0}
                      </div>
                      <div className="text-xs text-gray-500">
                        meetings
                      </div>
                    </div>
                  </TableCell>

                  {/* Leave Requests */}
                  <TableCell className="py-4 px-3 text-center">
                    <div className="space-y-1">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <Calendar className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="text-lg font-bold text-red-600">
                        {company.totalLeaves || 0}
                      </div>
                      <div className="text-xs text-gray-500">
                        leave requests
                      </div>
                    </div>
                  </TableCell>

                  {/* Active */}
                  <TableCell className="py-4 px-3 text-center">
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-green-600">
                        {company.createdAt ? formatActiveTime(company.createdAt) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        active since
                      </div>
                    </div>
                  </TableCell>

                  {/* Activity */}
                  <TableCell className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Joined:</span> {company.createdAt ? new Date(company.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short', 
                          day: 'numeric'
                        }) : 'N/A'}
                      </div>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-4 px-4">
                    <div className="flex items-center justify-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCompany(company);
                          setShowCompanyProfile(true);
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
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Company Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          {company.status === 'pending' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleCompanyAction(company, 'approve')}
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve Company
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCompanyAction(company, 'reject')}
                                className="text-red-600"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Reject Application
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {company.status === 'active' && (
                            <DropdownMenuItem
                              onClick={() => handleCompanyAction(company, 'suspend')}
                              className="text-orange-600"
                            >
                              <PauseCircle className="h-4 w-4 mr-2" />
                              Suspend Company
                            </DropdownMenuItem>
                          )}
                          
                          {company.status === 'suspended' && (
                            <DropdownMenuItem
                              onClick={() => handleCompanyAction(company, 'activate')}
                              className="text-green-600"
                            >
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Activate Company
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCompany(company);
                              setShowAnalytics(false);
                              setShowUsers(false);
                              setShowCompanyProfile(true);
                            }}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Manage Subscription
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCompany(company);
                              setShowAnalytics(false);
                              setShowUsers(true);
                              setShowCompanyProfile(true);
                            }}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Manage Users
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              // TODO: Implement contact support functionality
                              toast.info('Contact support feature coming soon!');
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contact Support
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleCompanyAction(company, 'delete')}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Company
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
          </>
        )}
      </Card>

      {/* Pagination - Clean Design */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
            Showing <span className="font-medium text-gray-900 dark:text-gray-100">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {Math.min(currentPage * itemsPerPage, totalCompanies)}
            </span> of{' '}
            <span className="font-medium text-gray-900 dark:text-gray-100">{totalCompanies}</span> companies
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage(currentPage - 1);
                // fetchCompanies will be called by useEffect
              }}
              className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                const page = currentPage <= 2 ? i + 1 : currentPage - 1 + i;
                if (page > totalPages) return null;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                      onClick={() => {
                        setCurrentPage(page);
                        // fetchCompanies will be called by useEffect
                      }}
                    className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs sm:text-sm"
                  >
                    {page}
                  </Button>
                );
              })}
              {totalPages > 3 && currentPage < totalPages - 1 && (
                <span className="px-1 sm:px-2 text-gray-400 text-xs">...</span>
              )}
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => {
                setCurrentPage(currentPage + 1);
                // fetchCompanies will be called by useEffect
              }}
              className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Company Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="w-[95vw] max-w-md sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {actionType === 'approve' && <CheckCircle className="h-5 w-5 mr-2 text-green-600" />}
              {actionType === 'reject' && <Ban className="h-5 w-5 mr-2 text-red-600" />}
              {actionType === 'suspend' && <PauseCircle className="h-5 w-5 mr-2 text-orange-600" />}
              {actionType === 'activate' && <PlayCircle className="h-5 w-5 mr-2 text-green-600" />}
              {actionType === 'delete' && <Trash2 className="h-5 w-5 mr-2 text-red-600" />}
              
              {actionType === 'approve' && 'Approve Company'}
              {actionType === 'reject' && 'Reject Company'}
              {actionType === 'suspend' && 'Suspend Company'}
              {actionType === 'activate' && 'Activate Company'}
              {actionType === 'delete' && 'Delete Company'}
            </DialogTitle>
            <DialogDescription>
              {selectedCompany && (
                <div className="mt-2">
                  You are about to <strong>{actionType}</strong> the company{' '}
                  <strong>"{selectedCompany.name}"</strong>.
                  {actionType === 'delete' && (
                    <div className="text-red-600 font-medium mt-2">
                      ⚠️ This action cannot be undone and will permanently delete all company data.
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason {actionType === 'delete' ? '(Required)' : '(Optional)'}
              </label>
              <Textarea 
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={`Enter reason for ${actionType} action...`}
                rows={3}
                className="mt-1"
                disabled={executingAction}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowActionDialog(false)}
                disabled={executingAction}
              >
                Cancel
              </Button>
              <Button 
                variant={actionType === 'delete' ? 'destructive' : 'default'}
                onClick={executeAction}
                disabled={executingAction || (actionType === 'delete' && !actionReason.trim())}
              >
                {executingAction ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                {actionType === 'delete' && <AlertTriangle className="h-4 w-4 mr-2" />}
                Confirm {actionType}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Company Profile Dialog - Enhanced Version */}
      <Dialog open={showCompanyProfile} onOpenChange={setShowCompanyProfile}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedCompany && (
                <>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mr-4">
                    {selectedCompany.companyName && selectedCompany.companyName.charAt(0).toUpperCase() || '?'}
                  </div>
                  {selectedCompany.companyName || 'Unknown Company'} - Company Profile
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCompany && (
            <div className="space-y-6">
              {/* Navigation Tabs */}
              <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={!showAnalytics && !showUsers ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setShowAnalytics(false);
                    setShowUsers(false);
                  }}
                  className="text-xs sm:text-sm w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Overview</span>
                </Button>
                <Button
                  variant={showAnalytics ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setShowAnalytics(true);
                    setShowUsers(false);
                  }}
                  className="text-xs sm:text-sm w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">Analytics</span>
                  <span className="sm:hidden">Analytics</span>
                </Button>
                <Button
                  variant={showUsers ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setShowAnalytics(false);
                    setShowUsers(true);
                  }}
                  className="text-xs sm:text-sm w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">Users</span>
                  <span className="sm:hidden">Users</span>
                </Button>
              </div>

              {/* Content based on selected tab */}
              {!showAnalytics && !showUsers && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Company Name</label>
                      <p className="font-semibold">{selectedCompany.companyName || 'Unknown Company'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Domain</label>
                      <p className="font-semibold">{selectedCompany.domain || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Owner Email</label>
                      <p className="font-semibold">{selectedCompany.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="font-semibold">{selectedCompany.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <Badge className={getStatusColor(selectedCompany.status || 'inactive')}>
                        {selectedCompany.status || 'inactive'}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created</label>
                      <p className="font-semibold">
                        {selectedCompany.createdAt ? new Date(selectedCompany.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <div className="mt-2 space-y-1">
                        {selectedCompany.address?.street && (
                          <p className="text-sm">{selectedCompany.address.street}</p>
                        )}
                        <p className="text-sm">
                          {[
                            selectedCompany.address?.city,
                            selectedCompany.address?.state,
                            selectedCompany.address?.zipCode
                          ].filter(Boolean).join(', ') || 'No address provided'}
                        </p>
                        {selectedCompany.address?.country && (
                          <p className="text-sm">{selectedCompany.address.country}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Statistics Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 text-blue-600" />
                      <div className="text-lg sm:text-2xl font-bold text-blue-600">{selectedCompany.currentUsers || 0}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Users</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <Building2 className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 text-green-600" />
                      <div className="text-lg sm:text-2xl font-bold text-green-600">{selectedCompany.totalDepartments || 0}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Departments</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 text-purple-600" />
                      <div className="text-lg sm:text-2xl font-bold text-purple-600">{selectedCompany.totalTasks || 0}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Tasks</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 text-orange-600" />
                      <div className="text-lg sm:text-2xl font-bold text-orange-600">{selectedCompany.totalMeetings || 0}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Meetings</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm sm:text-base font-medium">Storage Used:</span>
                      <span className="text-sm sm:text-base font-bold">{selectedCompany.storageUsed || 0} GB</span>
                    </div>
                    <Progress value={selectedCompany.storageUsed ? (selectedCompany.storageUsed / 100) * 100 : 0} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">of 100 GB total</p>
                  </div>
                </CardContent>
              </Card>
                </div>
              )}

              {showAnalytics && (
                <CompanyAnalytics 
                  companyId={selectedCompany._id} 
                  companyName={selectedCompany.name} 
                />
              )}

              {showUsers && (
                <CompanyUsersManagement 
                  companyId={selectedCompany._id} 
                  companyName={selectedCompany.name} 
                />
              )}

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="h-5 w-5 mr-2" />
              Edit Company Details
            </DialogTitle>
            <DialogDescription>
              Update the company information. Changes will be reflected immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-12rem)] space-y-4 pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Company Name</label>
                <Input
                  value={editCompany.name}
                  onChange={(e) => setEditCompany({...editCompany, name: e.target.value})}
                  placeholder="Enter company name"
                  disabled={savingEdit}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Domain</label>
                <Input
                  value={editCompany.domain}
                  onChange={(e) => setEditCompany({...editCompany, domain: e.target.value})}
                  placeholder="company.com"
                  disabled={savingEdit}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={editCompany.email}
                onChange={(e) => setEditCompany({...editCompany, email: e.target.value})}
                placeholder="admin@company.com"
                disabled={savingEdit}
              />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  type="tel"
                  value={editCompany.phone}
                  onChange={(e) => setEditCompany({...editCompany, phone: e.target.value})}
                  placeholder="+1 (555) 123-4567"
                  disabled={savingEdit}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Industry</label>
                <Input
                  value={editCompany.industry}
                  onChange={(e) => setEditCompany({...editCompany, industry: e.target.value})}
                  placeholder="Technology, Healthcare, etc."
                  disabled={savingEdit}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Employee Count</label>
                <Input
                  value={editCompany.employeeCount}
                  onChange={(e) => setEditCompany({...editCompany, employeeCount: e.target.value})}
                  placeholder="1-50, 51-200, etc."
                  disabled={savingEdit}
                />
              </div>
            </div>


            <div className="space-y-3">
              <h4 className="text-sm font-medium">Address Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium">Street Address</label>
                  <Input
                    value={editCompany.address.street}
                    onChange={(e) => setEditCompany({
                      ...editCompany,
                      address: {...editCompany.address, street: e.target.value}
                    })}
                    placeholder="123 Business St"
                    disabled={savingEdit}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Input
                    value={editCompany.address.city}
                    onChange={(e) => setEditCompany({
                      ...editCompany,
                      address: {...editCompany.address, city: e.target.value}
                    })}
                    placeholder="New York"
                    disabled={savingEdit}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">State</label>
                  <Input
                    value={editCompany.address.state}
                    onChange={(e) => setEditCompany({
                      ...editCompany,
                      address: {...editCompany.address, state: e.target.value}
                    })}
                    placeholder="NY"
                    disabled={savingEdit}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Country</label>
                  <Input
                    value={editCompany.address.country}
                    onChange={(e) => setEditCompany({
                      ...editCompany,
                      address: {...editCompany.address, country: e.target.value}
                    })}
                    placeholder="United States"
                    disabled={savingEdit}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">ZIP Code</label>
                  <Input
                    value={editCompany.address.zipCode}
                    onChange={(e) => setEditCompany({
                      ...editCompany,
                      address: {...editCompany.address, zipCode: e.target.value}
                    })}
                    placeholder="10001"
                    disabled={savingEdit}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={savingEdit}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
