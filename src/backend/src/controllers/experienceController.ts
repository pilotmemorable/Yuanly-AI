import { Request, Response } from 'express';
import prisma from '../config/db';

// Helper: parse JSON array field (works for both SQLite JSON strings and PostgreSQL arrays)
function parseArrayField(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value); } catch { return []; }
}

// Helper: parse JSON object field
function parseJsonField(value: any): any {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return {}; }
}

// GET /v1/experiences/explore — Discover experiences (Rednote-style feed)
export const exploreExperiences = async (req: Request, res: Response) => {
  try {
    const { vibe, location, category, sort = 'rating', page = 1, limit = 20 } = req.query;

    const orderBy: any = {
      rating: { rating: 'desc' },
      newest: { createdAt: 'desc' },
      price_low: { priceCny: 'asc' },
      price_high: { priceCny: 'desc' }
    }[sort as string] || { rating: 'desc' };

    // Fetch all active experiences (filter in JS for SQLite compatibility)
    const allExperiences = await prisma.experience.findMany({
      where: { isActive: true },
      include: {
        merchant: { select: { id: true, businessName: true, location: true, rating: true, isVerified: true, category: true } }
      },
      orderBy,
    });

    // Filter in JavaScript
    let filtered = allExperiences;
    if (vibe) {
      filtered = filtered.filter(e => parseArrayField(e.tags).includes(String(vibe)));
    }
    if (location) {
      filtered = filtered.filter(e => e.merchant?.location?.toLowerCase().includes(String(location).toLowerCase()));
    }
    if (category) {
      filtered = filtered.filter(e => e.merchant?.category === String(category).toUpperCase());
    }

    // Pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    // Enrich with AI badges and parse fields for response
    const enriched = paginated.map(exp => ({
      ...exp,
      images: parseArrayField(exp.images),
      tags: parseArrayField(exp.tags),
      aiBadge: generateBadge(exp),
    }));

    res.status(200).json({
      experiences: enriched,
      pagination: { page: pageNum, limit: limitNum, total: filtered.length, pages: Math.ceil(filtered.length / limitNum) },
      cursor: `page_${pageNum + 1}`
    });
  } catch (error) {
    console.error('[Experience] Explore error:', error);
    res.status(500).json({ error: 'Failed to fetch experiences' });
  }
};

// GET /v1/experiences/:id — Get experience detail
export const getExperienceDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const experience = await prisma.experience.findFirst({
      where: { id, isActive: true },
      include: {
        merchant: true,
        slots: { where: { status: 'AVAILABLE', startTime: { gte: new Date() } }, orderBy: { startTime: 'asc' }, take: 10 },
        reviews: { include: { user: { select: { id: true, fullName: true, avatar: true, trustScore: true } } }, orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' });
    }

    // Parse JSON fields for response
    const enriched = {
      ...experience,
      images: parseArrayField(experience.images),
      tags: parseArrayField(experience.tags),
      merchant: experience.merchant ? {
        ...experience.merchant,
        images: parseArrayField(experience.merchant.images),
        contactInfo: parseJsonField(experience.merchant.contactInfo),
        operatingHours: parseJsonField(experience.merchant.operatingHours),
      } : null,
      reviews: experience.reviews.map(r => ({ ...r, mediaUrls: parseArrayField(r.mediaUrls) })),
    };

    // Log interaction if user is authenticated
    const userId = (req as any).user?.id;
    if (userId) {
      await prisma.userInteraction.create({
        data: { userId, type: 'view', targetId: id, metadata: JSON.stringify({ tags: enriched.tags }) },
      });
    }

    res.status(200).json({ experience: enriched });
  } catch (error) {
    console.error('[Experience] Detail error:', error);
    res.status(500).json({ error: 'Failed to fetch experience' });
  }
};

// GET /v1/experiences/search — Search experiences
export const searchExperiences = async (req: Request, res: Response) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    const query = String(q).toLowerCase();
    const allExperiences = await prisma.experience.findMany({
      where: { isActive: true },
      include: { merchant: { select: { id: true, businessName: true, location: true, rating: true } } },
    });

    // Filter in JavaScript (SQLite compatible)
    const filtered = allExperiences.filter(e => {
      const tags = parseArrayField(e.tags);
      return (
        e.title?.toLowerCase().includes(query) ||
        e.titleCn?.toLowerCase().includes(query) ||
        e.titleTr?.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query) ||
        tags.some(t => t.toLowerCase().includes(query))
      );
    });

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    // Log search interaction
    const userId = (req as any).user?.id;
    if (userId) {
      await prisma.userInteraction.create({
        data: { userId, type: 'search', metadata: JSON.stringify({ query: q, resultCount: filtered.length }) },
      });
    }

    res.status(200).json({
      experiences: paginated.map(e => ({ ...e, images: parseArrayField(e.images), tags: parseArrayField(e.tags) })),
      query: q,
      count: filtered.length,
    });
  } catch (error) {
    console.error('[Experience] Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

// GET /v1/experiences/trending — Get trending experiences
export const getTrending = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const experiences = await prisma.experience.findMany({
      where: { isActive: true },
      include: {
        merchant: { select: { id: true, businessName: true, location: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { rating: 'desc' },
      take: Number(limit),
    });

    const enriched = experiences.map(exp => ({
      ...exp,
      images: parseArrayField(exp.images),
      tags: parseArrayField(exp.tags),
      aiBadge: 'Trending Now',
      recentBookings: exp._count.bookings,
    }));

    res.status(200).json({ experiences: enriched });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending' });
  }
};

function generateBadge(exp: any): string {
  const tags = parseArrayField(exp.tags);
  if (exp.rating >= 4.9) return 'Global Favorite';
  if (tags.includes('romantic')) return 'Most Romantic';
  if (tags.includes('adventure')) return 'Top Adventure';
  if (tags.includes('cultural')) return 'Cultural Gem';
  return 'Top Pick';
}