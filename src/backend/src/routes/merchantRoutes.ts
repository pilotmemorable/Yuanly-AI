import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/http';
import {
  listMerchants,
  getMerchant,
  updateMerchant,
  createExperience,
  updateExperience,
  deleteExperience,
  getDashboard,
} from '../controllers/merchantController';

const router = Router();

// Public catalogue of verified companies
router.get('/', asyncHandler(listMerchants));
router.get('/:id', asyncHandler(getMerchant));

// Owning company representative only (ownership verified in the controller)
router.put('/:id', authenticate, asyncHandler(updateMerchant));
router.get('/:id/dashboard', authenticate, asyncHandler(getDashboard));
router.post('/:id/experiences', authenticate, asyncHandler(createExperience));
router.put('/:merchantId/experiences/:expId', authenticate, asyncHandler(updateExperience));
router.delete('/:merchantId/experiences/:expId', authenticate, asyncHandler(deleteExperience));

export default router;
