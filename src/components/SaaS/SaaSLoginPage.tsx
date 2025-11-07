import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, User, Eye, EyeOff, Building2, Globe, ArrowLeft, ArrowRight } from 'lucide-react';
import { saasAuthService } from '@/services/saasAuthService';
import { useTenant } from './TenantProvider';
import SaaSCompanyRegistration from './SaaSCompanyRegistration';
import { Tenant } from '@/types/saas';

interface SaaSLoginPageProps {
  onLogin: (success: boolean) => void;
}

export default function SaaSLoginPage({ onLogin }: SaaSLoginPageProps) {
  const { saasConfig } = useTenant();
  const [email, setEmail] = useState('superadmin@nevostack.com');
  const [password, setPassword] = useState('SuperAdmin@2024!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use SaaS Auth Service for backend integration
      const response = await saasAuthService.login({
        email: email.trim(),
        password: password
      });
      
      console.log('✅ SaaS Admin logged in successfully:', response);
      
      // Force page reload to trigger App.tsx authentication check
      setTimeout(() => {
        window.location.href = '/saas/admin';
      }, 1000);
      
      onLogin(true);
    } catch (error: any) {
      console.error('❌ SaaS Login failed:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
      onLogin(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6">
      <div className="w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left: Branding / Illustration */}
        <div className="relative bg-gradient-to-br from-indigo-600 to-sky-500 p-8 flex flex-col justify-center text-white">
          <div className="mb-6">
            <div className="w-28 h-28 bg-white/6 rounded-2xl flex items-center justify-center mb-4 shadow-lg transform transition-all duration-200 hover:scale-105">
              <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center p-2">
                <img src="/nevolog.png" alt="NevoStack Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold">NevoStack SuperAdmin</h2>
            <p className="mt-2 text-indigo-100/90 max-w-xs">Powerful multi-tenant platform to manage all companies, users and subscriptions from one place.</p>
          </div>

          <div className="mt-auto opacity-95">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm">Secure access for Super Admins</p>
              <p className="text-xs mt-1 text-white/80">Last login: {saasAuthService.getSaaSUser()?.email || '—'}</p>
            </div>
          </div>
          <div className="absolute -right-16 -bottom-16 opacity-20">
            <Building2 className="w-72 h-72 text-white" />
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="bg-white p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center">
              <h3 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-sky-500">SuperAdmin</h3>
              <span className="ml-3 inline-block px-2 py-0.5 text-xs font-semibold uppercase rounded bg-indigo-50 text-indigo-700">Panel</span>
            </div>
            <div className="mt-2">
              <span className="inline-block w-16 h-0.5 bg-gradient-to-r from-indigo-200 to-sky-200 rounded" />
            </div>
            <p className="mt-3 text-sm text-gray-500">Sign in to access the NevoStack platform dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm text-gray-700">Email</Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="superadmin@nevostack.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm text-gray-700">Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
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

            <div className="flex items-center justify-between mt-1">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 h-4 w-4 text-indigo-600 rounded border-gray-300"
                />
                Remember me
              </label>
              <a href="#" className="text-sm text-indigo-600 hover:underline">Forgot password?</a>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center" disabled={isLoading}>
              <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-gray-400">
            <div>Default: <span className="font-mono text-gray-700">superadmin@nevostack.com</span></div>
            <div className="font-mono text-gray-700">SuperAdmin@2024!</div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} NevoStack — All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
