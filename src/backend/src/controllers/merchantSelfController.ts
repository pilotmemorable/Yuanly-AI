import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import { HttpError, pageParams, pagination, parse } from '../utils/http';
import { parseJsonField } from '../utils/json';
import {
  BOOKING_STATUSES,
  bookingIncludeWithUser,
  changeBookingStatus,
  createBooking,
  serializeBooking,
} from '../services/bookingService';

// GET /v1/merchant/me
export const getMyCompany = async (req: AuthRequest, res: Response) => {
  const merchant = req.merchant;
  const experiences = await prisma.experience.findMany({
    where: { merchantId: merchant.id },
    select: { id: true, title: true, titleCn: true, titleTr: true, priceCny: true, capacity: true, duration: true, isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  res.status(200).json({
    merchant: { ...merchant, contactInfo: parseJsonField(merchant.contactInfo) },
    experiences,
  });
};

// GET /v1/merchant/bookings
export const listMerchantBookings = async (req: AuthRequest, res: Response) => {
  const merchantId = req.merchant.id;
  const { status, scope, date } = req.query as Record<string, string | undefined>;
  const { page, limit, skip, take } = pageParams(req.query, 30);

  const where: any = { experience: { merchantId } };
  if (status && (BOOKING_STATUSES as readonly string[]).includes(status)) where.status = status;
  if (scope === 'past') {
    where.OR = [{ status: { in: ['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'] } }, { slotTime: { lt: new Date() } }];
  } else if (scope === 'upcoming') {
    where.status = where.status || { in: ['PENDING', 'CONFIRMED'] };
    where.slotTime = { gte: new Date() };
  }
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    where.slotTime = {
      ...(where.slotTime || {}),
      gte: new Date(`${date}T00:00:00+03:00`),
      lt: new Date(new Date(`${date}T00:00:00+03:00`).getTime() + 24 * 3600 * 1000),
    };
  }

  const [bookings, total, grouped] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: bookingIncludeWithUser,
      orderBy: { slotTime: scope === 'past' ? 'desc' : 'asc' },
      skip,
      take,
    }),
    prisma.booking.count({ where }),
    prisma.booking.groupBy({ by: ['status'], where: { experience: { merchantId } }, _count: { status: true } }),
  ]);

  const counts: Record<string, number> = {
    PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0, REJECTED: 0, NO_SHOW: 0,
  };
  grouped.forEach((g) => (counts[g.status] = g._count.status));

  res.status(200).json({ bookings: bookings.map(serializeBooking), pagination: pagination(page, limit, total), counts });
};

const manualSchema = z.object({
  experienceId: z.string().min(1),
  startTime: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'must be an ISO date-time'),
  guestCount: z.coerce.number().int().min(1).max(100),
  guestName: z.string().trim().min(1).max(100),
  guestPhone: z.string().trim().max(32).optional(),
  notes: z.string().trim().max(500).optional(),
  status: z.enum(['CONFIRMED', 'PENDING']).default('CONFIRMED'),
});

// POST /v1/merchant/bookings — reservation taken by phone / walk-in
export const createManualBooking = async (req: AuthRequest, res: Response) => {
  const body = parse(manualSchema, req.body);
  const startTime = new Date(body.startTime);
  if (startTime.getTime() <= Date.now()) {
    throw new HttpError(400, 'ERR_VALIDATION', 'startTime must be in the future');
  }
  const booking = await createBooking({
    userId: req.user!.id,
    experienceId: body.experienceId,
    startTime,
    guestCount: body.guestCount,
    guestName: body.guestName,
    guestPhone: body.guestPhone,
    notes: body.notes,
    source: 'MANUAL',
    status: body.status,
    merchantId: req.merchant.id,
  });
  res.status(201).json({ booking: serializeBooking(booking) });
};

const statusSchema = z.object({
  status: z.enum(['CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
  reason: z.string().trim().max(300).optional(),
});

// PUT /v1/merchant/bookings/:id/status
export const updateMerchantBookingStatus = async (req: AuthRequest, res: Response) => {
  const body = parse(statusSchema, req.body);
  const booking = await changeBookingStatus({
    bookingId: req.params.id,
    to: body.status,
    reason: body.reason || null,
    actor: { kind: 'merchant', merchantId: req.merchant.id },
  });
  res.status(200).json({ booking: serializeBooking(booking) });
};
