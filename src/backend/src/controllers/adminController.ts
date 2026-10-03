import { Request, Response } from 'express';
import prisma from '../config/db';

// Middleware to check admin role
export const requireAdmin = async (req: any, res: Response, next: any) => {
  const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// GET /v1/admin/stats — Platform-wide statistics
export const getPlatformStats = async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalMerchants, totalExperiences, totalBookings, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.merchant.count(),
      prisma.experience.count({ where: { isActive: true } }),
      prisma.booking.count(),
      prisma.booking.aggregate({
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _sum: { totalAmount: true }
      })
    ]);

    const pendingMerchants = await prisma.merchant.count({ where: { isVerified: false } });
    const pendingBookings = await prisma.booking.count({ where: { status: 'PENDING' } });

    // Bookings by status
    const bookingsByStatus = await prisma.booking.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    // Top experiences by bookings
    const topExperiences = await prisma.experience.findMany({
      include: { _count: { select: { bookings: true } }, merchant: true },
      orderBy: { rating: 'desc' },
      take: 5
    });

    res.status(200).json({
      totals: {
        users: totalUsers,
        merchants: totalMerchants,
        experiences: totalExperiences,
        bookings: totalBookings,
        revenue: totalRevenue._sum.totalAmount || 0,
        pendingMerchants,
        pendingBookings
      },
      bookingsByStatus: bookingsByStatus.reduce((acc, b) => {
        acc[b.status] = b._count.status;
        return acc;
      }, {} as Record<string, number>),
      topExperiences: topExperiences.map(e => ({
        id: e.id,
        title: e.title,
        merchant: e.merchant.businessName,
        rating: e.rating,
        bookingCount: e._count.bookings
      }))
    });
  } catch (error) {
    console.error('[Admin] Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch platform stats' });
  }
};

// GET /v1/admin/merchants/pending — List merchants pending verification
export const getPendingMerchants = async (req: Request, res: Response) => {
  try {
    const merchants = await prisma.merchant.findMany({
      where: { isVerified: false },
      include: { experiences: true },
      orderBy: { createdAt: 'asc' }
    });

    res.status(200).json({ merchants, count: merchants.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending merchants' });
  }
};

// PUT /v1/admin/merchants/:id/verify — Verify a merchant
export const verifyMerchant = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id;
    const { id } = req.params;
    const { approved, commissionRate } = req.body;

    const merchant = await prisma.merchant.update({
      where: { id },
      data: {
        isVerified: approved !== false,
        isActive: approved !== false,
        ...(commissionRate && { commissionRate })
      }
    });

    await prisma.adminLog.create({
      data: {
        adminId,
        action: approved === false ? 'merchant_rejected' : 'merchant_verified',
        targetId: id,
        metadata: JSON.stringify({ businessName: merchant.businessName })
      }
    });

    res.status(200).json({
      merchant,
      message: approved === false ? 'Merchant rejected' : 'Merchant verified successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify merchant' });
  }
};

// GET /v1/admin/bookings — All bookings with filters
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    const bookings = await prisma.booking.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
        experience: { select: { id: true, title: true, merchant: { select: { businessName: true } } } },
        payment: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.booking.count(status ? { where: { status: status as any } } : undefined);

    res.status(200).json({
      bookings,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// PUT /v1/admin/users/:id/role — Grant/revoke merchant authority
// Only the single ADMIN can do this
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id;
    const { id } = req.params;
    const { role } = req.body;

    if (!['USER', 'MERCHANT'].includes(role)) {
      return res.status(400).json({ error: 'Can only set role to USER or MERCHANT. ADMIN is exclusive.' });
    }

    // Prevent creating another admin
    if (role === 'ADMIN') {
      return res.status(403).json({ error: 'Cannot create another admin. Admin is a single-account role.' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Cannot modify admin role' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, fullName: true, email: true, role: true, membershipLevel: true }
    });

    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'role_changed',
        targetId: id,
        metadata: JSON.stringify({ oldRole: user.role, newRole: role })
      }
    });

    res.status(200).json({
      user: updated,
      message: role === 'MERCHANT' ? 'Merchant authority granted. User can now access merchant dashboard.' : 'Merchant authority revoked. User is now a regular user.'
    });
  } catch (error) {
    console.error('[Admin] Role update error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// GET /v1/admin/users — List all users (for admin to manage roles)
export const listUsers = async (req: Request, res: Response) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;

    const users = await prisma.user.findMany({
      where: role ? { role: String(role) } : { role: { not: 'ADMIN' } },
      select: {
        id: true, fullName: true, email: true, phone: true,
        role: true, membershipLevel: true, preferredLanguage: true,
        trustScore: true, createdAt: true,
        _count: { select: { bookings: true, reviews: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    res.status(200).json({ users, count: users.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// GET /v1/admin/financial — Financial overview
export const getFinancialOverview = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {
      createdAt: {
        ...(startDate && { gte: new Date(String(startDate)) }),
        ...(endDate && { lte: new Date(String(endDate)) })
      }
    };

    const [totalRevenue, totalRefunds, platformCommission, paymentsByMethod] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'SUCCESS', ...dateFilter },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { status: 'REFUNDED', ...dateFilter },
        _sum: { amount: true }
      }),
      prisma.merchant.aggregate({ _sum: { commissionRate: true } }),
      prisma.payment.groupBy({
        by: ['method'],
        where: { status: 'SUCCESS', ...dateFilter },
        _count: { method: true },
        _sum: { amount: true }
      })
    ]);

    res.status(200).json({
      totalRevenue: totalRevenue._sum.amount || 0,
      totalRefunds: totalRefunds._sum.amount || 0,
      netRevenue: Number(totalRevenue._sum.amount || 0) - Number(totalRefunds._sum.amount || 0),
      paymentsByMethod: paymentsByMethod.map(p => ({
        method: p.method,
        count: p._count.method,
        amount: p._sum.amount || 0
      }))
    });
  } catch (error) {
    console.error('[Admin] Financial error:', error);
    res.status(500).json({ error: 'Failed to fetch financial overview' });
  }
};