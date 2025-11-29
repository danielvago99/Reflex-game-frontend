import type { Express } from 'express';
import * as Sentry from '@sentry/node';
import '@sentry/profiling-node';
import { env } from './env';

export function initSentry(_app: Express) {
  if (!env.SENTRY_DSN) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    integrations: [Sentry.expressIntegration()],
    tracesSampleRate: 0.1,
    profilesSampleRate: 0.1,
  });
}

export const sentryErrorHandler = Sentry.expressErrorHandler();
