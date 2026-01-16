import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User, Save, Camera,
  Mail, Phone, CheckCircle2, Loader2, Shield, Lock,
  Building2, Bell, Code, RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';
import { useAuth } from '@/components/Auth/AuthProvider';
import { companyService, type UpdateCompanyData } from '@/services/companyService';
import { userService, type UpdateUserData } from '@/services/userService';
import { testCompanyAPI } from '@/utils/testCompanyAPI';
import FeatureAccessStatus from '@/components/FeatureAccess/FeatureAccessStatus';
import FeatureDebugPanel from '@/components/FeatureAccess/FeatureDebugPanel';
import FeatureTestPanel from '@/components/FeatureAccess/FeatureTestPanel';
import SimpleFeatureTest from '@/components/FeatureAccess/SimpleFeatureTest';
import ApiTest from '@/components/FeatureAccess/ApiTest';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Get current user and update function from auth context
  const { currentUser, updateCurrentUser } = useAuth();

  // Debug: Log current user data
  console.log('Current User:', currentUser);
  console.log('Current User mobileNumber:', currentUser?.mobileNumber);

  // Test company API on load
  useEffect(() => {
    if (currentUser?.companyId) {
      console.log('🧪 Testing Company API for debugging...');
      testCompanyAPI(currentUser.companyId).then(result => {
        console.log('🧪 Test API Result:', result);
      });
    }
  }, [currentUser?.companyId]);

  // Profile state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: ''
  });

  // Avatar state (separate from profile form)
  const [currentAvatar, setCurrentAvatar] = useState('');

  // Company state
  const [companyForm, setCompanyForm] = useState({
    name: '',
    domain: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    logo: '',
    timezone: '',
    language: '',
    plan: '',
    status: '',
    maxUsers: 0,
    currentUsers: 0
  });
  console.log(companyForm)

  const [notificationPrefs, setNotificationPrefs] = useState({
    email: false,
    push: false,
    sms: false
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorRequired: false,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSpecialChars: false
    }
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);

  // Fetch user profile data
  const isValidUserProfile = (profile?: { id?: string; email?: string } | null) => {
    if (!profile) return false;
    if (profile.email === 'john.doe@example.com') return false;
    if (profile.id?.startsWith('mock-')) return false;
    return true;
  };

  const { data: userProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['userProfile', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      try {
        const response = await userService.getUserById(currentUser.id);
        // Backend returns { success: true, user: { ... } } or ApiResponse with data
        const profile = (response as any).user || response.data || null;
        if (isValidUserProfile(profile)) {
          return profile;
        }
        return isValidUserProfile(currentUser) ? currentUser : null;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        return isValidUserProfile(currentUser) ? currentUser : null;
      }
    },
    enabled: !!currentUser?.id,
    initialData: undefined
  });

  // Fetch company data
  const { data: companyData, isLoading: isCompanyLoading } = useQuery({
    queryKey: ['company', currentUser?.companyId],
    queryFn: async () => {
      if (!currentUser?.companyId) {
        console.log('⚠️ No company ID found for user:', currentUser);
        return null;
      }

      console.log('🔍 Fetching company data for ID:', currentUser.companyId);
      const response = await companyService.getCompanyById(currentUser.companyId);
      return response.data;
    },
    enabled: !!currentUser?.companyId, // Only enabled when company ID exists
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1 // Only retry once
  });
  const companyUnavailable = !isCompanyLoading && !companyData;
  const retryCompanyFetch = () => queryClient.invalidateQueries({ queryKey: ['company'] });

  // Update avatar when currentUser changes
  useEffect(() => {
    if (currentUser?.avatar) {
      console.log('Setting avatar from currentUser:', currentUser.avatar);
      setCurrentAvatar(currentUser.avatar);
    }
  }, [currentUser]);

  // Update profile form when data loads
  useEffect(() => {
    console.log('User Profile Data:', userProfile);
    console.log('Mobile Number from profile:', userProfile?.mobileNumber);
    if (userProfile) {
      const formData = {
        firstName: userProfile.firstName || userProfile.name?.split(' ')[0] || '',
        lastName: userProfile.lastName || userProfile.name?.split(' ').slice(1).join(' ') || '',
        email: userProfile.email || '',
        mobileNumber: userProfile.mobileNumber || ''
      };
      console.log('Setting Profile Form:', formData);
      setProfileForm(formData);
      // Update avatar from userProfile if available
      if (userProfile.avatar) {
        console.log('Setting avatar from userProfile:', userProfile.avatar);
        setCurrentAvatar(userProfile.avatar);
      }
    }
  }, [userProfile]);

  // Update company form when data loads
  useEffect(() => {
    console.log('Company Data:', companyData);
    console.log('Current User Company ID:', currentUser?.companyId);
    if (companyData) {
      const companyFormData = {
        name: companyData.name || '',
        domain: companyData.domain || '',
        email: companyData.email || '',
        phone: companyData.phone || '',
        address: {
          street: companyData.address?.street || '',
          city: companyData.address?.city || '',
          state: companyData.address?.state || '',
          country: companyData.address?.country || '',
          zipCode: companyData.address?.zipCode || ''
        },
        logo: companyData.logo || '',
        plan: companyData.subscription?.plan || '',
        status: companyData.status || '',
        maxUsers: companyData.limits?.maxUsers || 0,
        currentUsers: companyData.stats?.totalUsers || 0,
        timezone: companyData.settings?.timezone || '',
        language: companyData.settings?.language || ''
      };
      console.log('Setting Company Form:', companyFormData);
      setCompanyForm(companyFormData);

      setNotificationPrefs({
        email: companyData.settings?.notifications?.email ?? false,
        push: companyData.settings?.notifications?.push ?? false,
        sms: companyData.settings?.notifications?.sms ?? false
      });

      setSecuritySettings({
        twoFactorRequired: companyData.settings?.security?.twoFactorRequired ?? false,
        passwordPolicy: {
          minLength: companyData.settings?.security?.passwordPolicy?.minLength ?? 8,
          requireUppercase: companyData.settings?.security?.passwordPolicy?.requireUppercase ?? false,
          requireLowercase: companyData.settings?.security?.passwordPolicy?.requireLowercase ?? false,
          requireNumbers: companyData.settings?.security?.passwordPolicy?.requireNumbers ?? false,
          requireSpecialChars: companyData.settings?.security?.passwordPolicy?.requireSpecialChars ?? false
        }
      });
    }
  }, [companyData, currentUser?.companyId]);


  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserData) => {
      if (!currentUser?.id) throw new Error('No user ID');
      return await userService.updateUser(currentUser.id, data);
    },
    onSuccess: () => {
      // Update auth context and localStorage with the new profile data
      updateCurrentUser({
        ...currentUser,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        mobileNumber: profileForm.mobileNumber,
        name: `${profileForm.firstName} ${profileForm.lastName}`.trim()
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: UpdateCompanyData) => {
      if (!currentUser?.companyId) throw new Error('No company ID');
      return await companyService.updateCompany(currentUser.companyId, data);
    },
    onSuccess: () => {
      toast({
        title: "Company Updated",
        description: "Company information has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['company'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update company information. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateSecurityMutation = useMutation({
    mutationFn: async (securitySettings: { twoFactorRequired: boolean; passwordPolicy: { minLength: number; requireUppercase: boolean; requireLowercase: boolean; requireNumbers: boolean; requireSpecialChars: boolean } }) => {
      if (!currentUser?.companyId) throw new Error('No company ID');
      return await companyService.updateCompany(currentUser.companyId, {
        settings: { security: securitySettings }
      });
    },
    onSuccess: () => {
      toast({
        title: "Security Updated",
        description: "Security settings have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['company'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update security settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateNotificationMutation = useMutation({
    mutationFn: async (notifications: { email: boolean; push: boolean; sms: boolean }) => {
      if (!currentUser?.companyId) throw new Error('No company ID');
      return await companyService.updateCompany(currentUser.companyId, {
        settings: { notifications }
      });
    },
    onSuccess: () => {
      toast({
        title: "Notifications Updated",
        description: "Notification preferences have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['company'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update notifications. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty address fields to avoid validation issues
    const filteredAddress = Object.fromEntries(
      Object.entries(companyForm.address).filter(([_, value]) => value && value.trim() !== '')
    );

    // Filter out empty settings fields to avoid validation issues
    const filteredSettings = Object.fromEntries(
      Object.entries({
        timezone: companyForm.timezone,
        language: companyForm.language
      }).filter(([_, value]) => value && value.trim() !== '')
    );

    const updateData: UpdateCompanyData = {
      name: companyForm.name,
      domain: companyForm.domain,
      email: companyForm.email,
      phone: companyForm.phone,
      ...(Object.keys(filteredAddress).length > 0 && { address: filteredAddress }),
      ...(Object.keys(filteredSettings).length > 0 && { settings: filteredSettings })
    };
    console.log('Company update data being sent:', updateData);
    updateCompanyMutation.mutate(updateData);
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateSecurityMutation.mutate(securitySettings);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPasswordUpdating(true);
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  const handleNotificationsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateNotificationMutation.mutate(notificationPrefs);
  };

  // Handle avatar file selection and upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && currentUser?.id) {
      try {
        setIsLoading(true);

        // Upload file directly to backend using FormData
        const response = await userService.uploadAvatar(currentUser.id, selectedFile);

        if (response.success && response.data?.avatar) {
          const newAvatarUrl = response.data.avatar;
          console.log('Avatar upload successful, new URL:', newAvatarUrl);

          // Update local avatar state immediately
          setCurrentAvatar(newAvatarUrl);

          // Update auth context and localStorage so avatar shows everywhere
          updateCurrentUser({
            ...currentUser,
            avatar: newAvatarUrl,
            name: currentUser?.name || `${profileForm.firstName} ${profileForm.lastName}`.trim()
          });

          // Update the query cache to reflect the new avatar
          queryClient.setQueryData(['userProfile', currentUser.id], (oldData: any) => {
            if (oldData) {
              return { ...oldData, avatar: newAvatarUrl };
            }
            return oldData;
          });

          // Invalidate queries to refresh profile data
          queryClient.invalidateQueries({ queryKey: ['userProfile'] });

          toast({
            title: "Avatar Updated",
            description: "Your avatar has been successfully updated.",
          });
        } else {
          throw new Error('Upload failed - no avatar URL returned');
        }

      } catch (error: any) {
        console.error('Avatar upload error:', error);
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload avatar. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        // Clear the file input
        e.target.value = '';
      }
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 'trial': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case 'suspended': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'starter': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      case 'professional': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'enterprise': return 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border-purple-200 dark:from-purple-900/20 dark:to-indigo-900/20 dark:text-purple-300 dark:border-purple-700';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };


  const sidebarItems = [
    { id: 'profile', label: 'Profile Settings', icon: User, description: 'Personal details & avatar' },
    { id: 'account', label: 'Account Security', icon: Shield, description: 'Password & 2FA' },
    { id: 'company', label: 'Company Settings', icon: Building2, description: 'Branding & preferences' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Email & alerts' },
    { id: 'developer', label: 'Developer', icon: Code, description: 'API & Debugging' },
  ];

  const ProfileSkeleton = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-slate-200 dark:border-slate-700 shadow-sm h-fit">
          <CardContent className="pt-6 text-center">
            <Skeleton className="mx-auto h-32 w-32 rounded-full" />
            <Skeleton className="h-5 w-32 mx-auto mt-4" />
            <Skeleton className="h-4 w-40 mx-auto mt-2" />
            <Skeleton className="h-6 w-20 mx-auto mt-4" />
          </CardContent>
        </Card>
        <Card className="md:col-span-2 border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="pt-4 flex justify-end">
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const AccountSkeleton = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="pt-2">
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div>
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-3 w-44 mt-2" />
              </div>
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-10 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-10 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-6 w-10 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-6 w-10 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-10 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const CompanySkeleton = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const NotificationsSkeleton = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-52" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div>
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-36 mt-2" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
            ))}
            <div className="pt-2 flex justify-end">
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const CompanyUnavailable = () => (
    <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
      <CardHeader>
        <CardTitle>No company data found</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          We couldn&apos;t load your workspace details right now. Please refresh or retry in a moment.
        </p>
        <Button variant="outline" onClick={retryCompanyFetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry fetch
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your workspace preferences and configurations</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 py-1.5 px-3">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-2" />
                <span className="text-slate-600 dark:text-slate-300">System Operational</span>
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3 space-y-2">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2 shadow-sm">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left mb-1 last:mb-0",
                    activeTab === item.id
                      ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-medium"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    activeTab === item.id ? "bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm" : "bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-500"
                  )}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-sm">{item.label}</span>
                    <span className="block text-[10px] opacity-70 font-normal mt-0.5">{item.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-9 space-y-6">

            {/* Profile Settings */}
            {activeTab === 'profile' && (
              isProfileLoading ? (
                <ProfileSkeleton />
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Avatar Card */}
                    <Card className="md:col-span-1 border-slate-200 dark:border-slate-700 shadow-sm h-fit">
                      <CardContent className="pt-6 text-center">
                        <div className="relative mx-auto w-32 h-32 mb-4">
                          <Avatar className="w-full h-full border-4 border-slate-50 dark:border-slate-800 shadow-xl">
                            <AvatarImage src={currentAvatar} alt={profileForm.firstName} />
                            <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-red-500 to-red-600 text-white">
                              {(profileForm.firstName[0] || 'U')}{(profileForm.lastName[0] || '')}
                            </AvatarFallback>
                          </Avatar>
                          <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 cursor-pointer group">
                            <div className="w-10 h-10 bg-slate-900 dark:bg-slate-700 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg group-hover:scale-110 transition-transform">
                              {isLoading ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Camera className="h-4 w-4 text-white" />}
                            </div>
                            <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} disabled={isLoading} className="hidden" />
                          </label>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{profileForm.firstName} {profileForm.lastName}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{profileForm.email}</p>
                        <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {currentUser?.role || 'User'}
                        </Badge>
                      </CardContent>
                    </Card>

                    {/* Personal Details Form */}
                    <Card className="md:col-span-2 border-slate-200 dark:border-slate-700 shadow-sm">
                      <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>First Name</Label>
                              <Input value={profileForm.firstName} onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                              <Label>Last Name</Label>
                              <Input value={profileForm.lastName} onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input type="email" className="pl-10" value={profileForm.email} onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Phone</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input className="pl-10" value={profileForm.mobileNumber} onChange={(e) => setProfileForm(prev => ({ ...prev, mobileNumber: e.target.value }))} />
                            </div>
                          </div>
                          <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={updateProfileMutation.isPending} className="bg-red-600 hover:bg-red-700">
                              {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                              Save Changes
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )
            )}

            {/* Account Settings */}
            {activeTab === 'account' && (
              isCompanyLoading ? (
                <AccountSkeleton />
              ) : companyUnavailable ? (
                <CompanyUnavailable />
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-red-600" />
                        Change Password
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                        <div className="space-y-2">
                          <Label>Current Password</Label>
                          <Input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>New Password</Label>
                          <Input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Confirm Password</Label>
                          <Input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          />
                        </div>
                        <div className="pt-2">
                          <Button type="submit" disabled={isPasswordUpdating} className="bg-slate-900 dark:bg-slate-700 text-white">
                            {isPasswordUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Update Password
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-red-600" />
                        Security & Password Policy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSecuritySubmit} className="space-y-6">
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Require Two-Factor Authentication</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Extra security for all users.</p>
                          </div>
                          <Switch
                            checked={securitySettings.twoFactorRequired}
                            onCheckedChange={(value) => setSecuritySettings(prev => ({ ...prev, twoFactorRequired: value }))}
                          />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Minimum Password Length</Label>
                            <Input
                              type="number"
                              min={6}
                              value={securitySettings.passwordPolicy.minLength}
                              onChange={(e) => setSecuritySettings(prev => ({
                                ...prev,
                                passwordPolicy: { ...prev.passwordPolicy, minLength: Number(e.target.value) }
                              }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Password Rules</Label>
                            <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700 dark:text-slate-300">Require uppercase</span>
                                <Switch
                                  checked={securitySettings.passwordPolicy.requireUppercase}
                                  onCheckedChange={(value) => setSecuritySettings(prev => ({
                                    ...prev,
                                    passwordPolicy: { ...prev.passwordPolicy, requireUppercase: value }
                                  }))}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700 dark:text-slate-300">Require lowercase</span>
                                <Switch
                                  checked={securitySettings.passwordPolicy.requireLowercase}
                                  onCheckedChange={(value) => setSecuritySettings(prev => ({
                                    ...prev,
                                    passwordPolicy: { ...prev.passwordPolicy, requireLowercase: value }
                                  }))}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700 dark:text-slate-300">Require numbers</span>
                                <Switch
                                  checked={securitySettings.passwordPolicy.requireNumbers}
                                  onCheckedChange={(value) => setSecuritySettings(prev => ({
                                    ...prev,
                                    passwordPolicy: { ...prev.passwordPolicy, requireNumbers: value }
                                  }))}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700 dark:text-slate-300">Require special characters</span>
                                <Switch
                                  checked={securitySettings.passwordPolicy.requireSpecialChars}
                                  onCheckedChange={(value) => setSecuritySettings(prev => ({
                                    ...prev,
                                    passwordPolicy: { ...prev.passwordPolicy, requireSpecialChars: value }
                                  }))}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button type="submit" disabled={updateSecurityMutation.isPending} className="bg-red-600 hover:bg-red-700">
                            {updateSecurityMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Security Settings
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                </div>
              )
            )}

            {/* Company Settings */}
            {activeTab === 'company' && (
              isCompanyLoading ? (
                <CompanySkeleton />
              ) : companyUnavailable ? (
                <CompanyUnavailable />
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-red-600" />
                        Company Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCompanySubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Company Name</Label>
                            <Input value={companyForm.name} onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Domain</Label>
                            <Input value={companyForm.domain} onChange={(e) => setCompanyForm(prev => ({ ...prev, domain: e.target.value }))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={companyForm.email} onChange={(e) => setCompanyForm(prev => ({ ...prev, email: e.target.value }))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input value={companyForm.phone} onChange={(e) => setCompanyForm(prev => ({ ...prev, phone: e.target.value }))} />
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">Address</h4>
                          <div className="space-y-2">
                            <Label>Street</Label>
                            <Input value={companyForm.address.street} onChange={(e) => setCompanyForm(prev => ({ ...prev, address: { ...prev.address, street: e.target.value } }))} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>City</Label>
                              <Input value={companyForm.address.city} onChange={(e) => setCompanyForm(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } }))} />
                            </div>
                            <div className="space-y-2">
                              <Label>State</Label>
                              <Input value={companyForm.address.state} onChange={(e) => setCompanyForm(prev => ({ ...prev, address: { ...prev.address, state: e.target.value } }))} />
                            </div>
                            <div className="space-y-2">
                              <Label>Country</Label>
                              <Input value={companyForm.address.country} onChange={(e) => setCompanyForm(prev => ({ ...prev, address: { ...prev.address, country: e.target.value } }))} />
                            </div>
                            <div className="space-y-2">
                              <Label>Zip Code</Label>
                              <Input value={companyForm.address.zipCode} onChange={(e) => setCompanyForm(prev => ({ ...prev, address: { ...prev.address, zipCode: e.target.value } }))} />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button type="submit" disabled={updateCompanyMutation.isPending} className="bg-red-600 hover:bg-red-700">
                            {updateCompanyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Company Details
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )
            )}

            {/* Notifications Settings (Placeholder) */}
            {activeTab === 'notifications' && (
              isCompanyLoading ? (
                <NotificationsSkeleton />
              ) : companyUnavailable ? (
                <CompanyUnavailable />
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-red-600" />
                        Notification Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleNotificationsSubmit} className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Email Notifications</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Updates and summaries to your inbox.</p>
                          </div>
                          <Switch
                            checked={notificationPrefs.email}
                            onCheckedChange={(value) => setNotificationPrefs(prev => ({ ...prev, email: value }))}
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Push Notifications</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Realtime alerts on your device.</p>
                          </div>
                          <Switch
                            checked={notificationPrefs.push}
                            onCheckedChange={(value) => setNotificationPrefs(prev => ({ ...prev, push: value }))}
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">SMS Notifications</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Critical alerts via text message.</p>
                          </div>
                          <Switch
                            checked={notificationPrefs.sms}
                            onCheckedChange={(value) => setNotificationPrefs(prev => ({ ...prev, sms: value }))}
                          />
                        </div>
                        <div className="pt-2 flex justify-end">
                          <Button type="submit" disabled={updateNotificationMutation.isPending} className="bg-red-600 hover:bg-red-700">
                            {updateNotificationMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Preferences
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )
            )}

            {/* Developer Settings */}
            {activeTab === 'developer' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 gap-6">
                  <ApiTest />
                  <SimpleFeatureTest />
                  <FeatureDebugPanel />
                  <FeatureTestPanel />
                  <FeatureAccessStatus />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
