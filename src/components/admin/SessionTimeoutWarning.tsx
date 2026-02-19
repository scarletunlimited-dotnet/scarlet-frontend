'use client';

import { useMemo, useCallback } from 'react';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';

interface SessionTimeoutWarningProps {
  timeUntilTimeout: number;
  onExtend: () => void;
  onDismiss?: () => void;
}

/**
 * Warning modal that appears before session timeout
 * Shows countdown and allows user to extend session
 * 
 * Optimizations:
 * - Memoized time calculations to prevent unnecessary recalculations
 * - Simplified visibility logic
 * - Callbacks memoized to prevent re-renders
 */
export default function SessionTimeoutWarning({
  timeUntilTimeout,
  onExtend,
  onDismiss,
}: SessionTimeoutWarningProps) {
  // Memoize time calculations to avoid recalculating on every render
  const { minutesLeft, secondsLeft } = useMemo(() => {
    const totalSeconds = Math.ceil(timeUntilTimeout / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return { minutesLeft: minutes, secondsLeft: seconds };
  }, [timeUntilTimeout]);

  const handleExtend = useCallback(() => {
    onExtend();
    onDismiss?.();
  }, [onExtend, onDismiss]);

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        {/* Close button */}
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss warning"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4">
            <ClockIcon className="h-6 w-6 text-amber-600" />
          </div>

          {/* Title */}
          <h3 className="text-center text-lg font-semibold text-gray-900 mb-2">
            Session Timeout Warning
          </h3>

          {/* Message */}
          <p className="text-center text-sm text-gray-600 mb-6">
            Your session will expire due to inactivity. Click &quot;Stay Logged In&quot; to continue your session.
          </p>

          {/* Countdown */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center space-x-2 rounded-lg bg-amber-50 px-4 py-3">
              <ClockIcon className="h-5 w-5 text-amber-600" />
              <span className="text-lg font-mono font-semibold text-amber-900">
                {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Time remaining before automatic logout
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleExtend}
              className="flex-1 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Stay Logged In
            </button>
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Logout Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

