import React from 'react';

export default function StatCard({ label, value, hint, tone = 'cyan' }) {
  const toneClass = {
    cyan: 'from-cyan-500/25 to-sky-500/10 text-cyan-200 border-cyan-400/20',
    emerald: 'from-emerald-500/25 to-green-500/10 text-emerald-200 border-emerald-400/20',
    amber: 'from-amber-500/25 to-orange-500/10 text-amber-200 border-amber-400/20',
    rose: 'from-rose-500/25 to-pink-500/10 text-rose-200 border-rose-400/20',
    violet: 'from-violet-500/25 to-indigo-500/10 text-violet-200 border-violet-400/20',
  };

  return (
    <div className={`rounded-3xl border bg-gradient-to-br ${toneClass[tone]} p-5 shadow-[0_24px_80px_rgba(8,15,35,0.24)] backdrop-blur`}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="text-4xl font-extrabold text-white">{value}</div>
        {hint ? <div className="text-right text-xs text-slate-400">{hint}</div> : null}
      </div>
    </div>
  );
}
