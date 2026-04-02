// Mock Subscription — Plans et abonnement courant

export const subscriptionMock = {
  plans: [
    {
      id: 'free',
      name: 'Gratuit',
      price: 0,
      currency: 'EUR',
      period: 'mois',
      features: [
        'Accès Keno (données réelles FDJ)',
        'Analyse statistique basique',
        '3 grilles / jour',
        'Historique 7 jours',
      ],
      limits: { grids_per_day: 3, history_days: 7, sports_predictions: 5 },
      popular: false,
      color: 'slate',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 9.99,
      currency: 'EUR',
      period: 'mois',
      features: [
        'Tout le plan Gratuit',
        'Loto + EuroMillions complets',
        'Prédictions football illimitées',
        '20 grilles / jour',
        'Historique 90 jours',
        'Alertes personnalisées',
      ],
      limits: { grids_per_day: 20, history_days: 90, sports_predictions: -1 },
      popular: true,
      color: 'cyan',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 24.99,
      currency: 'EUR',
      period: 'mois',
      features: [
        'Tout le plan Pro',
        'Grilles illimitées',
        'Backtesting avancé',
        'API accès direct',
        'Support prioritaire',
        'Historique illimité',
        'Export CSV/JSON',
      ],
      limits: { grids_per_day: -1, history_days: -1, sports_predictions: -1 },
      popular: false,
      color: 'amber',
    },
  ],

  current: {
    plan: 'free',
    status: 'active',
    started_at: '2026-01-15T00:00:00',
    renews_at: null,
    usage: { grids_today: 1, predictions_this_week: 3 },
  },
};
