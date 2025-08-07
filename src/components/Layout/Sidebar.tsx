import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  ClipboardList, 
  Calendar,
  CalendarDays,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Video,
  Clock
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'comprehensive', label: 'All Management', icon: Building2 },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'meetings', label: 'Meetings', icon: Video },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'leave', label: 'Leave Management', icon: Calendar },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "bg-card border-r border-border h-screen transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h2 className="text-lg font-semibold">NevoStack</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>
      </div>
      
      <nav className="p-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start mb-1 h-10",
                collapsed && "justify-center px-2"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon size={18} />
              {!collapsed && <span className="ml-2">{item.label}</span>}
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
