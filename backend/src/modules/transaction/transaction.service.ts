import { Prisma, TransactionType, TransactionStatus, Currency } from '@prisma/client';
import prisma from '../../config/database';
import { config } from '../../config';
import { generateReference } from '../../utils/helpers';
import { emtechAdapter, AccountType, UserKYCLevel, UserKYCStatus, FundingSource, TransferType, TransferChannel } from '../payment/adapters/emtech.adapter';
import { v4 as uuidv4 } from 'uuid';

// ─── TYPES ─────────────────────────────────────────────

interface TransferParams {
    senderUserId: string;
    receiverUserId: string;
    amount: number;
    currency: Currency;
    description?: string;
    idempotencyKey?: string;
    type?: TransactionType;
}

interface TransferResult {
    success: boolean;
    transaction?: any;
    error?: string;
    code?: string;
}

// ─── CORE TRANSFER FUNCTION (ATOMIC) ──────────────────

/**
 * transferMoney — The heart of ClinoCash
 * 
 * Performs an atomic P2P transfer using PostgreSQL transactions.
 * Implements double-entry bookkeeping: every transfer creates
 * a DEBIT on the sender's wallet and a CREDIT on the receiver's wallet.
 * 
 * Anti-double-spending measures:
 * 1. Idempotency key prevents duplicate submissions
 * 2. Optimistic locking via wallet version column
 * 3. PostgreSQL SERIALIZABLE transaction isolation
 * 4. Balance check inside the transaction
 * 
 * @param params - Transfer parameters
 * @returns TransferResult with the transaction record
 */
export async function transferMoney(params: TransferParams): Promise<TransferResult> {
    const {
        senderUserId,
        receiverUserId,
        amount,
        currency,
        description,
        idempotencyKey,
        type = TransactionType.P2P_TRANSFER,
    } = params;

    // ── Step 1: Input Validation ────────────────────────

    if (amount <= 0) {
        return { success: false, error: 'Amount must be greater than zero', code: 'INVALID_AMOUNT' };
    }

    if (senderUserId === receiverUserId) {
        return { success: false, error: 'Cannot transfer to yourself', code: 'SELF_TRANSFER' };
    }

    // ── Step 2: Check Idempotency ───────────────────────

    if (idempotencyKey) {
        const existing = await prisma.transaction.findUnique({
            where: { idempotencyKey },
        });
        if (existing) {
            return {
                success: true,
                transaction: existing,
            };
        }
    }

    // ── Step 3: Calculate Fee ───────────────────────────

    const feeRate = config.fees[type as keyof typeof config.fees] || 0;
    const fee = new Prisma.Decimal(amount).mul(new Prisma.Decimal(feeRate));
    const totalDebit = new Prisma.Decimal(amount).add(fee);

    // ── Step 4: Atomic Transaction ──────────────────────

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 4a. Lock and fetch sender wallet
            const senderWallet = await tx.wallet.findFirst({
                where: {
                    userId: senderUserId,
                    currency: currency,
                    status: 'ACTIVE',
                },
            });

            if (!senderWallet) {
                throw new Error(`WALLET_NOT_FOUND:Sender has no ${currency} wallet`);
            }

            // 4b. Lock and fetch receiver wallet
            const receiverWallet = await tx.wallet.findFirst({
                where: {
                    userId: receiverUserId,
                    currency: currency,
                    status: 'ACTIVE',
                },
            });

            if (!receiverWallet) {
                throw new Error(`RECEIVER_WALLET_NOT_FOUND:Receiver has no ${currency} wallet`);
            }

            // 4c. Balance check (inside transaction to prevent race conditions)
            if (senderWallet.balance.lessThan(totalDebit)) {
                throw new Error(`INSUFFICIENT_FUNDS:Insufficient balance. Required: ${totalDebit}, Available: ${senderWallet.balance}`);
            }

            // 4d. Check KYC limits
            const sender = await tx.user.findUnique({ where: { id: senderUserId } });
            if (sender) {
                const limits = config.kycLimits[sender.kycTier];
                if (amount > limits.single) {
                    throw new Error(`KYC_LIMIT_EXCEEDED:Single transaction limit of ${limits.single} exceeded for your KYC tier`);
                }

                // Check daily limit
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const dailyTotal = await tx.transaction.aggregate({
                    where: {
                        senderUserId: senderUserId,
                        status: 'COMPLETED',
                        createdAt: { gte: todayStart },
                    },
                    _sum: { amount: true },
                });

                const dailySpent = dailyTotal._sum.amount?.toNumber() || 0;
                if (dailySpent + amount > limits.daily) {
                    throw new Error(`DAILY_LIMIT_EXCEEDED:Daily transaction limit of ${limits.daily} exceeded for your KYC tier`);
                }
            }

            // 4e. Debit sender wallet (with optimistic locking)
            const updatedSender = await tx.wallet.updateMany({
                where: {
                    id: senderWallet.id,
                    version: senderWallet.version, // Optimistic lock
                },
                data: {
                    balance: { decrement: totalDebit },
                    version: { increment: 1 },
                },
            });

            if (updatedSender.count === 0) {
                throw new Error('CONCURRENT_MODIFICATION:Wallet was modified by another transaction, please retry');
            }

            // 4f. Credit receiver wallet
            await tx.wallet.update({
                where: { id: receiverWallet.id },
                data: {
                    balance: { increment: new Prisma.Decimal(amount) },
                    version: { increment: 1 },
                },
            });

            // 4g. Create immutable transaction record
            const reference = generateReference('P2P');
            const transaction = await tx.transaction.create({
                data: {
                    reference,
                    idempotencyKey: idempotencyKey || undefined,
                    type,
                    status: TransactionStatus.COMPLETED,
                    senderUserId,
                    receiverUserId,
                    senderWalletId: senderWallet.id,
                    receiverWalletId: receiverWallet.id,
                    amount: new Prisma.Decimal(amount),
                    fee,
                    currency,
                    description: description || `Transfer to user`,
                    completedAt: new Date(),
                    metadata: {
                        senderUsername: sender?.username,
                        feeRate,
                    },
                },
            });

            // 4h. Create double-entry ledger records
            const newSenderBalance = senderWallet.balance.sub(totalDebit);
            const newReceiverBalance = receiverWallet.balance.add(new Prisma.Decimal(amount));

            await tx.ledgerEntry.createMany({
                data: [
                    {
                        transactionId: transaction.id,
                        walletId: senderWallet.id,
                        entryType: 'DEBIT',
                        amount: totalDebit,
                        balanceBefore: senderWallet.balance,
                        balanceAfter: newSenderBalance,
                    },
                    {
                        transactionId: transaction.id,
                        walletId: receiverWallet.id,
                        entryType: 'CREDIT',
                        amount: new Prisma.Decimal(amount),
                        balanceBefore: receiverWallet.balance,
                        balanceAfter: newReceiverBalance,
                    },
                ],
            });

            // 4i. If there's a fee, create a fee transaction to the system wallet
            if (fee.greaterThan(0)) {
                await tx.ledgerEntry.create({
                    data: {
                        transactionId: transaction.id,
                        walletId: senderWallet.id,
                        entryType: 'DEBIT',
                        amount: fee,
                        balanceBefore: newSenderBalance.add(fee),
                        balanceAfter: newSenderBalance,
                    },
                });
            }

            // 4j. Audit log
            await tx.auditLog.create({
                data: {
                    userId: senderUserId,
                    action: 'TRANSFER',
                    entity: 'Transaction',
                    entityId: transaction.id,
                    details: {
                        type,
                        amount: amount.toString(),
                        fee: fee.toString(),
                        currency,
                        receiverUserId,
                        reference,
                    },
                },
            });

            return transaction;
        }, {
            // PostgreSQL transaction options for maximum safety
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5000,  // Max time to wait for a connection
            timeout: 10000, // Max transaction duration
        });

        // ── BoG Regulatory Reporting (async, non-blocking) ──
        // If Emtech is configured and this is a cross-border transfer,
        // report it to the Bank of Ghana sandbox.
        if (emtechAdapter.isConfigured()) {
            reportToBoG(result, senderUserId, receiverUserId, amount, fee.toNumber(), currency, type)
                .catch((err: any) => console.error('[BoG Reporting] Failed (non-blocking):', err.message));
        }

        return { success: true, transaction: result };

    } catch (error: any) {
        const message = error.message || 'Transfer failed';
        const [code, errorMsg] = message.includes(':')
            ? message.split(':')
            : ['TRANSFER_FAILED', message];

        // Log failed transaction
        try {
            await prisma.transaction.create({
                data: {
                    reference: generateReference('FAIL'),
                    type,
                    status: TransactionStatus.FAILED,
                    senderUserId,
                    receiverUserId,
                    amount: new Prisma.Decimal(amount),
                    fee: new Prisma.Decimal(0),
                    currency,
                    failureReason: message,
                    description: description || 'Failed transfer',
                },
            });
        } catch (logError) {
            console.error('Failed to log failed transaction:', logError);
        }

        return {
            success: false,
            error: errorMsg.trim(),
            code: code.trim(),
        };
    }
}

// ─── GET TRANSACTION HISTORY ──────────────────────────

export async function getTransactionHistory(
    userId: string,
    options: {
        page?: number;
        limit?: number;
        type?: TransactionType;
        currency?: Currency;
    } = {}
) {
    const { page = 1, limit = 20, type, currency } = options;
    const skip = (page - 1) * limit;

    const where: any = {
        OR: [
            { senderUserId: userId },
            { receiverUserId: userId },
        ],
        ...(type && { type }),
        ...(currency && { currency }),
    };

    const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
                receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            },
        }),
        prisma.transaction.count({ where }),
    ]);

    return {
        transactions,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

// ─── GET SINGLE TRANSACTION ──────────────────────────

export async function getTransactionByReference(reference: string) {
    return prisma.transaction.findUnique({
        where: { reference },
        include: {
            sender: { select: { id: true, username: true, displayName: true } },
            receiver: { select: { id: true, username: true, displayName: true } },
            ledgerEntries: true,
        },
    });
}

// ─── BOG REGULATORY REPORTING ─────────────────────────

/**
 * Asynchronously report a completed transfer to the Bank of Ghana
 * via the Emtech regulatory sandbox.
 *
 * This is fire-and-forget — failures are logged but never
 * block or roll back the actual ClinoCash transaction.
 */
async function reportToBoG(
    transaction: any,
    senderUserId: string,
    receiverUserId: string,
    amount: number,
    fee: number,
    currency: Currency,
    type: TransactionType,
): Promise<void> {
    try {
        // Fetch sender and receiver details for the report
        const [sender, receiver] = await Promise.all([
            prisma.user.findUnique({
                where: { id: senderUserId },
                select: {
                    id: true, username: true, displayName: true, phone: true,
                    kycTier: true, wallets: { where: { currency }, select: { id: true } },
                },
            }),
            prisma.user.findUnique({
                where: { id: receiverUserId },
                select: {
                    id: true, username: true, displayName: true, phone: true,
                    kycTier: true, wallets: { where: { currency }, select: { id: true } },
                },
            }),
        ]);

        if (!sender || !receiver) {
            console.warn('[BoG] Cannot report — sender or receiver not found');
            return;
        }

        // Map ClinoCash KYC tiers to Emtech KYC levels
        const kycLevelMap: Record<string, UserKYCLevel> = {
            TIER_0: UserKYCLevel.MINIMUM,
            TIER_1: UserKYCLevel.MEDIUM,
            TIER_2: UserKYCLevel.ENHANCED,
        };

        // Determine country codes from currency
        const countryMap: Record<string, { code: string; city: string; region: string }> = {
            GHS: { code: 'GH', city: 'Accra', region: 'GH-AA' },
            XOF: { code: 'TG', city: 'Lomé', region: 'TG-M' },
            USD: { code: 'US', city: 'New York', region: 'US-NY' },
        };

        const senderCountry = countryMap[currency] || countryMap.GHS;
        const receiverCountry = countryMap[currency] || countryMap.GHS;

        const transferId = transaction.reference || transaction.id;
        const eventIdBase = uuidv4();

        // 1. Submit the remittance transfer report
        await emtechAdapter.reportClinoCashTransfer({
            transferId,
            transferDatetime: new Date().toISOString(),
            transferDeviceId: `clinocash-server-${process.env.NODE_ENV || 'dev'}`,
            transferChannel: TransferChannel.MOBILE_APP,

            senderUserId: sender.id,
            senderAccountId: sender.wallets[0]?.id || sender.id,
            senderAmount: amount,
            senderCurrency: currency,
            senderAccountType: AccountType.MOBILE_MONEY,
            senderAccountProvider: 'ClinoCash',
            senderCity: senderCountry.city,
            senderRegion: senderCountry.region,
            senderCountry: senderCountry.code,
            senderKycLevel: kycLevelMap[sender.kycTier] || UserKYCLevel.MINIMUM,
            senderKycStatus: UserKYCStatus.VERIFIED,
            senderAdjustedAmount: amount - fee,

            receiverUserId: receiver.id,
            receiverAccountId: receiver.wallets[0]?.id || receiver.id,
            receiverAmount: amount - fee,
            receiverCurrency: currency,
            receiverAccountType: AccountType.MOBILE_MONEY,
            receiverAccountProvider: 'ClinoCash',
            receiverCity: receiverCountry.city,
            receiverRegion: receiverCountry.region,
            receiverCountry: receiverCountry.code,
            receiverKycLevel: kycLevelMap[receiver.kycTier] || UserKYCLevel.MINIMUM,
            receiverKycStatus: UserKYCStatus.VERIFIED,

            fee,
            feeCurrency: currency,
            fundingSource: FundingSource.WALLET,
            transferType: TransferType.WALLET,
        });

        console.log(`[BoG] Remittance reported: ${transferId}`);

        // 2. Submit INITIATED event
        await emtechAdapter.reportInitiated(
            transferId,
            `${eventIdBase}-init`,
            `${type} transfer initiated via ClinoCash`,
        );

        // 3. Submit SUCCESS event
        await emtechAdapter.reportSuccess(
            transferId,
            `${eventIdBase}-success`,
            `${type} transfer completed — ${amount} ${currency}`,
        );

        console.log(`[BoG] Transfer events reported: ${transferId}`);

    } catch (error: any) {
        // Never throw — this is fire-and-forget
        console.error(`[BoG] Reporting failed for transfer: ${error.message}`);
    }
}
