import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  Tag,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiConfig } from '@/config/razorpay';
import { saasAuthService } from '@/services/saasAuthService';
import CouponForm from './CouponForm';
import CouponStats from './CouponStats';

interface Coupon {
  _id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_trial';
  value: number;
  currency: string;
  usageLimit: number | null;
  usedCount: number;
  usageLimitPerUser: number;
  validFrom: string;
  validUntil: string;
  applicablePlans: Array<{
    _id: string;
    displayName: string;
  }>;
  minimumOrderAmount: number;
  maximumDiscountAmount: number | null;
  isActive: boolean;
  firstTimeUserOnly: boolean;
  autoApply: boolean;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function CouponManagement() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter })
      });

      const response = await saasAuthService.authenticatedFetch(`${apiConfig.baseUrl}/api/coupons?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch coupons');
      }

      const data = await response.json();
      setCoupons(data.data.coupons);
      setTotalPages(data.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: "Error",
        description: "Failed to fetch coupons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [currentPage, statusFilter, typeFilter]);

  const handleToggleStatus = async (couponId: string, currentStatus: boolean) => {
    try {
      const response = await saasAuthService.authenticatedFetch(`${apiConfig.baseUrl}/api/coupons/${couponId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle coupon status');
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: data.message,
      });

      fetchCoupons();
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      toast({
        title: "Error",
        description: "Failed to toggle coupon status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) {
      return;
    }

    try {
      const response = await saasAuthService.authenticatedFetch(`${apiConfig.baseUrl}/api/coupons/${couponId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete coupon');
      }

      toast({
        title: "Success",
        description: "Coupon deleted successfully",
      });

      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete coupon",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (!coupon.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    if (now < validFrom) {
      return <Badge variant="outline">Upcoming</Badge>;
    }

    if (now > validUntil) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return <Badge variant="destructive">Limit Reached</Badge>;
    }

    return <Badge variant="default">Active</Badge>;
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
      day: 'numeric'
    });
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Coupon Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Create and manage discount coupons for your customers
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Create Coupon</span>
              <span className="sm:hidden">Create</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
              <DialogDescription>
                Create a new discount coupon for your customers
              </DialogDescription>
            </DialogHeader>
            <CouponForm
              onSuccess={() => {
                setShowCreateDialog(false);
                fetchCoupons();
              }}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="coupons" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="coupons" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Coupons</span>
            <span className="sm:hidden">Coupons</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Statistics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coupons" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search coupons..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="free_trial">Free Trial</SelectItem>
                  </SelectContent>
                </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coupons Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Tag className="h-4 w-4 sm:h-5 sm:w-5" />
                Coupons ({filteredCoupons.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {filteredCoupons.map((coupon) => (
                      <Card key={coupon._id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {coupon.name}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {coupon.code}
                            </div>
                            {coupon.description && (
                              <div className="text-xs text-gray-500 mt-1">
                                {coupon.description}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(coupon)}
                            {getTypeBadge(coupon.type)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-gray-500">Value</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {coupon.type === 'percentage' ? (
                                `${coupon.value}%`
                              ) : coupon.type === 'fixed' ? (
                                formatCurrency(coupon.value)
                              ) : (
                                'Free'
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Usage</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {coupon.usedCount} used
                              {coupon.usageLimit && ` of ${coupon.usageLimit}`}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="text-xs text-gray-500">Valid Until</div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {formatDate(coupon.validUntil)}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCoupon(coupon)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(coupon._id, coupon.isActive)}
                            className="h-8 w-8 p-0"
                          >
                            {coupon.isActive ? (
                              <ToggleRight className="h-6 w-6 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-6 w-6 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCoupon(coupon._id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Code</TableHead>
                        <TableHead className="text-xs sm:text-sm">Name</TableHead>
                        <TableHead className="text-xs sm:text-sm">Type</TableHead>
                        <TableHead className="text-xs sm:text-sm">Value</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden md:table-cell">Usage</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Valid Until</TableHead>
                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                        <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCoupons.map((coupon) => (
                        <TableRow key={coupon._id}>
                          <TableCell className="font-mono font-medium text-xs sm:text-sm">
                            {coupon.code}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-xs sm:text-sm">{coupon.name}</div>
                              {coupon.description && (
                                <div className="text-xs text-muted-foreground">
                                  {coupon.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(coupon.type)}</TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {coupon.type === 'percentage' ? (
                              `${coupon.value}%`
                            ) : coupon.type === 'fixed' ? (
                              formatCurrency(coupon.value)
                            ) : (
                              'Free'
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="text-xs sm:text-sm">
                              <div>{coupon.usedCount} used</div>
                              {coupon.usageLimit && (
                                <div className="text-muted-foreground">
                                  of {coupon.usageLimit}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs sm:text-sm">{formatDate(coupon.validUntil)}</TableCell>
                          <TableCell>{getStatusBadge(coupon)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingCoupon(coupon)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleStatus(coupon._id, coupon.isActive)}
                                className="h-8 w-8 p-0"
                              >
                                {coupon.isActive ? (
                                  <ToggleRight className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                                ) : (
                                  <ToggleLeft className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCoupon(coupon._id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                </>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="text-xs sm:text-sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <CouponStats />
        </TabsContent>
      </Tabs>

      {/* Edit Coupon Dialog */}
      {editingCoupon && (
        <Dialog open={!!editingCoupon} onOpenChange={() => setEditingCoupon(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Coupon</DialogTitle>
              <DialogDescription>
                Update the coupon details
              </DialogDescription>
            </DialogHeader>
            <CouponForm
              coupon={editingCoupon ? {
                ...editingCoupon,
                applicablePlans: editingCoupon.applicablePlans.map(plan => plan._id)
              } as any : undefined}
              onSuccess={() => {
                setEditingCoupon(null);
                fetchCoupons();
              }}
              onCancel={() => setEditingCoupon(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


