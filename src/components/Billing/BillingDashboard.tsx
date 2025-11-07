import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  Settings,
  Users,
  HardDrive
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Subscription {
  _id: string;
  status: 'active' | 'trial' | 'expired' | 'cancelled' | 'suspended';
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  trialEndsAt?: string;
  amount: number;
  currency: string;
  autoRenewal: boolean;
  planId: {
    displayName: string;
    description: string;
    price: {
      monthly: number;
      quarterly: number;
      yearly: number;
    };
    features: {
      taskManagement: boolean;
      leaveManagement: boolean;
      meetings: boolean;
      analytics: boolean;
      reports: boolean;
      attendance: boolean;
      apiAccess: boolean;
      customBranding: boolean;
    };
    limits: {
      maxUsers: number;
      maxDepartments: number;
      storageGB: number;
    };
  };
  usage: {
    currentUsers: number;
    currentDepartments: number;
    storageUsed: number;
  };
}

interface BillingRecord {
  _id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  dueDate: string;
  paidAt?: string;
  invoiceNumber: string;
  planId: {
    displayName: string;
  };
}

export default function BillingDashboard() {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [upcomingBilling, setUpcomingBilling] = useState<BillingRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const [subscriptionRes, historyRes, upcomingRes] = await Promise.all([
        fetch('/api/billing/subscription'),
        fetch('/api/billing/history'),
        fetch('/api/billing/upcoming')
      ]);

      if (subscriptionRes.ok) {
        const subData = await subscriptionRes.json();
        setSubscription(subData.data);
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setBillingHistory(historyData.data);
      }

      if (upcomingRes.ok) {
        const upcomingData = await upcomingRes.json();
        setUpcomingBilling(upcomingData.data);
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast({
        title: "Error",
        description: "Failed to load billing information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'trial': return 'bg-blue-500';
      case 'expired': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      case 'suspended': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'trial': return <Clock className="h-4 w-4" />;
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      case 'suspended': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading billing information...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and billing</p>
        </div>
        <Button onClick={loadBillingData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Subscription
                </CardTitle>
                <CardDescription>
                  {subscription.planId.displayName} - {subscription.billingCycle}
                </CardDescription>
              </div>
              <Badge className={`${getStatusColor(subscription.status)} text-white`}>
                {getStatusIcon(subscription.status)}
                <span className="ml-1 capitalize">{subscription.status}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatCurrency(subscription.amount, subscription.currency)}
                </div>
                <div className="text-sm text-gray-600">per {subscription.billingCycle}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {subscription.status === 'trial' && subscription.trialEndsAt 
                    ? Math.ceil((new Date(subscription.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  }
                </div>
                <div className="text-sm text-gray-600">
                  {subscription.status === 'trial' ? 'trial days left' : 'days remaining'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {subscription.autoRenewal ? 'Yes' : 'No'}
                </div>
                <div className="text-sm text-gray-600">auto renewal</div>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="space-y-3">
              <h4 className="font-medium">Usage</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Users</span>
                  <span className="text-sm">
                    {subscription.usage.currentUsers} / {subscription.planId.limits.maxUsers === -1 ? '∞' : subscription.planId.limits.maxUsers}
                  </span>
                </div>
                <Progress 
                  value={subscription.planId.limits.maxUsers === -1 ? 0 : (subscription.usage.currentUsers / subscription.planId.limits.maxUsers) * 100} 
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Departments</span>
                  <span className="text-sm">
                    {subscription.usage.currentDepartments} / {subscription.planId.limits.maxDepartments === -1 ? '∞' : subscription.planId.limits.maxDepartments}
                  </span>
                </div>
                <Progress 
                  value={subscription.planId.limits.maxDepartments === -1 ? 0 : (subscription.usage.currentDepartments / subscription.planId.limits.maxDepartments) * 100} 
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Storage</span>
                  <span className="text-sm">
                    {subscription.usage.storageUsed.toFixed(1)} GB / {subscription.planId.limits.storageGB === -1 ? '∞' : subscription.planId.limits.storageGB} GB
                  </span>
                </div>
                <Progress 
                  value={subscription.planId.limits.storageGB === -1 ? 0 : (subscription.usage.storageUsed / subscription.planId.limits.storageGB) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Billing */}
      {upcomingBilling && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Billing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{upcomingBilling.planId.displayName}</div>
                <div className="text-sm text-gray-600">
                  Due: {new Date(upcomingBilling.dueDate).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">
                  {formatCurrency(upcomingBilling.amount, upcomingBilling.currency)}
                </div>
                <Badge variant={upcomingBilling.status === 'pending' ? 'secondary' : 'default'}>
                  {upcomingBilling.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billingHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No billing history found
              </div>
            ) : (
              billingHistory.map((record) => (
                <div key={record._id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{record.planId.displayName}</div>
                      <div className="text-sm text-gray-600">
                        Invoice: {record.invoiceNumber}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(record.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {formatCurrency(record.amount, record.currency)}
                    </div>
                    <Badge 
                      variant={
                        record.status === 'paid' ? 'default' : 
                        record.status === 'pending' ? 'secondary' : 
                        'destructive'
                      }
                    >
                      {record.status}
                    </Badge>
                    {record.status === 'paid' && (
                      <Button size="sm" variant="outline" className="mt-2">
                        <Download className="h-3 w-3 mr-1" />
                        Invoice
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
