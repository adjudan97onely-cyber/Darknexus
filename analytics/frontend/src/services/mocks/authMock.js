// Mock Auth — Utilisateur de démo (mode sans backend auth)

export const authMock = {
  user: {
    id: 'demo-user-001',
    email: 'demo@analytics-lottery.fr',
    name: 'Utilisateur Démo',
    role: 'user',
    subscription: 'free',
    created_at: '2026-01-15T10:00:00',
    last_login: '2026-04-02T08:30:00',
    preferences: {
      default_lottery: 'keno',
      notifications: true,
      language: 'fr',
    },
  },

  loginSuccess: {
    access_token: 'demo-token-not-real',
    token_type: 'bearer',
    user: {
      id: 'demo-user-001',
      email: 'demo@analytics-lottery.fr',
      name: 'Utilisateur Démo',
      role: 'user',
      subscription: 'free',
    },
  },
};
