# ClinoCash — Full Functioning Prototype Implementation Plan

## Current State
- **Backend**: Fully structured Express + Prisma + TypeScript API with auth, wallet, transaction, and payment modules
- **Frontend**: Polished Vite + React UI with mock data (MOCK_USER, MOCK_WALLETS, MOCK_TRANSACTIONS, etc.)
- **Gap**: Frontend uses hardcoded mock data — not connected to the backend API

## Phase 1: API Service Layer (Frontend)
Create `web/src/api.js` to centralize all API calls to the backend.

## Phase 2: Auth Flow (Login/Register)
Replace PIN lock screen mock with real auth:
- Registration flow with OTP
- Login with phone + PIN
- JWT token storage
- Auto-redirect if no token

## Phase 3: Real Wallet Data
- Fetch wallets from backend on login
- Display real balances
- Create wallets for new currencies

## Phase 4: Real Transactions
- Wire Send Money modal to POST /api/transactions/p2p
- Resolve recipients by username or phone
- Fetch real transaction history

## Phase 5: Backend Enhancements
- Add username/phone lookup endpoint for recipients
- Add seed data script for demo/testing
- Fix P2P route to resolve by username/phone
