/**
 * ClinoCash — Emtech / Bank of Ghana Regulatory Sandbox Adapter (v2.0)
 *
 * CONFIRMED API Endpoints:
 *   POST /compliance/v2/remittances        — Submit remittance transfer
 *   POST /compliance/v2/remittances/events — Submit transfer lifecycle event
 *
 * Base URL: https://api.emtech.com/integration
 * Auth:     JWT Bearer via POST /finapp/api/v1/auth/token
 *
 * Schemas (from Stoplight docs):
 *   - KycInfo        → origin / destination blocks
 *   - Transfer       → full remittance payload
 *   - TransferEvent  → lifecycle events
 */

import { config } from '../../../config';

// ═══════════════════════════════════════════════════════
//  ENUMS — Exact allowed values from the API docs
// ═══════════════════════════════════════════════════════

/** Account types for origin/destination */
export enum AccountType {
    CASH = 'CASH',
    CREDIT = 'CREDIT',
    BANK = 'BANK',
    MOBILE_MONEY = 'MOBILE_MONEY',
    CRYPTOCURRENCY = 'CRYPTOCURRENCY',
}

/** KYC check type performed on the user */
export enum UserKYCType {
    HUMAN_VERIFIED = 'HUMAN_VERIFIED',
    NATIONAL_ID_TEXT = 'NATIONAL_ID_TEXT',
    NATIONAL_ID_IMAGE = 'NATIONAL_ID_IMAGE',
    MOBILE_PHOTO = 'MOBILE_PHOTO',
    OTHER = 'OTHER',
}

/** KYC validation level */
export enum UserKYCLevel {
    MINIMUM = 'MINIMUM',
    MEDIUM = 'MEDIUM',
    ENHANCED = 'ENHANCED',
    OTHER = 'OTHER',
}

/** KYC verification status */
export enum UserKYCStatus {
    VERIFIED = 'VERIFIED',
    UNVERIFIED = 'UNVERIFIED',
    NOTCHECKED = 'NOTCHECKED',
}

/** Transfer destination type */
export enum TransferType {
    PICKUP = 'PICKUP',
    DEPOSIT = 'DEPOSIT',
    WALLET = 'WALLET',
    DEBIT_CARD = 'DEBIT_CARD',
    MOBILE_MONEY = 'MOBILE_MONEY',
    OTHER = 'OTHER',
}

/** How the origin amount is funded */
export enum FundingSource {
    CREDIT_CARD = 'CREDIT_CARD',
    DEBIT_CARD = 'DEBIT_CARD',
    BANK = 'BANK',
    WALLET = 'WALLET',
    FIAT = 'FIAT',
    MOBILE_MONEY = 'MOBILE_MONEY',
}

/** Channel used to perform the transaction */
export enum TransferChannel {
    WEB = 'WEB',
    MOBILE_APP = 'MOBILE_APP',
    MOBILE_USSD = 'MOBILE_USSD',
    IN_PERSON = 'IN_PERSON',
    OTHER = 'OTHER',
}

/** Transfer event types — lifecycle events */
export enum TransferEventType {
    INITIATED = 'INITIATED',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    REJECTED = 'REJECTED',
    RETURNED = 'RETURNED',
    CHARGEBACK = 'CHARGEBACK',
    REVOKED = 'REVOKED',
    OTHER = 'OTHER',
}

// ═══════════════════════════════════════════════════════
//  SCHEMAS — Exact field definitions from API docs
// ═══════════════════════════════════════════════════════

/**
 * KycInfo schema — used for both `origin` and `destination`
 * Contains user identity, account details, amounts, and KYC verification
 */
export interface EmtechKycInfo {
    /** Value of the transfer amount (>= 0) */
    amount: number;

    /** Unique identifier for the user (pattern: [\w-]+) */
    userId: string;

    /** ISO4217 Currency code (e.g. "GHS", "XOF") */
    currency: string;

    /** Unique identifier for the account/wallet originating the transaction */
    accountId: string;

    /** City name of the AccountId location (e.g. "Accra") */
    accountCity: string;

    /** Type of account */
    accountType: AccountType;

    /** Type of KYC check performed on the user */
    userKYCType: UserKYCType;

    /** Level of KYC validation */
    userKYCLevel: UserKYCLevel;

    /** ISO-3166-2 Region code (e.g. "GH-AA" for Greater Accra) */
    accountRegion: string;

    /** Reason if KYC status is UNVERIFIED or NOTCHECKED */
    userKYCReason?: string;

    /** Status of KYC checks */
    userKYCStatus: UserKYCStatus;

    /** ISO-3166-1 Country code (e.g. "GH") */
    accountCountry: string;

    /** Amount after conversions or fees (>= 0) */
    adjustedAmount?: number;

    /** KYC service/company that performed the check */
    userKYCService: string;

    /** Provider of the account (bank name or MoMo provider) */
    accountProvider: string;

    /** Specific ID type used for KYC (e.g. "Passport", "Ghana Card") */
    userKYCTypeDetails?: string;
}

/**
 * Transfer schema — POST /compliance/v2/remittances
 * Full remittance transaction payload
 */
export interface EmtechTransferPayload {
    /** Optional metadata */
    meta?: Record<string, any>;

    /** Sender/origin details (KycInfo) */
    origin: EmtechKycInfo;

    /** Unique reference for the transfer (pattern: [\w-]+) */
    transferId: string;

    /** Receiver/destination details (KycInfo) */
    destination: EmtechKycInfo;

    /** Total fees applied to the transfer (>= 0) */
    transferFee: number;

    /** Transfer destination type */
    transferType: TransferType;

    /** How the origin amount is funded */
    fundingSource: FundingSource;

    /** Channel used to perform the transaction */
    transferChannel: TransferChannel;

    /** Client IP address (IPv4 or IPv6) */
    transferClientIp?: string;

    /** ISO8601 Z timestamp (e.g. "2021-12-01T13:20:12Z") */
    transferDatetime: string;

    /** Unique device identifier (pattern: [\w-]+) */
    transferDeviceId: string;

    /** Geospatial latitude (-90 to 90) */
    transferLatitude?: number;

    /** Geospatial longitude (-180 to 180) */
    transferLongitude?: number;

    /** ISO4217 Currency for the fee (e.g. "GHS") */
    transferFeeCurrency: string;

    /** Details when transferType is OTHER */
    transferTypeDetails?: string;
}

/**
 * TransferEvent schema — POST /compliance/v2/remittances/events
 * Lifecycle event for a previously submitted transfer
 */
export interface EmtechTransferEventPayload {
    /** Optional metadata */
    meta?: Record<string, any>;

    /** Unique event identifier (pattern: [\w-]+) */
    eventId: string;

    /** Transfer ID from the Remittance API */
    transferId: string;

    /** Event type */
    transferEvent: TransferEventType;

    /** Reason/details for the event */
    transferEventReason: string;

    /** ISO8601 Z datetime (e.g. "2021-12-01T13:20:12Z") */
    transferEventDatetime: string;
}

/** Auth token response */
interface EmtechTokenResponse {
    accessToken: string;
    expiryMS: number;
}

/** Generic API response */
interface EmtechApiResponse<T = any> {
    success?: boolean;
    data?: T;
    message?: string;
    errors?: Array<{ field: string; message: string }>;
}

// ═══════════════════════════════════════════════════════
//  TOKEN CACHE
// ═══════════════════════════════════════════════════════

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

// ═══════════════════════════════════════════════════════
//  EMTECH ADAPTER
// ═══════════════════════════════════════════════════════

export class EmtechAdapter {
    private baseUrl: string;
    private tokenUrl: string;
    private clientId: string;
    private clientSecret: string;

    constructor() {
        this.baseUrl = config.emtech?.baseUrl || 'https://api.emtech.com/integration';
        this.tokenUrl = config.emtech?.tokenUrl || 'https://platform.com/finapp/api/v1/auth/token';
        this.clientId = config.emtech?.clientId || '';
        this.clientSecret = config.emtech?.clientSecret || '';
    }

    // ─── AUTH ──────────────────────────────────────────

    async getAccessToken(): Promise<string> {
        if (cachedToken && Date.now() < tokenExpiresAt - 30_000) {
            return cachedToken;
        }

        console.log('[Emtech] Requesting access token...');

        const res = await fetch(this.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clientId: this.clientId,
                clientSecret: this.clientSecret,
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`EMTECH_AUTH_FAILED: (${res.status}) ${err}`);
        }

        const data = await res.json() as EmtechTokenResponse;
        cachedToken = data.accessToken;
        tokenExpiresAt = Date.now() + data.expiryMS;

        console.log('[Emtech] Token obtained, expires in', Math.round(data.expiryMS / 1000), 's');
        return cachedToken;
    }

    clearToken(): void {
        cachedToken = null;
        tokenExpiresAt = 0;
    }

    private async request<T = any>(method: string, path: string, body?: any): Promise<EmtechApiResponse<T>> {
        const token = await this.getAccessToken();
        const url = `${this.baseUrl}${path}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };

        console.log(`[Emtech] ${method} ${url}`);

        let response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        // Retry once on 401
        if (response.status === 401) {
            console.log('[Emtech] 401 — refreshing token...');
            this.clearToken();
            const newToken = await this.getAccessToken();

            response = await fetch(url, {
                method,
                headers: { ...headers, 'Authorization': `Bearer ${newToken}` },
                body: body ? JSON.stringify(body) : undefined,
            });
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`EMTECH_API_ERROR: ${method} ${path} (${response.status}): ${errorText}`);
        }

        return await response.json() as EmtechApiResponse<T>;
    }

    // ════════════════════════════════════════════════════
    //  ENDPOINT 1: POST /compliance/v2/remittances
    // ════════════════════════════════════════════════════

    /**
     * Submit a remittance transfer report to the BoG sandbox.
     * Sends the full Transfer payload with origin + destination KycInfo.
     */
    async submitRemittance(payload: EmtechTransferPayload): Promise<EmtechApiResponse> {
        return this.request('POST', '/compliance/v2/remittances', payload);
    }

    /**
     * Convenience: Build a Transfer payload from ClinoCash transaction data
     * and submit it to BoG.
     *
     * Call this after a successful cross-border P2P transfer.
     */
    async reportClinoCashTransfer(params: {
        // Transfer identification
        transferId: string;           // ClinoCash reference
        transferDatetime: string;     // ISO8601 Z
        transferDeviceId: string;     // Device or session ID
        transferChannel: TransferChannel;

        // Sender
        senderUserId: string;
        senderAccountId: string;      // Wallet ID
        senderAmount: number;
        senderCurrency: string;       // "GHS"
        senderAccountType: AccountType;
        senderAccountProvider: string; // e.g. "MTN", "Vodafone"
        senderCity: string;           // e.g. "Accra"
        senderRegion: string;         // e.g. "GH-AA"
        senderCountry: string;        // e.g. "GH"
        senderKycLevel: UserKYCLevel;
        senderKycStatus: UserKYCStatus;
        senderAdjustedAmount?: number;

        // Receiver
        receiverUserId: string;
        receiverAccountId: string;
        receiverAmount: number;
        receiverCurrency: string;     // "XOF"
        receiverAccountType: AccountType;
        receiverAccountProvider: string;
        receiverCity: string;
        receiverRegion: string;
        receiverCountry: string;
        receiverKycLevel: UserKYCLevel;
        receiverKycStatus: UserKYCStatus;

        // Financials
        fee: number;
        feeCurrency: string;
        fundingSource: FundingSource;
        transferType: TransferType;

        // Optional
        clientIp?: string;
        latitude?: number;
        longitude?: number;
        meta?: Record<string, any>;
    }): Promise<EmtechApiResponse> {
        const payload: EmtechTransferPayload = {
            transferId: params.transferId,
            transferDatetime: params.transferDatetime,
            transferDeviceId: params.transferDeviceId,
            transferChannel: params.transferChannel,
            transferFee: params.fee,
            transferFeeCurrency: params.feeCurrency,
            transferType: params.transferType,
            fundingSource: params.fundingSource,
            transferClientIp: params.clientIp,
            transferLatitude: params.latitude,
            transferLongitude: params.longitude,
            meta: {
                source: 'clinocash',
                version: '1.0.0',
                ...params.meta,
            },

            origin: {
                userId: params.senderUserId,
                accountId: params.senderAccountId,
                amount: params.senderAmount,
                currency: params.senderCurrency,
                accountType: params.senderAccountType,
                accountProvider: params.senderAccountProvider,
                accountCity: params.senderCity,
                accountRegion: params.senderRegion,
                accountCountry: params.senderCountry,
                userKYCType: UserKYCType.NATIONAL_ID_TEXT,
                userKYCLevel: params.senderKycLevel,
                userKYCStatus: params.senderKycStatus,
                userKYCService: 'ClinoCash',
                adjustedAmount: params.senderAdjustedAmount,
            },

            destination: {
                userId: params.receiverUserId,
                accountId: params.receiverAccountId,
                amount: params.receiverAmount,
                currency: params.receiverCurrency,
                accountType: params.receiverAccountType,
                accountProvider: params.receiverAccountProvider,
                accountCity: params.receiverCity,
                accountRegion: params.receiverRegion,
                accountCountry: params.receiverCountry,
                userKYCType: UserKYCType.NATIONAL_ID_TEXT,
                userKYCLevel: params.receiverKycLevel,
                userKYCStatus: params.receiverKycStatus,
                userKYCService: 'ClinoCash',
            },
        };

        return this.submitRemittance(payload);
    }

    // ════════════════════════════════════════════════════
    //  ENDPOINT 2: POST /compliance/v2/remittances/events
    // ════════════════════════════════════════════════════

    /**
     * Submit a transfer lifecycle event to the BoG sandbox.
     */
    async submitTransferEvent(event: EmtechTransferEventPayload): Promise<EmtechApiResponse> {
        return this.request('POST', '/compliance/v2/remittances/events', event);
    }

    /** Report: transfer initiated */
    async reportInitiated(transferId: string, eventId: string, reason?: string): Promise<EmtechApiResponse> {
        return this.submitTransferEvent({
            eventId,
            transferId,
            transferEvent: TransferEventType.INITIATED,
            transferEventReason: reason || 'Transfer initiated by sender',
            transferEventDatetime: new Date().toISOString(),
            meta: { source: 'clinocash' },
        });
    }

    /** Report: transfer succeeded */
    async reportSuccess(transferId: string, eventId: string, reason?: string): Promise<EmtechApiResponse> {
        return this.submitTransferEvent({
            eventId,
            transferId,
            transferEvent: TransferEventType.SUCCESS,
            transferEventReason: reason || 'Transfer completed successfully',
            transferEventDatetime: new Date().toISOString(),
            meta: { source: 'clinocash' },
        });
    }

    /** Report: transfer failed */
    async reportFailed(transferId: string, eventId: string, reason: string): Promise<EmtechApiResponse> {
        return this.submitTransferEvent({
            eventId,
            transferId,
            transferEvent: TransferEventType.FAILED,
            transferEventReason: reason,
            transferEventDatetime: new Date().toISOString(),
            meta: { source: 'clinocash' },
        });
    }

    /** Report: transfer revoked */
    async reportRevoked(transferId: string, eventId: string, reason: string): Promise<EmtechApiResponse> {
        return this.submitTransferEvent({
            eventId,
            transferId,
            transferEvent: TransferEventType.REVOKED,
            transferEventReason: reason,
            transferEventDatetime: new Date().toISOString(),
            meta: { source: 'clinocash' },
        });
    }

    /** Report: transfer returned */
    async reportReturned(transferId: string, eventId: string, reason: string): Promise<EmtechApiResponse> {
        return this.submitTransferEvent({
            eventId,
            transferId,
            transferEvent: TransferEventType.RETURNED,
            transferEventReason: reason,
            transferEventDatetime: new Date().toISOString(),
            meta: { source: 'clinocash' },
        });
    }

    // ─── HEALTH ────────────────────────────────────────

    async healthCheck(): Promise<{
        connected: boolean;
        tokenValid: boolean;
        baseUrl: string;
        hasCredentials: boolean;
    }> {
        const hasCredentials = !!(this.clientId && this.clientSecret);
        if (!hasCredentials) {
            return { connected: false, tokenValid: false, baseUrl: this.baseUrl, hasCredentials: false };
        }
        try {
            await this.getAccessToken();
            return { connected: true, tokenValid: true, baseUrl: this.baseUrl, hasCredentials: true };
        } catch (error) {
            console.error('[Emtech] Health check failed:', error);
            return { connected: false, tokenValid: false, baseUrl: this.baseUrl, hasCredentials: true };
        }
    }

    isConfigured(): boolean {
        return !!(this.clientId && this.clientSecret);
    }
}

// ─── SINGLETON ─────────────────────────────────────────

export const emtechAdapter = new EmtechAdapter();
export default emtechAdapter;
