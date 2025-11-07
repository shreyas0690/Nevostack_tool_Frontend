import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  FileText, 
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Activity,
  Users,
  Building2,
  CreditCard,
  Calendar,
  UserPlus,
  UserMinus,
  Settings,
  Key,
  Globe,
  Monitor,
  Smartphone,
  Database,
  Server,
  Bell,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  MapPin,
  Wifi,
  Lock,
  Unlock,
  Trash2,
  Edit,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { toast } from 'sonner';
import { saasAuthService } from '@/services/saasAuthService';

// Audit Log Interface
interface AuditLog {
  _id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  companyId: string;
  companyName: string;
  action: string;
  category: 'system' | 'user' | 'admin' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  userAgent: string;
  device: string;
  location: string;
  metadata: {
    resourceId?: string;
    resourceType?: string;
    oldValue?: any;
    newValue?: any;
    reason?: string;
    attempts?: number;
    blocked?: boolean;
  };
  status: 'success' | 'failed' | 'pending';
}

// Mock Audit Logs Data
const mockAuditLogs: AuditLog[] = [
  {
    _id: '1',
    timestamp: '2024-09-22T14:30:00Z',
    userId: 'user_001',
    userEmail: 'john.doe@acme.com',
    userName: 'John Doe',
    userRole: 'admin',
    companyId: 'comp_001',
    companyName: 'Acme Corporation',
    action: 'user_created',
    category: 'admin',
    severity: 'medium',
    description: 'Created new user account for Sarah Wilson',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    device: 'MacBook Pro',
    location: 'New York, USA',
    metadata: {
      resourceId: 'user_002',
      resourceType: 'user',
      newValue: { email: 'sarah.wilson@acme.com', role: 'manager' }
    },
    status: 'success'
  },
  {
    _id: '2',
    timestamp: '2024-09-22T14:25:00Z',
    userId: 'user_003',
    userEmail: 'mike.johnson@techsolutions.com',
    userName: 'Mike Johnson',
    userRole: 'department_head',
    companyId: 'comp_002',
    companyName: 'Tech Solutions Ltd',
    action: 'task_created',
    category: 'user',
    severity: 'low',
    description: 'Created new task: "Implement new feature"',
    ipAddress: '10.0.0.15',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    device: 'Windows PC',
    location: 'San Francisco, USA',
    metadata: {
      resourceId: 'task_001',
      resourceType: 'task',
      newValue: { title: 'Implement new feature', priority: 'high' }
    },
    status: 'success'
  },
  {
    _id: '3',
    timestamp: '2024-09-22T14:20:00Z',
    userId: 'user_004',
    userEmail: 'emily.davis@startupxyz.com',
    userName: 'Emily Davis',
    userRole: 'member',
    companyId: 'comp_003',
    companyName: 'StartupXYZ',
    action: 'login_failed',
    category: 'security',
    severity: 'high',
    description: 'Failed login attempt with incorrect password',
    ipAddress: '203.0.113.10',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
    device: 'iPhone 13',
    location: 'Austin, USA',
    metadata: {
      reason: 'Invalid password',
      attempts: 3
    },
    status: 'failed'
  },
  {
    _id: '4',
    timestamp: '2024-09-22T14:15:00Z',
    userId: 'super_admin',
    userEmail: 'admin@demo.com',
    userName: 'Super Admin',
    userRole: 'super_admin',
    companyId: 'system',
    companyName: 'NevoStack Platform',
    action: 'company_suspended',
    category: 'admin',
    severity: 'critical',
    description: 'Suspended company: BetaCorp due to payment failure',
    ipAddress: '192.168.1.200',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    device: 'MacBook Pro',
    location: 'New York, USA',
    metadata: {
      resourceId: 'comp_004',
      resourceType: 'company',
      reason: 'Payment failure - 3 consecutive failed attempts'
    },
    status: 'success'
  },
  {
    _id: '5',
    timestamp: '2024-09-22T14:10:00Z',
    userId: 'user_005',
    userEmail: 'lisa.anderson@globalind.com',
    userName: 'Lisa Anderson',
    userRole: 'hr',
    companyId: 'comp_005',
    companyName: 'Global Industries',
    action: 'leave_approved',
    category: 'user',
    severity: 'low',
    description: 'Approved leave request for annual vacation',
    ipAddress: '198.51.100.5',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0)',
    device: 'iPad Pro',
    location: 'Chicago, USA',
    metadata: {
      resourceId: 'leave_001',
      resourceType: 'leave',
      newValue: { status: 'approved', approvedBy: 'lisa.anderson@globalind.com' }
    },
    status: 'success'
  },
  {
    _id: '6',
    timestamp: '2024-09-22T14:05:00Z',
    userId: 'user_006',
    userEmail: 'david.brown@acme.com',
    userName: 'David Brown',
    userRole: 'manager',
    companyId: 'comp_001',
    companyName: 'Acme Corporation',
    action: 'meeting_scheduled',
    category: 'user',
    severity: 'low',
    description: 'Scheduled team meeting for project review',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    device: 'MacBook Air',
    location: 'New York, USA',
    metadata: {
      resourceId: 'meeting_001',
      resourceType: 'meeting',
      newValue: { title: 'Project Review Meeting', attendees: 5 }
    },
    status: 'success'
  },
  {
    _id: '7',
    timestamp: '2024-09-22T14:00:00Z',
    userId: 'user_007',
    userEmail: 'sarah.wilson@techsolutions.com',
    userName: 'Sarah Wilson',
    userRole: 'admin',
    companyId: 'comp_002',
    companyName: 'Tech Solutions Ltd',
    action: 'plan_upgraded',
    category: 'admin',
    severity: 'medium',
    description: 'Upgraded subscription plan from Standard to Premium',
    ipAddress: '10.0.0.25',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    device: 'Windows PC',
    location: 'San Francisco, USA',
    metadata: {
      resourceId: 'subscription_001',
      resourceType: 'subscription',
      oldValue: { plan: 'standard', amount: 29 },
      newValue: { plan: 'premium', amount: 59 }
    },
    status: 'success'
  },
  {
    _id: '8',
    timestamp: '2024-09-22T13:55:00Z',
    userId: 'user_008',
    userEmail: 'unknown@unknown.com',
    userName: 'Unknown User',
    userRole: 'unknown',
    companyId: 'unknown',
    companyName: 'Unknown',
    action: 'brute_force_attempt',
    category: 'security',
    severity: 'critical',
    description: 'Multiple failed login attempts detected - potential brute force attack',
    ipAddress: '45.123.45.67',
    userAgent: 'Mozilla/5.0 (compatible; Bot/1.0)',
    device: 'Unknown',
    location: 'Unknown',
    metadata: {
      reason: 'Brute force attack',
      attempts: 15,
      blocked: true
    },
    status: 'failed'
  }
];

export default function SaaSAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [uniqueCompanies, setUniqueCompanies] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [securityCurrentPage, setSecurityCurrentPage] = useState(1);
  const [securityItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [securityAlerts, setSecurityAlerts] = useState<AuditLog[]>([]);
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState('csv');

  // Fetch audit logs from backend
  const fetchAuditLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { searchTerm }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(severityFilter !== 'all' && { severity: severityFilter }),
        ...(companyFilter !== 'all' && { companyId: companyFilter }),
      });

      const response = await saasAuthService.authenticatedFetch(
        `/api/saas/audit-logs?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setLogs(data.data);
        setFilteredLogs(data.data);
        setTotalLogs(data.pagination.total);
        setTotalPages(data.pagination.pages);
        setCurrentPage(page);
      } else {
        toast.error('Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // Fetch audit analytics
  const fetchAuditAnalytics = async () => {
    try {
      const response = await saasAuthService.authenticatedFetch('/api/saas/audit-logs/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.data);
      }
    } catch (error) {
      console.error('Error fetching audit analytics:', error);
    }
  };

  // Fetch security alerts
  const fetchSecurityAlerts = async () => {
    try {
      const response = await saasAuthService.authenticatedFetch('/api/saas/audit-logs/alerts?severity=critical&hours=24');
      if (response.ok) {
        const data = await response.json();
        setSecurityAlerts(data.data);
      }
    } catch (error) {
      console.error('Error fetching security alerts:', error);
    }
  };

  // Advanced search
  const performAdvancedSearch = async (searchQuery: any) => {
    try {
      setLoading(true);
      const response = await saasAuthService.authenticatedFetch('/api/saas/audit-logs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          filters: {
            category: categoryFilter !== 'all' ? categoryFilter : undefined,
            severity: severityFilter !== 'all' ? severityFilter : undefined,
            companyId: companyFilter !== 'all' ? companyFilter : undefined,
          },
          pagination: {
            page: currentPage,
            limit: itemsPerPage
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.data);
        setFilteredLogs(data.data);
        setTotalLogs(data.pagination.total);
        setTotalPages(data.pagination.pages);
      } else {
        toast.error('Advanced search failed');
      }
    } catch (error) {
      console.error('Error performing advanced search:', error);
      toast.error('Advanced search failed');
    } finally {
      setLoading(false);
    }
  };

  // Export audit logs
  const exportAuditLogs = async (format: string = 'csv') => {
    try {
      const params = new URLSearchParams({
        format,
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(severityFilter !== 'all' && { severity: severityFilter }),
        ...(companyFilter !== 'all' && { companyId: companyFilter }),
        includeMetadata: 'true'
      });

      const response = await saasAuthService.authenticatedFetch(
        `/api/saas/audit-logs/export?${params.toString()}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Audit logs exported as ${format.toUpperCase()}`);
      } else {
        toast.error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast.error('Export failed');
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await saasAuthService.authenticatedFetch('/api/saas/audit-logs/filters');
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data.data);
        setUniqueCompanies(data.data.companies || []);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  // Fetch audit statistics
  const fetchAuditStats = async () => {
    try {
      const response = await saasAuthService.authenticatedFetch('/api/saas/audit-logs/stats');
      if (response.ok) {
        const data = await response.json();
        // Update stats based on backend data
        updateStatsFromBackend(data.data);
      }
    } catch (error) {
      console.error('Error fetching audit stats:', error);
    }
  };

  // Filter and search logic (client-side for now, could be moved to backend)
  useEffect(() => {
    if (logs.length > 0) {
      let filtered = logs.filter(log => {
        const matchesSearch =
          log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.companyName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
        const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
        const matchesCompany = companyFilter === 'all' || log.companyId === companyFilter;

        return matchesSearch && matchesCategory && matchesSeverity && matchesCompany;
      });

      setFilteredLogs(filtered);
    }
  }, [searchTerm, categoryFilter, severityFilter, companyFilter, logs]);

  // Initial data fetch
  useEffect(() => {
    fetchFilterOptions();
    fetchAuditStats();
    fetchAuditLogs();
    fetchAuditAnalytics();
    fetchSecurityAlerts();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (realTimeMode) {
      const interval = setInterval(() => {
        fetchAuditLogs(currentPage);
        fetchAuditStats();
        fetchSecurityAlerts();
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [realTimeMode, currentPage]);

  // Use server-side pagination - logs are already paginated from backend
  const paginatedLogs = filteredLogs;

  // Security logs pagination
  const securityLogs = logs.filter(log => log.category === 'security');
  const securityTotalPages = Math.ceil(securityLogs.length / securityItemsPerPage);
  const securityPaginatedLogs = securityLogs.slice(
    (securityCurrentPage - 1) * securityItemsPerPage,
    securityCurrentPage * securityItemsPerPage
  );

  const refreshLogs = async () => {
    toast.info("Refreshing audit logs...");
    await Promise.all([
      fetchAuditLogs(currentPage),
      fetchAuditStats(),
      fetchAuditAnalytics(),
      fetchSecurityAlerts()
    ]);
    toast.success("Audit logs updated!");
  };

  const exportLogs = () => {
    exportAuditLogs(selectedExportFormat);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system': return <Server className="h-4 w-4" />;
      case 'user': return <Users className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'security': return <Lock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return <Key className="h-4 w-4" />;
    if (action.includes('create') || action.includes('add')) return <Plus className="h-4 w-4" />;
    if (action.includes('delete') || action.includes('remove')) return <Trash2 className="h-4 w-4" />;
    if (action.includes('update') || action.includes('edit')) return <Edit className="h-4 w-4" />;
    if (action.includes('approve')) return <CheckCircle className="h-4 w-4" />;
    if (action.includes('reject') || action.includes('deny')) return <XCircle className="h-4 w-4" />;
    if (action.includes('suspend') || action.includes('block')) return <Lock className="h-4 w-4" />;
    if (action.includes('upgrade') || action.includes('downgrade')) return <ArrowUpRight className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getRelativeTime(date)
    };
  };

  const getRelativeTime = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Statistics from backend (these will be updated by fetchAuditStats)
  const [stats, setStats] = useState({
    totalLogs: 0,
    criticalLogs: 0,
    securityLogs: 0,
    failedLogs: 0
  });

  // Update stats when backend data is available
  const updateStatsFromBackend = (backendStats: any) => {
    setStats({
      totalLogs: backendStats.totalLogs || 0,
      criticalLogs: backendStats.criticalLogs || 0,
      securityLogs: backendStats.securityLogs || 0,
      failedLogs: backendStats.failedLogs || 0
    });
  };

  // Calculate statistics from current logs (fallback)
  const totalLogsCount = stats.totalLogs || logs.length;
  const criticalLogsCount = stats.criticalLogs || logs.filter(log => log.severity === 'critical').length;
  const securityLogsCount = stats.securityLogs || logs.filter(log => log.category === 'security').length;
  const failedLogsCount = stats.failedLogs || logs.filter(log => log.status === 'failed').length;

  // Show loading screen during initial load
  if (initialLoad) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Loading Audit Logs...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Fetching system activity data from backend
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 bg-slate-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-gray-100">
            Audit Logs
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400 mt-2">
            Complete system activity tracking and security monitoring across all companies
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
           <Select value={selectedExportFormat} onValueChange={setSelectedExportFormat}>
             <SelectTrigger className="w-24 sm:w-32 h-8 sm:h-9 border-slate-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
               <SelectValue />
             </SelectTrigger>
             <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
               <SelectItem value="csv" className="dark:text-gray-100 dark:hover:bg-gray-700">CSV</SelectItem>
               <SelectItem value="xlsx" className="dark:text-gray-100 dark:hover:bg-gray-700">Excel</SelectItem>
             </SelectContent>
           </Select>
          
          <Button variant="outline" size="sm" onClick={exportLogs} className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm border-slate-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </Button>
          
           <Button 
             variant={realTimeMode ? "default" : "outline"} 
             size="sm" 
             onClick={() => setRealTimeMode(!realTimeMode)}
             className={`h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm ${realTimeMode ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"}`}
           >
             <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
             <span className="hidden sm:inline">{realTimeMode ? 'Live' : 'Static'}</span>
             <span className="sm:hidden">{realTimeMode ? 'Live' : 'Static'}</span>
           </Button>
          
          <Button variant="outline" size="sm" onClick={refreshLogs} disabled={loading} className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm border-slate-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
            {loading ? (
              <div className="animate-spin mr-1 sm:mr-2 text-xs sm:text-sm">⟳</div>
            ) : (
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Logs */}
        <Card className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 transition-colors">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-slate-100 dark:bg-gray-700 rounded-lg">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 dark:text-gray-300" />
              </div>
              <Badge variant="outline" className="border-slate-300 dark:border-gray-600 text-slate-600 dark:text-gray-300 text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Total
              </Badge>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-gray-100 mb-1">
              {totalLogsCount.toLocaleString()}
            </div>
            <p className="text-slate-600 dark:text-gray-400 text-xs sm:text-sm">Audit Logs</p>
            <p className="text-slate-500 dark:text-gray-500 text-xs mt-2">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        {/* Critical Logs */}
        <Card className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 transition-colors">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              <Badge variant="outline" className="border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Critical
              </Badge>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-gray-100 mb-1">
              {criticalLogsCount}
            </div>
            <p className="text-slate-600 dark:text-gray-400 text-xs sm:text-sm">Critical Events</p>
            <p className="text-slate-500 dark:text-gray-500 text-xs mt-2">
              Requires attention
            </p>
          </CardContent>
        </Card>

        {/* Security Logs */}
        <Card className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 transition-colors">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <Badge variant="outline" className="border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400 text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Security
              </Badge>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-gray-100 mb-1">
              {securityLogsCount}
            </div>
            <p className="text-slate-600 dark:text-gray-400 text-xs sm:text-sm">Security Events</p>
            <p className="text-slate-500 dark:text-gray-500 text-xs mt-2">
              Login attempts & threats
            </p>
          </CardContent>
        </Card>

        {/* Failed Logs */}
        <Card className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 transition-colors">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <Badge variant="outline" className="border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Failed
              </Badge>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-gray-100 mb-1">
              {failedLogsCount}
            </div>
            <p className="text-slate-600 dark:text-gray-400 text-xs sm:text-sm">Failed Actions</p>
            <p className="text-slate-500 dark:text-gray-500 text-xs mt-2">
              Need investigation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts Section */}
      {securityAlerts.length > 0 && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 shadow-sm">
          <CardHeader className="bg-red-100 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800">
            <CardTitle className="flex items-center text-red-800 dark:text-red-200">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Critical Security Alerts ({securityAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {securityAlerts.slice(0, 3).map((alert) => (
                <div key={alert._id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <div>
                      <div className="font-medium text-red-900 dark:text-red-100">{alert.description}</div>
                      <div className="text-sm text-red-700 dark:text-red-300">
                        {alert.userName} • {alert.ipAddress} • {formatTimestamp(alert.timestamp).relative}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
              ))}
              {securityAlerts.length > 3 && (
                <div className="text-center">
                  <Button variant="outline" size="sm" className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50">
                    View All {securityAlerts.length} Alerts
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Main Content Tabs */}
      <Tabs defaultValue="all-logs" className="w-full">
        <TabsList className="flex sm:grid w-full sm:grid-cols-4 gap-1 h-auto overflow-x-auto sm:overflow-x-visible scrollbar-hide p-1 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4 sticky top-0 z-10 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
          <TabsTrigger value="all-logs" className="text-xs sm:text-sm h-10 sm:h-11 px-2 sm:px-4 flex-shrink-0 min-w-0 whitespace-nowrap rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-700">
            <span className="hidden sm:inline">📋 All Logs</span>
            <span className="sm:hidden">📋</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm h-10 sm:h-11 px-2 sm:px-4 flex-shrink-0 min-w-0 whitespace-nowrap rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-700">
            <span className="hidden sm:inline">🔒 Security</span>
            <span className="sm:hidden">🔒</span>
          </TabsTrigger>
          <TabsTrigger value="admin" className="text-xs sm:text-sm h-10 sm:h-11 px-2 sm:px-4 flex-shrink-0 min-w-0 whitespace-nowrap rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-700">
            <span className="hidden sm:inline">👥 Admin Actions</span>
            <span className="sm:hidden">👥</span>
          </TabsTrigger>
          <TabsTrigger value="user" className="text-xs sm:text-sm h-10 sm:h-11 px-2 sm:px-4 flex-shrink-0 min-w-0 whitespace-nowrap rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-700">
            <span className="hidden sm:inline">⚡ User Activity</span>
            <span className="sm:hidden">⚡</span>
          </TabsTrigger>
        </TabsList>

        {/* All Logs Tab */}
        <TabsContent value="all-logs" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {/* Search and Filter */}
          <Card className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500 h-4 w-4" />
                    <Input
                      placeholder="Search logs by user, action, description, or company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-9 sm:h-10 text-sm border-slate-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-slate-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-slate-400 dark:focus:ring-gray-500"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-40 h-9 sm:h-10 text-sm border-slate-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="all" className="dark:text-gray-100 dark:hover:bg-gray-700">All Categories</SelectItem>
                      {(filterOptions.categories || ['system', 'user', 'admin', 'security']).map(category => (
                        <SelectItem key={category} value={category} className="dark:text-gray-100 dark:hover:bg-gray-700">
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-full sm:w-40 h-9 sm:h-10 text-sm border-slate-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="all" className="dark:text-gray-100 dark:hover:bg-gray-700">All Severity</SelectItem>
                      {(filterOptions.severities || ['critical', 'high', 'medium', 'low']).map(severity => (
                        <SelectItem key={severity} value={severity} className="dark:text-gray-100 dark:hover:bg-gray-700">
                          {severity.charAt(0).toUpperCase() + severity.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className="w-full sm:w-48 h-9 sm:h-10 text-sm border-slate-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
                      <SelectValue placeholder="Company" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="all" className="dark:text-gray-100 dark:hover:bg-gray-700">All Companies</SelectItem>
                      {uniqueCompanies.map(company => (
                        <SelectItem key={company.id} value={company.id} className="dark:text-gray-100 dark:hover:bg-gray-700">{company.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('all');
                      setSeverityFilter('all');
                      setCompanyFilter('all');
                    }}
                    className="h-9 sm:h-10 text-sm border-slate-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <Card className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-gray-700 border-b border-slate-200 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg font-semibold text-slate-900 dark:text-gray-100">
                  Audit Logs
                </CardTitle>
                <Badge variant="outline" className="text-xs sm:text-sm border-slate-300 dark:border-gray-600 text-slate-600 dark:text-gray-300">
                  {filteredLogs.length} logs
                </Badge>
              </div>
            </CardHeader>
            
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4 p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading audit logs...</span>
                  </div>
                </div>
              ) : paginatedLogs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No audit logs found</p>
                    <p className="text-sm">Audit logs will appear here once users start performing actions</p>
                  </div>
                </div>
              ) : (
                paginatedLogs.map((log) => {
                  const timeInfo = formatTimestamp(log.timestamp);
                  return (
                    <Card key={log._id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-xs">
                                {log.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {log.userName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {log.userEmail}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            {log.description}
                          </div>
                          <div className="text-xs text-gray-400">
                            {timeInfo.date} at {timeInfo.time} • {timeInfo.relative}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge className={`${getSeverityColor(log.severity)} text-xs`}>
                            {log.severity.toUpperCase()}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLog(log);
                              setShowLogDetails(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
                        <div>
                          <div className="text-xs text-gray-500">Company</div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">{log.companyName}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Category</div>
                          <div className="text-sm text-gray-900 dark:text-gray-100 capitalize">{log.category}</div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 dark:border-gray-600">
                    <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      Timestamp
                    </TableHead>
                    <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      User & Company
                    </TableHead>
                    <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </TableHead>
                    <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </TableHead>
                    <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      Severity
                    </TableHead>
                    <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      Location
                    </TableHead>
                    <TableHead className="text-center py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody className="bg-white dark:bg-gray-800 divide-y divide-slate-200 dark:divide-gray-600">
                  {loading ? (
                    // Loading skeleton rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-3/4"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-1/2"></div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
                            <div className="space-y-1">
                              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-24"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-32"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-20"></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-28"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-40"></div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-16"></div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-20"></div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-12"></div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-16"></div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-12"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : paginatedLogs.length === 0 ? (
                    // Empty state
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 px-4 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
                            <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                              No Audit Logs Found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md">
                              {searchTerm || categoryFilter !== 'all' || severityFilter !== 'all' || companyFilter !== 'all'
                                ? 'No audit logs match your current filters. Try adjusting your search criteria.'
                                : 'No system activities have been recorded yet. Audit logs will appear here once users start performing actions in the system.'
                              }
                            </p>
                            {(searchTerm || categoryFilter !== 'all' || severityFilter !== 'all' || companyFilter !== 'all') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSearchTerm('');
                                  setCategoryFilter('all');
                                  setSeverityFilter('all');
                                  setCompanyFilter('all');
                                  fetchAuditLogs(1);
                                }}
                                className="mt-4 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                              >
                                Clear Filters
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Actual data
                    paginatedLogs.map((log) => {
                      const timeInfo = formatTimestamp(log.timestamp);
                      return (
                        <TableRow key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        {/* Timestamp */}
                        <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                          <div className="space-y-1">
                            <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                              {timeInfo.date}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {timeInfo.time}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {timeInfo.relative}
                            </div>
                          </div>
                        </TableCell>

                        {/* User & Company */}
                        <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                              <AvatarFallback className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-xs font-bold">
                                {log.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {log.userName}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {log.userEmail}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                {log.companyName}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Action */}
                        <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                          <div className="flex items-center space-x-2">
                            <div className="h-3 w-3 sm:h-4 sm:w-4">
                              {getActionIcon(log.action)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                {log.description}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                          <Badge variant="outline" className="flex items-center w-fit dark:border-gray-600 dark:text-gray-300 text-xs">
                            <div className="h-3 w-3 sm:h-4 sm:w-4">
                              {getCategoryIcon(log.category)}
                            </div>
                            <span className="ml-1 capitalize">{log.category}</span>
                          </Badge>
                        </TableCell>

                        {/* Severity */}
                        <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                          <Badge className={`${getSeverityColor(log.severity)} border text-xs`}>
                            {log.severity.toUpperCase()}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                          <div className="flex items-center space-x-2">
                            <div className="h-3 w-3 sm:h-4 sm:w-4">
                              {getStatusIcon(log.status)}
                            </div>
                            <span className="text-xs sm:text-sm capitalize text-gray-900 dark:text-gray-100">{log.status}</span>
                          </div>
                        </TableCell>

                        {/* Location */}
                        <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                          <div className="space-y-1">
                            <div className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {log.location}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                              <Wifi className="h-3 w-3 mr-1" />
                              {log.ipAddress}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {log.device}
                            </div>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLog(log);
                              setShowLogDetails(true);
                            }}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                        );
                      })
                    )
                  }
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Pagination */}
          <Card className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6">
              <div className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mb-4 sm:mb-0">
                Showing <span className="font-medium text-slate-900 dark:text-gray-100">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                <span className="font-medium text-slate-900 dark:text-gray-100">
                  {Math.min(currentPage * itemsPerPage, totalLogs)}
                </span> of{' '}
                <span className="font-medium text-slate-900 dark:text-gray-100">{totalLogs}</span> logs
              </div>
              
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => fetchAuditLogs(currentPage - 1)}
                  className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 text-xs sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Previous</span>
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
                        onClick={() => fetchAuditLogs(page)}
                        className={`h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs sm:text-sm ${currentPage === page ? "dark:bg-gray-600 dark:hover:bg-gray-500" : "dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"}`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="px-1 sm:px-2 text-xs text-gray-400 dark:text-gray-500">...</span>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => fetchAuditLogs(currentPage + 1)}
                  className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 text-xs sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <Card className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
            <CardHeader className="bg-slate-50 dark:bg-gray-700 border-b border-slate-200 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <CardTitle className="flex items-center text-slate-900 dark:text-gray-100 text-base sm:text-lg">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-red-600 dark:text-red-400" />
                  Security Events
                </CardTitle>
                <Badge variant="outline" className="text-xs sm:text-sm border-slate-300 dark:border-gray-600 text-slate-600 dark:text-gray-300">
                  {securityLogs.length} security events
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {securityPaginatedLogs.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="p-3 sm:p-4 bg-slate-100 dark:bg-gray-700 rounded-full w-fit mx-auto mb-3 sm:mb-4">
                    <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-gray-100 mb-2">
                    No Security Events Found
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400">
                    No security-related activities have been recorded yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {securityPaginatedLogs.map((log) => (
                    <div key={log._id} className="p-3 sm:p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm sm:text-base font-medium text-red-900 dark:text-red-100">{log.description}</div>
                            <div className="text-xs sm:text-sm text-red-700 dark:text-red-300">
                              {log.userName} • {log.ipAddress} • {formatTimestamp(log.timestamp).relative}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 text-xs">
                          {log.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Pagination */}
          {securityLogs.length > 0 && (
            <Card className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
              <CardContent className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6">
                <div className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mb-4 sm:mb-0">
                  Showing <span className="font-medium text-slate-900 dark:text-gray-100">{((securityCurrentPage - 1) * securityItemsPerPage) + 1}</span> to{' '}
                  <span className="font-medium text-slate-900 dark:text-gray-100">
                    {Math.min(securityCurrentPage * securityItemsPerPage, securityLogs.length)}
                  </span> of{' '}
                  <span className="font-medium text-slate-900 dark:text-gray-100">{securityLogs.length}</span> security events
                </div>
                
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={securityCurrentPage === 1}
                    onClick={() => setSecurityCurrentPage(securityCurrentPage - 1)}
                    className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 text-xs sm:text-sm border-slate-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(securityTotalPages, 5) }, (_, i) => {
                      const page = securityCurrentPage <= 3 ? i + 1 : securityCurrentPage - 2 + i;
                      if (page > securityTotalPages) return null;
                      return (
                        <Button
                          key={page}
                          variant={securityCurrentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSecurityCurrentPage(page)}
                          className={`h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs sm:text-sm ${securityCurrentPage === page ? "bg-slate-900 hover:bg-slate-800 dark:bg-gray-600 dark:hover:bg-gray-500" : "border-slate-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"}`}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={securityCurrentPage === securityTotalPages || securityTotalPages === 0}
                    onClick={() => setSecurityCurrentPage(securityCurrentPage + 1)}
                    className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 text-xs sm:text-sm border-slate-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Admin Actions Tab */}
        <TabsContent value="admin" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center text-gray-900 dark:text-gray-100 text-base sm:text-lg">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Admin Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {logs.filter(log => log.category === 'admin').map((log) => (
                  <div key={log._id} className="p-3 sm:p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm sm:text-base font-medium text-blue-900 dark:text-blue-100">{log.description}</div>
                          <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                            {log.userName} • {log.companyName} • {formatTimestamp(log.timestamp).relative}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs">
                        {log.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Activity Tab */}
        <TabsContent value="user" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center text-gray-900 dark:text-gray-100 text-base sm:text-lg">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600 dark:text-green-400" />
                User Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {logs.filter(log => log.category === 'user').map((log) => (
                  <div key={log._id} className="p-3 sm:p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm sm:text-base font-medium text-green-900 dark:text-green-100">{log.description}</div>
                          <div className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                            {log.userName} • {log.companyName} • {formatTimestamp(log.timestamp).relative}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 text-xs">
                        {log.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Log Details Dialog */}
      <Dialog open={showLogDetails} onOpenChange={setShowLogDetails}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center text-gray-900 dark:text-gray-100 text-lg sm:text-xl">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Audit Log Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4 sm:space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Card className="dark:bg-gray-700 dark:border-gray-600">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-bold text-sm">
                          {selectedLog.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">{selectedLog.userName}</div>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{selectedLog.userEmail}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">{selectedLog.userRole}</div>
                      </div>
                    </div>
                    <div className="pt-3 border-t dark:border-gray-600">
                      <div className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        <span className="font-medium">Company:</span> {selectedLog.companyName}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="dark:bg-gray-700 dark:border-gray-600">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">Action Details</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 sm:h-5 sm:w-5">
                        {getActionIcon(selectedLog.action)}
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                        {selectedLog.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {selectedLog.description}
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 pt-3 border-t dark:border-gray-600">
                      <Badge className={`${getSeverityColor(selectedLog.severity)} text-xs`}>
                        {selectedLog.severity.toUpperCase()}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <div className="h-3 w-3 sm:h-4 sm:w-4">
                          {getStatusIcon(selectedLog.status)}
                        </div>
                        <span className="text-xs sm:text-sm capitalize text-gray-900 dark:text-gray-100">{selectedLog.status}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Technical Details */}
              <Card className="dark:bg-gray-700 dark:border-gray-600">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">Technical Information</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100">Timestamp:</span>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {formatTimestamp(selectedLog.timestamp).date} at {formatTimestamp(selectedLog.timestamp).time}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100">IP Address:</span>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center">
                          <Wifi className="h-3 w-3 mr-1" />
                          {selectedLog.ipAddress}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100">Location:</span>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {selectedLog.location}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100">Device:</span>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center">
                          {selectedLog.device.includes('iPhone') || selectedLog.device.includes('iPad') ? 
                            <Smartphone className="h-3 w-3 mr-1" /> :
                            <Monitor className="h-3 w-3 mr-1" />
                          }
                          {selectedLog.device}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100">User Agent:</span>
                        <div className="text-xs text-gray-500 dark:text-gray-400 break-all">
                          {selectedLog.userAgent}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Metadata */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <Card className="dark:bg-gray-700 dark:border-gray-600">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <pre className="bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 rounded-lg text-xs sm:text-sm overflow-x-auto text-gray-900 dark:text-gray-100">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

