import React from 'react';
import LotteryWorkbench from '../components/LotteryWorkbench';
import QuickActionBar from '../components/QuickActionBar';

export default function EuroMillionsAnalyzer() {
  return (
    <>
      <div className="premium-shell pb-4">
        <QuickActionBar />
      </div>
      <LotteryWorkbench
        lottery="euromillions"
        title="EuroMillions Signal Suite"
        description="Vue premium pour détecter les séquences fortes, filtrer les numéros instables et générer des sélections plus disciplinées."
        accent="from-fuchsia-500 via-violet-500 to-indigo-500"
      />
    </>
  );
}
