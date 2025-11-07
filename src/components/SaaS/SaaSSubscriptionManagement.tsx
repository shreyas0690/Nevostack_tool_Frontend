import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { saasAuthService } from '@/services/saasAuthService';
import { toast } from 'sonner';
import CouponManagement from './CouponManagement';
import { Plan } from '@/types/plans';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  CreditCard,
  DollarSign,
  Users,
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Plus,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  X,
  Clock,
  Building2,
  Zap,
  Crown,
  Star,
  Package,
  Layers,
  Rocket,
  Database,
  FileText,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  AlertTriangle,
  XCircle,
  Trash2,
  Settings,
  Globe,
  Percent,
  Tag,
  Mail,
  Bell,
  Shield,
  Activity,
  Calendar as CalendarIcon,
  History,
  Banknote,
  Target,
  Repeat,
  Copy,
  ExternalLink,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Interfaces

interface CompanySubscription {
  _id: string;
  companyId: string;
  companyName: string;
  plan: Plan;
  status: 'active' | 'trial' | 'expired' | 'cancelled' | 'suspended';
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  autoRenewal: boolean;
  currentPeriodRevenue: number;
  totalRevenue: number;
  paymentMethod: string;
  lastPaymentDate: string;
  usageStats: {
    users: number;
    departments: number;
    storageUsed: number;
  };
}

interface Transaction {
  _id: string;
  companyId: string;
  companyName: string;
  amount: number;
  currency: string;
  status: 'completed' | 'failed' | 'pending' | 'refunded';
  paymentMethod: string;
  transactionId: string;
  invoiceId: string;
  description: string;
  createdAt: string;
  gateway: 'stripe' | 'razorpay' | 'paypal';
}

interface Coupon {
  _id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minAmount: number;
  maxDiscount: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  applicablePlans: string[];
}

// Mock Data
const mockPlans: Plan[] = [
  {
    _id: '1',
    name: 'free',
    displayName: 'Free',
    description: 'Perfect for startups and small teams',
    price: { monthly: 0, quarterly: 0, yearly: 0 },
    limits: { maxUsers: 5, maxDepartments: 2, storageGB: 1 },
    features: {
      taskManagement: true,
      leaveManagement: false,
      meetings: false,
      analytics: false,
      reports: false,
      attendance: false,
      apiAccess: false,
      customBranding: false
    },
    trialDays: 0,
    isActive: true,
    isPopular: false,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: '2',
    name: 'standard',
    displayName: 'Standard',
    description: 'Great for growing businesses',
    price: { monthly: 2400, quarterly: 6500, yearly: 25000 },
    limits: { maxUsers: 25, maxDepartments: 5, storageGB: 10 },
    features: {
      taskManagement: true,
      leaveManagement: true,
      meetings: true,
      analytics: false,
      reports: true,
      attendance: true,
      apiAccess: false,
      customBranding: false
    },
    trialDays: 14,
    isActive: true,
    isPopular: false,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: '3',
    name: 'premium',
    displayName: 'Premium',
    description: 'Advanced features for established companies',
    price: { monthly: 4900, quarterly: 13200, yearly: 50000 },
    limits: { maxUsers: 100, maxDepartments: 15, storageGB: 50 },
    features: {
      taskManagement: true,
      leaveManagement: true,
      meetings: true,
      analytics: true,
      reports: true,
      attendance: true,
      apiAccess: true,
      customBranding: false
    },
    trialDays: 14,
    isActive: true,
    isPopular: false,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: '4',
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'Full-featured solution for large organizations',
    price: { monthly: 8200, quarterly: 23200, yearly: 83000 },
    limits: { maxUsers: -1, maxDepartments: -1, storageGB: 500 },
    features: {
      taskManagement: true,
      leaveManagement: true,
      meetings: true,
      analytics: true,
      reports: true,
      attendance: true,
      apiAccess: true,
      customBranding: true
    },
    trialDays: 30,
    isActive: true,
    isPopular: false,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

const mockSubscriptions: CompanySubscription[] = [
  {
    _id: '1',
    companyId: '1',
    companyName: 'Acme Corporation',
    plan: mockPlans[3], // Enterprise
    status: 'active',
    billingCycle: 'monthly',
    startDate: '2024-01-15T00:00:00Z',
    endDate: '2025-01-15T00:00:00Z',
    nextBillingDate: '2024-10-15T00:00:00Z',
    autoRenewal: true,
    currentPeriodRevenue: 99,
    totalRevenue: 891,
    paymentMethod: 'Visa ****1234',
    lastPaymentDate: '2024-09-15T00:00:00Z',
    usageStats: { users: 125, departments: 8, storageUsed: 45.2 }
  },
  {
    _id: '2',
    companyId: '2',
    companyName: 'Tech Solutions Ltd',
    plan: mockPlans[2], // Premium
    status: 'active',
    billingCycle: 'yearly',
    startDate: '2024-03-01T00:00:00Z',
    endDate: '2025-03-01T00:00:00Z',
    nextBillingDate: '2025-03-01T00:00:00Z',
    autoRenewal: true,
    currentPeriodRevenue: 599,
    totalRevenue: 599,
    paymentMethod: 'Mastercard ****5678',
    lastPaymentDate: '2024-03-01T00:00:00Z',
    usageStats: { users: 67, departments: 5, storageUsed: 28.5 }
  },
  {
    _id: '3',
    companyId: '3',
    companyName: 'StartupXYZ',
    plan: mockPlans[1], // Standard
    status: 'expired',
    billingCycle: 'monthly',
    startDate: '2024-06-15T00:00:00Z',
    endDate: '2024-09-15T00:00:00Z',
    nextBillingDate: '2024-10-15T00:00:00Z',
    autoRenewal: false,
    currentPeriodRevenue: 29,
    totalRevenue: 87,
    paymentMethod: 'PayPal',
    lastPaymentDate: '2024-08-15T00:00:00Z',
    usageStats: { users: 25, departments: 3, storageUsed: 8.2 }
  },
  {
    _id: '4',
    companyId: '4',
    companyName: 'Global Industries',
    plan: mockPlans[2], // Premium
    status: 'trial',
    billingCycle: 'quarterly',
    startDate: '2024-09-20T00:00:00Z',
    endDate: '2024-10-04T00:00:00Z',
    nextBillingDate: '2024-10-04T00:00:00Z',
    autoRenewal: true,
    currentPeriodRevenue: 0,
    totalRevenue: 0,
    paymentMethod: 'Not set',
    lastPaymentDate: 'N/A',
    usageStats: { users: 5, departments: 2, storageUsed: 2.1 }
  }
];

const mockTransactions: Transaction[] = [
  {
    _id: '1',
    companyId: '1',
    companyName: 'Acme Corporation',
    amount: 99,
    currency: 'INR',
    status: 'completed',
    paymentMethod: 'Visa ****1234',
    transactionId: 'txn_1234567890',
    invoiceId: 'inv_001',
    description: 'Enterprise Plan - Monthly',
    createdAt: '2024-09-15T10:30:00Z',
    gateway: 'stripe'
  },
  {
    _id: '2',
    companyId: '2',
    companyName: 'Tech Solutions Ltd',
    amount: 599,
    currency: 'INR',
    status: 'completed',
    paymentMethod: 'Mastercard ****5678',
    transactionId: 'txn_0987654321',
    invoiceId: 'inv_002',
    description: 'Premium Plan - Yearly',
    createdAt: '2024-03-01T14:20:00Z',
    gateway: 'stripe'
  },
  {
    _id: '3',
    companyId: '3',
    companyName: 'StartupXYZ',
    amount: 29,
    currency: 'INR',
    status: 'failed',
    paymentMethod: 'PayPal',
    transactionId: 'txn_fail001',
    invoiceId: 'inv_003',
    description: 'Standard Plan - Monthly',
    createdAt: '2024-09-15T08:45:00Z',
    gateway: 'paypal'
  }
];

const mockCoupons: Coupon[] = [
  {
    _id: '1',
    code: 'WELCOME50',
    description: '50% off first month for new customers',
    type: 'percentage',
    value: 50,
    minAmount: 0,
    maxDiscount: 100,
    validFrom: '2024-01-01T00:00:00Z',
    validUntil: '2024-12-31T23:59:59Z',
    usageLimit: 1000,
    usedCount: 156,
    isActive: true,
    applicablePlans: ['standard', 'premium', 'enterprise']
  },
  {
    _id: '2',
    code: 'SAVE20',
    description: '₹20 off any yearly plan',
    type: 'fixed',
    value: 20,
    minAmount: 100,
    maxDiscount: 20,
    validFrom: '2024-06-01T00:00:00Z',
    validUntil: '2024-12-31T23:59:59Z',
    usageLimit: 500,
    usedCount: 43,
    isActive: true,
    applicablePlans: ['premium', 'enterprise']
  }
];

// Mock Revenue Data
const revenueData = [
  { month: 'Jan', mrr: 5240, arr: 62880, companies: 18 },
  { month: 'Feb', mrr: 6180, arr: 74160, companies: 21 },
  { month: 'Mar', mrr: 7320, arr: 87840, companies: 25 },
  { month: 'Apr', mrr: 8150, arr: 97800, companies: 28 },
  { month: 'May', mrr: 9280, arr: 111360, companies: 32 },
  { month: 'Jun', mrr: 10450, arr: 125400, companies: 35 }
];

const planDistributionData = [
  { name: 'Free', value: 45, color: '#9ca3af' },
  { name: 'Standard', value: 28, color: '#3b82f6' },
  { name: 'Premium', value: 18, color: '#8b5cf6' },
  { name: 'Enterprise', value: 9, color: '#f59e0b' }
];

export default function SaaSSubscriptionManagement() {
  const [subscriptions, setSubscriptions] = useState<CompanySubscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showPaymentHistoryDialog, setShowPaymentHistoryDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [expiringSubscriptions, setExpiringSubscriptions] = useState<any[]>([]);
  const [expiringLoading, setExpiringLoading] = useState(false);
  const [churnRate, setChurnRate] = useState<number>(0);
  const [averageLTV, setAverageLTV] = useState<number>(0);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<CompanySubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    displayName: '',
    description: '',
    price: {
      monthly: 0,
      quarterly: 0,
      yearly: 0
    },
    features: {
      taskManagement: false,
      leaveManagement: false,
      meetings: false,
      analytics: false,
      reports: false,
      attendance: false,
      apiAccess: false,
      customBranding: false
    },
    limits: {
      maxUsers: 10,
      maxDepartments: 5,
      maxTasks: 100,
      maxMeetings: 50,
      storageGB: 10,
      apiCallsPerMonth: 10000
    },
    isActive: true,
    isPopular: false,
    sortOrder: 0,
    stripePriceId: ''
  });
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showEditPlanDialog, setShowEditPlanDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch plans from API
  const fetchPlans = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching plans from API...');
      const response = await saasAuthService.authenticatedFetch('/api/saas/plans');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPlans(data.data || []);
          console.log('✅ Plans fetched successfully:', data.data?.length || 0);
        } else {
          console.error('❌ Failed to fetch plans:', data.message);
          toast.error('Failed to fetch plans');
        }
      } else {
        console.error('❌ API Error:', response.status);
        toast.error('Failed to fetch plans');
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
      toast.error('Network error: Unable to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setSubscriptionsLoading(true);
      console.log('📊 Fetching real subscription data...');
      const response = await saasAuthService.authenticatedFetch('/api/saas/companies');
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Subscription data received:', data);
        
        // The backend returns { data: { companies: [...] } }
        const companies = data.data?.companies || [];
        console.log('📊 Companies data:', companies);
        console.log('📊 First company usage data:', companies[0] ? {
          usageStats: companies[0].usageStats,
          planLimits: companies[0].planLimits,
          currentUsers: companies[0].currentUsers,
          totalDepartments: companies[0].totalDepartments,
          storageUsed: companies[0].storageUsed
        } : 'No companies');
        
        // Transform company data to subscription format with real data
        const subscriptionData = companies.map((company: any) => {
          console.log('🔍 Company billing cycle data:', {
            companyName: company.companyName,
            billingCycle: company.billingCycle,
            subscription: company.subscription,
            subscriptionBillingCycle: company.subscription?.billingCycle
          });
          
          return {
          _id: company._id,
          companyId: company._id,
          companyName: company.companyName,
          plan: {
            _id: company._id,
            name: company.subscriptionPlan?.toLowerCase() || 'free',
            displayName: company.subscriptionPlan || 'Free',
            description: `${company.subscriptionPlan || 'Free'} Plan`,
            price: {
              monthly: company.subscriptionAmount || 0,
              quarterly: company.subscriptionAmount ? company.subscriptionAmount * 3 * 0.9 : 0,
              yearly: company.subscriptionAmount ? company.subscriptionAmount * 12 * 0.8 : 0
            },
            limits: company.planLimits || { 
              maxUsers: company.maxUsers || -1, 
              maxDepartments: -1, 
              storageGB: -1 
            },
            features: {},
            trialDays: 0,
            isActive: true,
            isPopular: false,
            createdAt: company.createdAt
          },
          status: company.subscriptionStatus || 'trial',
          billingCycle: company.billingCycle || company.subscription?.billingCycle || 'monthly',
          startDate: company.subscriptionStartDate || company.createdAt,
          endDate: company.subscriptionEndDate,
          nextBillingDate: company.nextBillingDate,
          autoRenewal: company.autoRenewal || false,
          currentPeriodRevenue: company.subscriptionAmount || 0,
          totalRevenue: company.totalPaid || 0,
          paymentMethod: company.paymentMethod || 'N/A',
          lastPaymentDate: company.lastPaymentDate,
          usageStats: company.usageStats || {
            users: company.currentUsers || 0,
            departments: company.totalDepartments || 0,
            storageUsed: company.storageUsed || 0
          }
        };
        }) || [];
        
        setSubscriptions(subscriptionData);
        console.log('✅ Subscriptions updated:', subscriptionData.length, 'subscriptions');
      } else {
        console.error('Failed to fetch subscriptions:', response.status, response.statusText);
        toast.error('Failed to fetch subscription data');
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Error loading subscription data');
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchPlans();
    fetchSubscriptions();
    fetchBillingData();
    fetchAnalyticsData();
    fetchExpiringSubscriptions();
    fetchMetricsData();
    console.log('SaaS Subscription Management component mounted');
  }, []);

  // Calculate metrics
  const totalMRR = subscriptions.reduce((sum, sub) => 
    sub.status === 'active' ? sum + sub.currentPeriodRevenue : sum, 0
  );
  const totalARR = totalMRR * 12;
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
  const trialSubscriptions = subscriptions.filter(s => s.status === 'trial').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free': return <Package className="h-4 w-4" />;
      case 'basic': return <Layers className="h-4 w-4" />;
      case 'standard': return <Layers className="h-4 w-4" />;
      case 'premium': return <Shield className="h-4 w-4" />;
      case 'enterprise': return <Crown className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Subscription action handlers
  const handleUpgradePlan = (subscription: CompanySubscription) => {
    setSelectedSubscription(subscription);
    setSelectedPlanId(''); // Reset plan selection
    setShowUpgradeDialog(true);
  };

  const handleDowngradePlan = (subscription: CompanySubscription) => {
    setSelectedSubscription(subscription);
    setSelectedPlanId(''); // Reset plan selection
    setShowDowngradeDialog(true);
  };

  const handleExtendSubscription = (subscription: CompanySubscription) => {
    setSelectedSubscription(subscription);
    setShowExtendDialog(true);
  };


  const handlePaymentHistory = async (subscription: CompanySubscription) => {
    setSelectedSubscription(subscription);
    setShowPaymentHistoryDialog(true);
    await fetchPaymentHistory(subscription._id);
  };


  const fetchPaymentHistory = async (companyId: string) => {
    try {
      setPaymentHistoryLoading(true);
      console.log('💳 Fetching payment history for company:', companyId);
      
      const response = await saasAuthService.authenticatedFetch(`/api/saas/companies/${companyId}/payments`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Payment history data received:', data);
        setPaymentHistory(data.data?.payments || []);
      } else {
        console.error('Failed to fetch payment history:', response.status, response.statusText);
        setPaymentHistory([]);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setPaymentHistory([]);
    } finally {
      setPaymentHistoryLoading(false);
    }
  };

  const fetchBillingData = async () => {
    try {
      setBillingLoading(true);
      console.log('💳 Fetching billing data...');
      
      const response = await saasAuthService.authenticatedFetch('/api/saas/billing/transactions');
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Billing data received:', data);
        
        // Transform billing data to transaction format
        const billingTransactions = data.data?.transactions?.map((payment: any) => ({
          _id: payment._id,
          companyId: payment.companyId,
          companyName: payment.companyName || 'Unknown Company',
          amount: payment.amount,
          currency: payment.currency || 'INR',
          status: payment.status,
          paymentMethod: payment.paymentMethod || 'N/A',
          gateway: payment.paymentGateway || 'razorpay',
          transactionId: payment.gatewayTransactionId || payment._id.slice(-8),
          invoiceId: payment.gatewayOrderId || `INV-${payment._id.slice(-6)}`,
          description: `${payment.paymentMethod || 'Payment'} - ${payment.companyName || 'Company'}`,
          createdAt: payment.createdAt,
          processedAt: payment.processedAt
        })) || [];
        
        setTransactions(billingTransactions);
        console.log('✅ Billing transactions updated:', billingTransactions.length, 'transactions');
      } else {
        console.error('Failed to fetch billing data:', response.status, response.statusText);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      setTransactions([]);
    } finally {
      setBillingLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true);
      console.log('📊 Fetching analytics data...');
      const response = await saasAuthService.authenticatedFetch('/api/saas/analytics');

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Analytics data received:', data);
        setAnalyticsData(data.data);
      } else {
        console.error('Failed to fetch analytics data:', response.status, response.statusText);
        toast.error('Failed to fetch analytics data');
        // Fallback to mock data if API fails
        setAnalyticsData({
          revenueData: revenueData,
          planDistributionData: planDistributionData
        });
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Error loading analytics data');
      // Fallback to mock data if API fails
      setAnalyticsData({
        revenueData: revenueData,
        planDistributionData: planDistributionData
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchExpiringSubscriptions = async () => {
    try {
      setExpiringLoading(true);
      console.log('🔔 Fetching expiring subscriptions...');
      
      // Get subscriptions that are expiring in the next 7 days
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const response = await saasAuthService.authenticatedFetch('/api/saas/companies');
      
      if (response.ok) {
        const data = await response.json();
        const companies = data.data?.companies || [];
        
        // Filter companies with expiring subscriptions
        const expiring = companies.filter((company: any) => {
          if (!company.subscription?.endDate && !company.subscription?.trialEndsAt) return false;
          
          const endDate = company.subscription?.endDate || company.subscription?.trialEndsAt;
          const expirationDate = new Date(endDate);
          
          // Check if subscription expires within 7 days
          return expirationDate >= now && expirationDate <= sevenDaysFromNow;
        }).map((company: any) => {
          const endDate = company.subscription?.endDate || company.subscription?.trialEndsAt;
          const expirationDate = new Date(endDate);
          const daysUntilExpiry = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            _id: company._id,
            companyName: company.companyName,
            planName: company.subscription?.planName || 'Free',
            endDate: endDate,
            daysUntilExpiry: daysUntilExpiry,
            isTrial: !!company.subscription?.trialEndsAt,
            status: company.subscription?.status || 'active'
          };
        });
        
        setExpiringSubscriptions(expiring);
        console.log('✅ Expiring subscriptions loaded:', expiring.length);
      } else {
        console.error('Failed to fetch expiring subscriptions:', response.status);
        setExpiringSubscriptions([]);
      }
    } catch (error) {
      console.error('Error fetching expiring subscriptions:', error);
      setExpiringSubscriptions([]);
    } finally {
      setExpiringLoading(false);
    }
  };

  const fetchMetricsData = async () => {
    try {
      setMetricsLoading(true);
      console.log('📊 Fetching metrics data...');
      
      const response = await saasAuthService.authenticatedFetch('/api/saas/companies');
      
      if (response.ok) {
        const data = await response.json();
        const companies = data.data?.companies || [];
        
        // Calculate Churn Rate
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        
        // Get companies that were active 30 days ago
        const activeThirtyDaysAgo = companies.filter((company: any) => {
          const createdAt = new Date(company.createdAt);
          return createdAt <= thirtyDaysAgo;
        });
        
        // Get companies that churned in the last 30 days (cancelled or expired)
        const churnedCompanies = companies.filter((company: any) => {
          const subscription = company.subscription;
          if (!subscription) return false;
          
          // Check if subscription is cancelled or expired
          if (subscription.status === 'cancelled' || subscription.status === 'expired') {
            const cancelledAt = subscription.cancelledAt ? new Date(subscription.cancelledAt) : null;
            const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
            
            // Check if cancellation/expiry happened in last 30 days
            if (cancelledAt && cancelledAt >= thirtyDaysAgo) return true;
            if (endDate && endDate >= thirtyDaysAgo && endDate <= now) return true;
          }
          
          return false;
        });
        
        // Calculate churn rate
        const calculatedChurnRate = activeThirtyDaysAgo.length > 0 
          ? (churnedCompanies.length / activeThirtyDaysAgo.length) * 100 
          : 0;
        
        // Calculate Average LTV
        const companiesWithRevenue = companies.filter((company: any) => 
          company.billing?.totalPaid && company.billing.totalPaid > 0
        );
        
        const totalRevenue = companiesWithRevenue.reduce((sum: number, company: any) => 
          sum + (company.billing?.totalPaid || 0), 0
        );
        
        const calculatedAverageLTV = companiesWithRevenue.length > 0 
          ? totalRevenue / companiesWithRevenue.length 
          : 0;
        
        setChurnRate(Math.round(calculatedChurnRate * 10) / 10); // Round to 1 decimal
        setAverageLTV(Math.round(calculatedAverageLTV));
        
        console.log('✅ Metrics calculated:', {
          churnRate: calculatedChurnRate,
          averageLTV: calculatedAverageLTV,
          activeThirtyDaysAgo: activeThirtyDaysAgo.length,
          churnedCompanies: churnedCompanies.length,
          companiesWithRevenue: companiesWithRevenue.length
        });
      } else {
        console.error('Failed to fetch metrics data:', response.status);
        // Fallback to mock data
        setChurnRate(12.5);
        setAverageLTV(2847);
      }
    } catch (error) {
      console.error('Error fetching metrics data:', error);
      // Fallback to mock data
      setChurnRate(12.5);
      setAverageLTV(2847);
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleSendNotification = (subscription: CompanySubscription) => {
    setSelectedSubscription(subscription);
    setShowNotificationDialog(true);
  };

  const handleCancelSubscription = (subscription: CompanySubscription) => {
    setSelectedSubscription(subscription);
    setShowCancelDialog(true);
  };

  const handleViewSubscription = (subscription: CompanySubscription) => {
    setSelectedSubscription(subscription);
    setShowViewDialog(true);
  };

  // Billing action handlers
  const handleViewInvoice = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowInvoiceDialog(true);
  };

  const handleDownloadInvoice = (transaction: any) => {
    // Create invoice data for Excel
    const invoiceData = [
      ['INVOICE DETAILS', ''],
      ['Invoice Number', transaction.transactionId || 'N/A'],
      ['Company Name', transaction.companyName || 'N/A'],
      ['Date', new Date(transaction.createdAt).toLocaleDateString()],
      ['Status', transaction.status || 'N/A'],
      ['', ''],
      ['PAYMENT INFORMATION', ''],
      ['Amount', `₹${transaction.amount?.toLocaleString() || '0'}`],
      ['Currency', transaction.currency || 'INR'],
      ['Payment Method', transaction.paymentMethod || 'N/A'],
      ['Gateway', transaction.gateway || 'Razorpay'],
      ['', ''],
      ['TRANSACTION DETAILS', ''],
      ['Description', transaction.description || 'Subscription Payment'],
      ['Transaction Date', new Date(transaction.createdAt).toLocaleString()],
      ['Processed Date', transaction.processedAt ? new Date(transaction.processedAt).toLocaleString() : 'N/A'],
      ['', ''],
      ['BILLING SUMMARY', ''],
      ['Total Amount', `₹${transaction.amount?.toLocaleString() || '0'}`],
      ['Tax (if applicable)', '₹0'],
      ['Final Amount', `₹${transaction.amount?.toLocaleString() || '0'}`]
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(invoiceData);

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Column A width
      { wch: 30 }  // Column B width
    ];

    // Style the header rows
    const headerStyle = {
      font: { bold: true, size: 14 },
      fill: { fgColor: { rgb: "366092" } },
      alignment: { horizontal: "center" }
    };

    // Apply styles to header rows
    ['A1', 'A7', 'A13', 'A17'].forEach(cell => {
      if (ws[cell]) {
        ws[cell].s = headerStyle;
      }
    });

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');

    // Generate Excel file and download
    const fileName = `invoice-${transaction.transactionId || 'unknown'}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast.success('Invoice downloaded as Excel file successfully!');
  };

  // Action execution functions
  const executeUpgrade = async (newPlanId: string) => {
    if (!selectedSubscription) return;
    
    setActionLoading(true);
    try {
      const response = await saasAuthService.authenticatedFetch(`/api/saas/subscriptions/${selectedSubscription._id}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: newPlanId })
      });

      if (response.ok) {
        toast.success('Plan upgraded successfully!');
        fetchSubscriptions();
        setShowUpgradeDialog(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to upgrade plan');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('Failed to upgrade plan');
    } finally {
      setActionLoading(false);
    }
  };

  const executeDowngrade = async (newPlanId: string) => {
    if (!selectedSubscription) return;
    
    setActionLoading(true);
    try {
      const response = await saasAuthService.authenticatedFetch(`/api/saas/subscriptions/${selectedSubscription._id}/downgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: newPlanId })
      });

      if (response.ok) {
        toast.success('Plan downgraded successfully!');
        fetchSubscriptions();
        setShowDowngradeDialog(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to downgrade plan');
      }
    } catch (error) {
      console.error('Downgrade error:', error);
      toast.error('Failed to downgrade plan');
    } finally {
      setActionLoading(false);
    }
  };

  const executeExtend = async (months: number) => {
    if (!selectedSubscription) return;
    
    setActionLoading(true);
    try {
      const response = await saasAuthService.authenticatedFetch(`/api/saas/subscriptions/${selectedSubscription._id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ months })
      });

      if (response.ok) {
        toast.success(`Subscription extended by ${months} months!`);
        fetchSubscriptions();
        setShowExtendDialog(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to extend subscription');
      }
    } catch (error) {
      console.error('Extend error:', error);
      toast.error('Failed to extend subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const executeCancel = async () => {
    if (!selectedSubscription) return;
    
    setActionLoading(true);
    try {
      const response = await saasAuthService.authenticatedFetch(`/api/saas/subscriptions/${selectedSubscription._id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        toast.success('Subscription cancelled successfully!');
        fetchSubscriptions();
        setShowCancelDialog(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle plan creation
  const handleCreatePlan = async () => {
    if (!newPlan.name || !newPlan.description || newPlan.price.monthly === undefined || newPlan.price.monthly === null || newPlan.price.quarterly === undefined || newPlan.price.quarterly === null || newPlan.price.yearly === undefined || newPlan.price.yearly === null) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      console.log('🚀 Creating plan with data:', newPlan);
      console.log('🌐 Making API call to: /api/saas/plans');
      
      const response = await saasAuthService.authenticatedFetch('/api/saas/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPlan),
      });
      
      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        toast.success('Plan created successfully! (Database)');
        setShowPlanDialog(false);
        setNewPlan({
          name: '',
          displayName: '',
          description: '',
          price: {
            monthly: 0,
            quarterly: 0,
            yearly: 0
          },
          features: {
            taskManagement: false,
            leaveManagement: false,
            meetings: false,
            analytics: false,
            reports: false,
            attendance: false,
            apiAccess: false,
            customBranding: false
          },
          limits: {
            maxUsers: 10,
            maxDepartments: 5,
            maxTasks: 100,
            maxMeetings: 50,
            storageGB: 10,
            apiCallsPerMonth: 10000
          },
          isActive: true,
          isPopular: false,
          sortOrder: 0,
          stripePriceId: ''
        });
        // Refresh plans list from backend
        fetchPlans();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create plan');
      }
    } catch (error) {
      console.error('❌ Error creating plan:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast.error('Failed to create plan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle plan update
  const handleUpdatePlan = async () => {
    if (!editingPlan || !editingPlan.name || !editingPlan.description || !editingPlan.price || editingPlan.price.monthly === undefined || editingPlan.price.monthly === null || editingPlan.price.quarterly === undefined || editingPlan.price.quarterly === null || editingPlan.price.yearly === undefined || editingPlan.price.yearly === null) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await saasAuthService.authenticatedFetch(`/api/saas/plans/${editingPlan._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingPlan),
      });

      if (response.ok) {
        toast.success('Plan updated successfully! (Database)');
        setShowEditPlanDialog(false);
        setEditingPlan(null);
        // Refresh plans list from backend
        fetchPlans();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update plan');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Failed to update plan');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit plan
  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setShowEditPlanDialog(true);
  };



  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Subscription & Billing Management
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive subscription management, billing, and revenue analytics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Button variant="outline" size="sm" onClick={() => {
            fetchSubscriptions();
            fetchPlans();
            fetchBillingData();
            fetchAnalyticsData();
            fetchExpiringSubscriptions();
            fetchMetricsData();
          }} className="text-xs sm:text-sm w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Button size="sm" onClick={() => setShowPlanDialog(true)} className="text-xs sm:text-sm w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Create Plan</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>
      </div>

      {/* Revenue Stats Cards - Platform Dashboard Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Monthly Recurring Revenue */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
              <span className="hidden sm:inline">Monthly Recurring Revenue</span>
              <span className="sm:hidden">MRR</span>
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-green-900 dark:text-green-100">
              {formatCurrency(totalMRR)}
            </div>
            <div className="mt-1 text-xs sm:text-sm text-green-700 dark:text-green-300">
              <span className="hidden sm:inline">{formatCurrency(totalARR)} ARR</span>
              <span className="sm:hidden">{formatCurrency(totalARR)}</span>
            </div>
            <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">+18.2% from last month</span>
              <span className="sm:hidden">+18.2%</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">
              <span className="hidden sm:inline">Active Subscriptions</span>
              <span className="sm:hidden">Active</span>
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
              {activeSubscriptions}
            </div>
            <div className="mt-1 text-xs sm:text-sm text-blue-700 dark:text-blue-300">
              <span className="hidden sm:inline">{trialSubscriptions} in trial</span>
              <span className="sm:hidden">{trialSubscriptions} trial</span>
            </div>
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              Growing subscriber base
            </div>
          </CardContent>
        </Card>

        {/* Churn Rate */}
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              Churn Rate
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="flex items-center">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Calculating...</span>
              </div>
            ) : (
              <>
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {churnRate}%
            </div>
            <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              Monthly churn
            </div>
            <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                  {churnRate < 5 ? 'Excellent retention' : 
                   churnRate < 10 ? 'Good retention' : 
                   churnRate < 15 ? 'Needs attention' : 'High churn risk'}
            </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Average LTV */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Average LTV
            </CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="flex items-center">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Calculating...</span>
              </div>
            ) : (
              <>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {formatCurrency(averageLTV)}
            </div>
            <div className="mt-1 text-sm text-purple-700 dark:text-purple-300">
              Customer lifetime value
            </div>
            <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                  {averageLTV > 5000 ? 'High value customers' : 
                   averageLTV > 2000 ? 'Good value retention' : 
                   averageLTV > 0 ? 'Building value' : 'No revenue data'}
            </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="subscriptions" className="w-full">
        <TabsList className="flex sm:grid w-full sm:grid-cols-3 lg:grid-cols-6 gap-1 h-auto overflow-x-auto sm:overflow-x-visible scrollbar-hide p-1 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4 sticky top-0 z-10 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
          <TabsTrigger value="subscriptions" className="text-xs sm:text-sm h-10 sm:h-11 px-2 sm:px-4 flex-shrink-0 min-w-0 whitespace-nowrap rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-700">
            <span className="hidden sm:inline">💼 Subscriptions</span>
            <span className="sm:hidden">💼</span>
          </TabsTrigger>
          <TabsTrigger value="plans" className="text-xs sm:text-sm h-10 sm:h-11 px-2 sm:px-4 flex-shrink-0 min-w-0 whitespace-nowrap rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-700">
            <span className="hidden sm:inline">📦 Plans</span>
            <span className="sm:hidden">📦</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-xs sm:text-sm h-10 sm:h-11 px-2 sm:px-4 flex-shrink-0 min-w-0 whitespace-nowrap rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-700">
            <span className="hidden sm:inline">💳 Billing</span>
            <span className="sm:hidden">💳</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm h-10 sm:h-11 px-2 sm:px-4 flex-shrink-0 min-w-0 whitespace-nowrap rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-700">
            <span className="hidden sm:inline">📊 Analytics</span>
            <span className="sm:hidden">📊</span>
          </TabsTrigger>
          <TabsTrigger value="coupons" className="text-xs sm:text-sm h-10 sm:h-11 px-2 sm:px-4 flex-shrink-0 min-w-0 whitespace-nowrap rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-700">
            <span className="hidden sm:inline">🎫 Coupons</span>
            <span className="sm:hidden">🎫</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs sm:text-sm h-10 sm:h-11 px-2 sm:px-4 flex-shrink-0 min-w-0 whitespace-nowrap rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-700">
            <span className="hidden sm:inline">🔔 Alerts</span>
            <span className="sm:hidden">🔔</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          {/* Search and Filter */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search companies by name..."
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
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="h-10 text-sm w-full sm:w-auto"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions Table */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Company Subscriptions
                </CardTitle>
                <Badge variant="outline" className="text-xs sm:text-sm">
                  {subscriptions.length} subscriptions
                </Badge>
              </div>
            </CardHeader>
            
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4 p-4">
              {subscriptionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Loading Subscriptions...
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Fetching subscription data from all companies
                    </p>
                  </div>
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500">No subscriptions found</p>
                  <p className="text-sm text-gray-400">Try refreshing or check your connection</p>
                </div>
              ) : (
                subscriptions.map((subscription) => (
                  <Card key={subscription._id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-sm font-bold text-blue-600">
                            {subscription.companyName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {subscription.companyName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {subscription.plan.name}
                          </div>
                        </div>
                      </div>
                      <Badge className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                          subscription.status === 'active' ? 'bg-green-500' :
                          subscription.status === 'trial' ? 'bg-blue-500' :
                          subscription.status === 'expired' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`} />
                        {subscription.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-500">Plan</div>
                        <div className="text-sm font-semibold">{subscription.plan.name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Revenue</div>
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(subscription.totalRevenue)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {subscription.status === 'trial' ? 'Trial ends' : 'Next billing'}: {new Date(subscription.nextBillingDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSubscription(subscription)}
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
                            <DropdownMenuLabel>Subscription Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewSubscription(subscription)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewSubscription(subscription)}>
                              <Edit className="h-4 w-4 mr-2" />
                              View Subscription
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCancelSubscription(subscription)}>
                              <X className="h-4 w-4 mr-2" />
                              Cancel Subscription
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-700">
                    <TableHead className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </TableHead>
                    <TableHead className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan & Billing
                    </TableHead>
                    <TableHead className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </TableHead>
                    <TableHead className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </TableHead>
                    <TableHead className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Billing
                    </TableHead>
                    <TableHead className="text-center py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {subscriptionsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                              Loading Subscriptions...
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                              Fetching subscription data from all companies
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">
                          <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No subscriptions found</p>
                          <p className="text-sm">Try refreshing or check your connection</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscriptions.map((subscription) => (
                    <TableRow key={subscription._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {/* Company */}
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-sm font-bold text-blue-600">
                              {subscription.companyName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {subscription.companyName}
                            </div>
                            <div className="text-xs text-gray-500">
                              Since {new Date(subscription.startDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Plan & Billing */}
                      <TableCell className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <div className={`p-1 rounded mr-2 ${
                              subscription.plan.name === 'enterprise' ? 'bg-purple-100 text-purple-600' :
                              subscription.plan.name === 'premium' ? 'bg-orange-100 text-orange-600' : 
                              subscription.plan.name === 'basic' ? 'bg-green-100 text-green-600' :
                              subscription.plan.name === 'standard' ? 'bg-green-100 text-green-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {getPlanIcon(subscription.plan.name)}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {subscription.plan.displayName}
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="font-semibold text-green-600">
                              {formatCurrency(subscription.currentPeriodRevenue)}
                            </span>
                            <span className="text-gray-500">
                              /{subscription.billingCycle === 'monthly' ? 'mo' : 
                                subscription.billingCycle === 'yearly' ? 'yr' : 'qtr'}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            {subscription.autoRenewal ? (
                              <><Repeat className="h-3 w-3 mr-1" />Auto-renewal</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" />Manual</>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-4 px-4">
                        <Badge className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            subscription.status === 'active' ? 'bg-green-500' :
                            subscription.status === 'trial' ? 'bg-blue-500' :
                            subscription.status === 'expired' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`} />
                          {subscription.status}
                        </Badge>
                      </TableCell>

                      {/* Usage */}
                      <TableCell className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">{subscription.usageStats.users}</span>
                            <span className="text-gray-500">/{subscription.plan.limits.maxUsers === -1 ? '∞' : subscription.plan.limits.maxUsers} users</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {subscription.usageStats.departments}/{subscription.plan.limits.maxDepartments === -1 ? '∞' : subscription.plan.limits.maxDepartments} depts
                          </div>
                          <div className="text-xs text-gray-500">
                            {subscription.usageStats.storageUsed}GB/{subscription.plan.limits.storageGB}GB
                          </div>
                        </div>
                      </TableCell>

                      {/* Revenue */}
                      <TableCell className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(subscription.totalRevenue)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Total lifetime
                          </div>
                        </div>
                      </TableCell>

                      {/* Next Billing */}
                      <TableCell className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="text-sm">
                            {subscription.status === 'trial' ? 'Trial ends' : 'Next billing'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(subscription.nextBillingDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs">
                            {subscription.paymentMethod}
                          </div>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center justify-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSubscription(subscription)}
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
                              <DropdownMenuLabel>Subscription Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem onClick={() => handleUpgradePlan(subscription)}>
                                <ArrowUpRight className="h-4 w-4 mr-2" />
                                Upgrade Plan
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDowngradePlan(subscription)}>
                                <ArrowDownRight className="h-4 w-4 mr-2" />
                                Downgrade Plan
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExtendSubscription(subscription)}>
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                Extend Subscription
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem onClick={() => handlePaymentHistory(subscription)}>
                                <History className="h-4 w-4 mr-2" />
                                Payment History
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendNotification(subscription)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Notification
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleCancelSubscription(subscription)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Subscription
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Plan Management Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {plans
              .sort((a, b) => {
                // Sort by price: Free first (0), then low to high
                if (a.price.monthly === 0 && b.price.monthly === 0) return 0;
                if (a.price.monthly === 0) return -1; // Free comes first
                if (b.price.monthly === 0) return 1;  // Free comes first
                return a.price.monthly - b.price.monthly; // Low to high
              })
              .map((plan) => (
              <Card key={plan._id} className="border-2 hover:border-blue-200 transition-colors">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    plan.name === 'enterprise' ? 'bg-purple-100' :
                    plan.name === 'premium' ? 'bg-orange-100' : 
                    plan.name === 'basic' ? 'bg-green-100' :
                    plan.name === 'standard' ? 'bg-green-100' :
                    'bg-gray-100'
                  }`}>
                    <div className={`text-2xl ${
                      plan.name === 'enterprise' ? 'text-purple-600' :
                      plan.name === 'premium' ? 'text-orange-600' : 
                      plan.name === 'basic' ? 'text-green-600' :
                      plan.name === 'standard' ? 'text-green-600' :
                      'text-gray-600'
                    }`}>
                      {getPlanIcon(plan.name)}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {plan.price.monthly === 0 ? 'Free' : formatCurrency(plan.price.monthly)}
                    </div>
                    {plan.price.monthly > 0 && <p className="text-sm text-gray-500">per month</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Limits:</strong>
                    </div>
                    <div className="text-xs space-y-1">
                      <div>• {plan.limits.maxUsers === -1 ? 'Unlimited' : plan.limits.maxUsers} users</div>
                      <div>• {plan.limits.maxDepartments === -1 ? 'Unlimited' : plan.limits.maxDepartments} departments</div>
                      <div>• {plan.limits.storageGB}GB storage</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Features:</strong>
                    </div>
                    <div className="text-xs space-y-1">
                      {Object.entries(plan.features).map(([feature, enabled]) => (
                        <div key={feature} className={`flex items-center ${enabled ? 'text-green-600' : 'text-gray-400'}`}>
                          {enabled ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                          {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t">
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPlan(plan)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Transaction History
                </CardTitle>
                <Badge variant="outline" className="text-xs sm:text-sm">
                  {transactions.length} transactions
                </Badge>
              </div>
            </CardHeader>
            
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4 p-4">
              {billingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading billing data...</span>
                  </div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No billing transactions found</p>
                    <p className="text-sm">Transactions will appear here once payments are processed</p>
                  </div>
                </div>
              ) : (
                transactions.map((transaction) => (
                  <Card key={transaction._id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {transaction.transactionId}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {transaction.description}
                        </div>
                      </div>
                      <Badge className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {transaction.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-500">Company</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100 truncate">{transaction.companyName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Amount</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(transaction.amount)}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-500">Payment Method</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{transaction.paymentMethod}</div>
                        <div className="text-xs text-gray-500">via {transaction.gateway}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Date</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{new Date(transaction.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{new Date(transaction.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleViewInvoice(transaction)}
                        title="View Invoice"
                      >
                        <Receipt className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownloadInvoice(transaction)}
                        title="Download Invoice (Excel)"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-700">
                    <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span className="hidden sm:inline">Transaction</span>
                      <span className="sm:hidden">Txn</span>
                    </TableHead>
                    <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span className="hidden sm:inline">Company</span>
                      <span className="sm:hidden">Co</span>
                    </TableHead>
                    <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </TableHead>
                    <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      <span className="hidden lg:inline">Payment Method</span>
                      <span className="lg:hidden">Method</span>
                    </TableHead>
                    <TableHead className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Date
                    </TableHead>
                    <TableHead className="text-center py-3 sm:py-4 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {billingLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                          <span>Loading billing data...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">
                          <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No billing transactions found</p>
                          <p className="text-sm">Transactions will appear here once payments are processed</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                    <TableRow key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {/* Transaction */}
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {transaction.transactionId}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {transaction.description}
                          </div>
                        </div>
                      </TableCell>

                      {/* Company */}
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {transaction.companyName}
                        </div>
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                        <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(transaction.amount)}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                        <Badge className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {transaction.status}
                        </Badge>
                      </TableCell>

                      {/* Payment Method */}
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4 hidden lg:table-cell">
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-xs sm:text-sm">{transaction.paymentMethod}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          via {transaction.gateway}
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4 hidden md:table-cell">
                        <div className="text-xs sm:text-sm">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                        <div className="flex items-center justify-center space-x-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                            onClick={() => handleViewInvoice(transaction)}
                            title="View Invoice"
                          >
                            <Receipt className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                            onClick={() => handleDownloadInvoice(transaction)}
                            title="Download Invoice (Excel)"
                          >
                            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading analytics data...</span>
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Revenue Growth Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData?.revenueData || revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line type="monotone" dataKey="mrr" stroke="#8884d8" name="MRR" />
                    <Line type="monotone" dataKey="arr" stroke="#82ca9d" name="ARR" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Plan Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Plan Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                        data={analyticsData?.planDistributionData || planDistributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                        {(analyticsData?.planDistributionData || planDistributionData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          )}
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons" className="space-y-6">
          <CouponManagement />
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Expiring Subscriptions */}
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-700">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Expiring Subscriptions
                </CardTitle>
                <CardDescription>
                  Subscriptions expiring in the next 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expiringLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading expiring subscriptions...</span>
                    </div>
                  </div>
                ) : expiringSubscriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-500">No expiring subscriptions</p>
                    <p className="text-sm text-gray-400">All subscriptions are up to date</p>
                  </div>
                ) : (
                <div className="space-y-3">
                    {expiringSubscriptions.map((subscription) => (
                      <div key={subscription._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                          <div className="font-medium">{subscription.companyName}</div>
                          <div className="text-sm text-gray-600">
                            {subscription.isTrial ? 'Trial' : 'Subscription'} expires in {subscription.daysUntilExpiry} day{subscription.daysUntilExpiry !== 1 ? 's' : ''}
                    </div>
                          <div className="text-xs text-gray-500">
                            Plan: {subscription.planName} • Status: {subscription.status}
                  </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Mail className="h-4 w-4 mr-1" />
                      Notify
                    </Button>
                  </div>
                    ))}
                </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg sm:text-xl">
              <Plus className="h-5 w-5 mr-2 text-blue-600" />
              Create New Subscription Plan
            </DialogTitle>
            <DialogDescription>
              Create a new subscription plan for companies to choose from.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Plan Name *</label>
                <Input
                  placeholder="e.g., premium, enterprise"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Display Name</label>
                <Input
                  placeholder="e.g., Premium Plan, Enterprise Suite"
                  value={newPlan.displayName}
                  onChange={(e) => setNewPlan({ ...newPlan, displayName: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description *</label>
              <Textarea
                placeholder="Describe what this plan includes..."
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700">Pricing (INR) *</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                  <label className="text-xs text-gray-600">Monthly Price</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                    placeholder="999"
                    value={isNaN(newPlan.price.monthly) ? 0 : newPlan.price.monthly}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? 0 : parseFloat(value);
                      const monthlyPrice = isNaN(numValue) ? 0 : numValue;
                      
                      // Auto-calculate quarterly (10% off) and yearly (20% off) prices
                      const quarterlyPrice = Math.round(monthlyPrice * 3 * 0.9);
                      const yearlyPrice = Math.round(monthlyPrice * 12 * 0.8);
                      
                      setNewPlan({ 
                        ...newPlan, 
                        price: { 
                          monthly: monthlyPrice,
                          quarterly: quarterlyPrice,
                          yearly: yearlyPrice
                        } 
                      });
                    }}
                />
              </div>
              <div className="space-y-2">
                  <label className="text-xs text-gray-600">Quarterly Price (10% off)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="2697"
                    value={isNaN(newPlan.price.quarterly) ? 0 : newPlan.price.quarterly}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? 0 : parseFloat(value);
                      setNewPlan({ 
                        ...newPlan, 
                        price: { 
                          ...newPlan.price, 
                          quarterly: isNaN(numValue) ? 0 : numValue 
                        } 
                      });
                    }}
                  />
              </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-600">Yearly Price (20% off)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="9592"
                    value={isNaN(newPlan.price.yearly) ? 0 : newPlan.price.yearly}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? 0 : parseFloat(value);
                      setNewPlan({ 
                        ...newPlan, 
                        price: { 
                          ...newPlan.price, 
                          yearly: isNaN(numValue) ? 0 : numValue 
                        } 
                      });
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Enter monthly price to auto-calculate quarterly (10% off) and yearly (20% off) prices. You can manually adjust them if needed.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700">Features</label>

              {/* Feature Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(newPlan.features || {}).map(([featureKey, enabled]) => (
                  <div key={featureKey} className="flex items-center space-x-2">
                    <Switch
                      id={`new-${featureKey}`}
                      checked={enabled}
                      onCheckedChange={(checked) => setNewPlan({
                        ...newPlan,
                        features: {
                          ...newPlan.features,
                          [featureKey]: checked
                        }
                      })}
                    />
                    <label htmlFor={`new-${featureKey}`} className="text-sm font-medium text-gray-700">
                      {featureKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </label>
              </div>
                    ))}
                  </div>
            </div>

            {/* Limits */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700">Plan Limits</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                  <label className="text-xs text-gray-600">Max Users</label>
                    <input
                      type="checkbox"
                      checked={newPlan.limits.maxUsers === -1}
                      onChange={(e) => setNewPlan({
                        ...newPlan,
                        limits: { ...newPlan.limits, maxUsers: e.target.checked ? -1 : 10 }
                      })}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-500">Unlimited</span>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={newPlan.limits.maxUsers === -1 ? '' : newPlan.limits.maxUsers}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? 10 : parseInt(value);
                      setNewPlan({
                      ...newPlan,
                        limits: { ...newPlan.limits, maxUsers: isNaN(numValue) ? 10 : numValue }
                      });
                    }}
                    disabled={newPlan.limits.maxUsers === -1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                  <label className="text-xs text-gray-600">Max Departments</label>
                    <input
                      type="checkbox"
                      checked={newPlan.limits.maxDepartments === -1}
                      onChange={(e) => setNewPlan({
                        ...newPlan,
                        limits: { ...newPlan.limits, maxDepartments: e.target.checked ? -1 : 5 }
                      })}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-500">Unlimited</span>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    placeholder="5"
                    value={newPlan.limits.maxDepartments === -1 ? '' : newPlan.limits.maxDepartments}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? 5 : parseInt(value);
                      setNewPlan({
                      ...newPlan,
                        limits: { ...newPlan.limits, maxDepartments: isNaN(numValue) ? 5 : numValue }
                      });
                    }}
                    disabled={newPlan.limits.maxDepartments === -1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                  <label className="text-xs text-gray-600">Storage (GB)</label>
                    <input
                      type="checkbox"
                      checked={newPlan.limits.storageGB === -1}
                      onChange={(e) => setNewPlan({
                        ...newPlan,
                        limits: { ...newPlan.limits, storageGB: e.target.checked ? -1 : 10 }
                      })}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-500">Unlimited</span>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={newPlan.limits.storageGB === -1 ? '' : newPlan.limits.storageGB}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? 10 : parseInt(value);
                      setNewPlan({
                      ...newPlan,
                        limits: { ...newPlan.limits, storageGB: isNaN(numValue) ? 10 : numValue }
                      });
                    }}
                    disabled={newPlan.limits.storageGB === -1}
                  />
                </div>
              </div>
            </div>

            {/* Plan Status and Popular Toggle */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={newPlan.isActive}
                  onCheckedChange={(checked) => setNewPlan({ ...newPlan, isActive: checked })}
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Active Plan
                </label>
              </div>
              
            <div className="flex items-center space-x-2">
              <Switch
                id="popular"
                checked={newPlan.isPopular}
                onCheckedChange={(checked) => setNewPlan({ ...newPlan, isPopular: checked })}
              />
              <label htmlFor="popular" className="text-sm font-medium text-gray-700">
                Mark as Popular Plan
              </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreatePlan}
              disabled={loading || !newPlan.name || !newPlan.description || newPlan.price.monthly === undefined || newPlan.price.monthly === null || newPlan.price.quarterly === undefined || newPlan.price.quarterly === null || newPlan.price.yearly === undefined || newPlan.price.yearly === null}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plan
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={showEditPlanDialog} onOpenChange={setShowEditPlanDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg sm:text-xl">
              <Edit className="h-5 w-5 mr-2 text-orange-600" />
              Edit Subscription Plan
            </DialogTitle>
            <DialogDescription>
              Update the subscription plan details.
            </DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Plan Name *</label>
                  <Input
                    placeholder="e.g., premium, enterprise"
                    value={editingPlan.name || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Display Name</label>
                  <Input
                    placeholder="e.g., Premium Plan, Enterprise Suite"
                    value={editingPlan.displayName || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, displayName: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description *</label>
                <Textarea
                  placeholder="Describe what this plan includes..."
                  value={editingPlan.description || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700">Pricing (INR) *</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-xs text-gray-600">Monthly Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                      placeholder="999"
                      value={isNaN(editingPlan.price.monthly) ? 0 : editingPlan.price.monthly}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 0 : parseFloat(value);
                        const monthlyPrice = isNaN(numValue) ? 0 : numValue;
                        
                        // Auto-calculate quarterly (10% off) and yearly (20% off) prices
                        const quarterlyPrice = Math.round(monthlyPrice * 3 * 0.9);
                        const yearlyPrice = Math.round(monthlyPrice * 12 * 0.8);
                        
                        setEditingPlan({ 
                          ...editingPlan, 
                          price: { 
                            monthly: monthlyPrice,
                            quarterly: quarterlyPrice,
                            yearly: yearlyPrice
                          } 
                        });
                      }}
                  />
                </div>
                <div className="space-y-2">
                    <label className="text-xs text-gray-600">Quarterly Price (10% off)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="2697"
                      value={isNaN(editingPlan.price.quarterly) ? 0 : editingPlan.price.quarterly}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 0 : parseFloat(value);
                        setEditingPlan({ 
                          ...editingPlan, 
                          price: { 
                            ...editingPlan.price, 
                            quarterly: isNaN(numValue) ? 0 : numValue 
                          } 
                        });
                      }}
                    />
                </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600">Yearly Price (20% off)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="9592"
                      value={isNaN(editingPlan.price.yearly) ? 0 : editingPlan.price.yearly}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 0 : parseFloat(value);
                        setEditingPlan({ 
                          ...editingPlan, 
                          price: { 
                            ...editingPlan.price, 
                            yearly: isNaN(numValue) ? 0 : numValue 
                          } 
                        });
                      }}
                    />
              </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Enter monthly price to auto-calculate quarterly (10% off) and yearly (20% off) prices. You can manually adjust them if needed.
              </p>

              {/* Features */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700">Features</label>

                {/* Feature Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(editingPlan?.features || {}).map(([featureKey, enabled]) => (
                    <div key={featureKey} className="flex items-center space-x-2">
                      <Switch
                        id={`edit-${featureKey}`}
                        checked={enabled}
                        onCheckedChange={(checked) => setEditingPlan({
                          ...editingPlan,
                          features: {
                            ...editingPlan.features,
                            [featureKey]: checked
                          }
                        })}
                      />
                      <label htmlFor={`edit-${featureKey}`} className="text-sm font-medium text-gray-700">
                        {featureKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                </div>
                      ))}
                    </div>
              </div>

              {/* Limits */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700">Plan Limits</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-600">Max Users</label>
                      <input
                        type="checkbox"
                        checked={editingPlan.limits?.maxUsers === -1}
                        onChange={(e) => setEditingPlan({
                          ...editingPlan,
                          limits: { ...editingPlan.limits, maxUsers: e.target.checked ? -1 : 10 }
                        })}
                        className="rounded"
                      />
                      <span className="text-xs text-gray-500">Unlimited</span>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      value={editingPlan.limits?.maxUsers === -1 ? '' : (editingPlan.limits?.maxUsers || 10)}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, maxUsers: parseInt(e.target.value) || 10 }
                      })}
                      disabled={editingPlan.limits?.maxUsers === -1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-600">Max Departments</label>
                      <input
                        type="checkbox"
                        checked={editingPlan.limits?.maxDepartments === -1}
                        onChange={(e) => setEditingPlan({
                          ...editingPlan,
                          limits: { ...editingPlan.limits, maxDepartments: e.target.checked ? -1 : 5 }
                        })}
                        className="rounded"
                      />
                      <span className="text-xs text-gray-500">Unlimited</span>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      value={editingPlan.limits?.maxDepartments === -1 ? '' : (editingPlan.limits?.maxDepartments || 5)}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, maxDepartments: parseInt(e.target.value) || 5 }
                      })}
                      disabled={editingPlan.limits?.maxDepartments === -1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-600">Storage (GB)</label>
                      <input
                        type="checkbox"
                        checked={editingPlan.limits?.storageGB === -1}
                        onChange={(e) => setEditingPlan({
                          ...editingPlan,
                          limits: { ...editingPlan.limits, storageGB: e.target.checked ? -1 : 10 }
                        })}
                        className="rounded"
                      />
                      <span className="text-xs text-gray-500">Unlimited</span>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      value={editingPlan.limits?.storageGB === -1 ? '' : (editingPlan.limits?.storageGB || 10)}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, storageGB: parseInt(e.target.value) || 10 }
                      })}
                      disabled={editingPlan.limits?.storageGB === -1}
                    />
                  </div>
                </div>
              </div>

              {/* Plan Status and Popular Toggle */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-active"
                    checked={editingPlan.isActive || true}
                    onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, isActive: checked })}
                  />
                  <label htmlFor="edit-active" className="text-sm font-medium text-gray-700">
                    Active Plan
                  </label>
                </div>
                
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-popular"
                  checked={editingPlan.isPopular || false}
                  onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, isPopular: checked })}
                />
                <label htmlFor="edit-popular" className="text-sm font-medium text-gray-700">
                  Mark as Popular Plan
                </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={() => setShowEditPlanDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePlan}
              disabled={loading || !editingPlan?.name || !editingPlan?.description || editingPlan?.price?.monthly === undefined || editingPlan?.price?.monthly === null || editingPlan?.price?.quarterly === undefined || editingPlan?.price?.quarterly === null || editingPlan?.price?.yearly === undefined || editingPlan?.price?.yearly === null}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Plan
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Plan Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="w-[95vw] max-w-md sm:w-full">
          <DialogHeader>
            <DialogTitle>Upgrade Plan</DialogTitle>
            <DialogDescription>
              Upgrade {selectedSubscription?.companyName}'s subscription to a higher plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Current Plan: <span className="font-medium">{selectedSubscription?.plan.displayName}</span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select New Plan</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
              >
                <option value="">Select a plan...</option>
                {plans.filter(plan => plan._id !== selectedSubscription?.plan._id).map(plan => (
                  <option key={plan._id} value={plan._id}>
                    {plan.displayName} - ₹{plan.price.monthly}/month
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => executeUpgrade(selectedPlanId)}
              disabled={actionLoading || !selectedPlanId}
            >
              {actionLoading ? 'Upgrading...' : 'Upgrade Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Downgrade Plan Dialog */}
      <Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <DialogContent className="w-[95vw] max-w-md sm:w-full">
          <DialogHeader>
            <DialogTitle>Downgrade Plan</DialogTitle>
            <DialogDescription>
              Downgrade {selectedSubscription?.companyName}'s subscription to a lower plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Current Plan: <span className="font-medium">{selectedSubscription?.plan.displayName}</span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select New Plan</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
              >
                <option value="">Select a plan...</option>
                {plans.filter(plan => plan._id !== selectedSubscription?.plan._id).map(plan => (
                  <option key={plan._id} value={plan._id}>
                    {plan.displayName} - ₹{plan.price.monthly}/month
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDowngradeDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => executeDowngrade(selectedPlanId)}
              disabled={actionLoading || !selectedPlanId}
            >
              {actionLoading ? 'Downgrading...' : 'Downgrade Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Subscription Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent className="w-[95vw] max-w-md sm:w-full">
          <DialogHeader>
            <DialogTitle>Extend Subscription</DialogTitle>
            <DialogDescription>
              Extend {selectedSubscription?.companyName}'s subscription period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Current Plan: <span className="font-medium">{selectedSubscription?.plan.displayName}</span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Extend by (months)</label>
              <select className="w-full p-2 border rounded-md">
                <option value="1">1 Month</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => executeExtend(1)}
              disabled={actionLoading}
            >
              {actionLoading ? 'Extending...' : 'Extend Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Payment History Dialog */}
      <Dialog open={showPaymentHistoryDialog} onOpenChange={setShowPaymentHistoryDialog}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[80vh] overflow-y-auto sm:w-full">
          <DialogHeader>
            <DialogTitle>Payment History - {selectedSubscription?.companyName}</DialogTitle>
            <DialogDescription>
              View all payment transactions for this subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {paymentHistoryLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-gray-400" />
                <p className="text-gray-500">Loading payment history...</p>
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No payment history found for this subscription.</p>
                <p className="text-sm">Payment records will appear here once transactions are completed.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div key={payment._id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Payment #{payment.gatewayTransactionId || payment._id.slice(-8)}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Method: {payment.paymentMethod || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Gateway: {payment.paymentGateway || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          ₹{payment.amount?.toLocaleString() || '0'}
                        </p>
                        <Badge className={`mt-1 ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.status || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Processed: {payment.processedAt ? new Date(payment.processedAt).toLocaleDateString() : 'N/A'}
                      </span>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentHistoryDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="w-[95vw] max-w-md sm:w-full">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>
              Send a notification to {selectedSubscription?.companyName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Notification Type</label>
              <select className="w-full p-2 border rounded-md">
                <option value="payment_reminder">Payment Reminder</option>
                <option value="plan_expiry">Plan Expiry Warning</option>
                <option value="feature_update">Feature Update</option>
                <option value="maintenance">Maintenance Notice</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <textarea 
                className="w-full p-2 border rounded-md h-24"
                placeholder="Enter your message..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotificationDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                toast.success('Notification sent successfully!');
                setShowNotificationDialog(false);
              }}
            >
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="w-[95vw] max-w-md sm:w-full">
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel {selectedSubscription?.companyName}'s subscription?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Warning</p>
                  <p>This action cannot be undone. The subscription will be cancelled immediately.</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for cancellation</label>
              <select className="w-full p-2 border rounded-md">
                <option value="cost">Too expensive</option>
                <option value="features">Missing features</option>
                <option value="support">Poor support</option>
                <option value="switching">Switching to competitor</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button 
              variant="destructive"
              onClick={executeCancel}
              disabled={actionLoading}
            >
              {actionLoading ? 'Cancelling...' : 'Cancel Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Subscription Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[80vh] overflow-y-auto sm:w-full">
          <DialogHeader>
            <DialogTitle>Subscription Details - {selectedSubscription?.companyName}</DialogTitle>
            <DialogDescription>
              View detailed information about this subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedSubscription && (
              <>
                {/* Company Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Company Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Company Name</label>
                        <p className="text-sm">{selectedSubscription.companyName}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Plan Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Current Plan</label>
                        <p className="text-sm font-medium">{selectedSubscription.plan.displayName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Billing Cycle</label>
                        <p className="text-sm capitalize">{selectedSubscription.billingCycle}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Plan Amount</label>
                        <p className="text-sm font-semibold text-green-600">
                          ₹{selectedSubscription.plan.price[selectedSubscription.billingCycle]?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Subscription Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Subscription Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <div className="mt-1">
                          <Badge className={getStatusColor(selectedSubscription.status)}>
                            {selectedSubscription.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Start Date</label>
                        <p className="text-sm">{new Date(selectedSubscription.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">End Date</label>
                        <p className="text-sm">
                          {selectedSubscription.endDate ? new Date(selectedSubscription.endDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Next Billing Date</label>
                        <p className="text-sm">
                          {selectedSubscription.nextBillingDate ? new Date(selectedSubscription.nextBillingDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Auto Renewal</label>
                        <p className="text-sm">{selectedSubscription.autoRenewal ? 'Enabled' : 'Disabled'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Usage Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Usage Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Current Users</label>
                        <p className="text-sm font-semibold">
                          {selectedSubscription.usageStats.users} / {selectedSubscription.plan.limits.maxUsers === -1 ? '∞' : selectedSubscription.plan.limits.maxUsers}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Departments</label>
                        <p className="text-sm font-semibold">
                          {selectedSubscription.usageStats.departments} / {selectedSubscription.plan.limits.maxDepartments === -1 ? '∞' : selectedSubscription.plan.limits.maxDepartments}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Storage Used</label>
                        <p className="text-sm font-semibold">
                          {selectedSubscription.usageStats.storageUsed}GB / {selectedSubscription.plan.limits.storageGB === -1 ? '∞' : selectedSubscription.plan.limits.storageGB}GB
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Current Period Revenue</label>
                        <p className="text-sm font-semibold text-green-600">
                          ₹{selectedSubscription.currentPeriodRevenue?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Total Revenue</label>
                        <p className="text-sm font-semibold text-green-600">
                          ₹{selectedSubscription.totalRevenue?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Payment Method</label>
                        <p className="text-sm">{selectedSubscription.paymentMethod || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Payment Date</label>
                      <p className="text-sm">
                        {selectedSubscription.lastPaymentDate ? new Date(selectedSubscription.lastPaymentDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice View Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              View detailed invoice information for this transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedTransaction && (
              <>
                {/* Invoice Header */}
                <div className="border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">Invoice #{selectedTransaction.transactionId}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedTransaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={`${
                      selectedTransaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedTransaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                </div>

                {/* Company Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Bill To</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Company Name</label>
                        <p className="text-sm">{selectedTransaction.companyName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Transaction ID</label>
                        <p className="text-sm font-mono">{selectedTransaction.transactionId}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Payment Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Payment Method</label>
                        <p className="text-sm">{selectedTransaction.paymentMethod}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Gateway</label>
                        <p className="text-sm capitalize">{selectedTransaction.gateway || 'razorpay'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Invoice Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Invoice Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm font-medium">Description</span>
                      <span className="text-sm">{selectedTransaction.description}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm font-medium">Amount</span>
                      <span className="text-sm font-semibold">
                        ₹{selectedTransaction.amount?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm font-medium">Currency</span>
                      <span className="text-sm">{selectedTransaction.currency || 'INR'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm font-medium">Transaction Date</span>
                      <span className="text-sm">
                        {new Date(selectedTransaction.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedTransaction.processedAt && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium">Processed Date</span>
                        <span className="text-sm">
                          {new Date(selectedTransaction.processedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                if (selectedTransaction) {
                  handleDownloadInvoice(selectedTransaction);
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Excel Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

