import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import { HttpError, parse } from '../utils/http';
import { istanbulToDate, parseDurationMinutes } from '../utils/time';

const DAY_MS = 24 * 3600 * 1000;

export function shapeSlot(s: any) {
  return {
    id: s.id,
    experienceId: s.experienceId,
    startTime: s.startTime,
    endTime: s.endTime,
    capacity: s.capacity,
    bookedCount: s.bookedCount,
    remaining: Math.max(0, s.capacity - s.bookedCount),
    priceCny: s.priceCny,
  };
}

// GET /v1/slots/available?experienceId=&date=YYYY-MM-DD
export const getAvailableSlots = async (req: Request, res: Response) => {
  const { experienceId, date } = req.query as Record<string, string | undefined>;
  if (!experienceId) throw new HttpError(400, 'ERR_VALIDATION', 'experienceId is required');

  const now = new Date();
  let from = now;
  let to = new Date(now.getTime() + 14 * DAY_MS);
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const dayStart = new Date(`${date}T00:00:00+03:00`);
    from = dayStart > now ? dayStart : now;
    to = new Date(dayStart.getTime() + DAY_MS);
  }

  const slots = await prisma.slot.findMany({
    where: {
      experienceId,
      status: 'AVAILABLE',
      startTime: { gt: from, lt: to },
      experience: { isActive: true, merchant: { isActive: true, isVerified: true } },
    },
    orderBy: { startTime: 'asc' },
  });
  const shaped = slots.map(shapeSlot).filter((s) => s.remaining > 0);
  res.status(200).json({ slots: shaped, count: shaped.length });
};

async function ownedExperience(req: AuthRequest, experienceId: string) {
  const user = req.user!;
  if (user.role !== 'MERCHANT') throw new HttpError(403, 'ERR_FORBIDDEN', 'Not authorized');
  const experience = await prisma.experience.findFirst({
    where: { id: experienceId, merchant: { userId: user.id, isActive: true } },
  });
  if (!experience) throw new HttpError(403, 'ERR_FORBIDDEN', 'Not authorized or experience not found');
  return experience;
}

const createSchema = z.object({
  experienceId: z.string().min(1),
  slots: z
    .array(
      z.object({
        startTime: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'invalid date'),
        endTime: z.string().optional(),
        capacity: z.coerce.number().int().min(1).max(500).optional(),
        priceCny: z.coerce.number().positive().optional(),
      })
    )
    .min(1)
    .max(500),
});

// POST /v1/slots
export const createSlots = async (req: AuthRequest, res: Response) => {
  const body = parse(createSchema, req.body);
  const experience = await ownedExperience(req, body.experienceId);
  const created = await prisma.slot.createMany({
    skipDuplicates: true,
    data: body.slots.map((s) => {
      const start = new Date(s.startTime);
      return {
        experienceId: experience.id,
        merchantId: experience.merchantId,
        startTime: start,
        endTime: s.endTime ? new Date(s.endTime) : new Date(start.getTime() + parseDurationMinutes(experience.duration) * 60000),
        capacity: s.capacity || experience.capacity,
        priceCny: s.priceCny || experience.priceCny,
      };
    }),
  });
  res.status(201).json({ created: created.count, message: 'Slots created successfully' });
};

export const bulkSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  times: z.array(z.string().regex(/^\d{2}:\d{2}$/)).min(1).max(12),
  capacity: z.coerce.number().int().min(1).max(500).optional(),
  priceCny: z.coerce.number().positive().optional(),
});

export async function generateSlots(experience: any, input: z.infer<typeof bulkSchema>) {
  const start = new Date(`${input.startDate}T00:00:00+03:00`);
  const end = new Date(`${input.endDate}T00:00:00+03:00`);
  const days = Math.round((end.getTime() - start.getTime()) / DAY_MS);
  if (days < 0 || days > 120) throw new HttpError(400, 'ERR_VALIDATION', 'Date range must be between 0 and 120 days');

  const durationMs = parseDurationMinutes(experience.duration) * 60000;
  const data: any[] = [];
  for (let d = 0; d <= days; d++) {
    const day = new Date(start.getTime() + d * DAY_MS);
    const dateStr = new Date(day.getTime() + 3 * 3600 * 1000).toISOString().slice(0, 10);
    for (const time of input.times) {
      const startTime = istanbulToDate(dateStr, time);
      data.push({
        experienceId: experience.id,
        merchantId: experience.merchantId,
        startTime,
        endTime: new Date(startTime.getTime() + durationMs),
        capacity: input.capacity || experience.capacity,
        priceCny: input.priceCny || experience.priceCny,
      });
    }
  }
  const result = await prisma.slot.createMany({ data, skipDuplicates: true });
  return result.count;
}

// POST /v1/slots/bulk
export const bulkGenerateSlots = async (req: AuthRequest, res: Response) => {
  const body = parse(bulkSchema.extend({ experienceId: z.string().min(1) }), req.body);
  const experience = await ownedExperience(req, body.experienceId);
  const created = await generateSlots(experience, body);
  res.status(201).json({ created, message: `${created} slots generated` });
};

// DELETE /v1/slots/:id
export const deleteSlot = async (req: AuthRequest, res: Response) => {
  const slot = await prisma.slot.findFirst({ where: { id: req.params.id, merchant: { userId: req.user!.id } } });
  if (!slot || req.user!.role !== 'MERCHANT') throw new HttpError(404, 'ERR_NOT_FOUND', 'Slot not found or not authorized');
  const active = await prisma.booking.count({ where: { slotId: slot.id, status: { in: ['PENDING', 'CONFIRMED'] } } });
  if (active > 0) throw new HttpError(409, 'ERR_SLOT_IN_USE', 'Cannot delete a slot with active reservations');
  await prisma.slot.update({ where: { id: slot.id }, data: { status: 'CLOSED' } });
  res.status(200).json({ message: 'Slot closed' });
};
