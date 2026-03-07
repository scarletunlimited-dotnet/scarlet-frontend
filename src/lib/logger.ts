/* eslint-disable no-console */
/**
 * Production-safe logger utility
 * Removes console logs in production while keeping errors and warnings
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isClient = typeof window !== 'undefined';

interface LogData {
  [key: string]: any;
}

class Logger {
  /**
   * Log informational messages (only in development)
   */
  log(...args: any[]): void {
    if (isDevelopment) {
      console.log(...args);
    }
  }

  /**
   * Log informational messages with context (only in development)
   */
  info(message: string, data?: LogData): void {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, data || '');
    }
  }

  /**
   * Log warning messages (always logged)
   */
  warn(message: string, data?: LogData): void {
    if (isDevelopment || isClient) {
      console.warn(`⚠️ ${message}`, data || '');
    }
  }

  /**
   * Log error messages (always logged)
   */
  error(message: string, error?: Error | any): void {
    console.error(`❌ ${message}`, error || '');
    
    // Send to Sentry in production (client-side)
    if (!isDevelopment && isClient) {
      try {
        void import('@sentry/nextjs').then((Sentry) => {
          const err = error instanceof Error ? error : new Error(String(error ?? message));
          Sentry.captureException(err, { extra: { message } });
        });
      } catch {
        // Ignore Sentry import/send failures
      }
    }
  }

  /**
   * Log success messages (only in development)
   */
  success(message: string, data?: LogData): void {
    if (isDevelopment) {
      console.log(`✅ ${message}`, data || '');
    }
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, data?: LogData): void {
    if (isDevelopment) {
      console.debug(`🔍 ${message}`, data || '');
    }
  }

  /**
   * Group related logs (only in development)
   */
  group(label: string, callback: () => void): void {
    if (isDevelopment) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }

  /**
   * Time a operation (only in development)
   */
  time(label: string): void {
    if (isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  }

  /**
   * Create a table from data (only in development)
   */
  table(data: any): void {
    if (isDevelopment) {
      console.table(data);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// For backward compatibility, also export as default
export default logger;

