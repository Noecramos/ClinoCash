import { PaymentGateway, PaymentResult, WebhookPayload } from '../payment.gateway';
import { config } from '../../../config';

/**
 * Paystack Payment Adapter
 * Primary gateway for Ghana (GHS) Mobile Money and Bank transfers
 * 
 * Supports: MTN MoMo, Telecel Cash, bank transfers
 * API Docs: https://paystack.com/docs/api
 */
export class PaystackAdapter implements PaymentGateway {
    name = 'paystack';
    supportedCurrencies = ['GHS', 'NGN', 'USD'];

    private baseUrl = 'https://api.paystack.co';
    private secretKey: string;

    constructor() {
        this.secretKey = config.gateways.paystack.secretKey;
    }

    private async request(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers: {
                'Authorization': `Bearer ${this.secretKey}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        return response.json();
    }

    async initiateCashIn(params: {
        phone: string;
        amount: number;
        currency: string;
        reference: string;
        network?: string;
    }): Promise<PaymentResult> {
        try {
            const response = await this.request('/charge', 'POST', {
                email: `${params.phone}@clinocash.app`, // Paystack requires email
                amount: Math.round(params.amount * 100), // Amount in pesewas
                currency: params.currency,
                reference: params.reference,
                mobile_money: {
                    phone: params.phone,
                    provider: this.mapNetwork(params.network),
                },
            });

            if (response.status) {
                return {
                    success: true,
                    reference: params.reference,
                    providerReference: response.data?.reference,
                    status: 'pending',
                    message: response.data?.display_text || 'Approve the payment on your phone',
                    metadata: response.data,
                };
            }

            return {
                success: false,
                reference: params.reference,
                status: 'failed',
                message: response.message || 'Payment initiation failed',
            };
        } catch (error: any) {
            return {
                success: false,
                reference: params.reference,
                status: 'failed',
                message: error.message,
            };
        }
    }

    async initiateCashOut(params: {
        phone: string;
        amount: number;
        currency: string;
        reference: string;
        network?: string;
    }): Promise<PaymentResult> {
        try {
            // Step 1: Create transfer recipient
            const recipient = await this.request('/transferrecipient', 'POST', {
                type: 'mobile_money',
                name: params.phone,
                account_number: params.phone,
                bank_code: this.mapNetworkToCode(params.network),
                currency: params.currency,
            });

            if (!recipient.status) {
                return {
                    success: false,
                    reference: params.reference,
                    status: 'failed',
                    message: 'Failed to create transfer recipient',
                };
            }

            // Step 2: Initiate transfer
            const transfer = await this.request('/transfer', 'POST', {
                source: 'balance',
                amount: Math.round(params.amount * 100),
                recipient: recipient.data.recipient_code,
                reference: params.reference,
                reason: 'ClinoCash withdrawal',
            });

            return {
                success: transfer.status,
                reference: params.reference,
                providerReference: transfer.data?.transfer_code,
                status: transfer.status ? 'pending' : 'failed',
                message: transfer.message,
            };
        } catch (error: any) {
            return {
                success: false,
                reference: params.reference,
                status: 'failed',
                message: error.message,
            };
        }
    }

    async initiateBankTransfer(params: {
        accountNumber: string;
        bankCode: string;
        amount: number;
        currency: string;
        reference: string;
        accountName?: string;
    }): Promise<PaymentResult> {
        try {
            const recipient = await this.request('/transferrecipient', 'POST', {
                type: 'nuban',
                name: params.accountName || 'ClinoCash User',
                account_number: params.accountNumber,
                bank_code: params.bankCode,
                currency: params.currency,
            });

            if (!recipient.status) {
                return { success: false, reference: params.reference, status: 'failed', message: 'Invalid bank details' };
            }

            const transfer = await this.request('/transfer', 'POST', {
                source: 'balance',
                amount: Math.round(params.amount * 100),
                recipient: recipient.data.recipient_code,
                reference: params.reference,
            });

            return {
                success: transfer.status,
                reference: params.reference,
                providerReference: transfer.data?.transfer_code,
                status: transfer.status ? 'pending' : 'failed',
                message: transfer.message,
            };
        } catch (error: any) {
            return { success: false, reference: params.reference, status: 'failed', message: error.message };
        }
    }

    async verifyTransaction(reference: string): Promise<PaymentResult> {
        try {
            const response = await this.request(`/transaction/verify/${reference}`);
            return {
                success: response.data?.status === 'success',
                reference,
                providerReference: response.data?.reference,
                status: response.data?.status === 'success' ? 'completed' : 'pending',
                metadata: response.data,
            };
        } catch (error: any) {
            return { success: false, reference, status: 'failed', message: error.message };
        }
    }

    async handleWebhook(payload: WebhookPayload) {
        const { event, data } = payload;
        const isSuccess = event === 'charge.success' || event === 'transfer.success';

        return {
            reference: data.reference,
            status: isSuccess ? 'completed' as const : 'failed' as const,
            metadata: data,
        };
    }

    private mapNetwork(network?: string): string {
        const map: Record<string, string> = {
            MTN: 'mtn',
            TELECEL: 'vod', // Vodafone/Telecel
            AIRTELTIGO: 'tgo',
        };
        return map[network || 'MTN'] || 'mtn';
    }

    private mapNetworkToCode(network?: string): string {
        const map: Record<string, string> = {
            MTN: 'MTN',
            TELECEL: 'VOD',
            AIRTELTIGO: 'ATL',
        };
        return map[network || 'MTN'] || 'MTN';
    }
}
