import { useState } from 'react';

/**
 * SlotSidebar
 *
 * Affiche les 8 slots Chronus Zen.
 * Cliquer sur un slot ouvre un dropdown pour :
 *  - assigner un script existant
 *  - libérer le slot (si occupé)
 *
 * Aucune logique métier : délègue tout à onAssign(slotNumber, scriptId|null).
 */
export default function SlotSidebar({ slots, scripts, onAssign }) {
  const [openSlot, setOpenSlot] = useState(null);

  const toggleSlot = (slotNumber) => {
    setOpenSlot(prev => (prev === slotNumber ? null : slotNumber));
  };

  const handleAssign = (slotNumber, scriptId) => {
    onAssign(slotNumber, scriptId);
    setOpenSlot(null);
  };

  return (
    <aside className="slot-sidebar">
      <div className="panel-header">Slots</div>

      <div className="slots-list">
        {slots.map(slot => (
          <div key={slot.slotNumber} className="slot-item">
            <button
              className={`slot-btn ${slot.script ? 'slot-filled' : 'slot-empty'}`}
              onClick={() => toggleSlot(slot.slotNumber)}
              title={slot.script ? `Slot ${slot.slotNumber} : ${slot.script.name}` : `Slot ${slot.slotNumber} : vide`}
            >
              <span className="slot-number">{slot.slotNumber}</span>
              <span className="slot-name">
                {slot.script ? slot.script.name : '— vide —'}
              </span>
              <span className="slot-indicator">
                {slot.script ? '●' : '○'}
              </span>
            </button>

            {openSlot === slot.slotNumber && (
              <div className="slot-dropdown">
                {slot.script && (
                  <button
                    className="slot-action remove"
                    onClick={() => handleAssign(slot.slotNumber, null)}
                  >
                    ✕ Libérer le slot
                  </button>
                )}

                <div className="slot-dropdown-label">Assigner un script</div>

                {scripts.length === 0 ? (
                  <div className="slot-dropdown-empty">Aucun script disponible</div>
                ) : (
                  scripts.map(s => (
                    <button
                      key={s.id}
                      className={`slot-script-option ${slot.scriptId === s.id ? 'active' : ''}`}
                      onClick={() => handleAssign(slot.slotNumber, s.id)}
                    >
                      {s.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
