import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, ZodTypeAny, z } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, public errorCode: string, message: string, public extra?: Record<string, any>) {
    super(message);
  }
}

export const asyncHandler =
  (fn: (req: any, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };

export function parse<T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw zodToHttpError(result.error);
  }
  return result.data;
}

export function zodToHttpError(err: ZodError): HttpError {
  const first = err.issues[0];
  const path = first?.path?.join('.') || 'body';
  return new HttpError(400, 'ERR_VALIDATION', `${path}: ${first?.message || 'invalid value'}`);
}

export function pageParams(query: any, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

export function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
}
