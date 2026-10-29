import { Router } from 'express';
import { ok } from '../utils/response.js';

export const authRouter = Router();

// GET /api/auth/session - Retrieve current investigator session details
authRouter.get('/session', (req, res) => {
  return ok(res, {
    ownerId: req.ownerId,
    badgeNumber: `INV-${req.ownerId.slice(0, 8).toUpperCase()}`,
    isGuest: true,
    authenticated: true,
    status: 'ACTIVE_INVESTIGATOR',
  });
});

