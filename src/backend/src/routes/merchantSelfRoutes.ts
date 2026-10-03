import { Router } from 'express';
import { authenticate, requireMerchant } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/http';
import {
  createManualBooking,
  getMyCompany,
  listMerchantBookings,
  updateMerchantBookingStatus,
} from '../controllers/merchantSelfController';

const router = Router();

router.use(authenticate, requireMerchant);

router.get('/me', asyncHandler(getMyCompany));
router.get('/bookings', asyncHandler(listMerchantBookings));
router.post('/bookings', asyncHandler(createManualBooking));
router.put('/bookings/:id/status', asyncHandler(updateMerchantBookingStatus));

export default router;
