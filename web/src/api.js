// ClinoCash — API Service Layer
// Connects the React frontend to the Express backend

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// ─── TOKEN MANAGEMENT ──────────────────────────────────

let authToken = localStorage.getItem('clinocash_token') || null;

export function setToken(token) {
    authToken = token;
    if (token) {
        localStorage.setItem('clinocash_token', token);
    } else {
        localStorage.removeItem('clinocash_token');
    }
}

export function getToken() {
    return authToken;
}

export function clearSession() {
    authToken = null;
    localStorage.removeItem('clinocash_token');
    localStorage.removeItem('clinocash_user');
}

export function getStoredUser() {
    try {
        const raw = localStorage.getItem('clinocash_user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function setStoredUser(user) {
    if (user) {
        localStorage.setItem('clinocash_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('clinocash_user');
    }
}

// ─── HTTP HELPER ───────────────────────────────────────

async function request(endpoint, options = {}) {
    const { method = 'GET', body, auth = true } = options;

    const headers = { 'Content-Type': 'application/json' };
    if (auth && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await res.json();

        // Handle auth errors globally
        if (res.status === 401) {
            clearSession();
            window.dispatchEvent(new CustomEvent('clinocash:auth-expired'));
        }

        return { ok: res.ok, status: res.status, ...data };
    } catch (error) {
        console.error(`[API] ${method} ${endpoint} failed:`, error);
        return { ok: false, success: false, error: 'Network error — check your connection' };
    }
}

// ─── AUTH ───────────────────────────────────────────────

export const auth = {
    /** Send OTP to phone */
    sendOtp(phone, purpose = 'LOGIN') {
        return request('/auth/send-otp', {
            method: 'POST',
            body: { phone, purpose },
            auth: false,
        });
    },

    /** Verify OTP code */
    verifyOtp(phone, code, purpose = 'LOGIN') {
        return request('/auth/verify-otp', {
            method: 'POST',
            body: { phone, code, purpose },
            auth: false,
        });
    },

    /** Register new user */
    async register({ phone, username, displayName, pin, locale }) {
        const res = await request('/auth/register', {
            method: 'POST',
            body: { phone, username, displayName, pin, locale },
            auth: false,
        });
        if (res.success && res.token) {
            setToken(res.token);
            setStoredUser(res.user);
        }
        return res;
    },

    /** Login with phone + PIN */
    async login(phone, pin) {
        const res = await request('/auth/login', {
            method: 'POST',
            body: { phone, pin },
            auth: false,
        });
        if (res.success && res.token) {
            setToken(res.token);
            setStoredUser(res.user);
        }
        return res;
    },

    /** Get current user profile */
    getProfile() {
        return request('/auth/profile');
    },

    /** Logout */
    logout() {
        clearSession();
    },
};

// ─── WALLETS ───────────────────────────────────────────

export const wallets = {
    /** Get all wallets for the current user */
    getAll() {
        return request('/wallets');
    },

    /** Create a new wallet for a currency */
    create(currency) {
        return request('/wallets', {
            method: 'POST',
            body: { currency },
        });
    },

    /** Get aggregated total balance */
    getTotal(baseCurrency = 'GHS') {
        return request(`/wallets/total?base=${baseCurrency}`);
    },

    /** Get exchange rates */
    getExchangeRates() {
        return request('/wallets/exchange-rates', { auth: false });
    },
};

// ─── TRANSACTIONS ──────────────────────────────────────

export const transactions = {
    /** Send P2P transfer */
    sendP2P({ receiverUsername, receiverPhone, receiverUserId, amount, currency, description, idempotencyKey }) {
        return request('/transactions/p2p', {
            method: 'POST',
            body: {
                receiverUsername,
                receiverPhone,
                receiverUserId,
                amount: parseFloat(amount),
                currency,
                description,
                idempotencyKey,
            },
        });
    },

    /** Get transaction history */
    getHistory({ page = 1, limit = 20, type, currency } = {}) {
        const params = new URLSearchParams({ page, limit });
        if (type) params.set('type', type);
        if (currency) params.set('currency', currency);
        return request(`/transactions/history?${params}`);
    },

    /** Get single transaction by reference */
    getByReference(reference) {
        return request(`/transactions/${reference}`);
    },
};

// ─── PAYMENTS ──────────────────────────────────────────

export const payments = {
    /** Cash In (Mobile Money → Wallet) */
    cashIn({ phone, amount, currency, network }) {
        return request('/payments/cash-in', {
            method: 'POST',
            body: { phone, amount: parseFloat(amount), currency, network },
        });
    },

    /** Cash Out (Wallet → Mobile Money) */
    cashOut({ phone, amount, currency, network }) {
        return request('/payments/cash-out', {
            method: 'POST',
            body: { phone, amount: parseFloat(amount), currency, network },
        });
    },

    /** Verify a payment by reference */
    verify(reference) {
        return request(`/payments/verify/${reference}`);
    },
};

// ─── USERS (lookup) ────────────────────────────────────

export const users = {
    /** Search for a user by username or phone */
    lookup(query) {
        return request(`/auth/lookup?q=${encodeURIComponent(query)}`, { auth: true });
    },
};

// ─── HEALTH CHECK ──────────────────────────────────────

export async function checkHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`);
        return res.ok;
    } catch {
        return false;
    }
}

export default { auth, wallets, transactions, payments, users, checkHealth };
