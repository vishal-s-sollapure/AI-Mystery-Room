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
  const configuredOrigins = (env.CLIENT_ORIGIN || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const localOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
  const allowedOrigins = Array.from(new Set([...configuredOrigins, ...localOrigins]));

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/+$/, '');
        if (
          allowedOrigins.includes(cleanOrigin) ||
          cleanOrigin.endsWith('.vercel.app') ||
          cleanOrigin.endsWith('.onrender.com') ||
          env.NODE_ENV !== 'production'
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      exposedHeaders: ['x-request-id', 'x-investigator-id'],
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

  // Root welcome / status endpoint
  app.get('/', (_req, res) => {
    res.json({
      name: 'AI Mystery Room API',
      status: 'online',
      message: 'Backend API is running and connected.',
      healthCheck: '/api/health',
      version: '1.1.0',
    });
  });

  // API Routes
  app.use('/api/health', healthRouter);
  app.use('/api/cases', caseRouter);
  app.use('/api/auth', authRouter);

  // Centralized Error Handling
  app.use(errorMiddleware);

  return app;
}
