import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { sendOtp, verifyOtp, registerUser, loginWithPin, getUserProfile } from './auth.service';

const router = Router();

// ─── SEND OTP ─────────────────────────────────────────

router.post('/send-otp', async (req, res: Response): Promise<void> => {
    try {
        const { phone, purpose } = z.object({
            phone: z.string().min(10),
            purpose: z.string().optional().default('LOGIN'),
        }).parse(req.body);

        const result = await sendOtp(phone, purpose);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(422).json({ success: false, error: 'Invalid phone number' });
            return;
        }
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ─── VERIFY OTP ───────────────────────────────────────

router.post('/verify-otp', async (req, res: Response): Promise<void> => {
    try {
        const { phone, code, purpose } = z.object({
            phone: z.string().min(10),
            code: z.string().length(6),
            purpose: z.string().optional().default('LOGIN'),
        }).parse(req.body);

        const result = await verifyOtp(phone, code, purpose);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(422).json({ success: false, error: 'Validation failed' });
            return;
        }
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ─── REGISTER ─────────────────────────────────────────

router.post('/register', async (req, res: Response): Promise<void> => {
    try {
        const data = z.object({
            phone: z.string().min(10),
            username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
            displayName: z.string().min(2).max(50),
            pin: z.string().length(4).regex(/^\d{4}$/),
            locale: z.enum(['en', 'fr']).optional(),
        }).parse(req.body);

        const result = await registerUser(data);
        res.status(result.success ? 201 : 400).json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(422).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
            return;
        }
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ─── LOGIN ────────────────────────────────────────────

router.post('/login', async (req, res: Response): Promise<void> => {
    try {
        const { phone, pin } = z.object({
            phone: z.string().min(10),
            pin: z.string().length(4),
        }).parse(req.body);

        const result = await loginWithPin(phone, pin);
        res.status(result.success ? 200 : 401).json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(422).json({ success: false, error: 'Validation failed' });
            return;
        }
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ─── GET PROFILE ──────────────────────────────────────

router.get('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const profile = await getUserProfile(req.userId!);
        if (!profile) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        res.json({ success: true, user: profile });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
