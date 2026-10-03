import { NextFunction, Request, Response } from 'express';
import prisma from '../config/db';
import { env } from '../config/env';
import { verifyToken } from '../utils/auth';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  fullName: string | null;
  preferredLanguage: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  merchant?: any;
}

async function loadUser(req: AuthRequest): Promise<AuthUser | null> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  try {
    const decoded = verifyToken(header.slice(7));
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, fullName: true, preferredLanguage: true, isActive: true },
    });
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await loadUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required', error_code: 'ERR_UNAUTHENTICATED' });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const user = await loadUser(req);
    if (user) req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const requireRole =
  (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized', error_code: 'ERR_FORBIDDEN' });
    }
    next();
  };

// The admin role is bound to ADMIN_EMAIL: both conditions must hold.
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN' || req.user.email !== env.adminEmail) {
    return res.status(403).json({ error: 'Admin access required', error_code: 'ERR_FORBIDDEN' });
  }
  next();
};

export const requireMerchant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role !== 'MERCHANT') {
      return res.status(403).json({ error: 'Company representative access required', error_code: 'ERR_FORBIDDEN' });
    }
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user.id } });
    if (!merchant || !merchant.isActive) {
      return res
        .status(403)
        .json({ error: 'No active company is linked to this account', error_code: 'ERR_NO_MERCHANT' });
    }
    req.merchant = merchant;
    next();
  } catch (err) {
    next(err);
  }
};
