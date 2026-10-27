import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, fail } from '../utils/response.js';
import { env } from '../config/env.js';

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const reqId = res.locals.requestId as string;

  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    const message = firstIssue
      ? `${firstIssue.path.join('.') || 'input'}: ${firstIssue.message}`
      : 'Validation failed';
    return fail(res, 'VALIDATION_ERROR', message, 400, reqId);
  }

  if (error instanceof AppError) {
    return fail(res, error.code, error.message, error.statusCode, reqId);
  }

  // Handle SyntaxError (malformed JSON)
  if (error instanceof SyntaxError && 'body' in error) {
    return fail(res, 'VALIDATION_ERROR', 'Malformed JSON in request body', 400, reqId);
  }

  if (env.NODE_ENV !== 'test') {
    console.error('Unhandled server error:', error);
  }

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : error instanceof Error
        ? error.message
        : 'Internal server error';

  return fail(res, 'INTERNAL_ERROR', message, 500, reqId);
}
