import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Settings, User, Save, Camera, 
  Mail, Phone, CheckCircle2, Loader2, Shield, Lock,
  Building2, Globe, Users, Clock, Languages, Home
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';
import { useAuth } from '@/components/Auth/AuthProvider';
import { workspaceService, type Workspace } from '@/services/workspaceService';
import { companyService, type Company, type UpdateCompanyData } from '@/services/companyService';
import { userService, type User as UserType, type UpdateUserData } from '@/services/userService';
import { testCompanyAPI } from '@/utils/testCompanyAPI';
import FeatureAccessStatus from '@/components/FeatureAccess/FeatureAccessStatus';
import FeatureDebugPanel from '@/components/FeatureAccess/FeatureDebugPanel';
import FeatureTestPanel from '@/components/FeatureAccess/FeatureTestPanel';
import SimpleFeatureTest from '@/components/FeatureAccess/SimpleFeatureTest';
import ApiTest from '@/components/FeatureAccess/ApiTest';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState('personal');
  
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


  // Fetch user profile data
  const { data: userProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['userProfile', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      try {
        const response = await userService.getUserById(currentUser.id);
        // Backend returns { success: true, user: { ... } } or ApiResponse with data
        return (response as any).user || response.data;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        return null; // Do not fallback to mock/currentUser
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


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {/* Analytics-style Header */}
        <div className="relative mb-4 sm:mb-6 lg:mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent rounded-xl"></div>
          <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
              </div>
              <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    <span className="hidden sm:inline">Settings</span>
                    <span className="sm:hidden">Settings</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    <span className="hidden sm:inline">Manage your profile and company preferences</span>
                    <span className="sm:hidden">Manage profile and preferences</span>
                  </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs sm:text-sm px-2 sm:px-3 py-1">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">All Systems Operational</span>
                <span className="sm:hidden">Operational</span>
              </Badge>
            </div>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">

          {/* Profile Section with Tabs */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  <span className="hidden sm:inline">Profile Settings</span>
                  <span className="sm:hidden">Profile</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <span className="hidden sm:inline">Manage your personal information and preferences</span>
                  <span className="sm:hidden">Manage personal information</span>
                </p>
          </div>
        </div>

            <Tabs value={activeProfileTab} onValueChange={setActiveProfileTab} className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <TabsTrigger 
                  value="personal" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 text-xs sm:text-sm px-2 sm:px-4 py-2"
              >
                  <span className="hidden sm:inline">Personal Information</span>
                  <span className="sm:hidden">Personal</span>
              </TabsTrigger>
              <TabsTrigger 
                  value="account" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 text-xs sm:text-sm px-2 sm:px-4 py-2"
              >
                  <span className="hidden sm:inline">Account Settings</span>
                  <span className="sm:hidden">Account</span>
              </TabsTrigger>
            </TabsList>

              <TabsContent value="personal" className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Profile Picture Card */}
                  <Card className="lg:col-span-1 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="text-center pb-3 sm:pb-4 p-3 sm:p-4 lg:p-6">
                  <div className="relative mx-auto">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 mx-auto relative">
                          <Avatar className="w-full h-full border-4 border-white shadow-lg">
                      <AvatarImage
                        src={currentAvatar}
                        alt={`${profileForm.firstName} ${profileForm.lastName}`}
                      />
                            <AvatarFallback className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-red-500 to-red-600 text-white">
                        {(profileForm.firstName[0] || 'U')}{(profileForm.lastName[0] || '')}
                      </AvatarFallback>
                    </Avatar>
                          <div className="absolute -bottom-1 -right-1">
                      <label htmlFor="avatar-upload" className="cursor-pointer">
                              <div className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
                              }`}>
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-white animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          )}
                        </div>
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={isLoading}
                        className="hidden"
                      />
                          </div>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                      {profileForm.firstName} {profileForm.lastName}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{profileForm.email}</p>
                        <Badge className="mt-2 bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 text-xs sm:text-sm px-2 py-1">
                      {currentUser?.role || 'User'}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

                  {/* Personal Information Form */}
                  <Card className="lg:col-span-2 border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-6">
                      <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <span className="text-sm sm:text-base lg:text-lg">
                          <span className="hidden sm:inline">Personal Information</span>
                          <span className="sm:hidden">Personal Info</span>
                        </span>
                  </CardTitle>
                </CardHeader>
                    <CardContent className="p-3 sm:p-4 lg:p-6">
                  {isProfileLoading ? (
                    <div className="flex items-center justify-center py-8 sm:py-12">
                          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-red-600" />
                          <span className="ml-2 sm:ml-3 text-sm sm:text-lg text-slate-900 dark:text-slate-100">Loading profile...</span>
                    </div>
                  ) : (
                    <form onSubmit={handleProfileSubmit} className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                              <Label htmlFor="firstName" className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                            First Name
                          </Label>
                          <Input
                            id="firstName"
                            value={profileForm.firstName}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                                className="mt-1 sm:mt-2 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm"
                            required
                          />
                        </div>
                        <div>
                              <Label htmlFor="lastName" className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                            Last Name
                          </Label>
                          <Input
                            id="lastName"
                            value={profileForm.lastName}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                                className="mt-1 sm:mt-2 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm"
                            required
                          />
                        </div>
                      </div>

                      <div>
                            <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                          Email Address
                        </Label>
                        <div className="relative mt-1 sm:mt-2">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                          <Input
                            id="email"
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                                className="pl-10 sm:pl-11 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm"
                            required
                          />
                        </div>
                      </div>

                      <div>
                            <Label htmlFor="mobileNumber" className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                          Mobile Number
                        </Label>
                        <div className="relative mt-1 sm:mt-2">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                          <Input
                            id="mobileNumber"
                            value={profileForm.mobileNumber || ''}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, mobileNumber: e.target.value }))}
                                className="pl-10 sm:pl-11 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm"
                            placeholder="+1 (555) 987-6543"
                          />
                        </div>
                      </div>

                      <Separator className="my-4 sm:my-6" />

                      <div className="flex justify-end gap-2 sm:gap-3">
                        <Button 
                          type="submit" 
                          disabled={updateProfileMutation.isPending}
                              className="bg-red-600 hover:bg-red-700 text-white h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">Saving...</span>
                              <span className="sm:hidden">Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">Save Profile</span>
                              <span className="sm:hidden">Save</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

              <TabsContent value="account" className="space-y-4 sm:space-y-6">
                {/* Account Security */}
                <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                  <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-6">
                    <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-sm sm:text-base lg:text-lg">
                        <span className="hidden sm:inline">Account Security</span>
                        <span className="sm:hidden">Security</span>
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <Label htmlFor="currentPassword" className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                            Current Password
                          </Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            className="mt-1 sm:mt-2 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm"
                            placeholder="Enter current password"
                          />
                  </div>
                        <div>
                          <Label htmlFor="newPassword" className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                            New Password
                          </Label>
                          <Input
                            id="newPassword"
                            type="password"
                            className="mt-1 sm:mt-2 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm"
                            placeholder="Enter new password"
                          />
                    </div>
                  </div>
                      
                      <div>
                        <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          className="mt-1 sm:mt-2 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm"
                          placeholder="Confirm new password"
                        />
                      </div>

                      <Separator className="my-4 sm:my-6" />

                      <div className="flex justify-end gap-2 sm:gap-3">
                        <Button 
                          type="button" 
                          variant="outline"
                          className="border-slate-200 dark:border-slate-700 h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                        >
                          <span className="hidden sm:inline">Cancel</span>
                          <span className="sm:hidden">Cancel</span>
                        </Button>
                        <Button 
                          type="button"
                          className="bg-red-600 hover:bg-red-700 text-white h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                        >
                          <Lock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Update Password</span>
                          <span className="sm:hidden">Update</span>
                        </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

                {/* Company Overview */}
                <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                  <CardHeader className="text-center p-3 sm:p-4 lg:p-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Building2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white" />
                    </div>
                    <div className="mt-3 sm:mt-4">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                        {companyForm.name || 'Your Company'}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        {companyForm.domain || 'company.com'}
                      </p>
                      <div className="flex flex-wrap gap-1 sm:gap-2 mt-3 sm:mt-4 justify-center">
                        <Badge className={`${getPlanBadgeColor(companyForm.plan)} text-xs px-2 py-1 font-medium border shadow-sm`}>
                          <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                              companyForm.plan?.toLowerCase() === 'starter' ? 'bg-slate-500' :
                              companyForm.plan?.toLowerCase() === 'professional' ? 'bg-blue-500' :
                              companyForm.plan?.toLowerCase() === 'enterprise' ? 'bg-purple-500' : 'bg-slate-500'
                            }`}></div>
                          <span className="hidden sm:inline">{companyForm.plan?.charAt(0).toUpperCase() + companyForm.plan?.slice(1)} Plan</span>
                          <span className="sm:hidden">{companyForm.plan?.charAt(0).toUpperCase() + companyForm.plan?.slice(1)}</span>
                          </div>
                        </Badge>
                        <Badge className={`${getStatusBadgeColor(companyForm.status)} text-xs px-2 py-1 font-medium border shadow-sm`}>
                          <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                              companyForm.status?.toLowerCase() === 'active' ? 'bg-green-500' :
                              companyForm.status?.toLowerCase() === 'trial' ? 'bg-amber-500' :
                              companyForm.status?.toLowerCase() === 'suspended' ? 'bg-red-500' : 'bg-slate-500'
                            }`}></div>
                          <span className="hidden sm:inline">{companyForm.status?.charAt(0).toUpperCase() + companyForm.status?.slice(1)}</span>
                          <span className="sm:hidden">{companyForm.status?.charAt(0).toUpperCase() + companyForm.status?.slice(1)}</span>
                          </div>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                          <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">Users</span>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                          {companyForm.currentUsers} / {companyForm.maxUsers}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Company Information */}
                <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                  <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 lg:p-6">
                    <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-sm sm:text-base lg:text-lg">
                        <span className="hidden sm:inline">Company Information</span>
                        <span className="sm:hidden">Company Info</span>
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                  {isCompanyLoading ? (
                    <div className="flex items-center justify-center py-8 sm:py-12">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-red-600" />
                        <span className="ml-2 sm:ml-3 text-sm sm:text-lg text-slate-900 dark:text-slate-100">Loading company data...</span>
                    </div>
                  ) : (
                    <form onSubmit={handleCompanySubmit} className="space-y-4 sm:space-y-6">
                      <div>
                          <Label htmlFor="companyName" className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                          Company Name
                        </Label>
                        <div className="relative mt-1 sm:mt-2">
                          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                          <Input
                            id="companyName"
                            value={companyForm.name}
                            onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))}
                              className="pl-10 sm:pl-11 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <Label htmlFor="domain" className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                            Domain
                          </Label>
                          <div className="relative mt-1 sm:mt-2">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                            <Input
                              id="domain"
                              value={companyForm.domain}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, domain: e.target.value }))}
                                className="pl-10 sm:pl-11 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm"
                              placeholder="company.com"
                            />
                          </div>
                        </div>
                        <div>
                            <Label htmlFor="companyEmail" className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                            Company Email
                          </Label>
                          <div className="relative mt-1 sm:mt-2">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                            <Input
                              id="companyEmail"
                              type="email"
                              value={companyForm.email}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, email: e.target.value }))}
                                className="pl-10 sm:pl-11 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm"
                              placeholder="info@company.com"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <Label htmlFor="companyPhone" className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                            Phone Number
                          </Label>
                          <div className="relative mt-1 sm:mt-2">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                            <Input
                              id="companyPhone"
                              value={companyForm.phone}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, phone: e.target.value }))}
                                className="pl-10 sm:pl-11 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm"
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                        </div>
                        <div>
                            <Label htmlFor="companyLogo" className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                            Company Logo URL
                          </Label>
                          <div className="relative mt-1 sm:mt-2">
                            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                            <Input
                              id="companyLogo"
                              value={companyForm.logo}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, logo: e.target.value }))}
                                className="pl-10 sm:pl-11 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm"
                              placeholder="https://example.com/logo.png"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator className="my-4 sm:my-6" />

                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 mb-3 sm:mb-4 block">
                          <span className="hidden sm:inline">Company Address</span>
                          <span className="sm:hidden">Address</span>
                        </Label>
                        <div className="space-y-3 sm:space-y-4">
                          <div>
                            <Label htmlFor="street" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              Street Address
                            </Label>
                            <Input
                              id="street"
                              value={companyForm.address.street}
                              onChange={(e) => setCompanyForm(prev => ({ 
                                ...prev, 
                                address: { ...prev.address, street: e.target.value }
                              }))}
                              className="mt-1 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm"
                              placeholder="123 Business Street"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <Label htmlFor="city" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                City
                              </Label>
                              <Input
                                id="city"
                                value={companyForm.address.city}
                                onChange={(e) => setCompanyForm(prev => ({ 
                                  ...prev, 
                                  address: { ...prev.address, city: e.target.value }
                                }))}
                                className="mt-1 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm"
                                placeholder="San Francisco"
                              />
                            </div>
                            <div>
                              <Label htmlFor="state" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                State/Province
                              </Label>
                              <Input
                                id="state"
                                value={companyForm.address.state}
                                onChange={(e) => setCompanyForm(prev => ({ 
                                  ...prev, 
                                  address: { ...prev.address, state: e.target.value }
                                }))}
                                className="mt-1 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm"
                                placeholder="California"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <Label htmlFor="country" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                Country
                              </Label>
                              <Input
                                id="country"
                                value={companyForm.address.country}
                                onChange={(e) => setCompanyForm(prev => ({ 
                                  ...prev, 
                                  address: { ...prev.address, country: e.target.value }
                                }))}
                                className="mt-1 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm"
                                placeholder="United States"
                              />
                            </div>
                            <div>
                              <Label htmlFor="zipCode" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                ZIP/Postal Code
                              </Label>
                              <Input
                                id="zipCode"
                                value={companyForm.address.zipCode}
                                onChange={(e) => setCompanyForm(prev => ({ 
                                  ...prev, 
                                  address: { ...prev.address, zipCode: e.target.value }
                                }))}
                                className="mt-1 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm"
                                placeholder="94107"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <Label htmlFor="timezone" className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                            Timezone
                          </Label>
                          <Select
                            value={companyForm.timezone}
                            onValueChange={(value) => setCompanyForm(prev => ({ ...prev, timezone: value }))}
                          >
                              <SelectTrigger className="mt-1 sm:mt-2 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm">
                              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 mr-2" />
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UTC" className="text-xs sm:text-sm">UTC (Coordinated Universal Time)</SelectItem>
                              <SelectItem value="America/New_York" className="text-xs sm:text-sm">Eastern Time (EST/EDT)</SelectItem>
                              <SelectItem value="America/Chicago" className="text-xs sm:text-sm">Central Time (CST/CDT)</SelectItem>
                              <SelectItem value="America/Denver" className="text-xs sm:text-sm">Mountain Time (MST/MDT)</SelectItem>
                              <SelectItem value="America/Los_Angeles" className="text-xs sm:text-sm">Pacific Time (PST/PDT)</SelectItem>
                              <SelectItem value="Europe/London" className="text-xs sm:text-sm">GMT (Greenwich Mean Time)</SelectItem>
                              <SelectItem value="Asia/Kolkata" className="text-xs sm:text-sm">IST (India Standard Time)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                            <Label htmlFor="language" className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                            Language
                          </Label>
                          <Select
                            value={companyForm.language}
                            onValueChange={(value) => setCompanyForm(prev => ({ ...prev, language: value }))}
                          >
                              <SelectTrigger className="mt-1 sm:mt-2 border-slate-200 dark:border-slate-700 h-9 sm:h-10 text-xs sm:text-sm">
                              <Languages className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 mr-2" />
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en" className="text-xs sm:text-sm">English</SelectItem>
                              <SelectItem value="es" className="text-xs sm:text-sm">Spanish</SelectItem>
                              <SelectItem value="fr" className="text-xs sm:text-sm">French</SelectItem>
                              <SelectItem value="de" className="text-xs sm:text-sm">German</SelectItem>
                              <SelectItem value="it" className="text-xs sm:text-sm">Italian</SelectItem>
                              <SelectItem value="pt" className="text-xs sm:text-sm">Portuguese</SelectItem>
                              <SelectItem value="hi" className="text-xs sm:text-sm">Hindi</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator className="my-4 sm:my-6" />

                      <div className="flex justify-end gap-2 sm:gap-3">
                        <Button 
                          type="submit" 
                          disabled={updateCompanyMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                        >
                          {updateCompanyMutation.isPending ? (
                            <>
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">Saving...</span>
                              <span className="sm:hidden">Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">Save Company</span>
                              <span className="sm:hidden">Save</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* API Test */}
              <ApiTest />
              
              {/* Simple Feature Test */}
              <SimpleFeatureTest />
              
              {/* Feature Debug Panel */}
              <FeatureDebugPanel />
              
              {/* Feature Test Panel */}
              <FeatureTestPanel />
              
              {/* Feature Access Status */}
              <FeatureAccessStatus />
          </TabsContent>
        </Tabs>
          </div>

        </div>
      </div>
    </div>
  );
}
