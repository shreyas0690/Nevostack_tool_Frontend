import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, User, Eye, EyeOff, Building2, Shield, Zap, Users, CheckCircle } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useCompany } from '@/components/Company/CompanyProvider';
import { useToast } from '@/hooks/use-toast';
import CompanyRegistration from './CompanyRegistration';

interface LoginPageProps {
  onLogin: (success: boolean) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { isCompanyRegistered, setCompanyData } = useCompany();
  const { toast } = useToast();
  // Always show login form first, not registration
  const [showRegistration, setShowRegistration] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 LoginPage.handleLogin called with:', { username, password });
    setIsLoading(true);

    try {
      console.log('🔍 Calling AuthProvider.login...');
      const success = await login(username, password);
      console.log('✅ AuthProvider.login returned:', success);
      if (success) {
        console.log('✅ Login successful, calling onLogin(true)');
        toast({
          title: "Login Successful",
          description: "Welcome back! Redirecting to dashboard...",
          variant: "default",
        });
        onLogin(true);
      } else {
        console.log('❌ AuthProvider.login returned false, calling onLogin(false)');
        toast({
          title: "Login Failed",
          description: "Invalid username or password. Please check your credentials and try again.",
          variant: "destructive",
        });
        // Clear any stale authentication data
        localStorage.removeItem('nevostack_auth');
        localStorage.removeItem('nevostack_user');
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        onLogin(false);
      }
    } catch (error: any) {
      console.error('❌ LoginPage.handleLogin error:', error);
      console.log('🔍 Error message:', error.message);
      console.log('🔍 Calling onLogin(false) due to error');
      // Clear any stale authentication data
      localStorage.removeItem('nevostack_auth');
      localStorage.removeItem('nevostack_user');
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      // Handle specific error types
      let errorTitle = "Login Failed";
      let errorDescription = "Authentication failed. Please check your credentials and try again.";

      if (error.message) {
        if (error.message.includes('Invalid credentials') || error.message.includes('Email or password is incorrect')) {
          errorTitle = "Invalid Credentials";
          errorDescription = "The username or password you entered is incorrect. Please try again.";
        } else if (error.message.includes('Account locked')) {
          errorTitle = "Account Locked";
          errorDescription = "Your account has been temporarily locked due to multiple failed login attempts. Please contact support or try again later.";
        } else if (error.message.includes('Device limit reached')) {
          errorTitle = "Device Limit Exceeded";
          errorDescription = "You have reached the maximum number of active devices. Please logout from another device first.";
        } else if (error.message.includes('inactive') || error.message.includes('not active')) {
          errorTitle = "Account Inactive";
          errorDescription = "Your account is currently inactive. Please contact your administrator.";
        } else if (error.message.includes('Validation failed')) {
          errorTitle = "Validation Error";
          errorDescription = "Please check your input and try again.";
        } else if (error.message.includes('Too many authentication attempts')) {
          errorTitle = "Rate Limited";
          errorDescription = "Too many login attempts. Please wait a few minutes before trying again.";
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorTitle = "Connection Error";
          errorDescription = "Unable to connect to the server. Please check your internet connection and try again.";
        }
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });

      onLogin(false);
    }

    setIsLoading(false);
  };

  const handleRegistrationComplete = () => {
    setShowRegistration(false);
  };

  const handleGoToLogin = () => {
    setShowRegistration(false);
  };

  // Show company registration only if explicitly requested
  if (showRegistration) {
    return <CompanyRegistration 
      onSuccess={handleRegistrationComplete} 
      onCancel={handleGoToLogin}
    />;
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Left side - Welcome/Features */}
      <div className="flex-1 hidden lg:flex items-center justify-center p-12 relative z-10">
        <div className="max-w-lg text-white">
          <div className="flex items-center mb-8">
            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center shadow-2xl p-2">
              <img src="/nevolog.png" alt="NevoStack" className="w-full h-full object-contain" />
            </div>
            <div className="ml-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                NevoStack
              </h1>
              <p className="text-purple-200 text-lg">Enterprise Management Platform</p>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-6 leading-tight">
            Powerful Tools for
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> Modern Teams</span>
          </h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <span className="text-purple-100 font-medium">Advanced Analytics & Reporting</span>
                <p className="text-purple-200/80 text-sm">Real-time dashboards, performance metrics, and comprehensive insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <span className="text-purple-100 font-medium">Role-Based Access Control</span>
                <p className="text-purple-200/80 text-sm">6 user roles with hierarchical permissions and security</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <span className="text-purple-100 font-medium">Enterprise-Grade Security</span>
                <p className="text-purple-200/80 text-sm">JWT authentication, device tracking, and advanced security protocols</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <span className="text-purple-100 font-medium">Real-time Team Collaboration</span>
                <p className="text-purple-200/80 text-sm">Live notifications, task management, and meeting scheduling</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center shadow-2xl p-2">
                <img src="/nevolog.png" alt="NevoStack" className="w-full h-full object-contain" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-white to-blue-300 mb-2">NevoStack</h1>
            <p className="text-purple-200">Enterprise Management Platform</p>
          </div>

          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold text-white mb-2">
                Welcome Back
              </CardTitle>
              <p className="text-purple-200">
                Sign in to access your dashboard
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white font-medium">
                    Username
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-purple-300 group-focus-within:text-purple-200 transition-colors" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-purple-300 focus:border-purple-400 focus:ring-purple-400/20 backdrop-blur-sm transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-medium">
                    Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-purple-300 group-focus-within:text-purple-200 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-purple-300 focus:border-purple-400 focus:ring-purple-400/20 backdrop-blur-sm transition-all duration-200"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-8 w-8 p-0 text-purple-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>


                <div className="flex items-center justify-between">
                  <label className="flex items-center text-sm text-purple-200">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="mr-2 h-4 w-4 text-indigo-600 rounded border-gray-300"
                    />
                    Remember me
                  </label>
                  <a href="#" className="text-sm text-purple-200 hover:underline">Forgot password?</a>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Demo Credentials */}
              {/* <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
                <p className="text-xs text-purple-200 text-center mb-3 font-semibold">
                  💡 Demo Credentials - Try Different Roles:
                </p>
                <div className="space-y-2 text-xs text-purple-300">
                  <div className="flex justify-between">
                    <span>👨‍💼 Admin:</span>
                    <span className="font-mono">test@test.com / test123</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🏢 HOD:</span>
                    <span className="font-mono">hod@test.com / test123</span>
                  </div>
                  <div className="flex justify-between">
                    <span>👥 Manager:</span>
                    <span className="font-mono">manager@test.com / test123</span>
                  </div>
                  <div className="flex justify-between">
                    <span>👤 Member:</span>
                    <span className="font-mono">member@test.com / test123</span>
                  </div>
                  <div className="flex justify-between">
                    <span>👩‍💼 HR:</span>
                    <span className="font-mono">hr@test.com / test123</span>
                  </div>
                </div>
              </div> */}

              <div className="pt-6 border-t border-white/10">
                <Button 
                  variant="outline" 
                  onClick={() => setShowRegistration(true)}
                  className="w-full h-10 bg-white/5 border-white/20 text-purple-200 hover:bg-white/10 hover:text-white transition-all duration-200"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Register Your Company
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-8 space-y-4">
            <div className="text-purple-300/80">
              <p>New to NevoStack? <button onClick={() => window.location.href = '/register'} className="text-purple-200 hover:text-white underline font-medium">Register Your Company</button></p>
            </div>
            <div className="text-purple-300/80">
              <p>© 2025 NevoStack Management System</p>
              <p className="text-xs mt-2">
                <button onClick={() => window.location.href = '/saas/login'} className="text-purple-200 hover:text-white underline font-medium">Platform Admin Login</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}