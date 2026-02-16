// ClinoCash — Localization System (EN/FR)

const translations = {
    en: {
        // Header
        greeting: 'Good morning',
        greetingAfternoon: 'Good afternoon',
        greetingEvening: 'Good evening',

        // Balance
        totalBalance: 'Total Balance',
        thisMonth: 'This month',

        // Quick Actions
        send: 'Send',
        receive: 'Receive',
        topUp: 'Top Up',
        more: 'More',

        // Tabs
        home: 'Home',
        activity: 'Activity',
        scan: 'Scan',
        cards: 'Cards',
        profile: 'Profile',

        // Transactions
        recentTransactions: 'Recent Transactions',
        viewAll: 'View All',
        received: 'Received',
        sent: 'Sent',
        completed: 'Completed',
        pending: 'Pending',
        failed: 'Failed',
        today: 'Today',
        yesterday: 'Yesterday',
        noTransactions: 'No transactions yet',
        noTransactionsDesc: 'Your transaction history will appear here',

        // Send Money
        sendMoney: 'Send Money',
        recipient: 'Recipient',
        recipientPlaceholder: '@username or phone number',
        amount: 'Amount',
        description: 'Description (optional)',
        descriptionPlaceholder: 'What\'s this for?',
        continue: 'Continue',
        confirmSend: 'Confirm & Send',
        fee: 'Fee',
        total: 'Total',
        sendSuccess: 'Money sent successfully!',
        sending: 'Sending...',

        // Request Money
        requestMoney: 'Request Money',
        requestFrom: 'Request from',

        // Cards
        virtualCard: 'Virtual Card',
        cardHolder: 'Card Holder',
        validThru: 'Valid Thru',
        getCard: 'Get Your Virtual Card',
        getCardDesc: 'Use your ClinoCash virtual card for online payments worldwide',

        // Profile
        personalInfo: 'Personal Info',
        security: 'Security',
        language: 'Language',
        notifications: 'Notifications',
        linkedAccounts: 'Linked Accounts',
        helpSupport: 'Help & Support',
        logout: 'Log Out',
        kycVerified: 'Verified',
        kycPending: 'Verification Pending',

        // Promo
        promoTitle: 'Invite Friends, Earn Rewards',
        promoDesc: 'Get GH₵ 5 for every friend who signs up',

        // Filters
        all: 'All',
        incoming: 'Incoming',
        outgoing: 'Outgoing',
        cashIn: 'Cash In',
        cashOut: 'Cash Out',

        // Currency
        ghsCedi: 'Ghanaian Cedi',
        xofFranc: 'CFA Franc',
        usDollar: 'US Dollar',
    },

    fr: {
        // Header
        greeting: 'Bonjour',
        greetingAfternoon: 'Bon après-midi',
        greetingEvening: 'Bonsoir',

        // Balance
        totalBalance: 'Solde Total',
        thisMonth: 'Ce mois-ci',

        // Quick Actions
        send: 'Envoyer',
        receive: 'Recevoir',
        topUp: 'Recharge',
        more: 'Plus',

        // Tabs
        home: 'Accueil',
        activity: 'Activité',
        scan: 'Scanner',
        cards: 'Cartes',
        profile: 'Profil',

        // Transactions
        recentTransactions: 'Transactions Récentes',
        viewAll: 'Voir Tout',
        received: 'Reçu',
        sent: 'Envoyé',
        completed: 'Terminé',
        pending: 'En cours',
        failed: 'Échoué',
        today: "Aujourd'hui",
        yesterday: 'Hier',
        noTransactions: 'Aucune transaction',
        noTransactionsDesc: 'Votre historique de transactions apparaîtra ici',

        // Send Money
        sendMoney: 'Envoyer de l\'Argent',
        recipient: 'Destinataire',
        recipientPlaceholder: '@utilisateur ou numéro de téléphone',
        amount: 'Montant',
        description: 'Description (optionnel)',
        descriptionPlaceholder: 'Pour quoi ?',
        continue: 'Continuer',
        confirmSend: 'Confirmer et Envoyer',
        fee: 'Frais',
        total: 'Total',
        sendSuccess: 'Argent envoyé avec succès !',
        sending: 'Envoi en cours...',

        // Request Money
        requestMoney: 'Demander de l\'Argent',
        requestFrom: 'Demander à',

        // Cards
        virtualCard: 'Carte Virtuelle',
        cardHolder: 'Titulaire',
        validThru: 'Exp.',
        getCard: 'Obtenez Votre Carte Virtuelle',
        getCardDesc: 'Utilisez votre carte virtuelle ClinoCash pour les paiements en ligne',

        // Profile
        personalInfo: 'Informations Personnelles',
        security: 'Sécurité',
        language: 'Langue',
        notifications: 'Notifications',
        linkedAccounts: 'Comptes Liés',
        helpSupport: 'Aide & Support',
        logout: 'Déconnexion',
        kycVerified: 'Vérifié',
        kycPending: 'Vérification en cours',

        // Promo
        promoTitle: 'Invitez vos amis, gagnez des récompenses',
        promoDesc: 'Recevez 5 GH₵ pour chaque ami inscrit',

        // Filters
        all: 'Tout',
        incoming: 'Entrant',
        outgoing: 'Sortant',
        cashIn: 'Dépôt',
        cashOut: 'Retrait',

        // Currency
        ghsCedi: 'Cédi Ghanéen',
        xofFranc: 'Franc CFA',
        usDollar: 'Dollar US',
    },
};

export function t(key, locale = 'en') {
    return translations[locale]?.[key] || translations.en[key] || key;
}

export function getGreeting(locale = 'en') {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting', locale);
    if (hour < 18) return t('greetingAfternoon', locale);
    return t('greetingEvening', locale);
}

export function formatCurrency(amount, currency = 'GHS', locale = 'en') {
    const config = {
        GHS: { symbol: 'GH₵', decimals: 2, locale: locale === 'fr' ? 'fr-GH' : 'en-GH' },
        XOF: { symbol: 'FCFA', decimals: 0, locale: locale === 'fr' ? 'fr-TG' : 'en-TG' },
        USD: { symbol: '$', decimals: 2, locale: locale === 'fr' ? 'fr-US' : 'en-US' },
    };

    const curr = config[currency] || config.GHS;

    const formatted = new Intl.NumberFormat(curr.locale, {
        minimumFractionDigits: curr.decimals,
        maximumFractionDigits: curr.decimals,
    }).format(amount);

    if (currency === 'XOF') return `${formatted} ${curr.symbol}`;
    return `${curr.symbol} ${formatted}`;
}

export function formatCurrencyParts(amount, currency = 'GHS') {
    const config = {
        GHS: { symbol: 'GH₵', decimals: 2 },
        XOF: { symbol: 'FCFA', decimals: 0 },
        USD: { symbol: '$', decimals: 2 },
    };

    const curr = config[currency] || config.GHS;
    const parts = amount.toFixed(curr.decimals).split('.');

    return {
        symbol: curr.symbol,
        whole: parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','),
        decimals: parts[1] || '',
        hasDecimals: curr.decimals > 0,
    };
}

export default translations;
