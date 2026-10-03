import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/http';
import * as admin from '../controllers/adminController';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/stats', asyncHandler(admin.getPlatformStats));

router.get('/users', asyncHandler(admin.listUsers));
router.post('/users', asyncHandler(admin.createUser));
router.put('/users/:id/role', asyncHandler(admin.updateUserRole));
router.post('/users/:id/reset-password', asyncHandler(admin.resetUserPassword));
router.delete('/users/:id', asyncHandler(admin.deleteUser));

router.get('/merchants', asyncHandler(admin.listMerchants));
router.post('/merchants', asyncHandler(admin.createMerchant));
router.put('/merchants/:id', asyncHandler(admin.updateMerchant));

router.get('/experiences', asyncHandler(admin.listExperiences));
router.post('/experiences', asyncHandler(admin.createExperience));
router.put('/experiences/:id', asyncHandler(admin.updateExperience));
router.post('/experiences/:id/slots/bulk', asyncHandler(admin.bulkSlotsForExperience));

router.get('/bookings', asyncHandler(admin.listAllBookings));
router.put('/bookings/:id/status', asyncHandler(admin.updateBookingStatus));

router.get('/audit-logs', asyncHandler(admin.listAuditLogs));

export default router;
