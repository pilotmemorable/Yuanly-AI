import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  wechatLogin,
  register,
  verify2FA,
  getProfile,
  updateProfile,
  getNotifications,
  markNotificationRead
} from '../controllers/authController';

const router = Router();

// Public routes
router.post('/wechat-login', wechatLogin);
router.post('/register', register);
router.post('/verify-2fa', verify2FA);

// Protected routes
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);
router.get('/me/notifications', authenticate, getNotifications);
router.put('/me/notifications/:id/read', authenticate, markNotificationRead);

export default router;