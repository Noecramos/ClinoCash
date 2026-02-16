import { Prisma, TransactionType, TransactionStatus, Currency } from '@prisma/client';
import prisma from '../../config/database';
import { config } from '../../config';
import { generateReference } from '../../utils/helpers';

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
