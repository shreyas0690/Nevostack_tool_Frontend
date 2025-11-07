import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFeatureAccess, FEATURE_SECTION_MAP, AdminSection } from '@/hooks/useFeatureAccess';
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

interface MemberSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-600' },
  { id: 'my-tasks', label: 'My Tasks', icon: Target, color: 'text-green-600' },
  { id: 'meetings', label: 'Meetings', icon: Video, color: 'text-red-600' },
  { id: 'leave', label: 'Leave Requests', icon: Calendar, color: 'text-pink-600' },
  { id: 'profile', label: 'My Profile', icon: UserCheck, color: 'text-gray-600' },
];

export default function MemberSidebar({ activeTab, onTabChange }: MemberSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { myTasks, departmentTasks, urgentTasks, overdueTasks } = useTaskCounts();
  const { getSystemBranding } = useTenant();
  const branding = getSystemBranding();
  const { features, hasFeature, hasAnyFeature, isLoading } = useFeatureAccess();

  // Filter menu items based on feature access
  const getVisibleMenuItems = () => {
    console.log('🔍 Member Sidebar - Current features:', features);
    console.log('🔍 Member Sidebar - All menu items:', menuItems.map(item => item.id));
    
    const filtered = menuItems.filter((item) => {
      const section = item.id as AdminSection;
      const requiredFeatures = FEATURE_SECTION_MAP[section] || [];
      
      console.log(`🔍 Member Sidebar - Checking section: ${section}`);
      console.log(`🔍 Member Sidebar - Required features: ${requiredFeatures}`);
      
      // If no features required, always show
      if (requiredFeatures.length === 0) {
        console.log(`✅ Member Sidebar - ${section}: No features required - showing`);
        return true;
      }
      
      // Check if user has any of the required features
      const hasAccess = hasAnyFeature(requiredFeatures);
      console.log(`🔍 Member Sidebar - ${section}: Has access: ${hasAccess}`);
      
      return hasAccess;
    });
    
    console.log('🔍 Member Sidebar - Visible menu items:', filtered.map(item => item.id));
    console.log('🔍 Member Sidebar - Hidden menu items:', menuItems.filter(item => !filtered.includes(item)).map(item => item.id));
    return filtered;
  };

  const visibleMenuItems = getVisibleMenuItems();

  // If loading, show skeleton or default items
  if (isLoading) {
    return (
      <div className={cn(
        "bg-card border-r border-border h-screen transition-all duration-300 relative",
        collapsed ? "w-16" : "w-64"
      )}>
        <nav className="p-2 space-y-1">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-card border-r border-border h-screen transition-all duration-300 relative",
      collapsed ? "w-16" : "w-64"
    )}>
      <nav className="p-2 space-y-1">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start mb-1 h-12 relative group transition-all duration-200",
                collapsed && "justify-center px-2",
                isActive && "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 shadow-sm",
                !isActive && "hover:bg-gray-50 dark:hover:bg-gray-800/50"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <div className={cn(
                "flex items-center transition-all duration-200",
                isActive ? item.color : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100"
              )}>
                <div className={cn(
                  "p-1.5 rounded-lg transition-all duration-200",
                  isActive ? "bg-white dark:bg-gray-800 shadow-sm" : "group-hover:bg-white/50 dark:group-hover:bg-gray-800/50"
                )}>
                  <Icon size={20} className="transition-transform duration-200 group-hover:scale-110" />
                </div>
                
                {!collapsed && (
                  <span className={cn(
                    "ml-3 font-medium transition-all duration-200",
                    isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100"
                  )}>
                    {item.label}
                  </span>
                )}
              </div>
              
              {/* Active indicator */}
              {isActive && !collapsed && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Collapse/Expand Button at Bottom Right */}
      <div className="absolute bottom-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 transition-all duration-200"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>
    </div>
  );
}
