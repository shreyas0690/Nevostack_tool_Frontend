import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Bell,
  HelpCircle,
  Moon,
  Sun,
  Search as SearchIcon,
  BookOpen,
  Sparkles,
  LifeBuoy,
  Keyboard as KeyboardIcon,
  ExternalLink,
  User as UserIcon,
  Settings as SettingsIcon,
  CreditCard,
  Shield,
  Clipboard as ClipboardIcon,
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import useHODManagement from '@/hooks/useHODManagement';

interface ManagerHeaderProps {
  onNavigate?: (tab: string) => void;
}

export default function ManagerHeader({ onNavigate }: ManagerHeaderProps) {
  const { logout, currentUser, loading } = useAuth();
  const { currentTenant, getSystemBranding } = useTenant();
  const { companyData } = useCompany();
  const { setTheme, theme } = useUserTheme();
  const { toast } = useToast();
  const [status, setStatus] = React.useState<'online' | 'away' | 'dnd'>('online');
  const [avatarKey, setAvatarKey] = React.useState(0);
  const [renderKey, setRenderKey] = React.useState(0);
  const [headerUser, setHeaderUser] = React.useState(currentUser);

  console.log('🚀 ManagerHeader render - currentUser:', currentUser, 'headerUser:', headerUser, 'name:', headerUser?.name, 'loading:', loading, 'renderKey:', renderKey);

  // Sync headerUser with currentUser when it changes
  React.useEffect(() => {
    if (currentUser && currentUser !== headerUser) {
      console.log('🔄 ManagerHeader - Syncing headerUser with currentUser:', currentUser);
      setHeaderUser(currentUser);
      setRenderKey(prev => prev + 1);
    }
  }, [currentUser, headerUser]);

  // Always render header, but with appropriate data
  const displayUser = headerUser || currentUser;

  // Debug: Log avatar changes and force re-render
  React.useEffect(() => {
    console.log('🔍 ManagerHeader - displayUser:', displayUser);
    console.log('🔍 ManagerHeader - displayUser.avatar:', displayUser?.avatar);
    console.log('🔍 ManagerHeader - avatarKey:', avatarKey);
    if (displayUser?.avatar) {
      setAvatarKey(prev => prev + 1);
      console.log('🔄 ManagerHeader - Avatar key updated to force re-render');
    } else {
      console.log('ℹ️ ManagerHeader - No avatar, showing initials');
    }
  }, [displayUser?.avatar]);

  // Additional debug: Log any displayUser changes
  React.useEffect(() => {
    console.log('👤 ManagerHeader - displayUser changed:', displayUser);
    console.log('👤 ManagerHeader - displayUser.name:', displayUser?.name);
    console.log('👤 ManagerHeader - displayUser.firstName:', displayUser?.firstName);
    console.log('👤 ManagerHeader - displayUser.lastName:', displayUser?.lastName);
    console.log('👤 ManagerHeader - isAuthenticated:', true); // Since we're in Manager header
    // Force re-render when displayUser changes
    setAvatarKey(prev => prev + 1);
    setRenderKey(prev => prev + 1);
  }, [displayUser]);

  // Use actual company data for regular workspace users
  const getDisplayBranding = () => {
    // If user is SaaS admin, use SaaS branding
    if (currentUser?.role === 'super_admin' && currentUser?.email === 'admin@demo.com') {
      return getSystemBranding();
    }
    
    // For regular workspace users, use actual company data
    if (companyData && companyData.name) {
      return {
        name: `${companyData.name} - Manager Panel`,
        shortName: companyData.name,
        tagline: 'Team Management',
        cleanName: companyData.name,
        systemName: `${companyData.name} Manager Dashboard`
      };
    }
    
    // Fallback to SaaS branding if no company data
    return getSystemBranding();
  };

  const branding = getDisplayBranding();

  const avatarInitials = (() => {
    const name = displayUser?.name || '';
    if (!name) return 'MGR';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0,2).toUpperCase() || 'MGR';
  })();

  // Get user's department from HOD management hook
  const { department: userDepartment } = useHODManagement(displayUser?.departmentId);

  const copyUserId = async () => {
    try {
      await navigator.clipboard.writeText(currentUser?.id || '');
      toast({ title: 'Copied', description: 'User ID copied to clipboard.' });
    } catch (e) {
      toast({ title: 'Copy failed', description: 'Unable to copy user ID.', variant: 'destructive' });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'secondary';
      case 'department_head': return 'default';
      case 'manager': return 'outline';
      default: return 'secondary';
    }
  };

  const formatRole = (role: string) => {
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
              {branding.shortName} - Manager Panel
            </h1>
            <p className="text-xs text-muted-foreground">
              {userDepartment?.name || 'Department'} Management
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 hidden md:flex justify-center">
          <div className="relative w-full max-w-xl">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Search ${userDepartment?.name || 'your department'}...`}
              className="pl-9"
              aria-label="Department search"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1 md:gap-2">
          <SimpleNotificationBell />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                <HelpCircle size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>{branding.shortName} Manager Help & Support</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => window.open('https://nevostack.com/docs/manager', '_blank')}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Manager Documentation
                  <DropdownMenuShortcut>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('https://nevostack.com/support', '_blank')}>
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  Support Center
                  <DropdownMenuShortcut>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('mailto:support@nevostack.com?subject=Manager%20Support%20Request', '_blank')}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Contact Support
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

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
                      {userDepartment.name}
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
                        onLoad={() => console.log('✅ Manager Header Avatar loaded successfully:', displayUser.avatar)}
                        onError={(e) => {
                          console.error('❌ Manager Header Avatar failed to load:', displayUser.avatar);
                          console.log('Current displayUser:', displayUser);
                          // Force a re-render to show fallback
                          setAvatarKey(prev => prev + 1);
                        }}
                      />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                        {avatarInitials}
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
                        <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-sm">
                          {avatarInitials}
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
                            {userDepartment.name}
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