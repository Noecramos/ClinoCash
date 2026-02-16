import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { createWallet, getUserWallets, getExchangeRates, getTotalBalance } from './wallet.service';
import { Currency } from '@prisma/client';

const router = Router();

// ─── CREATE WALLET ────────────────────────────────────

router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { currency } = z.object({ currency: z.nativeEnum(Currency) }).parse(req.body);
        const result = await createWallet(req.userId!, currency);
        res.status(result.success ? 201 : 400).json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(422).json({ success: false, error: 'Invalid currency' });
            return;
        }
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ─── GET ALL WALLETS ──────────────────────────────────

router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const wallets = await getUserWallets(req.userId!);
        res.json({
            success: true,
            wallets: wallets.map(w => ({
                id: w.id,
                currency: w.currency,
                balance: w.balance.toNumber(),
                status: w.status,
                createdAt: w.createdAt,
            })),
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ─── GET TOTAL BALANCE ────────────────────────────────

router.get('/total', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const baseCurrency = (req.query.base as Currency) || 'GHS';
        const result = await getTotalBalance(req.userId!, baseCurrency);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ─── GET EXCHANGE RATES ───────────────────────────────

router.get('/exchange-rates', async (_req, res: Response): Promise<void> => {
    try {
        const rates = await getExchangeRates();
        res.json({ success: true, rates });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
