import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthRequest extends Request {
    userId?: string;
    userKycTier?: string;
}

/**
 * JWT authentication middleware
 * Extracts and verifies the Bearer token from Authorization header
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED',
        });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.jwt.secret) as {
            userId: string;
            kycTier: string;
        };

        req.userId = decoded.userId;
        req.userKycTier = decoded.kycTier;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN',
        });
    }
}

/**
 * KYC tier authorization middleware
 * Requires minimum KYC tier level
 */
export function requireKycTier(minTier: 'TIER_0' | 'TIER_1' | 'TIER_2') {
    const tierOrder = { TIER_0: 0, TIER_1: 1, TIER_2: 2 };

    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        const userTier = req.userKycTier as keyof typeof tierOrder;

        if (!userTier || tierOrder[userTier] < tierOrder[minTier]) {
            res.status(403).json({
                success: false,
                error: `KYC ${minTier} required for this operation`,
                code: 'KYC_INSUFFICIENT',
                requiredTier: minTier,
                currentTier: userTier,
            });
            return;
        }

        next();
    };
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(userId: string, kycTier: string): string {
    return jwt.sign({ userId, kycTier }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
}
