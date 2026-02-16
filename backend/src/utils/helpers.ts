import crypto from 'crypto';
import { config } from '../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY = Buffer.from(config.encryption.key.padEnd(32, '0').slice(0, 32));

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Format: iv:tag:encrypted
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt data encrypted with AES-256-GCM
 */
export function decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted data format');

    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Hash a PIN using bcrypt-compatible method
 */
export function hashPin(pin: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(pin, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

/**
 * Verify a PIN against its hash
 */
export function verifyPin(pin: string, stored: string): boolean {
    const [salt, hash] = stored.split(':');
    const verify = crypto.pbkdf2Sync(pin, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verify));
}

/**
 * Generate a random OTP code
 */
export function generateOtp(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        otp += digits[bytes[i] % 10];
    }
    return otp;
}

/**
 * Generate a unique reference ID
 */
export function generateReference(prefix: string = 'TXN'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

/**
 * Format currency amount based on locale
 */
export function formatCurrency(amount: number, currency: string, locale: string = 'en'): string {
    const formatters: Record<string, Intl.NumberFormat> = {
        'GHS-en': new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }),
        'GHS-fr': new Intl.NumberFormat('fr-GH', { style: 'currency', currency: 'GHS' }),
        'XOF-en': new Intl.NumberFormat('en-TG', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }),
        'XOF-fr': new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }),
        'USD-en': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
        'USD-fr': new Intl.NumberFormat('fr-US', { style: 'currency', currency: 'USD' }),
    };

    const key = `${currency}-${locale}`;
    const formatter = formatters[key] || formatters[`${currency}-en`];

    if (!formatter) return `${amount} ${currency}`;
    return formatter.format(amount);
}
