import React from 'react';
import LotteryWorkbench from '../components/LotteryWorkbench';

export default function LotoAnalyzer() {
  return (
    <LotteryWorkbench
      lottery="loto"
      title="Loto Strategy Deck"
      description="Pilotage intelligent des grilles, heatmap des signaux stables et tracking de confiance pour chaque sélection."
      accent="from-amber-500 via-orange-500 to-rose-500"
    />
  );
}
