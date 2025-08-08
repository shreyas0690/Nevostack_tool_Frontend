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
  Clipboard as ClipboardIcon
} from 'lucide-react';
import { currentUser } from '@/data/mockData';
import { useAuth } from '@/components/Auth/AuthProvider';
import * as React from 'react';
import { useTheme } from 'next-themes';
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

export default function Header() {
  const { logout } = useAuth();
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();
  const [status, setStatus] = React.useState<'online' | 'away' | 'dnd'>('online');

  const copyUserId = async () => {
    try {
      await navigator.clipboard.writeText(currentUser.id);
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
          <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold shadow-sm">
            N
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold leading-tight">NevoStack Management System</h1>
            <p className="text-xs text-muted-foreground">Advanced organizational workflow management</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 hidden md:flex justify-center">
          <div className="relative w-full max-w-xl">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9"
              aria-label="Global search"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1 md:gap-2">
          <Button variant="ghost" size="sm" className="relative">
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 inline-flex h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                <HelpCircle size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Help & Support</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => window.open('https://nevostack.com/docs', '_blank')}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Documentation
                  <DropdownMenuShortcut>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('https://nevostack.com/changelog', '_blank')}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  What’s New
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
                <DropdownMenuItem onClick={() => window.open('mailto:support@nevostack.com?subject=Support%20Request', '_blank')}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Contact Support
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <KeyboardIcon className="mr-2 h-4 w-4" />
                    Keyboard Shortcuts
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuLabel>Global</DropdownMenuLabel>
                    <DropdownMenuItem>
                      Search
                      <DropdownMenuShortcut>Ctrl + K</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Go to Dashboard
                      <DropdownMenuShortcut>G D</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      Open Help
                      <DropdownMenuShortcut>?</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
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
              <DropdownMenuRadioGroup value={theme as string} onValueChange={(v) => setTheme(v)}>
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
                <p className="font-medium text-sm truncate max-w-[160px]">{currentUser.name}</p>
                <Badge variant={getRoleBadgeVariant(currentUser.role)} className="text-xs">
                  {formatRole(currentUser.role)}
                </Badge>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 w-9 h-9 rounded-full">
                  <Avatar>
                    <AvatarFallback>
                      {currentUser.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{currentUser.name}</span>
                    <span className="text-xs text-muted-foreground">{currentUser.email}</span>
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
                  <DropdownMenuItem onClick={() => {}}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
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
                {(currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                  <DropdownMenuItem onClick={() => toast({ title: 'Admin Panel', description: 'Coming soon.' })}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
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