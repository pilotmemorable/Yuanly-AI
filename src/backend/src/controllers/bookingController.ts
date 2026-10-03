import { Request, Response } from 'express';
import prisma from '../config/db';
import crypto from 'crypto';

// GET /v1/bookings — List user's bookings
export const listBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { status, page = 1, limit = 20 } = req.query;

    const bookings = await prisma.booking.findMany({
      where: {
        userId,
        ...(status && { status: status as any })
      },
      include: {
        experience: { include: { merchant: true } },
        slot: true,
        payment: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.booking.count({ where: { userId } });

    res.status(200).json({
      bookings,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    console.error('[Booking] List error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// GET /v1/bookings/:id — Get booking detail
export const getBookingDetail = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: { id, userId },
      include: {
        experience: { include: { merchant: true } },
        slot: true,
        payment: true,
        review: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.status(200).json({ booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};

// POST /v1/bookings/hold — Hold a slot for 15 minutes
export const holdSlot = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { experienceId, slotId, guestCount = 1 } = req.body;

    if (!experienceId || !slotId) {
      return res.status(400).json({ error: 'experienceId and slotId are required' });
    }

    // Check slot availability
    const slot = await prisma.slot.findFirst({
      where: { id: slotId, experienceId, status: 'AVAILABLE' }
    });

    if (!slot) {
      // Find alternative slots
      const alternatives = await prisma.slot.findMany({
        where: { experienceId, status: 'AVAILABLE' },
        take: 3
      });
      return res.status(409).json({
        error_code: 'ERR_SLOT_TAKEN',
        message: 'This slot is no longer available.',
        suggested_slots: alternatives
      });
    }

    // Check capacity
    if (slot.bookedCount + guestCount > slot.capacity) {
      return res.status(409).json({
        error_code: 'ERR_CAPACITY_FULL',
        message: 'Not enough spots available for your group size.'
      });
    }

    // Create hold
    const holdId = crypto.randomBytes(16).toString('hex');
    const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.slot.update({
      where: { id: slotId },
      data: { status: 'HELD', holdId, holdExpiresAt }
    });

    // Create pending booking
    const totalAmount = Number(slot.priceCny) * guestCount;

    const booking = await prisma.booking.create({
      data: {
        userId,
        experienceId,
        slotId,
        slotTime: slot.startTime,
        guestCount,
        status: 'PENDING',
        totalAmount,
        currency: 'CNY',
        notes: `Hold ID: ${holdId}`
      }
    });

    res.status(200).json({
      holdId,
      bookingId: booking.id,
      expiresAt: holdExpiresAt.toISOString(),
      totalAmount,
      currency: 'CNY',
      status: 'success'
    });
  } catch (error) {
    console.error('[Booking] Hold error:', error);
    res.status(500).json({ error: 'Failed to hold slot' });
  }
};

// POST /v1/bookings/confirm — Confirm a booking after payment
export const confirmBooking = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { bookingId, paymentRef } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' });
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId, status: 'PENDING' }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or already processed' });
    }

    // Generate QR code
    const qrCode = crypto.randomBytes(20).toString('hex');

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        paymentRef,
        qrCode
      },
      include: { experience: { include: { merchant: true } }, slot: true }
    });

    // Update slot status
    if (booking.slotId) {
      await prisma.slot.update({
        where: { id: booking.slotId },
        data: { status: 'BOOKED', bookedCount: { increment: booking.guestCount } }
      });
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'booking_confirmed',
        title: 'Booking Confirmed!',
        body: `Your booking for ${updated.experience.title} is confirmed. QR ticket is ready.`,
        data: JSON.stringify({ bookingId, qrCode })
      }
    });

    res.status(200).json({
      booking: updated,
      qrCode,
      message: 'Booking confirmed successfully'
    });
  } catch (error) {
    console.error('[Booking] Confirm error:', error);
    res.status(500).json({ error: 'Failed to confirm booking' });
  }
};

// POST /v1/bookings/:id/cancel — Cancel a booking
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await prisma.booking.findFirst({
      where: { id, userId, status: { in: ['PENDING', 'CONFIRMED'] } }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or cannot be cancelled' });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED', notes: reason || 'Cancelled by user' }
    });

    // Release the slot
    if (booking.slotId) {
      await prisma.slot.update({
        where: { id: booking.slotId },
        data: { status: 'AVAILABLE', holdId: null, holdExpiresAt: null, bookedCount: { decrement: booking.guestCount } }
      });
    }

    await prisma.notification.create({
      data: {
        userId,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        body: `Your booking has been cancelled. Refund will be processed if applicable.`,
        data: JSON.stringify({ bookingId: id })
      }
    });

    res.status(200).json({ booking: updated, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('[Booking] Cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

// GET /v1/bookings/:id/qr — Get QR ticket
export const getQRTicket = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: { id, userId, status: 'CONFIRMED' },
      include: { experience: { include: { merchant: true } } }
    });

    if (!booking || !booking.qrCode) {
      return res.status(404).json({ error: 'QR ticket not available' });
    }

    res.status(200).json({
      qrCode: booking.qrCode,
      booking: {
        id: booking.id,
        experience: booking.experience.title,
        merchant: booking.experience.merchant.businessName,
        date: booking.slotTime,
        guestCount: booking.guestCount,
        status: booking.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch QR ticket' });
  }
};