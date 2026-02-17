import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { t, getGreeting, formatCurrency, formatCurrencyParts } from './i18n';
import { Html5Qrcode } from 'html5-qrcode';

// ─── HAPTIC FEEDBACK ───────────────────────────────────

const haptic = (pattern = 10) => {
  try { navigator.vibrate?.(pattern); } catch (e) { /* silent */ }
};

const hapticClick = (callback) => (e) => {
  haptic(10);
  callback?.(e);
};

// ─── MOCK DATA ─────────────────────────────────────────

const MOCK_USER = {
  id: 'usr_001',
  displayName: 'Kwame Asante',
  username: 'kwame.a',
  phone: '+233241234567',
  kycTier: 'TIER_1',
  locale: 'en',
  avatarInitials: 'KA',
};

const MOCK_WALLETS = [
  { id: 'w1', currency: 'GHS', balance: 12450.75, status: 'ACTIVE' },
  { id: 'w2', currency: 'XOF', balance: 285000, status: 'ACTIVE' },
  { id: 'w3', currency: 'USD', balance: 342.50, status: 'ACTIVE' },
];

const MOCK_TRANSACTIONS = [
  {
    id: 'txn_1',
    type: 'P2P_TRANSFER',
    direction: 'received',
    name: 'Ama Serwah',
    username: '@ama.s',
    amount: 500.00,
    currency: 'GHS',
    status: 'COMPLETED',
    date: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    description: 'Lunch money 🍕',
  },
  {
    id: 'txn_2',
    type: 'P2P_TRANSFER',
    direction: 'sent',
    name: 'Kofi Mensah',
    username: '@kofi.m',
    amount: 150.00,
    currency: 'GHS',
    status: 'COMPLETED',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    description: 'Transport fare',
  },
  {
    id: 'txn_3',
    type: 'CASH_IN',
    direction: 'received',
    name: 'MTN MoMo Top Up',
    username: 'Mobile Money',
    amount: 2000.00,
    currency: 'GHS',
    status: 'COMPLETED',
    date: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    description: 'Cash In',
  },
  {
    id: 'txn_4',
    type: 'P2P_TRANSFER',
    direction: 'sent',
    name: 'Fatou Diallo',
    username: '@fatou.d',
    amount: 25000,
    currency: 'XOF',
    status: 'COMPLETED',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    description: 'Freelance payment',
  },
  {
    id: 'txn_5',
    type: 'PAYMENT_REQUEST',
    direction: 'received',
    name: 'Yaw Boateng',
    username: '@yaw.b',
    amount: 75.00,
    currency: 'GHS',
    status: 'PENDING',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    description: 'Payment request',
  },
  {
    id: 'txn_6',
    type: 'CASH_OUT',
    direction: 'sent',
    name: 'Bank Withdrawal',
    username: 'Ecobank Ghana',
    amount: 1000.00,
    currency: 'GHS',
    status: 'COMPLETED',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    description: 'Wallet to Bank',
  },
];

const EXCHANGE_RATES = {
  'GHS-USD': 0.063,
  'GHS-XOF': 38.50,
  'USD-GHS': 15.85,
  'USD-XOF': 610.50,
  'XOF-GHS': 0.026,
  'XOF-USD': 0.00164,
};

// ─── MOCK NOTIFICATIONS ────────────────────────────────

const MOCK_NOTIFICATIONS = [
  { id: 'n1', type: 'received', title: 'Payment Received', desc: 'Ama Serwah sent you GH₵ 500.00', time: new Date(Date.now() - 1000 * 60 * 30), read: false },
  { id: 'n2', type: 'bill', title: 'Bill Payment Successful', desc: 'ECG electricity bill paid — GH₵ 85.00', time: new Date(Date.now() - 1000 * 60 * 60 * 3), read: false },
  { id: 'n3', type: 'promo', title: 'Referral Bonus!', desc: 'You earned GH₵ 5.00 from a referral', time: new Date(Date.now() - 1000 * 60 * 60 * 8), read: false },
  { id: 'n4', type: 'security', title: 'New Login Detected', desc: 'Login from Chrome on Windows', time: new Date(Date.now() - 1000 * 60 * 60 * 24), read: true },
  { id: 'n5', type: 'sent', title: 'Money Sent', desc: 'You sent GH₵ 150.00 to Kofi Mensah', time: new Date(Date.now() - 1000 * 60 * 60 * 26), read: true },
  { id: 'n6', type: 'request', title: 'Payment Request', desc: 'Akua Ampofo requested GH₵ 200.00', time: new Date(Date.now() - 1000 * 60 * 60 * 48), read: true },
];

// ─── MOCK SAVINGS GOALS ────────────────────────────────

const MOCK_SAVINGS_GOALS = [
  { id: 'sg1', name: 'School Fees', emoji: '🎓', target: 5000, saved: 3200, currency: 'GHS', color: '#8B5CF6' },
  { id: 'sg2', name: 'Emergency Fund', emoji: '🛡️', target: 2000, saved: 850, currency: 'GHS', color: '#00C853' },
  { id: 'sg3', name: 'Travel to Lomé', emoji: '✈️', target: 1500, saved: 1500, currency: 'GHS', color: '#FF9800' },
];

// ─── BILL PROVIDERS ────────────────────────────────────

const BILL_CATEGORIES = [
  {
    id: 'electricity', icon: 'electricity', color: '#FFD700', providers: [
      { id: 'ecg', name: 'ECG (Electricity Company of Ghana)', logo: '⚡' },
      { id: 'gridco', name: 'GRIDCo', logo: '🔌' },
      { id: 'ceet', name: 'CEET (Togo)', logo: '💡' },
    ]
  },
  {
    id: 'water', icon: 'water', color: '#00B4D8', providers: [
      { id: 'gwcl', name: 'Ghana Water Company', logo: '💧' },
      { id: 'tde', name: 'TdE (Togo)', logo: '🚿' },
    ]
  },
  {
    id: 'internet', icon: 'wifi', color: '#8B5CF6', providers: [
      { id: 'vodafone_fiber', name: 'Vodafone Fiber', logo: '🌐' },
      { id: 'mtn_fiber', name: 'MTN Fiber', logo: '📡' },
      { id: 'togocom', name: 'Togocom Internet', logo: '📶' },
      { id: 'busy', name: 'Busy Internet', logo: '💻' },
    ]
  },
  {
    id: 'tvCable', icon: 'tv', color: '#F43F5E', providers: [
      { id: 'dstv', name: 'DSTV / MultiChoice', logo: '📺' },
      { id: 'gotv', name: 'GOtv', logo: '📡' },
      { id: 'startimes', name: 'StarTimes', logo: '⭐' },
    ]
  },
  {
    id: 'airtime', icon: 'phone', color: '#00C853', providers: [
      { id: 'mtn', name: 'MTN Ghana', logo: '📱' },
      { id: 'vodafone', name: 'Vodafone Ghana', logo: '📞' },
      { id: 'airteltigo', name: 'AirtelTigo', logo: '📲' },
      { id: 'moov', name: 'Moov Africa (Togo)', logo: '🔗' },
    ]
  },
  {
    id: 'education', icon: 'graduationCap', color: '#06B6D4', providers: [
      { id: 'uog', name: 'University of Ghana', logo: '🎓' },
      { id: 'knust', name: 'KNUST', logo: '🏫' },
      { id: 'ul', name: 'Université de Lomé', logo: '📚' },
    ]
  },
  {
    id: 'health', icon: 'medical', color: '#EF4444', providers: [
      { id: 'nhis', name: 'NHIS (National Health Insurance)', logo: '🏥' },
      { id: 'korle_bu', name: 'Korle-Bu Teaching Hospital', logo: '🩺' },
    ]
  },
  {
    id: 'government', icon: 'building', color: '#F59E0B', providers: [
      { id: 'gra', name: 'GRA (Ghana Revenue Authority)', logo: '🏛️' },
      { id: 'dvla', name: 'DVLA Ghana', logo: '🚗' },
      { id: 'otr', name: 'OTR (Office Togolais des Recettes)', logo: '🏦' },
    ]
  },
];

// ─── MOCK AGENTS (Accra + Lomé) ────────────────────────

const MOCK_AGENTS = [
  { id: 'a1', name: 'ClinoCash Agent — Osu Oxford St', type: 'Cash In/Out', lat: 5.5560, lng: -0.1820, phone: '+233241001001', hours: '7am–9pm' },
  { id: 'a2', name: 'Kwame Corner Shop', type: 'Cash In', lat: 5.5615, lng: -0.1925, phone: '+233241002002', hours: '8am–6pm' },
  { id: 'a3', name: 'Accra Mall Agent', type: 'Cash In/Out', lat: 5.6165, lng: -0.1755, phone: '+233241003003', hours: '9am–8pm' },
  { id: 'a4', name: 'Circle Mobile Money', type: 'Cash In/Out', lat: 5.5720, lng: -0.2085, phone: '+233241004004', hours: '6am–10pm' },
  { id: 'a5', name: 'Madina Market Agent', type: 'Cash In', lat: 5.6720, lng: -0.1680, phone: '+233241005005', hours: '7am–7pm' },
  { id: 'a6', name: 'Kaneshie Station Agent', type: 'Cash Out', lat: 5.5630, lng: -0.2350, phone: '+233241006006', hours: '6am–9pm' },
  { id: 'a7', name: 'Agent ClinoCash — Grand Marché Lomé', type: 'Cash In/Out', lat: 6.1310, lng: 1.2135, phone: '+22890001001', hours: '7h–20h' },
  { id: 'a8', name: 'Tokoin Pharmacy Agent', type: 'Cash In', lat: 6.1415, lng: 1.2270, phone: '+22890002002', hours: '8h–18h' },
  { id: 'a9', name: 'Bè Beach Agent', type: 'Cash In/Out', lat: 6.1255, lng: 1.2420, phone: '+22890003003', hours: '7h–21h' },
  { id: 'a10', name: 'Université de Lomé Agent', type: 'Cash In/Out', lat: 6.1680, lng: 1.2120, phone: '+22890004004', hours: '8h–19h' },
];

// ─── ICONS (SVG inline for zero dependencies) ──────────

const Icons = {
  send: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  receive: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="7 13 12 18 17 13" /><line x1="12" y1="18" x2="12" y2="6" />
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  topup: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  more: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
    </svg>
  ),
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  activity: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  scan: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2h-4" /><path d="M23 5a2 2 0 0 0-2-2h-4" />
      <path d="M1 19a2 2 0 0 0 2 2h4" /><path d="M1 5a2 2 0 0 1 2-2h4" />
      <line x1="1" y1="12" x2="23" y2="12" />
    </svg>
  ),
  cards: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  bell: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  arrowUp: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
    </svg>
  ),
  arrowDown: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
    </svg>
  ),
  chevronRight: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  eye: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  gift: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  ),
  shield: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  globe: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  link: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  headphones: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  ),
  logOut: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  // Bill category icons
  electricity: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  water: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  wifi: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  ),
  tv: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="15" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" />
    </svg>
  ),
  phone: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  graduationCap: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
    </svg>
  ),
  medical: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  building: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="1" /><line x1="9" y1="6" x2="9.01" y2="6" />
      <line x1="15" y1="6" x2="15.01" y2="6" /><line x1="9" y1="10" x2="9.01" y2="10" />
      <line x1="15" y1="10" x2="15.01" y2="10" /><line x1="9" y1="14" x2="9.01" y2="14" />
      <line x1="15" y1="14" x2="15.01" y2="14" /><path d="M9 22v-4h6v4" />
    </svg>
  ),
  barcodeScan: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="2" height="16" /><rect x="6" y="4" width="1" height="16" />
      <rect x="9" y="4" width="2" height="16" /><rect x="13" y="4" width="1" height="16" />
      <rect x="16" y="4" width="3" height="16" /><rect x="21" y="4" width="1" height="16" />
    </svg>
  ),
  qrcode: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" />
      <rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="4" height="4" rx="1" />
      <line x1="22" y1="14" x2="22" y2="14.01" /><line x1="22" y1="18" x2="22" y2="22" />
      <line x1="18" y1="22" x2="18" y2="22.01" />
    </svg>
  ),
  sun: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  moon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  mapPin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  navigation: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  ),
  target: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  ),
  download: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  piggyBank: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2" />
      <path d="M2 9.5a2.5 2.5 0 0 1 0 5" /><circle cx="15" cy="9" r="1" />
    </svg>
  ),
  plus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};

// ─── HELPER FUNCTIONS ──────────────────────────────────

function timeAgo(date, locale = 'en') {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return locale === 'fr' ? "À l'instant" : 'Just now';
  if (diffMins < 60) return `${diffMins}m ${locale === 'fr' ? 'passé' : 'ago'}`;
  if (diffHours < 24) return `${diffHours}h ${locale === 'fr' ? 'passé' : 'ago'}`;
  if (diffDays === 1) return t('yesterday', locale);
  if (diffDays < 7) return `${diffDays}d ${locale === 'fr' ? 'passé' : 'ago'}`;
  return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' });
}

function getDateGroup(date, locale = 'en') {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const txnDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today - txnDate) / 86400000);

  if (diffDays === 0) return t('today', locale);
  if (diffDays === 1) return t('yesterday', locale);
  return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// ─── ANIMATED COUNTER ──────────────────────────────────

function useAnimatedCounter(target, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(target * eased * 100) / 100);
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}

// ─── COMPONENTS ────────────────────────────────────────

function BalanceCard({ wallets, selectedCurrency, onCurrencyChange, locale, balanceHidden }) {
  const wallet = wallets.find(w => w.currency === selectedCurrency) || wallets[0];
  const animatedBalance = useAnimatedCounter(wallet.balance);
  const parts = formatCurrencyParts(balanceHidden ? 0 : animatedBalance, wallet.currency);

  return (
    <div className="balance-section">
      <div className="balance-card">
        <div className="balance-card-content">
          <div className="balance-label">
            {Icons.eye}
            <span>{t('totalBalance', locale)}</span>
          </div>
          <div className="balance-amount">
            <span className="currency-symbol">{parts.symbol}</span>
            {balanceHidden ? (
              <span>••••••</span>
            ) : (
              <>
                <span>{parts.whole}</span>
                {parts.hasDecimals && <span className="decimals">.{parts.decimals}</span>}
              </>
            )}
          </div>
          <div className="balance-change">
            {Icons.arrowUp}
            <span>+12.5% {t('thisMonth', locale)}</span>
          </div>

          <div className="wallet-selector">
            {wallets.map(w => (
              <button
                key={w.id}
                className={`wallet-pill ${w.currency === selectedCurrency ? 'active' : ''}`}
                onClick={() => onCurrencyChange(w.currency)}
              >
                {w.currency} {!balanceHidden && `• ${formatCurrency(w.balance, w.currency, locale)}`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActions({ locale, onSendClick, onPayBillsClick, onRequestClick, onSavingsClick }) {
  const actions = [
    { icon: <div className="quick-action-icon send">{Icons.send}</div>, label: t('send', locale), onClick: onSendClick },
    { icon: <div className="quick-action-icon receive">{Icons.receive}</div>, label: t('receive', locale), onClick: onRequestClick },
    { icon: <div className="quick-action-icon topup">{Icons.topup}</div>, label: t('topUp', locale), onClick: () => { } },
    { icon: <div className="quick-action-icon bills">{Icons.electricity}</div>, label: t('payBills', locale), onClick: onPayBillsClick },
    { icon: <div className="quick-action-icon savings">{Icons.piggyBank}</div>, label: locale === 'fr' ? 'Épargne' : 'Savings', onClick: onSavingsClick },
  ];

  const trackRef = useRef(null);
  const resumeTimer = useRef(null);
  const [paused, setPaused] = useState(false);

  const pauseCarousel = useCallback(() => {
    setPaused(true);
    clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), 3000);
  }, []);

  useEffect(() => {
    return () => clearTimeout(resumeTimer.current);
  }, []);

  const handleClick = (action) => {
    pauseCarousel();
    action.onClick && action.onClick();
  };

  // Duplicate items for seamless loop
  const allItems = [...actions, ...actions];

  return (
    <div
      className="quick-actions"
      onMouseEnter={pauseCarousel}
      onTouchStart={pauseCarousel}
    >
      <div ref={trackRef} className={`quick-actions-track ${paused ? 'paused' : ''}`}>
        {allItems.map((action, i) => (
          <button key={i} className="quick-action-btn" onClick={() => handleClick(action)}>
            {action.icon}
            <span className="quick-action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TransactionItem({ txn, locale, onTxnClick }) {
  const iconClass = txn.direction === 'received'
    ? (txn.type === 'CASH_IN' ? 'topup' : 'received')
    : (txn.status === 'PENDING' ? 'pending' : 'sent');

  const icon = txn.direction === 'received'
    ? (txn.type === 'CASH_IN' ? Icons.topup : Icons.arrowDown)
    : Icons.arrowUp;

  const amountClass = txn.direction === 'received' ? 'positive' : 'negative';
  const prefix = txn.direction === 'received' ? '+' : '-';
  const statusText = t(txn.status.toLowerCase(), locale);

  return (
    <div className="transaction-item" id={`txn-${txn.id}`} onClick={hapticClick(() => onTxnClick?.(txn))} style={{ cursor: 'pointer' }}>
      <div className={`transaction-icon ${iconClass}`}>{icon}</div>
      <div className="transaction-details">
        <div className="transaction-name">{txn.name}</div>
        <div className="transaction-meta">
          <span>{txn.username}</span>
          <span>•</span>
          <span>{timeAgo(txn.date, locale)}</span>
        </div>
      </div>
      <div className="transaction-amount">
        <div className={`amount ${amountClass}`}>
          {prefix}{formatCurrency(txn.amount, txn.currency, locale)}
        </div>
        <div className={`status ${txn.status.toLowerCase()}`}>{statusText}</div>
      </div>
    </div>
  );
}

function TransactionList({ transactions, locale, onTxnClick }) {
  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <div className="empty-state-title">{t('noTransactions', locale)}</div>
        <div className="empty-state-desc">{t('noTransactionsDesc', locale)}</div>
      </div>
    );
  }

  return (
    <div className="transaction-list">
      {transactions.map(txn => (
        <TransactionItem key={txn.id} txn={txn} locale={locale} onTxnClick={onTxnClick} />
      ))}
    </div>
  );
}

function SendMoneyModal({ onClose, locale, wallets }) {
  const [step, setStep] = useState(1);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('GHS');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSending(false);
    setSent(true);
  };

  const fee = parseFloat(amount || 0) * 0.005;
  const total = parseFloat(amount || 0) + fee;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('sendMoney', locale)}</h2>
          <button className="modal-close" onClick={onClose}>{Icons.close}</button>
        </div>
        <div className="modal-body">
          {sent ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-state-icon" style={{ fontSize: '4rem' }}>✅</div>
              <div className="empty-state-title" style={{ color: 'var(--green)' }}>
                {t('sendSuccess', locale)}
              </div>
              <div className="empty-state-desc" style={{ marginTop: '8px' }}>
                {formatCurrency(parseFloat(amount), currency, locale)} → {recipient}
              </div>
              <button className="btn-pill btn-primary" style={{ marginTop: '24px' }} onClick={onClose}>
                {Icons.check} Done
              </button>
            </div>
          ) : step === 1 ? (
            <>
              <div className="form-group">
                <label className="form-label">{t('recipient', locale)}</label>
                <input
                  className="form-input"
                  placeholder={t('recipientPlaceholder', locale)}
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  id="send-recipient-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('amount', locale)}</label>
                <div className="amount-display">
                  <div className="amount-currency">{currency}</div>
                  <input
                    className="form-input-amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    id="send-amount-input"
                  />
                </div>
                <div className="wallet-selector" style={{ justifyContent: 'center' }}>
                  {['GHS', 'XOF', 'USD'].map(c => (
                    <button
                      key={c}
                      className={`wallet-pill ${c === currency ? 'active' : ''}`}
                      onClick={() => setCurrency(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('description', locale)}</label>
                <input
                  className="form-input"
                  placeholder={t('descriptionPlaceholder', locale)}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  id="send-description-input"
                />
              </div>
              <button
                className="btn-pill btn-primary"
                onClick={() => setStep(2)}
                disabled={!recipient || !amount || parseFloat(amount) <= 0}
                style={{ opacity: (!recipient || !amount) ? 0.5 : 1 }}
                id="send-continue-btn"
              >
                {t('continue', locale)}
              </button>
            </>
          ) : (
            <>
              <div style={{ padding: '8px 0 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-400)', marginBottom: '4px' }}>
                  {t('sending', locale).replace('...', '')} {t('recipient', locale).toLowerCase()}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--white)', fontWeight: 600 }}>
                  {recipient}
                </div>
              </div>

              <div style={{
                background: 'var(--surface-card)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-lg)',
                marginBottom: 'var(--space-lg)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--gray-400)', fontSize: 'var(--text-sm)' }}>{t('amount', locale)}</span>
                  <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(parseFloat(amount || 0), currency, locale)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--gray-400)', fontSize: 'var(--text-sm)' }}>{t('fee', locale)} (0.5%)</span>
                  <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--gray-300)' }}>
                    {formatCurrency(fee, currency, locale)}
                  </span>
                </div>
                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>{t('total', locale)}</span>
                  <span style={{ fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(total, currency, locale)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-pill btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>
                  ← Back
                </button>
                <button
                  className="btn-pill btn-primary"
                  onClick={handleSend}
                  disabled={sending}
                  style={{ flex: 2, opacity: sending ? 0.7 : 1 }}
                  id="send-confirm-btn"
                >
                  {sending ? t('sending', locale) : t('confirmSend', locale)}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PAGES ─────────────────────────────────────────────

function HomePage({ locale, wallets, transactions, onSendClick, onPayBillsClick, onRequestClick, onSavingsClick, onFindAgent, onTxnClick, selectedCurrency, onCurrencyChange, balanceHidden, onToggleBalance }) {
  return (
    <>
      <BalanceCard
        wallets={wallets}
        selectedCurrency={selectedCurrency}
        onCurrencyChange={onCurrencyChange}
        locale={locale}
        balanceHidden={balanceHidden}
      />

      <QuickActions locale={locale} onSendClick={onSendClick} onPayBillsClick={onPayBillsClick} onRequestClick={onRequestClick} onSavingsClick={onSavingsClick} />

      {/* Agent Locator Banner */}
      <div className="agent-banner" onClick={onFindAgent}>
        <div className="agent-banner-icon">{Icons.mapPin}</div>
        <div className="agent-banner-content">
          <div className="agent-banner-title">{t('findAgent', locale)}</div>
          <div className="agent-banner-desc">{t('nearbyAgents', locale)}</div>
        </div>
        <div className="agent-banner-arrow">{Icons.chevronRight}</div>
      </div>

      {/* Mini Statement */}
      <MiniStatement transactions={transactions} locale={locale} />

      {/* Recent Transactions */}
      <div className="section-header">
        <h2 className="section-title">{t('recentTransactions', locale)}</h2>
        <button className="section-link">{t('viewAll', locale)}</button>
      </div>

      <TransactionList transactions={transactions.slice(0, 5)} locale={locale} onTxnClick={onTxnClick} />
    </>
  );
}

function ActivityPage({ locale, transactions, onTxnClick }) {
  const [filter, setFilter] = useState('all');
  const filters = ['all', 'incoming', 'outgoing', 'cashIn', 'cashOut'];

  const filtered = transactions.filter(txn => {
    if (filter === 'all') return true;
    if (filter === 'incoming') return txn.direction === 'received';
    if (filter === 'outgoing') return txn.direction === 'sent';
    if (filter === 'cashIn') return txn.type === 'CASH_IN';
    if (filter === 'cashOut') return txn.type === 'CASH_OUT';
    return true;
  });

  // Group by date
  const groups = {};
  filtered.forEach(txn => {
    const group = getDateGroup(txn.date, locale);
    if (!groups[group]) groups[group] = [];
    groups[group].push(txn);
  });

  return (
    <div className="activity-page">
      <div className="activity-filters">
        {filters.map(f => (
          <button
            key={f}
            className={`filter-pill ${f === filter ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {t(f, locale)}
          </button>
        ))}
      </div>

      {Object.entries(groups).map(([date, txns]) => (
        <div key={date} className="activity-date-group">
          <div className="activity-date-label">{date}</div>
          <TransactionList transactions={txns} locale={locale} onTxnClick={onTxnClick} />
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">{t('noTransactions', locale)}</div>
        </div>
      )}
    </div>
  );
}

function PayBillsPage({ locale, onBack }) {
  const [step, setStep] = useState('categories'); // categories, providers, form, confirm, success
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    setStep('providers');
  };

  const handleProviderClick = (provider) => {
    setSelectedProvider(provider);
    setStep('form');
  };

  const handleContinue = () => {
    if (accountNumber && amount && parseFloat(amount) > 0) setStep('confirm');
  };

  const handlePay = async () => {
    setPaying(true);
    await new Promise(r => setTimeout(r, 2000));
    setPaying(false);
    setStep('success');
  };

  const reset = () => {
    setStep('categories');
    setSelectedCategory(null);
    setSelectedProvider(null);
    setAccountNumber('');
    setAmount('');
  };

  // Success screen
  if (step === 'success') {
    return (
      <div className="bills-page">
        <div className="empty-state" style={{ padding: '60px 0' }}>
          <div className="empty-state-icon" style={{ fontSize: '4rem' }}>✅</div>
          <div className="empty-state-title" style={{ color: 'var(--green)' }}>
            {t('paymentSuccess', locale)}
          </div>
          <div className="empty-state-desc" style={{ marginTop: '8px' }}>
            {formatCurrency(parseFloat(amount), 'GHS', locale)} → {selectedProvider?.name}
          </div>
          <button className="btn-pill btn-primary" style={{ marginTop: '24px' }} onClick={reset}>
            {Icons.check} Done
          </button>
        </div>
      </div>
    );
  }

  // Confirm screen
  if (step === 'confirm') {
    const fee = parseFloat(amount) * 0.01;
    const total = parseFloat(amount) + fee;
    return (
      <div className="bills-page">
        <div className="bills-header">
          <button className="bills-back-btn" onClick={() => setStep('form')}>{Icons.chevronRight}</button>
          <h2 className="bills-title">{t('confirmPay', locale)}</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
          <div className="bill-provider-selected">{selectedProvider?.logo}</div>
          <div style={{ fontWeight: 600, marginTop: '8px' }}>{selectedProvider?.name}</div>
          <div style={{ color: 'var(--gray-400)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            {t('accountNumber', locale)}: {accountNumber}
          </div>
        </div>
        <div className="confirm-details-card">
          <div className="confirm-row">
            <span>{t('billAmount', locale)}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatCurrency(parseFloat(amount), 'GHS', locale)}</span>
          </div>
          <div className="confirm-row">
            <span>{t('fee', locale)} (1%)</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gray-300)' }}>{formatCurrency(fee, 'GHS', locale)}</span>
          </div>
          <div className="confirm-divider" />
          <div className="confirm-row">
            <span style={{ fontWeight: 700 }}>{t('total', locale)}</span>
            <span style={{ fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(total, 'GHS', locale)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button className="btn-pill btn-secondary" onClick={() => setStep('form')} style={{ flex: 1 }}>← {t('back', locale)}</button>
          <button className="btn-pill btn-primary" onClick={handlePay} disabled={paying} style={{ flex: 2, opacity: paying ? 0.7 : 1 }}>
            {paying ? t('processing', locale) : t('confirmPay', locale)}
          </button>
        </div>
      </div>
    );
  }

  // Form screen (enter account + amount)
  if (step === 'form') {
    return (
      <div className="bills-page">
        <div className="bills-header">
          <button className="bills-back-btn" onClick={() => setStep('providers')}>{Icons.chevronRight}</button>
          <h2 className="bills-title">{selectedProvider?.name}</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '2.5rem' }}>{selectedProvider?.logo}</div>
        <div className="form-group">
          <label className="form-label">{t('accountNumber', locale)}</label>
          <input className="form-input" placeholder={t('accountPlaceholder', locale)} value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('amount', locale)} (GHS)</label>
          <div className="amount-display">
            <div className="amount-currency">GHS</div>
            <input className="form-input-amount" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
        </div>
        <button className="btn-pill btn-primary" onClick={handleContinue} disabled={!accountNumber || !amount} style={{ opacity: (!accountNumber || !amount) ? 0.5 : 1 }}>
          {t('continue', locale)}
        </button>
      </div>
    );
  }

  // Provider selection
  if (step === 'providers') {
    return (
      <div className="bills-page">
        <div className="bills-header">
          <button className="bills-back-btn" onClick={() => setStep('categories')}>{Icons.chevronRight}</button>
          <h2 className="bills-title">{t(selectedCategory?.id, locale)} — {t('selectProvider', locale)}</h2>
        </div>
        <div className="provider-list">
          {selectedCategory?.providers.map(p => (
            <button key={p.id} className="provider-item" onClick={() => handleProviderClick(p)}>
              <span className="provider-logo">{p.logo}</span>
              <span className="provider-name">{p.name}</span>
              <span className="provider-arrow">{Icons.chevronRight}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Category grid
  return (
    <div className="bills-page">
      {onBack && (
        <div className="bills-header">
          <button className="bills-back-btn" onClick={onBack}>{Icons.chevronRight}</button>
          <h2 className="bills-title">{t('payBills', locale)}</h2>
        </div>
      )}
      {!onBack && <h2 className="bills-title" style={{ marginBottom: '20px' }}>{t('payBills', locale)}</h2>}
      <div className="bills-grid">
        {BILL_CATEGORIES.map(cat => (
          <button key={cat.id} className="bill-category-card" onClick={() => handleCategoryClick(cat)}>
            <div className="bill-category-icon" style={{ background: `${cat.color}18`, color: cat.color }}>
              {Icons[cat.icon]}
            </div>
            <span className="bill-category-label">{t(cat.id, locale)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ScanPage({ locale, user }) {
  const [tab, setTab] = useState('qr'); // qr, barcode
  const [showMyQR, setShowMyQR] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const scannerInstanceRef = useRef(null);

  // Generate a deterministic QR-like matrix from user ID
  const qrMatrix = [];
  const seed = user.id;
  for (let i = 0; i < 81; i++) {
    const charCode = seed.charCodeAt(i % seed.length);
    qrMatrix.push((charCode * (i + 1) * 7) % 3 !== 0);
  }

  // Demo barcode number
  const barcodeNum = '2847 6391 0054 8820 3';
  const barcodeBars = [];
  for (let i = 0; i < 50; i++) {
    const w = (i * 7 + 3) % 4 === 0 ? 3 : (i * 11 + 5) % 3 === 0 ? 2 : 1;
    barcodeBars.push({ width: w, filled: i % 2 === 0 });
  }

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.stop().catch(() => { });
        scannerInstanceRef.current = null;
      }
    };
  }, []);

  const startScanner = async (mode) => {
    setCameraError(null);
    setScannedResult(null);
    setScanning(true);

    // Wait for DOM to render the container
    await new Promise(r => setTimeout(r, 150));

    const containerId = 'scanner-container';
    const el = document.getElementById(containerId);
    if (!el) { setScanning(false); return; }

    try {
      const html5Qr = new Html5Qrcode(containerId);
      scannerInstanceRef.current = html5Qr;

      const config = {
        fps: 10,
        qrbox: mode === 'qr' ? { width: 220, height: 220 } : { width: 280, height: 100 },
      };

      await html5Qr.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          setScannedResult(decodedText);
          html5Qr.stop().catch(() => { });
          scannerInstanceRef.current = null;
          setScanning(false);
        },
        () => { }
      );
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(
        locale === 'fr'
          ? 'Impossible d\'accéder à la caméra. Vérifiez les permissions.'
          : 'Unable to access camera. Please check permissions.'
      );
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerInstanceRef.current) {
      try { await scannerInstanceRef.current.stop(); } catch (e) { }
      scannerInstanceRef.current = null;
    }
    setScanning(false);
  };

  const handleTabSwitch = async (newTab) => {
    await stopScanner();
    setScannedResult(null);
    setCameraError(null);
    setTab(newTab);
  };

  return (
    <div className="scan-page">
      {/* Tab switcher */}
      <div className="scan-tabs">
        <button className={`scan-tab ${tab === 'qr' ? 'active' : ''}`} onClick={() => handleTabSwitch('qr')}>
          {Icons.qrcode} <span>{t('qrCode', locale)}</span>
        </button>
        <button className={`scan-tab ${tab === 'barcode' ? 'active' : ''}`} onClick={() => handleTabSwitch('barcode')}>
          {Icons.barcodeScan} <span>{t('barcode', locale)}</span>
        </button>
      </div>

      {tab === 'qr' ? (
        <div className="scan-content">
          {showMyQR ? (
            <div className="my-qr-section">
              <div className="qr-display-card">
                <img src="/logo.png" alt="ClinoCash" style={{ width: '36px', height: '36px', marginBottom: '8px' }} />
                <div className="qr-matrix-large">
                  {qrMatrix.map((filled, i) => (
                    <div key={i} className={`qr-cell ${filled ? 'filled' : ''}`} />
                  ))}
                </div>
                <div className="qr-user-info">
                  <strong>{user.displayName}</strong>
                  <span>@{user.username}</span>
                  <span className="qr-clinocash-id">{t('clinocashId', locale)}: {user.id}</span>
                </div>
              </div>
              <p className="scan-hint">{t('scanToPayMe', locale)}</p>
              <div className="scan-actions">
                <button className="btn-pill btn-primary" style={{ width: 'auto', padding: '12px 24px' }}>
                  {Icons.send} {t('shareQR', locale)}
                </button>
                <button className="btn-pill btn-secondary" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => setShowMyQR(false)}>
                  {Icons.scan} {t('scanQR', locale)}
                </button>
              </div>
            </div>
          ) : (
            <div className="scan-viewfinder-section">
              {scanning ? (
                <div className="camera-active-container">
                  <div id="scanner-container" className="scanner-container" />
                  <button className="btn-pill btn-secondary stop-scan-btn" onClick={stopScanner}>
                    {Icons.close} {locale === 'fr' ? 'Arrêter' : 'Stop'}
                  </button>
                </div>
              ) : scannedResult ? (
                <div className="scan-result-card">
                  <div className="scan-result-icon">✅</div>
                  <div className="scan-result-label">{locale === 'fr' ? 'Code détecté' : 'Code detected'}</div>
                  <div className="scan-result-value">{scannedResult}</div>
                  <div className="scan-actions">
                    <button className="btn-pill btn-primary" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => startScanner('qr')}>
                      {Icons.scan} {locale === 'fr' ? 'Scanner à nouveau' : 'Scan again'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="scan-viewfinder" onClick={() => startScanner('qr')} style={{ cursor: 'pointer' }}>
                    <div className="viewfinder-corner tl" /><div className="viewfinder-corner tr" />
                    <div className="viewfinder-corner bl" /><div className="viewfinder-corner br" />
                    <div className="viewfinder-line" />
                    <div className="viewfinder-icon">{Icons.scan}</div>
                  </div>
                  {cameraError && <p className="scan-error">{cameraError}</p>}
                  <p className="scan-hint">{locale === 'fr' ? 'Appuyez pour ouvrir la caméra' : 'Tap to open camera'}</p>
                </>
              )}
              {!scanning && !scannedResult && (
                <div className="scan-actions">
                  <button className="btn-pill btn-primary" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => startScanner('qr')}>
                    {Icons.scan} {t('scanQR', locale)}
                  </button>
                  <button className="btn-pill btn-secondary" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => setShowMyQR(true)}>
                    {t('myQRCode', locale)}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="scan-content">
          {scanning ? (
            <div className="camera-active-container">
              <div id="scanner-container" className="scanner-container barcode-scanner" />
              <button className="btn-pill btn-secondary stop-scan-btn" onClick={stopScanner}>
                {Icons.close} {locale === 'fr' ? 'Arrêter' : 'Stop'}
              </button>
            </div>
          ) : scannedResult ? (
            <div className="scan-result-card">
              <div className="scan-result-icon">📊</div>
              <div className="scan-result-label">{t('barcodeNumber', locale)}</div>
              <div className="scan-result-value">{scannedResult}</div>
              <div className="scan-actions">
                <button className="btn-pill btn-primary" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => startScanner('barcode')}>
                  {Icons.barcodeScan} {locale === 'fr' ? 'Scanner à nouveau' : 'Scan again'}
                </button>
              </div>
            </div>
          ) : (
            <div className="barcode-section">
              <div className="barcode-display">
                <div className="barcode-bars">
                  {barcodeBars.map((bar, i) => (
                    <div key={i} className="barcode-bar" style={{ width: `${bar.width}px`, background: bar.filled ? 'var(--white)' : 'transparent' }} />
                  ))}
                </div>
                <div className="barcode-number">{barcodeNum}</div>
              </div>

              {cameraError && <p className="scan-error">{cameraError}</p>}
              <p className="scan-hint">{locale === 'fr' ? 'Scannez le code-barres sur votre facture' : 'Scan the barcode on your utility bill'}</p>

              <div className="scan-actions" style={{ marginBottom: '20px' }}>
                <button className="btn-pill btn-primary" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => startScanner('barcode')}>
                  {Icons.barcodeScan} {t('scanBarcode', locale)}
                </button>
              </div>

              <div className="manual-entry">
                <label className="form-label">{t('enterManually', locale)}</label>
                <div className="manual-entry-row">
                  <input
                    className="form-input"
                    placeholder={t('barcodePlaceholder', locale)}
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button className="btn-pill btn-primary" disabled={!manualCode} style={{ opacity: manualCode ? 1 : 0.5, padding: '12px 20px' }}>
                    {t('lookupBill', locale)}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}




function CardsPage({ locale, user }) {
  return (
    <div className="cards-page">
      <div className="virtual-card">
        <div className="card-header">
          <img src="/logo.png" alt="ClinoCash" style={{ height: '70px', filter: 'brightness(1.2)' }} />
          <div className="card-chip" />
        </div>
        <div className="card-number">•••• •••• •••• 4821</div>
        <div className="card-footer">
          <div>
            <div className="card-info-label">{t('cardHolder', locale)}</div>
            <div className="card-info-value">{user.displayName.toUpperCase()}</div>
          </div>
          <div>
            <div className="card-info-label">{t('validThru', locale)}</div>
            <div className="card-info-value">12/28</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="card-info-label">CVV</div>
            <div className="card-info-value">•••</div>
          </div>
        </div>
      </div>

      {/* NFC Tap to Pay */}
      <div className="nfc-section">
        <div className="nfc-animation">
          <div className="nfc-waves">
            <div className="nfc-wave"></div>
            <div className="nfc-wave"></div>
            <div className="nfc-wave"></div>
          </div>
          <div className="nfc-phone">📱</div>
        </div>
        <h3 className="nfc-title">{t('tapToPay', locale)}</h3>
        <p className="nfc-desc">{t('tapToPayDesc', locale)}</p>
        <div className="nfc-status">
          <span className="nfc-status-dot"></span>
          {t('nfcActive', locale)}
        </div>
      </div>

      <div className="promo-banner" style={{ marginTop: '24px' }}>
        <div className="promo-icon">{Icons.cards}</div>
        <div className="promo-content">
          <div className="promo-title">{t('getCard', locale)}</div>
          <div className="promo-desc">{t('getCardDesc', locale)}</div>
        </div>
        <div className="promo-arrow">{Icons.chevronRight}</div>
      </div>
    </div>
  );
}

function ProfilePage({ locale, user, onLocaleChange, theme, onThemeChange }) {
  const menuItems = [
    { icon: Icons.profile, label: t('personalInfo', locale) },
    { icon: Icons.shield, label: t('security', locale) },
    {
      icon: Icons.globe, label: t('language', locale), extra: (
        <div className="lang-toggle">
          <button className={`lang-option ${locale === 'en' ? 'active' : ''}`} onClick={() => onLocaleChange('en')}>EN</button>
          <button className={`lang-option ${locale === 'fr' ? 'active' : ''}`} onClick={() => onLocaleChange('fr')}>FR</button>
          <button className={`lang-option ${locale === 'ee' ? 'active' : ''}`} onClick={() => onLocaleChange('ee')}>EE</button>
          <button className={`lang-option ${locale === 'tw' ? 'active' : ''}`} onClick={() => onLocaleChange('tw')}>TW</button>
          <button className={`lang-option ${locale === 'ha' ? 'active' : ''}`} onClick={() => onLocaleChange('ha')}>HA</button>
        </div>
      )
    },
    {
      icon: theme === 'dark' ? Icons.moon : Icons.sun,
      label: locale === 'fr' ? 'Thème' : 'Theme',
      extra: (
        <div className="theme-toggle">
          <button className={`theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => onThemeChange('light')}>
            {Icons.sun}
          </button>
          <button className={`theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => onThemeChange('dark')}>
            {Icons.moon}
          </button>
        </div>
      )
    },
    { icon: Icons.bell, label: t('notifications', locale) },
    { icon: Icons.link, label: t('linkedAccounts', locale) },
    { icon: Icons.headphones, label: t('helpSupport', locale) },
  ];

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar">{user.avatarInitials}</div>
        <div className="profile-name">{user.displayName}</div>
        <div className="profile-username">@{user.username}</div>
        <div className="profile-kyc-badge">
          {Icons.check} {t('kycVerified', locale)} — {user.kycTier.replace('_', ' ')}
        </div>
      </div>

      <div className="profile-menu">
        {menuItems.map((item, i) => (
          <div key={i}>
            <div className="profile-menu-item" onClick={item.onClick} style={item.onClick ? { cursor: 'pointer' } : {}}>
              <div className="profile-menu-icon">{item.icon}</div>
              <span className="profile-menu-label">{item.label}</span>
              {item.extra || <span className="profile-menu-arrow">{Icons.chevronRight}</span>}
            </div>
            {i < menuItems.length - 1 && <div className="profile-menu-divider" />}
          </div>
        ))}

        <div className="profile-menu-divider" style={{ margin: '16px 24px' }} />

        <div className="profile-menu-item" style={{ color: 'var(--red)' }}>
          <div className="profile-menu-icon" style={{ color: 'var(--red)' }}>{Icons.logOut}</div>
          <span className="profile-menu-label" style={{ color: 'var(--red)' }}>{t('logout', locale)}</span>
        </div>
      </div>

      {/* Noviapp branding footer */}
      <div className="profile-branding">
        <div className="profile-branding-version">ClinoCash v1.0.0</div>
        <div className="profile-branding-company">A Noviapp AI Systems Product</div>
        <div className="profile-branding-copy">© 2026 All rights reserved</div>
      </div>
    </div>
  );
}


// ─── NOTIFICATIONS PANEL ───────────────────────────────

function NotificationsPanel({ locale, notifications, onClose }) {
  const [items, setItems] = useState(notifications);

  const markAllRead = () => {
    setItems(items.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type) => {
    const map = { received: '💰', sent: '📤', bill: '🧾', promo: '🎁', security: '🔒', request: '📩' };
    return map[type] || '🔔';
  };

  const unreadCount = items.filter(n => !n.read).length;

  return (
    <div className="notifications-overlay" onClick={onClose}>
      <div className="notifications-panel" onClick={e => e.stopPropagation()}>
        <div className="notifications-header">
          <h3>{locale === 'fr' ? 'Notifications' : 'Notifications'}</h3>
          {unreadCount > 0 && (
            <button className="notif-mark-read" onClick={markAllRead}>
              {locale === 'fr' ? 'Tout marquer lu' : 'Mark all read'}
            </button>
          )}
          <button className="notif-close" onClick={onClose}>{Icons.close}</button>
        </div>

        <div className="notifications-list">
          {items.map(n => (
            <div key={n.id} className={`notif-item ${n.read ? 'read' : 'unread'}`}>
              <div className="notif-icon">{getIcon(n.type)}</div>
              <div className="notif-content">
                <div className="notif-title">{n.title}</div>
                <div className="notif-desc">{n.desc}</div>
                <div className="notif-time">{timeAgo(n.time, locale)}</div>
              </div>
              {(n.type === 'received' || n.type === 'sent' || n.type === 'bill') && (
                <button className="notif-receipt-btn" title={locale === 'fr' ? 'Télécharger reçu' : 'Download Receipt'}>
                  {Icons.download}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SAVINGS GOALS PAGE ────────────────────────────────

function SavingsGoalsPage({ locale, onClose }) {
  const [goals, setGoals] = useState(MOCK_SAVINGS_GOALS);
  const [showCreate, setShowCreate] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');

  const handleCreateGoal = () => {
    if (!newGoalName || !newGoalTarget) return;
    const emojis = ['🎯', '💎', '🏠', '🚗', '💰', '📱', '🎓'];
    const colors = ['#8B5CF6', '#00C853', '#FF9800', '#06B6D4', '#E91E63'];
    setGoals([...goals, {
      id: `sg_${Date.now()}`,
      name: newGoalName,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      target: parseFloat(newGoalTarget),
      saved: 0,
      currency: 'GHS',
      color: colors[Math.floor(Math.random() * colors.length)],
    }]);
    setNewGoalName('');
    setNewGoalTarget('');
    setShowCreate(false);
  };

  return (
    <div className="savings-overlay">
      <div className="savings-modal">
        <div className="agent-header">
          <button className="bills-back-btn" onClick={onClose}>{Icons.chevronRight}</button>
          <h2 className="bills-title">{locale === 'fr' ? 'Objectifs d\'Épargne' : 'Savings Goals'}</h2>
        </div>

        {/* Total Saved */}
        <div className="savings-summary-card">
          <div className="savings-summary-icon">{Icons.piggyBank}</div>
          <div>
            <div className="savings-summary-label">{locale === 'fr' ? 'Total Épargné' : 'Total Saved'}</div>
            <div className="savings-summary-amount">{formatCurrency(goals.reduce((sum, g) => sum + g.saved, 0), 'GHS')}</div>
          </div>
        </div>

        {/* Goals List */}
        <div className="savings-goals-list">
          {goals.map(goal => {
            const pct = Math.min((goal.saved / goal.target) * 100, 100);
            const isComplete = pct >= 100;
            return (
              <div key={goal.id} className={`savings-goal-card ${isComplete ? 'complete' : ''}`}>
                <div className="savings-goal-header">
                  <span className="savings-goal-emoji">{goal.emoji}</span>
                  <div className="savings-goal-info">
                    <div className="savings-goal-name">{goal.name}</div>
                    <div className="savings-goal-amounts">
                      {formatCurrency(goal.saved, goal.currency)} / {formatCurrency(goal.target, goal.currency)}
                    </div>
                  </div>
                  {isComplete && <span className="savings-goal-badge">✅</span>}
                </div>
                <div className="savings-goal-bar-bg">
                  <div
                    className="savings-goal-bar-fill"
                    style={{ width: `${pct}%`, background: goal.color }}
                  />
                </div>
                <div className="savings-goal-pct">{Math.round(pct)}%</div>
              </div>
            );
          })}
        </div>

        {/* Create New */}
        {showCreate ? (
          <div className="savings-create-form">
            <input
              className="form-input"
              placeholder={locale === 'fr' ? 'Nom de l\'objectif' : 'Goal name'}
              value={newGoalName}
              onChange={e => setNewGoalName(e.target.value)}
            />
            <input
              className="form-input"
              type="number"
              placeholder={locale === 'fr' ? 'Montant cible (GH₵)' : 'Target amount (GH₵)'}
              value={newGoalTarget}
              onChange={e => setNewGoalTarget(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-pill btn-primary" onClick={handleCreateGoal} style={{ flex: 1 }}>
                {locale === 'fr' ? 'Créer' : 'Create'}
              </button>
              <button className="btn-pill btn-secondary" onClick={() => setShowCreate(false)} style={{ flex: 1 }}>
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          </div>
        ) : (
          <button className="btn-pill btn-primary savings-add-btn" onClick={() => setShowCreate(true)}>
            {Icons.plus} {locale === 'fr' ? 'Nouvel Objectif' : 'New Goal'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── REQUEST MONEY MODAL ───────────────────────────────

function RequestMoneyModal({ locale, user, onClose }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState('form'); // form | share

  const handleGenerate = () => {
    if (!amount) return;
    setStep('share');
  };

  const requestLink = `https://clinocash.app/pay/${user.username}?amount=${amount}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(requestLink).catch(() => { });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{locale === 'fr' ? 'Demander de l\'Argent' : 'Request Money'}</h2>
          <button className="modal-close" onClick={onClose}>{Icons.close}</button>
        </div>

        {step === 'form' ? (
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">{t('amount', locale)}</label>
              <input
                className="form-input amount-input"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('description', locale)}</label>
              <input
                className="form-input"
                placeholder={t('descriptionPlaceholder', locale)}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <button
              className="btn-pill btn-primary"
              disabled={!amount || parseFloat(amount) <= 0}
              style={{ opacity: amount && parseFloat(amount) > 0 ? 1 : 0.5 }}
              onClick={handleGenerate}
            >
              {locale === 'fr' ? 'Générer le Lien' : 'Generate Link'}
            </button>
          </div>
        ) : (
          <div className="modal-body request-share">
            <div className="request-share-card">
              <div className="request-share-emoji">📩</div>
              <div className="request-share-amount">
                {formatCurrency(parseFloat(amount), 'GHS')}
              </div>
              {description && <div className="request-share-desc">{description}</div>}
              <div className="request-share-from">
                {locale === 'fr' ? 'Demandé par' : 'Requested by'} @{user.username}
              </div>
            </div>

            <div className="request-link-box">
              <div className="request-link-url">{requestLink}</div>
              <button className="request-copy-btn" onClick={handleCopy}>
                {locale === 'fr' ? 'Copier' : 'Copy'}
              </button>
            </div>

            <div className="scan-actions" style={{ marginTop: '16px' }}>
              <button className="btn-pill btn-primary" style={{ width: 'auto', padding: '12px 24px' }} onClick={handleCopy}>
                {Icons.send} {locale === 'fr' ? 'Partager' : 'Share'}
              </button>
              <button className="btn-pill btn-secondary" style={{ width: 'auto', padding: '12px 24px' }} onClick={onClose}>
                {locale === 'fr' ? 'Terminé' : 'Done'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MINI STATEMENT ────────────────────────────────────

function MiniStatement({ transactions, locale }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyTxns = transactions.filter(t => t.date >= monthStart);
  const totalReceived = monthlyTxns.filter(t => t.direction === 'received').reduce((s, t) => s + t.amount, 0);
  const totalSent = monthlyTxns.filter(t => t.direction === 'sent').reduce((s, t) => s + t.amount, 0);
  const txnCount = monthlyTxns.length;

  const total = totalReceived + totalSent || 1;
  const receivedPct = (totalReceived / total) * 100;

  return (
    <div className="mini-statement">
      <div className="mini-statement-header">
        <h3 className="mini-statement-title">
          {locale === 'fr' ? 'Résumé du Mois' : 'Monthly Summary'}
        </h3>
        <span className="mini-statement-badge">{t('thisMonth', locale)}</span>
      </div>

      <div className="mini-statement-body">
        <div className="mini-statement-chart">
          <svg viewBox="0 0 100 100" className="mini-donut">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface-card)" strokeWidth="12" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke="var(--cyan)"
              strokeWidth="12"
              strokeDasharray={`${receivedPct * 2.51} ${251 - receivedPct * 2.51}`}
              strokeDashoffset="63"
              strokeLinecap="round"
            />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke="var(--red)"
              strokeWidth="12"
              strokeDasharray={`${(100 - receivedPct) * 2.51} ${251 - (100 - receivedPct) * 2.51}`}
              strokeDashoffset={`${63 - receivedPct * 2.51}`}
              strokeLinecap="round"
            />
            <text x="50" y="48" textAnchor="middle" fill="var(--white)" fontSize="14" fontWeight="700">{txnCount}</text>
            <text x="50" y="62" textAnchor="middle" fill="var(--gray-400)" fontSize="8">txns</text>
          </svg>
        </div>

        <div className="mini-statement-stats">
          <div className="mini-stat">
            <div className="mini-stat-dot received" />
            <div className="mini-stat-info">
              <div className="mini-stat-label">{locale === 'fr' ? 'Reçu' : 'Received'}</div>
              <div className="mini-stat-value">{formatCurrency(totalReceived, 'GHS')}</div>
            </div>
          </div>
          <div className="mini-stat">
            <div className="mini-stat-dot sent" />
            <div className="mini-stat-info">
              <div className="mini-stat-label">{locale === 'fr' ? 'Envoyé' : 'Sent'}</div>
              <div className="mini-stat-value">{formatCurrency(totalSent, 'GHS')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ONBOARDING WALKTHROUGH ────────────────────────────

function OnboardingWalkthrough({ locale, onComplete }) {
  const [step, setStep] = useState(0);

  const slides = [
    {
      emoji: '💸',
      title: locale === 'fr' ? 'Bienvenue sur ClinoCash' : 'Welcome to ClinoCash',
      desc: locale === 'fr'
        ? 'Votre portefeuille numérique pour le Ghana et le Togo. Envoyez, recevez et gérez votre argent en toute simplicité.'
        : 'Your digital wallet for Ghana and Togo. Send, receive, and manage money with ease.',
      color: '#00C853',
    },
    {
      emoji: '🚀',
      title: locale === 'fr' ? 'Envoyez Instantanément' : 'Send Money Instantly',
      desc: locale === 'fr'
        ? 'Transférez de l\'argent à vos proches en quelques secondes. GHS, XOF et USD supportés.'
        : 'Transfer money to loved ones in seconds. GHS, XOF, and USD supported.',
      color: '#8B5CF6',
    },
    {
      emoji: '🧾',
      title: locale === 'fr' ? 'Payez vos Factures' : 'Pay Your Bills',
      desc: locale === 'fr'
        ? 'Électricité, eau, internet, crédit mobile — tout depuis votre téléphone.'
        : 'Electricity, water, internet, airtime — all from your phone.',
      color: '#FF9800',
    },
    {
      emoji: '🔒',
      title: locale === 'fr' ? 'Sécurisé et Fiable' : 'Secure & Reliable',
      desc: locale === 'fr'
        ? 'Vos transactions sont protégées par un chiffrement de bout en bout. Vos fonds sont en sécurité.'
        : 'Your transactions are protected with end-to-end encryption. Your funds are safe.',
      color: '#00C853',
    },
  ];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem('clinocash_onboarded', 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('clinocash_onboarded', 'true');
    onComplete();
  };

  const s = slides[step];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-slide" key={step}>
        <button className="onboarding-skip" onClick={handleSkip}>
          {locale === 'fr' ? 'Passer' : 'Skip'}
        </button>

        <div className="onboarding-visual">
          <div className="onboarding-emoji-ring" style={{ boxShadow: `0 0 60px ${s.color}30, 0 0 120px ${s.color}15` }}>
            <span className="onboarding-emoji">{s.emoji}</span>
          </div>
        </div>

        <div className="onboarding-text">
          <h2 className="onboarding-title">{s.title}</h2>
          <p className="onboarding-desc">{s.desc}</p>
        </div>

        <div className="onboarding-dots">
          {slides.map((_, i) => (
            <div key={i} className={`onboarding-dot ${i === step ? 'active' : ''}`} onClick={() => setStep(i)} />
          ))}
        </div>

        <button className="btn-pill btn-primary onboarding-btn" onClick={handleNext}>
          {step === slides.length - 1
            ? (locale === 'fr' ? 'Commencer' : 'Get Started')
            : (locale === 'fr' ? 'Suivant' : 'Next')
          }
        </button>
      </div>
    </div>
  );
}

// ─── AGENT LOCATOR ─────────────────────────────────────

function AgentLocator({ locale, onClose }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [city, setCity] = useState('accra');

  const filteredAgents = MOCK_AGENTS.filter(a =>
    city === 'accra' ? a.lat < 6 : a.lat >= 6
  );

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const loadMap = () => {
      if (!window.L || !mapRef.current) return;

      // Clean up existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const center = city === 'accra' ? [5.5860, -0.1969] : [6.1375, 1.2225];
      const map = window.L.map(mapRef.current, { zoomControl: false }).setView(center, 13);
      mapInstanceRef.current = map;

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      // Custom green icon
      const agentIcon = window.L.divIcon({
        html: '<div style="width:28px;height:28px;background:#00C853;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:12px;">📍</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        className: '',
      });

      filteredAgents.forEach(agent => {
        const marker = window.L.marker([agent.lat, agent.lng], { icon: agentIcon }).addTo(map);
        marker.on('click', () => setSelectedAgent(agent));
        marker.bindTooltip(agent.name, { direction: 'top', offset: [0, -16] });
      });

      // Zoom controls
      window.L.control.zoom({ position: 'bottomright' }).addTo(map);
    };

    if (window.L) {
      setTimeout(loadMap, 100);
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setTimeout(loadMap, 100);
      document.body.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [city]);

  return (
    <div className="agent-overlay">
      <div className="agent-modal">
        <div className="agent-header">
          <button className="bills-back-btn" onClick={onClose}>{Icons.chevronRight}</button>
          <h2 className="bills-title">{locale === 'fr' ? 'Trouver un Agent' : 'Find Agent'}</h2>
        </div>

        {/* City Toggle */}
        <div className="scan-tabs" style={{ marginBottom: '16px' }}>
          <button className={`scan-tab ${city === 'accra' ? 'active' : ''}`} onClick={() => { setCity('accra'); setSelectedAgent(null); }}>
            🇬🇭 Accra
          </button>
          <button className={`scan-tab ${city === 'lome' ? 'active' : ''}`} onClick={() => { setCity('lome'); setSelectedAgent(null); }}>
            🇹🇬 Lomé
          </button>
        </div>

        {/* Map */}
        <div ref={mapRef} className="agent-map" />

        {/* Selected Agent Card */}
        {selectedAgent && (
          <div className="agent-info-card">
            <div className="agent-info-header">
              <div className="agent-info-pin">{Icons.mapPin}</div>
              <div>
                <div className="agent-info-name">{selectedAgent.name}</div>
                <div className="agent-info-type">{selectedAgent.type}</div>
              </div>
            </div>
            <div className="agent-info-details">
              <div>📞 {selectedAgent.phone}</div>
              <div>🕐 {selectedAgent.hours}</div>
            </div>
          </div>
        )}

        {/* Agent List */}
        <div className="agent-list">
          {filteredAgents.map(agent => (
            <div
              key={agent.id}
              className={`agent-list-item ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
              onClick={() => setSelectedAgent(agent)}
            >
              <div className="agent-list-pin">{Icons.mapPin}</div>
              <div className="agent-list-info">
                <div className="agent-list-name">{agent.name}</div>
                <div className="agent-list-meta">{agent.type} · {agent.hours}</div>
              </div>
              <div className="agent-list-arrow">{Icons.chevronRight}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TRANSACTION DETAIL MODAL ──────────────────────────

function TransactionDetailModal({ txn, locale, onClose }) {
  if (!txn) return null;

  const refNumber = `TXN-${txn.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const dateObj = new Date(txn.date);
  const dateStr = dateObj.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const timeStr = dateObj.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    hour: '2-digit', minute: '2-digit'
  });
  const isReceived = txn.direction === 'received';
  const amountPrefix = isReceived ? '+' : '-';
  const amountClass = isReceived ? 'positive' : 'negative';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="txn-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('transactionDetail', locale)}</h3>
          <button className="modal-close" onClick={onClose}>{Icons.close}</button>
        </div>

        {/* Amount hero */}
        <div className="txn-detail-hero">
          <div className={`txn-detail-amount ${amountClass}`}>
            {amountPrefix}{formatCurrency(txn.amount, txn.currency, locale)}
          </div>
          <div className={`txn-detail-status ${txn.status.toLowerCase()}`}>
            {txn.status === 'COMPLETED' ? '✓' : txn.status === 'PENDING' ? '⏳' : '✗'} {t(txn.status.toLowerCase(), locale)}
          </div>
        </div>

        {/* Details rows */}
        <div className="txn-detail-rows">
          <div className="txn-detail-row">
            <span className="txn-detail-label">{t('transactionType', locale)}</span>
            <span className="txn-detail-value">{isReceived ? t('received', locale) : t('sent', locale)}</span>
          </div>
          <div className="txn-detail-row">
            <span className="txn-detail-label">{isReceived ? t('from', locale) : t('to', locale)}</span>
            <span className="txn-detail-value">{txn.name} ({txn.username})</span>
          </div>
          <div className="txn-detail-row">
            <span className="txn-detail-label">{t('dateTime', locale)}</span>
            <span className="txn-detail-value">{dateStr}<br />{timeStr}</span>
          </div>
          <div className="txn-detail-row">
            <span className="txn-detail-label">{t('referenceNumber', locale)}</span>
            <span className="txn-detail-value txn-ref">{refNumber}</span>
          </div>
          {txn.fee > 0 && (
            <div className="txn-detail-row">
              <span className="txn-detail-label">{t('fee', locale)}</span>
              <span className="txn-detail-value">{formatCurrency(txn.fee, txn.currency, locale)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="txn-detail-actions">
          <button className="btn-secondary" onClick={hapticClick(() => { })}>
            {Icons.download} {t('downloadReceipt', locale)}
          </button>
          <button className="btn-secondary" onClick={hapticClick(() => { })}>
            📤 {t('shareReceipt', locale)}
          </button>
          <button className="btn-outline-danger" onClick={hapticClick(() => { })}>
            ⚠️ {t('reportIssue', locale)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PIN LOCK SCREEN ───────────────────────────────────

function PinLockScreen({ locale, onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const CORRECT_PIN = '1234';

  const handleDigit = (digit) => {
    haptic(10);
    setError(false);
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      if (newPin === CORRECT_PIN) {
        haptic([50, 30, 50]);
        setTimeout(() => onUnlock(), 300);
      } else {
        haptic([100, 50, 100]);
        setError(true);
        setShake(true);
        setTimeout(() => { setPin(''); setShake(false); }, 600);
      }
    }
  };

  const handleDelete = () => {
    haptic(10);
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const dots = [0, 1, 2, 3];

  return (
    <div className="pin-lock-screen">
      <div className="pin-lock-content">
        <img src="/logo.png" alt="ClinoCash" className="pin-logo" />
        <h2 className="pin-title">{t('enterPin', locale)}</h2>
        <p className="pin-subtitle">{t('pinSubtitle', locale)}</p>

        {/* PIN dots */}
        <div className={`pin-dots ${shake ? 'shake' : ''}`}>
          {dots.map(i => (
            <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''} ${error ? 'error' : ''}`} />
          ))}
        </div>

        {error && <p className="pin-error">{t('wrongPin', locale)}</p>}

        {/* Numpad */}
        <div className="pin-numpad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button key={n} className="pin-key" onClick={() => handleDigit(String(n))}>
              {n}
            </button>
          ))}
          <button className="pin-key pin-bio" onClick={hapticClick(onUnlock)}>
            🔑
          </button>
          <button className="pin-key" onClick={() => handleDigit('0')}>
            0
          </button>
          <button className="pin-key pin-delete" onClick={handleDelete}>
            ⌫
          </button>
        </div>

        <button className="pin-forgot" onClick={hapticClick(onUnlock)}>
          {t('forgotPin', locale)}
        </button>
      </div>

      {/* Noviapp branding */}
      <div className="pin-branding">
        <span className="pin-branding-powered">Powered by</span>
        <span className="pin-branding-name">Noviapp AI Systems</span>
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [locale, setLocale] = useState('en');
  const [selectedCurrency, setSelectedCurrency] = useState('GHS');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showBillsPage, setShowBillsPage] = useState(false);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('clinocash_onboarded'));
  const [showAgentLocator, setShowAgentLocator] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('clinocash_theme') || 'dark');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showSavingsPage, setShowSavingsPage] = useState(false);
  const [showInviteToast, setShowInviteToast] = useState(true);
  const [pinLocked, setPinLocked] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState(null);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('clinocash_theme', theme);
  }, [theme]);

  // Listen for PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setInstallPrompt(null);
  };

  const tabs = [
    { id: 'home', label: t('home', locale), icon: Icons.home },
    { id: 'activity', label: t('activity', locale), icon: Icons.activity },
    { id: 'scan', label: t('scan', locale), icon: Icons.scan, isScan: true },
    { id: 'cards', label: t('cards', locale), icon: Icons.cards },
    { id: 'profile', label: t('profile', locale), icon: Icons.profile },
  ];

  const renderPage = () => {
    // If bills page is open, show it over any tab
    if (showBillsPage) {
      return <PayBillsPage locale={locale} onBack={() => setShowBillsPage(false)} />;
    }

    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            locale={locale}
            wallets={MOCK_WALLETS}
            transactions={MOCK_TRANSACTIONS}
            onSendClick={() => setShowSendModal(true)}
            onPayBillsClick={() => setShowBillsPage(true)}
            onRequestClick={() => setShowRequestModal(true)}
            onSavingsClick={() => setShowSavingsPage(true)}
            onFindAgent={() => setShowAgentLocator(true)}
            onTxnClick={setSelectedTxn}
            selectedCurrency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
            balanceHidden={balanceHidden}
            onToggleBalance={() => setBalanceHidden(!balanceHidden)}
          />
        );
      case 'activity':
        return <ActivityPage locale={locale} transactions={MOCK_TRANSACTIONS} onTxnClick={setSelectedTxn} />;
      case 'scan':
        return <ScanPage locale={locale} user={MOCK_USER} />;
      case 'cards':
        return <CardsPage locale={locale} user={MOCK_USER} />;
      case 'profile':
        return <ProfilePage locale={locale} user={MOCK_USER} onLocaleChange={setLocale} theme={theme} onThemeChange={setTheme} />;
      default:
        return null;
    }
  };

  // PIN Lock Screen
  if (pinLocked && !showOnboarding) {
    return <PinLockScreen locale={locale} onUnlock={() => setPinLocked(false)} />;
  }

  return (
    <div className="app" id="clinocash-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <img src="/logo.png" alt="ClinoCash" className="header-logo" />
          <div className="header-greeting">
            <span>{getGreeting(locale)}</span>
            <span>{MOCK_USER.displayName.split(' ')[0]}</span>
          </div>
        </div>
        <div className="header-right">
          <button className="header-icon-btn" onClick={() => setBalanceHidden(!balanceHidden)} id="toggle-balance-btn">
            {balanceHidden ? Icons.eyeOff : Icons.eye}
          </button>
          <button className="header-icon-btn" id="notifications-btn" onClick={() => setShowNotifications(true)}>
            {Icons.bell}
            <span className="badge">3</span>
          </button>
        </div>
      </header>

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="install-banner" id="install-banner">
          <img src="/favicon.png" alt="ClinoCash" className="install-banner-icon" />
          <div className="install-banner-text">
            <strong>{locale === 'fr' ? 'Installer ClinoCash' : 'Install ClinoCash'}</strong>
            <span>{locale === 'fr' ? 'Ajoutez à votre écran d\'accueil' : 'Add to your home screen'}</span>
          </div>
          <button className="install-banner-btn" onClick={handleInstall}>
            {locale === 'fr' ? 'Installer' : 'Install'}
          </button>
          <button className="install-banner-close" onClick={() => setShowInstallBanner(false)}>
            {Icons.close}
          </button>
        </div>
      )}

      {/* Content */}
      <main className="app-content">
        {renderPage()}
      </main>

      {/* Invite Friends Toast */}
      {showInviteToast && (
        <div className="invite-toast" id="invite-toast">
          <div className="invite-toast-icon">🎁</div>
          <div className="invite-toast-content">
            <div className="invite-toast-title">{t('promoTitle', locale)}</div>
            <div className="invite-toast-desc">{t('promoDesc', locale)}</div>
          </div>
          <button className="invite-toast-close" onClick={() => setShowInviteToast(false)}>
            {Icons.close}
          </button>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <nav className="bottom-tab-bar" id="bottom-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-item ${tab.isScan ? 'scan-tab' : ''} ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setShowBillsPage(false); }}
            id={`tab-${tab.id}`}
          >
            <span className={`tab-icon ${tab.isScan ? '' : ''}`}>
              {tab.isScan ? <span className="tab-icon">{tab.icon}</span> : tab.icon}
            </span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Send Money Modal */}
      {showSendModal && (
        <SendMoneyModal
          onClose={() => setShowSendModal(false)}
          locale={locale}
          wallets={MOCK_WALLETS}
        />
      )}

      {/* Onboarding Walkthrough */}
      {showOnboarding && (
        <OnboardingWalkthrough locale={locale} onComplete={() => setShowOnboarding(false)} />
      )}

      {/* Agent Locator */}
      {showAgentLocator && (
        <AgentLocator locale={locale} onClose={() => setShowAgentLocator(false)} />
      )}

      {/* Notifications */}
      {showNotifications && (
        <NotificationsPanel locale={locale} notifications={MOCK_NOTIFICATIONS} onClose={() => setShowNotifications(false)} />
      )}

      {/* Request Money */}
      {showRequestModal && (
        <RequestMoneyModal locale={locale} user={MOCK_USER} onClose={() => setShowRequestModal(false)} />
      )}

      {/* Savings Goals */}
      {showSavingsPage && (
        <SavingsGoalsPage locale={locale} onClose={() => setShowSavingsPage(false)} />
      )}

      {/* Transaction Detail */}
      {selectedTxn && (
        <TransactionDetailModal txn={selectedTxn} locale={locale} onClose={() => setSelectedTxn(null)} />
      )}
    </div>
  );
}

export default App;
