import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  UserCheck,
  TrendingUp,
  ShieldCheck,
  Cog,
  Building,
  Gamepad2
} from 'lucide-react';
import { useTenant } from '@/components/SaaS/TenantProvider';

interface SaaSSuperAdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-600' },
  { id: 'companies', label: 'Companies', icon: Building, color: 'text-green-600' },
  { id: 'users', label: 'All Users', icon: UserCheck, color: 'text-purple-600' },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, color: 'text-orange-600' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'text-indigo-600' },
  { id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck, color: 'text-red-600' },
  { id: 'settings', label: 'Settings', icon: Cog, color: 'text-gray-600' },
  { id: 'games', label: 'Games', icon: Gamepad2, color: 'text-pink-600' },
];

export default function SaaSSuperAdminSidebar({ activeTab, onTabChange }: SaaSSuperAdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { getSystemBranding } = useTenant();
  const branding = getSystemBranding();

  // Proper resize listener for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-r border-slate-200 dark:border-slate-700 h-full transition-all duration-300 shadow-lg relative flex flex-col",
        // Mobile: fixed positioning with slide animation
        "lg:relative lg:translate-x-0",
        mobileOpen ? "fixed left-0 top-0 z-50 w-64 translate-x-0" : "fixed left-0 top-0 z-50 w-64 -translate-x-full lg:translate-x-0",
        // Desktop: normal width behavior
        collapsed ? "lg:w-16" : "lg:w-64"
      )}>

        <nav className="p-3 space-y-1 flex-1 overflow-hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start h-12 rounded-lg transition-all duration-200 group",
                  collapsed && !isMobile && "justify-center px-2",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:from-blue-600 hover:to-purple-700"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-sm"
                )}
                onClick={() => {
                  onTabChange(item.id);
                  // Close mobile menu when item is selected
                  setMobileOpen(false);
                }}
              >
                <Icon
                  size={20}
                  className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-white" : item.color,
                    !isActive && "group-hover:scale-110"
                  )}
                />
                {(!collapsed || isMobile) && (
                  <span className={cn(
                    "ml-3 font-medium transition-colors duration-200",
                    isActive ? "text-white" : "text-slate-700 dark:text-slate-300"
                  )}>
                    {item.label}
                  </span>
                )}
              </Button>
            );
          })}
        </nav>

        {/* Collapse/Expand Button at Bottom Right - Hidden on mobile */}
        <div className="absolute bottom-4 right-4 hidden lg:block">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-10 w-10 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full shadow-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>

      </div>

      {/* Mobile Menu Button - Only visible on mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="h-10 w-10 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full shadow-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
          title="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
      </div>
    </>
  );
}
