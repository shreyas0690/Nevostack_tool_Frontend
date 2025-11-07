import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Building2, Mail, Phone, MapPin, Users, Globe, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Tenant, SubscriptionPlan } from '@/types/saas';
import { workspaceService } from '@/services/workspaceService';
import { apiService } from '@/services/apiService';
import { API_CONFIG } from '@/config/api';
import PricingPlans from './PricingPlans';

interface SaaSCompanyRegistrationProps {
  onRegistrationComplete: (tenant: Tenant) => void;
  onGoToLogin: () => void;
  availablePlans: SubscriptionPlan[];
  saasConfig: any;
}

export default function SaaSCompanyRegistration({ 
  onRegistrationComplete, 
  onGoToLogin, 
  availablePlans,
  saasConfig 
}: SaaSCompanyRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [subdomain, setSubdomain] = useState('');
  const [subdomainError, setSubdomainError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const { toast } = useToast();

  // Password validation function
  const validatePassword = (password: string) => {
    if (!password) return '';

    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!minLength) return 'Password must be at least 8 characters long';
    if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
    if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
    if (!hasNumbers) return 'Password must contain at least one number';

    return '';
  };

  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    industry: '',
    employeeCount: '',
    description: '',
    adminUsername: '',
    adminPassword: '',
    adminEmail: '',
    adminName: ''
  });

  const handleInputChange = (field: keyof typeof companyData, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear email error when user types
    if (field === 'email' || field === 'adminEmail') {
      setEmailError('');
      setEmailSuccess(false);

      // Debounced email validation
      setTimeout(() => {
        if (value) {
          validateEmail(value);
        }
      }, 500);
    }

    // Validate password when user types
    if (field === 'adminPassword') {
      const passwordValidationError = validatePassword(value);
      setPasswordError(passwordValidationError);
    }

    // Note: subdomain is handled separately in handleSubdomainChange
  };

  const resetForm = () => {
    setCompanyData({
      name: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      industry: '',
      employeeCount: '',
      description: '',
      adminName: '',
      adminEmail: '',
      adminUsername: '',
      adminPassword: ''
    });
    setSubdomain('');
    setSubdomainError('');
    setEmailError('');
    setEmailSuccess(false);
    setSelectedPlan('starter');
    setCurrentStep(1);
    
    // Clear any existing error states
    setEmailError('');
    setSubdomainError('');
    setPasswordError('');
  };

  const validateSubdomain = async (value: string) => {
    if (!value) {
      setSubdomainError('Subdomain is required');
      return false;
    }
    if (value.length < 3) {
      setSubdomainError('Subdomain must be at least 3 characters');
      return false;
    }
    if (value.length > saasConfig.maxSubdomainLength) {
      setSubdomainError(`Subdomain must be less than ${saasConfig.maxSubdomainLength} characters`);
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(value)) {
      setSubdomainError('Subdomain can only contain lowercase letters, numbers, and hyphens');
      return false;
    }
    if (value.startsWith('-') || value.endsWith('-')) {
      setSubdomainError('Subdomain cannot start or end with a hyphen');
      return false;
    }
    
    // Check reserved subdomains
    const reservedSubdomains = ['www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog'];
    if (reservedSubdomains.includes(value)) {
      setSubdomainError('This subdomain is reserved and cannot be used');
      return false;
    }
    
    // Check availability with backend
    setIsCheckingSubdomain(true);
    try {
      const availability = await workspaceService.checkSubdomainAvailability(value);
      if (!availability.available) {
        setSubdomainError(availability.message);
        return false;
      }
    } catch (error) {
      console.error('Error checking subdomain availability:', error);
      // Don't block registration for subdomain validation errors
      setSubdomainError('');
      console.warn('Subdomain validation failed, but continuing with registration');
    } finally {
      setIsCheckingSubdomain(false);
    }
    
    setSubdomainError('');
    return true;
  };

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('Email is required');
      setEmailSuccess(false);
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      setEmailSuccess(false);
      return false;
    }
    
    // Check email length
    if (email.length > 254) {
      setEmailError('Email address is too long. Maximum 254 characters allowed.');
      setEmailSuccess(false);
      return false;
    }
    
    // Check local part length
    const localPart = email.split('@')[0];
    if (localPart.length > 64) {
      setEmailError('Email username part is too long. Maximum 64 characters allowed.');
      setEmailSuccess(false);
      return false;
    }
    
    // Check for common email providers
    const domain = email.split('@')[1];
    const commonProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
    if (commonProviders.includes(domain)) {
      setEmailError('');
      setEmailSuccess(true);
      return true;
    }
    
    // Check for custom domain
    if (domain && domain.includes('.')) {
      setEmailError('');
      setEmailSuccess(true);
      return true;
    }
    
    // Check for valid TLD
    const tld = domain.split('.').pop();
    const validTlds = ['com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'co', 'io', 'ai', 'app', 'dev'];
    if (tld && validTlds.includes(tld)) {
      setEmailError('');
      setEmailSuccess(true);
      return true;
    }
    
    setEmailError('Please enter a valid email address with a recognized domain');
    setEmailSuccess(false);
    return false;
  };

  const handleSubdomainChange = (value: string) => {
    setSubdomain(value.toLowerCase());
    setSubdomainError(''); // Clear error when typing
    
    // Debounce the validation
    setTimeout(() => validateSubdomain(value.toLowerCase()), 500);
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Validate step 1 fields
      if (!companyData.name || !companyData.email || !companyData.phone) {
        toast({
          title: "Error",
          description: "Please fill in all required company fields",
          variant: "destructive"
        });
        return;
      }

      // Validate company email
      if (!validateEmail(companyData.email)) {
        return;
      }

      // Validate subdomain
      if (!subdomain) {
        setSubdomainError('Subdomain is required');
        return;
      }

      const isSubdomainValid = await validateSubdomain(subdomain);
      if (!isSubdomainValid) {
        return;
      }

      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate step 2 fields
      if (!companyData.adminUsername || !companyData.adminPassword || !companyData.adminEmail || !companyData.adminName) {
        toast({
          title: "Error",
          description: "Please fill in all required admin fields",
          variant: "destructive"
        });
        return;
      }

      // Validate admin email
      if (!validateEmail(companyData.adminEmail)) {
        return;
      }

      // Validate password strength
      const passwordValidationError = validatePassword(companyData.adminPassword);
      if (passwordValidationError) {
        toast({
          title: "Password Error",
          description: passwordValidationError,
          variant: "destructive"
        });
        return;
      }

      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate emails before submission
      if (!validateEmail(companyData.email) || !validateEmail(companyData.adminEmail)) {
        toast({
          title: "Error",
          description: "Please fix email validation errors before submitting",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Prepare registration data
      console.log('Preparing registration data...');
      const registrationData = {
        companyName: companyData.name,
        companyEmail: companyData.email,
        companyPhone: companyData.phone,
        domain: `${subdomain}.nevostack.com`,
        address: companyData.address ? {
          street: companyData.address,
          city: '',
          state: '',
          country: '',
          zipCode: ''
        } : undefined,
        industry: companyData.industry,
        employeeCount: companyData.employeeCount,
        adminName: companyData.adminName,  // Send adminName as single field
        adminEmail: companyData.adminEmail,
        adminUsername: companyData.adminUsername,
        adminPassword: companyData.adminPassword
      };

      // Call the company registration API
      console.log('Sending registration data:', registrationData);
      const response = await apiService.post<any>(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER_COMPANY,
        registrationData
      );

      if (response.success && response.data) {
        console.log('Registration response:', response);
        // Clear any existing errors on success
        setEmailError('');
        setSubdomainError('');
        setEmailSuccess(true);
        
        // Create tenant object from response
        console.log('Creating tenant object from response...');
        const tenant: Tenant = {
          id: response.data.company?.id || '',
          companyName: response.data.company?.name || companyData.name,
          subdomain: subdomain,
          domain: response.data.workspace?.domain || `${subdomain}.nevostack.com`,
          email: response.data.company?.email || companyData.email,
          phone: response.data.company?.phone || companyData.phone,
          address: companyData.address,
          website: companyData.website,
          industry: companyData.industry,
          employeeCount: companyData.employeeCount,
          description: companyData.description,
          status: 'active',
          subscriptionPlan: availablePlans.find(p => p.id === selectedPlan) || availablePlans[0],
          subscriptionStatus: 'trial',
          trialEndsAt: response.workspace?.trialEndsAt ? new Date(response.workspace.trialEndsAt) : undefined,
          maxUsers: response.workspace?.limits?.maxUsers || 10,
          currentUsers: 1, // Admin user
          features: availablePlans.find(p => p.id === selectedPlan)?.features || [],
          createdAt: new Date(),
          updatedAt: new Date(),
          adminUser: {
            id: response.data.admin?.id || '',
            name: (response.data.admin?.firstName && response.data.admin?.lastName) 
              ? `${response.data.admin.firstName} ${response.data.admin.lastName}` 
              : companyData.adminName,
            email: response.data.admin?.email || companyData.adminEmail,
            username: response.data.admin?.username || companyData.adminUsername
          }
                };

          // Store tenant info only (workspace should be in database)
          console.log('Storing tenant info...');
          localStorage.setItem('nevostack_tenant', JSON.stringify(tenant));
          
          // Check if workspace was created in database
          if (response.data.workspace?.id) {
            localStorage.setItem('nevostack_workspace_id', response.data.workspace.id);
            console.log('✅ Workspace created successfully in database:', response.data.workspace);
          } else {
            console.error('❌ Workspace creation failed in database!');
            toast({
              title: "Warning",
              description: "Company created but workspace creation failed. Please contact support.",
              variant: "destructive"
            });
          }

          toast({
            title: "Success",
            description: "Company registered successfully! You can now login with your admin credentials.",
          });
          
          // Reset form after successful registration
          resetForm();

          // Call the completion callback
          onRegistrationComplete(tenant);
        } else {
          console.error('Registration failed response:', response);
          throw new Error(response.message || 'Registration failed');
        }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific error messages from backend
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message) {
        if (error.message.includes('email already exists')) {
          errorMessage = 'A company with this email already exists. Please use a different email address.';
          setEmailError('This email is already registered');
          setEmailSuccess(false);
        } else if (error.message.includes('domain already exists')) {
          const suggestedSubdomain = `${subdomain}${Math.floor(Math.random() * 100)}`;
          errorMessage = `A company with this domain already exists. Try subdomain: "${suggestedSubdomain}"`;
          setSubdomainError('This subdomain is already taken.');

          // Show toast with suggested alternative
          toast({
            title: "Domain Already Exists",
            description: `Try using "${suggestedSubdomain}" instead`,
            variant: "default",
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSubdomain(suggestedSubdomain);
                  setSubdomainError('');
                }}
              >
                Use Suggestion
              </Button>
            ),
          });

          console.error('Domain already exists error:', error.message);
        } else if (error.message.includes('username already exists')) {
          errorMessage = 'This username is already taken. Please choose a different username.';
        } else if (error.message.includes('Invalid password')) {
          errorMessage = 'Password does not meet requirements. Please use a stronger password.';
        } else if (error.message.includes('Network error')) {
          errorMessage = 'Network connection issue. Please check your internet connection and try again.';
          console.error('Network error:', error.message);
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to server. Please try again in a few moments.';
          console.error('Fetch error:', error.message);
        } else {
          errorMessage = error.message;
          console.error('General error:', error.message);
        }
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
        action: (
          <button
            onClick={resetForm}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
          >
            Try Different Details
          </button>
        )
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Company Information";
      case 2: return "Admin Account";
      case 3: return "Choose Plan";
      default: return "";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return "Enter your company details to get started";
      case 2: return "Create your admin account for managing the workspace";
      case 3: return "Select a plan that fits your needs";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Workspace
          </h1>
          <p className="text-lg text-gray-600">
            Set up your company workspace in minutes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  {getStepTitle()}
                </CardTitle>
                <CardDescription>
                  {getStepDescription()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Step 1: Company Information */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="companyName">Company Name *</Label>
                          <Input
                            id="companyName"
                            value={companyData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Enter company name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="companyEmail">Company Email *</Label>
                          <Input
                            id="companyEmail"
                            type="email"
                            value={companyData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            onBlur={(e) => validateEmail(e.target.value)}
                            onFocus={() => setEmailError('')}
                            placeholder="company@example.com"
                            className={emailError ? 'border-red-500' : emailSuccess ? 'border-green-500' : ''}
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Use a unique email that hasn't been registered before
                          </p>
                          {emailError && (
                            <p className="text-sm text-red-600 mt-1">{emailError}</p>
                          )}
                          {emailSuccess && !emailError && (
                            <p className="text-sm text-green-600 mt-1 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Email format is valid and available
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="companyPhone">Phone Number *</Label>
                          <Input
                            id="companyPhone"
                            value={companyData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="subdomain">Subdomain *</Label>
                          <div className="relative">
                            <Input
                              id="subdomain"
                              value={subdomain}
                              onChange={(e) => handleSubdomainChange(e.target.value)}
                              placeholder="yourcompany"
                              className={subdomainError ? 'border-red-500' : ''}
                              required
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500">
                              .nevostack.com
                            </div>
                          </div>
                          {subdomainError && (
                            <p className="text-sm text-red-600 mt-1">{subdomainError}</p>
                          )}
                          {isCheckingSubdomain && (
                            <p className="text-sm text-blue-600 mt-1">Checking availability...</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="companyAddress">Address</Label>
                        <Input
                          id="companyAddress"
                          value={companyData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Enter company address"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="industry">Industry</Label>
                          <Input
                            id="industry"
                            value={companyData.industry}
                            onChange={(e) => handleInputChange('industry', e.target.value)}
                            placeholder="e.g., Technology, Healthcare"
                          />
                        </div>
                        <div>
                          <Label htmlFor="employeeCount">Employee Count</Label>
                          <Select value={companyData.employeeCount} onValueChange={(value) => handleInputChange('employeeCount', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-10">1-10 employees</SelectItem>
                              <SelectItem value="11-50">11-50 employees</SelectItem>
                              <SelectItem value="51-200">51-200 employees</SelectItem>
                              <SelectItem value="201-500">201-500 employees</SelectItem>
                              <SelectItem value="500+">500+ employees</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={companyData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          placeholder="Brief description of your company"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Admin Account */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="adminName">Admin Name *</Label>
                          <Input
                            id="adminName"
                            value={companyData.adminName}
                            onChange={(e) => handleInputChange('adminName', e.target.value)}
                            placeholder="Enter admin full name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="adminUsername">Username *</Label>
                          <Input
                            id="adminUsername"
                            value={companyData.adminUsername}
                            onChange={(e) => handleInputChange('adminUsername', e.target.value)}
                            placeholder="Choose username"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="adminEmail">Admin Email *</Label>
                          <Input
                            id="adminEmail"
                            type="email"
                            value={companyData.adminEmail}
                            onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                            onBlur={(e) => validateEmail(e.target.value)}
                            onFocus={() => setEmailError('')}
                            placeholder="admin@example.com"
                            className={emailError ? 'border-red-500' : emailSuccess ? 'border-green-500' : ''}
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Use a unique email that hasn't been registered before
                          </p>
                          {emailError && (
                            <p className="text-sm text-red-600 mt-1">{emailError}</p>
                          )}
                          {emailSuccess && !emailError && (
                            <p className="text-sm text-green-600 mt-1 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Email format is valid and available
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="adminPassword">Password *</Label>
                          <Input
                            id="adminPassword"
                            type="password"
                            value={companyData.adminPassword}
                            onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                            placeholder="Create strong password"
                            required
                            className={passwordError ? 'border-red-500' : ''}
                          />
                          {passwordError && (
                            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                              <AlertCircle size={14} />
                              {passwordError}
                            </p>
                          )}
                          {companyData.adminPassword && !passwordError && (
                            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                              <CheckCircle size={14} />
                              Password meets requirements
                            </p>
                          )}
                        </div>
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          This account will have full administrative access to your workspace.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Step 3: Plan Selection */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div>
                        <Label>Selected Plan: {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}</Label>
                        <div className="mt-2 p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-900">
                            {availablePlans.find(p => p.id === selectedPlan)?.name}
                          </h4>
                          <p className="text-blue-700">
                            ${availablePlans.find(p => p.id === selectedPlan)?.price}/month
                          </p>
                          <ul className="mt-2 text-sm text-blue-600">
                            {availablePlans.find(p => p.id === selectedPlan)?.features.map((feature, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          You'll start with a 14-day free trial. No credit card required.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-4">
                    {currentStep > 1 && (
                      <Button type="button" variant="outline" onClick={handlePrevStep}>
                        Previous
                      </Button>
                    )}
                    <div className="ml-auto">
                      {currentStep < 3 ? (
                        <Button type="button" onClick={handleNextStep}>
                          Next
                        </Button>
                      ) : (
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? "Creating..." : "Create Workspace"}
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          step < currentStep 
                            ? 'bg-green-100 text-green-600' 
                            : step === currentStep 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {step < currentStep ? '✓' : step}
                        </div>
                        <span className={`text-sm ${
                          step <= currentStep ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {step === 1 ? 'Company Info' : step === 2 ? 'Admin Account' : 'Plan Selection'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Our team is here to help you get started.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Contact Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Pricing Plans Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Choose the Right Plan
            </h2>
            <p className="text-gray-600">
              Start with a free trial and upgrade as you grow
            </p>
          </div>
          <PricingPlans 
            plans={availablePlans} 
            onPlanSelect={setSelectedPlan}
            selectedPlan={selectedPlan}
            onContinue={handleNextStep}
          />
        </div>

        {/* Login Link */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onGoToLogin}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
