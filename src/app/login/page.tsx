'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@/lib/hooks';
import { apiUtils } from '@/lib/api';
import { useAuth } from '@/lib/context';
import type { LoginFormData } from '@/lib/types';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [sessionTimeoutMessage, setSessionTimeoutMessage] = useState<string | null>(null);

  // Check for session timeout redirect
  useEffect(() => {
    const reason = searchParams.get('reason');
    const message = searchParams.get('message');
    
    if (reason === 'session-timeout' && message) {
      setSessionTimeoutMessage(decodeURIComponent(message));
      // Clear the message from URL after displaying using Next.js router
      const params = new URLSearchParams(searchParams.toString());
      params.delete('reason');
      params.delete('message');
      const newUrl = params.toString() ? `?${params.toString()}` : '';
      router.replace(newUrl || '/login', { scroll: false });
    }
  }, [searchParams, router]);

  const { values, errors, handleChange, handleSubmit, isValid } = useForm<LoginFormData>({
    initialValues: {
      identifier: '',
      password: '',
    },
    validate: (values) => {
      const errors: Partial<LoginFormData> = {};
      
      if (!values.identifier) {
        errors.identifier = 'Email or phone number is required';
      } else if (values.identifier.includes('@')) {
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(values.identifier)) {
          errors.identifier = 'Please enter a valid email address';
        }
      } else {
        // Phone validation (Bangladesh format)
        const phoneRegex = /^(\+88)?01[3-9]\d{8}$/;
        if (!phoneRegex.test(values.identifier)) {
          errors.identifier = 'Please enter a valid phone number (01XXXXXXXXX)';
        }
      }
      
      if (!values.password) {
        errors.password = 'Password is required';
      }
      
      return errors;
    },
    onSubmit: async (values) => {
      setIsLoading(true);
      setError('');
      
      try {
        await login(values);
        
        // Check for redirect parameter first
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect');
        
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          // Check if user is admin/staff and redirect accordingly
          const userFromToken = apiUtils.getUserFromToken();
          if (userFromToken?.role === 'admin' || userFromToken?.role === 'staff') {
            router.push('/admin');
          } else {
            router.push('/account');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-4 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-red-700">Scarlet</h1>
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-red-700 hover:text-red-500">
              create a new account
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 mx-auto w-full max-w-md">
        <div className="bg-white py-6 px-4 shadow sm:rounded-lg sm:py-8 sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {sessionTimeoutMessage && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Session Expired</p>
                  <p className="text-sm mt-1">{sessionTimeoutMessage}</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <Input
                label="Email or Phone Number"
                name="identifier"
                type="text"
                value={values.identifier}
                onChange={handleChange}
                {...(errors.identifier && { error: errors.identifier })}
                placeholder="Enter your email or phone number"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={values.password}
                onChange={handleChange}
                {...(errors.password && { error: errors.password })}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                rightIcon={
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                }
              />
            </div>

            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-red-700 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-red-700 hover:text-red-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isLoading}
                disabled={!isValid}
              >
                Sign in
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                fullWidth
                disabled
                className="opacity-50 cursor-not-allowed text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="hidden sm:inline">Google</span>
                <span className="sm:hidden">Google</span>
              </Button>
              
              <Button
                variant="outline"
                fullWidth
                disabled
                className="opacity-50 cursor-not-allowed text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="hidden sm:inline">Facebook</span>
                <span className="sm:hidden">Facebook</span>
              </Button>
            </div>
            
            <p className="mt-4 text-xs text-gray-500 text-center">
              Social login coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-r-transparent"></div>
          <p className="mt-4 text-red-700 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
