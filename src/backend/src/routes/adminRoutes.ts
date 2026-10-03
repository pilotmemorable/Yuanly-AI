import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { requireAdmin } from '../controllers/adminController';
import {
  getPlatformStats,
  getPendingMerchants,
  verifyMerchant,
  getAllBookings,
  getFinancialOverview,
  updateUserRole,
  listUsers
} from '../controllers/adminController';

const router = Router();

// All admin routes require auth + admin role
router.use(authenticate);
router.use(requireAdmin);

router.get('/stats', getPlatformStats);
router.get('/merchants/pending', getPendingMerchants);
router.put('/merchants/:id/verify', verifyMerchant);
router.get('/bookings', getAllBookings);
router.get('/financial', getFinancialOverview);

// User role management (grant/revoke merchant authority)
router.get('/users', listUsers);
router.put('/users/:id/role', updateUserRole);

export default router;