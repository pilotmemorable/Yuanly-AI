import crypto from 'crypto';
import prisma from '../config/db';

export const generateTwoFactorCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const verifyTwoFactorCode = async (userId: string, code: string) => {
  // In a real app, we'd store this in Redis with an expiry
  // For this implementation, we'll mock the verification
  return code === '123456'; // Mock code for development
};
