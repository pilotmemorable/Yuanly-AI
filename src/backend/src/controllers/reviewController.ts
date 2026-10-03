import { Request, Response } from 'express';
import prisma from '../config/db';

// POST /v1/reviews — Create a review (must have a completed booking)
export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { bookingId, rating, comment, mediaUrls } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ error: 'bookingId and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify booking exists, belongs to user, and is completed
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId, status: { in: ['CONFIRMED', 'COMPLETED'] } },
      include: { review: true, experience: true }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or not eligible for review' });
    }

    if (booking.review) {
      return res.status(409).json({ error: 'Review already exists for this booking' });
    }

    const review = await prisma.review.create({
      data: {
        bookingId,
        userId,
        experienceId: booking.experienceId,
        rating,
        comment: comment || '',
        mediaUrls: mediaUrls || []
      }
    });

    // Update experience and merchant ratings
    const allReviews = await prisma.review.findMany({
      where: { experienceId: booking.experienceId }
    });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.experience.update({
      where: { id: booking.experienceId },
      data: { rating: Math.round(avgRating * 10) / 10, reviewCount: allReviews.length }
    });

    // Update merchant aggregate rating
    const merchantExperiences = await prisma.experience.findMany({
      where: { merchantId: booking.experience.merchantId },
      select: { rating: true, reviewCount: true }
    });
    const totalReviews = merchantExperiences.reduce((sum, e) => sum + e.reviewCount, 0);
    const weightedSum = merchantExperiences.reduce((sum, e) => sum + (e.rating * e.reviewCount), 0);
    const merchantRating = totalReviews > 0 ? weightedSum / totalReviews : 0;

    await prisma.merchant.update({
      where: { id: booking.experience.merchantId },
      data: { rating: Math.round(merchantRating * 10) / 10, reviewCount: totalReviews }
    });

    // Update user trust score
    const userReviews = await prisma.review.count({ where: { userId } });
    await prisma.user.update({
      where: { id: userId },
      data: { trustScore: Math.min(userReviews * 0.5, 10.0) }
    });

    res.status(201).json({ review, message: 'Review submitted successfully' });
  } catch (error) {
    console.error('[Review] Create error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
};

// GET /v1/reviews/experience/:experienceId — Get reviews for an experience
export const getExperienceReviews = async (req: Request, res: Response) => {
  try {
    const { experienceId } = req.params;
    const { page = 1, limit = 20, sort = 'recent' } = req.query;

    const orderBy: any = sort === 'rating' ? { rating: 'desc' } : { createdAt: 'desc' };

    const reviews = await prisma.review.findMany({
      where: { experienceId },
      include: {
        user: { select: { id: true, fullName: true, avatar: true, trustScore: true } }
      },
      orderBy,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.review.count({ where: { experienceId } });
    const avgRating = total > 0
      ? (await prisma.review.aggregate({ where: { experienceId }, _avg: { rating: true } }))._avg.rating
      : 0;

    res.status(200).json({
      reviews,
      summary: {
        totalReviews: total,
        averageRating: Math.round((avgRating || 0) * 10) / 10
      },
      pagination: { page: Number(page), limit: Number(limit), total }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// GET /v1/reviews/user/:userId — Get reviews by a user
export const getUserReviews = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        experience: { select: { id: true, title: true, images: true, merchant: { select: { businessName: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ reviews, total: reviews.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
};