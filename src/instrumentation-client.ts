/**
 * Sentry client-side SDK initialization.
 * Loaded in the browser; only active when NEXT_PUBLIC_SENTRY_DSN is set.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProduction = process.env.NODE_ENV === 'production';

if (dsn && isProduction) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'production',
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
