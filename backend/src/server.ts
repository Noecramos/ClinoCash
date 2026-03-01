import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import walletRoutes from './modules/wallet/wallet.routes';
import transactionRoutes from './modules/transaction/transaction.routes';
import paymentRoutes from './modules/payment/payment.routes';
import emtechRoutes from './modules/payment/emtech.routes';

const app = express();

// ─── SECURITY MIDDLEWARE ──────────────────────────────

app.use(helmet());
app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // Stricter limit for auth endpoints
    message: { success: false, error: 'Too many authentication attempts' },
});

app.use(limiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── ROUTES ───────────────────────────────────────────

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/regulatory', emtechRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'healthy',
        service: 'ClinoCash API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// ─── ERROR HANDLING ───────────────────────────────────

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: config.nodeEnv === 'development' ? err.message : 'Internal server error',
    });
});

// ─── START SERVER ─────────────────────────────────────

app.listen(config.port, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║          🏦 ClinoCash API                ║
  ║          Running on port ${config.port}            ║
  ║          Environment: ${config.nodeEnv}     ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
