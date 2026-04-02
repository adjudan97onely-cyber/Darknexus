import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/apiService';

export default function PredictionHistory() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, per_page: 25 });
  const [filter, setFilter] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const response = await dashboardAPI.getPredictionHistoryPaginated(filter || undefined, page, 25);
        setItems(response.data?.items || []);
        setMeta({ total: response.data?.total || 0, per_page: response.data?.per_page || 25 });
      } catch (err) {
        console.log('PredictionHistory load error:', err.message);
      }
    }
    load();
  }, [filter, page]);

  const totalPages = Math.max(1, Math.ceil((meta.total || 0) / (meta.per_page || 25)));

  return (
    <div className="premium-shell space-y-8">
      <section className="premium-hero">
        <div>
          <p className="premium-kicker">Prediction ledger</p>
          <h1 className="premium-title">Historique des prédictions</h1>
          <p className="premium-subtitle">Toutes les sorties moteur, leur confiance, leur statut et leur score de validation.</p>
        </div>
        <label className="premium-field max-w-xs">
          <span>Filtre type</span>
          <select value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }}>
            <option value="">Tous</option>
            <option value="lottery">Lottery</option>
            <option value="sport">Sport</option>
            <option value="keno">Keno legacy</option>
            <option value="euromillions">EuroMillions legacy</option>
            <option value="loto">Loto legacy</option>
          </select>
        </label>
      </section>

      <section className="premium-panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-slate-400">{meta.total} prédiction(s)</div>
          <div className="flex items-center gap-2">
            <button className="premium-button-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))}>Précédent</button>
            <span className="premium-badge">Page {page}/{totalPages}</span>
            <button className="premium-button-secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Suivant</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Sous-type</th>
                <th>Confiance</th>
                <th>Score</th>
                <th>Statut</th>
                <th>Créée le</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>{item.type}</td>
                  <td>{item.subtype}</td>
                  <td>{item.confidence}%</td>
                  <td>{item.score}</td>
                  <td><span className={`premium-pill premium-pill-${item.status}`}>{item.status}</span></td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
