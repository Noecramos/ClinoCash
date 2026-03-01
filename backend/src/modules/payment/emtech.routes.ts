/**
 * ClinoCash — Emtech / BoG Sandbox API Routes
 *
 * Exposes endpoints for:
 *   - Emtech sandbox health check
 *   - Manual remittance reporting (admin)
 *   - Transfer event submission (admin)
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { emtechAdapter, TransferEventType } from './adapters/emtech.adapter';

const router = Router();

// ─── Health Check (public) ─────────────────────────────

router.get('/emtech/health', async (_req: Request, res: Response) => {
    try {
        const status = await emtechAdapter.healthCheck();
        res.json({ success: true, emtech: status });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── Check if Emtech is configured ────────────────────

router.get('/emtech/status', (_req: Request, res: Response) => {
    res.json({
        success: true,
        configured: emtechAdapter.isConfigured(),
        message: emtechAdapter.isConfigured()
            ? 'Emtech BoG sandbox credentials are configured'
            : 'Emtech credentials not set — add EMTECH_CLIENT_ID and EMTECH_CLIENT_SECRET to .env',
    });
});

// ─── Submit Transfer Event (authenticated) ─────────────

router.post('/emtech/events', authenticate, async (req: Request, res: Response) => {
    try {
        const { transferId, eventId, eventType, reason } = req.body;

        if (!transferId || !eventId || !eventType) {
            res.status(400).json({
                success: false,
                error: 'transferId, eventId, and eventType are required',
            });
            return;
        }

        // Validate event type
        const validEvents = Object.values(TransferEventType);
        if (!validEvents.includes(eventType)) {
            res.status(400).json({
                success: false,
                error: `Invalid eventType. Must be one of: ${validEvents.join(', ')}`,
            });
            return;
        }

        const result = await emtechAdapter.submitTransferEvent({
            eventId,
            transferId,
            transferEvent: eventType,
            transferEventReason: reason || eventType,
            transferEventDatetime: new Date().toISOString(),
            meta: { submittedBy: (req as any).userId, source: 'clinocash-api' },
        });

        res.json({ success: true, result });
    } catch (error: any) {
        console.error('[Emtech Route] Event submission failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
