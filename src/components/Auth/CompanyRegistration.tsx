import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import PaymentModal from '@/components/Payment/PaymentModal';
import RegistrationSuccess from './RegistrationSuccess';
import { saasService } from '@/services/saasService';
import { apiConfig } from '@/config/razorpay';
import { Plan } from '@/types/plans';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  User, 
  CreditCard,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Users,
  Shield,
  Zap,
  Crown,
  CheckCircle,
  Upload,
  Calendar,
  Clock,
  Settings,
  Palette
} from 'lucide-react';

interface CompanyRegistrationProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}


interface CompanyFormData {
  // Company Info
  name: string;
  domain: string;
  email: string;
  phone: string;

  // Logo
  logoFile?: File;
  logoUrl?: string;
  logoPublicId?: string;

  // Address
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;

  // Admin User
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  adminConfirmPassword: string;

  // Subscription
  plan: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';

  // Settings
  timezone: string;
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  theme: 'default' | 'dark';
}

// Plans will be fetched from backend API

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'IN', label: 'India' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'SG', label: 'Singapore' }
];

const timezones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London, Edinburgh, Dublin' },
  { value: 'Europe/Paris', label: 'Paris, Madrid, Rome' },
  { value: 'Asia/Kolkata', label: 'Mumbai, Delhi, Bangalore' },
  { value: 'Asia/Tokyo', label: 'Tokyo, Osaka' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Australia/Sydney', label: 'Sydney, Melbourne' }
];

export default function CompanyRegistration({ onSuccess, onCancel }: CompanyRegistrationProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [successData, setSuccessData] = useState<{
    companyName: string;
    adminName: string;
    adminEmail: string;
    planName: string;
  } | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    domain: '',
    email: '',
    phone: '',
    logoFile: undefined,
    logoUrl: '',
    logoPublicId: '',
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    adminConfirmPassword: '',
    plan: 'pro',
    billingCycle: 'monthly',
    timezone: 'UTC',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    theme: 'default'
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  // Fetch plans from backend
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.plans}`);
        if (response.ok) {
          const data = await response.json();
          // Show all active plans including free plans
          setPlans(data.data);
          
          // Set default plan to first available plan
          if (data.data.length > 0 && !formData.plan) {
            setFormData(prev => ({ ...prev, plan: data.data[0]._id }));
          }
        } else {
          console.error('Failed to fetch plans');
          toast({
            title: "Error",
            description: "Failed to load subscription plans. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast({
          title: "Error", 
          description: "Failed to load subscription plans. Please try again.",
          variant: "destructive",
        });
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPG, PNG, or WebP image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Upload to Cloudinary
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('logo', file);

      const response = await fetch(`${apiConfig.baseUrl}/api/company/upload-logo`, {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload logo');
      }

      // Update form data with uploaded logo info
      setFormData(prev => ({
        ...prev,
        logoFile: file,
        logoUrl: data.data.url,
        logoPublicId: data.data.publicId,
      }));

      toast({
        title: "Success",
        description: "Logo uploaded successfully!",
      });

    } catch (error) {
      console.error('Logo upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({
      ...prev,
      logoFile: undefined,
      logoUrl: '',
      logoPublicId: '',
    }));

    // Clear the file input
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.domain && formData.email);
      case 2:
        return !!(formData.city && formData.country);
      case 3:
        return !!(formData.adminFirstName && formData.adminLastName && formData.adminEmail && formData.adminPassword && formData.adminPassword === formData.adminConfirmPassword);
      case 4:
        return !!(formData.plan);
      case 5:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive"
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    // Check if selected plan is free or paid
    const selectedPlanData = plans.find(plan => plan._id === formData.plan);
    if (!selectedPlanData) {
      toast({
        title: "Error",
        description: "Please select a plan",
        variant: "destructive",
      });
      return;
    }

    const planPrice = selectedPlanData.price[formData.billingCycle];
    
    if (planPrice === 0) {
      // Free plan - proceed with normal registration
      await handleFreePlanRegistration();
    } else {
      // Paid plan - validate data first, then show payment modal
      await validateDataBeforePayment(selectedPlanData);
    }
  };

  const validateDataBeforePayment = async (selectedPlanData: Plan) => {
    try {
      setIsSubmitting(true);
      
      // First validate the data by creating a payment order
      const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.createPaymentOrder}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlanData._id,
          billingCycle: formData.billingCycle,
          // Company data
          name: formData.name,
          domain: formData.domain,
          email: formData.email,
          phone: formData.phone,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          zipCode: formData.zipCode,
          // Logo data
          logoUrl: formData.logoUrl,
          logoPublicId: formData.logoPublicId,
          // Admin data
          adminFirstName: formData.adminFirstName,
          adminLastName: formData.adminLastName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          adminConfirmPassword: formData.adminConfirmPassword,
          // Settings
          timezone: formData.timezone,
          language: formData.language,
          dateFormat: formData.dateFormat,
          timeFormat: formData.timeFormat,
          theme: formData.theme
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (data.errors && data.errors.length > 0) {
          const errorMessages = data.errors.map((error: any) => error.msg).join(', ');
          toast({
            title: "Validation Failed",
            description: errorMessages,
            variant: "destructive",
          });
          return;
        }
        
        // Handle duplicate data errors with specific messages
        if (data.errorType) {
          toast({
            title: "Data Already Exists",
            description: data.message,
            variant: "destructive",
          });
          return;
        }
        
        throw new Error(data.message || 'Validation failed');
      }

      // If validation passes, show payment modal
      setSelectedPlan(selectedPlanData);
      setShowPaymentModal(true);
      
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Validation failed",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFreePlanRegistration = async () => {
    setIsSubmitting(true);
    try {
      console.log('🚀 Submitting company registration (free plan):', formData);
      
      const response = await fetch(`${apiConfig.baseUrl}/api/company/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          logoUrl: formData.logoUrl,
          logoPublicId: formData.logoPublicId,
        }),
      });

      const data = await response.json();
      console.log('📨 Registration response:', data);

      if (!response.ok) {
        // Handle duplicate data errors with specific messages
        if (data.errorType) {
          toast({
            title: "Data Already Exists",
            description: data.message,
            variant: "destructive",
          });
          return;
        }
        
        throw new Error(data.message || 'Registration failed');
      }

      toast({
        title: "Success! 🎉",
        description: `${formData.name} has been registered successfully. Your trial period starts now!`,
      });
      
      // Show success page instead of redirecting
      const selectedPlanData = plans.find(plan => plan._id === formData.plan);
      setSuccessData({
        companyName: formData.name,
        adminName: `${formData.adminFirstName} ${formData.adminLastName}`,
        adminEmail: formData.adminEmail,
        planName: selectedPlanData?.displayName || 'Free Plan'
      });
      setShowSuccessPage(true);
      
      onSuccess?.();
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      
      let errorMessage = 'Please try again or contact support.';
      if (error.message.includes('already exists')) {
        errorMessage = error.message;
      } else if (error.message.includes('Validation')) {
        errorMessage = 'Please check all fields and try again.';
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = (data: any) => {
    toast({
      title: "Success! 🎉",
      description: `${formData.name} has been registered successfully with payment! You can now login.`,
    });
    
    // Show success page instead of redirecting
    const selectedPlanData = plans.find(plan => plan._id === formData.plan);
    setSuccessData({
      companyName: formData.name,
      adminName: `${formData.adminFirstName} ${formData.adminLastName}`,
      adminEmail: formData.adminEmail,
      planName: selectedPlanData?.displayName || 'Paid Plan'
    });
    setShowSuccessPage(true);
    
    onSuccess?.();
  };

  const handleLoginClick = () => {
    window.location.href = '/';
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNumber = i + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        
        return (
          <div key={stepNumber} className="flex items-center">
            <div className={`
              w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all
              ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                isCurrent ? 'bg-blue-500 border-blue-500 text-white' : 
                'bg-gray-200 border-gray-300 text-gray-500'}
            `}>
              {isCompleted ? <Check className="h-5 w-5" /> : stepNumber}
            </div>
            {stepNumber < totalSteps && (
              <div className={`w-8 h-1 mx-2 rounded ${
                isCompleted ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Building2 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Company Information</h2>
              <p className="text-gray-600 dark:text-gray-400">Tell us about your organization</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company-name" className="text-sm font-medium">Company Name *</Label>
                <Input
                  id="company-name"
                  placeholder="e.g., Acme Corporation"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain" className="text-sm font-medium">Company Domain *</Label>
                <Input
                  id="domain"
                  placeholder="e.g., acme.com"
                  value={formData.domain}
                  onChange={(e) => handleInputChange('domain', e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-email" className="text-sm font-medium">Company Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="company-email"
                    type="email"
                    placeholder="contact@acme.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="h-11 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="phone"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="h-11 pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Logo Upload Section */}
            <div className="space-y-4 mt-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <div className="text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Logo (Optional)</Label>
                <p className="text-xs text-gray-500 mt-1">Upload a logo for your company (Max 5MB, JPG/PNG/WebP)</p>
              </div>

              <div className="flex items-center justify-center">
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e)}
                  className="hidden"
                />
                <Label
                  htmlFor="logo-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Logo
                </Label>
              </div>

              {formData.logoFile && (
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <img
                      src={URL.createObjectURL(formData.logoFile)}
                      alt="Logo preview"
                      className="w-16 h-16 object-cover rounded-lg border mx-auto mb-2"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400">{formData.logoFile.name}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeLogo()}
                      className="mt-2"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Company Address</h2>
              <p className="text-gray-600 dark:text-gray-400">Where is your company located?</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="street" className="text-sm font-medium">Street Address</Label>
                <Input
                  id="street"
                  placeholder="123 Business Street"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">City *</Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">State/Province</Label>
                  <Input
                    id="state"
                    placeholder="NY"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium">Country *</Label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-sm font-medium">ZIP/Postal Code</Label>
                  <Input
                    id="zipCode"
                    placeholder="10001"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <User className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Account</h2>
              <p className="text-gray-600 dark:text-gray-400">Create your administrator account</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="admin-first-name" className="text-sm font-medium">First Name *</Label>
                <Input
                  id="admin-first-name"
                  placeholder="John"
                  value={formData.adminFirstName}
                  onChange={(e) => handleInputChange('adminFirstName', e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-last-name" className="text-sm font-medium">Last Name *</Label>
                <Input
                  id="admin-last-name"
                  placeholder="Doe"
                  value={formData.adminLastName}
                  onChange={(e) => handleInputChange('adminLastName', e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="admin-email" className="text-sm font-medium">Admin Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@acme.com"
                    value={formData.adminEmail}
                    onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                    className="h-11 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-sm font-medium">Password *</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.adminPassword}
                  onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-gray-500">Minimum 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password *</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.adminConfirmPassword}
                  onChange={(e) => handleInputChange('adminConfirmPassword', e.target.value)}
                  className="h-11"
                />
                {formData.adminPassword && formData.adminConfirmPassword && formData.adminPassword !== formData.adminConfirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <CreditCard className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Choose Your Plan</h2>
              <p className="text-gray-600 dark:text-gray-400">Select the perfect plan for your organization</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch(`${apiConfig.baseUrl}/api/company/debug/plan/${formData.plan}`);
                    const data = await response.json();
                    console.log('🔍 Plan debug info:', data);
                    toast({ title: "Plan Debug", description: `Plan: ${data.plan?.name}, Prices: ${JSON.stringify(data.plan?.prices)}` });
                  } catch (error) {
                    console.error('Plan debug error:', error);
                    toast({ title: "Debug Error", description: error.message, variant: "destructive" });
                  }
                }}
                className="mt-2"
              >
                Debug Plan
              </Button>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <RadioGroup 
                  value={formData.billingCycle} 
                  onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => handleInputChange('billingCycle', value)}
                  className="flex"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="cursor-pointer px-3 py-2">Monthly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="quarterly" id="quarterly" />
                    <Label htmlFor="quarterly" className="cursor-pointer px-3 py-2">
                      Quarterly <Badge variant="secondary" className="ml-1">Save 10%</Badge>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yearly" id="yearly" />
                    <Label htmlFor="yearly" className="cursor-pointer px-3 py-2">
                      Yearly <Badge variant="secondary" className="ml-1">Save 20%</Badge>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            {/* Pricing Info */}
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💡 Prices are automatically calculated with discounts for quarterly (10% off) and yearly (20% off) plans
              </p>
            </div>

            {/* Plan Cards */}
            {plansLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Loading plans...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => {
                  const isSelected = formData.plan === plan._id;
                const price = plan.price[formData.billingCycle];
                  
                  // Calculate features list from plan features
                  const features = [];
                  if (plan.features.taskManagement) features.push('Task Management');
                  if (plan.features.leaveManagement) features.push('Leave Management');
                  if (plan.features.meetings) features.push('Meeting Scheduler');
                  if (plan.features.analytics) features.push('Advanced Analytics');
                  if (plan.features.reports) features.push('Custom Reports');
                  if (plan.features.attendance) features.push('Attendance Tracking');
                  if (plan.features.apiAccess) features.push('API Access');
                  if (plan.features.customBranding) features.push('Custom Branding');
                  
                  // Add limits as features
                  const maxUsers = plan.limits.maxUsers === -1 ? 'Unlimited' : plan.limits.maxUsers;
                  const maxDepartments = plan.limits.maxDepartments === -1 ? 'Unlimited' : plan.limits.maxDepartments;
                  
                  features.push(`${maxUsers} users`);
                  features.push(`${maxDepartments} departments`);
                  features.push(`${plan.limits.storageGB}GB storage`);

                return (
                  <Card 
                      key={plan._id} 
                    className={`relative cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' 
                        : 'hover:shadow-lg'
                      }`}
                      onClick={() => handleInputChange('plan', plan._id)}
                    >
                    <CardHeader className="text-center">
                        {/* Popular Badge */}
                        {plan.isPopular && (
                          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 text-xs font-semibold shadow-lg">
                              ⭐ Popular
                            </Badge>
                          </div>
                        )}
                        
                        <div className="w-12 h-12 rounded-lg bg-blue-500 text-white flex items-center justify-center mx-auto mb-4">
                          <CreditCard className="h-6 w-6" />
                      </div>
                        <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                      <CardDescription className="text-sm">{plan.description}</CardDescription>
                      <div className="mt-4">
                          <span className="text-3xl font-bold">
                            {price === 0 ? 'Free' : `₹${price}`}
                          </span>
                          {price > 0 && <span className="text-gray-500">/{formData.billingCycle}</span>}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <ul className="space-y-2">
                          {features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      {isSelected && (
                        <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                            ✓ Selected Plan
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Settings className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">System Preferences</h2>
              <p className="text-gray-600 dark:text-gray-400">Customize your workspace settings</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  Timezone
                </Label>
                <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date Format
                </Label>
                <Select value={formData.dateFormat} onValueChange={(value) => handleInputChange('dateFormat', value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (EU)</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Time Format
                </Label>
                <Select value={formData.timeFormat} onValueChange={(value: '12h' | '24h') => handleInputChange('timeFormat', value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12 Hour (1:30 PM)</SelectItem>
                    <SelectItem value="24h">24 Hour (13:30)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <Palette className="h-4 w-4 mr-2" />
                  Theme
                </Label>
                <Select value={formData.theme} onValueChange={(value: 'default' | 'dark') => handleInputChange('theme', value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Light Theme</SelectItem>
                    <SelectItem value="dark">Dark Theme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Summary */}
            <Card className="mt-8 bg-gray-50 dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-lg">Registration Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Company:</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Admin:</span>
                  <span className="font-medium">{formData.adminFirstName} {formData.adminLastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Plan:</span>
                  <span className="font-medium">
                    {plans.find(p => p._id === formData.plan)?.displayName} - {
                      plans.find(p => p._id === formData.plan)?.price[formData.billingCycle] === 0 
                        ? 'Free' 
                        : `₹${plans.find(p => p._id === formData.plan)?.price[formData.billingCycle]}/${formData.billingCycle}`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Location:</span>
                  <span className="font-medium">{formData.city}, {formData.country}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  // Show success page if registration was successful
  if (showSuccessPage && successData) {
    return (
      <RegistrationSuccess
        companyName={successData.companyName}
        adminName={successData.adminName}
        adminEmail={successData.adminEmail}
        planName={successData.planName}
        onLoginClick={handleLoginClick}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome to NevoStack
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Set up your organization in just a few simple steps
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Form Card */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {renderStep()}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button 
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className="flex items-center bg-blue-600 hover:bg-blue-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={!validateStep(currentStep) || isSubmitting}
                  className="flex items-center bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Create Company
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Cancel */}
            {onCancel && (
              <div className="text-center mt-4">
                <Button variant="ghost" onClick={onCancel} className="text-gray-500">
                  Cancel Registration
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Need help? Contact us at <a href="mailto:support@nevostack.com" className="text-blue-600 hover:underline">support@nevostack.com</a></p>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          plan={{
            id: selectedPlan._id,
            name: selectedPlan.displayName,
            description: selectedPlan.description,
            amount: selectedPlan.price[formData.billingCycle],
            billingCycle: formData.billingCycle,
            isPopular: selectedPlan.isPopular
          }}
          companyData={{
            ...formData,
            logoUrl: formData.logoUrl,
            logoPublicId: formData.logoPublicId,
          }}
        />
      )}
    </div>
  );
}