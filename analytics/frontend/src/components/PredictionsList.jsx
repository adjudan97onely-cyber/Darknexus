import React from 'react';
import '../styles/PredictionsList.css';

export default function PredictionsList({ predictions = [] }) {
  if (!predictions || predictions.length === 0) {
    return (
      <div className="predictions-list">
        <div className="empty-state">
          <p>Aucune prédiction active</p>
        </div>
      </div>
    );
  }

  const formatNumbers = (numbers) => {
    if (!numbers) return '';
    return numbers.join(', ');
  };

  const formatType = (type) => {
    const types = {
      'keno': '🎰 Keno',
      'loto': '🎲 Loto',
      'euromillions': '⭐ EuroMillions',
      'football': '⚽ Football'
    };
    return types[type] || type;
  };

  return (
    <div className="predictions-list">
      <div className="predictions-header">
        <h3>Prédictions Actives ({predictions.length})</h3>
      </div>
      
      <div className="predictions-grid">
        {predictions.map((pred) => (
          <div key={pred.id} className="prediction-card">
            <div className="prediction-top">
              <span className="prediction-id">{pred.id}</span>
              <span className="prediction-type">{formatType(pred.type)}</span>
            </div>
            
            <div className="prediction-content">
              {pred.type === 'football' ? (
                <div className="prediction-match">
                  <p className="match-text">{pred.match}</p>
                  <p className="prediction-text">Prédiction: <strong>{pred.prediction}</strong></p>
                </div>
              ) : (
                <div className="prediction-numbers">
                  <p className="numbers-text">{formatNumbers(pred.numbers)}</p>
                  {pred.stars && <p className="stars-text">Stars: {formatNumbers(pred.stars)}</p>}
                </div>
              )}
            </div>
            
            <div className="prediction-footer">
              <div className="confidence">
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill" 
                    style={{ width: `${pred.confidence}%` }}
                  ></div>
                </div>
                <span className="confidence-text">{pred.confidence}%</span>
              </div>
              <span className={`status ${pred.status}`}>{pred.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
