import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/http';
import { cancelBooking, createUserBooking, getBookingDetail, getQRTicket, listBookings } from '../controllers/bookingController';

const router = Router();

router.use(authenticate);

router.post('/', asyncHandler(createUserBooking));
router.get('/', asyncHandler(listBookings));
router.get('/:id', asyncHandler(getBookingDetail));
router.post('/:id/cancel', asyncHandler(cancelBooking));
router.get('/:id/qr', asyncHandler(getQRTicket));

export default router;
