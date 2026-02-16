import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

    jwt: {
        secret: process.env.JWT_SECRET || 'dev-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },

    encryption: {
        key: process.env.AES_ENCRYPTION_KEY || 'dev-32-byte-encryption-key-here!',
    },

    otp: {
        expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
        maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10),
    },

    gateways: {
        paystack: {
            secretKey: process.env.PAYSTACK_SECRET_KEY || '',
            publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
        },
        flutterwave: {
            secretKey: process.env.FLUTTERWAVE_SECRET_KEY || '',
            publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
        },
        hubtel: {
            clientId: process.env.HUBTEL_CLIENT_ID || '',
            clientSecret: process.env.HUBTEL_CLIENT_SECRET || '',
        },
    },

    // KYC transaction limits per tier (daily)
    kycLimits: {
        TIER_0: { daily: 500, single: 100 },    // GHS equivalent
        TIER_1: { daily: 5000, single: 2000 },
        TIER_2: { daily: 50000, single: 20000 },
    },

    // Fee structure (percentage)
    fees: {
        P2P_TRANSFER: 0.005,       // 0.5%
        CASH_IN: 0,                 // Free
        CASH_OUT: 0.01,             // 1%
        BANK_TO_WALLET: 0.005,      // 0.5%
        WALLET_TO_BANK: 0.015,      // 1.5%
        CURRENCY_EXCHANGE: 0.02,    // 2%
    },
} as const;
