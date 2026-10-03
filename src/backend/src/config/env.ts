import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

function secret(name: string, devFallback: string, minLength: number): string {
  const value = process.env[name];
  if (value && value.length >= minLength) return value;
  if (isProd) {
    throw new Error(`${name} must be set (min ${minLength} chars) in production`);
  }
  return devFallback;
}

export const env = {
  isProd,
  port: Number(process.env.PORT || 5000),
  jwtSecret: secret('JWT_SECRET', 'dev-only-jwt-secret-change-me-0123456789', 32),
  adminEmail: (process.env.ADMIN_EMAIL || 'pilotmemorable@gmail.com').trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminForcePasswordReset: process.env.ADMIN_FORCE_PASSWORD_RESET === 'true',
  corsOrigins: (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean),
  seedDemo: process.env.SEED_DEMO === 'true',
  supportEmail: process.env.SUPPORT_EMAIL || 'pilotmemorable@gmail.com',
  adminWebDir: process.env.ADMIN_WEB_DIR || '',
  legalDir: process.env.LEGAL_DIR || '',
};
