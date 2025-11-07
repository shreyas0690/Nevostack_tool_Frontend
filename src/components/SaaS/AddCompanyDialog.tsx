import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Building2, Globe, Mail, Phone, MapPin, Users, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddCompanyDialogProps {
  onCompanyAdded: (company: any) => void;
}

export default function AddCompanyDialog({ onCompanyAdded }: AddCompanyDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    companyName: '',
    subdomain: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    industry: '',
    employeeCount: '',
    description: '',
    subscriptionPlan: 'Starter',
    maxUsers: 10
  });

  const industries = [
    'Technology',
    'Manufacturing',
    'Healthcare',
    'Retail',
    'Finance',
    'Education',
    'Startup',
    'Consulting',
    'Real Estate',
    'Transportation',
    'Other'
  ];

  const employeeCounts = [
    '1-10',
    '10-50',
    '50-100',
    '100-200',
    '200-500',
    '500+'
  ];

  const subscriptionPlans = [
    { name: 'Starter', maxUsers: 10, price: 99 },
    { name: 'Professional', maxUsers: 50, price: 299 },
    { name: 'Enterprise', maxUsers: 200, price: 599 }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlanChange = (planName: string) => {
    const plan = subscriptionPlans.find(p => p.name === planName);
    setFormData(prev => ({
      ...prev,
      subscriptionPlan: planName,
      maxUsers: plan?.maxUsers || 10
    }));
  };

  const generateSubdomain = (companyName: string) => {
    return companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
  };

  const validateForm = () => {
    if (!formData.companyName.trim()) {
      toast({
        title: "Error",
        description: "Company name is required",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.subdomain.trim()) {
      toast({
        title: "Error",
        description: "Subdomain is required",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.email.trim()) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.industry) {
      toast({
        title: "Error",
        description: "Industry is required",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newCompany = {
        id: Date.now().toString(),
        companyName: formData.companyName,
        subdomain: formData.subdomain,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        website: formData.website,
        industry: formData.industry,
        employeeCount: formData.employeeCount,
        description: formData.description,
        status: 'active',
        subscriptionPlan: formData.subscriptionPlan,
        subscriptionStatus: 'trial',
        currentUsers: 0,
        maxUsers: formData.maxUsers,
        revenue: 0,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days trial
        subscriptionEndsAt: null
      };

      onCompanyAdded(newCompany);
      
      toast({
        title: "Success",
        description: `${formData.companyName} has been added successfully!`,
      });

      // Reset form
      setFormData({
        companyName: '',
        subdomain: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        industry: '',
        employeeCount: '',
        description: '',
        subscriptionPlan: 'Starter',
        maxUsers: 10
      });

      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add company. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyNameChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      companyName: value,
      subdomain: generateSubdomain(value)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Add New Company
          </DialogTitle>
          <DialogDescription>
            Register a new company on the platform. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="Enter company name"
                  value={formData.companyName}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain *</Label>
                <div className="flex items-center">
                  <Input
                    id="subdomain"
                    placeholder="company-name"
                    value={formData.subdomain}
                    onChange={(e) => handleInputChange('subdomain', e.target.value)}
                    className="rounded-r-none"
                  />
                  <span className="px-3 py-2 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">
                    .nevostack.com
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the company"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeCount">Employee Count</Label>
                <Select value={formData.employeeCount} onValueChange={(value) => handleInputChange('employeeCount', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee count" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeCounts.map((count) => (
                      <SelectItem key={count} value={count}>
                        {count}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@company.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                placeholder="https://company.com"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Company address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Subscription Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Subscription Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subscriptionPlan">Subscription Plan *</Label>
                <Select value={formData.subscriptionPlan} onValueChange={handlePlanChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionPlans.map((plan) => (
                      <SelectItem key={plan.name} value={plan.name}>
                        {plan.name} - ${plan.price}/month ({plan.maxUsers} users)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUsers">Max Users</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  value={formData.maxUsers}
                  onChange={(e) => handleInputChange('maxUsers', e.target.value)}
                  disabled
                />
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">Plan Details</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>• {formData.subscriptionPlan} Plan</p>
                <p>• Up to {formData.maxUsers} users</p>
                <p>• 30-day free trial</p>
                <p>• Full access to all features</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : 'Add Company'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}












