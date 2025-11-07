import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Building2
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
import { mockDepartments } from '@/data/mockData';

export default function HRManagerHeader() {
  const { logout, currentUser } = useAuth();
  const { getSystemBranding } = useTenant();
  const { companyData } = useCompany();
  const { setTheme, theme } = useUserTheme();
  const { toast } = useToast();
  const [status, setStatus] = React.useState<'online' | 'away' | 'dnd'>('online');

  // Use actual company data for regular workspace users
  const getDisplayBranding = () => {
    // If user is SaaS admin, use SaaS branding
    if (currentUser?.role === 'super_admin' && currentUser?.email === 'admin@demo.com') {
      return getSystemBranding();
    }
    
    // For regular workspace users, use actual company data
    if (companyData && companyData.name) {
      return {
        name: `${companyData.name} - HR Manager Panel`,
        shortName: companyData.name,
        tagline: 'HR Management',
        cleanName: companyData.name,
        systemName: `${companyData.name} HR Manager Dashboard`
      };
    }
    
    // Fallback to SaaS branding if no company data
    return getSystemBranding();
  };

  const branding = getDisplayBranding();

  // Find user's department
  const userDepartment = currentUser?.departmentId ? 
    mockDepartments.find(d => d.id === currentUser.departmentId) : null;

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
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="px-6 py-3 flex items-center gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white grid place-items-center font-bold shadow-sm">
            HRM
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold leading-tight">
              {branding.shortName} - HR Manager Panel
            </h1>
            <p className="text-xs text-muted-foreground">
              Human Resources Management
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 hidden md:flex justify-center">
          <div className="relative w-full max-w-xl">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search employees, departments..."
              className="pl-9"
              aria-label="HR search"
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
              <DropdownMenuLabel>{branding.shortName} HR Manager Help & Support</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => window.open('https://nevostack.com/docs/hr-manager', '_blank')}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  HR Manager Documentation
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
                <DropdownMenuItem onClick={() => window.open('mailto:support@nevostack.com?subject=HR%20Manager%20Support%20Request', '_blank')}>
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
                <p className="font-medium text-sm truncate max-w-[160px]">{currentUser?.name}</p>
                <div className="flex items-center gap-1">
                  <Badge variant={getRoleBadgeVariant(currentUser?.role || '')} className="text-xs">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 w-9 h-9 rounded-full">
                  <Avatar>
                    <AvatarFallback>
                      {currentUser?.name.split(' ').map(n => n[0]).join('') || 'HRM'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{currentUser?.name}</span>
                    <span className="text-xs text-muted-foreground">{currentUser?.email}</span>
                    <span className="text-xs text-blue-600 font-medium">
                      HR Manager • {branding.shortName}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => {}}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {}}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Preferences
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Shield className="mr-2 h-4 w-4" />
                    Status
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                      <DropdownMenuRadioItem value="online">Online</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="away">Away</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="dnd">Do Not Disturb</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={copyUserId}>
                  <ClipboardIcon className="mr-2 h-4 w-4" />
                  Copy User ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

















