import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

import { env } from './config/env';
import prisma from './config/db';

import authRoutes from './routes/authRoutes';
import experienceRoutes from './routes/experienceRoutes';
import aiRoutes from './routes/aiRoutes';
import bookingRoutes from './routes/bookingRoutes';
import merchantRoutes from './routes/merchantRoutes';
import merchantSelfRoutes from './routes/merchantSelfRoutes';
import reviewRoutes from './routes/reviewRoutes';
import slotRoutes from './routes/slotRoutes';
import adminRoutes from './routes/adminRoutes';

import { localizationMiddleware } from './middleware/localization';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { sanitizeInput, requestId, corsConfig, rateLimits, auditLog } from './middleware/security';
import { bootstrapAdmin, bootstrapDemoAccounts } from './services/bootstrap';
import { ensureDemoCatalog } from './services/demoSeed';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: env.isProd ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors(corsConfig));
app.use(compression());
app.use(requestId);
app.use(morgan(env.isProd ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(sanitizeInput);

app.use('/v1/', rateLimit(rateLimits.api));
app.use('/v1/auth/login', rateLimit(rateLimits.auth));
app.use('/v1/auth/register', rateLimit(rateLimits.auth));
app.use('/v1/ai', rateLimit(rateLimits.ai));
app.use('/v1/admin', auditLog('admin_operation'));

app.use(localizationMiddleware);

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'UP', version: '1.1.0', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'DOWN' });
  }
});

app.use('/v1/auth', authRoutes);
app.use('/v1/experiences', experienceRoutes);
app.use('/v1/ai', aiRoutes);
app.use('/v1/bookings', bookingRoutes);
app.use('/v1/merchant', merchantSelfRoutes);
app.use('/v1/merchants', merchantRoutes);
app.use('/v1/reviews', reviewRoutes);
app.use('/v1/slots', slotRoutes);
app.use('/v1/admin', adminRoutes);
app.use('/v1', notFoundHandler);

// ── Public pages (privacy / terms / support) ──
const firstExisting = (...c: string[]) => c.find((p) => p && fs.existsSync(p)) || c[0];
const legalDir = firstExisting(env.legalDir, path.resolve(__dirname, '../legal'), path.resolve(__dirname, '../../legal'));
const pageShell = (title: string, body: string) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · Yuanly 缘旅</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Segoe UI',sans-serif;max-width:760px;margin:0 auto;padding:32px 20px;color:#1a1a1a;line-height:1.65}
h1{color:#0e7c86}h2{margin-top:28px;color:#0e7c86}a{color:#0e7c86}hr{margin:40px 0;border:0;border-top:1px solid #e0e0e0}</style></head><body>${body}</body></html>`;
for (const [route, file, title] of [
  ['/privacy', 'privacy.md', 'Privacy Policy'],
  ['/terms', 'terms.md', 'Terms of Service'],
  ['/support', 'support.md', 'Support'],
] as const) {
  app.get(route, (_req, res) => {
    const fp = path.join(legalDir, file);
    if (!fs.existsSync(fp)) return res.status(404).send('Not found');
    res.type('html').send(pageShell(title, marked.parse(fs.readFileSync(fp, 'utf8')) as string));
  });
}
app.get('/', (_req, res) => {
  res.type('html').send(
    pageShell('Yuanly', '<h1>Yuanly 缘旅</h1><p>Turkey experiences for travelers.</p><p><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/support">Support</a></p>')
  );
});

// ── Admin web panel (static SPA) ──
const adminDir = firstExisting(env.adminWebDir, path.resolve(__dirname, '../../admin-web/dist'), path.resolve(__dirname, '../../../admin-web/dist'));
if (fs.existsSync(path.join(adminDir, 'index.html'))) {
  app.use('/admin', express.static(adminDir, { index: false, maxAge: '1h' }));
  app.get(/^\/admin(\/.*)?$/, (_req, res) => res.sendFile(path.join(adminDir, 'index.html')));
} else {
  console.warn(`[admin] panel build not found at ${adminDir}`);
}

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  await bootstrapAdmin();
  if (env.seedDemo) await ensureDemoCatalog();
  await bootstrapDemoAccounts();

  const server = app.listen(env.port, () => {
    console.log(`🚀 Yuanly backend listening on :${env.port} (${env.isProd ? 'production' : 'development'})`);
  });

  if (env.seedDemo) {
    setInterval(() => ensureDemoCatalog().catch((e) => console.error('[demo] top-up failed', e)), 6 * 3600 * 1000).unref();
  }

  const shutdown = () => {
    server.close(() => prisma.$disconnect().finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Fatal startup error', err);
    process.exit(1);
  });
}

export default app;
