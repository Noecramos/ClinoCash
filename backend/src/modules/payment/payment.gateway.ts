/**
 * ClinoCash — Payment Gateway Adapter Interface
 * 
 * All payment providers must implement this interface.
 * This allows us to swap providers without changing business logic.
 */

export interface PaymentResult {
    success: boolean;
    reference?: string;
    providerReference?: string;
    status: 'pending' | 'completed' | 'failed';
    message?: string;
    authorizationUrl?: string; // For redirect-based payments
    metadata?: Record<string, any>;
}

export interface WebhookPayload {
    event: string;
    data: Record<string, any>;
}

export interface PaymentGateway {
    name: string;
    supportedCurrencies: string[];

    /**
     * Initiate a Cash-In (deposit) from Mobile Money to wallet
     */
    initiateCashIn(params: {
        phone: string;
        amount: number;
        currency: string;
        reference: string;
        network?: string; // MTN, TELECEL, etc.
    }): Promise<PaymentResult>;

    /**
     * Initiate a Cash-Out (withdrawal) from wallet to Mobile Money
     */
    initiateCashOut(params: {
        phone: string;
        amount: number;
        currency: string;
        reference: string;
        network?: string;
    }): Promise<PaymentResult>;

    /**
     * Initiate a bank transfer
     */
    initiateBankTransfer(params: {
        accountNumber: string;
        bankCode: string;
        amount: number;
        currency: string;
        reference: string;
        accountName?: string;
    }): Promise<PaymentResult>;

    /**
     * Verify a transaction status
     */
    verifyTransaction(reference: string): Promise<PaymentResult>;

    /**
     * Process an incoming webhook notification
     */
    handleWebhook(payload: WebhookPayload): Promise<{
        reference: string;
        status: 'completed' | 'failed';
        metadata?: Record<string, any>;
    }>;
}
