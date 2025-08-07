import { createContext, useContext, useState, useEffect } from 'react';
import { useAttendance } from '@/hooks/useAttendance';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { recordAttendance } = useAttendance();

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const stored = localStorage.getItem('nevostack_auth');
    if (stored === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem('nevostack_auth', 'true');
    // Record attendance when user logs in
    recordAttendance('admin', 'Admin User');
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('nevostack_auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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