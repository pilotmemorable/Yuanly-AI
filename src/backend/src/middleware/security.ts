import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Yuanly AI — Security Middleware Suite
 * Production-grade security for handling user data, payments, and AI interactions
 */

// 1. API Key validation for service-to-service communication (AI Agent → Backend)
const SERVICE_API_KEYS = process.env.SERVICE_API_KEYS?.split(',') || [];

export const validateServiceKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey || !SERVICE_API_KEYS.includes(apiKey)) {
    return res.status(403).json({
      error_code: 'ERR_FORBIDDEN',
      message: 'Invalid or missing service API key'
    });
  }
  next();
};

// 2. Input sanitization — prevent SQL injection and XSS
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potential SQL injection patterns
      return obj
        .replace(/'/g, "''")
        .replace(/--/g, '')
        .replace(/;\s*DROP/gi, '')
        .replace(/;\s*DELETE/gi, '')
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        if (key.match(/^[a-zA-Z0-9_]+$/)) { // Only allow safe keys
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) {
    const sanitizedQuery: any = {};
    for (const key in req.query) {
      sanitizedQuery[key] = sanitize(req.query[key] as any);
    }
    req.query = sanitizedQuery;
  }
  next();
};

// 3. Request ID for tracing (security audit trail)
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = crypto.randomUUID();
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-ID', id);
  next();
};

// 4. Sensitive data encryption helper (for payment tokens, PII)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_encryption_key_32bytes!';
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// 5. Audit logging for sensitive operations
export const auditLog = (action: string) => (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.id || 'anonymous';
  const requestId = req.headers['x-request-id'] as string;
  console.log(`[AUDIT] ${new Date().toISOString()} | ${action} | user:${userId} | req:${requestId} | ip:${req.ip} | path:${req.path}`);
  next();
};

// 6. CORS strict policy for production
export const corsConfig = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'X-Request-ID', 'X-API-Key'],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400, // 24 hours
};

// 7. Rate limiting tiers
export const rateLimits = {
  // Auth endpoints — stricter to prevent brute force
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 attempts per 15 min
    message: { error: 'Too many authentication attempts' },
  },
  // AI endpoints — moderate to prevent abuse
  ai: {
    windowMs: 60 * 1000,
    max: 30, // 30 requests per minute
    message: { error: 'AI rate limit exceeded' },
  },
  // Payment — very strict
  payment: {
    windowMs: 60 * 1000,
    max: 5, // 5 payment attempts per minute
    message: { error: 'Too many payment requests' },
  },
  // Default API
  api: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests' },
  },
};