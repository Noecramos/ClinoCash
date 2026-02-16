# ClinoCash — P2P Payment Application

> **Fast, secure peer-to-peer payments for Ghana & Togo**

## 🏗️ Architecture

```
ClinoCash/
├── backend/                    # Node.js + Express + TypeScript API
│   ├── prisma/
│   │   └── schema.prisma       # PostgreSQL schema (double-entry ledger)
│   ├── src/
│   │   ├── config/             # App configuration, database client
│   │   ├── middleware/         # JWT auth, KYC authorization
│   │   ├── modules/
│   │   │   ├── auth/           # OTP, registration, login, profile
│   │   │   ├── wallet/         # Multi-currency wallets, exchange rates
│   │   │   ├── transaction/    # P2P transfers (atomic), history
│   │   │   └── payment/        # Gateway adapters (Paystack, Flutterwave)
│   │   │       └── adapters/   # Provider-specific implementations
│   │   ├── utils/              # AES-256 encryption, currency formatting
│   │   └── server.ts           # Express entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── web/                        # Vite + React web dashboard
│   ├── src/
│   │   ├── i18n/               # EN/FR localization
│   │   ├── App.jsx             # Full app with all pages
│   │   ├── App.css             # Component styles
│   │   └── index.css           # Design system
│   ├── index.html
│   └── package.json
└── docs/
    └── README.md               # This file
```

## 🚀 Quick Start

### Web Dashboard (Frontend)
```bash
cd web
npm install
npm run dev
# Opens at http://localhost:5173
```

### Backend API
```bash
cd backend
npm install

# Set up your PostgreSQL database
cp .env.example .env
# Edit .env with your database URL

# Run database migrations
npx prisma migrate dev --name init
npx prisma generate

# Start the server
npm run dev
# API runs at http://localhost:4000
```

## 📊 Database Schema

### Core Tables
| Table | Purpose |
|-------|---------|
| `users` | User accounts with KYC tiers, PINs, biometric keys |
| `wallets` | Multi-currency balances (GHS, XOF, USD) with optimistic locking |
| `transactions` | Immutable transaction records (P2P, Cash In/Out, Bank transfers) |
| `ledger_entries` | Double-entry bookkeeping (every txn = DEBIT + CREDIT) |
| `payment_requests` | Social payment requests between users |
| `exchange_rates` | Currency conversion rates |
| `otp_codes` | Phone verification codes |
| `audit_logs` | Immutable security audit trail |

### Key Design Principles
- **Double-entry bookkeeping**: Every transfer creates 2 ledger entries
- **Immutable records**: Transactions are never updated, only reversed
- **Optimistic locking**: Wallet `version` column prevents concurrent modification
- **Decimal precision**: All amounts use `Decimal(19,4)` — never floating point
- **SERIALIZABLE isolation**: PostgreSQL transactions at highest isolation level

## 🔐 Security Features
- AES-256-GCM encryption for data at rest
- JWT authentication with configurable expiry
- KYC tier-based transaction limits
- Rate limiting (100 req/15min general, 10/15min for auth)
- PBKDF2 PIN hashing with timing-safe comparison
- Idempotency keys to prevent double-spending
- Helmet.js for HTTP security headers

## 💱 Supported Currencies
| Currency | Symbol | Region | Primary Gateway |
|----------|--------|--------|-----------------|
| GHS | GH₵ | Ghana | Paystack |
| XOF | FCFA | Togo/UEMOA | Flutterwave |
| USD | $ | International | Paystack |

## 📱 API Endpoints

### Auth
- `POST /api/auth/send-otp` — Send OTP to phone
- `POST /api/auth/verify-otp` — Verify OTP code
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login with PIN
- `GET /api/auth/profile` — Get user profile

### Wallets
- `POST /api/wallets` — Create wallet for a currency
- `GET /api/wallets` — Get all wallets
- `GET /api/wallets/total` — Get aggregated balance
- `GET /api/wallets/exchange-rates` — Get conversion rates

### Transactions
- `POST /api/transactions/p2p` — Send money (P2P)
- `GET /api/transactions/history` — Transaction history
- `GET /api/transactions/:reference` — Transaction detail

### Payments
- `POST /api/payments/cash-in` — Mobile Money deposit
- `POST /api/payments/cash-out` — Mobile Money withdrawal
- `GET /api/payments/verify/:reference` — Verify payment
- `POST /api/payments/webhook/paystack` — Paystack webhook
- `POST /api/payments/webhook/flutterwave` — Flutterwave webhook

## 🌍 Localization
The web dashboard supports English (EN) and French (FR) with locale-aware currency formatting:
- **English**: GH₵ 12,450.75
- **French**: 12 450,75 GH₵

Toggle language in Profile → Language

## 📄 License
MIT
