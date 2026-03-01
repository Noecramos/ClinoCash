import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { transferMoney, getTransactionHistory, getTransactionByReference } from './transaction.service';
import { Currency, TransactionType } from '@prisma/client';
import prisma from '../../config/database';

const router = Router();

// ─── P2P TRANSFER ─────────────────────────────────────

const transferSchema = z.object({
    receiverUsername: z.string().optional(),
    receiverPhone: z.string().optional(),
    receiverUserId: z.string().optional(),
    amount: z.number().positive('Amount must be positive'),
    currency: z.nativeEnum(Currency),
    description: z.string().optional(),
    idempotencyKey: z.string().optional(),
});

router.post('/p2p', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const body = transferSchema.parse(req.body);
        const senderUserId = req.userId!;

        // Resolve receiver by userId, username, or phone
        let receiverUserId = body.receiverUserId;

        if (!receiverUserId && body.receiverUsername) {
            const cleaned = body.receiverUsername.trim().replace(/^@/, '').toLowerCase();
            const user = await prisma.user.findUnique({
                where: { username: cleaned },
                select: { id: true },
            });
            if (user) receiverUserId = user.id;
        }

        if (!receiverUserId && body.receiverPhone) {
            const user = await prisma.user.findUnique({
                where: { phone: body.receiverPhone.trim() },
                select: { id: true },
            });
            if (user) receiverUserId = user.id;
        }

        if (!receiverUserId) {
            res.status(400).json({
                success: false,
                error: 'Recipient not found. Check the username or phone number.',
                code: 'RECEIVER_NOT_FOUND',
            });
            return;
        }

        const result = await transferMoney({
            senderUserId,
            receiverUserId,
            amount: body.amount,
            currency: body.currency,
            description: body.description,
            idempotencyKey: body.idempotencyKey,
            type: TransactionType.P2P_TRANSFER,
        });

        if (!result.success) {
            res.status(400).json(result);
            return;
        }

        res.status(201).json(result);
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


// ─── TRANSACTION HISTORY ──────────────────────────────

router.get('/history', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const type = req.query.type as TransactionType | undefined;
        const currency = req.query.currency as Currency | undefined;

        const result = await getTransactionHistory(req.userId!, { page, limit, type, currency });
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ─── GET TRANSACTION DETAIL ───────────────────────────

router.get('/:reference', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const transaction = await getTransactionByReference(req.params.reference);

        if (!transaction) {
            res.status(404).json({ success: false, error: 'Transaction not found' });
            return;
        }

        // Ensure user is part of the transaction
        if (transaction.senderUserId !== req.userId && transaction.receiverUserId !== req.userId) {
            res.status(403).json({ success: false, error: 'Access denied' });
            return;
        }

        res.json({ success: true, transaction });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
