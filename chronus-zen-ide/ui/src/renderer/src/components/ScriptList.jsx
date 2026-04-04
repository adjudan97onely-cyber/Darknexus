import { useState } from 'react';

export default function ScriptList({ scripts, selectedId, onSelect, onCreate, onDelete, onRename, onImport }) {
  const [creating,   setCreating]   = useState(false);
  const [newName,    setNewName]    = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal,  setRenameVal]  = useState('');

  const handleDragStart = (e, script) => {
    setDraggingId(script.id);
    e.dataTransfer.effectAllowed = 'move';
    // Transporter l'id du script — lu par SlotSidebar au drop
    e.dataTransfer.setData('application/chronus-script-id', script.id);
    e.dataTransfer.setData('text/plain', script.name);
  };

  const handleDragEnd = () => setDraggingId(null);

  const startRename = (s) => {
    setRenamingId(s.id);
    setRenameVal(s.name);
  };

  const commitRename = () => {
    if (renameVal.trim()) onRename(renamingId, renameVal.trim());
    setRenamingId(null);
    setRenameVal('');
  };

  const handleRenameKey = (e) => {
    if (e.key === 'Enter')  commitRename();
    if (e.key === 'Escape') { setRenamingId(null); setRenameVal(''); }
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    onCreate(name);
    setNewName('');
    setCreating(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter')  handleCreate();
    if (e.key === 'Escape') { setCreating(false); setNewName(''); }
  };

  return (
    <section className="script-list">
      <div className="panel-header">
        Scripts
        <div className="panel-header-actions">
          <button
            className="btn-icon"
            title="Importer un fichier .gpc"
            onClick={onImport}
          >
            ⬆
          </button>
          <button
            className="btn-icon"
            title="Nouveau script"
            onClick={() => setCreating(c => !c)}
          >
            ＋
          </button>
        </div>
      </div>

      {creating && (
        <div className="create-form">
          <input
            className="create-input"
            placeholder="Nom du script…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <div className="create-actions">
            <button className="btn-primary" onClick={handleCreate}>Créer</button>
            <button className="btn-ghost"   onClick={() => { setCreating(false); setNewName(''); }}>Annuler</button>
          </div>
        </div>
      )}

      <ul className="scripts-ul">
        {scripts.length === 0 && (
          <li className="scripts-empty">Aucun script — cliquez sur ＋</li>
        )}

        {scripts.map(s => (
          <li
            key={s.id}
            draggable
            onDragStart={e => handleDragStart(e, s)}
            onDragEnd={handleDragEnd}
            className={`script-item ${selectedId === s.id ? 'selected' : ''} ${draggingId === s.id ? 'dragging' : ''}`}
            title="Glisser vers un slot pour assigner"
          >
            {renamingId === s.id ? (
              <input
                className="rename-input"
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onKeyDown={handleRenameKey}
                onBlur={commitRename}
                autoFocus
              />
            ) : (
              <button
                className="script-name-btn"
                onClick={() => onSelect(s)}
                onDoubleClick={() => startRename(s)}
                title="Clic: sélectionner — Double-clic: renommer"
              >
                <span className="script-icon drag-handle">⠿</span>
                <span className="script-label">{s.name}</span>
              </button>
            )}

            <button
              className="script-delete"
              title="Supprimer ce script"
              onClick={() => {
                if (window.confirm(`Supprimer "${s.name}" ?`)) onDelete(s.id);
              }}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
