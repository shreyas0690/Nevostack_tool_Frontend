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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  User, Mail, Phone, Calendar, Building2, Briefcase, Upload, Image as ImageIcon,
  Shield, Lock, Save, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MemberProfile() {
  const { currentUser, updateCurrentUser } = useAuth();
  const { toast } = useToast();

  // Early return if no currentUser (not logged in)
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

  const department = currentUser?.departmentId 
    ? mockDepartments.find(d => d.id === currentUser.departmentId)
    : undefined;

  const [firstName, setFirstName] = useState(currentUser?.firstName || currentUser?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || currentUser?.name?.split(' ').slice(1).join(' ') || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Ensure current password field is always empty for security
  React.useEffect(() => {
    if (currentPwd !== '') {
      setCurrentPwd('');
    }
  }, []);

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

  // Security
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const initials = ((firstName || '') + ' ' + (lastName || ''))
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

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
      // Update profile data via member panel backend
      console.log('Updating member profile data...');
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
          console.log('✅ Updated currentUser with new member profile data');
        }
      } else {
        throw new Error(updateResponse.message || 'Profile update failed');
      }

      // Upload Avatar to member panel backend if selected
      if (avatarFile) {
        try {
          console.log('Uploading member avatar...');
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
              console.log('✅ Updated currentUser with new member avatar');
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
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-8 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <User className="w-6 h-6" />
            </div>
        <div>
              <h1 className="text-4xl font-bold tracking-tight">My Profile</h1>
              <p className="text-blue-100 text-lg mt-1">Manage your personal information and preferences</p>
            </div>
          </div>
          <div className="flex items-center gap-6 mt-6">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-medium">{department?.name || 'Department'}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
              <Briefcase className="w-4 h-4" />
              <span className="text-sm font-medium capitalize">{(currentUser?.role || 'member').replace('_',' ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Personal Information</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Avatar Section */}
          <Card className="lg:col-span-1 border-0 shadow-lg bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 dark:from-gray-900 dark:via-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <div className="relative mx-auto w-24 h-24">
                  <Avatar className="w-24 h-24 ring-4 ring-white shadow-xl">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-full"
                        onLoad={() => console.log('✅ Avatar image loaded successfully:', avatarPreview)}
                        onError={(e) => {
                          console.error('❌ Avatar image failed to load:', avatarPreview);
                          console.log('Current avatarPreview:', avatarPreview);
                          console.log('Current currentUser:', currentUser);
                          console.log('Current currentUser.avatar:', currentUser?.avatar);

                          // Try different approaches to load the avatar
                          if (currentUser?.avatar && currentUser.avatar !== avatarPreview) {
                            console.log('🔄 Attempting to reload avatar from currentUser');
                            setAvatarPreview(currentUser.avatar);
                          } else {
                            console.log('💡 Avatar might not exist. User needs to upload one first.');
                            // Clear the preview to show fallback
                            setAvatarPreview('');
                          }
                        }}
                      />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-2xl font-bold">
                        {initials}
                      </AvatarFallback>
                    )}
              </Avatar>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
              </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{(firstName + ' ' + lastName).trim() || 'Your Name'}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{email || 'your.email@company.com'}</p>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSaving}
                    className="w-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => document.getElementById('avatar-input')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  {!avatarPreview && (
                    <p className="text-xs text-gray-500 text-center">
                      No profile photo uploaded yet
                    </p>
                  )}
                  <input
                    id="avatar-input"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
              {avatarFile && (
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      <ImageIcon className="inline w-3 h-3 mr-1" />
                      {avatarFile.name}
                    </div>
                  )}
                  {avatarPreview && !avatarFile && (
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      ✓ Profile photo loaded
                </div>
              )}
            </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Fields Section */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Profile</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">Update your personal information</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    First Name *
                  </Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isSaving}
                    placeholder="Your first name"
                    className="h-11 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Last Name *
                  </Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isSaving}
                    placeholder="Your last name"
                    className="h-11 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Email Address (Read-only)
                  </Label>
                  <Input
                    value={email}
                    readOnly
                    placeholder="you@company.com"
                    type="email"
                    className="h-11 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-75"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Phone Number (Read-only)
                  </Label>
                  <Input
                    value={phone}
                    readOnly
                    placeholder="e.g., +91 98765 43210"
                    className="h-11 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-75"
                  />
              </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="h-11 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
              </div>
            </div>

      {/* Account Security Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Account Security</h2>
              </div>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-white via-red-50/30 to-pink-50/30 dark:from-gray-900 dark:via-red-950/20 dark:to-pink-950/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-gray-900 dark:text-gray-100 font-bold">Change Password</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update your account password regularly</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Current Password *
                </Label>
                {/* <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  For security, you must enter your current password manually
                </p> */}
                <Input
                  type="password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  disabled={isChangingPassword}
                  placeholder="Enter your current password"
                  autoComplete="off"
                  data-form-type="other"
                  className="h-11 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                  New Password
                </Label>
                <Input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  disabled={isChangingPassword}
                  placeholder="Enter new password (min 8 characters)"
                  autoComplete="new-password"
                  className="h-11 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Confirm Password
                </Label>
                <Input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  disabled={isChangingPassword}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  className="h-11 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                  <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">Password Requirements</h4>
                  <ul className="text-xs text-yellow-800 dark:text-yellow-200 mt-1 space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Should be different from current password</li>
                    <li>• Use a mix of letters, numbers, and symbols</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="h-11 px-8 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
