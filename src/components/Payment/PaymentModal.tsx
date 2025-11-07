import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Loader2, CheckCircle, XCircle, AlertCircle, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { razorpayConfig, apiConfig } from '@/config/razorpay';

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  plan: {
    id: string;
    name: string;
    description: string;
    amount: number;
    billingCycle: string;
    isPopular?: boolean;
  };
  companyData: any;
}

export default function PaymentModal({ isOpen, onClose, onSuccess, plan, companyData }: PaymentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [originalAmount, setOriginalAmount] = useState(plan.amount);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(plan.amount);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      setRazorpayLoaded(true);
    };
    script.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to load payment gateway",
        variant: "destructive",
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Update amounts when plan changes
  useEffect(() => {
    console.log('🔄 Plan changed, updating amounts:', {
      planId: plan.id,
      planAmount: plan.amount,
      billingCycle: plan.billingCycle
    });
    
    setOriginalAmount(plan.amount);
    
    // If there's an applied coupon, recalculate discount
    if (appliedCoupon) {
      const newDiscountAmount = appliedCoupon.discountAmount || 0;
      const newFinalAmount = plan.amount - newDiscountAmount;
      
      console.log('🔄 Recalculating with applied coupon:', {
        originalAmount: plan.amount,
        discountAmount: newDiscountAmount,
        finalAmount: newFinalAmount
      });
      
      setDiscountAmount(newDiscountAmount);
      setFinalAmount(newFinalAmount);
    } else {
      // No coupon applied, use original amount
      setDiscountAmount(0);
      setFinalAmount(plan.amount);
    }
  }, [plan.id, plan.amount, plan.billingCycle, appliedCoupon]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive",
      });
      return;
    }

    setCouponLoading(true);
    try {
      const response = await fetch(`${apiConfig.baseUrl}/api/coupons/validate/${couponCode}?amount=${plan.amount}&planId=${plan.id}`);
      const data = await response.json();

      if (data.success) {
        setAppliedCoupon(data.data.coupon);
        setDiscountAmount(data.data.coupon.discountAmount);
        setFinalAmount(plan.amount - data.data.coupon.discountAmount);
        
        toast({
          title: "Coupon Applied! 🎉",
          description: `${data.data.coupon.name} - ${data.data.coupon.discountAmount > 0 ? `₹${data.data.coupon.discountAmount} off` : 'Applied'}`,
        });
      } else {
        toast({
          title: "Invalid Coupon",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate coupon",
        variant: "destructive",
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setDiscountAmount(0);
    setFinalAmount(plan.amount);
  };

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      toast({
        title: "Error",
        description: "Payment gateway not loaded yet",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');

    try {
      // Create payment order with full validation
      const requestData: any = {
        planId: plan.id,
        billingCycle: plan.billingCycle,
        // Company data
        name: companyData.name,
        domain: companyData.domain,
        email: companyData.email,
        phone: companyData.phone,
        street: companyData.street,
        city: companyData.city,
        state: companyData.state,
        country: companyData.country,
        zipCode: companyData.zipCode,
        // Admin data
        adminFirstName: companyData.adminFirstName,
        adminLastName: companyData.adminLastName,
        adminEmail: companyData.adminEmail,
        adminPassword: companyData.adminPassword,
        adminConfirmPassword: companyData.adminConfirmPassword,
        // Settings
        timezone: companyData.timezone,
        language: companyData.language,
        dateFormat: companyData.dateFormat,
        timeFormat: companyData.timeFormat,
        theme: companyData.theme
      };

      // Only add couponCode if there's an applied coupon
      if (appliedCoupon?.code) {
        requestData.couponCode = appliedCoupon.code;
      }

      console.log('💳 Creating payment order with data:', {
        planId: requestData.planId,
        billingCycle: requestData.billingCycle,
        couponCode: requestData.couponCode,
        hasAppliedCoupon: !!appliedCoupon
      });

      const orderResponse = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.createPaymentOrder}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        console.error('Order creation failed:', orderData);
        
        // Handle validation errors
        if (orderData.errors && orderData.errors.length > 0) {
          const errorMessages = orderData.errors.map((error: any) => error.msg).join(', ');
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        
        // Handle duplicate data errors
        if (orderData.errorType) {
          throw new Error(orderData.message || 'Data already exists');
        }
        
        // Handle coupon-specific errors
        if (orderData.message && orderData.message.includes('coupon')) {
          throw new Error(orderData.message);
        }
        
        throw new Error(orderData.message || 'Failed to create payment order');
      }

      // Handle free plans
      if (orderData.data.isFreePlan) {
        console.log('✅ Free plan detected, proceeding with registration');
        setPaymentStatus('success');
        toast({
          title: "Success",
          description: "Free plan registration successful!",
        });
        
        setTimeout(() => {
          onSuccess(orderData.data);
          onClose();
        }, 2000);
        return;
      }

      // Configure Razorpay options
      const options = {
        key: razorpayConfig.key_id,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: razorpayConfig.company_name,
        description: `${plan.name} - ${plan.billingCycle}`,
        order_id: orderData.data.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment and complete registration
            const verifyResponse = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.verifyPayment}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planId: plan.id,
                billingCycle: plan.billingCycle,
                couponCode: appliedCoupon?.code || null,
                ...companyData
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              setPaymentStatus('success');
              toast({
                title: "Success",
                description: "Payment successful! Company registered successfully.",
              });
              
              setTimeout(() => {
                onSuccess(verifyData.data);
                onClose();
              }, 2000);
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            setPaymentStatus('failed');
            
            // Show more specific error message
            const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
            toast({
              title: "Payment Failed",
              description: errorMessage,
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: companyData.adminFirstName + ' ' + companyData.adminLastName,
          email: companyData.adminEmail,
          contact: companyData.phone || ''
        },
        theme: razorpayConfig.theme,
        modal: {
          ondismiss: function() {
            setLoading(false);
            setPaymentStatus('idle');
          }
        }
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Payment failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'processing':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <CreditCard className="h-6 w-6 text-blue-500" />;
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'processing':
        return 'Processing Payment...';
      case 'success':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      default:
        return 'Complete Payment';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-hidden flex flex-col sm:w-full">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            {getStatusIcon()}
            <span className="truncate">{getStatusText()}</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {paymentStatus === 'idle' && 'Complete your payment to register your company'}
            {paymentStatus === 'processing' && 'Please wait while we process your payment'}
            {paymentStatus === 'success' && 'Your company has been registered successfully!'}
            {paymentStatus === 'failed' && 'Payment failed. Please try again or contact support.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          {/* Plan Summary */}
          <Card className="relative">
            <CardHeader className="pb-3">
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-2 right-4">
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 text-xs font-semibold shadow-lg">
                    ⭐ Popular
                  </Badge>
                </div>
              )}
              
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">Billing Cycle:</span>
                <Badge variant="secondary" className="capitalize text-xs">
                  {plan.billingCycle}
                </Badge>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs sm:text-sm text-gray-600">Amount:</span>
                <span className="text-base sm:text-lg font-bold">{formatCurrency(finalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Company Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Validated Company Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">Company:</span>
                <span className="text-xs sm:text-sm font-medium text-right ml-2">{companyData.name}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">Domain:</span>
                <span className="text-xs sm:text-sm font-medium text-right ml-2">{companyData.domain}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">Admin:</span>
                <span className="text-xs sm:text-sm font-medium text-right ml-2">
                  {companyData.adminFirstName} {companyData.adminLastName}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">Email:</span>
                <span className="text-xs sm:text-sm font-medium text-right ml-2 break-all">{companyData.adminEmail}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">Location:</span>
                <span className="text-xs sm:text-sm font-medium text-right ml-2">{companyData.city}, {companyData.country}</span>
              </div>
            </CardContent>
          </Card>

          {/* Coupon Section */}
          {paymentStatus === 'idle' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Coupon Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!appliedCoupon ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 text-sm"
                    />
                    <Button
                      onClick={validateCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">{appliedCoupon.name}</p>
                        <p className="text-xs text-green-600">Code: {appliedCoupon.code}</p>
                      </div>
                    </div>
                    <Button
                      onClick={removeCoupon}
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:text-green-700"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Summary */}
          {paymentStatus === 'idle' && (appliedCoupon || discountAmount > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600">Original Amount:</span>
                  <span className="text-xs sm:text-sm">{formatCurrency(plan.amount)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-xs sm:text-sm">Discount:</span>
                    <span className="text-xs sm:text-sm">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-xs sm:text-sm font-medium">Final Amount:</span>
                  <span className="text-base sm:text-lg font-bold">{formatCurrency(finalAmount)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Notice */}
          <div className="text-xs text-gray-500 text-center">
            🔒 Your payment is secured by Razorpay. We never store your card details.
          </div>
        </div>

        {/* Fixed Footer for Payment Button */}
        <div className="flex-shrink-0 border-t pt-4 mt-4">
          {/* Payment Button */}
          {paymentStatus === 'idle' && (
            <Button 
              onClick={handlePayment} 
              disabled={loading || !razorpayLoaded}
              className="w-full text-sm sm:text-base"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Processing...</span>
                  <span className="sm:hidden">Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Pay {formatCurrency(finalAmount)}</span>
                  <span className="sm:hidden">Pay {formatCurrency(finalAmount)}</span>
                </>
              )}
            </Button>
          )}

          {paymentStatus === 'failed' && (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Payment Failed</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  Your payment could not be processed. Please try again or contact support.
                </p>
              </div>
              <Button 
                onClick={handlePayment} 
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Registration Complete!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Your company has been registered successfully. You will be redirected to the login page.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
