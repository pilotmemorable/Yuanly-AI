import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError, zodToHttpError } from '../utils/http';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) err = zodToHttpError(err);

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, error_code: err.errorCode, ...(err.extra || {}) });
  }

  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body', error_code: 'ERR_VALIDATION' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request too large', error_code: 'ERR_TOO_LARGE' });
  }

  if (err?.code === 'P2002') {
    return res.status(409).json({ error: 'A record with this value already exists', error_code: 'ERR_DUPLICATE' });
  }
  if (err?.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found', error_code: 'ERR_NOT_FOUND' });
  }
  if (err?.code === 'P2003') {
    return res.status(400).json({ error: 'Referenced record does not exist', error_code: 'ERR_FOREIGN_KEY' });
  }

  console.error(`[Error] ${req.method} ${req.originalUrl.split('?')[0]} req:${req.headers['x-request-id']}`, err);
  res.status(500).json({ error: 'Internal server error', error_code: 'ERR_INTERNAL' });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found`, error_code: 'ERR_NOT_FOUND' });
};
