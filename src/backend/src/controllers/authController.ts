import { Request, Response } from 'express';
import prisma from '../config/db';
import { generateToken } from '../utils/auth';
import { generateTwoFactorCode } from '../services/twoFactorService';

// POST /v1/auth/wechat-login — WeChat OAuth login
export const wechatLogin = async (req: Request, res: Response) => {
  try {
    const { wechat_token, device_info } = req.body;

    if (!wechat_token) {
      return res.status(400).json({ error: 'wechat_token is required' });
    }

    let user = await prisma.user.findUnique({
      where: { wechatId: wechat_token }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          wechatId: wechat_token,
          fullName: 'New Traveler',
          membershipLevel: 'GUEST'
        }
      });
    }

    // Trigger 2FA
    const tfaCode = generateTwoFactorCode();
    console.log(`[2FA] Code for user ${user.id}: ${tfaCode}`);

    // In production, send via WeChat template message or SMS
    res.status(200).json({
      message: '2FA code sent',
      userId: user.id,
      requires2FA: true
    });
  } catch (error) {
    console.error('[Auth] WeChat login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /v1/auth/register — Email/phone registration
export const register = async (req: Request, res: Response) => {
  try {
    const { email, phone, fullName, preferredLanguage = 'CN' } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone is required' });
    }

    // Check for existing user
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        fullName: fullName || 'New Traveler',
        preferredLanguage: preferredLanguage as any,
        membershipLevel: 'GUEST'
      }
    });

    // Trigger 2FA
    const tfaCode = generateTwoFactorCode();
    console.log(`[2FA] Code for user ${user.id}: ${tfaCode}`);

    res.status(200).json({
      message: '2FA code sent to your device',
      userId: user.id,
      requires2FA: true
    });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// POST /v1/auth/verify-2fa — Verify 2FA and issue JWT
export const verify2FA = async (req: Request, res: Response) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ error: 'userId and code are required' });
    }

    // In production, verify against stored code in Redis
    // For development, accept "123456"
    if (code === '123456') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          phone: true,
          wechatId: true,
          fullName: true,
          avatar: true,
          membershipLevel: true,
          preferredLanguage: true,
          trustScore: true,
          role: true
        }
      });

      if (!user) return res.status(404).json({ error: 'User not found' });

      const token = generateToken(user.id);
      res.status(200).json({ token, user });
    } else {
      res.status(401).json({ error: 'Invalid 2FA code' });
    }
  } catch (error) {
    console.error('[Auth] 2FA verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// GET /v1/auth/me — Get current user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        wechatId: true,
        fullName: true,
        avatar: true,
        membershipLevel: true,
        preferredLanguage: true,
        trustScore: true,
        travelStyle: true,
        role: true,
        createdAt: true,
        _count: {
          select: { bookings: true, reviews: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// PUT /v1/auth/me — Update user profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { fullName, avatar, preferredLanguage, travelStyle, phone, email } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName && { fullName }),
        ...(avatar && { avatar }),
        ...(preferredLanguage && { preferredLanguage: preferredLanguage as any }),
        ...(travelStyle && { travelStyle }),
        ...(phone && { phone }),
        ...(email && { email })
      },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        avatar: true,
        membershipLevel: true,
        preferredLanguage: true,
        travelStyle: true
      }
    });

    res.status(200).json({ user: updated });
  } catch (error) {
    console.error('[Auth] Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// GET /v1/auth/me/notifications — Get user notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { unreadOnly, page = 1, limit = 20 } = req.query;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly === 'true' && { isRead: false })
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// PUT /v1/auth/me/notifications/:id/read — Mark notification as read
export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true }
    });

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
};