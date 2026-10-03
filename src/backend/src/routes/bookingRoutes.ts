import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { listBookings, getBookingDetail, holdSlot, confirmBooking, cancelBooking, getQRTicket } from '../controllers/bookingController';

const router = Router();

router.use(authenticate); // All booking routes require auth

router.get('/', listBookings);
router.get('/:id', getBookingDetail);
router.post('/hold', holdSlot);
router.post('/confirm', confirmBooking);
router.post('/:id/cancel', cancelBooking);
router.get('/:id/qr', getQRTicket);

export default router;