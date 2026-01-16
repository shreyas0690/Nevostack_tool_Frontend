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
  Building2,
  Crown
} from 'lucide-react';
import SimpleNotificationBell from '@/components/SimpleNotificationBell';
import { saasAuthService } from '@/services/saasAuthService';
import { useNavigate } from 'react-router-dom';
import * as React from 'react';
import { useSaaSUserTheme } from '@/hooks/useSaaSUserTheme';
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

interface SaaSSuperAdminHeaderProps {
  onTabChange?: (tab: string) => void;
}

export default function SaaSSuperAdminHeader({ onTabChange }: SaaSSuperAdminHeaderProps) {
  const navigate = useNavigate();
  const { setTheme, theme } = useSaaSUserTheme();
  const { toast } = useToast();
  const [status, setStatus] = React.useState<'online' | 'away' | 'dnd'>('online');
  
  // Get current SaaS admin user
  const currentUser = saasAuthService.getSaaSUser();

  const handleLogout = async () => {
    try {
      await saasAuthService.logout();
      toast({ title: 'Success', description: 'Logged out successfully.' });
      navigate('/saas/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({ title: 'Info', description: 'You have been logged out.' });
      navigate('/saas/login');
    }
  };

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
    <header className="sticky top-0 z-40 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-sm">
      <div className="px-3 sm:px-6 py-3">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
            <img
              src="/nevolog.png"
              alt="NevoStack Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-sm"
            />
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl md:text-2xl font-black leading-none bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 dark:from-blue-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent tracking-tight">
                  NevoStack Platform
                </h1>
                <Badge variant="outline" className="text-[11px] px-2 py-0.5 rounded-full border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/70">
                  SaaS Suite
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-[0.08em] uppercase">
                Super Admin Dashboard
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 hidden lg:flex justify-center">
            <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 shadow-sm">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search companies, users, subscriptions..."
                className="pl-10 pr-12 py-2 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Platform search"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2 text-[12px] text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                ⌘K
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <SimpleNotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex h-10 w-10 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200">
                  <HelpCircle size={18} className="text-slate-600 dark:text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Platform Help & Support</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => window.open('https://nevostack.com/docs/platform', '_blank')}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Platform Documentation
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
                  <DropdownMenuItem onClick={() => window.open('mailto:support@nevostack.com?subject=Platform%20Support%20Request', '_blank')}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Contact Support
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Toggle theme" className="h-10 w-10 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200">
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-slate-600 dark:text-slate-400" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-600 dark:text-slate-400" />
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
              <div className="hidden lg:flex items-center gap-2">
                <div className="text-right">
                  <p className="font-semibold text-sm truncate max-w-[180px] text-slate-800 dark:text-slate-200">
                    {currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : ''}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={getRoleBadgeVariant(currentUser?.role || '')} className="text-xs px-2 py-0.5 rounded-full">
                      {formatRole(currentUser?.role || '')}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
                      <Crown className="w-3 h-3 mr-1" />
                      Platform Admin
                    </Badge>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 w-9 h-9 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                        {currentUser ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}` : 'SA'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                            {currentUser ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}` : 'SA'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : ''}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{currentUser?.email}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
                          <Crown className="w-3 h-3 mr-1" />
                          Platform Super Administrator
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => onTabChange?.('settings')} className="cursor-pointer">
                      <UserIcon className="mr-3 h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <span className="font-medium">My Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onTabChange?.('settings')} className="cursor-pointer">
                      <SettingsIcon className="mr-3 h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <span className="font-medium">Platform Settings</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
                    <span className="font-medium">Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}









