'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAdminSession } from '@/hooks/useAdminSession';
import SessionTimeoutWarning from '@/components/admin/SessionTimeoutWarning';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isRefreshing } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [redirectingToLogin, setRedirectingToLogin] = useState(false);
  
  // Session timeout management for admin users
  const { timeUntilTimeout, isWarningActive, extendSession } = useAdminSession();

  useEffect(() => {
    // Only redirect if loading is complete and user is not authenticated or not admin/staff
    if (loading) {
      return;
    }

    const lacksAccess = !user || (user.role !== 'admin' && user.role !== 'staff');

    if (lacksAccess) {
      if (!redirectingToLogin) {
        setRedirectingToLogin(true);
      }
      router.replace('/login');
    } else if (redirectingToLogin) {
      // User regained access (e.g., token refresh) - remove redirecting state
      setRedirectingToLogin(false);
    }
  }, [user, loading, router, redirectingToLogin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-r-transparent"></div>
          <p className="mt-4 text-red-700 font-medium">Loading admin dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we verify your access...</p>
        </div>
      </div>
    );
  }

  if (redirectingToLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 flex flex-col items-center justify-center text-center px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg border border-red-100 mb-6">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-500 border-r-transparent" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Signing you out…</h2>
        <p className="text-gray-600 max-w-md">
          For security, we&apos;re redirecting you to the login page. Please hold on for a second.
        </p>
      </div>
    );
  }

  // Show refreshing indicator if token is being refreshed in background
  if (isRefreshing && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50">
        {/* Show a subtle refreshing indicator */}
        <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg px-4 py-2 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-r-transparent"></div>
          <span className="text-sm text-gray-600">Refreshing session...</span>
        </div>
        
        {/* Render the admin layout normally */}
        <div className="section-full-vh bg-gradient-to-br from-red-50 via-white to-rose-50">
          {/* Mobile sidebar backdrop */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <AdminSidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
          />

          {/* Main content */}
          <div className="lg:pl-64">
            {/* Header */}
            <AdminHeader 
              onMenuClick={() => setSidebarOpen(true)}
              user={user}
            />

            {/* Page content */}
            <main className="py-8">
              <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="max-w-full xl:max-w-[90%] 2xl:max-w-[75%] mx-auto">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">
            {!user ? 'You need to be logged in to access the admin panel.' : 'You do not have permission to access the admin panel.'}
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-full-vh bg-gradient-to-br from-red-50 via-white to-rose-50">
      {/* Session Timeout Warning Modal */}
      {/* Hook already filters for admin/staff, so no need to check again */}
      {isWarningActive && (
        <SessionTimeoutWarning
          timeUntilTimeout={timeUntilTimeout}
          onExtend={extendSession}
        />
      )}

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <AdminHeader 
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
        />

        {/* Page content */}
        <main className="py-8">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-full xl:max-w-[90%] 2xl:max-w-[75%] mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
