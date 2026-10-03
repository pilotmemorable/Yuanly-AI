import prisma from '../config/db';
import { changeBookingStatus } from './bookingService';

export const userSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  avatar: true,
  role: true,
  membershipLevel: true,
  preferredLanguage: true,
  trustScore: true,
  travelStyle: true,
  createdAt: true,
  merchant: { select: { id: true, businessName: true, category: true, location: true, isVerified: true, isActive: true } },
} as const;

// Removes personal data but keeps booking history for the companies' records.
export async function anonymizeUser(userId: string) {
  const upcoming = await prisma.booking.findMany({
    where: { userId, status: { in: ['PENDING', 'CONFIRMED'] }, slotTime: { gt: new Date() } },
    select: { id: true },
  });
  for (const b of upcoming) {
    try {
      await changeBookingStatus({ bookingId: b.id, to: 'CANCELLED', reason: 'Account deleted', actor: { kind: 'admin' } });
    } catch (err) {
      console.error('[anonymizeUser] could not cancel booking', b.id, err);
    }
  }
  await prisma.$transaction([
    prisma.booking.updateMany({ where: { userId }, data: { guestName: null, guestPhone: null } }),
    prisma.merchant.updateMany({ where: { userId }, data: { userId: null } }),
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.userInteraction.deleteMany({ where: { userId } }),
    prisma.socialPost.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted+${userId}@deleted.invalid`,
        fullName: 'Deleted user',
        phone: null,
        avatar: null,
        passwordHash: null,
        isActive: false,
        role: 'USER',
      },
    }),
  ]);
}
