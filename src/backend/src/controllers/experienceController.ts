import { Request, Response } from 'express';
import prisma from '../config/db';
import { HttpError, pageParams, pagination } from '../utils/http';
import { parseArrayField, parseJsonField } from '../utils/json';
import { shapeSlot } from './slotController';

// Only experiences of verified, active companies are public.
const PUBLIC_WHERE = { isActive: true, merchant: { isActive: true, isVerified: true } } as const;

const merchantListSelect = {
  id: true,
  businessName: true,
  location: true,
  rating: true,
  isVerified: true,
  category: true,
} as const;

function generateBadge(exp: any): string {
  const tags = parseArrayField(exp.tags);
  if (exp.rating >= 4.9) return 'Global Favorite';
  if (tags.includes('romantic')) return 'Most Romantic';
  if (tags.includes('adventure')) return 'Top Adventure';
  if (tags.includes('cultural')) return 'Cultural Gem';
  return 'Top Pick';
}

const shapeListItem = (exp: any) => ({
  ...exp,
  images: parseArrayField(exp.images),
  tags: parseArrayField(exp.tags),
  aiBadge: generateBadge(exp),
});

// GET /v1/experiences/explore
export const exploreExperiences = async (req: Request, res: Response) => {
  const { vibe, location, category, sort = 'rating' } = req.query;
  const { page, limit } = pageParams(req.query, 20, 50);

  const orderBy: any =
    ({
      rating: { rating: 'desc' },
      newest: { createdAt: 'desc' },
      price_low: { priceCny: 'asc' },
      price_high: { priceCny: 'desc' },
    } as any)[sort as string] || { rating: 'desc' };

  const all = await prisma.experience.findMany({
    where: PUBLIC_WHERE,
    include: { merchant: { select: merchantListSelect } },
    orderBy,
  });

  let filtered = all;
  if (vibe) filtered = filtered.filter((e) => parseArrayField(e.tags).includes(String(vibe).toLowerCase()));
  if (location) {
    const loc = String(location).toLowerCase();
    filtered = filtered.filter((e) => e.merchant.location.toLowerCase().includes(loc));
  }
  if (category) filtered = filtered.filter((e) => e.merchant.category === String(category).toUpperCase());

  const pageItems = filtered.slice((page - 1) * limit, page * limit);
  res.status(200).json({
    experiences: pageItems.map(shapeListItem),
    pagination: pagination(page, limit, filtered.length),
    cursor: `page_${page + 1}`,
  });
};

// GET /v1/experiences/:id
export const getExperienceDetail = async (req: Request, res: Response) => {
  const now = new Date();
  const experience = await prisma.experience.findFirst({
    where: { id: req.params.id, ...PUBLIC_WHERE },
    include: {
      merchant: true,
      slots: {
        where: { status: 'AVAILABLE', startTime: { gt: now, lt: new Date(now.getTime() + 14 * 24 * 3600 * 1000) } },
        orderBy: { startTime: 'asc' },
        take: 60,
      },
      reviews: {
        include: { user: { select: { id: true, fullName: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });
  if (!experience) throw new HttpError(404, 'ERR_NOT_FOUND', 'Experience not found');

  const m = experience.merchant;
  const enriched = {
    ...experience,
    images: parseArrayField(experience.images),
    tags: parseArrayField(experience.tags),
    slots: experience.slots.map(shapeSlot).filter((s) => s.remaining > 0),
    merchant: {
      id: m.id,
      businessName: m.businessName,
      location: m.location,
      category: m.category,
      rating: m.rating,
      reviewCount: m.reviewCount,
      isVerified: m.isVerified,
      images: parseArrayField(m.images),
      contactInfo: parseJsonField(m.contactInfo),
      operatingHours: parseJsonField(m.operatingHours),
    },
    reviews: experience.reviews.map((r) => ({ ...r, mediaUrls: parseArrayField(r.mediaUrls) })),
  };

  const userId = (req as any).user?.id;
  if (userId) {
    prisma.userInteraction
      .create({ data: { userId, type: 'view', targetId: experience.id, metadata: JSON.stringify({ tags: enriched.tags }) } })
      .catch(() => undefined);
  }

  res.status(200).json({ experience: enriched });
};

// GET /v1/experiences/search?q=
export const searchExperiences = async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q) throw new HttpError(400, 'ERR_VALIDATION', 'Search query (q) is required');
  const { page, limit } = pageParams(req.query, 20, 50);

  const query = String(q).toLowerCase();
  const all = await prisma.experience.findMany({
    where: PUBLIC_WHERE,
    include: { merchant: { select: merchantListSelect } },
  });
  const filtered = all.filter((e) => {
    const tags = parseArrayField(e.tags);
    return (
      e.title.toLowerCase().includes(query) ||
      e.titleCn?.toLowerCase().includes(query) ||
      e.titleTr?.toLowerCase().includes(query) ||
      e.description.toLowerCase().includes(query) ||
      e.merchant.location.toLowerCase().includes(query) ||
      tags.some((t) => t.toLowerCase().includes(query))
    );
  });

  const userId = (req as any).user?.id;
  if (userId) {
    prisma.userInteraction
      .create({ data: { userId, type: 'search', metadata: JSON.stringify({ query: String(q).slice(0, 100), resultCount: filtered.length }) } })
      .catch(() => undefined);
  }

  res.status(200).json({
    experiences: filtered.slice((page - 1) * limit, page * limit).map(shapeListItem),
    query: q,
    count: filtered.length,
  });
};

// GET /v1/experiences/trending
export const getTrending = async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 10, 30);
  const experiences = await prisma.experience.findMany({
    where: PUBLIC_WHERE,
    include: { merchant: { select: merchantListSelect }, _count: { select: { bookings: true } } },
    orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  });
  res.status(200).json({
    experiences: experiences.map((e) => ({ ...shapeListItem(e), aiBadge: 'Trending Now', recentBookings: e._count.bookings })),
  });
};
