import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Building2, 
  Users, 
  Sparkles, 
  ArrowRight,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

interface RegistrationSuccessProps {
  companyName: string;
  adminName: string;
  adminEmail: string;
  planName: string;
  onLoginClick: () => void;
}

export default function RegistrationSuccess({ 
  companyName, 
  adminName, 
  adminEmail, 
  planName, 
  onLoginClick 
}: RegistrationSuccessProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-green-500 p-4 rounded-full animate-pulse">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            🎉 Registration Successful!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Welcome to NevoStack, <span className="font-semibold text-green-600">{companyName}</span>!
          </p>
          <p className="text-gray-500 dark:text-gray-500">
            Your organization has been set up successfully and is ready to use.
          </p>
        </div>

        {/* Success Card */}
        <Card className="shadow-xl border-green-200 dark:border-green-800">
          <CardHeader className="text-center bg-green-50 dark:bg-green-950">
            <CardTitle className="text-2xl text-green-800 dark:text-green-200 flex items-center justify-center">
              <Sparkles className="h-6 w-6 mr-2" />
              Setup Complete
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              Your NevoStack workspace is ready for your team
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            {/* Company Details */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Company</h3>
                    <p className="text-gray-600 dark:text-gray-400">{companyName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Administrator</h3>
                    <p className="text-gray-600 dark:text-gray-400">{adminName}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                    <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Admin Email</h3>
                    <p className="text-gray-600 dark:text-gray-400">{adminEmail}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg">
                    <Sparkles className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Plan</h3>
                    <p className="text-gray-600 dark:text-gray-400">{planName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
                <ArrowRight className="h-5 w-5 mr-2" />
                What's Next?
              </h3>
              <div className="space-y-3 text-blue-800 dark:text-blue-200">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Check your email for a welcome message and setup instructions</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Login to your dashboard and start adding team members</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Explore features like task management, leave tracking, and more</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Customize your workspace settings and preferences</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={onLoginClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
                size="lg"
              >
                <ArrowRight className="h-5 w-5 mr-2" />
                Go to Login
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = 'mailto:support@nevostack.com'}
                className="px-8 py-3 text-lg"
                size="lg"
              >
                <Mail className="h-5 w-5 mr-2" />
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Need help getting started? Check out our{' '}
            <a href="#" className="text-blue-600 hover:underline">getting started guide</a>
            {' '}or contact us at{' '}
            <a href="mailto:support@nevostack.com" className="text-blue-600 hover:underline">
              support@nevostack.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
