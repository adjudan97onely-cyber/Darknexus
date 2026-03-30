import React, { useEffect, useState } from 'react';
import { dashboardAPI, lotteryAPI } from '../services/api';

export default function RecentResults() {
  const [latest, setLatest] = useState([]);
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, per_page: 20 });

  useEffect(() => {
    async function load() {
      try {
        const [latestRes, recentRes] = await Promise.all([
          lotteryAPI.getLatestResults(),
          dashboardAPI.getRecentResultsPaginated(undefined, page, 20),
        ]);
        const latestData = latestRes.data;
        setLatest(Array.isArray(latestData) ? latestData : latestData?.lottery_type ? [latestData] : []);
        setResults(recentRes.data?.items || []);
        setMeta({ total: recentRes.data?.total || 0, per_page: recentRes.data?.per_page || 20 });
      } catch (err) {
        console.log('RecentResults load error:', err.message);
      }
    }
    load();
  }, [page]);

  const totalPages = Math.max(1, Math.ceil((meta.total || 0) / (meta.per_page || 20)));

  return (
    <div className="premium-shell space-y-8">
      <section className="premium-hero">
        <div>
          <p className="premium-kicker">Recent outcomes</p>
          <h1 className="premium-title">Résultats récents</h1>
          <p className="premium-subtitle">Suivi consolidé des derniers tirages et validations de résultats persistés.</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {latest.map((draw, idx) => (
          <div key={draw.id || draw.lottery_type || idx} className="premium-panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="premium-kicker">{draw.lottery_type}</p>
                <h2 className="text-2xl font-bold text-white">{draw.draw_date}</h2>
              </div>
              <span className="premium-badge">Dernier</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {(draw.numbers || []).map((number) => <span key={`${draw.lottery_type}-${number}`} className="premium-number-chip">{number}</span>)}
            </div>
          </div>
        ))}
      </section>

      <section className="premium-panel p-6">
        <div className="mb-5">
          <p className="premium-kicker">Tracking ledger</p>
          <h2 className="text-2xl font-bold text-white">Journal des résultats</h2>
        </div>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-slate-400">{meta.total} entrée(s)</div>
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
                <th>Type</th>
                <th>Date</th>
                <th>Résultat</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item) => (
                <tr key={item.id}>
                  <td>{item.type}</td>
                  <td>{item.draw_date}</td>
                  <td>{JSON.stringify(item.actual_result)}</td>
                  <td>{item.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
