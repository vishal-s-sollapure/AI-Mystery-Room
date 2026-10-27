import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

declare global {
  namespace Express {
    interface Request {
      ownerId: string;
      requestId: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Attach requestId
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  res.locals.requestId = reqId;
  res.setHeader('x-request-id', reqId);
  req.requestId = reqId;

  // Extract or issue amr_guest cookie
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/(?:^|;\s*)amr_guest=([^;]+)/);
  let ownerId = match?.[1];

  // Validate ownerId format (UUID v4)
  if (!ownerId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ownerId)) {
    ownerId = crypto.randomUUID();
    res.cookie('amr_guest', ownerId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });
  }

  req.ownerId = ownerId;
  next();
}
