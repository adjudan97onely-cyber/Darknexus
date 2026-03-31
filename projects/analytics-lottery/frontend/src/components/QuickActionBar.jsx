import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, BarChart3, Brain } from 'lucide-react';

/**
 * QuickActionBar - Barre de 3 actions principales
 * Ajouter en haut de chaque page pour clarté UX
 */
export default function QuickActionBar() {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'play',
      label: 'Jouer Maintenant',
      icon: Play,
      color: 'emerald',
      description: 'Génère tes prédictions',
      action: () => navigate('/hub?mode=play'),
    },
    {
      id: 'results',
      label: 'Mes Résultats',
      icon: BarChart3,
      color: 'cyan',
      description: 'Compare prédictions vs réalité',
      action: () => navigate('/hub?mode=results'),
    },
    {
      id: 'analysis',
      label: 'Analyse IA',
      icon: Brain,
      color: 'violet',
      description: 'Tendances & alertes',
      action: () => navigate('/hub?mode=analysis'),
    },
  ];

  const borderColors = {
    emerald: 'border-emerald-500/30 hover:border-emerald-500/60',
    cyan: 'border-cyan-500/30 hover:border-cyan-500/60',
    violet: 'border-violet-500/30 hover:border-violet-500/60',
  };

  const bgColors = {
    emerald: 'bg-emerald-500/5 hover:bg-emerald-500/10',
    cyan: 'bg-cyan-500/5 hover:bg-cyan-500/10',
    violet: 'bg-violet-500/5 hover:bg-violet-500/10',
  };

  return (
    <div className="grid grid-cols-3 gap-3 mb-8">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={action.action}
            className={`border-2 rounded-xl p-4 transition-all duration-300 ${borderColors[action.color]} ${bgColors[action.color]}`}
          >
            <div className="flex flex-col items-center gap-2">
              <Icon className="w-6 h-6" />
              <div className="text-sm font-semibold text-white">{action.label}</div>
              <div className="text-xs text-slate-400 text-center leading-tight">{action.description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
