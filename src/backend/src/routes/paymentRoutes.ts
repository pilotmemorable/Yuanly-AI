import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { initiatePayment, handleWebhook, getPaymentStatus, processRefund } from '../controllers/paymentController';

const router = Router();

// Webhook doesn't require auth (gateway callback)
router.post('/webhook', handleWebhook);

// All other routes require auth
router.post('/initiate', authenticate, initiatePayment);
router.get('/:id/status', authenticate, getPaymentStatus);
router.post('/:id/refund', authenticate, processRefund);

export default router;