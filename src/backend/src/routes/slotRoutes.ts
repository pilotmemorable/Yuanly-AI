import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/http';
import { getAvailableSlots, createSlots, bulkGenerateSlots, deleteSlot } from '../controllers/slotController';

const router = Router();

router.get('/available', asyncHandler(getAvailableSlots));

// Owning company representative only (ownership verified in the controller)
router.post('/', authenticate, asyncHandler(createSlots));
router.post('/bulk', authenticate, asyncHandler(bulkGenerateSlots));
router.delete('/:id', authenticate, asyncHandler(deleteSlot));

export default router;
