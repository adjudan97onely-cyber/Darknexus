import React, { useEffect, useState } from 'react';
import { subscriptionAPI } from '../services/api';

export default function BillingPage() {
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      const planRes = await subscriptionAPI.getPlans();
      setPlans(planRes.data || []);
      try {
        const currentRes = await subscriptionAPI.getCurrent();
        setCurrent(currentRes.data);
      } catch {
        setCurrent(null);
      }
    }
    load();
  }, []);

  async function upgrade(plan) {
    try {
      const response = await subscriptionAPI.upgrade(plan);
      setCurrent(response.data);
      setMessage(`Plan mis à jour: ${plan}`);
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Connexion requise pour upgrader');
    }
  }

  return (
    <div className="premium-shell space-y-8">
      <section className="premium-hero">
        <div>
          <p className="premium-kicker">Subscription</p>
          <h1 className="premium-title">Abonnement</h1>
          <p className="premium-subtitle">Préparation SaaS: plans, évolution de compte et statut d'accès à la plateforme.</p>
        </div>
      </section>

      {message ? <div className="premium-badge">{message}</div> : null}

      <section className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.code} className="premium-panel p-6">
            <div className="premium-kicker">{plan.code}</div>
            <h2 className="mt-3 text-3xl font-bold text-white">{plan.name}</h2>
            <p className="mt-2 text-slate-400">{plan.price_month} EUR / mois</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {plan.features.map((feature) => <li key={feature}>• {feature}</li>)}
            </ul>
            <button className="premium-button mt-6" onClick={() => upgrade(plan.code)}>Activer</button>
          </div>
        ))}
      </section>

      <section className="premium-panel p-6">
        <p className="premium-kicker">Current plan</p>
        {current ? (
          <div className="mt-4 grid gap-2 text-slate-300 md:grid-cols-4">
            <div><strong>Plan:</strong> {current.plan}</div>
            <div><strong>Status:</strong> {current.status}</div>
            <div><strong>Start:</strong> {new Date(current.started_at).toLocaleString()}</div>
            <div><strong>Expire:</strong> {current.expires_at ? new Date(current.expires_at).toLocaleString() : 'N/A'}</div>
          </div>
        ) : (
          <div className="mt-4 text-slate-400">Connecte-toi pour voir et modifier ton abonnement.</div>
        )}
      </section>
    </div>
  );
}
