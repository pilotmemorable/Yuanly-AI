import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { HttpError, pageParams, pagination, parse } from '../utils/http';
import {
  BOOKING_STATUSES,
  bookingInclude,
  changeBookingStatus,
  createBooking,
  serializeBooking,
} from '../services/bookingService';

const createSchema = z.object({
  experienceId: z.string().min(1),
  slotId: z.string().min(1),
  guestCount: z.coerce.number().int().min(1).max(50).default(1),
  guestName: z.string().trim().max(100).optional(),
  guestPhone: z.string().trim().max(32).optional(),
  notes: z.string().trim().max(500).optional(),
});

// POST /v1/bookings
export const createUserBooking = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const body = parse(createSchema, req.body);
  const booking = await createBooking({
    userId: user.id,
    experienceId: body.experienceId,
    slotId: body.slotId,
    guestCount: body.guestCount,
    guestName: body.guestName || user.fullName,
    guestPhone: body.guestPhone,
    notes: body.notes,
    source: 'APP',
    status: 'PENDING',
  });
  res.status(201).json({ booking: serializeBooking(booking) });
};

// GET /v1/bookings
export const listBookings = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { status } = req.query;
  const { page, limit, skip, take } = pageParams(req.query);
  const where: any = { userId };
  if (status && (BOOKING_STATUSES as readonly string[]).includes(String(status))) where.status = String(status);

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({ where, include: bookingInclude, orderBy: { slotTime: 'desc' }, skip, take }),
    prisma.booking.count({ where }),
  ]);
  res.status(200).json({ bookings: bookings.map(serializeBooking), pagination: pagination(page, limit, total) });
};

// GET /v1/bookings/:id
export const getBookingDetail = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, userId },
    include: { ...bookingInclude, review: true },
  });
  if (!booking) throw new HttpError(404, 'ERR_NOT_FOUND', 'Booking not found');
  res.status(200).json({ booking: serializeBooking(booking) });
};

// POST /v1/bookings/:id/cancel
export const cancelBooking = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const body = parse(z.object({ reason: z.string().trim().max(300).optional() }), req.body || {});
  const booking = await changeBookingStatus({
    bookingId: req.params.id,
    to: 'CANCELLED',
    reason: body.reason || null,
    actor: { kind: 'user', userId },
  });
  res.status(200).json({ booking: serializeBooking(booking) });
};

// GET /v1/bookings/:id/qr
export const getQRTicket = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, userId, status: { in: ['CONFIRMED', 'COMPLETED'] } },
    include: { experience: { include: { merchant: { select: { businessName: true } } } } },
  });
  if (!booking || !booking.qrCode) throw new HttpError(404, 'ERR_NOT_FOUND', 'QR ticket not available');
  res.status(200).json({
    qrCode: booking.qrCode,
    booking: {
      id: booking.id,
      experience: booking.experience.title,
      experienceCn: booking.experience.titleCn,
      merchant: booking.experience.merchant.businessName,
      date: booking.slotTime,
      guestCount: booking.guestCount,
      status: booking.status,
    },
  });
};
