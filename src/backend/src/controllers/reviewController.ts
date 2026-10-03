import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { HttpError, pageParams, pagination, parse } from '../utils/http';
import { parseArrayField } from '../utils/json';

const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
  mediaUrls: z.array(z.string().url().max(500)).max(6).optional(),
});

// POST /v1/reviews — own COMPLETED booking only
export const createReview = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const body = parse(reviewSchema, req.body);

  const booking = await prisma.booking.findFirst({
    where: { id: body.bookingId, userId, status: 'COMPLETED' },
    include: { review: true, experience: true },
  });
  if (!booking) throw new HttpError(404, 'ERR_NOT_FOUND', 'Booking not found or not eligible for review');
  if (booking.review) throw new HttpError(409, 'ERR_REVIEW_EXISTS', 'Review already exists for this booking');

  const review = await prisma.review.create({
    data: {
      bookingId: booking.id,
      userId,
      experienceId: booking.experienceId,
      rating: body.rating,
      comment: body.comment || '',
      mediaUrls: JSON.stringify(body.mediaUrls || []),
    },
  });

  const agg = await prisma.review.aggregate({ where: { experienceId: booking.experienceId }, _avg: { rating: true }, _count: true });
  await prisma.experience.update({
    where: { id: booking.experienceId },
    data: { rating: Math.round((agg._avg.rating || 0) * 10) / 10, reviewCount: agg._count },
  });

  const exps = await prisma.experience.findMany({
    where: { merchantId: booking.experience.merchantId },
    select: { rating: true, reviewCount: true },
  });
  const totalReviews = exps.reduce((s, e) => s + e.reviewCount, 0);
  const weighted = exps.reduce((s, e) => s + e.rating * e.reviewCount, 0);
  await prisma.merchant.update({
    where: { id: booking.experience.merchantId },
    data: { rating: totalReviews ? Math.round((weighted / totalReviews) * 10) / 10 : 0, reviewCount: totalReviews },
  });

  const userReviews = await prisma.review.count({ where: { userId } });
  await prisma.user.update({ where: { id: userId }, data: { trustScore: Math.min(userReviews * 0.5, 10) } });

  res.status(201).json({ review: { ...review, mediaUrls: parseArrayField(review.mediaUrls) }, message: 'Review submitted successfully' });
};

// GET /v1/reviews/experience/:experienceId
export const getExperienceReviews = async (req: Request, res: Response) => {
  const { page, limit, skip, take } = pageParams(req.query, 20);
  const where = { experienceId: req.params.experienceId };
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.review.count({ where }),
  ]);
  res.status(200).json({
    reviews: reviews.map((r) => ({ ...r, mediaUrls: parseArrayField(r.mediaUrls) })),
    pagination: pagination(page, limit, total),
  });
};

// GET /v1/reviews/user/:userId — own reviews only
export const getUserReviews = async (req: Request, res: Response) => {
  const me = (req as any).user;
  if (me.id !== req.params.userId) throw new HttpError(403, 'ERR_FORBIDDEN', 'Not authorized');
  const reviews = await prisma.review.findMany({ where: { userId: me.id }, orderBy: { createdAt: 'desc' }, take: 100 });
  res.status(200).json({ reviews: reviews.map((r) => ({ ...r, mediaUrls: parseArrayField(r.mediaUrls) })) });
};
