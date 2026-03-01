import prisma from '../../config/database';
import { config } from '../../config';
import { hashPin, verifyPin, generateOtp } from '../../utils/helpers';
import { generateToken } from '../../middleware/auth';
import { createWallet } from '../wallet/wallet.service';

/**
 * Send OTP to a phone number
 */
export async function sendOtp(phone: string, purpose: string = 'LOGIN') {
    const code = generateOtp(6);
    const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

    // In production, send via SMS provider (Twilio, Termii, etc.)
    // For now, we store it and log it
    await prisma.otpCode.create({
        data: {
            phone,
            code, // In production, hash this
            purpose,
            expiresAt,
        },
    });

    console.log(`[OTP] Code for ${phone}: ${code}`); // Dev only

    return { success: true, message: 'OTP sent successfully', expiresIn: config.otp.expiryMinutes * 60 };
}

/**
 * Verify an OTP code
 */
export async function verifyOtp(phone: string, code: string, purpose: string = 'LOGIN') {
    const otpRecord = await prisma.otpCode.findFirst({
        where: {
            phone,
            purpose,
            verified: false,
            expiresAt: { gte: new Date() },
        },
        orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
        return { success: false, error: 'OTP not found or expired' };
    }

    if (otpRecord.attempts >= config.otp.maxAttempts) {
        return { success: false, error: 'Maximum OTP attempts exceeded' };
    }

    if (otpRecord.code !== code) {
        await prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: { attempts: { increment: 1 } },
        });
        return { success: false, error: 'Invalid OTP code' };
    }

    // Mark as verified
    await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { verified: true },
    });

    return { success: true };
}

/**
 * Register a new user
 */
export async function registerUser(data: {
    phone: string;
    username: string;
    displayName: string;
    pin: string;
    locale?: string;
}) {
    // Check if user exists
    const existing = await prisma.user.findFirst({
        where: {
            OR: [{ phone: data.phone }, { username: data.username }],
        },
    });

    if (existing) {
        return {
            success: false,
            error: existing.phone === data.phone
                ? 'Phone number already registered'
                : 'Username already taken',
        };
    }

    // Hash PIN
    const pinHash = hashPin(data.pin);

    // Create user
    const user = await prisma.user.create({
        data: {
            phone: data.phone,
            username: data.username.toLowerCase(),
            displayName: data.displayName,
            pinHash,
            locale: data.locale || 'en',
        },
    });

    // Auto-create GHS wallet (default)
    await createWallet(user.id, 'GHS');

    // Generate token
    const token = generateToken(user.id, user.kycTier);

    return {
        success: true,
        user: {
            id: user.id,
            phone: user.phone,
            username: user.username,
            displayName: user.displayName,
            kycTier: user.kycTier,
            locale: user.locale,
        },
        token,
    };
}

/**
 * Login with PIN
 */
export async function loginWithPin(phone: string, pin: string) {
    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
        return { success: false, error: 'User not found' };
    }

    if (!user.isActive) {
        return { success: false, error: 'Account is deactivated' };
    }

    if (!verifyPin(pin, user.pinHash)) {
        return { success: false, error: 'Invalid PIN' };
    }

    // Update last login
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });

    const token = generateToken(user.id, user.kycTier);

    return {
        success: true,
        user: {
            id: user.id,
            phone: user.phone,
            username: user.username,
            displayName: user.displayName,
            kycTier: user.kycTier,
            locale: user.locale,
        },
        token,
    };
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            phone: true,
            email: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            kycTier: true,
            locale: true,
            createdAt: true,
            lastLoginAt: true,
        },
    });

    return user;
}

/**
 * Look up a user by username or phone number
 * Used by the Send Money flow to resolve recipients
 */
export async function lookupUser(query: string) {
    // Clean the query
    const cleaned = query.trim().replace(/^@/, '').toLowerCase();

    if (!cleaned || cleaned.length < 2) {
        return { success: false, error: 'Search query too short' };
    }

    // Try exact match by username first
    const byUsername = await prisma.user.findUnique({
        where: { username: cleaned },
        select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            phone: true,
        },
    });

    if (byUsername) {
        return { success: true, user: byUsername };
    }

    // Try exact match by phone
    const byPhone = await prisma.user.findUnique({
        where: { phone: cleaned },
        select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            phone: true,
        },
    });

    if (byPhone) {
        return { success: true, user: byPhone };
    }

    // Fuzzy search by username (starts with)
    const fuzzy = await prisma.user.findMany({
        where: {
            OR: [
                { username: { startsWith: cleaned } },
                { phone: { contains: cleaned } },
                { displayName: { contains: cleaned, mode: 'insensitive' } },
            ],
        },
        select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
        },
        take: 10,
    });

    if (fuzzy.length > 0) {
        return { success: true, users: fuzzy };
    }

    return { success: false, error: 'No user found' };
}
