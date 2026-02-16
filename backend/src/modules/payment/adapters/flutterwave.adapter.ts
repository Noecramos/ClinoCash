import { PaymentGateway, PaymentResult, WebhookPayload } from '../payment.gateway';
import { config } from '../../../config';

/**
 * Flutterwave Payment Adapter
 * Primary gateway for Togo/UEMOA (XOF) Mobile Money
 * 
 * Supports: T-Money, Flooz, bank transfers
 * API Docs: https://developer.flutterwave.com/docs
 */
export class FlutterwaveAdapter implements PaymentGateway {
    name = 'flutterwave';
    supportedCurrencies = ['XOF', 'GHS', 'USD', 'NGN'];

    private baseUrl = 'https://api.flutterwave.com/v3';
    private secretKey: string;

    constructor() {
        this.secretKey = config.gateways.flutterwave.secretKey;
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
            const response = await this.request('/charges?type=mobile_money_franco', 'POST', {
                phone_number: params.phone,
                amount: params.amount,
                currency: params.currency,
                tx_ref: params.reference,
                email: `${params.phone}@clinocash.app`,
                network: this.mapNetwork(params.network),
            });

            return {
                success: response.status === 'success',
                reference: params.reference,
                providerReference: response.data?.id?.toString(),
                status: response.status === 'success' ? 'pending' : 'failed',
                message: response.message,
                metadata: response.data,
            };
        } catch (error: any) {
            return { success: false, reference: params.reference, status: 'failed', message: error.message };
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
            const response = await this.request('/transfers', 'POST', {
                account_number: params.phone,
                account_bank: this.mapNetworkToBank(params.network),
                amount: params.amount,
                currency: params.currency,
                reference: params.reference,
                narration: 'ClinoCash withdrawal',
                beneficiary_name: 'ClinoCash User',
            });

            return {
                success: response.status === 'success',
                reference: params.reference,
                providerReference: response.data?.id?.toString(),
                status: response.status === 'success' ? 'pending' : 'failed',
                message: response.message,
            };
        } catch (error: any) {
            return { success: false, reference: params.reference, status: 'failed', message: error.message };
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
            const response = await this.request('/transfers', 'POST', {
                account_number: params.accountNumber,
                account_bank: params.bankCode,
                amount: params.amount,
                currency: params.currency,
                reference: params.reference,
                narration: 'ClinoCash bank transfer',
                beneficiary_name: params.accountName || 'ClinoCash User',
            });

            return {
                success: response.status === 'success',
                reference: params.reference,
                providerReference: response.data?.id?.toString(),
                status: response.status === 'success' ? 'pending' : 'failed',
                message: response.message,
            };
        } catch (error: any) {
            return { success: false, reference: params.reference, status: 'failed', message: error.message };
        }
    }

    async verifyTransaction(reference: string): Promise<PaymentResult> {
        try {
            const response = await this.request(`/transactions/verify_by_reference?tx_ref=${reference}`);
            const isSuccess = response.data?.status === 'successful';

            return {
                success: isSuccess,
                reference,
                providerReference: response.data?.id?.toString(),
                status: isSuccess ? 'completed' : 'pending',
                metadata: response.data,
            };
        } catch (error: any) {
            return { success: false, reference, status: 'failed', message: error.message };
        }
    }

    async handleWebhook(payload: WebhookPayload) {
        const { event, data } = payload;
        const isSuccess = event === 'charge.completed' && data.status === 'successful';

        return {
            reference: data.tx_ref || data.reference,
            status: isSuccess ? 'completed' as const : 'failed' as const,
            metadata: data,
        };
    }

    private mapNetwork(network?: string): string {
        const map: Record<string, string> = {
            TMONEY: 'TMONEY',
            FLOOZ: 'FLOOZ',
            MTN: 'MTN',
        };
        return map[network || 'TMONEY'] || 'TMONEY';
    }

    private mapNetworkToBank(network?: string): string {
        const map: Record<string, string> = {
            TMONEY: 'FMM',
            FLOOZ: 'FMM',
            MTN: 'FMM',
        };
        return map[network || 'FMM'] || 'FMM';
    }
}
