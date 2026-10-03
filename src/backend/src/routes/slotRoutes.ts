import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { getAvailableSlots, createSlots, bulkGenerateSlots, deleteSlot } from '../controllers/slotController';

const router = Router();

// Public
router.get('/available', getAvailableSlots);

// Protected (merchant only — ownership checked in controller)
router.post('/', authenticate, createSlots);
router.post('/bulk', authenticate, bulkGenerateSlots);
router.delete('/:id', authenticate, deleteSlot);

export default router;