import { useState } from 'react';

/**
 * SlotSidebar
 *
 * Affiche les 8 slots Chronus Zen.
 * Supporte deux modes d'assignation :
 *  1. Clic → dropdown
 *  2. Drag-and-drop depuis ScriptList → drop sur le slot
 *
 * Aucune logique métier : délègue tout à onAssign(slotNumber, scriptId|null).
 */
export default function SlotSidebar({ slots, scripts, onAssign }) {
  const [openSlot,  setOpenSlot]  = useState(null);
  const [dragOver,  setDragOver]  = useState(null); // slotNumber survolé pendant drag

  const toggleSlot = (slotNumber) => {
    setOpenSlot(prev => (prev === slotNumber ? null : slotNumber));
  };

  const handleAssign = (slotNumber, scriptId) => {
    onAssign(slotNumber, scriptId);
    setOpenSlot(null);
  };

  // ── Drag-and-drop handlers ────────────────────────────────────────────────

  const handleDragOver = (e, slotNumber) => {
    // Vérifier que c'est bien notre type de données
    if (!e.dataTransfer.types.includes('application/chronus-script-id')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(slotNumber);
  };

  const handleDragLeave = (e) => {
    // Ignorer si on entre dans un enfant du slot
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragOver(null);
  };

  const handleDrop = (e, slotNumber) => {
    e.preventDefault();
    setDragOver(null);
    const scriptId = e.dataTransfer.getData('application/chronus-script-id');
    if (scriptId) handleAssign(slotNumber, scriptId);
  };

  return (
    <aside className="slot-sidebar">
      <div className="panel-header">
        Slots
        <span className="panel-hint">glisser un script ↓</span>
      </div>

      <div className="slots-list">
        {slots.map(slot => (
          <div
            key={slot.slotNumber}
            className={`slot-item ${dragOver === slot.slotNumber ? 'drag-over' : ''}`}
            onDragOver={e => handleDragOver(e, slot.slotNumber)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, slot.slotNumber)}
          >
            <button
              className={`slot-btn ${slot.script ? 'slot-filled' : 'slot-empty'}`}
              onClick={() => toggleSlot(slot.slotNumber)}
              title={slot.script ? `Slot ${slot.slotNumber} : ${slot.script.name}` : `Slot ${slot.slotNumber} — glisser un script ici`}
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
