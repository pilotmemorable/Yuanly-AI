import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  registerMerchant,
  getMerchant,
  listMerchants,
  updateMerchant,
  createExperience,
  updateExperience,
  deleteExperience,
  getDashboard
} from '../controllers/merchantController';

const router = Router();

// Public routes
router.get('/', listMerchants);
router.get('/:id', getMerchant);

// Protected routes
router.post('/register', authenticate, registerMerchant);
router.put('/:id', authenticate, updateMerchant);
router.get('/:id/dashboard', authenticate, getDashboard);

// Experience management
router.post('/:id/experiences', authenticate, createExperience);
router.put('/:merchantId/experiences/:expId', authenticate, updateExperience);
router.delete('/:merchantId/experiences/:expId', authenticate, deleteExperience);

export default router;