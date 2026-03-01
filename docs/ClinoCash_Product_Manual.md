<![CDATA[# ClinoCash — Product & User Manual

**Version 1.0 | February 2026**
**Prepared for: Commercial Department — Bank Partnership Pitch**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Target Market & Value Proposition](#3-target-market--value-proposition)
4. [Platform Architecture](#4-platform-architecture)
5. [User-Facing Features (Mobile App)](#5-user-facing-features-mobile-app)
   - 5.1 [Onboarding & Registration](#51-onboarding--registration)
   - 5.2 [Authentication & Security](#52-authentication--security)
   - 5.3 [Home Dashboard](#53-home-dashboard)
   - 5.4 [Multi-Currency Wallets](#54-multi-currency-wallets)
   - 5.5 [P2P Transfers (Send Money)](#55-p2p-transfers-send-money)
   - 5.6 [Request Money](#56-request-money)
   - 5.7 [Bill Payments](#57-bill-payments)
   - 5.8 [Savings Goals](#58-savings-goals)
   - 5.9 [QR Code & Barcode Scanning](#59-qr-code--barcode-scanning)
   - 5.10 [Virtual Cards & NFC Tap-to-Pay](#510-virtual-cards--nfc-tap-to-pay)
   - 5.11 [Transaction History & Activity](#511-transaction-history--activity)
   - 5.12 [Agent Locator (Cash-In / Cash-Out)](#512-agent-locator-cash-in--cash-out)
   - 5.13 [Notifications](#513-notifications)
   - 5.14 [User Profile & Settings](#514-user-profile--settings)
6. [Backend Services & Architecture](#6-backend-services--architecture)
   - 6.1 [API Overview](#61-api-overview)
   - 6.2 [Authentication System](#62-authentication-system)
   - 6.3 [Wallet Management](#63-wallet-management)
   - 6.4 [Transaction Engine](#64-transaction-engine)
   - 6.5 [Payment Gateway Integrations](#65-payment-gateway-integrations)
   - 6.6 [Exchange Rate Engine](#66-exchange-rate-engine)
   - 6.7 [Ledger & Double-Entry Bookkeeping](#67-ledger--double-entry-bookkeeping)
7. [KYC & Compliance Framework](#7-kyc--compliance-framework)
8. [Regulatory Integration — Bank of Ghana (BoG)](#8-regulatory-integration--bank-of-ghana-bog)
9. [Localization & Accessibility](#9-localization--accessibility)
10. [Progressive Web App (PWA)](#10-progressive-web-app-pwa)
11. [Security Architecture](#11-security-architecture)
12. [Fee Structure](#12-fee-structure)
13. [Data Model](#13-data-model)
14. [Deployment & Infrastructure](#14-deployment--infrastructure)
15. [White-Label & SaaS Capabilities](#15-white-label--saas-capabilities)
16. [Appendix](#16-appendix)

---

## 1. Executive Summary

**ClinoCash** is a modern, full-stack digital payment platform purpose-built for **West African financial institutions**, specifically targeting the **Ghana–Togo economic corridor**. It provides a complete P2P payment, mobile money, bill payment, cross-border remittance, and savings solution that is **ready for bank white-labeling**.

### Key Differentiators

| Feature | ClinoCash |
|---------|-----------|
| **Multi-Currency Support** | GHS (Ghanaian Cedi), XOF (CFA Franc), USD (US Dollar) |
| **Cross-Border Transfers** | Ghana ↔ Togo real-time remittances with live exchange rates |
| **Regulatory Compliance** | Pre-integrated with Bank of Ghana Emtech Sandbox (v2.0) |
| **Multi-Language** | English, French, Ewe, Twi, Hausa — covering 90%+ of Ghana/Togo populations |
| **Double-Entry Bookkeeping** | Bank-grade ledger with full audit trail |
| **Payment Gateways** | Paystack, Flutterwave, Hubtel (Mobile Money) pre-integrated |
| **White-Label Ready** | SaaS model — deployable under any bank's brand in weeks |
| **PWA** | Progressive Web App — works on any device, installable, offline-capable |

---

## 2. Product Overview

ClinoCash is delivered as a **Software-as-a-Service (SaaS)** platform consisting of:

1. **Mobile-First Web Application** — A responsive Progressive Web App (PWA) built with React + Vite, optimized for mobile devices but functional on desktop. Glassmorphism design language with dark mode by default.

2. **Backend API Server** — A RESTful API built with Node.js, Express, TypeScript, and Prisma ORM, backed by PostgreSQL. Implements double-entry bookkeeping, atomic transactions, and comprehensive audit logging.

3. **Regulatory Adapter** — Direct integration with the Bank of Ghana's Emtech regulatory sandbox, automatically reporting remittance transactions and lifecycle events to BoG for compliance oversight.

4. **Payment Gateway Layer** — Modular adapter architecture supporting Paystack, Flutterwave, and Hubtel for mobile money cash-in/cash-out, bank transfers, and card payments.

---

## 3. Target Market & Value Proposition

### Primary Markets

- **Ghana** — 33+ million people, 60%+ mobile money penetration
- **Togo** — 8+ million people, growing mobile money adoption with CFA Franc (XOF)
- **Ghana–Togo Corridor** — Millions of cross-border transactions annually between family, business, and trade

### Value Proposition for Banks

| Bank Need | ClinoCash Solution |
|-----------|-------------------|
| Expand mobile banking reach | Turnkey PWA requiring zero app store approval |
| Regulatory compliance burden | BoG sandbox integration built-in |
| Cross-border capabilities | GHS ↔ XOF real-time remittances |
| Agent network management | Built-in agent locator with GPS mapping |
| Financial inclusion | Works on basic smartphones, 5 local languages |
| Speed to market | White-label deploy in 2–4 weeks |
| Cost reduction | Eliminate custom mobile app development |

### Target Users

- **Unbanked & underbanked** populations in Ghana and Togo
- **Migrants & diaspora** sending remittances between Ghana and Togo
- **SMEs & merchants** needing digital payment acceptance
- **Students** at universities across both countries
- **Market traders** in Accra, Kumasi, and Lomé markets

---

## 4. Platform Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    FRONTEND (PWA)                               │
│                                                                 │
│  React + Vite │ Glassmorphism UI │ PWA + Service Worker         │
│  5 Languages  │ Dark/Light Theme │ Offline Capable              │
│                                                                 │
│  Pages: Home │ Activity │ Scan │ Cards │ Profile                │
│  Modals: Send Money │ Request Money │ Pay Bills │ Savings       │
│          Agent Locator │ Transaction Detail │ Notifications     │
└───────────────────────────┬────────────────────────────────────┘
                            │ HTTPS / JWT Bearer Auth
┌───────────────────────────▼────────────────────────────────────┐
│                    BACKEND API (Express + TypeScript)            │
│                                                                 │
│  /api/auth         — Register, Login, OTP, Profile, Lookup      │
│  /api/wallets      — Create, Balance, Exchange Rates            │
│  /api/transactions — P2P Transfer, History, Detail              │
│  /api/payments     — Cash In, Cash Out, Verify                  │
│  /api/regulatory   — BoG Health, Status, Events                 │
│                                                                 │
│  Middleware: Rate Limiting │ Helmet │ CORS │ JWT Auth            │
└──────┬──────────┬──────────┬──────────┬────────────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
  ┌─────────┐ ┌────────┐ ┌────────┐ ┌─────────────────────┐
  │PostgreSQL│ │Paystack│ │Flutter-│ │ Bank of Ghana        │
  │ + Prisma │ │  API   │ │ wave   │ │ Emtech Sandbox v2.0  │
  │          │ │        │ │  API   │ │ POST /compliance/v2/ │
  │ Double-  │ │ Cards, │ │ MoMo,  │ │   remittances        │
  │ Entry    │ │ MoMo   │ │ Cards  │ │   remittances/events │
  │ Ledger   │ └────────┘ └────────┘ └─────────────────────┘
  └──────────┘
       │
  ┌────▼────────────────────────────────┐
  │ Hubtel API — Ghana Mobile Money     │
  │ MTN, Vodafone, AirtelTigo           │
  └─────────────────────────────────────┘
```

---

## 5. User-Facing Features (Mobile App)

### 5.1 Onboarding & Registration

**Purpose:** Guide new users through account creation with minimal friction.

#### New User Onboarding Walkthrough

When a user opens ClinoCash for the first time, they are presented with a **3-slide onboarding walkthrough**:

| Slide | Title | Description |
|-------|-------|-------------|
| 1 | **Send & Receive Instantly** | Send money to anyone in Ghana or Togo in seconds |
| 2 | **Multi-Currency Wallets** | Hold GHS, XOF, and USD — convert anytime |
| 3 | **Pay Bills & More** | Electricity, water, airtime, school fees — all in one app |

Users can skip the walkthrough or progress through each slide. The walkthrough only appears once (stored in `localStorage`).

#### Registration Flow

1. User enters their **phone number** (Ghana +233 or Togo +228)
2. Toggle between **Login** and **Register** modes
3. For registration, user provides:
   - Phone number
   - Username (unique, e.g., `@kwame.a`)
   - Full name (display name)
   - 4-digit PIN
   - Preferred locale
4. Backend creates user account + wallets (GHS, XOF, USD)
5. JWT token issued → user is logged in
6. Live dashboard loads with wallet balances

#### Backend Connectivity Indicator

The login screen shows a real-time **connectivity indicator**:
- 🟢 **Connected** — Backend API is reachable
- 🔴 **Offline** — Falls back to local PIN + mock data mode

---

### 5.2 Authentication & Security

#### Login Methods

| Method | Description |
|--------|-------------|
| **PIN Login** | 4-digit numeric PIN entry with on-screen keypad |
| **Phone + PIN** | Phone number + PIN when backend is available |
| **Biometric** | Fingerprint/Face ID prompt (device-dependent) |
| **OTP Verification** | SMS one-time password for sensitive operations |

#### Security Features

- **Auto-lock** — App locks on background / inactivity
- **Failed PIN attempts tracker** — Lockout after 3 failed attempts
- **JWT expiration listener** — Auto-logout on token expiry
- **Session cleanup** — Full state clear on logout
- **PIN animation feedback** — Shake animation on wrong PIN, success animation on correct PIN

#### PIN Lock Screen

The lock screen features:
- ClinoCash logo with glow animation
- Time-based greeting (Good morning/afternoon/evening)
- Date display
- 4-dot PIN indicator with fill animation
- Numeric keypad with haptic feedback
- Biometric authentication button
- "Forgot PIN?" recovery link

---

### 5.3 Home Dashboard

The home dashboard is the primary screen after login. It displays:

#### Header Bar
- **User avatar** — Initials-based avatar with gradient background
- **Greeting** — Personalized time-based greeting ("Good morning, Kwame")
- **Notification bell** — With unread count badge
- **Loading indicator** — Pulsing dot when fetching live data

#### Balance Card
- **Hero balance display** — Large, animated counter showing total balance
- **Currency selector pills** — Toggle between GHS, XOF, USD views
- **Eye toggle** — Show/hide balance for privacy (replaces digits with •••)
- **Monthly trend indicator** — Shows +X.X% or -X.X% vs previous month
- **Glassmorphism background** — Gradient with floating animation orbs

#### Quick Actions Grid
- **Send** — Opens P2P transfer modal
- **Receive** — Opens request money modal
- **Top Up** — Quick wallet funding
- **Bills** — Opens bill payment page
- **Savings** — Opens savings goals
- **Find Agent** — Opens agent locator map

Each action button features:
- Animated icon with color-coded background
- Carousel auto-rotation with progress dots
- Hover lift animation

#### Recent Transactions
- **Grouped by date** — "Today", "Yesterday", "This Week", etc.
- **Transaction type icons** — Color-coded by type (sent, received, bills, etc.)
- **Status badges** — COMPLETED (green), PENDING (yellow), FAILED (red)
- **Amount display** — Color-coded (green for received, red for sent)
- **Tap to expand** — Opens full transaction detail modal

#### Promotional Banner
- **Referral promotion** — "Invite Friends, Earn Rewards"
- Actionable CTA with arrow icon

---

### 5.4 Multi-Currency Wallets

ClinoCash supports **three currencies** in the same account:

| Currency | Symbol | Market |
|----------|--------|--------|
| **GHS** | GH₵ | Ghanaian Cedi — primary Ghana currency |
| **XOF** | CFA | CFA Franc — Togo / West African Monetary Union |
| **USD** | $ | US Dollar — international / diaspora |

#### Wallet Features

- **Automatic wallet creation** — GHS, XOF, and USD wallets created at registration
- **Currency switching** — Tap wallet pills on the balance card to view each currency
- **Real-time exchange rates** — Bidirectional rates for all 6 currency pairs:
  ```
  GHS → USD, GHS → XOF
  USD → GHS, USD → XOF
  XOF → GHS, XOF → USD
  ```
- **Balance precision** — 4 decimal places (Decimal 19,4) for financial accuracy
- **Wallet status** — ACTIVE, FROZEN, CLOSED states
- **Optimistic locking** — Wallet version column prevents concurrent balance corruption

#### Currency Formatting

| Currency | Format | Example |
|----------|--------|---------|
| GHS | `GH₵ 12,450.75` | Ghanaian Cedi |
| XOF | `CFA 285,000` | No decimals (CFA standard) |
| USD | `$342.50` | US Dollar |

Formatting is locale-aware — French users see `12 450,75 GH₵`.

---

### 5.5 P2P Transfers (Send Money)

The **Send Money** modal is the core transaction feature.

#### Flow

1. **Recipient Search** — Type username, phone number, or name
   - Real-time lookup with 500ms debounce
   - Resolved user displays: avatar, display name, username, green checkmark ✓
   - Supports: `@username`, `+233XXXXXXXXX`, or display name fuzzy search
2. **Amount Entry** — Numeric input with currency selector
3. **Description** — Optional memo/note
4. **Fee Preview** — Shows calculated fee + total debit
5. **Confirm & Send** — Sends the transfer via API
6. **Success/Error Feedback** — Animated confirmation or error message

#### Technical Details

- **Idempotency** — UUID-based key prevents double-sending
- **Atomic transactions** — PostgreSQL SERIALIZABLE isolation
- **Anti-double-spending** — Balance check + optimistic locking inside the transaction
- **Fee calculation** — 0.5% for P2P transfers (configurable)
- **Real-time recipient validation** — Backend lookup endpoint resolves username/phone to userId

#### Backend Resolution Logic

When sending money, the recipient can be specified by:
1. `receiverUsername` — Exact username match
2. `receiverPhone` — Exact phone number match
3. `receiverUserId` — Direct user ID (from lookup)

The backend resolves the recipient, validates the sender's balance, calculates fees, and executes the atomic transfer.

---

### 5.6 Request Money

Users can request money from other ClinoCash users.

#### Features

- **Request form** — Specify amount, currency, and optional message
- **Payment link generation** — Generates a shareable payment link
- **Copy & Share** — Copy link to clipboard, share via native share API
- **Request tracking** — Status tracking (PENDING, PAID, DECLINED, EXPIRED, CANCELLED)
- **Push notification** — Notify the payer of the request

#### Payment Request Schema

| Field | Description |
|-------|-------------|
| Requester | User creating the request |
| Payer | Target user (or phone number for non-users) |
| Amount | Requested amount |
| Currency | GHS, XOF, or USD |
| Message | Optional note |
| Expiry | Auto-expires after set period |

---

### 5.7 Bill Payments

ClinoCash supports bill payments across **8 categories** with **28+ providers** covering both Ghana and Togo:

#### Bill Categories

| Category | Icon | Providers |
|----------|------|-----------|
| **Electricity** | ⚡ | ECG (Electricity Co. of Ghana), GRIDCo, CEET (Togo), NEDCo |
| **Water** | 💧 | Ghana Water Company, TdE (Togolaise des Eaux) |
| **Internet** | 🌐 | Vodafone Broadband, MTN Fibre, Busy Internet |
| **TV / Cable** | 📺 | DStv, GOtv, StarTimes |
| **Airtime & Data** | 📱 | MTN Ghana, Vodafone Ghana, AirtelTigo, Moov Africa (Togo) |
| **Education** | 🎓 | University of Ghana, KNUST, Université de Lomé |
| **Health** | ❤️ | NHIS (National Health Insurance), Korle-Bu Hospital |
| **Government** | 🏛️ | GRA (Ghana Revenue Authority), DVLA Ghana, OTR (Togo Revenue) |

#### Bill Payment Flow

1. **Select Category** — Browse or search bill categories
2. **Select Provider** — Choose from the category's providers
3. **Enter Account Number** — Meter number, account number, or ID
4. **Enter Amount** — Payment amount
5. **Review & Confirm** — Summary screen with amount + provider + fee
6. **Payment Processing** — Animated processing indicator
7. **Success Receipt** — Confirmation with reference number

---

### 5.8 Savings Goals

Users can create and track personal savings goals.

#### Features

- **Create Goal** — Name, emoji icon, target amount, currency, color theme
- **Progress Tracking** — Visual progress bar with percentage
- **Deposit to Goal** — Quick deposit from main wallet to savings goal
- **Goal Templates**:

| Goal | Emoji | Target | Progress |
|------|-------|--------|----------|
| School Fees | 🎓 | GH₵ 5,000 | 64% |
| Emergency Fund | 🏥 | GH₵ 10,000 | 42% |
| Business Capital | 💼 | GH₵ 25,000 | 8% |

---

### 5.9 QR Code & Barcode Scanning

The **Scan** page (center tab in the bottom navigation) offers two scanning modes:

#### QR Code Mode
- **Camera scanner** — Uses device camera to scan QR codes using html5-qrcode library
- **Pay by QR** — Scan a merchant/user QR code to initiate a payment
- **Receive by QR** — Display your personal QR code for others to scan
- **Show My Code tab** — Generates and displays your payment QR code

#### Barcode Mode
- **Barcode scanning** — Scan barcodes for bill payments, product lookup
- **Multi-format support** — Supports common barcode formats

#### UX Details

- Camera permissions request on first use
- Flash/torch toggle button
- Tab switching between "Scan QR" and "My Code"
- Full-screen camera viewfinder with scan region overlay
- Scanner starts/stops properly on tab switch (prevents camera conflicts)

---

### 5.10 Virtual Cards & NFC Tap-to-Pay

The **Cards** page showcases virtual card and contactless payment features.

#### Virtual Card

- **Card display** — Realistic virtual card design with:
  - ClinoCash branding and logo
  - Masked card number (•••• •••• •••• 4821)
  - Cardholder name (user's display name, uppercase)
  - Expiration date
  - CVV (masked as •••)
  - EMV chip icon
- **Card actions** — View full card details, freeze/unfreeze, set limits

#### NFC Tap-to-Pay

- **Animated NFC waves** — Visual radiating wave animation
- **Phone proximity indicator** — Animated phone icon
- **Status display** — "Ready to Pay" with pulsing green NFC indicator
- **Payment amount entry** — Set amount before tapping

#### Future Virtual Card Features (Promotional Banner)
- "Get Your Virtual Card" CTA
- Use for online payments worldwide
- Virtual Visa/Mastercard issuance

---

### 5.11 Transaction History & Activity

The **Activity** page provides a comprehensive transaction history.

#### Features

- **Searchable list** — Search by name, reference, or amount
- **Date-grouped display** — "Today", "Yesterday", "This Week", "Earlier"
- **Transaction type icons** — Color-coded indicators:
  - 🟢 **Received** — Money received
  - 🔴 **Sent** — Money sent
  - 🟣 **Top Up** — Cash-in / wallet funding
  - 🟡 **Pending** — Transaction in progress
- **Mini Statement** — Compact summary view with income/expense totals

#### Transaction Detail Modal

Tapping a transaction opens a detailed modal with:
- Transaction type and status
- Full amount with currency
- Fee breakdown
- Sender/Receiver details (name + username)
- Reference number
- Date and time
- Description/memo
- **Share Receipt** — Share transaction receipt
- **Download Receipt** — Download as PDF
- **Report Issue** — Flag a problem

---

### 5.12 Agent Locator (Cash-In / Cash-Out)

ClinoCash includes a **GPS-based agent locator** for finding nearby physical cash-in/cash-out points.

#### Features

- **Interactive map** — Leaflet.js-based map with agent pins
- **Agent directory** — List of 10+ agents across Accra and Lomé:
  
  **Ghana (Accra)**:
  | Agent | Location | Type | Hours |
  |-------|----------|------|-------|
  | ClinoCash Agent — Osu Oxford St | Osu | Cash In/Out | 7am–9pm |
  | ClinoCash Agent — Madina Market | Madina | Cash In/Out | 6am–8pm |
  | ClinoCash Agent — Kaneshie Market | Kaneshie | Cash In/Out | 6am–7pm |
  | ClinoCash Agent — Tema Station | Tema | Cash In/Out | 7am–9pm |
  | ClinoCash Agent — East Legon | East Legon | Cash In/Out | 8am–8pm |
  
  **Togo (Lomé)**:
  | Agent | Location | Type | Hours |
  |-------|----------|------|-------|
  | ClinoCash Agent — Grand Marché | Lomé Center | Cash In/Out | 7h–20h |
  | ClinoCash Agent — Tokoin | Tokoin | Cash In/Out | 7h–19h |
  | ClinoCash Agent — Bè | Bè | Cash In/Out | 7h–18h |
  | ClinoCash Agent — Agoè | Agoè | Cash In/Out | 8h–19h |
  | Université de Lomé Agent | UL Campus | Cash In/Out | 8h–19h |

- **Agent details** — Phone number, hours of operation, type of service
- **Navigation** — "Get Directions" button linking to Google Maps/Waze
- **Filter by proximity** — Sorted by distance from user's GPS position

---

### 5.13 Notifications

Real-time notification system with in-app notification panel.

#### Notification Types

| Type | Icon | Example |
|------|------|---------|
| **Transfer Received** | 💸 | "You received GH₵ 500 from @ama.s" |
| **Transfer Sent** | ✉️ | "GH₵ 200 sent to @kofi.m" |
| **Payment Request** | 🔔 | "Yaw Boateng requested GH₵ 75" |
| **Bill Payment** | 📋 | "ECG payment of GH₵ 150 confirmed" |
| **Security Alert** | 🔒 | "New login from Chrome on Windows" |
| **Promo** | 🎁 | "Invite a friend, earn GH₵ 5!" |

#### Features

- **Notification bell** in header with unread count badge
- **Slide-in panel** — Full notification list
- **Mark all as read** button
- **Individual timestamp** — Relative time ("2h ago", "Yesterday")

---

### 5.14 User Profile & Settings

The **Profile** page provides account management and preferences.

#### Profile Card
- **User avatar** — Large initials-based avatar with gradient
- **Display name**
- **Username** — @username handle
- **KYC badge** — Verified ✓ or Pending ⏳

#### Settings Menu

| Setting | Description |
|---------|-------------|
| **Personal Info** | Edit name, email, avatar |
| **Security** | Change PIN, biometric settings, 2FA |
| **Language** | Switch between EN, FR, EE, TW, HA |
| **Theme** | Toggle Dark / Light mode |
| **Notifications** | Push notification preferences |
| **Linked Accounts** | Bank accounts, mobile money numbers |
| **Help & Support** | FAQ, chat support, report issue |
| **Logout** | Clear session and return to login screen |

#### Language Toggle
- Inline locale switcher: EN | FR (additional languages via settings)
- Instant locale change — all UI text updates without reload

#### Theme Toggle
- **Dark Mode** (default) — Deep navy palette with cyan accents
- **Light Mode** — Clean light palette
- Persisted to `localStorage` across sessions

---

## 6. Backend Services & Architecture

### 6.1 API Overview

The backend exposes a RESTful API at `http://localhost:4000/api` with the following route groups:

| Route Group | Prefix | Description |
|-------------|--------|-------------|
| **Auth** | `/api/auth` | Registration, Login, OTP, Profile, User Lookup |
| **Wallets** | `/api/wallets` | Wallet CRUD, Balances, Exchange Rates |
| **Transactions** | `/api/transactions` | P2P Transfers, History, Details |
| **Payments** | `/api/payments` | Cash In, Cash Out, Verification |
| **Regulatory** | `/api/regulatory` | BoG Emtech Health, Status, Events |
| **Health** | `/api/health` | Server health check |

### 6.2 Authentication System

#### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | No | Create new account |
| `POST` | `/api/auth/login` | No | Login with phone + PIN |
| `POST` | `/api/auth/send-otp` | No | Send OTP to phone |
| `POST` | `/api/auth/verify-otp` | No | Verify OTP code |
| `GET` | `/api/auth/profile` | Yes | Get current user profile |
| `GET` | `/api/auth/lookup?q=` | Yes | Search users by username/phone/name |

#### Registration Response

```json
{
  "success": true,
  "token": "eyJhbG...",
  "user": {
    "id": "uuid",
    "phone": "+233241234567",
    "username": "kwame.a",
    "displayName": "Kwame Asante",
    "kycTier": "TIER_0",
    "locale": "en"
  }
}
```

#### User Lookup

The lookup endpoint supports fuzzy search:
- **Exact match** on `username` or `phone`
- **Fuzzy match** on `displayName` using SQL `ILIKE`
- Returns matching users with `id`, `username`, `displayName`, `phone` (masked)

### 6.3 Wallet Management

#### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/wallets` | Yes | List user's wallets |
| `POST` | `/api/wallets` | Yes | Create new wallet |
| `GET` | `/api/wallets/total?base=GHS` | Yes | Aggregated total balance |
| `GET` | `/api/wallets/exchange-rates` | No | Current exchange rates |

#### Wallet Properties

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique wallet identifier |
| `userId` | UUID | Owner |
| `currency` | Enum | GHS, XOF, USD |
| `balance` | Decimal(19,4) | Current balance |
| `status` | Enum | ACTIVE, FROZEN, CLOSED |
| `version` | Int | Optimistic locking counter |

### 6.4 Transaction Engine

#### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/transactions/p2p` | Yes | Send P2P transfer |
| `GET` | `/api/transactions/history` | Yes | Transaction history (paginated) |
| `GET` | `/api/transactions/:reference` | Yes | Single transaction detail |

#### Transaction Types

| Type | Description | Fee |
|------|-------------|-----|
| `P2P_TRANSFER` | Person-to-person transfer | 0.5% |
| `CASH_IN` | Mobile Money → ClinoCash Wallet | Free |
| `CASH_OUT` | ClinoCash Wallet → Mobile Money | 1% |
| `BANK_TO_WALLET` | Bank transfer to wallet | 0.5% |
| `WALLET_TO_BANK` | Wallet to bank withdrawal | 1.5% |
| `CURRENCY_EXCHANGE` | Currency conversion | 2% |
| `PAYMENT_REQUEST` | Payment from a request link | 0.5% |
| `FEE` | System fee transaction | — |
| `REVERSAL` | Transaction reversal | — |

#### Atomic Transfer Flow

```
1. Validate inputs (amount > 0, sender ≠ receiver)
2. Check idempotency key (prevent duplicates)
3. Calculate fee (amount × feeRate)
4. BEGIN SERIALIZABLE TRANSACTION
   a. Lock & fetch sender wallet
   b. Lock & fetch receiver wallet
   c. Check sender balance ≥ amount + fee
   d. Optimistic version check
   e. Debit sender wallet
   f. Credit receiver wallet
   g. Create Transaction record
   h. Create DEBIT LedgerEntry (sender)
   i. Create CREDIT LedgerEntry (receiver)
   j. Create FEE LedgerEntry (if fee > 0)
   k. Create AuditLog entry
5. COMMIT TRANSACTION
6. If Emtech configured → async BoG reporting
7. Return success + transaction
```

### 6.5 Payment Gateway Integrations

ClinoCash includes **three pre-built payment gateway adapters**:

#### Paystack Adapter (`paystack.adapter.ts`)
- **Initialize Payment** — Create a payment session
- **Verify Payment** — Confirm payment completion
- **Mobile Money** — MTN, Vodafone, AirtelTigo
- **Card Payments** — Visa, Mastercard
- **Bank Transfer** — Direct bank debit

#### Flutterwave Adapter (`flutterwave.adapter.ts`)
- **Mobile Money** — Ghana, Togo, and other West African markets
- **Card Payments** — International card processing
- **Bank Transfer** — Multi-bank support
- **Disbursements** — Bulk payouts

#### Hubtel Adapter (via config)
- **Ghana Mobile Money** — MTN, Vodafone, AirtelTigo
- **Direct carrier integration**

#### Payment Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/payments/cash-in` | Yes | Mobile Money → Wallet |
| `POST` | `/api/payments/cash-out` | Yes | Wallet → Mobile Money |
| `GET` | `/api/payments/verify/:ref` | Yes | Verify payment status |

### 6.6 Exchange Rate Engine

Built-in exchange rate management supporting all currency pairs:

| Pair | Direction | Example Rate |
|------|-----------|-------------|
| GHS → USD | 0.063 | GH₵ 100 = $6.30 |
| GHS → XOF | 38.50 | GH₵ 100 = CFA 3,850 |
| USD → GHS | 15.85 | $100 = GH₵ 1,585 |
| USD → XOF | 610.50 | $100 = CFA 61,050 |
| XOF → GHS | 0.026 | CFA 10,000 = GH₵ 260 |
| XOF → USD | 0.00164 | CFA 10,000 = $16.40 |

#### Exchange Rate Schema

| Field | Type | Description |
|-------|------|-------------|
| `fromCurrency` | Currency | Source currency |
| `toCurrency` | Currency | Target currency |
| `rate` | Decimal(19,8) | Conversion rate |
| `source` | String | "manual", "api", "provider" |

---

### 6.7 Ledger & Double-Entry Bookkeeping

ClinoCash implements **bank-grade double-entry bookkeeping**:

#### Principles

Every financial movement creates at least **two** ledger entries:
- A **DEBIT** entry on the source wallet (money leaves)
- A **CREDIT** entry on the destination wallet (money arrives)
- An optional **FEE** entry on the system fee wallet

#### Ledger Entry Schema

| Field | Type | Description |
|-------|------|-------------|
| `transactionId` | UUID | Parent transaction |
| `walletId` | UUID | Affected wallet |
| `entryType` | DEBIT / CREDIT | Direction |
| `amount` | Decimal(19,4) | Entry amount |
| `balanceBefore` | Decimal(19,4) | Wallet balance before |
| `balanceAfter` | Decimal(19,4) | Wallet balance after |

This design ensures:
- **Complete auditability** — Every GH₵ is traceable
- **Balance integrity** — `SUM(CREDITS) - SUM(DEBITS)` always equals wallet balance
- **Regulatory compliance** — Full audit trail for BoG reporting
- **Reconciliation** — Automated reconciliation between wallets and ledger

---

## 7. KYC & Compliance Framework

### Tiered KYC System

| Tier | Requirements | Daily Limit | Single TX Limit |
|------|-------------|-------------|-----------------|
| **TIER_0** | Phone number only | GH₵ 500 | GH₵ 100 |
| **TIER_1** | Phone + ID verified | GH₵ 5,000 | GH₵ 2,000 |
| **TIER_2** | Full KYC (address, selfie, ID) | GH₵ 50,000 | GH₵ 20,000 |

### KYC Fields Tracked

- Phone verification status
- National ID type and number (Ghana Card, Passport, Driver's License, Voter ID)
- KYC validation level (Minimum, Medium, Enhanced)
- KYC service provider
- Account region and country

### Emtech KYC Mapping

ClinoCash KYC tiers map to BoG Emtech KYC levels:

| ClinoCash | Emtech |
|-----------|--------|
| `TIER_0` | `MINIMUM` |
| `TIER_1` | `MEDIUM` |
| `TIER_2` | `ENHANCED` |

---

## 8. Regulatory Integration — Bank of Ghana (BoG)

### Emtech Regulatory Sandbox v2.0

ClinoCash is **pre-integrated** with the Bank of Ghana's regulatory sandbox powered by Emtech. This is a major competitive advantage for any bank licensing ClinoCash.

#### Integration Architecture

```
ClinoCash Transfer completes
       │
       ▼ (async, non-blocking)
┌──────────────────────────────────────────┐
│  EmtechAdapter (emtech.adapter.ts)        │
│                                           │
│  1. Authenticate (JWT)                    │
│     POST /finapp/api/v1/auth/token        │
│     { clientId, clientSecret }            │
│     → { accessToken, expiryMS }           │
│                                           │
│  2. Report Remittance                     │
│     POST /compliance/v2/remittances       │
│     Full Transfer payload with:           │
│     - origin (sender KYC + financials)    │
│     - destination (receiver KYC)          │
│     - fees, exchange rate, channel        │
│                                           │
│  3. Report Events                         │
│     POST /compliance/v2/remittances/events│
│     INITIATED → SUCCESS / FAILED          │
└──────────────┬───────────────────────────┘
               │
               ▼
   Bank of Ghana Regulatory Dashboard
```

#### Confirmed API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/finapp/api/v1/auth/token` | Get JWT access token |
| `POST` | `/compliance/v2/remittances` | Submit remittance report |
| `POST` | `/compliance/v2/remittances/events` | Submit transfer lifecycle event |

#### Transfer Payload (BoG Schema)

The remittance report includes:

**Transfer Metadata:**
- `transferId` — Unique reference
- `transferDatetime` — ISO8601 timestamp
- `transferChannel` — WEB, MOBILE_APP, MOBILE_USSD, IN_PERSON
- `transferDeviceId` — Device identifier
- `transferFee` + `transferFeeCurrency`
- `transferType` — WALLET, MOBILE_MONEY, DEPOSIT, etc.
- `fundingSource` — WALLET, MOBILE_MONEY, BANK, etc.
- Geolocation (latitude/longitude) — optional

**Origin (Sender):**
- `userId`, `accountId`, `amount`, `currency`
- `accountType` — MOBILE_MONEY, BANK, CASH, etc.
- `accountProvider` — Bank name or MoMo provider
- `accountCity`, `accountRegion` (ISO-3166-2), `accountCountry` (ISO-3166-1)
- KYC details: `userKYCType`, `userKYCLevel`, `userKYCStatus`, `userKYCService`

**Destination (Receiver):** Same structure as origin

#### Transfer Event Types

| Event | Description |
|-------|-------------|
| `INITIATED` | Transfer started |
| `SUCCESS` | Transfer completed |
| `FAILED` | Transfer failed |
| `REJECTED` | Transfer rejected by system/compliance |
| `RETURNED` | Funds returned to sender |
| `CHARGEBACK` | Chargeback initiated |
| `REVOKED` | Transfer revoked |

#### ClinoCash API Endpoints (for monitoring)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/regulatory/emtech/health` | Check BoG sandbox connectivity |
| `GET` | `/api/regulatory/emtech/status` | Check credentials configuration |
| `POST` | `/api/regulatory/emtech/events` | Submit a transfer event manually |

---

## 9. Localization & Accessibility

### Supported Languages

ClinoCash supports **5 languages** covering 90%+ of the Ghana/Togo population:

| Code | Language | Market |
|------|----------|--------|
| `en` | **English** | Ghana (official language) |
| `fr` | **French** | Togo (official language) |
| `ee` | **Ewe (Eʋegbe)** | Volta Region (Ghana) + Southern Togo |
| `tw` | **Twi (Akan)** | Ashanti, Greater Accra (Ghana) |
| `ha` | **Hausa** | Northern Ghana + West Africa trade |

### Localized Elements

Every user-facing string is translated, including:
- Navigation labels
- Button text and CTAs
- Form labels and placeholders
- Transaction types and statuses
- Error messages
- Greetings (time-based)
- Bill categories and provider names
- Profile settings labels
- Currency formatting (period vs comma, symbol placement)

### Time-Based Greetings

| Time Range | English | French | Twi | Ewe | Hausa |
|-----------|---------|--------|-----|-----|-------|
| 00:00–12:00 | Good morning | Bonjour | Maakye | Ŋdi | Ina kwana |
| 12:00–17:00 | Good afternoon | Bon après-midi | Maaha | Ŋdɔ | Barka da rana |
| 17:00–24:00 | Good evening | Bonsoir | Maadwo | Fiɛyi | Barka da yamma |

---

## 10. Progressive Web App (PWA)

ClinoCash is built as a **Progressive Web App** for maximum reach.

### PWA Features

| Feature | Status |
|---------|--------|
| **Installable** | ✅ Add to Home Screen prompt |
| **Offline capable** | ✅ Service Worker with cache-first strategy |
| **App-like UX** | ✅ Standalone display mode, no browser chrome |
| **Push Notifications** | ✅ Web Push API support |
| **Auto-update** | ✅ Service Worker lifecycle management |

### Web App Manifest

```json
{
  "name": "ClinoCash",
  "short_name": "ClinoCash",
  "description": "Send, receive, and manage your money",
  "theme_color": "#060E0A",
  "background_color": "#060E0A",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/",
  "scope": "/"
}
```

### Benefits for Bank Partners

- **No App Store approval** — Deploy instantly, bypass Apple/Google review cycles
- **Cross-platform** — Single codebase runs on iOS, Android, Windows, macOS
- **Smaller footprint** — ~200KB initial load vs 50MB+ for native apps
- **Instant updates** — Users always get the latest version
- **Low-end device support** — Works on feature phones with modern browsers

---

## 11. Security Architecture

### Application Security

| Layer | Implementation |
|-------|---------------|
| **Transport** | HTTPS/TLS enforcement |
| **Authentication** | JWT Bearer tokens with 7-day expiry |
| **PIN Storage** | AES-256 encrypted hash |
| **API Protection** | Helmet.js (HTTP headers), CORS, Rate Limiting |
| **Rate Limiting** | 100 req/15min (general), 10 req/15min (auth) |
| **Input Validation** | Zod schema validation on all endpoints |
| **SQL Injection** | Prisma ORM (parameterized queries) |
| **Request Size** | 10KB max body size |

### Transaction Security

| Mechanism | Description |
|-----------|-------------|
| **Idempotency Keys** | UUID-based keys prevent duplicate transactions |
| **Optimistic Locking** | Wallet `version` column prevents concurrent corruption |
| **SERIALIZABLE Isolation** | PostgreSQL highest isolation level for transfers |
| **Double-Entry Validation** | Ledger entries must always balance (DEBIT = CREDIT) |
| **Audit Logging** | Every action logged with IP, user agent, before/after state |

### Data Security

| Aspect | Implementation |
|--------|---------------|
| **Database** | PostgreSQL with encryption at rest |
| **PII Encryption** | AES-256-GCM for sensitive fields |
| **Biometric Keys** | Public key stored, private key on device |
| **OTP** | Hashed OTP codes, max 3 attempts, 5-minute expiry |
| **Session Management** | Token revocation on logout, auto-clear on 401 |

---

## 12. Fee Structure

### Current Fee Schedule

| Transaction Type | Fee Rate | Example (GH₵ 1,000) |
|-----------------|----------|---------------------|
| P2P Transfer | 0.5% | GH₵ 5.00 |
| Cash In (MoMo → Wallet) | Free | GH₵ 0.00 |
| Cash Out (Wallet → MoMo) | 1.0% | GH₵ 10.00 |
| Bank → Wallet | 0.5% | GH₵ 5.00 |
| Wallet → Bank | 1.5% | GH₵ 15.00 |
| Currency Exchange | 2.0% | GH₵ 20.00 |

### Fee Configuration

All fees are **configurable** via the backend config file. Banks can set custom fee schedules for their white-label deployment:

```typescript
fees: {
    P2P_TRANSFER: 0.005,       // 0.5%
    CASH_IN: 0,                 // Free
    CASH_OUT: 0.01,             // 1%
    BANK_TO_WALLET: 0.005,      // 0.5%
    WALLET_TO_BANK: 0.015,      // 1.5%
    CURRENCY_EXCHANGE: 0.02,    // 2%
}
```

---

## 13. Data Model

### Entity Relationship Summary

```
User (1) ──→ (N) Wallet
User (1) ──→ (N) Transaction (as sender)
User (1) ──→ (N) Transaction (as receiver)
User (1) ──→ (N) PaymentRequest (as requester)
User (1) ──→ (N) PaymentRequest (as payer)
User (1) ──→ (N) OtpCode
User (1) ──→ (N) AuditLog

Wallet (1) ──→ (N) LedgerEntry
Transaction (1) ──→ (N) LedgerEntry

ExchangeRate (standalone — currency pair rates)
```

### Database Tables

| Table | Description | Key Fields |
|-------|-------------|-----------|
| `users` | User accounts | phone, username, displayName, pinHash, kycTier |
| `wallets` | Currency wallets | userId, currency, balance, status, version |
| `transactions` | Transaction records (immutable) | reference, type, status, amount, fee, currency |
| `ledger_entries` | Double-entry ledger | transactionId, walletId, DEBIT/CREDIT, balanceBefore/After |
| `payment_requests` | Payment request links | requesterId, payerId, amount, status, expiresAt |
| `exchange_rates` | Currency pair rates | fromCurrency, toCurrency, rate, source |
| `otp_codes` | One-time passwords | phone, code (hashed), purpose, expiresAt, attempts |
| `audit_logs` | Immutable audit trail | userId, action, entity, entityId, details, ipAddress |

---

## 14. Deployment & Infrastructure

### Technology Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | React 18+ / Vite / Vanilla CSS |
| **Backend** | Node.js / Express / TypeScript |
| **Database** | PostgreSQL (via Prisma ORM) |
| **ORM** | Prisma (type-safe, migration-based) |
| **Auth** | JWT (jsonwebtoken) / bcryptjs |
| **Security** | Helmet / cors / express-rate-limit |
| **Validation** | Zod (runtime schema validation) |
| **PWA** | Service Worker / Web App Manifest |
| **Maps** | Leaflet.js (open-source, no API key needed) |
| **QR Scanner** | html5-qrcode |

### Deployment Options

| Option | Description |
|--------|-------------|
| **Vercel** | Frontend hosting (already configured with `vercel.json`) |
| **Railway / Render** | Backend + PostgreSQL hosting |
| **AWS** | ECS/EKS + RDS PostgreSQL for enterprise deployments |
| **Bank's Own Infrastructure** | On-premise deployment with Docker |

### Environment Configuration

All configuration is managed via environment variables (`.env`), making deployment customization straightforward:

- Database URL
- JWT secret and expiry
- Payment gateway credentials (Paystack, Flutterwave, Hubtel)
- Emtech/BoG sandbox credentials
- CORS origin and port

---

## 15. White-Label & SaaS Capabilities

### How ClinoCash Serves Banks

ClinoCash is designed from the ground up for **white-labeling**:

| Capability | Description |
|------------|-------------|
| **Branding** | Logo, colors, and naming are configurable via CSS variables and config |
| **Fee Schedule** | Fully configurable fee percentages per transaction type |
| **Currency Mix** | Add/remove supported currencies |
| **Language Pack** | Add new languages via i18n translation files |
| **Gateway Selection** | Choose which payment gateways to activate |
| **KYC Rules** | Configure tier limits and requirements |
| **Agent Network** | Define bank-specific agent locations |
| **Regulatory Config** | Per-deployment BoG sandbox or production credentials |

### SaaS Delivery Model

```
┌──────────────────────────────────────┐
│         ClinoCash SaaS Platform       │
│                                       │
│  ┌─────────────┐  ┌─────────────┐    │
│  │  Bank A      │  │  Bank B      │   │
│  │  (GhanaBank) │  │  (TogoFirst) │   │
│  │  GHS + XOF   │  │  XOF + GHS   │   │
│  │  EN + TW     │  │  FR + EE     │   │
│  │  Custom Fees │  │  Custom Fees │   │
│  │  Own Agents  │  │  Own Agents  │   │
│  │  Own Branding│  │  Own Branding│   │
│  └─────────────┘  └─────────────┘    │
│                                       │
│  Shared: Engine │ Ledger │ Compliance │
└──────────────────────────────────────┘
```

### Time-to-Market

| Phase | Timeline |
|-------|----------|
| **Branding & Configuration** | 1 week |
| **Gateway Integration** | 1 week |
| **Testing & QA** | 1 week |
| **Regulatory Sandbox** | 1 week |
| **Go Live** | **4 weeks total** |

---

## 16. Appendix

### A. API Rate Limits

| Endpoint Group | Rate Limit |
|---------------|-----------|
| General API | 100 requests per 15 minutes per IP |
| Authentication | 10 requests per 15 minutes per IP |

### B. Supported Mobile Money Networks

| Country | Network | Provider |
|---------|---------|----------|
| Ghana | MTN Mobile Money | MTN Ghana |
| Ghana | Vodafone Cash | Vodafone Ghana |
| Ghana | AirtelTigo Money | AirtelTigo |
| Togo | Moov Money | Moov Africa |
| Togo | T-Money | Togocel |

### C. ISO Standards Used

| Standard | Application |
|----------|-------------|
| ISO 4217 | Currency codes (GHS, XOF, USD) |
| ISO 3166-1 | Country codes (GH, TG, US) |
| ISO 3166-2 | Region codes (GH-AA, TG-M) |
| ISO 8601 | Date/time formatting |

### D. Design System

ClinoCash uses a comprehensive CSS design system with:

- **CSS Custom Properties** — 50+ design tokens for colors, spacing, typography
- **Glassmorphism** — Frosted glass effects with `backdrop-filter: blur()`
- **Micro-animations** — Smooth transitions, hover effects, loading states
- **Responsive** — Mobile-first, max-width 480px optimized
- **Safe Area** — iOS notch/gesture bar support via `env(safe-area-inset-*)`
- **Dark/Light Themes** — Full theme support via `[data-theme]` attribute

### E. Contact

For partnership inquiries, technical demos, or white-label licensing:

- **Platform:** ClinoCash by Noecramos
- **Repository:** Noecramos/ClinoCash
- **Regulatory Sandbox:** bog.gh.app.emtech.com

---

*This document is confidential and intended for authorized recipients only. © 2026 ClinoCash. All rights reserved.*
]]>
