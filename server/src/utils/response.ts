import crypto from 'node:crypto';
import { Response } from 'express';

export function ok<T>(res: Response, data: T, status = 200, reqId?: string) {
  const requestId = reqId || (res.locals.requestId as string) || crypto.randomUUID();
  return res.status(status).json({
    success: true,
    data,
    requestId,
  });
}

export function fail(
  res: Response,
  code: string,
  message: string,
  status = 400,
  reqId?: string
) {
  const requestId = reqId || (res.locals.requestId as string) || crypto.randomUUID();
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
    requestId,
  });
}

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}
