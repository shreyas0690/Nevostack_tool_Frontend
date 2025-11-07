import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, 
  Users, 
  Tag, 
  DollarSign, 
  Calendar,
  Award,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiConfig } from '@/config/razorpay';
import { saasAuthService } from '@/services/saasAuthService';

interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  totalUsage: number;
  topUsedCoupons: Array<{
    _id: string;
    code: string;
    name: string;
    usedCount: number;
    type: string;
    value: number;
  }>;
  recentUsage: Array<{
    code: string;
    name: string;
    usageHistory: {
      discountAmount: number;
      usedAt: string;
    };
    user: Array<{
      firstName: string;
      lastName: string;
    }>;
    company: Array<{
      name: string;
    }>;
  }>;
}

export default function CouponStats() {
  const { toast } = useToast();
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await saasAuthService.authenticatedFetch(`${apiConfig.baseUrl}/api/coupons/stats`);

      if (!response.ok) {
        throw new Error('Failed to fetch coupon statistics');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching coupon stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch coupon statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Badge variant="secondary">Percentage</Badge>;
      case 'fixed':
        return <Badge variant="outline">Fixed Amount</Badge>;
      case 'free_trial':
        return <Badge variant="default">Free Trial</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            No statistics available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCoupons}</div>
            <p className="text-xs text-muted-foreground">
              All time created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeCoupons}</div>
            <p className="text-xs text-muted-foreground">
              Currently valid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              Times used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Coupons</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expiredCoupons}</div>
            <p className="text-xs text-muted-foreground">
              Past validity
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Used Coupons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Used Coupons
            </CardTitle>
            <CardDescription>
              Most popular coupons by usage count
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topUsedCoupons.length > 0 ? (
              <div className="space-y-3">
                {stats.topUsedCoupons.map((coupon, index) => (
                  <div key={coupon._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary font-bold rounded-full">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-mono font-medium">{coupon.code}</div>
                        <div className="text-sm text-muted-foreground">{coupon.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{coupon.usedCount} uses</div>
                      <div className="text-sm text-muted-foreground">
                        {coupon.type === 'percentage' 
                          ? `${coupon.value}% off`
                          : coupon.type === 'fixed'
                          ? `${formatCurrency(coupon.value)} off`
                          : 'Free trial'
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No usage data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Usage
            </CardTitle>
            <CardDescription>
              Latest coupon applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentUsage.length > 0 ? (
              <div className="space-y-3">
                {stats.recentUsage.map((usage, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-mono font-medium">{usage.code}</div>
                      <div className="text-sm text-muted-foreground">{usage.name}</div>
                      {usage.user.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {usage.user[0].firstName} {usage.user[0].lastName}
                          {usage.company.length > 0 && ` • ${usage.company[0].name}`}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        -{formatCurrency(usage.usageHistory.discountAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(usage.usageHistory.usedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No recent usage data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Usage Analytics
          </CardTitle>
          <CardDescription>
            Coupon performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {stats.totalUsage > 0 ? Math.round((stats.activeCoupons / stats.totalCoupons) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Active Rate</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.totalCoupons > 0 ? Math.round((stats.totalUsage / stats.totalCoupons) * 10) / 10 : 0}
              </div>
              <div className="text-sm text-muted-foreground">Avg Usage per Coupon</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalCoupons > 0 ? Math.round((stats.expiredCoupons / stats.totalCoupons) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Expiration Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
