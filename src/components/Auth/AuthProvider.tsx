import { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAttendance } from '@/hooks/useAttendance';
import { User, UserRole } from '@/types/company';
import { authService } from '@/services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  userRole: UserRole | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateCurrentUser: (user: User) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { recordAttendance } = useAttendance();
  let queryClient: any = null;
  try {
    queryClient = useQueryClient();
  } catch (e) {
    // QueryClient not available yet (AuthProvider may be mounted above QueryClientProvider)
    queryClient = null;
  }

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // Check if user is actually authenticated (not just mock data)
        let user = null;
        let isAuthenticated = false;

        // First check if there's a valid authentication token
        const authToken = localStorage.getItem('nevostack_auth');
        const accessToken = localStorage.getItem('accessToken');

        console.log('🔍 AuthProvider.initializeAuth - checking localStorage:');
        console.log('🔍 authToken:', authToken);
        console.log('🔍 accessToken:', accessToken ? 'present' : 'missing');

        // Only proceed if we have proper authentication
        if (authToken === 'true' && accessToken) {
          // Try authService first
          if (authService.isAuthenticated()) {
            user = authService.getCurrentUser();
            // STRICT CHECK: Reject any mock or invalid user data
            if (user && user.email && user.email !== 'john.doe@example.com' && !user.id?.startsWith('mock-')) {
              isAuthenticated = true;
              console.log('✅ Valid user found in authService:', user);
            } else {
              console.log('⚠️ Found invalid/mock user data, rejecting authentication');
              // Clear invalid data
              localStorage.removeItem('nevostack_auth');
              localStorage.removeItem('nevostack_user');
              localStorage.removeItem('user');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              user = null;
              isAuthenticated = false;
            }
          }

          // If not found, try nevostack_user
          if (!user) {
            const storedUser = localStorage.getItem('nevostack_user');
            if (storedUser) {
              user = JSON.parse(storedUser);
              // STRICT CHECK: Reject mock users
              if (user && user.email !== 'john.doe@example.com' && !user.id?.startsWith('mock-')) {
                isAuthenticated = true;
                console.log('User found in nevostack_user:', user);
              } else {
                console.log('⚠️ Found mock user in nevostack_user, clearing');
                localStorage.removeItem('nevostack_user');
                user = null;
                isAuthenticated = false;
              }
            }
          }

          // If still not found, try user key
          if (!user) {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              user = JSON.parse(storedUser);
              // STRICT CHECK: Reject mock users
              if (user && user.email !== 'john.doe@example.com' && !user.id?.startsWith('mock-')) {
                isAuthenticated = true;
                console.log('User found in user key:', user);
              } else {
                console.log('⚠️ Found mock user in user, clearing');
                localStorage.removeItem('user');
                user = null;
                isAuthenticated = false;
              }
            }
          }
        } else {
          console.log('⚠️ No valid authentication found - showing login page');
          // Clear any mock data that might be present
          localStorage.removeItem('nevostack_auth');
          localStorage.removeItem('nevostack_user');
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }

        if (user && isAuthenticated) {
          // Ensure name is properly constructed from firstName/lastName if available
          if (user.firstName && user.lastName && (!user.name || user.name.trim() === '')) {
            user.name = `${user.firstName} ${user.lastName}`.trim();
            console.log('🔄 Constructed name from firstName/lastName:', user.name);
          }

          // Ensure we have a valid name
          if (!user.name || user.name.trim() === '') {
            user.name = user.email ? user.email.split('@')[0] : 'User';
            console.log('🔄 Fallback name set:', user.name);
          }

          console.log('✅ Final user data:', user, 'Name:', user.name, 'Avatar:', user.avatar);
          setIsAuthenticated(true);
          setCurrentUser(user);
          setUserRole(user.role);

          // Sync all localStorage keys
          localStorage.setItem('nevostack_user', JSON.stringify(user));
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('nevostack_auth', 'true');
        } else {
          console.log('⚠️ No authenticated user found - user needs to login');
          setIsAuthenticated(false);
          setCurrentUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid auth state
        authService.logout();
        setIsAuthenticated(false);
        setCurrentUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    console.log('🔐 AuthProvider.login called with:', { username, password });
    try {
      // Try backend authentication first
      try {
        console.log('🔍 Calling authService.login...');
        const response = await authService.login({
          email: username,
          password: password
        });
        console.log('✅ authService.login returned:', response);

        if ((response as any).success && (response as any).user) {
          const respUser: any = (response as any).user;

          // Check if user is active before proceeding
          if (respUser.status !== 'active') {
            throw new Error('Your account is currently inactive. Please contact your administrator.');
          }

          // Extract departmentId from different possible fields in backend response
          let departmentId = respUser.departmentId || respUser.department?.id || respUser.department || respUser.dept?.id || respUser.dept;

          console.log('Login Response User:', respUser);
          console.log('Extracted departmentId:', departmentId);

          const companyId = respUser.companyId || respUser.company?._id || respUser.company || respUser.companyId;
          console.log('🔍 Login - Backend user data:', respUser);
          console.log('🔍 Login - Avatar from backend:', respUser.avatar);

          const user: User = {
            id: respUser.id,
            name: respUser.firstName && respUser.lastName ? `${respUser.firstName} ${respUser.lastName}` : respUser.name || respUser.email.split('@')[0],
            firstName: respUser.firstName,
            lastName: respUser.lastName,
            email: respUser.email,
            role: respUser.role as UserRole,
            isActive: respUser.status === 'active',
            createdAt: new Date(respUser.createdAt || new Date()),
            departmentId: departmentId,
            companyId: companyId,
            avatar: respUser.avatar // Include avatar from backend response
          };

          console.log('✅ Login - Created user object:', user);

          setIsAuthenticated(true);
          setCurrentUser(user);
          setUserRole(user.role);

          // Save to localStorage for persistence
          localStorage.setItem('nevostack_auth', 'true');
          localStorage.setItem('nevostack_user', JSON.stringify(user));
          localStorage.setItem('user', JSON.stringify(user));

          // Save device info if provided
          if (response.device) {
            localStorage.setItem('device', JSON.stringify(response.device));
            localStorage.setItem('deviceId', response.device.deviceId);
          }

          // Record attendance
          recordAttendance(user.id, user.name);

          // Invalidate users query so UI picks up real users immediately after login
          if (queryClient) {
            try {
              queryClient.invalidateQueries({ queryKey: ['users'] });
            } catch (e) {
              console.warn('QueryClient invalidate failed', e);
            }
          }
          // Notify other components (e.g., dialogs) to refetch user-related queries
          try {
            // small delay to ensure tokens/localStorage are fully written before listeners refetch
            setTimeout(() => {
              try { window.dispatchEvent(new Event('nevostack:login')); } catch (e) { /* ignore */ }
            }, 200);
          } catch (e) {
            // ignore
          }

          return true;
        }
      } catch (backendError: any) {
        console.log('❌ Backend authentication failed:', backendError);
        console.log('🔍 Error message:', backendError.message);

        // Re-throw specific backend errors with more descriptive messages
        if (backendError.message) {
          if (backendError.message.includes('Invalid credentials') ||
              backendError.message.includes('Email or password is incorrect')) {
            throw new Error('Invalid credentials');
          } else if (backendError.message.includes('Account locked')) {
            throw new Error('Account locked');
          } else if (backendError.message.includes('Device limit reached')) {
            throw new Error('Device limit reached');
          } else if (backendError.message.includes('inactive') ||
                     backendError.message.includes('not active')) {
            throw new Error('Account inactive');
          } else if (backendError.message.includes('Validation failed')) {
            throw new Error('Validation failed');
          } else if (backendError.message.includes('Too many authentication attempts')) {
            throw new Error('Too many authentication attempts');
          }
        }

        // For network errors or other fetch issues
        if (backendError.message && (
            backendError.message.includes('fetch') ||
            backendError.message.includes('Network') ||
            backendError.message.includes('Failed to fetch')
        )) {
          throw new Error('Network error');
        }

        // Re-throw the original error if we can't categorize it
        throw backendError;
      }

      // If backend authentication fails and we reach here, throw generic error
      throw new Error('Authentication failed');
    } catch (error: any) {
      console.error('Login error:', error);
      // Re-throw the error so LoginPage can handle it with specific toast messages
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Try backend logout first
      if (authService.isAuthenticated()) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Backend logout error:', error);
    } finally {
      // Always clear local state
      setIsAuthenticated(false);
      setCurrentUser(null);
      setUserRole(null);
      localStorage.removeItem('nevostack_auth');
      localStorage.removeItem('nevostack_user');
      localStorage.removeItem('device');
      localStorage.removeItem('deviceId');
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  const updateCurrentUser = (user: User) => {
    console.log('🔄 AuthProvider - updateCurrentUser called with:', user);
    console.log('🔄 AuthProvider - old currentUser:', currentUser);

    // Ensure name is properly constructed
    if (user.firstName && user.lastName && (!user.name || user.name.trim() === '')) {
      user.name = `${user.firstName} ${user.lastName}`.trim();
    }

    // Ensure we have a valid name
    if (!user.name || user.name.trim() === '') {
      user.name = user.email ? user.email.split('@')[0] : 'User';
    }

    setCurrentUser(user);
    setUserRole(user.role);

    // Update all localStorage keys for consistency
    localStorage.setItem('nevostack_user', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('nevostack_auth', 'true');

    console.log('✅ AuthProvider - currentUser updated to:', user, 'Name:', user.name);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, userRole, login, logout, updateCurrentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}