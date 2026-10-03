import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { env } from '../config/env';
import { AuthRequest } from '../middleware/authMiddleware';
import { HttpError, pageParams, pagination, parse } from '../utils/http';
import { parseArrayField, parseJsonField } from '../utils/json';
import { hashPassword, verifyPassword } from '../utils/password';
import {
  BOOKING_STATUSES,
  bookingIncludeWithUser,
  changeBookingStatus,
  serializeBooking,
} from '../services/bookingService';
import { anonymizeUser, userSelect } from '../services/userService';
import { experienceBodySchema, experienceData } from './merchantController';
import { bulkSchema, generateSlots } from './slotController';

const MERCHANT_CATEGORIES = ['PARAGLIDING', 'BALLOON', 'TOUR', 'HOTEL', 'OTHER'] as const;
const passwordSchema = z.string().min(8, 'must be at least 8 characters').max(128);

async function logAdmin(adminId: string, action: string, targetId?: string, metadata?: Record<string, any>) {
  await prisma.adminLog.create({
    data: { adminId, action, targetId: targetId || null, metadata: metadata ? JSON.stringify(metadata) : null },
  });
}

async function loadManageableUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, 'ERR_NOT_FOUND', 'User not found');
  if (user.role === 'ADMIN' || user.email === env.adminEmail) {
    throw new HttpError(403, 'ERR_FORBIDDEN', 'The admin account cannot be modified');
  }
  return user;
}

function contactInfoJson(phone?: string | null, email?: string | null, base: any = {}) {
  const info = { ...base };
  if (phone !== undefined) info.phone = phone || undefined;
  if (email !== undefined) info.email = email || undefined;
  return JSON.stringify(info);
}

function shapeMerchant(m: any) {
  const { user, ...rest } = m;
  return {
    ...rest,
    images: parseArrayField(m.images),
    contactInfo: parseJsonField(m.contactInfo),
    representative: user ? { id: user.id, email: user.email, fullName: user.fullName } : null,
  };
}

const merchantInclude = {
  user: { select: { id: true, email: true, fullName: true } },
  _count: { select: { experiences: true } },
} as const;

// ───────────────────────── Stats ─────────────────────────

export const getPlatformStats = async (_req: AuthRequest, res: Response) => {
  const [users, merchantUsers, merchants, experiences, bookings, pendingBookings, pendingMerchants, grouped, recent] =
    await Promise.all([
      prisma.user.count({ where: { role: 'USER', isActive: true } }),
      prisma.user.count({ where: { role: 'MERCHANT', isActive: true } }),
      prisma.merchant.count(),
      prisma.experience.count({ where: { isActive: true } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.merchant.count({ where: { isVerified: false } }),
      prisma.booking.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: bookingIncludeWithUser }),
    ]);
  const bookingsByStatus: Record<string, number> = {};
  grouped.forEach((g) => (bookingsByStatus[g.status] = g._count.status));
  res.status(200).json({
    totals: { users, merchantUsers, merchants, experiences, bookings, pendingBookings, pendingMerchants },
    bookingsByStatus,
    recentBookings: recent.map(serializeBooking),
  });
};

// ───────────────────────── Users ─────────────────────────

export const listUsers = async (req: AuthRequest, res: Response) => {
  const { role, q } = req.query as Record<string, string | undefined>;
  const { page, limit, skip, take } = pageParams(req.query, 50);
  const where: any = { role: { in: ['USER', 'MERCHANT'] }, isActive: true, email: { not: env.adminEmail } };
  if (role === 'USER' || role === 'MERCHANT') where.role = role;
  if (q) {
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { fullName: { contains: q, mode: 'insensitive' } },
    ];
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { ...userSelect, _count: { select: { bookings: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);
  res.status(200).json({ users, pagination: pagination(page, limit, total) });
};

const merchantInputSchema = z.object({
  businessName: z.string().trim().min(1).max(120),
  category: z.enum(MERCHANT_CATEGORIES),
  location: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional(),
  contactPhone: z.string().trim().max(40).optional(),
  contactEmail: z.string().trim().max(120).optional(),
  commissionRate: z.coerce.number().min(0).max(1).optional(),
});

const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: passwordSchema,
  fullName: z.string().trim().max(100).optional(),
  role: z.enum(['USER', 'MERCHANT']),
  merchantId: z.string().optional(),
  merchant: merchantInputSchema.optional(),
});

async function linkMerchant(tx: any, userId: string, merchantId: string) {
  const merchant = await tx.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant) throw new HttpError(404, 'ERR_NOT_FOUND', 'Company not found');
  if (merchant.userId && merchant.userId !== userId) {
    throw new HttpError(409, 'ERR_MERCHANT_TAKEN', 'This company already has a representative');
  }
  await tx.merchant.updateMany({ where: { userId, id: { not: merchantId } }, data: { userId: null } });
  await tx.merchant.update({ where: { id: merchantId }, data: { userId } });
}

// POST /v1/admin/users
export const createUser = async (req: AuthRequest, res: Response) => {
  const body = parse(createUserSchema, req.body);
  if (body.email === env.adminEmail) throw new HttpError(403, 'ERR_RESERVED_EMAIL', 'This email address is reserved');
  if (await prisma.user.findUnique({ where: { email: body.email } })) {
    throw new HttpError(409, 'ERR_EMAIL_TAKEN', 'Email already registered');
  }
  if (body.role === 'MERCHANT' && !body.merchantId && !body.merchant) {
    throw new HttpError(400, 'ERR_VALIDATION', 'A company representative needs merchantId or merchant details');
  }
  const passwordHash = await hashPassword(body.password);

  const userId = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: body.email, passwordHash, fullName: body.fullName || null, role: body.role },
    });
    if (body.role === 'MERCHANT') {
      if (body.merchantId) {
        await linkMerchant(tx, user.id, body.merchantId);
      } else if (body.merchant) {
        const m = body.merchant;
        await tx.merchant.create({
          data: {
            userId: user.id,
            businessName: m.businessName,
            category: m.category,
            location: m.location,
            description: m.description,
            commissionRate: m.commissionRate ?? 0.1,
            contactInfo: contactInfoJson(m.contactPhone, m.contactEmail),
            isVerified: true,
            isActive: true,
          },
        });
      }
    }
    return user.id;
  });

  await logAdmin(req.user!.id, 'user_created', userId, { email: body.email, role: body.role });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
  res.status(201).json({ user });
};

const roleSchema = z.object({ role: z.enum(['USER', 'MERCHANT']), merchantId: z.string().optional() });

// PUT /v1/admin/users/:id/role
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  if (req.body?.role === 'ADMIN') {
    throw new HttpError(403, 'ERR_FORBIDDEN', 'The ADMIN role cannot be granted. It belongs only to ' + env.adminEmail);
  }
  const body = parse(roleSchema, req.body);
  const target = await loadManageableUser(req.params.id);

  await prisma.$transaction(async (tx) => {
    if (body.role === 'MERCHANT') {
      const existing = await tx.merchant.findUnique({ where: { userId: target.id } });
      const merchantId = body.merchantId || existing?.id;
      if (!merchantId) throw new HttpError(400, 'ERR_VALIDATION', 'merchantId is required for a company representative');
      await linkMerchant(tx, target.id, merchantId);
    } else {
      await tx.merchant.updateMany({ where: { userId: target.id }, data: { userId: null } });
    }
    await tx.user.update({ where: { id: target.id }, data: { role: body.role } });
  });

  await logAdmin(req.user!.id, 'role_changed', target.id, { oldRole: target.role, newRole: body.role, merchantId: body.merchantId });
  const user = await prisma.user.findUnique({ where: { id: target.id }, select: userSelect });
  res.status(200).json({ user });
};

// POST /v1/admin/users/:id/reset-password
export const resetUserPassword = async (req: AuthRequest, res: Response) => {
  const body = parse(z.object({ newPassword: passwordSchema }), req.body);
  const target = await loadManageableUser(req.params.id);
  await prisma.user.update({ where: { id: target.id }, data: { passwordHash: await hashPassword(body.newPassword) } });
  await logAdmin(req.user!.id, 'password_reset', target.id);
  res.status(200).json({ message: 'Password reset' });
};

// DELETE /v1/admin/users/:id
export const deleteUser = async (req: AuthRequest, res: Response) => {
  const target = await loadManageableUser(req.params.id);
  await anonymizeUser(target.id);
  await logAdmin(req.user!.id, 'user_deleted', target.id);
  res.status(200).json({ message: 'User deleted' });
};

// ───────────────────────── Merchants ─────────────────────────

export const listMerchants = async (req: AuthRequest, res: Response) => {
  const { q, verified } = req.query as Record<string, string | undefined>;
  const where: any = {};
  if (q) where.businessName = { contains: q, mode: 'insensitive' };
  if (verified === 'true') where.isVerified = true;
  if (verified === 'false') where.isVerified = false;
  const merchants = await prisma.merchant.findMany({ where, include: merchantInclude, orderBy: { createdAt: 'desc' }, take: 500 });
  res.status(200).json({ merchants: merchants.map(shapeMerchant) });
};

export const createMerchant = async (req: AuthRequest, res: Response) => {
  const body = parse(merchantInputSchema, req.body);
  const merchant = await prisma.merchant.create({
    data: {
      businessName: body.businessName,
      category: body.category,
      location: body.location,
      description: body.description,
      commissionRate: body.commissionRate ?? 0.1,
      contactInfo: contactInfoJson(body.contactPhone, body.contactEmail),
      isVerified: true,
      isActive: true,
    },
    include: merchantInclude,
  });
  await logAdmin(req.user!.id, 'merchant_created', merchant.id, { businessName: merchant.businessName });
  res.status(201).json({ merchant: shapeMerchant(merchant) });
};

const merchantUpdateSchema = merchantInputSchema.partial().extend({
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateMerchant = async (req: AuthRequest, res: Response) => {
  const body = parse(merchantUpdateSchema, req.body);
  const existing = await prisma.merchant.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, 'ERR_NOT_FOUND', 'Company not found');
  const { contactPhone, contactEmail, ...rest } = body;
  const merchant = await prisma.merchant.update({
    where: { id: existing.id },
    data: {
      ...rest,
      ...((contactPhone !== undefined || contactEmail !== undefined) && {
        contactInfo: contactInfoJson(contactPhone, contactEmail, parseJsonField(existing.contactInfo)),
      }),
    },
    include: merchantInclude,
  });
  await logAdmin(req.user!.id, 'merchant_updated', merchant.id, body);
  res.status(200).json({ merchant: shapeMerchant(merchant) });
};

// ───────────────────────── Experiences ─────────────────────────

const shapeExperience = (e: any) => ({ ...e, images: parseArrayField(e.images), tags: parseArrayField(e.tags) });

export const listExperiences = async (req: AuthRequest, res: Response) => {
  const { merchantId, q } = req.query as Record<string, string | undefined>;
  const where: any = {};
  if (merchantId) where.merchantId = merchantId;
  if (q) where.title = { contains: q, mode: 'insensitive' };
  const experiences = await prisma.experience.findMany({
    where,
    include: { merchant: { select: { id: true, businessName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  res.status(200).json({ experiences: experiences.map(shapeExperience) });
};

export const createExperience = async (req: AuthRequest, res: Response) => {
  const body = parse(experienceBodySchema.extend({ merchantId: z.string().min(1) }), req.body);
  const { merchantId, ...rest } = body;
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant) throw new HttpError(404, 'ERR_NOT_FOUND', 'Company not found');
  const experience = await prisma.experience.create({
    data: { merchantId, duration: 'Varies', capacity: 1, ...experienceData(rest) },
  });
  await logAdmin(req.user!.id, 'experience_created', experience.id, { title: experience.title });
  res.status(201).json({ experience: shapeExperience(experience) });
};

export const updateExperience = async (req: AuthRequest, res: Response) => {
  const body = parse(experienceBodySchema.partial().extend({ isActive: z.boolean().optional() }), req.body);
  const existing = await prisma.experience.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, 'ERR_NOT_FOUND', 'Experience not found');
  const experience = await prisma.experience.update({ where: { id: existing.id }, data: experienceData(body) });
  await logAdmin(req.user!.id, 'experience_updated', experience.id, { fields: Object.keys(body) });
  res.status(200).json({ experience: shapeExperience(experience) });
};

export const bulkSlotsForExperience = async (req: AuthRequest, res: Response) => {
  const body = parse(bulkSchema, req.body);
  const experience = await prisma.experience.findUnique({ where: { id: req.params.id } });
  if (!experience) throw new HttpError(404, 'ERR_NOT_FOUND', 'Experience not found');
  const created = await generateSlots(experience, body);
  await logAdmin(req.user!.id, 'slots_generated', experience.id, { created, ...body });
  res.status(201).json({ created });
};

// ───────────────────────── Bookings ─────────────────────────

export const listAllBookings = async (req: AuthRequest, res: Response) => {
  const { status, merchantId, q } = req.query as Record<string, string | undefined>;
  const { page, limit, skip, take } = pageParams(req.query, 50);
  const where: any = {};
  if (status && (BOOKING_STATUSES as readonly string[]).includes(status)) where.status = status;
  if (merchantId) where.experience = { merchantId };
  if (q) {
    where.OR = [
      { guestName: { contains: q, mode: 'insensitive' } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
      { user: { fullName: { contains: q, mode: 'insensitive' } } },
      { experience: { title: { contains: q, mode: 'insensitive' } } },
    ];
  }
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        ...bookingIncludeWithUser,
        experience: {
          select: { ...bookingIncludeWithUser.experience.select, merchant: { select: { id: true, businessName: true, location: true, contactInfo: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.booking.count({ where }),
  ]);
  res.status(200).json({ bookings: bookings.map(serializeBooking), pagination: pagination(page, limit, total) });
};

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  const body = parse(
    z.object({
      status: z.enum(['CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
      reason: z.string().trim().max(300).optional(),
    }),
    req.body
  );
  const booking = await changeBookingStatus({
    bookingId: req.params.id,
    to: body.status,
    reason: body.reason || null,
    actor: { kind: 'admin' },
  });
  await logAdmin(req.user!.id, 'booking_status_changed', booking.id, { status: body.status, reason: body.reason });
  res.status(200).json({ booking: serializeBooking(booking) });
};

// ───────────────────────── Audit log ─────────────────────────

export const listAuditLogs = async (req: AuthRequest, res: Response) => {
  const { page, limit, skip, take } = pageParams(req.query, 50);
  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({ orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.adminLog.count(),
  ]);
  res.status(200).json({ logs, pagination: pagination(page, limit, total) });
};
