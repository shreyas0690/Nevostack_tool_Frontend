import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useTenant } from "@/components/SaaS/TenantProvider";
import SaaSLoginPage from "@/components/SaaS/SaaSLoginPage";
import LoginPage from "@/components/Auth/LoginPage";
import Index from "./pages/Index";
import HODIndex from "./pages/HODIndex";
import ManagerIndex from "./pages/ManagerIndex";
import MemberIndex from "./pages/MemberIndex";
import HRIndex from "./pages/HRIndex";
import HRManagerIndex from "./pages/HRManagerIndex";
import SaaSSuperAdminIndex from "./pages/SaaSSuperAdminIndex";
import SaaSLogin from "./pages/SaaSLogin";
import SaaSAdmin from "./pages/SaaSAdmin";
import SaaSNavigationPage from "./pages/SaaSNavigation";
import SaaSSuperAdminLoginPage from "./pages/SaaSSuperAdminLoginPage";
import NotFound from "./pages/NotFound";
import SaaSAuthTest from "./components/SaaS/SaaSAuthTest";
import SaaSRoutingDebug from "./components/SaaS/SaaSRoutingDebug";
import NotificationTest from "./components/NotificationTest";
import NotificationDebug from "./components/NotificationDebug";
import NotificationStatus from "./components/NotificationStatus";
import CompanyRegistration from "./components/Auth/CompanyRegistration";
import { debugSaaSAuth } from "./utils/saasAuthDebug";
import { saasAuthService } from "./services/saasAuthService";

// Ensure React is available globally
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// AppContent component that handles auth logic
const AppContent = () => {
  const { isAuthenticated, login, userRole, currentUser, loading } = useAuth();

  // Safely use tenant hook with fallback
  let currentTenant = null;
  let isTenantActive = true;
  let getSystemName = () => 'NevoStack';

  try {
    const tenantData = useTenant();
    currentTenant = tenantData.currentTenant;
    isTenantActive = tenantData.isTenantActive;
    getSystemName = tenantData.getSystemName;
  } catch (error) {
    console.warn('TenantProvider not available, using defaults:', error);
  }
  
  // Check for SaaS admin authentication
  const [isSaaSAuthenticated, setIsSaaSAuthenticated] = React.useState(false);
  const [saasUser, setSaasUser] = React.useState(null);

  // Check SaaS admin authentication on app start
  React.useEffect(() => {
    const checkSaaSAuth = () => {
      try {
        // First try using saasAuthService
        const isAuthenticated = saasAuthService.isSaaSAuthenticated();
        const user = saasAuthService.getSaaSUser();
        
        console.log('🔍 Checking SaaS auth:', { isAuthenticated, user: user?.email });
        debugSaaSAuth(); // Debug authentication state
        setIsSaaSAuthenticated(isAuthenticated);
        setSaasUser(user);
      } catch (error) {
        console.log('❌ Error checking SaaS auth with service, trying direct localStorage check:', error);
        
        // Fallback: Check localStorage directly
        try {
          const saasToken = localStorage.getItem('saas_access_token');
          const saasUser = localStorage.getItem('saas_user');
          
          if (saasToken && saasUser) {
            const user = JSON.parse(saasUser);
            console.log('🔍 Direct localStorage check - SaaS auth found:', { user: user?.email });
            setIsSaaSAuthenticated(true);
            setSaasUser(user);
          } else {
            console.log('🔍 No SaaS auth found in localStorage');
            setIsSaaSAuthenticated(false);
            setSaasUser(null);
          }
        } catch (fallbackError) {
          console.log('❌ Fallback SaaS auth check failed:', fallbackError);
          setIsSaaSAuthenticated(false);
          setSaasUser(null);
        }
      }
    };
    
    checkSaaSAuth();
  }, []);

  // Clear any existing mock data on app start
  React.useEffect(() => {
    // Only clear if there's no valid authentication
    const authToken = localStorage.getItem('nevostack_auth');
    const accessToken = localStorage.getItem('accessToken');
    const saasToken = localStorage.getItem('saas_access_token');
    
    if (!authToken || !accessToken) {
      // Only clear regular auth data if no SaaS auth exists
      if (!saasToken) {
        console.log('🧹 Clearing any existing mock data...');
        localStorage.removeItem('nevostack_auth');
        localStorage.removeItem('nevostack_user');
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
  }, []);

  // Update document title with company name
  React.useEffect(() => {
    if (currentTenant) {
      document.title = getSystemName();
    } else {
      document.title = 'NevoStack - Organization Management System';
    }
  }, [currentTenant, getSystemName]);

  // Check if tenant is active (for SaaS functionality)
  if (!isTenantActive && currentTenant) {
    const isTrialExpired = currentTenant.subscriptionStatus === 'trial' &&
                          currentTenant.trialEndsAt &&
                          new Date(currentTenant.trialEndsAt) <= new Date();

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-red-800 mb-4">
            {isTrialExpired ? 'Trial Expired' : 'Subscription Inactive'}
          </h1>
          <p className="text-red-600 mb-4">
            {isTrialExpired ? (
              <>
                Your 14-day trial period ended on{' '}
                <span className="font-semibold">
                  {new Date(currentTenant.trialEndsAt).toLocaleDateString()}
                </span>
                . Please upgrade your subscription to continue using the platform.
              </>
            ) : (
              'Your subscription is currently inactive. Please contact support to reactivate your account.'
            )}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Refresh Page
            </button>
            {isTrialExpired && (
              <button
                onClick={() => window.open('mailto:support@nevostack.com?subject=Trial Upgrade Request', '_blank')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Upgrade Now
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Check if SaaS admin is authenticated first - but only for SaaS routes
  if (isSaaSAuthenticated && saasUser && window.location.pathname.startsWith('/saas')) {
    console.log('✅ SaaS Admin authenticated, showing SaaS dashboard');
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/saas/login" element={<SaaSLogin />} />
          <Route path="/saas/super-admin/login" element={<SaaSSuperAdminLoginPage />} />
          <Route path="/saas/admin" element={<SaaSAdmin />} />
          <Route path="/saas/auth-test" element={<SaaSAuthTest />} />
          <Route path="/saas/*" element={<h1>Not found</h1>} />
        </Routes>
      </BrowserRouter>
    );
  }

  if (!isAuthenticated) {
    // Show loading state while checking authentication
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-700">Loading...</p>
            <p className="text-sm text-gray-500 mt-2">Checking authentication status</p>
          </div>
        </div>
      );
    }
    
    // Check if we're on SaaS routes - show appropriate SaaS login
    if (window.location.pathname.startsWith('/saas')) {
      // If on SaaS admin route, show super admin login
      if (window.location.pathname === '/saas/admin') {
        return <SaaSSuperAdminLoginPage />;
      }
      // Otherwise show regular SaaS login
      return <SaaSLoginPage onLogin={(success) => success} />;
    }
    // Otherwise show regular workspace login
    return <LoginPage onLogin={(success) => success} />;
  }

  // Route based on user role
  const renderDashboard = () => {
    console.log('🔍 Routing Dashboard - User Role:', userRole, 'User Email:', currentUser?.email);
    
    // Only specific platform admin sees SaaS Super Admin Dashboard
    if (userRole === 'super_admin' && currentUser?.email === 'admin@demo.com') {
      console.log('→ Routing to SaaS Super Admin Dashboard');
      return <SaaSSuperAdminIndex />;
    }
    
    // For general admin users (including those with department_head role but admin privileges)
    if (userRole === 'admin' || userRole === 'super_admin') {
      console.log('→ Routing to Regular Admin Dashboard');
      return <Index />;
    }
    
    if (userRole === 'department_head') {
      console.log('→ Routing to Department Head Dashboard');
      return <HODIndex />;
    }
    if (userRole === 'manager') {
      console.log('→ Routing to Manager Dashboard');
      return <ManagerIndex />;
    }
    if (userRole === 'member') {
      console.log('→ Routing to Member Dashboard');
      return <MemberIndex />;
    }
    if (userRole === 'hr') {
      console.log('→ Routing to HR Dashboard');
      return <HRIndex />;
    }
    if (userRole === 'hr_manager') {
      console.log('→ Routing to HR Manager Dashboard');
      return <HRManagerIndex />;
    }
    
    // Fallback: All other users see regular company admin dashboard
    console.log('→ Routing to Default Admin Dashboard (fallback)');
    return <Index />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={renderDashboard()} />
        <Route path="/register" element={<CompanyRegistration />} />
        <Route path="/saas" element={<SaaSNavigationPage />} />
        <Route path="/saas/login" element={<SaaSLogin />} />
        <Route path="/saas/super-admin/login" element={<SaaSSuperAdminLoginPage />} />
        <Route path="/saas/admin" element={<SaaSAdmin />} />
        <Route path="/saas/auth-test" element={<SaaSAuthTest />} />
        <Route path="/saas/routing-debug" element={<SaaSRoutingDebug />} />
        <Route path="/notification-test" element={<NotificationTest />} />
        <Route path="/notification-debug" element={<NotificationDebug />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <NotificationStatus />
    </BrowserRouter>
  );
};

// Main App component (no auth hooks here)
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HotToaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
