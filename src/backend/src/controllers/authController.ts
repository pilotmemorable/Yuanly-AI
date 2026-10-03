import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { env } from '../config/env';
import { generateToken } from '../utils/auth';
import { hashPassword, verifyPassword } from '../utils/password';
import { HttpError, parse } from '../utils/http';
import { anonymizeUser, userSelect } from '../services/userService';

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(8, 'must be at least 8 characters').max(128);
const language = z.enum(['CN', 'EN', 'TR']);

const registerSchema = z.object({
  email,
  password,
  fullName: z.string().trim().max(100).optional(),
  preferredLanguage: language.optional(),
});

const loginSchema = z.object({ email, password: z.string().min(1).max(128) });

// POST /v1/auth/register
export const register = async (req: Request, res: Response) => {
  const body = parse(registerSchema, req.body);

  if (body.email === env.adminEmail) {
    throw new HttpError(403, 'ERR_RESERVED_EMAIL', 'This email address is reserved');
  }
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) throw new HttpError(409, 'ERR_EMAIL_TAKEN', 'Email already registered');

  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash: await hashPassword(body.password),
      fullName: body.fullName || null,
      preferredLanguage: body.preferredLanguage || 'CN',
      role: 'USER',
    },
    select: userSelect,
  });

  res.status(201).json({ token: generateToken(user.id, user.role), user });
};

// POST /v1/auth/login
export const login = async (req: Request, res: Response) => {
  const body = parse(loginSchema, req.body);
  const found = await prisma.user.findUnique({ where: { email: body.email } });
  const ok = await verifyPassword(body.password, found?.passwordHash);
  if (!found || !ok || !found.isActive) {
    throw new HttpError(401, 'ERR_INVALID_CREDENTIALS', 'Invalid email or password');
  }
  // Defence in depth: only the configured address may hold the ADMIN role.
  if (found.role === 'ADMIN' && found.email !== env.adminEmail) {
    throw new HttpError(403, 'ERR_FORBIDDEN', 'Not authorized');
  }
  const user = await prisma.user.findUnique({ where: { id: found.id }, select: userSelect });
  res.status(200).json({ token: generateToken(found.id, found.role), user });
};

// GET /v1/auth/me
export const getProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...userSelect, _count: { select: { bookings: true, reviews: true } } },
  });
  if (!user) throw new HttpError(404, 'ERR_NOT_FOUND', 'User not found');
  res.status(200).json({ user });
};

const updateSchema = z.object({
  fullName: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(32).optional(),
  preferredLanguage: language.optional(),
  travelStyle: z.string().trim().max(50).optional(),
});

// PUT /v1/auth/me
export const updateProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const body = parse(updateSchema, req.body);
  const user = await prisma.user.update({ where: { id: userId }, data: body, select: userSelect });
  res.status(200).json({ user });
};

const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: password });

// POST /v1/auth/change-password
export const changePassword = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const body = parse(changePasswordSchema, req.body);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await verifyPassword(body.currentPassword, user.passwordHash))) {
    throw new HttpError(401, 'ERR_INVALID_CREDENTIALS', 'Current password is incorrect');
  }
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(body.newPassword) } });
  res.status(200).json({ message: 'Password updated' });
};

// DELETE /v1/auth/me
export const deleteAccount = async (req: Request, res: Response) => {
  const authUser = (req as any).user;
  const body = parse(z.object({ password: z.string().min(1).max(128) }), req.body);
  if (authUser.role === 'ADMIN') throw new HttpError(403, 'ERR_FORBIDDEN', 'The admin account cannot be deleted');
  const user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    throw new HttpError(401, 'ERR_INVALID_CREDENTIALS', 'Password is incorrect');
  }
  await anonymizeUser(user.id);
  res.status(200).json({ message: 'Account deleted' });
};

// GET /v1/auth/me/notifications
export const getNotifications = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { unreadOnly, page = 1, limit = 30 } = req.query;
  const notifications = await prisma.notification.findMany({
    where: { userId, ...(unreadOnly === 'true' && { isRead: false }) },
    orderBy: { createdAt: 'desc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Math.min(Number(limit) || 30, 100),
  });
  const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });
  res.status(200).json({ notifications, unreadCount });
};

// PUT /v1/auth/me/notifications/:id/read
export const markNotificationRead = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  await prisma.notification.updateMany({ where: { id: req.params.id, userId }, data: { isRead: true } });
  res.status(200).json({ message: 'Notification marked as read' });
};
