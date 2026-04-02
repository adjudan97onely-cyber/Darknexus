import React from 'react';
import LotteryWorkbench from '../components/LotteryWorkbench';

export default function EuroMillionsAnalyzer() {
  return (
    <LotteryWorkbench
      lottery="euromillions"
      title="EuroMillions Signal Suite"
      description="Vue premium pour détecter les séquences fortes, filtrer les numéros instables et générer des sélections plus disciplinées."
      accent="from-fuchsia-500 via-violet-500 to-indigo-500"
    />
  );
}
