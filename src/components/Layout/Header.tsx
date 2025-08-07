import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, LogOut } from 'lucide-react';
import { currentUser } from '@/data/mockData';
import { useAuth } from '@/components/Auth/AuthProvider';

export default function Header() {
  const { logout } = useAuth();
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
    <header className="bg-card border-b border-border px-6 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">NevoStack Management System</h1>
          <p className="text-sm text-muted-foreground">
            Advanced organizational workflow management
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <Bell size={18} />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-medium text-sm">{currentUser.name}</p>
              <Badge variant={getRoleBadgeVariant(currentUser.role)} className="text-xs">
                {formatRole(currentUser.role)}
              </Badge>
            </div>
            <Avatar>
              <AvatarFallback>
                {currentUser.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </header>
  );
}