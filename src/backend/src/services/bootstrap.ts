import prisma from '../config/db';
import { env } from '../config/env';
import { hashPassword } from '../utils/password';

// Guarantees exactly one ADMIN account: ADMIN_EMAIL (pilotmemorable@gmail.com by default).
export async function bootstrapAdmin() {
  await prisma.user.updateMany({
    where: { role: 'ADMIN', email: { not: env.adminEmail } },
    data: { role: 'USER' },
  });

  const existing = await prisma.user.findUnique({ where: { email: env.adminEmail } });
  if (!existing) {
    if (!env.adminPassword) {
      console.warn(`[bootstrap] ADMIN_PASSWORD is not set — admin account ${env.adminEmail} was NOT created`);
      return;
    }
    await prisma.user.create({
      data: {
        email: env.adminEmail,
        passwordHash: await hashPassword(env.adminPassword),
        fullName: 'Yuanly Admin',
        role: 'ADMIN',
        membershipLevel: 'VIP',
        preferredLanguage: 'TR',
      },
    });
    console.log(`[bootstrap] Admin account created: ${env.adminEmail}`);
    return;
  }

  const data: Record<string, any> = {};
  if (existing.role !== 'ADMIN') data.role = 'ADMIN';
  if (!existing.isActive) data.isActive = true;
  if (env.adminPassword && (!existing.passwordHash || env.adminForcePasswordReset)) {
    data.passwordHash = await hashPassword(env.adminPassword);
  }
  if (Object.keys(data).length) {
    await prisma.user.update({ where: { id: existing.id }, data });
    console.log(`[bootstrap] Admin account updated (${Object.keys(data).join(', ')})`);
  }
}

// Optional review / tester accounts, configured only through environment variables.
export async function bootstrapDemoAccounts() {
  const userEmail = process.env.DEMO_USER_EMAIL?.trim().toLowerCase();
  const userPassword = process.env.DEMO_USER_PASSWORD;
  if (userEmail && userPassword && userEmail !== env.adminEmail) {
    await prisma.user.upsert({
      where: { email: userEmail },
      create: { email: userEmail, passwordHash: await hashPassword(userPassword), fullName: 'Demo Traveler', role: 'USER', preferredLanguage: 'EN' },
      update: { passwordHash: await hashPassword(userPassword), isActive: true, role: 'USER' },
    });
  }

  const merchantEmail = process.env.DEMO_MERCHANT_EMAIL?.trim().toLowerCase();
  const merchantPassword = process.env.DEMO_MERCHANT_PASSWORD;
  if (merchantEmail && merchantPassword && merchantEmail !== env.adminEmail) {
    const rep = await prisma.user.upsert({
      where: { email: merchantEmail },
      create: { email: merchantEmail, passwordHash: await hashPassword(merchantPassword), fullName: 'Demo Company Representative', role: 'MERCHANT', preferredLanguage: 'EN' },
      update: { passwordHash: await hashPassword(merchantPassword), isActive: true, role: 'MERCHANT' },
    });
    const company = await prisma.merchant.findUnique({ where: { id: 'demo-merchant-azure' } });
    if (company && (!company.userId || company.userId === rep.id)) {
      await prisma.merchant.update({ where: { id: company.id }, data: { userId: rep.id } });
    }
  }
}
