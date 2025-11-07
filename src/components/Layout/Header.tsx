import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
  Building2,
  Menu,
  X
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
import { mockDepartments } from '@/data/mockData';

interface HeaderProps {
  onTabChange?: (tab: string) => void;
  onMenuToggle?: () => void;
  isMobile?: boolean;
}

export default function Header({ onTabChange, onMenuToggle, isMobile = false }: HeaderProps) {
  const { logout, currentUser } = useAuth();
  const { getSystemBranding } = useTenant();
  const { companyData } = useCompany();
  const { setTheme, theme } = useUserTheme();

  // Use actual company data for regular workspace users
  const getDisplayBranding = () => {
    // If user is SaaS admin, use SaaS branding
    if (currentUser?.role === 'super_admin' && currentUser?.email === 'admin@demo.com') {
      return getSystemBranding();
    }
    
    // For regular workspace users, use actual company data
    if (companyData && companyData.name) {
      return {
        name: `${companyData.name} - Admin Panel`,
        shortName: companyData.name,
        tagline: 'System Administration',
        cleanName: companyData.name,
        systemName: `${companyData.name} Management System`
      };
    }
    
    // Fallback to SaaS branding if no company data
    return getSystemBranding();
  };

  const branding = getDisplayBranding();

  // Find user's department
  const userDepartment = currentUser?.departmentId ? 
    mockDepartments.find(d => d.id === currentUser.departmentId) : null;


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
    if (!role) return '';
    return role.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="px-3 sm:px-4 lg:px-6 py-3 flex items-center gap-2 sm:gap-3">
        {/* Mobile Menu Button */}
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 mr-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
            <img 
              src="/nevolog.png" 
              alt="NevoStack Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base lg:text-xl font-bold leading-tight truncate">
              <span className="hidden sm:inline">{branding.shortName} - Admin Panel</span>
              <span className="sm:hidden">{branding.shortName}</span>
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              System Administration
            </p>
          </div>
        </div>

        {/* Search - Hidden on mobile */}
        <div className="flex-1 hidden lg:flex justify-center">
          <div className="relative w-full max-w-xl">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search system, users, departments..."
              className="pl-9"
              aria-label="System search"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Notifications */}
          <div className="relative">
          <SimpleNotificationBell />
          </div>
          
          {/* Help & Support */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:scale-105 transition-all duration-200"
                title="Help & Support"
              >
                <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Help & Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get help with {branding.shortName}</p>
              </div>
              <div className="p-2">
              <DropdownMenuGroup>
                  <DropdownMenuItem 
                    onClick={() => window.open('https://nevostack.com/docs/admin', '_blank')}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Documentation</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Admin guides and tutorials</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => window.open('https://nevostack.com/support', '_blank')}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <LifeBuoy className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Support Center</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Get technical support</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => window.open('mailto:support@nevostack.com?subject=Admin%20Support%20Request', '_blank')}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <HelpCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Contact Support</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Send us a message</div>
                    </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 w-9 p-0 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:scale-105 transition-all duration-200"
                title="Theme Settings"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-purple-600 dark:text-purple-400" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-purple-600 dark:text-purple-400" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Theme</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred theme</p>
              </div>
              <div className="p-2">
              <DropdownMenuRadioGroup value={theme as string} onValueChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}>
                  <DropdownMenuRadioItem value="light" className="flex items-center gap-3 p-2 rounded-lg">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    <div>
                      <div className="font-medium">Light</div>
                      <div className="text-xs text-gray-500">Clean and bright</div>
                    </div>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark" className="flex items-center gap-3 p-2 rounded-lg">
                    <Moon className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">Dark</div>
                      <div className="text-xs text-gray-500">Easy on the eyes</div>
                    </div>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system" className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-blue-500"></div>
                    <div>
                      <div className="font-medium">System</div>
                      <div className="text-xs text-gray-500">Follow system preference</div>
                    </div>
                  </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] lg:max-w-[160px]">{currentUser?.name}</p>
                <div className="flex items-center gap-1">
                  <Badge variant={getRoleBadgeVariant(currentUser?.role || '')} className="text-xs">
                    {formatRole(currentUser?.role || '')}
                  </Badge>
                  {userDepartment && (
                    <Badge variant="outline" className="text-xs hidden lg:flex">
                      <Building2 className="w-3 h-3 mr-1" />
                      {userDepartment.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
                  <Avatar className="w-10 h-10 border-2 border-gray-200 dark:border-gray-600">
                  {currentUser?.avatar ? (
                    <AvatarImage src={currentUser.avatar} alt={currentUser?.name} />
                  ) : (
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('') : 'A'}
                    </AvatarFallback>
                  )}
                </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-4 border-white dark:border-gray-800 shadow-lg">
                      {currentUser?.avatar ? (
                        <AvatarImage src={currentUser.avatar} alt={currentUser?.name} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                          {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('') : 'A'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {currentUser?.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {currentUser?.email}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs font-medium">
                          <Shield className="w-3 h-3 mr-1" />
                          {formatRole(currentUser?.role || '')}
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
                </div>

                {/* Menu Items */}
                <div className="p-2">
                <DropdownMenuGroup>
                    <DropdownMenuItem 
                      onClick={() => onTabChange?.('settings')}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">My Profile</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">View and edit profile</div>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => onTabChange?.('settings')}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <SettingsIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Preferences</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Settings and preferences</div>
                      </div>
                  </DropdownMenuItem>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator className="my-2" />
                  
                  <DropdownMenuItem 
                    onClick={logout}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                  >
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">Logout</div>
                      <div className="text-xs text-red-500 dark:text-red-400">Sign out of your account</div>
                    </div>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}