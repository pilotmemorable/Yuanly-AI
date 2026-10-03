import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Routes
import authRoutes from './routes/authRoutes';
import experienceRoutes from './routes/experienceRoutes';
import aiRoutes from './routes/aiRoutes';
import bookingRoutes from './routes/bookingRoutes';
import paymentRoutes from './routes/paymentRoutes';
import merchantRoutes from './routes/merchantRoutes';
import reviewRoutes from './routes/reviewRoutes';
import slotRoutes from './routes/slotRoutes';
import adminRoutes from './routes/adminRoutes';

// Middleware
import { localizationMiddleware } from './middleware/localization';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { sanitizeInput, requestId, corsConfig, rateLimits, auditLog } from './middleware/security';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// ===== Security & Utility Middleware =====
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors(corsConfig));
app.use(requestId);
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInput);

// ===== Rate Limiting (tiered) =====
const authLimiter = rateLimit(rateLimits.auth);
const aiLimiter = rateLimit(rateLimits.ai);
const paymentLimiter = rateLimit(rateLimits.payment);
const apiLimiter = rateLimit(rateLimits.api);

app.use('/v1/', apiLimiter);
app.use('/v1/auth', authLimiter);
app.use('/v1/ai', aiLimiter);
app.use('/v1/payment', paymentLimiter);

// Audit logging for sensitive operations
app.use('/v1/payment', auditLog('payment_operation'));
app.use('/v1/admin', auditLog('admin_operation'));
app.use('/v1/bookings', auditLog('booking_operation'));

// Localization
app.use(localizationMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'Yuanly AI Backend is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// ===== API Routes =====
app.use('/v1/auth', authRoutes);
app.use('/v1/experiences', experienceRoutes);
app.use('/v1/ai', aiRoutes);
app.use('/v1/bookings', bookingRoutes);
app.use('/v1/payment', paymentRoutes);
app.use('/v1/merchants', merchantRoutes);
app.use('/v1/reviews', reviewRoutes);
app.use('/v1/slots', slotRoutes);
app.use('/v1/admin', adminRoutes);

// 404 & Error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Yuanly AI Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  if (isProduction) {
    console.log('🔒 Security: Helmet + CORS + Sanitization + Rate Limiting + Audit Log');
  }
});

export default app;