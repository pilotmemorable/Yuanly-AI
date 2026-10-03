import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import { HttpError, pageParams, pagination, parse } from '../utils/http';
import { parseArrayField, parseJsonField } from '../utils/json';

const publicMerchantSelect = {
  id: true,
  businessName: true,
  category: true,
  location: true,
  latitude: true,
  longitude: true,
  description: true,
  images: true,
  rating: true,
  reviewCount: true,
  isVerified: true,
  contactInfo: true,
  operatingHours: true,
} as const;

function shapeMerchant(m: any) {
  return {
    ...m,
    images: parseArrayField(m.images),
    contactInfo: parseJsonField(m.contactInfo),
    operatingHours: parseJsonField(m.operatingHours),
  };
}

// GET /v1/merchants
export const listMerchants = async (req: Request, res: Response) => {
  const { category, location } = req.query;
  const { page, limit, skip, take } = pageParams(req.query);
  const where: any = {
    isActive: true,
    isVerified: true,
    ...(category && { category: String(category).toUpperCase() }),
    ...(location && { location: { contains: String(location), mode: 'insensitive' } }),
  };
  const [merchants, total] = await Promise.all([
    prisma.merchant.findMany({ where, select: publicMerchantSelect, orderBy: { rating: 'desc' }, skip, take }),
    prisma.merchant.count({ where }),
  ]);
  res.status(200).json({ merchants: merchants.map(shapeMerchant), pagination: pagination(page, limit, total) });
};

// GET /v1/merchants/:id
export const getMerchant = async (req: Request, res: Response) => {
  const merchant = await prisma.merchant.findFirst({
    where: { id: req.params.id, isActive: true, isVerified: true },
    select: {
      ...publicMerchantSelect,
      experiences: {
        where: { isActive: true },
        select: { id: true, title: true, titleCn: true, titleTr: true, priceCny: true, rating: true, images: true },
      },
    },
  });
  if (!merchant) throw new HttpError(404, 'ERR_NOT_FOUND', 'Merchant not found');
  const shaped: any = shapeMerchant(merchant);
  shaped.experiences = merchant.experiences.map((e) => ({ ...e, images: parseArrayField(e.images) }));
  res.status(200).json({ merchant: shaped });
};

async function ownMerchant(req: AuthRequest, merchantId: string) {
  const user = req.user!;
  if (user.role !== 'MERCHANT') throw new HttpError(403, 'ERR_FORBIDDEN', 'Not authorized');
  const merchant = await prisma.merchant.findFirst({ where: { id: merchantId, userId: user.id, isActive: true } });
  if (!merchant) throw new HttpError(403, 'ERR_FORBIDDEN', 'Not authorized');
  return merchant;
}

const merchantUpdateSchema = z.object({
  businessName: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  images: z.array(z.string().url().max(500)).max(10).optional(),
  contactInfo: z.object({ phone: z.string().max(40).optional(), email: z.string().max(120).optional() }).optional(),
  operatingHours: z.object({ start: z.string().max(10), end: z.string().max(10) }).optional(),
});

// PUT /v1/merchants/:id
export const updateMerchant = async (req: AuthRequest, res: Response) => {
  await ownMerchant(req, req.params.id);
  const body = parse(merchantUpdateSchema, req.body);
  const updated = await prisma.merchant.update({
    where: { id: req.params.id },
    data: {
      ...(body.businessName && { businessName: body.businessName }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.images && { images: JSON.stringify(body.images) }),
      ...(body.contactInfo && { contactInfo: JSON.stringify(body.contactInfo) }),
      ...(body.operatingHours && { operatingHours: JSON.stringify(body.operatingHours) }),
    },
  });
  res.status(200).json({ merchant: shapeMerchant(updated) });
};

export const experienceBodySchema = z.object({
  title: z.string().trim().min(1).max(160),
  titleCn: z.string().trim().max(160).optional(),
  titleTr: z.string().trim().max(160).optional(),
  description: z.string().trim().min(1).max(4000),
  descriptionCn: z.string().trim().max(4000).optional(),
  descriptionTr: z.string().trim().max(4000).optional(),
  priceCny: z.coerce.number().positive().max(1_000_000),
  duration: z.string().trim().max(40).optional(),
  capacity: z.coerce.number().int().min(1).max(500).optional(),
  images: z.array(z.string().url().max(600)).max(10).optional(),
  tags: z.array(z.string().trim().max(40)).max(15).optional(),
});

export function experienceData(body: z.infer<typeof experienceBodySchema> | Partial<z.infer<typeof experienceBodySchema>>) {
  const { images, tags, ...rest } = body as any;
  return {
    ...rest,
    ...(images !== undefined && { images: JSON.stringify(images) }),
    ...(tags !== undefined && { tags: JSON.stringify(tags) }),
  };
}

// POST /v1/merchants/:id/experiences
export const createExperience = async (req: AuthRequest, res: Response) => {
  const merchant = await ownMerchant(req, req.params.id);
  const body = parse(experienceBodySchema, req.body);
  const experience = await prisma.experience.create({
    data: { merchantId: merchant.id, duration: 'Varies', capacity: 1, ...experienceData(body) },
  });
  res.status(201).json({ experience });
};

// PUT /v1/merchants/:merchantId/experiences/:expId
export const updateExperience = async (req: AuthRequest, res: Response) => {
  const merchant = await ownMerchant(req, req.params.merchantId);
  const body = parse(experienceBodySchema.partial().extend({ isActive: z.boolean().optional() }), req.body);
  const existing = await prisma.experience.findFirst({ where: { id: req.params.expId, merchantId: merchant.id } });
  if (!existing) throw new HttpError(404, 'ERR_NOT_FOUND', 'Experience not found');
  const experience = await prisma.experience.update({ where: { id: existing.id }, data: experienceData(body) });
  res.status(200).json({ experience });
};

// DELETE /v1/merchants/:merchantId/experiences/:expId (soft delete)
export const deleteExperience = async (req: AuthRequest, res: Response) => {
  const merchant = await ownMerchant(req, req.params.merchantId);
  const existing = await prisma.experience.findFirst({ where: { id: req.params.expId, merchantId: merchant.id } });
  if (!existing) throw new HttpError(404, 'ERR_NOT_FOUND', 'Experience not found');
  await prisma.experience.update({ where: { id: existing.id }, data: { isActive: false } });
  res.status(200).json({ message: 'Experience removed' });
};

// GET /v1/merchants/:id/dashboard
export const getDashboard = async (req: AuthRequest, res: Response) => {
  const merchant = await ownMerchant(req, req.params.id);
  const [grouped, revenue, experiences, recent] = await Promise.all([
    prisma.booking.groupBy({ by: ['status'], where: { experience: { merchantId: merchant.id } }, _count: { status: true } }),
    prisma.booking.aggregate({
      where: { experience: { merchantId: merchant.id }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
      _sum: { totalAmount: true },
    }),
    prisma.experience.findMany({
      where: { merchantId: merchant.id },
      select: { id: true, title: true, priceCny: true, rating: true, _count: { select: { bookings: true } } },
    }),
    prisma.booking.findMany({
      where: { experience: { merchantId: merchant.id } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, status: true, slotTime: true, guestCount: true, totalAmount: true, guestName: true },
    }),
  ]);
  const byStatus: Record<string, number> = {};
  grouped.forEach((g) => (byStatus[g.status] = g._count.status));
  res.status(200).json({
    stats: {
      totalBookings: Object.values(byStatus).reduce((a, b) => a + b, 0),
      totalRevenue: revenue._sum.totalAmount || 0,
      byStatus,
      totalExperiences: experiences.length,
      rating: merchant.rating,
      reviewCount: merchant.reviewCount,
    },
    recentBookings: recent,
    experiences: experiences.map((e) => ({ id: e.id, title: e.title, priceCny: e.priceCny, rating: e.rating, bookingCount: e._count.bookings })),
  });
};
