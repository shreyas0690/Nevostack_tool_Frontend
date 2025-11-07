import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Bell,
  Moon,
  Sun,
  Search as SearchIcon,
  User as UserIcon,
  Building2,
  LogOut
} from 'lucide-react';
import SimpleNotificationBell from '@/components/SimpleNotificationBell';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useTenant } from '@/components/SaaS/TenantProvider';
import { useCompany } from '@/components/Company/CompanyProvider';
import * as React from 'react';
import { useUserTheme } from '@/hooks/useUserTheme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { mockDepartments } from '@/data/mockData';
import useHODManagement from '@/hooks/useHODManagement';

interface MemberHeaderProps {
  onNavigate?: (tab: string) => void;
}

export default function MemberHeader({ onNavigate }: MemberHeaderProps) {
  const { logout, currentUser, loading } = useAuth();
  const [avatarKey, setAvatarKey] = React.useState(0);
  const [renderKey, setRenderKey] = React.useState(0);
  const [headerUser, setHeaderUser] = React.useState(currentUser);

  console.log('🚀 MemberHeader render - currentUser:', currentUser, 'headerUser:', headerUser, 'name:', headerUser?.name, 'loading:', loading, 'renderKey:', renderKey);

  // Sync headerUser with currentUser when it changes
  React.useEffect(() => {
    if (currentUser && currentUser !== headerUser) {
      console.log('🔄 MemberHeader - Syncing headerUser with currentUser:', currentUser);
      setHeaderUser(currentUser);
      setRenderKey(prev => prev + 1);
    }
  }, [currentUser, headerUser]);

  // Always render header, but with appropriate data
  const displayUser = headerUser || currentUser;

  // Debug: Log avatar changes and force re-render
  React.useEffect(() => {
    console.log('🔍 MemberHeader - displayUser:', displayUser);
    console.log('🔍 MemberHeader - displayUser.avatar:', displayUser?.avatar);
    console.log('🔍 MemberHeader - avatarKey:', avatarKey);
    if (displayUser?.avatar) {
      setAvatarKey(prev => prev + 1);
      console.log('🔄 MemberHeader - Avatar key updated to force re-render');
    } else {
      console.log('ℹ️ MemberHeader - No avatar, showing initials');
    }
  }, [displayUser?.avatar]);

  // Additional debug: Log any displayUser changes
  React.useEffect(() => {
    console.log('👤 MemberHeader - displayUser changed:', displayUser);
    console.log('👤 MemberHeader - displayUser.name:', displayUser?.name);
    console.log('👤 MemberHeader - displayUser.firstName:', displayUser?.firstName);
    console.log('👤 MemberHeader - displayUser.lastName:', displayUser?.lastName);
    console.log('👤 MemberHeader - isAuthenticated:', true); // Since we're in member header
    // Force re-render when displayUser changes
    setAvatarKey(prev => prev + 1);
    setRenderKey(prev => prev + 1);
  }, [displayUser]);
  const { getSystemBranding } = useTenant();
  const { companyData } = useCompany();
  const { setTheme, theme } = useUserTheme();
  const { toast } = useToast();

  // Use actual company data for regular workspace users
  const getDisplayBranding = () => {
    // If user is SaaS admin, use SaaS branding
    if (currentUser?.role === 'super_admin' && currentUser?.email === 'admin@demo.com') {
      return getSystemBranding();
    }
    
    // For regular workspace users, use actual company data
    if (companyData && companyData.name) {
      return {
        name: `${companyData.name} - Member Panel`,
        shortName: companyData.name,
        tagline: 'Employee Dashboard',
        cleanName: companyData.name,
        systemName: `${companyData.name} Member Dashboard`
      };
    }
    
    // Fallback to SaaS branding if no company data
    return getSystemBranding();
  };

  const branding = getDisplayBranding();

  // Fetch real department data from backend API
  const { department: realDepartment, isLoading: departmentLoading } = useHODManagement(displayUser?.departmentId);
  
  // Debug logging
  React.useEffect(() => {
    if (displayUser?.departmentId) {
      console.log('MemberHeader - Current user departmentId:', displayUser.departmentId);
      console.log('MemberHeader - Real department from API:', realDepartment);
      console.log('MemberHeader - Department loading:', departmentLoading);
    }
  }, [displayUser?.departmentId, realDepartment, departmentLoading]);
  
  // Fallback to mock data if real department is not available
  const userDepartment = realDepartment || (displayUser?.departmentId ?
    mockDepartments.find(d => d.id === displayUser.departmentId) : null);


  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'secondary';
      case 'department_head': return 'default';
      case 'manager': return 'outline';
      default: return 'secondary';
    }
  };

  const formatRole = (role?: string) => {
    if (!role) return '';
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <header key={`header-${renderKey}`} className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="px-6 py-3 flex items-center gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden shadow-sm">
            <img 
              src="/nevolog.png" 
              alt="NevoStack Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold leading-tight">
              {branding.shortName} - Member Panel
            </h1>
            <p className="text-xs text-muted-foreground">
              {departmentLoading ? 'Loading...' : (userDepartment?.name || 'Department')} Member
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 hidden md:flex justify-center">
          <div className="relative w-full max-w-xl">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Search ${departmentLoading ? 'department' : (userDepartment?.name || 'your department')}...`}
              className="pl-9"
              aria-label="Member search"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1 md:gap-2">
          <SimpleNotificationBell />

          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="Toggle theme">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={theme as string} onValueChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}>
                <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <div className="text-right">
                <p key={`name-${renderKey}`} className="font-medium text-sm truncate max-w-[160px]">{displayUser?.name}</p>
                <div className="flex items-center gap-1">
                  <Badge variant={getRoleBadgeVariant(displayUser?.role || '')} className="text-xs">
                    {formatRole(displayUser?.role || '')}
                  </Badge>
                  {userDepartment && (
                    <Badge variant="outline" className="text-xs">
                      <Building2 className="w-3 h-3 mr-1" />
                      {departmentLoading ? 'Loading...' : userDepartment.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 w-9 h-9 rounded-full">
                  <Avatar>
                    {displayUser?.avatar ? (
                      <img
                        key={`avatar-${avatarKey}-${displayUser.avatar}`}
                        src={displayUser.avatar}
                        alt={displayUser.name || 'User'}
                        className="w-full h-full object-cover rounded-full"
                        onLoad={() => console.log('✅ Header Avatar loaded successfully:', displayUser.avatar)}
                        onError={(e) => {
                          console.error('❌ Header Avatar failed to load:', displayUser.avatar);
                          console.log('Current displayUser:', displayUser);
                          // Force a re-render to show fallback
                          setAvatarKey(prev => prev + 1);
                        }}
                      />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                      {(() => {
                          const name = displayUser?.name || '';
                        if (!name) return 'M';
                          return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0,2).toUpperCase();
                      })()}
                    </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {/* User Info Section */}
                <DropdownMenuLabel className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      {displayUser?.avatar ? (
                        <img
                          src={displayUser.avatar}
                          alt={displayUser.name || 'User'}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm">
                          {(() => {
                            const name = displayUser?.name || '';
                            if (!name) return 'M';
                            return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0,2).toUpperCase();
                          })()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate">{displayUser?.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{displayUser?.email}</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant={getRoleBadgeVariant(displayUser?.role || '')} className="text-[10px] px-1.5 py-0 h-4">
                          {formatRole(displayUser?.role || '')}
                        </Badge>
                        {userDepartment && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                            <Building2 className="w-2.5 h-2.5 mr-1" />
                            {departmentLoading ? '...' : userDepartment.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* Profile & Account */}
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => onNavigate?.('profile')} className="cursor-pointer">
                    <UserIcon className="mr-3 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-sm">My Profile</span>
                      <span className="text-xs text-muted-foreground">View and edit your profile</span>
                    </div>
                    <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/20 border-t border-red-100 dark:border-red-900/30"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Sign Out</span>
                      <span className="text-xs text-red-500/70 dark:text-red-400/70">Log out of your account</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
