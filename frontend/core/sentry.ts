import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_AUTH_TOKEN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_AUTH_TOKEN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      beforeSend(event, hint) {
        // Filter out certain errors in development
        if (process.env.NODE_ENV === 'development') {
          return null;
        }
        return event;
      },
    });
  }
}

export default Sentry;
