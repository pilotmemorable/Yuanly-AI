import { Request, Response } from 'express';
import prisma from '../config/db';

// GET /v1/slots/available — Get available slots for an experience
export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { experienceId, date } = req.query;

    if (!experienceId) {
      return res.status(400).json({ error: 'experienceId is required' });
    }

    const startDate = date ? String(date) : new Date().toISOString();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const slots = await prisma.slot.findMany({
      where: {
        experienceId: String(experienceId),
        status: 'AVAILABLE',
        startTime: {
          gte: new Date(startDate),
          lte: date ? new Date(new Date(String(date)).getTime() + 24 * 60 * 60 * 1000) : nextWeek
        }
      },
      orderBy: { startTime: 'asc' }
    });

    res.status(200).json({ slots, count: slots.length });
  } catch (error) {
    console.error('[Slot] Get available error:', error);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
};

// POST /v1/slots — Create slots (merchant only)
export const createSlots = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { experienceId, slots } = req.body;

    if (!experienceId || !slots || !Array.isArray(slots)) {
      return res.status(400).json({ error: 'experienceId and slots array are required' });
    }

    // Verify ownership
    const experience = await prisma.experience.findFirst({
      where: { id: experienceId, merchant: { userId } }
    });

    if (!experience) {
      return res.status(403).json({ error: 'Not authorized or experience not found' });
    }

    const created = await prisma.slot.createMany({
      data: slots.map((s: any) => ({
        experienceId,
        merchantId: experience.merchantId,
        startTime: new Date(s.startTime),
        endTime: new Date(s.endTime),
        capacity: s.capacity || experience.capacity,
        bookedCount: 0,
        status: 'AVAILABLE',
        priceCny: s.priceCny || experience.priceCny
      }))
    });

    res.status(201).json({ created: created.count, message: 'Slots created successfully' });
  } catch (error) {
    console.error('[Slot] Create error:', error);
    res.status(500).json({ error: 'Failed to create slots' });
  }
};

// POST /v1/slots/bulk — Bulk generate slots (e.g., daily slots for a week)
export const bulkGenerateSlots = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { experienceId, startDate, endDate, timesPerDay, capacity, priceCny } = req.body;

    const experience = await prisma.experience.findFirst({
      where: { id: experienceId, merchant: { userId } }
    });

    if (!experience) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const slotsToCreate: any[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      for (let i = 0; i < (timesPerDay || 3); i++) {
        const slotStart = new Date(d);
        slotStart.setHours(8 + i * 3, 0, 0, 0); // 8:00, 11:00, 14:00, etc.
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(slotStart.getHours() + 2);

        slotsToCreate.push({
          experienceId,
          merchantId: experience.merchantId,
          startTime: new Date(slotStart),
          endTime: new Date(slotEnd),
          capacity: capacity || experience.capacity,
          bookedCount: 0,
          status: 'AVAILABLE' as const,
          priceCny: priceCny || experience.priceCny
        });
      }
    }

    const result = await prisma.slot.createMany({ data: slotsToCreate });

    res.status(201).json({
      created: result.count,
      message: `${result.count} slots generated from ${start.toDateString()} to ${end.toDateString()}`
    });
  } catch (error) {
    console.error('[Slot] Bulk generate error:', error);
    res.status(500).json({ error: 'Failed to generate slots' });
  }
};

// DELETE /v1/slots/:id — Delete a slot
export const deleteSlot = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const slot = await prisma.slot.findFirst({
      where: { id, merchant: { userId } }
    });

    if (!slot) {
      return res.status(404).json({ error: 'Slot not found or not authorized' });
    }

    if (slot.status === 'BOOKED') {
      return res.status(409).json({ error: 'Cannot delete a booked slot' });
    }

    await prisma.slot.delete({ where: { id } });

    res.status(200).json({ message: 'Slot deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete slot' });
  }
};