import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context';

// Session timeout configuration
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before logout
const WARNING_INTERVAL = 60 * 1000; // Update warning every minute
const ACTIVITY_THROTTLE = 1000; // Minimum time between activity resets (1 second)

interface UseAdminSessionReturn {
  timeUntilTimeout: number;
  isWarningActive: boolean;
  extendSession: () => void;
}

/**
 * Hook to manage admin session timeout and auto-logout
 * Automatically logs out admin users after period of inactivity
 * 
 * Optimizations:
 * - Debounced activity detection to prevent excessive event handling
 * - Prevents multiple logout calls with flag
 * - Uses refs to minimize re-renders
 * - Properly cleans up all timers and intervals
 */
export function useAdminSession(): UseAdminSessionReturn {
  const { user, logout } = useAuth();
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef<boolean>(false); // Prevent multiple logout calls
  const timeUntilTimeoutRef = useRef<number>(INACTIVITY_TIMEOUT); // Store in ref to avoid re-renders
  const activityThrottleRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isWarningActive, setIsWarningActive] = useState(false);
  const [timeUntilTimeout, setTimeUntilTimeout] = useState(INACTIVITY_TIMEOUT);

  // Stable clear function that doesn't change
  const clearAllTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (warningIntervalRef.current) {
      clearInterval(warningIntervalRef.current);
      warningIntervalRef.current = null;
    }
    if (activityThrottleRef.current) {
      clearTimeout(activityThrottleRef.current);
      activityThrottleRef.current = null;
    }
  }, []);

  // Stable logout function with race condition protection
  const performLogout = useCallback(() => {
    // Prevent multiple logout calls
    if (isLoggingOutRef.current) {
      return;
    }
    isLoggingOutRef.current = true;
    
    clearAllTimeouts();
    
    // Clear sensitive data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.clear();
    
    // Logout and redirect
    logout();
    router.push('/login?reason=session-timeout&message=Your session expired due to inactivity');
  }, [logout, router, clearAllTimeouts]);

  // Stable reset function
  const resetTimeout = useCallback(() => {
    clearAllTimeouts();
    
    // Update last activity
    lastActivityRef.current = Date.now();
    setIsWarningActive(false);
    timeUntilTimeoutRef.current = INACTIVITY_TIMEOUT;
    setTimeUntilTimeout(INACTIVITY_TIMEOUT);

    // Set warning timeout (5 minutes before logout)
    warningTimeoutRef.current = setTimeout(() => {
      setIsWarningActive(true);
      timeUntilTimeoutRef.current = WARNING_TIME;
      setTimeUntilTimeout(WARNING_TIME);
      
      // Store interval reference immediately to prevent memory leak
      // Update warning countdown every minute
      const intervalId = setInterval(() => {
        // Check if we're already logging out
        if (isLoggingOutRef.current) {
          clearInterval(intervalId);
          return;
        }
        
        const elapsed = Date.now() - lastActivityRef.current;
        const remaining = INACTIVITY_TIMEOUT - elapsed;
        
        if (remaining <= 0) {
          clearInterval(intervalId);
          performLogout();
          return;
        }
        
        // Only update state if value changed significantly (avoid unnecessary re-renders)
        if (Math.abs(timeUntilTimeoutRef.current - remaining) > 5000) {
          timeUntilTimeoutRef.current = remaining;
          setTimeUntilTimeout(remaining);
        }
      }, WARNING_INTERVAL);
      
      // Store interval reference immediately
      warningIntervalRef.current = intervalId;
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      performLogout();
    }, INACTIVITY_TIMEOUT);
  }, [performLogout, clearAllTimeouts]);

  const extendSession = useCallback(() => {
    isLoggingOutRef.current = false; // Reset logout flag when extending
    resetTimeout();
  }, [resetTimeout]);

  // Memoize admin check to avoid unnecessary re-renders
  const isAdminUser = useMemo(() => {
    return user && (user.role === 'admin' || user.role === 'staff');
  }, [user]);

  useEffect(() => {
    // Only apply to admin/staff users
    if (!isAdminUser) {
      clearAllTimeouts();
      isLoggingOutRef.current = false; // Reset flag when not admin
      return;
    }

    // Reset logout flag when user becomes admin
    isLoggingOutRef.current = false;

    // Activity events - removed 'mousemove' to reduce overhead
    // Other events are sufficient to detect user activity
    const events = [
      'mousedown',
      'keypress',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'focus',
    ];
    
    // Debounced activity handler to prevent excessive calls
    const handleActivity = () => {
      // Clear existing throttle
      if (activityThrottleRef.current) {
        clearTimeout(activityThrottleRef.current);
      }
      
      // Throttle activity detection
      activityThrottleRef.current = setTimeout(() => {
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        // Only reset if there was actual activity (not just timer updates)
        if (timeSinceLastActivity > ACTIVITY_THROTTLE) {
          resetTimeout();
        }
      }, ACTIVITY_THROTTLE);
    };

    // Add event listeners with capture phase for better detection
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Also listen to visibility changes (tab focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetTimeout();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial timeout setup
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearAllTimeouts();
      isLoggingOutRef.current = false;
    };
  }, [isAdminUser, resetTimeout, clearAllTimeouts]);

  return {
    timeUntilTimeout,
    isWarningActive,
    extendSession,
  };
}

