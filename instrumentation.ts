/**
 * Next.js Instrumentation - loads Sentry SDK for server/edge runtimes.
 * Required for capturing server-side errors (Server Components, middleware, API routes).
 */
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./src/sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./src/sentry.edge.config');
  }
}

// Capture errors from Server Components, middleware, and route handlers
export const onRequestError = Sentry.captureRequestError;
