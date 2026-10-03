import { Request, Response } from 'express';
import prisma from '../config/db';
import crypto from 'crypto';

// POST /v1/payment/initiate — Initiate a payment
export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { bookingId, method } = req.body;

    if (!bookingId || !method) {
      return res.status(400).json({ error: 'bookingId and method are required' });
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId, status: 'PENDING' }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or not in pending state' });
    }

    const idempotencyKey = crypto.randomBytes(16).toString('hex');

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        method,
        amount: booking.totalAmount,
        currency: booking.currency,
        status: 'INITIATED',
        idempotencyKey
      }
    });

    // Generate payment URL based on method
    // In production, this would call WeChat Pay / Alipay / Stripe API
    const paymentUrl = generatePaymentUrl(method, payment.id, booking.totalAmount, idempotencyKey);

    await prisma.payment.update({
      where: { id: payment.id },
      data: { paymentUrl, status: 'PENDING' }
    });

    res.status(200).json({
      paymentId: payment.id,
      paymentUrl,
      transactionId: payment.id,
      method,
      amount: booking.totalAmount,
      currency: booking.currency,
      status: 'PENDING'
    });
  } catch (error) {
    console.error('[Payment] Initiate error:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
};

// POST /v1/payment/webhook — Webhook for payment gateway callbacks
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const { transactionId, status, paymentRef, failureReason } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'transactionId is required' });
    }

    const payment = await prisma.payment.findFirst({
      where: { transactionId },
      include: { booking: true }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (status === 'SUCCESS') {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'SUCCESS', transactionId: paymentRef, webhookReceived: true }
        }),
        prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED', paymentRef }
        })
      ]);

      // Generate QR code for confirmed booking
      const qrCode = crypto.randomBytes(20).toString('hex');
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { qrCode }
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: payment.booking.userId,
          type: 'payment_success',
          title: 'Payment Successful',
          body: 'Your payment has been received. Your QR ticket is now ready in My Trips.',
          data: JSON.stringify({ bookingId: payment.bookingId, qrCode })
        }
      });

    } else if (status === 'FAILED') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason, webhookReceived: true }
      });

      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CANCELLED' }
      });
    }

    res.status(200).json({ status: 'OK' });
  } catch (error) {
    console.error('[Payment] Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// GET /v1/payment/:id/status — Check payment status
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const payment = await prisma.payment.findFirst({
      where: { id, booking: { userId } },
      include: { booking: true }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.status(200).json({
      paymentId: payment.id,
      status: payment.status,
      method: payment.method,
      amount: payment.amount,
      currency: payment.currency,
      bookingStatus: payment.booking.status
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
};

// POST /v1/payment/:id/refund — Process a refund
export const processRefund = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { booking: true }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'SUCCESS') {
      return res.status(400).json({ error: 'Can only refund successful payments' });
    }

    // In production, call the gateway's refund API
    await prisma.$transaction([
      prisma.payment.update({
        where: { id },
        data: { status: 'REFUNDED' }
      }),
      prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'REFUNDED' }
      })
    ]);

    await prisma.notification.create({
      data: {
        userId: payment.booking.userId,
        type: 'refund_processed',
        title: 'Refund Processed',
        body: `Your refund of ${payment.amount} ${payment.currency} has been processed.`,
        data: JSON.stringify({ paymentId: id, reason })
      }
    });

    res.status(200).json({ message: 'Refund processed successfully' });
  } catch (error) {
    console.error('[Payment] Refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
};

// --- Helper ---
function generatePaymentUrl(method: string, paymentId: string, amount: any, idempotencyKey: string): string {
  // In production, these would be real API calls:
  // - WeChat Pay: https://api.mch.weixin.qq.com/pay/unifiedorder
  // - Alipay: https://openapi.alipay.com/gateway.do
  // - Stripe: https://api.stripe.com/v1/checkout/sessions

  const baseUrls: Record<string, string> = {
    WECHAT_PAY: 'https://yuanly.ai/pay/wechat',
    ALIPAY: 'https://yuanly.ai/pay/alipay',
    STRIPE: 'https://yuanly.ai/pay/stripe',
    PAYPAL: 'https://yuanly.ai/pay/paypal'
  };

  return `${baseUrls[method] || baseUrls.STRIPE}?pid=${paymentId}&amt=${amount}&key=${idempotencyKey}`;
}