/**
 * ClinoCash — Database Seed Script
 * Creates demo users, wallets, exchange rates, and sample transactions
 * 
 * Usage: npm run db:seed
 */
import { PrismaClient, Currency, TransactionType, TransactionStatus, KycTier } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Hash PIN using PBKDF2 (same as helpers.ts)
function hashPin(pin: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(pin, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

async function main() {
    console.log('🌱 Seeding ClinoCash database...\n');

    // ─── CLEAR EXISTING DATA ──────────────────────────
    console.log('🗑️  Clearing existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.ledgerEntry.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.paymentRequest.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.otpCode.deleteMany();
    await prisma.exchangeRate.deleteMany();
    await prisma.user.deleteMany();

    // ─── USERS ────────────────────────────────────────
    console.log('👤 Creating users...');

    const pin1234 = hashPin('1234');
    const pin0000 = hashPin('0000');

    const kwame = await prisma.user.create({
        data: {
            phone: '+233241234567',
            username: 'kwame.a',
            displayName: 'Kwame Asante',
            pinHash: pin1234,
            kycTier: KycTier.TIER_1,
            locale: 'en',
        },
    });

    const ama = await prisma.user.create({
        data: {
            phone: '+233241234568',
            username: 'ama.s',
            displayName: 'Ama Serwah',
            pinHash: pin1234,
            kycTier: KycTier.TIER_1,
            locale: 'en',
        },
    });

    const kofi = await prisma.user.create({
        data: {
            phone: '+233241234569',
            username: 'kofi.m',
            displayName: 'Kofi Mensah',
            pinHash: pin1234,
            kycTier: KycTier.TIER_0,
            locale: 'en',
        },
    });

    const fatou = await prisma.user.create({
        data: {
            phone: '+22890123456',
            username: 'fatou.d',
            displayName: 'Fatou Diallo',
            pinHash: pin1234,
            kycTier: KycTier.TIER_1,
            locale: 'fr',
        },
    });

    const yaw = await prisma.user.create({
        data: {
            phone: '+233241234570',
            username: 'yaw.b',
            displayName: 'Yaw Boateng',
            pinHash: pin0000,
            kycTier: KycTier.TIER_2,
            locale: 'en',
        },
    });

    // Demo user for quick testing
    const demo = await prisma.user.create({
        data: {
            phone: '+233200000000',
            username: 'demo',
            displayName: 'Demo User',
            pinHash: pin1234,
            kycTier: KycTier.TIER_2,
            locale: 'en',
        },
    });

    console.log(`   ✅ Created ${6} users`);
    console.log(`   📌 Demo login: phone=+233200000000, PIN=1234`);
    console.log(`   📌 Kwame login: phone=+233241234567, PIN=1234`);

    // ─── WALLETS ──────────────────────────────────────
    console.log('💼 Creating wallets...');

    // Kwame — multi-currency
    const kwameGHS = await prisma.wallet.create({
        data: { userId: kwame.id, currency: Currency.GHS, balance: 12450.75 },
    });
    const kwameXOF = await prisma.wallet.create({
        data: { userId: kwame.id, currency: Currency.XOF, balance: 285000 },
    });
    const kwameUSD = await prisma.wallet.create({
        data: { userId: kwame.id, currency: Currency.USD, balance: 342.50 },
    });

    // Ama
    const amaGHS = await prisma.wallet.create({
        data: { userId: ama.id, currency: Currency.GHS, balance: 8200 },
    });

    // Kofi
    const kofiGHS = await prisma.wallet.create({
        data: { userId: kofi.id, currency: Currency.GHS, balance: 350 },
    });

    // Fatou — francophone with XOF
    const fatouXOF = await prisma.wallet.create({
        data: { userId: fatou.id, currency: Currency.XOF, balance: 450000 },
    });
    const fatouGHS = await prisma.wallet.create({
        data: { userId: fatou.id, currency: Currency.GHS, balance: 1200 },
    });

    // Yaw
    const yawGHS = await prisma.wallet.create({
        data: { userId: yaw.id, currency: Currency.GHS, balance: 25000 },
    });

    // Demo
    const demoGHS = await prisma.wallet.create({
        data: { userId: demo.id, currency: Currency.GHS, balance: 5000 },
    });
    const demoXOF = await prisma.wallet.create({
        data: { userId: demo.id, currency: Currency.XOF, balance: 100000 },
    });
    const demoUSD = await prisma.wallet.create({
        data: { userId: demo.id, currency: Currency.USD, balance: 150 },
    });

    console.log(`   ✅ Created ${11} wallets`);

    // ─── EXCHANGE RATES ───────────────────────────────
    console.log('💱 Creating exchange rates...');

    await prisma.exchangeRate.createMany({
        data: [
            { fromCurrency: Currency.GHS, toCurrency: Currency.USD, rate: 0.063, source: 'seed' },
            { fromCurrency: Currency.USD, toCurrency: Currency.GHS, rate: 15.85, source: 'seed' },
            { fromCurrency: Currency.GHS, toCurrency: Currency.XOF, rate: 38.50, source: 'seed' },
            { fromCurrency: Currency.XOF, toCurrency: Currency.GHS, rate: 0.026, source: 'seed' },
            { fromCurrency: Currency.USD, toCurrency: Currency.XOF, rate: 610.50, source: 'seed' },
            { fromCurrency: Currency.XOF, toCurrency: Currency.USD, rate: 0.00164, source: 'seed' },
        ],
    });

    console.log(`   ✅ Created 6 exchange rate pairs`);

    // ─── SAMPLE TRANSACTIONS ──────────────────────────
    console.log('📝 Creating sample transactions...');

    const now = new Date();

    // Ama sent GH₵ 500 to Kwame (30 min ago)
    const txn1 = await prisma.transaction.create({
        data: {
            reference: `P2P-SEED-001`,
            type: TransactionType.P2P_TRANSFER,
            status: TransactionStatus.COMPLETED,
            senderUserId: ama.id,
            receiverUserId: kwame.id,
            senderWalletId: amaGHS.id,
            receiverWalletId: kwameGHS.id,
            amount: 500,
            fee: 2.50,
            currency: Currency.GHS,
            description: 'Lunch money 🍕',
            completedAt: new Date(now.getTime() - 30 * 60 * 1000),
        },
    });

    // Kwame sent GH₵ 150 to Kofi (2 hours ago)
    const txn2 = await prisma.transaction.create({
        data: {
            reference: `P2P-SEED-002`,
            type: TransactionType.P2P_TRANSFER,
            status: TransactionStatus.COMPLETED,
            senderUserId: kwame.id,
            receiverUserId: kofi.id,
            senderWalletId: kwameGHS.id,
            receiverWalletId: kofiGHS.id,
            amount: 150,
            fee: 0.75,
            currency: Currency.GHS,
            description: 'Transport fare',
            completedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        },
    });

    // Cash In for Kwame (5 hours ago)
    const txn3 = await prisma.transaction.create({
        data: {
            reference: `CI-SEED-003`,
            type: TransactionType.CASH_IN,
            status: TransactionStatus.COMPLETED,
            receiverUserId: kwame.id,
            receiverWalletId: kwameGHS.id,
            amount: 2000,
            fee: 0,
            currency: Currency.GHS,
            description: 'MTN MoMo Top Up',
            completedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
        },
    });

    // Kwame sent 25,000 XOF to Fatou (1 day ago)
    const txn4 = await prisma.transaction.create({
        data: {
            reference: `P2P-SEED-004`,
            type: TransactionType.P2P_TRANSFER,
            status: TransactionStatus.COMPLETED,
            senderUserId: kwame.id,
            receiverUserId: fatou.id,
            senderWalletId: kwameXOF.id,
            receiverWalletId: fatouXOF.id,
            amount: 25000,
            fee: 125,
            currency: Currency.XOF,
            description: 'Freelance payment',
            completedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
    });

    // Bank withdrawal (2 days ago)
    const txn5 = await prisma.transaction.create({
        data: {
            reference: `CO-SEED-005`,
            type: TransactionType.CASH_OUT,
            status: TransactionStatus.COMPLETED,
            senderUserId: kwame.id,
            senderWalletId: kwameGHS.id,
            amount: 1000,
            fee: 10,
            currency: Currency.GHS,
            description: 'Wallet to Bank — Ecobank Ghana',
            completedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        },
    });

    // Demo user transactions
    const txn6 = await prisma.transaction.create({
        data: {
            reference: `P2P-SEED-006`,
            type: TransactionType.P2P_TRANSFER,
            status: TransactionStatus.COMPLETED,
            senderUserId: yaw.id,
            receiverUserId: demo.id,
            senderWalletId: yawGHS.id,
            receiverWalletId: demoGHS.id,
            amount: 200,
            fee: 1,
            currency: Currency.GHS,
            description: 'Welcome bonus 🎉',
            completedAt: new Date(now.getTime() - 60 * 60 * 1000),
        },
    });

    console.log(`   ✅ Created 6 sample transactions`);

    // ─── LEDGER ENTRIES ───────────────────────────────
    console.log('📒 Creating ledger entries...');

    // Create matching ledger entries for txn1 (Ama → Kwame)
    await prisma.ledgerEntry.createMany({
        data: [
            {
                transactionId: txn1.id,
                walletId: amaGHS.id,
                entryType: 'DEBIT',
                amount: 502.50,
                balanceBefore: 8700,
                balanceAfter: 8197.50,
            },
            {
                transactionId: txn1.id,
                walletId: kwameGHS.id,
                entryType: 'CREDIT',
                amount: 500,
                balanceBefore: 11950.75,
                balanceAfter: 12450.75,
            },
        ],
    });

    console.log(`   ✅ Created ledger entries`);

    // ─── DONE ─────────────────────────────────────────
    console.log('\n🎉 Seed completed successfully!\n');
    console.log('┌──────────────────────────────────────────┐');
    console.log('│  Demo Accounts:                          │');
    console.log('│                                          │');
    console.log('│  📱 +233200000000  PIN: 1234  (demo)     │');
    console.log('│  📱 +233241234567  PIN: 1234  (kwame.a)  │');
    console.log('│  📱 +233241234568  PIN: 1234  (ama.s)    │');
    console.log('│  📱 +233241234569  PIN: 1234  (kofi.m)   │');
    console.log('│  📱 +22890123456   PIN: 1234  (fatou.d)  │');
    console.log('│  📱 +233241234570  PIN: 0000  (yaw.b)    │');
    console.log('└──────────────────────────────────────────┘');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
