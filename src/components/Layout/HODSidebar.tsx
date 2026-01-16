import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  Target,
  User,
  Sparkles,
  Shield,
  Activity,
  TrendingUp,
  X
} from 'lucide-react';
import { useTenant } from '@/components/SaaS/TenantProvider';

interface HODSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-600' },
  { id: 'my-tasks', label: 'My Tasks', icon: Target, color: 'text-green-600' },
  { id: 'tasks', label: 'Department Tasks', icon: ClipboardList, color: 'text-purple-600' },
  { id: 'team', label: 'Team Management', icon: Users, color: 'text-indigo-600' },
  { id: 'meetings', label: 'Meetings', icon: Video, color: 'text-red-600' },
  { id: 'leave', label: 'Leave Requests', icon: Calendar, color: 'text-pink-600' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'text-emerald-600' },
  { id: 'profile', label: 'My Profile', icon: Shield, color: 'text-gray-600' },
];

export default function HODSidebar({ activeTab, onTabChange, isOpen = false, onClose }: HODSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { getSystemBranding } = useTenant();
  const branding = getSystemBranding();
  const { features, hasFeature, hasAnyFeature, isLoading } = useFeatureAccess();

  // Close sidebar on tab change on mobile
  const handleTabClick = (id: string) => {
    onTabChange(id);
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  // Filter menu items based on feature access
  const getVisibleMenuItems = () => {
    return menuItems.filter((item) => {
      const section = item.id as AdminSection;
      const requiredFeatures = FEATURE_SECTION_MAP[section] || [];

      // If no features required, always show
      if (requiredFeatures.length === 0) {
        return true;
      }

      // Check if user has any of the required features
      return hasAnyFeature(requiredFeatures);
    });
  };

  const visibleMenuItems = getVisibleMenuItems();

  // If loading, show skeleton or default items
  if (isLoading) {
    return (
      <div className={cn(
        "bg-card border-r border-border h-screen transition-all duration-300 relative hidden md:block",
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

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 md:hidden flex items-center justify-between border-b border-border mb-2">
        <span className="font-semibold text-lg">Menu</span>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start mb-1 h-12 relative group transition-all duration-200",
                collapsed && "md:justify-center md:px-2",
                isActive && "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 shadow-sm",
                !isActive && "hover:bg-gray-50 dark:hover:bg-gray-800/50"
              )}
              onClick={() => handleTabClick(item.id)}
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

                {(!collapsed || window.innerWidth < 768) && (
                  <span className={cn(
                    "ml-3 font-medium transition-all duration-200",
                    isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100"
                  )}>
                    {item.label}
                  </span>
                )}
              </div>

              {/* Active indicator */}
              {isActive && (!collapsed || window.innerWidth < 768) && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Collapse/Expand Button at Bottom Right (Desktop only) */}
      <div className="hidden md:block absolute bottom-4 right-4">
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

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={cn(
        "bg-card border-r border-border h-screen transition-all duration-300 z-50",
        // Mobile Styles (Default: Fixed Drawer)
        "fixed inset-y-0 left-0 w-64 shadow-2xl transform transition-transform duration-300 ease-in-out z-50",
        isOpen ? "translate-x-0" : "-translate-x-full",

        // Desktop Styles (Override Mobile: Sticky Sidebar)
        "md:translate-x-0 md:transform-none md:sticky md:top-20 md:shadow-none md:block md:z-30 md:h-[calc(100vh-5rem)]",
        collapsed ? "md:w-16" : "md:w-64"
      )}>
        <SidebarContent />
      </div>
    </>
  );
}
