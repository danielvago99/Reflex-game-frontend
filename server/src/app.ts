import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { router } from './routes';
import { logger } from './utils/logger';
import { initSentry, sentryErrorHandler } from './config/sentry';
import { cookieParser } from './middleware/cookies';

export const app = express();

// Trust only the first proxy (e.g., Render/Heroku) so rate limiting can read X-Forwarded-For
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  }),
);

// JSON body parsing
app.use(express.json());
app.use(cookieParser());

// Logging
app.use(
  pinoHttp({
    logger,
  }),
);

// Basic in-memory rate limiter (Redis store can be added later)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Sentry (optional; only active if SENTRY_DSN is set)
initSentry(app);

// Routes
app.use('/api', router);

// Sentry error handler (must be after routes)
app.use(sentryErrorHandler);

// Generic error handler fallback
app.use(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({ error: 'Internal server error' });
  },
);
