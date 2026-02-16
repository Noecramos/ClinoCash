import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { t, getGreeting, formatCurrency, formatCurrencyParts } from './i18n';

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

function QuickActions({ locale, onSendClick }) {
  const actions = [
    { icon: <div className="quick-action-icon send">{Icons.send}</div>, label: t('send', locale), onClick: onSendClick },
    { icon: <div className="quick-action-icon receive">{Icons.receive}</div>, label: t('receive', locale), onClick: () => { } },
    { icon: <div className="quick-action-icon topup">{Icons.topup}</div>, label: t('topUp', locale), onClick: () => { } },
    { icon: <div className="quick-action-icon more">{Icons.more}</div>, label: t('more', locale), onClick: () => { } },
  ];

  return (
    <div className="quick-actions">
      {actions.map((action, i) => (
        <button key={i} className="quick-action-btn" onClick={action.onClick}>
          {action.icon}
          <span className="quick-action-label">{action.label}</span>
        </button>
      ))}
    </div>
  );
}

function TransactionItem({ txn, locale }) {
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
    <div className="transaction-item" id={`txn-${txn.id}`}>
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

function TransactionList({ transactions, locale }) {
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
        <TransactionItem key={txn.id} txn={txn} locale={locale} />
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

function HomePage({ locale, wallets, transactions, onSendClick, selectedCurrency, onCurrencyChange, balanceHidden, onToggleBalance }) {
  return (
    <>
      <BalanceCard
        wallets={wallets}
        selectedCurrency={selectedCurrency}
        onCurrencyChange={onCurrencyChange}
        locale={locale}
        balanceHidden={balanceHidden}
      />

      <QuickActions locale={locale} onSendClick={onSendClick} />

      {/* Promo Banner */}
      <div className="promo-banner">
        <div className="promo-icon">{Icons.gift}</div>
        <div className="promo-content">
          <div className="promo-title">{t('promoTitle', locale)}</div>
          <div className="promo-desc">{t('promoDesc', locale)}</div>
        </div>
        <div className="promo-arrow">{Icons.chevronRight}</div>
      </div>

      {/* Recent Transactions */}
      <div className="section-header">
        <h2 className="section-title">{t('recentTransactions', locale)}</h2>
        <button className="section-link">{t('viewAll', locale)}</button>
      </div>

      <TransactionList transactions={transactions.slice(0, 5)} locale={locale} />
    </>
  );
}

function ActivityPage({ locale, transactions }) {
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
          <TransactionList transactions={txns} locale={locale} />
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

function ScanPage({ locale }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{
        width: '200px',
        height: '200px',
        margin: '0 auto 24px',
        border: '3px solid var(--cyan)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: 'var(--surface-card)',
        animation: 'glow 3s ease-in-out infinite',
      }}>
        {/* QR Code placeholder */}
        <div style={{
          width: '150px',
          height: '150px',
          background: 'var(--white)',
          borderRadius: 'var(--radius-md)',
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: 'repeat(7, 1fr)',
          gap: '2px',
          padding: '8px',
        }}>
          {Array.from({ length: 49 }, (_, i) => (
            <div key={i} style={{
              background: Math.random() > 0.5 ? 'var(--navy-dark)' : 'var(--white)',
              borderRadius: '2px',
            }} />
          ))}
        </div>
      </div>
      <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: '8px' }}>
        {t('scan', locale)} QR Code
      </h3>
      <p style={{ color: 'var(--gray-400)', fontSize: 'var(--text-sm)' }}>
        {locale === 'fr' ? 'Scannez pour envoyer ou recevoir de l\'argent' : 'Scan to send or receive money instantly'}
      </p>
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
        <button className="btn-pill btn-primary" style={{ width: 'auto', padding: '12px 24px' }}>
          {Icons.scan} {locale === 'fr' ? 'Scanner' : 'Scan QR'}
        </button>
        <button className="btn-pill btn-secondary" style={{ width: 'auto', padding: '12px 24px' }}>
          {locale === 'fr' ? 'Mon Code' : 'My Code'}
        </button>
      </div>
    </div>
  );
}

function CardsPage({ locale, user }) {
  return (
    <div className="cards-page">
      <div className="virtual-card">
        <div className="card-header">
          <img src="/logo.png" alt="ClinoCash" style={{ height: '40px', filter: 'brightness(1.2)' }} />
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

function ProfilePage({ locale, user, onLocaleChange }) {
  const menuItems = [
    { icon: Icons.profile, label: t('personalInfo', locale) },
    { icon: Icons.shield, label: t('security', locale) },
    {
      icon: Icons.globe, label: t('language', locale), extra: (
        <div className="lang-toggle">
          <button className={`lang-option ${locale === 'en' ? 'active' : ''}`} onClick={() => onLocaleChange('en')}>EN</button>
          <button className={`lang-option ${locale === 'fr' ? 'active' : ''}`} onClick={() => onLocaleChange('fr')}>FR</button>
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
            <div className="profile-menu-item">
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
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [locale, setLocale] = useState('en');
  const [selectedCurrency, setSelectedCurrency] = useState('GHS');
  const [showSendModal, setShowSendModal] = useState(false);
  const [balanceHidden, setBalanceHidden] = useState(false);

  const tabs = [
    { id: 'home', label: t('home', locale), icon: Icons.home },
    { id: 'activity', label: t('activity', locale), icon: Icons.activity },
    { id: 'scan', label: t('scan', locale), icon: Icons.scan, isScan: true },
    { id: 'cards', label: t('cards', locale), icon: Icons.cards },
    { id: 'profile', label: t('profile', locale), icon: Icons.profile },
  ];

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            locale={locale}
            wallets={MOCK_WALLETS}
            transactions={MOCK_TRANSACTIONS}
            onSendClick={() => setShowSendModal(true)}
            selectedCurrency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
            balanceHidden={balanceHidden}
            onToggleBalance={() => setBalanceHidden(!balanceHidden)}
          />
        );
      case 'activity':
        return <ActivityPage locale={locale} transactions={MOCK_TRANSACTIONS} />;
      case 'scan':
        return <ScanPage locale={locale} />;
      case 'cards':
        return <CardsPage locale={locale} user={MOCK_USER} />;
      case 'profile':
        return <ProfilePage locale={locale} user={MOCK_USER} onLocaleChange={setLocale} />;
      default:
        return null;
    }
  };

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
          <button className="header-icon-btn" id="notifications-btn">
            {Icons.bell}
            <span className="badge">3</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="app-content">
        {renderPage()}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="bottom-tab-bar" id="bottom-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-item ${tab.isScan ? 'scan-tab' : ''} ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
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
    </div>
  );
}

export default App;
