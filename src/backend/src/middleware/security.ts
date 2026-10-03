import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';

// Fields that must reach the controllers untouched.
const RAW_KEYS = new Set(['password', 'currentPassword', 'newPassword']);

// Prisma uses parameterised queries, so SQL escaping is unnecessary (and would corrupt data).
// We only strip HTML tags / control characters from free-text input.
const clean = (value: string): string =>
  value
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();

function sanitizeValue(value: any, key?: string): any {
  if (key && RAW_KEYS.has(key)) return value;
  if (typeof value === 'string') return clean(value);
  if (Array.isArray(value)) return value.map((v) => sanitizeValue(v));
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const k of Object.keys(value)) {
      if (/^[a-zA-Z0-9_]+$/.test(k)) out[k] = sanitizeValue(value[k], k);
    }
    return out;
  }
  return value;
}

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') req.body = sanitizeValue(req.body);
  if (req.query) {
    const q: Record<string, any> = {};
    for (const k of Object.keys(req.query)) q[k] = sanitizeValue((req.query as any)[k], k);
    Object.defineProperty(req, 'query', { value: q, writable: true, configurable: true });
  }
  next();
};

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = crypto.randomUUID();
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-ID', id);
  next();
};

export const auditLog = (action: string) => (req: Request, _res: Response, next: NextFunction) => {
  const userId = (req as any).user?.id || 'anonymous';
  console.log(
    `[AUDIT] ${new Date().toISOString()} | ${action} | user:${userId} | req:${req.headers['x-request-id']} | ip:${req.ip} | ${req.method} ${req.originalUrl.split('?')[0]}`
  );
  next();
};

// Native apps send no Origin header; browsers are only allowed from CORS_ORIGIN (same-origin admin needs nothing).
export const corsConfig = {
  origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return cb(null, true);
    if (env.corsOrigins.includes(origin)) return cb(null, true);
    if (!env.isProd && /^http:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
    return cb(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400,
};

export const rateLimits = {
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 30,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, try again later', error_code: 'ERR_RATE_LIMIT' },
  },
  ai: {
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'AI rate limit exceeded', error_code: 'ERR_RATE_LIMIT' },
  },
  api: {
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests', error_code: 'ERR_RATE_LIMIT' },
  },
};
