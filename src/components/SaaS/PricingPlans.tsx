import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import { SubscriptionPlan } from '@/types/saas';

interface PricingPlansProps {
  plans: SubscriptionPlan[];
  selectedPlan: string;
  onPlanSelect: (planId: string) => void;
  onContinue: () => void;
  isLoading?: boolean;
}

export default function PricingPlans({ 
  plans, 
  selectedPlan, 
  onPlanSelect, 
  onContinue, 
  isLoading = false 
}: PricingPlansProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const getPlanPrice = (plan: SubscriptionPlan) => {
    if (billingCycle === 'yearly') {
      return Math.round(plan.price * 10); // 2 months free for yearly
    }
    return plan.price;
  };

  const getBillingText = (plan: SubscriptionPlan) => {
    if (billingCycle === 'yearly') {
      return `$${getPlanPrice(plan)}/year (Save 17%)`;
    }
    return `$${plan.price}/month`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Select the perfect plan for your organization
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative"
            >
              <div className={`w-4 h-4 bg-primary rounded-full transition-transform duration-200 ${
                billingCycle === 'yearly' ? 'translate-x-2' : '-translate-x-2'
              }`} />
            </Button>
            <span className={`text-sm ${billingCycle === 'yearly' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              Yearly
              <Badge variant="secondary" className="ml-2 text-xs">
                Save 17%
              </Badge>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedPlan === plan.id 
                  ? 'ring-2 ring-primary shadow-lg scale-105' 
                  : 'hover:scale-102'
              } ${plan.isPopular ? 'border-primary' : ''}`}
              onClick={() => onPlanSelect(plan.id)}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-lg">
                  {plan.isCustom ? 'Custom pricing' : getBillingText(plan)}
                </CardDescription>
                {plan.isCustom && (
                  <p className="text-sm text-muted-foreground">Contact us for custom pricing</p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-center">
                  <span className="text-3xl font-bold">
                    {plan.isCustom ? 'Custom' : `$${getPlanPrice(plan)}`}
                  </span>
                  {!plan.isCustom && (
                    <span className="text-muted-foreground">
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  )}
                </div>
                
                <div className="text-center text-sm text-muted-foreground">
                  Up to {plan.maxUsers} users
                </div>
                
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className={`w-full mt-6 ${
                    selectedPlan === plan.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                  variant={selectedPlan === plan.id ? 'default' : 'secondary'}
                >
                  {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            onClick={onContinue} 
            disabled={!selectedPlan || isLoading}
            size="lg"
            className="px-8"
          >
            {isLoading ? 'Processing...' : 'Continue with Selected Plan'}
          </Button>
          
          <p className="text-sm text-muted-foreground mt-4">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
        </div>

        {/* Features Comparison */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">All Plans Include</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">14-Day Free Trial</h3>
              <p className="text-sm text-muted-foreground">
                Try all features risk-free for 14 days
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">No Setup Fees</h3>
              <p className="text-sm text-muted-foreground">
                Get started immediately with zero setup costs
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Cancel Anytime</h3>
              <p className="text-sm text-muted-foreground">
                No long-term contracts, cancel whenever you want
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">24/7 Support</h3>
              <p className="text-sm text-muted-foreground">
                Get help whenever you need it
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}












