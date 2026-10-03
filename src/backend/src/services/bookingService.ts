import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../config/db';
import { HttpError } from '../utils/http';
import { parseArrayField, parseJsonField } from '../utils/json';
import { parseDurationMinutes } from '../utils/time';
import { notify } from './notify';

export const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

const TRANSITIONS: Record<string, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'NO_SHOW', 'CANCELLED'],
};
const RELEASES_SEATS: BookingStatus[] = ['REJECTED', 'CANCELLED'];

export const bookingInclude = {
  experience: {
    select: {
      id: true,
      title: true,
      titleCn: true,
      titleTr: true,
      images: true,
      duration: true,
      merchant: { select: { id: true, businessName: true, location: true, contactInfo: true } },
    },
  },
} satisfies Prisma.BookingInclude;

export const bookingIncludeWithUser = {
  ...bookingInclude,
  user: { select: { id: true, fullName: true, email: true, phone: true } },
} satisfies Prisma.BookingInclude;

// Normalises a Prisma booking row for API responses.
export function serializeBooking(b: any) {
  const out: any = { ...b };
  if (b.experience) {
    out.experience = {
      ...b.experience,
      images: parseArrayField(b.experience.images),
      merchant: b.experience.merchant
        ? { ...b.experience.merchant, contactInfo: parseJsonField(b.experience.merchant.contactInfo) }
        : null,
    };
  }
  if (b.merchant) out.merchant = b.merchant;
  return out;
}

async function lockSlot(tx: Prisma.TransactionClient, slotId: string) {
  await tx.$queryRaw`SELECT id FROM "Slot" WHERE id = ${slotId} FOR UPDATE`;
  return tx.slot.findUnique({ where: { id: slotId } });
}

interface CreateParams {
  userId: string;
  experienceId: string;
  slotId?: string;
  startTime?: Date;
  guestCount: number;
  guestName?: string | null;
  guestPhone?: string | null;
  notes?: string | null;
  source: 'APP' | 'MANUAL';
  status: 'PENDING' | 'CONFIRMED';
  merchantId?: string; // when set, the experience must belong to this merchant
}

export async function createBooking(p: CreateParams) {
  const booking = await prisma.$transaction(async (tx) => {
    const experience = await tx.experience.findUnique({
      where: { id: p.experienceId },
      include: { merchant: true },
    });
    if (!experience || !experience.isActive || !experience.merchant.isActive || !experience.merchant.isVerified) {
      throw new HttpError(404, 'ERR_NOT_FOUND', 'Experience not found');
    }
    if (p.merchantId && experience.merchantId !== p.merchantId) {
      throw new HttpError(403, 'ERR_FORBIDDEN', 'Experience does not belong to your company');
    }

    let slotId = p.slotId;
    if (!slotId) {
      if (!p.startTime) throw new HttpError(400, 'ERR_VALIDATION', 'startTime is required');
      const endTime = new Date(p.startTime.getTime() + parseDurationMinutes(experience.duration) * 60000);
      const slot = await tx.slot.upsert({
        where: { experienceId_startTime: { experienceId: experience.id, startTime: p.startTime } },
        create: {
          experienceId: experience.id,
          merchantId: experience.merchantId,
          startTime: p.startTime,
          endTime,
          capacity: experience.capacity,
          priceCny: experience.priceCny,
        },
        update: {},
      });
      slotId = slot.id;
    }

    const slot = await lockSlot(tx, slotId);
    if (!slot || slot.experienceId !== experience.id) {
      throw new HttpError(409, 'ERR_SLOT_TAKEN', 'This time slot is no longer available');
    }
    if (slot.status !== 'AVAILABLE' || slot.startTime.getTime() <= Date.now()) {
      throw new HttpError(409, 'ERR_SLOT_TAKEN', 'This time slot is no longer available');
    }
    if (slot.bookedCount + p.guestCount > slot.capacity) {
      throw new HttpError(409, 'ERR_CAPACITY_FULL', 'Not enough spots left for this group size', {
        remaining: Math.max(0, slot.capacity - slot.bookedCount),
      });
    }

    await tx.slot.update({ where: { id: slot.id }, data: { bookedCount: { increment: p.guestCount } } });

    return tx.booking.create({
      data: {
        userId: p.userId,
        experienceId: experience.id,
        slotId: slot.id,
        slotTime: slot.startTime,
        guestCount: p.guestCount,
        guestName: p.guestName || null,
        guestPhone: p.guestPhone || null,
        notes: p.notes || null,
        source: p.source,
        status: p.status,
        totalAmount: slot.priceCny * p.guestCount,
        currency: 'CNY',
        qrCode: p.status === 'CONFIRMED' ? crypto.randomBytes(20).toString('hex') : null,
      },
      include: {
        ...bookingIncludeWithUser,
        experience: { select: { ...bookingInclude.experience.select, merchant: { select: { id: true, businessName: true, location: true, contactInfo: true, userId: true } } } },
      },
    });
  });

  // Notifications (outside the transaction, best-effort)
  const merchantUserId = (booking.experience.merchant as any).userId as string | null;
  if (p.source === 'APP' && merchantUserId) {
    await notify(merchantUserId, 'booking_requested', {
      experience: booking.experience.titleCn || booking.experience.title,
      when: booking.slotTime,
      guests: booking.guestCount,
      customer: booking.guestName || booking.user.fullName || booking.user.email,
    }, { bookingId: booking.id });
  }
  return booking;
}

interface ChangeParams {
  bookingId: string;
  to: BookingStatus;
  reason?: string | null;
  // Authorisation scope: one of these must match the booking.
  actor: { kind: 'admin' } | { kind: 'merchant'; merchantId: string } | { kind: 'user'; userId: string };
}

export async function changeBookingStatus(p: ChangeParams) {
  const updated = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: p.bookingId },
      include: { experience: { select: { merchantId: true, title: true, titleCn: true } } },
    });
    if (!booking) throw new HttpError(404, 'ERR_NOT_FOUND', 'Booking not found');

    if (p.actor.kind === 'merchant' && booking.experience.merchantId !== p.actor.merchantId) {
      throw new HttpError(404, 'ERR_NOT_FOUND', 'Booking not found');
    }
    if (p.actor.kind === 'user') {
      if (booking.userId !== p.actor.userId) throw new HttpError(404, 'ERR_NOT_FOUND', 'Booking not found');
      if (p.to !== 'CANCELLED') throw new HttpError(403, 'ERR_FORBIDDEN', 'Customers can only cancel');
      if (booking.slotTime.getTime() <= Date.now()) {
        throw new HttpError(409, 'ERR_INVALID_TRANSITION', 'This reservation has already started');
      }
    }

    const allowed = TRANSITIONS[booking.status] || [];
    if (!allowed.includes(p.to)) {
      throw new HttpError(409, 'ERR_INVALID_TRANSITION', `Cannot change a ${booking.status} reservation to ${p.to}`);
    }

    if (RELEASES_SEATS.includes(p.to) && booking.slotId) {
      await lockSlot(tx, booking.slotId);
      await tx.slot.update({ where: { id: booking.slotId }, data: { bookedCount: { decrement: booking.guestCount } } });
    }

    const next = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: p.to,
        ...(p.to === 'CONFIRMED' && !booking.qrCode ? { qrCode: crypto.randomBytes(20).toString('hex') } : {}),
        ...(RELEASES_SEATS.includes(p.to) ? { cancelReason: p.reason || null } : {}),
      },
      include: bookingIncludeWithUser,
    });
    return { next, previous: booking };
  });

  const { next } = updated;
  const exp = next.experience;
  const vars = { experience: exp.titleCn || exp.title, when: next.slotTime, guests: next.guestCount, reason: p.reason };
  const data = { bookingId: next.id };
  const byCustomer = p.actor.kind === 'user';
  const merchantRow = await prisma.merchant.findUnique({ where: { id: exp.merchant.id }, select: { userId: true } });

  if (next.source === 'APP') {
    if (p.to === 'CONFIRMED') await notify(next.userId, 'booking_confirmed', vars, data);
    if (p.to === 'REJECTED') await notify(next.userId, 'booking_rejected', vars, data);
    if (p.to === 'COMPLETED') await notify(next.userId, 'booking_completed', vars, data);
    if (p.to === 'CANCELLED' && !byCustomer) await notify(next.userId, 'booking_cancelled', vars, data);
  }
  if (p.to === 'CANCELLED' && byCustomer && merchantRow?.userId) {
    await notify(merchantRow.userId, 'booking_cancelled', { ...vars, reason: p.reason }, data);
  }
  return next;
}
