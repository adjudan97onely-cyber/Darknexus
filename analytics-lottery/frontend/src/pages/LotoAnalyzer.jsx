import React from 'react';
import LotteryWorkbench from '../components/LotteryWorkbench';
import QuickActionBar from '../components/QuickActionBar';

export default function LotoAnalyzer() {
  return (
    <>
      <div className="premium-shell pb-4">
        <QuickActionBar />
      </div>
      <LotteryWorkbench
        lottery="loto"
        title="Loto Strategy Deck"
        description="Pilotage intelligent des grilles, heatmap des signaux stables et tracking de confiance pour chaque sélection."
        accent="from-amber-500 via-orange-500 to-rose-500"
      />
    </>
  );
}
