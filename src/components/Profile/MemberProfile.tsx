import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { mockDepartments } from '@/data/mockData';
import { userService } from '@/services/userService';
import authService from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  User, Mail, Phone, Building2, Briefcase, Upload,
  Shield, Lock, Save, Loader2, Key
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MemberProfile() {
  const { currentUser, updateCurrentUser } = useAuth();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const nameParts = currentUser.name?.split(' ') ?? [];
    const derivedFirstName = currentUser.firstName || nameParts[0] || '';
    const derivedLastName = currentUser.lastName || nameParts.slice(1).join(' ') || '';

    setFirstName(derivedFirstName);
    setLastName(derivedLastName);
    setEmail(currentUser.email || '');

    const phoneValue =
      currentUser.mobileNumber ||
      (currentUser as { phoneNumber?: string }).phoneNumber ||
      (currentUser as { phone?: string }).phone ||
      '';
    setPhone(phoneValue);
  }, [currentUser]);

  // Clear password fields when the user context changes
  useEffect(() => {
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
  }, [currentUser?.id]);

  const departmentName = (() => {
    const departmentValue = currentUser?.departmentId;
    if (!departmentValue) {
      return undefined;
    }
    if (typeof departmentValue === 'object') {
      const departmentObject = departmentValue as { name?: string; id?: string; _id?: string };
      if (departmentObject.name) {
        return departmentObject.name;
      }
      const departmentId = departmentObject.id || departmentObject._id;
      return departmentId
        ? mockDepartments.find(d => d.id === departmentId)?.name
        : undefined;
    }
    return mockDepartments.find(d => d.id === departmentValue)?.name;
  })();

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the 5MB limit. Please choose a smaller image.`,
          variant: "destructive"
        });
        return;
      }

      console.log('Selected file:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      setAvatarFile(file);

      // Convert to data URL for preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setAvatarPreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Set initial avatar preview when currentUser becomes available
  useEffect(() => {
    console.log('🎯 Checking for initial avatar setup...');
    console.log('Current currentUser?.avatar:', currentUser?.avatar);
    console.log('Current avatarPreview:', avatarPreview);

    if (currentUser?.avatar && !avatarPreview) {
      console.log('✅ Setting initial avatar from currentUser:', currentUser.avatar);
      setAvatarPreview(currentUser.avatar);
    } else if (currentUser?.avatar) {
      console.log('ℹ️ Avatar already set or currentUser has avatar');
    } else {
      console.log('❌ No avatar found in currentUser');
      // Try to load from localStorage as fallback
      const savedAvatar = localStorage.getItem('user_avatar');
      if (savedAvatar) {
        console.log('🔄 Loading avatar from localStorage:', savedAvatar);
        setAvatarPreview(savedAvatar);
      }
    }
  }, [currentUser?.avatar, avatarPreview]);

  // Update avatar preview when currentUser avatar changes (for uploads)
  useEffect(() => {
    if (currentUser?.avatar && avatarPreview !== currentUser.avatar) {
      setAvatarPreview(currentUser.avatar);
      console.log('Avatar updated from currentUser:', currentUser.avatar);
    }
  }, [currentUser?.avatar]);

  const initials = ((firstName || '') + ' ' + (lastName || ''))
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'M';

  // Debug: Log currentUser changes and name data
  useEffect(() => {
    console.log('🔍 MemberProfile - currentUser:', currentUser);
    console.log('🔍 MemberProfile - currentUser.name:', currentUser?.name);
    console.log('🔍 MemberProfile - currentUser.firstName:', currentUser?.firstName);
    console.log('🔍 MemberProfile - currentUser.lastName:', currentUser?.lastName);
    console.log('🔍 MemberProfile - firstName state:', firstName);
    console.log('🔍 MemberProfile - lastName state:', lastName);
    console.log('🔍 MemberProfile - avatarPreview:', avatarPreview);
    console.log('🔍 MemberProfile - initials:', initials);
  }, [currentUser, firstName, lastName, avatarPreview, initials]);

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    if (!firstName || !lastName) {
      toast({
        title: "Validation Error",
        description: "First Name and Last Name are required",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Update profile data via Member panel backend
      console.log('Updating Member profile data...');
      const updateResponse = await userService.updateMemberProfileDetails({
        firstName,
        lastName
      });

      if (updateResponse.success) {
        console.log('Member profile data updated successfully');

        // Update the currentUser in auth context with new name
        if (currentUser && updateCurrentUser) {
          const updatedUser = {
            ...currentUser,
            name: `${firstName} ${lastName}`.trim(),
            firstName,
            lastName
          };
          console.log('🔄 About to call updateCurrentUser with:', updatedUser);
          updateCurrentUser(updatedUser);
          console.log('✅ Updated currentUser with new Member profile data');
        }
      } else {
        throw new Error(updateResponse.message || 'Profile update failed');
      }

      // Upload Avatar to Member panel backend if selected
      if (avatarFile) {
        try {
          console.log('Uploading Member avatar...');
          const uploadResponse = await userService.uploadMemberAvatar(avatarFile);
          if (uploadResponse.success) {
            // Update the avatar URL from backend response
            const newAvatarUrl = uploadResponse.data.avatar;
            setAvatarPreview(newAvatarUrl);
            console.log('Member avatar uploaded successfully:', newAvatarUrl);

            // Update the currentUser in auth context with new avatar
            if (currentUser && updateCurrentUser) {
              const updatedUser = { ...currentUser, avatar: newAvatarUrl };
              console.log('🔄 About to call updateCurrentUser with:', updatedUser);
              updateCurrentUser(updatedUser);
              console.log('✅ Updated currentUser with new Member avatar');
            }
          } else {
            throw new Error(uploadResponse.message || 'Upload failed');
          }
        } catch (uploadError: any) {
          console.error('Avatar upload failed:', uploadError);

          // Show specific error messages based on error type
          let errorMessage = 'Profile saved but avatar upload failed. Please try again.';

          if (uploadError?.response?.status === 408) {
            errorMessage = 'Upload timed out. Please try with a smaller image or check your connection.';
          } else if (uploadError?.response?.status === 413) {
            errorMessage = 'Image file is too large. Please choose a smaller image (max 5MB).';
          } else if (uploadError?.response?.data?.message) {
            errorMessage = `Upload failed: ${uploadError.response.data.message}`;
          } else if (uploadError?.response?.status === 503) {
            errorMessage = 'Avatar upload service is currently unavailable. Please contact your administrator.';
          }

          toast({
            title: "Upload Warning",
            description: errorMessage,
            variant: "destructive"
          });
        }
      }

      // All operations completed successfully
      console.log('Profile saved', { firstName, lastName, email, phone });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Profile update failed:', error);
      let errorMessage = 'Profile update failed. Please try again.';
      if (error?.response?.status === 400) {
        errorMessage = 'Invalid data. Please check your input.';
      } else if (error?.response?.data?.message) {
        errorMessage = `Update failed: ${error.response.data.message}`;
      }
      toast({
        title: "Profile Update Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };


  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      toast({
        title: "Validation Error",
        description: "Please fill all password fields",
        variant: "destructive"
      });
      return;
    }
    if (newPwd !== confirmPwd) {
      toast({
        title: "Validation Error",
        description: "New password and confirm password do not match",
        variant: "destructive"
      });
      return;
    }
    if (newPwd.length < 8) {
      toast({
        title: "Validation Error",
        description: "New password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      console.log('Changing password...');
      const response = await authService.changePassword({
        currentPassword: currentPwd,
        newPassword: newPwd
      });

      console.log('Password changed successfully:', response);
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
        variant: "default"
      });

      // Clear form fields
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (error: any) {
      console.error('Password change failed:', error);
      const errorMessage = error?.message || 'Failed to change password. Please try again.';
      toast({
        title: "Password Change Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950/50 -m-6 p-6">
      {/* Hero Background */}
      <div className="h-64 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 rounded-3xl relative overflow-hidden shadow-2xl mx-auto max-w-7xl">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10"></div>

        <div className="relative h-full flex items-center px-10">
          <div className="text-white space-y-2">
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                <User className="w-3 h-3 mr-1" />
                Team Member
              </Badge>
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                <Building2 className="w-3 h-3 mr-1" />
                {departmentName || 'Department'}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Hello, {firstName || 'Member'}!
            </h1>
            <p className="text-blue-100 text-lg max-w-xl">
              Manage your profile settings and account security from your personal dashboard.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar: Profile Card */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden ring-1 ring-white/20">
              <CardContent className="p-0">
                <div className="px-6 pt-8 pb-6 text-center relative">
                  <div className="relative inline-block">
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg mx-auto mb-4">
                      <Avatar className="w-full h-full border-4 border-white dark:border-slate-900">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-slate-100 text-slate-600 text-3xl font-bold">
                            {initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <Button
                      size="icon"
                      className="absolute bottom-4 right-0 rounded-full shadow-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 h-10 w-10 border border-slate-200 dark:border-slate-700"
                      onClick={() => document.getElementById('avatar-input')?.click()}
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {(firstName + ' ' + lastName).trim() || 'Your Name'}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">{email || 'email@company.com'}</p>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                    <div className="text-center">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Role</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-200 mt-1">Member</p>
                    </div>
                    <div className="text-center border-l border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Status</p>
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Active</span>
                      </div>
                    </div>
                  </div>
                </div>

                <input
                  id="avatar-input"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </CardContent>
            </Card>

            {/* Quick Contact Info */}
            <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-violet-500" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Email Address</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate" title={email}>{email}</p>
                  </div>
                </div>
                <div className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Phone Number</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{phone || 'Not set'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Edit Profile Form */}
            <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-black/5">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Personal Details</CardTitle>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Update your personal information</p>
                  </div>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-violet-500/25 transition-all"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2.5">
                    <Label htmlFor="firstName" className="text-slate-600 dark:text-slate-300 font-medium">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={isSaving}
                      className="h-12 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-violet-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="lastName" className="text-slate-600 dark:text-slate-300 font-medium">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={isSaving}
                      className="h-12 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-violet-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-slate-600 dark:text-slate-300 font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={email}
                        readOnly
                        className="h-12 pl-11 bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-slate-600 dark:text-slate-300 font-medium">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={phone}
                        readOnly
                        placeholder="Not set"
                        className="h-12 pl-11 bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Section */}
            <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-black/5 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 rounded-bl-full -mr-16 -mt-16 -z-10 transition-transform group-hover:scale-105 duration-700"></div>

              <CardHeader className="border-b border-slate-100 dark:border-slate-800 py-4 px-6 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Security Settings</CardTitle>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Manage your password and account security</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7 space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="currentPwd" className="text-slate-700 dark:text-slate-300 text-sm font-medium">Current Password</Label>
                      <div className="relative group/input">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-500 transition-colors group-focus-within/input:text-emerald-600 dark:group-focus-within/input:text-emerald-400">
                          <Key className="w-3.5 h-3.5" />
                        </div>
                        <Input
                          id="currentPwd"
                          type="password"
                          value={currentPwd}
                          onChange={(e) => setCurrentPwd(e.target.value)}
                          disabled={isChangingPassword}
                          className="pl-11 h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="newPwd" className="text-slate-700 dark:text-slate-300 text-sm font-medium">New Password</Label>
                        <div className="relative group/input">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-500 transition-colors group-focus-within/input:text-emerald-600 dark:group-focus-within/input:text-emerald-400">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                          <Input
                            id="newPwd"
                            type="password"
                            value={newPwd}
                            onChange={(e) => setNewPwd(e.target.value)}
                            disabled={isChangingPassword}
                            className="pl-11 h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                            placeholder="Min 8 chars"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPwd" className="text-slate-700 dark:text-slate-300 text-sm font-medium">Confirm Password</Label>
                        <div className="relative group/input">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-500 transition-colors group-focus-within/input:text-emerald-600 dark:group-focus-within/input:text-emerald-400">
                            <Shield className="w-3.5 h-3.5" />
                          </div>
                          <Input
                            id="confirmPwd"
                            type="password"
                            value={confirmPwd}
                            onChange={(e) => setConfirmPwd(e.target.value)}
                            disabled={isChangingPassword}
                            className="pl-11 h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                            placeholder="Confirm password"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleChangePassword}
                      disabled={isChangingPassword}
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white h-10 shadow-md hover:shadow-violet-500/25 transition-all text-sm font-medium"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 mr-2" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="lg:col-span-5 flex flex-col justify-center">
                    <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Password Requirements
                      </h4>
                      <div className="space-y-2">
                        {[
                          "Min 8 characters",
                          "One uppercase letter",
                          "One number/symbol",
                          "Match confirmation"
                        ].map((req, i) => (
                          <div key={i} className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                            <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">✓</span>
                            </div>
                            {req}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
