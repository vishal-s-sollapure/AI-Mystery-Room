import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { healthRouter } from './routes/health.routes.js';
import { caseRouter } from './routes/case.routes.js';
import { authRouter } from './routes/auth.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: [env.CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
  );

  // Request size limit & JSON parser
  app.use(express.json({ limit: '250kb' }));

  // Global rate limiter
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests, please slow down.',
      },
    },
  });
  app.use(limiter);

  // Guest authentication middleware
  app.use(authMiddleware);

  // API Routes
  app.use('/api/health', healthRouter);
  app.use('/api/cases', caseRouter);
  app.use('/api/auth', authRouter);

  // Centralized Error Handling
  app.use(errorMiddleware);

  return app;
}
