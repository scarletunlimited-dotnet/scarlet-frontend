/**
 * Sentry server-side SDK initialization (Node.js runtime).
 * Loaded via instrumentation.ts when NEXT_RUNTIME === 'nodejs'.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProduction = process.env.NODE_ENV === 'production';

if (dsn && isProduction) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'production',
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  });
}
