import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  ClipboardList, 
  Calendar,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Video,
  UserCheck,
  Target
} from 'lucide-react';
import { useTaskCounts } from '@/hooks/useTaskCounts';
import { useTenant } from '@/components/SaaS/TenantProvider';

interface HRManagerSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'leave', label: 'Leave Management', icon: Calendar },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

export default function HRManagerSidebar({ activeTab, onTabChange }: HRManagerSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { myTasks, departmentTasks, urgentTasks, overdueTasks } = useTaskCounts();
  const { getSystemBranding } = useTenant();
  const branding = getSystemBranding();

  return (
    <div className={cn(
      "bg-card border-r border-border h-screen transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="text-lg font-semibold text-indigo-600">{branding.shortName}</h2>
              <p className="text-xs text-muted-foreground">HR Manager Management</p>
            </div>
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
              <div className="relative">
                <Icon size={18} />
                
                {/* Collapsed state badges (circles) */}
                {collapsed && item.id === 'users' && myTasks > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {myTasks > 99 ? '99+' : myTasks}
                  </div>
                )}
                {collapsed && item.id === 'leave' && departmentTasks > 0 && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {departmentTasks > 99 ? '99+' : departmentTasks}
                  </div>
                )}
              </div>
              
              {!collapsed && (
                <>
                  <span className="ml-2">{item.label}</span>
                  
                  {/* Expanded state badges */}
                  {item.id === 'users' && myTasks > 0 && (
                    <Badge variant="outline" className="ml-auto bg-red-50 text-red-700 border-red-200 font-semibold">
                      {myTasks}
                    </Badge>
                  )}
                  {item.id === 'leave' && departmentTasks > 0 && (
                    <Badge variant="outline" className="ml-auto bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                      {departmentTasks}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          );
        })}
      </nav>


    </div>
  );
}



