import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/api';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [me, setMe] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadMe() {
      try {
        const response = await authAPI.me();
        setMe(response.data);
      } catch {
        setMe(null);
      }
    }
    loadMe();
  }, []);

  async function handleRegister() {
    try {
      const response = await authAPI.register(email, password);
      localStorage.setItem('alsp_token', response.data.token);
      setMe(response.data.user);
      setMessage('Compte créé et connecté.');
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Échec création compte');
    }
  }

  async function handleLogin() {
    try {
      const response = await authAPI.login(email, password);
      localStorage.setItem('alsp_token', response.data.token);
      setMe(response.data.user);
      setMessage('Connexion réussie.');
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Échec connexion');
    }
  }

  async function handleLogout() {
    try {
      await authAPI.logout();
    } catch {
      // no-op
    }
    localStorage.removeItem('alsp_token');
    setMe(null);
    setMessage('Déconnecté.');
  }

  return (
    <div className="premium-shell space-y-8">
      <section className="premium-hero">
        <div>
          <p className="premium-kicker">Account & Access</p>
          <h1 className="premium-title">Compte</h1>
          <p className="premium-subtitle">Gestion d'accès de la plateforme: inscription, connexion, session utilisateur.</p>
        </div>
      </section>

      <section className="premium-panel grid gap-6 p-6 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="premium-field">
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@domaine.com" />
          </label>
          <label className="premium-field">
            <span>Mot de passe</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8 caractères minimum" />
          </label>
          <div className="flex gap-3">
            <button className="premium-button" onClick={handleRegister}>Créer un compte</button>
            <button className="premium-button-secondary" onClick={handleLogin}>Se connecter</button>
          </div>
          {message ? <div className="premium-badge">{message}</div> : null}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="premium-kicker">Session</p>
          {me ? (
            <div className="mt-4 space-y-3 text-slate-300">
              <div><strong>ID:</strong> {me.id}</div>
              <div><strong>Email:</strong> {me.email}</div>
              <div><strong>Role:</strong> {me.role}</div>
              <div><strong>Créé le:</strong> {new Date(me.created_at).toLocaleString()}</div>
              <button className="premium-button-secondary" onClick={handleLogout}>Déconnexion</button>
            </div>
          ) : (
            <p className="mt-4 text-slate-400">Aucun utilisateur connecté.</p>
          )}
        </div>
      </section>
    </div>
  );
}
