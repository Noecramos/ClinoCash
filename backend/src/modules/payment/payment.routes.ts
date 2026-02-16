import { PaymentGateway } from './payment.gateway';
import { PaystackAdapter } from './adapters/paystack.adapter';
import { FlutterwaveAdapter } from './adapters/flutterwave.adapter';
import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { z } from 'zod';

// ─── GATEWAY FACTORY ──────────────────────────────────

/**
 * Payment Gateway Factory
 * Selects the appropriate payment provider based on currency and region
 */
export class PaymentGatewayFactory {
    private static gateways: Map<string, PaymentGateway> = new Map();

    static initialize() {
        this.gateways.set('paystack', new PaystackAdapter());
        this.gateways.set('flutterwave', new FlutterwaveAdapter());
    }

    /**
     * Get the best gateway for a given currency
     */
    static getGateway(currency: string): PaymentGateway {
        switch (currency) {
            case 'GHS':
                return this.gateways.get('paystack')!;
            case 'XOF':
                return this.gateways.get('flutterwave')!;
            case 'USD':
                return this.gateways.get('paystack')!; // Default
            default:
                return this.gateways.get('paystack')!;
        }
    }

    static getGatewayByName(name: string): PaymentGateway | undefined {
        return this.gateways.get(name);
    }
}

// Initialize gateways
PaymentGatewayFactory.initialize();

// ─── ROUTES ───────────────────────────────────────────

const router = Router();

// Cash In (Mobile Money → Wallet)
router.post('/cash-in', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const body = z.object({
            phone: z.string().min(10),
            amount: z.number().positive(),
            currency: z.enum(['GHS', 'XOF', 'USD']),
            network: z.string().optional(),
        }).parse(req.body);

        const gateway = PaymentGatewayFactory.getGateway(body.currency);
        const reference = `CI-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const result = await gateway.initiateCashIn({
            phone: body.phone,
            amount: body.amount,
            currency: body.currency,
            reference,
            network: body.network,
        });

        res.json({ success: true, ...result });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(422).json({ success: false, error: 'Validation failed', details: error.errors });
            return;
        }
        res.status(500).json({ success: false, error: 'Payment initiation failed' });
    }
});

// Cash Out (Wallet → Mobile Money)
router.post('/cash-out', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const body = z.object({
            phone: z.string().min(10),
            amount: z.number().positive(),
            currency: z.enum(['GHS', 'XOF', 'USD']),
            network: z.string().optional(),
        }).parse(req.body);

        const gateway = PaymentGatewayFactory.getGateway(body.currency);
        const reference = `CO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const result = await gateway.initiateCashOut({
            phone: body.phone,
            amount: body.amount,
            currency: body.currency,
            reference,
            network: body.network,
        });

        res.json({ success: true, ...result });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(422).json({ success: false, error: 'Validation failed' });
            return;
        }
        res.status(500).json({ success: false, error: 'Withdrawal failed' });
    }
});

// Verify Transaction
router.get('/verify/:reference', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const gateway = PaymentGatewayFactory.getGateway('GHS'); // Will be determined by txn
        const result = await gateway.verifyTransaction(req.params.reference);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Verification failed' });
    }
});

// Webhook handlers
router.post('/webhook/paystack', async (req, res: Response): Promise<void> => {
    try {
        const gateway = PaymentGatewayFactory.getGatewayByName('paystack')!;
        const result = await gateway.handleWebhook(req.body);
        // TODO: Update transaction status in database
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

router.post('/webhook/flutterwave', async (req, res: Response): Promise<void> => {
    try {
        const gateway = PaymentGatewayFactory.getGatewayByName('flutterwave')!;
        const result = await gateway.handleWebhook(req.body);
        // TODO: Update transaction status in database
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

export default router;
