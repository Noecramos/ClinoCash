import { Currency, WalletStatus } from '@prisma/client';
import prisma from '../../config/database';

/**
 * Create a new wallet for a user in a specific currency
 */
export async function createWallet(userId: string, currency: Currency) {
    // Check if wallet already exists
    const existing = await prisma.wallet.findUnique({
        where: { userId_currency: { userId, currency } },
    });

    if (existing) {
        return { success: false, error: 'Wallet already exists for this currency', wallet: existing };
    }

    const wallet = await prisma.wallet.create({
        data: {
            userId,
            currency,
            balance: 0,
            status: WalletStatus.ACTIVE,
        },
    });

    return { success: true, wallet };
}

/**
 * Get all wallets for a user
 */
export async function getUserWallets(userId: string) {
    const wallets = await prisma.wallet.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
    });

    return wallets;
}

/**
 * Get exchange rates for all currency pairs
 */
export async function getExchangeRates() {
    const rates = await prisma.exchangeRate.findMany({
        orderBy: { updatedAt: 'desc' },
    });

    // If no rates in DB, return defaults
    if (rates.length === 0) {
        return getDefaultExchangeRates();
    }

    return rates;
}

/**
 * Default exchange rates (used when DB has no rates)
 */
function getDefaultExchangeRates() {
    return [
        { fromCurrency: 'GHS', toCurrency: 'USD', rate: 0.063, source: 'default' },
        { fromCurrency: 'USD', toCurrency: 'GHS', rate: 15.85, source: 'default' },
        { fromCurrency: 'GHS', toCurrency: 'XOF', rate: 38.50, source: 'default' },
        { fromCurrency: 'XOF', toCurrency: 'GHS', rate: 0.026, source: 'default' },
        { fromCurrency: 'USD', toCurrency: 'XOF', rate: 610.50, source: 'default' },
        { fromCurrency: 'XOF', toCurrency: 'USD', rate: 0.00164, source: 'default' },
    ];
}

/**
 * Get a specific exchange rate
 */
export async function getExchangeRate(from: Currency, to: Currency): Promise<number> {
    if (from === to) return 1;

    const rate = await prisma.exchangeRate.findUnique({
        where: { fromCurrency_toCurrency: { fromCurrency: from, toCurrency: to } },
    });

    if (rate) return rate.rate.toNumber();

    // Fallback to defaults
    const defaults = getDefaultExchangeRates();
    const defaultRate = defaults.find(r => r.fromCurrency === from && r.toCurrency === to);
    return defaultRate?.rate || 1;
}

/**
 * Get total balance across all wallets in a base currency
 */
export async function getTotalBalance(userId: string, baseCurrency: Currency = 'GHS') {
    const wallets = await getUserWallets(userId);
    let total = 0;

    for (const wallet of wallets) {
        if (wallet.currency === baseCurrency) {
            total += wallet.balance.toNumber();
        } else {
            const rate = await getExchangeRate(wallet.currency as Currency, baseCurrency);
            total += wallet.balance.toNumber() * rate;
        }
    }

    return {
        total,
        baseCurrency,
        wallets: wallets.map(w => ({
            id: w.id,
            currency: w.currency,
            balance: w.balance.toNumber(),
            status: w.status,
        })),
    };
}
