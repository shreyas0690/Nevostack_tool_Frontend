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
  CreditCard, 
  DollarSign, 
  Calendar,
  Download,
  RefreshCw,
  Edit,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Receipt,
  Banknote,
  History,
  Settings,
  Zap,
  Crown,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { saasAuthService } from '@/services/saasAuthService';

interface BillingHistory {
  id: number;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoiceNumber: string;
}

interface CompanyBilling {
  name: string;
  subscription: {
    plan: string;
    status: string;
    billingCycle: string;
    amount: number;
    startDate: string;
    endDate?: string;
  };
  billingHistory: BillingHistory[];
}

interface CompanyBillingManagementProps {
  companyId: string;
  companyName: string;
}

export default function CompanyBillingManagement({ companyId, companyName }: CompanyBillingManagementProps) {
  const [billing, setBilling] = useState<CompanyBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState('');

  const plans = [
    { id: 'basic', name: 'Starter', price: 99, features: ['Up to 50 users', 'Basic features', 'Email support'] },
    { id: 'pro', name: 'Professional', price: 299, features: ['Up to 200 users', 'Advanced features', 'Priority support'] },
    { id: 'enterprise', name: 'Enterprise', price: 599, features: ['Unlimited users', 'All features', '24/7 support'] }
  ];

  const billingCycles = [
    { id: 'monthly', name: 'Monthly', discount: 0 },
    { id: 'quarterly', name: 'Quarterly', discount: 5 },
    { id: 'yearly', name: 'Yearly', discount: 15 }
  ];

  useEffect(() => {
    fetchBillingData();
  }, [companyId]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);

      // Remove pre-API authentication check - let authenticatedFetch handle it

      console.log('💳 Fetching billing data for company:', companyId);
      const response = await saasAuthService.authenticatedFetch(
        `/api/saas/companies/${companyId}/billing`
      );

      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Billing data received:', data);

        // Transform the backend response to match frontend expectations
        const billingData = {
          name: data.data.company.name,
          subscription: data.data.company.subscription,
          billingHistory: data.data.billingHistory
        };

        setBilling(billingData);
      } else {
        const errorData = await response.text();
        console.error('❌ API Error:', errorData);
        toast.error('Failed to fetch billing data');
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
      toast.error('Network error: Failed to fetch billing data');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async () => {
    try {
      // Remove pre-API authentication check - let authenticatedFetch handle it

      console.log('🔄 Updating plan for company:', companyId, 'to:', selectedPlan);
      const response = await saasAuthService.authenticatedFetch(
        `/api/saas/companies/${companyId}/plan`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            plan: selectedPlan,
            billingCycle: selectedBillingCycle
          })
        }
      );

      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        toast.success('Plan updated successfully');
        setShowPlanDialog(false);
        fetchBillingData();
      } else {
        let errorMessage = 'Failed to update plan';
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
      toast.error('Network error: Failed to update plan');
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

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-gray-100 text-gray-600';
      case 'pro': return 'bg-blue-100 text-blue-600';
      case 'enterprise': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDiscount = (plan: any, cycle: string) => {
    const cycleData = billingCycles.find(c => c.id === cycle);
    return cycleData ? (plan.price * cycleData.discount / 100) : 0;
  };

  const calculateFinalPrice = (plan: any, cycle: string) => {
    const discount = calculateDiscount(plan, cycle);
    const basePrice = cycle === 'yearly' ? plan.price * 12 : cycle === 'quarterly' ? plan.price * 3 : plan.price;
    return basePrice - discount;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading billing information...</span>
        </div>
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No billing information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Billing & Subscription
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage {companyName}'s subscription and billing information
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBillingDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export Invoice
          </Button>
          <Button onClick={() => setShowPlanDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Change Plan
          </Button>
        </div>
      </div>

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg mr-3 ${billing.subscription ? getPlanColor(billing.subscription.plan) : 'bg-gray-100'}`}>
                  {billing.subscription ? getPlanIcon(billing.subscription.plan) : <CreditCard className="h-5 w-5 text-gray-400" />}
                </div>
                <div>
                  <div className="font-semibold capitalize">
                    {billing.subscription ? `${billing.subscription.plan} Plan` : 'No Plan Selected'}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    {billing.subscription ? `${billing.subscription.billingCycle} billing` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {billing.subscription ? formatCurrency(billing.subscription.amount) : '₹0'}
              </div>
              <div className="text-sm text-gray-600">
                per {billing.subscription ? (
                  billing.subscription.billingCycle === 'monthly' ? 'month' :
                  billing.subscription.billingCycle === 'quarterly' ? 'quarter' : 'year'
                ) : 'N/A'}
              </div>
            </div>
            
            <div className="space-y-2">
              <Badge className={billing.subscription ? getStatusColor(billing.subscription.status) : 'bg-gray-100 text-gray-600'}>
                {billing.subscription ? billing.subscription.status : 'Unknown'}
              </Badge>
              <div className="text-sm text-gray-600">
                {billing.subscription?.endDate
                  ? `Renews ${formatDate(billing.subscription.endDate)}`
                  : 'No end date'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <History className="h-5 w-5 mr-2" />
              Billing History
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchBillingData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {billing.billingHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(item.date)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-medium">{item.description}</div>
                    <div className="text-sm text-gray-500">Invoice #{item.invoiceNumber}</div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-semibold text-green-600">
                      {formatCurrency(item.amount)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status === 'paid' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {item.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {item.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {item.status}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </TableCell>
                  
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Receipt className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Available Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${
                billing.subscription?.plan === plan.id ? 'ring-2 ring-blue-500' : ''
              }`}>
                {billing.subscription?.plan === plan.id && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-blue-500">Current</Badge>
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${getPlanColor(plan.id)}`}>
                        {getPlanIcon(plan.id)}
                      </div>
                      <div>
                        <div className="font-semibold">{plan.name}</div>
                        <div className="text-2xl font-bold">{formatCurrency(plan.price)}</div>
                        <div className="text-sm text-gray-600">per month</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {billing.subscription?.plan !== plan.id && (
                    <Button
                      className="w-full mt-4"
                      variant="outline"
                      onClick={() => {
                        setSelectedPlan(plan.id);
                        setShowPlanDialog(true);
                      }}
                    >
                      {billing.subscription?.plan === 'basic' && plan.id === 'pro' ? 'Upgrade' :
                       billing.subscription?.plan === 'pro' && plan.id === 'basic' ? 'Downgrade' :
                       'Switch to ' + plan.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Change Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Select a new plan and billing cycle for {companyName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Plan</label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div className="flex items-center">
                        <div className={`p-1 rounded mr-2 ${getPlanColor(plan.id)}`}>
                          {getPlanIcon(plan.id)}
                        </div>
                        {plan.name} - {formatCurrency(plan.price)}/month
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Billing Cycle</label>
              <Select value={selectedBillingCycle} onValueChange={setSelectedBillingCycle}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose billing cycle" />
                </SelectTrigger>
                <SelectContent>
                  {billingCycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name} {cycle.discount > 0 && `(${cycle.discount}% discount)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedPlan && selectedBillingCycle && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Cost:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(calculateFinalPrice(plans.find(p => p.id === selectedPlan)!, selectedBillingCycle))}
                  </span>
                </div>
                {calculateDiscount(plans.find(p => p.id === selectedPlan)!, selectedBillingCycle) > 0 && (
                  <div className="text-sm text-green-600 mt-1">
                    You save {formatCurrency(calculateDiscount(plans.find(p => p.id === selectedPlan)!, selectedBillingCycle))}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handlePlanChange} disabled={!selectedPlan || !selectedBillingCycle}>
                Update Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Billing Export Dialog */}
      <Dialog open={showBillingDialog} onOpenChange={setShowBillingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Billing Data</DialogTitle>
            <DialogDescription>
              Download billing information and invoices for {companyName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center">
                <Receipt className="h-6 w-6 mb-2" />
                <span>Download Invoices</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center">
                <Banknote className="h-6 w-6 mb-2" />
                <span>Payment History</span>
              </Button>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowBillingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowBillingDialog(false)}>
                Download All
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
