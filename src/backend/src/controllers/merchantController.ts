import { Request, Response } from 'express';
import prisma from '../config/db';

// POST /v1/merchants/register — Merchant self-registration
export const registerMerchant = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { businessName, category, location, latitude, longitude, description, images, contactInfo, operatingHours } = req.body;

    if (!businessName || !category || !location) {
      return res.status(400).json({ error: 'businessName, category, and location are required' });
    }

    const merchant = await prisma.merchant.create({
      data: {
        userId,
        businessName,
        category,
        location,
        latitude,
        longitude,
        description,
        images: JSON.stringify(images || []),
        contactInfo: JSON.stringify(contactInfo || {}),
        operatingHours: JSON.stringify(operatingHours || {}),
        isVerified: false, // Requires admin approval
        isActive: false
      }
    });

    res.status(201).json({
      merchant,
      message: 'Merchant registered. Pending verification by Yuanly team.'
    });
  } catch (error) {
    console.error('[Merchant] Register error:', error);
    res.status(500).json({ error: 'Failed to register merchant' });
  }
};

// GET /v1/merchants/:id — Get merchant profile
export const getMerchant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const merchant = await prisma.merchant.findUnique({
      where: { id },
      include: {
        experiences: { where: { isActive: true } }
      }
    });

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    res.status(200).json({ merchant });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch merchant' });
  }
};

// GET /v1/merchants — List merchants (with filters)
export const listMerchants = async (req: Request, res: Response) => {
  try {
    const { category, location, verified, page = 1, limit = 20 } = req.query;

    const merchants = await prisma.merchant.findMany({
      where: {
        isActive: true,
        ...(category && { category: category as any }),
        ...(location && { location: { contains: String(location) } }),
        ...(verified === 'true' && { isVerified: true })
      },
      include: {
        experiences: { where: { isActive: true }, select: { id: true, title: true, priceCny: true, rating: true, images: true } }
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { rating: 'desc' }
    });

    res.status(200).json({ merchants, pagination: { page: Number(page), limit: Number(limit) } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch merchants' });
  }
};

// PUT /v1/merchants/:id — Update merchant profile
export const updateMerchant = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { businessName, description, images, contactInfo, operatingHours } = req.body;

    // Verify ownership
    const merchant = await prisma.merchant.findFirst({
      where: { id, userId }
    });

    if (!merchant) {
      return res.status(403).json({ error: 'Not authorized to update this merchant' });
    }

    const updated = await prisma.merchant.update({
      where: { id },
      data: {
        ...(businessName && { businessName }),
        ...(description && { description }),
        ...(images && { images: JSON.stringify(images) }),
        ...(contactInfo && { contactInfo: JSON.stringify(contactInfo) }),
        ...(operatingHours && { operatingHours: JSON.stringify(operatingHours) })
      }
    });

    res.status(200).json({ merchant: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update merchant' });
  }
};

// POST /v1/merchants/:id/experiences — Create experience
export const createExperience = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { title, titleCn, titleTr, description, descriptionCn, descriptionTr, priceCny, duration, capacity, images, tags } = req.body;

    const merchant = await prisma.merchant.findFirst({
      where: { id, userId }
    });

    if (!merchant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!title || !description || !priceCny) {
      return res.status(400).json({ error: 'title, description, and priceCny are required' });
    }

    const experience = await prisma.experience.create({
      data: {
        merchantId: id,
        title,
        titleCn,
        titleTr,
        description,
        descriptionCn,
        descriptionTr,
        priceCny,
        duration: duration || 'Varies',
        capacity: capacity || 1,
        images: JSON.stringify(images || []),
        tags: JSON.stringify(tags || [])
      }
    });

    res.status(201).json({ experience });
  } catch (error) {
    console.error('[Merchant] Create experience error:', error);
    res.status(500).json({ error: 'Failed to create experience' });
  }
};

// PUT /v1/merchants/:merchantId/experiences/:expId — Update experience
export const updateExperience = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { merchantId, expId } = req.params;

    const merchant = await prisma.merchant.findFirst({
      where: { id: merchantId, userId }
    });

    if (!merchant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.experience.update({
      where: { id: expId, merchantId },
      data: {
        ...req.body,
        ...(req.body?.images !== undefined && { images: JSON.stringify(req.body.images) }),
        ...(req.body?.tags !== undefined && { tags: JSON.stringify(req.body.tags) })
      }
    });

    res.status(200).json({ experience: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update experience' });
  }
};

// DELETE /v1/merchants/:merchantId/experiences/:expId — Soft delete experience
export const deleteExperience = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { merchantId, expId } = req.params;

    const merchant = await prisma.merchant.findFirst({
      where: { id: merchantId, userId }
    });

    if (!merchant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.experience.update({
      where: { id: expId },
      data: { isActive: false }
    });

    res.status(200).json({ message: 'Experience removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove experience' });
  }
};

// GET /v1/merchants/:id/dashboard — Merchant dashboard stats
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const merchant = await prisma.merchant.findFirst({
      where: { id, userId }
    });

    if (!merchant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const experiences = await prisma.experience.findMany({
      where: { merchantId: id },
      include: {
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    const allBookings = experiences.flatMap(e => e.bookings);
    const totalBookings = allBookings.length;
    const totalRevenue = allBookings
      .filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + Number(b.totalAmount), 0);
    const pendingBookings = allBookings.filter(b => b.status === 'PENDING').length;
    const confirmedBookings = allBookings.filter(b => b.status === 'CONFIRMED').length;
    const completedBookings = allBookings.filter(b => b.status === 'COMPLETED').length;

    res.status(200).json({
      stats: {
        totalBookings,
        totalRevenue,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        totalExperiences: experiences.length,
        rating: merchant.rating,
        reviewCount: merchant.reviewCount
      },
      recentBookings: allBookings.slice(0, 10),
      experiences: experiences.map(e => ({
        id: e.id,
        title: e.title,
        priceCny: e.priceCny,
        rating: e.rating,
        bookingCount: e.bookings.length
      }))
    });
  } catch (error) {
    console.error('[Merchant] Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
};