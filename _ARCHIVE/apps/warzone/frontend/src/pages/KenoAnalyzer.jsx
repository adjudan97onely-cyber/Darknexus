import React from 'react';
import LotteryWorkbench from '../components/LotteryWorkbench';

export default function KenoAnalyzer() {
  return (
    <LotteryWorkbench
      lottery="keno"
      title="Keno Predictive Lab"
      description="Moteur d'analyse multi-signaux avec auto-sélection, scoring de volatilité et historique des tirages récents."
      accent="from-cyan-500 via-sky-500 to-indigo-500"
    />
  );
}
