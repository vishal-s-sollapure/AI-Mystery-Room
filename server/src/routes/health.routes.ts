import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ok } from '../utils/response.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  return ok(res, {
    status: isDbConnected ? 'ready' : 'degraded',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});
