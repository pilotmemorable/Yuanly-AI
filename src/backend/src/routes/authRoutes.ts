import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/http';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getNotifications,
  markNotificationRead,
} from '../controllers/authController';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));

router.get('/me', authenticate, asyncHandler(getProfile));
router.put('/me', authenticate, asyncHandler(updateProfile));
router.delete('/me', authenticate, asyncHandler(deleteAccount));
router.post('/change-password', authenticate, asyncHandler(changePassword));
router.get('/me/notifications', authenticate, asyncHandler(getNotifications));
router.put('/me/notifications/:id/read', authenticate, asyncHandler(markNotificationRead));

export default router;
