import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryService {
  constructor() {
    this.initializeSentry();
  }

  private initializeSentry() {
    if (process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        integrations: [],
      });
    }
  }

  captureException(error: Error | unknown, context?: Record<string, any>) {
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        contexts: { custom: context },
      });
    }
  }

  captureMessage(
    message: string,
    level: 'fatal' | 'error' | 'warning' | 'info' = 'info',
  ) {
    if (process.env.SENTRY_DSN) {
      Sentry.captureMessage(message, level);
    }
  }

  setUserContext(userId: string, email?: string) {
    if (process.env.SENTRY_DSN) {
      Sentry.setUser({
        id: userId,
        email,
      });
    }
  }

  clearUserContext() {
    if (process.env.SENTRY_DSN) {
      Sentry.setUser(null);
    }
  }

  addBreadcrumb(
    message: string,
    category: string,
    level: 'fatal' | 'error' | 'warning' | 'info' = 'info',
    data?: Record<string, any>,
  ) {
    if (process.env.SENTRY_DSN) {
      Sentry.addBreadcrumb({
        message,
        category,
        level,
        data,
      });
    }
  }
}
