import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiConfig } from '@/config/razorpay';
import { saasAuthService } from '@/services/saasAuthService';
import { Calendar, DollarSign, Users, Tag, AlertCircle, RefreshCw } from 'lucide-react';

interface Plan {
  _id: string;
  displayName: string;
  name: string;
}

interface Coupon {
  _id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_trial';
  value: number;
  currency: string;
  usageLimit: number | null;
  usageLimitPerUser: number;
  validFrom: string;
  validUntil: string;
  applicablePlans: string[];
  minimumOrderAmount: number;
  maximumDiscountAmount: number | null;
  isActive: boolean;
  firstTimeUserOnly: boolean;
  autoApply: boolean;
}

interface CouponFormProps {
  coupon?: Coupon | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CouponForm({ coupon, onSuccess, onCancel }: CouponFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed' | 'free_trial',
    value: 0,
    currency: 'INR',
    usageLimit: '',
    usageLimitPerUser: 1,
    validFrom: '',
    validUntil: '',
    applicablePlans: [] as string[],
    minimumOrderAmount: 0,
    maximumDiscountAmount: '',
    isActive: true,
    firstTimeUserOnly: false,
    autoApply: false
  });

  useEffect(() => {
    fetchPlans();
    if (coupon) {
      // Handle applicablePlans - it might be array of objects or array of strings
      let applicablePlans = [];
      if (Array.isArray(coupon.applicablePlans)) {
        applicablePlans = coupon.applicablePlans.map(plan => 
          typeof plan === 'string' ? plan : plan._id
        );
      }
      
      console.log('🎫 Editing coupon - Original applicablePlans:', coupon.applicablePlans);
      console.log('🎫 Editing coupon - Processed applicablePlans:', applicablePlans);
      
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        currency: coupon.currency,
        usageLimit: coupon.usageLimit?.toString() || '',
        usageLimitPerUser: coupon.usageLimitPerUser,
        validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
        validUntil: new Date(coupon.validUntil).toISOString().split('T')[0],
        applicablePlans: applicablePlans,
        minimumOrderAmount: coupon.minimumOrderAmount,
        maximumDiscountAmount: coupon.maximumDiscountAmount?.toString() || '',
        isActive: coupon.isActive,
        firstTimeUserOnly: coupon.firstTimeUserOnly,
        autoApply: coupon.autoApply
      });
    }
  }, [coupon]);

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      // Try the active plans endpoint first (no auth required)
      let response = await fetch(`${apiConfig.baseUrl}/api/saas/plans/active`);
      
      if (!response.ok) {
        // Fallback to company plans endpoint
        response = await fetch(`${apiConfig.baseUrl}/api/company/plans`);
      }
      
      if (!response.ok) {
        // Fallback to SaaS plans endpoint with auth
        response = await saasAuthService.authenticatedFetch(`${apiConfig.baseUrl}/api/saas/plans`);
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Plans data:', data);
        setPlans(data.data || data || []);
      } else {
        console.error('Failed to fetch plans:', response.status, response.statusText);
        // Set some mock plans for testing
        setPlans([
          { _id: '1', displayName: 'Basic Plan', name: 'basic' },
          { _id: '2', displayName: 'Professional Plan', name: 'professional' },
          { _id: '3', displayName: 'Enterprise Plan', name: 'enterprise' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      // Set some mock plans for testing
      setPlans([
        { _id: '1', displayName: 'Basic Plan', name: 'basic' },
        { _id: '2', displayName: 'Professional Plan', name: 'professional' },
        { _id: '3', displayName: 'Enterprise Plan', name: 'enterprise' }
      ]);
    } finally {
      setPlansLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        maximumDiscountAmount: formData.maximumDiscountAmount ? parseFloat(formData.maximumDiscountAmount) : null,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString()
      };

      // Only include code if it's a new coupon or if the code is being changed
      const isCodeChanged = coupon && formData.code.toUpperCase() !== coupon.code;
      console.log('🎫 Frontend - Code comparison:', {
        isNewCoupon: !coupon,
        existingCode: coupon?.code,
        newCode: formData.code.toUpperCase(),
        isCodeChanged: isCodeChanged,
        willIncludeCode: !coupon || isCodeChanged
      });
      
      if (!coupon || isCodeChanged) {
        payload.code = formData.code.toUpperCase();
      }

      const url = coupon 
        ? `${apiConfig.baseUrl}/api/coupons/${coupon._id}`
        : `${apiConfig.baseUrl}/api/coupons`;
      
      const method = coupon ? 'PUT' : 'POST';

      console.log('🎫 Creating/Updating coupon - URL:', url);
      console.log('🎫 Creating/Updating coupon - Method:', method);
      console.log('🎫 Creating/Updating coupon - FormData:', formData);
      console.log('🎫 Creating/Updating coupon - Payload:', payload);

      const response = await saasAuthService.authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('🎫 Creating coupon - Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🎫 Creating coupon - Error:', errorData);
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to create coupons. Admin access required.');
        } else {
          throw new Error(errorData.message || 'Failed to save coupon');
        }
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: data.message,
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save coupon",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanToggle = (planId: string) => {
    setFormData(prev => ({
      ...prev,
      applicablePlans: prev.applicablePlans.includes(planId)
        ? prev.applicablePlans.filter(id => id !== planId)
        : [...prev.applicablePlans, planId]
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="code">Coupon Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="WELCOME20"
                required
                disabled={coupon && coupon.usedCount > 0}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {coupon && coupon.usedCount > 0 
                  ? "Cannot change code of a used coupon"
                  : "Code will be automatically converted to uppercase"
                }
              </p>
            </div>

            <div>
              <Label htmlFor="name">Coupon Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Welcome Discount"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="20% off for new users"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Discount Configuration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Discount Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="type">Discount Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'percentage' | 'fixed' | 'free_trial') => 
                  setFormData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage Discount</SelectItem>
                  <SelectItem value="fixed">Fixed Amount Discount</SelectItem>
                  <SelectItem value="free_trial">Free Trial (100% off)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type !== 'free_trial' && (
              <div>
                <Label htmlFor="value">
                  {formData.type === 'percentage' ? 'Discount Percentage *' : 'Discount Amount *'}
                </Label>
                <div className="relative">
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    placeholder={formData.type === 'percentage' ? '20' : '500'}
                    min="0"
                    max={formData.type === 'percentage' ? '100' : undefined}
                    required
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                    {formData.type === 'percentage' ? '%' : '₹'}
                  </span>
                </div>
              </div>
            )}

            {formData.type === 'percentage' && (
              <div>
                <Label htmlFor="maximumDiscountAmount">Maximum Discount Amount</Label>
                <Input
                  id="maximumDiscountAmount"
                  type="number"
                  value={formData.maximumDiscountAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, maximumDiscountAmount: e.target.value }))}
                  placeholder="1000"
                  min="0"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Optional: Cap the maximum discount amount
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="minimumOrderAmount">Minimum Order Amount</Label>
              <Input
                id="minimumOrderAmount"
                type="number"
                value={formData.minimumOrderAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, minimumOrderAmount: parseFloat(e.target.value) || 0 }))}
                placeholder="1000"
                min="0"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Minimum order amount required to use this coupon
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Usage Limits */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usage Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="usageLimit">Total Usage Limit</Label>
              <Input
                id="usageLimit"
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
                placeholder="100"
                min="1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Leave empty for unlimited usage
              </p>
            </div>

            <div>
              <Label htmlFor="usageLimitPerUser">Usage Limit Per User</Label>
              <Input
                id="usageLimitPerUser"
                type="number"
                value={formData.usageLimitPerUser}
                onChange={(e) => setFormData(prev => ({ ...prev, usageLimitPerUser: parseInt(e.target.value) || 1 }))}
                min="1"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                How many times a single user can use this coupon
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="firstTimeUserOnly"
                checked={formData.firstTimeUserOnly}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, firstTimeUserOnly: checked }))}
              />
              <Label htmlFor="firstTimeUserOnly">First-time users only</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="autoApply"
                checked={formData.autoApply}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoApply: checked }))}
              />
              <Label htmlFor="autoApply">Auto-apply coupon</Label>
            </div>
          </CardContent>
        </Card>

        {/* Validity Period */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Validity Period
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="validFrom">Valid From *</Label>
              <Input
                id="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="validUntil">Valid Until *</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applicable Plans */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Applicable Plans</CardTitle>
              <CardDescription className="text-xs">
                Select which plans this coupon can be applied to. Leave empty to apply to all plans.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchPlans}
                disabled={plansLoading}
              >
                <RefreshCw className={`h-3 w-3 ${plansLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await saasAuthService.authenticatedFetch(`${apiConfig.baseUrl}/api/coupons/debug/user`);
                    const data = await response.json();
                    console.log('🔍 Current user:', data);
                    toast({ title: "Debug", description: `User role: ${data.user?.role}` });
                  } catch (error) {
                    console.error('Debug error:', error);
                    toast({ title: "Debug Error", description: error.message, variant: "destructive" });
                  }
                }}
              >
                Debug User
              </Button>
              {formData.code && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await saasAuthService.authenticatedFetch(`${apiConfig.baseUrl}/api/coupons/debug/usage/${formData.code}`);
                      const data = await response.json();
                      console.log('🔍 Coupon usage:', data);
                      toast({ 
                        title: "Coupon Usage", 
                        description: `Used: ${data.coupon?.usedCount}/${data.coupon?.usageLimit || '∞'}` 
                      });
                    } catch (error) {
                      console.error('Debug coupon usage error:', error);
                      toast({ title: "Debug Error", description: error.message, variant: "destructive" });
                    }
                  }}
                >
                  Debug Usage
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-2">
            {plansLoading ? 'Loading plans...' : `${plans.length} plans available`}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {plansLoading ? (
              <div className="col-span-full text-center text-muted-foreground py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                Loading plans...
              </div>
            ) : plans.length > 0 ? plans.map((plan) => (
              <div
                key={plan._id}
                className={`p-2 border rounded cursor-pointer transition-colors ${
                  formData.applicablePlans.includes(plan._id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handlePlanToggle(plan._id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{plan.displayName}</div>
                    <div className="text-sm text-muted-foreground">{plan.name}</div>
                  </div>
                  {formData.applicablePlans.includes(plan._id) && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center text-muted-foreground py-4">
                No plans available. Please check your connection or try refreshing.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Coupon Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-3 rounded">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono font-bold text-lg">{formData.code || 'COUPON_CODE'}</div>
                <div className="text-sm text-muted-foreground">{formData.name || 'Coupon Name'}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">
                  {formData.type === 'percentage' 
                    ? `${formData.value}% OFF`
                    : formData.type === 'fixed'
                    ? `${formatCurrency(formData.value)} OFF`
                    : 'FREE TRIAL'
                  }
                </div>
                {formData.minimumOrderAmount > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Min. order: {formatCurrency(formData.minimumOrderAmount)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Saving...' : coupon ? 'Update Coupon' : 'Create Coupon'}
        </Button>
      </div>
    </form>
  );
}
