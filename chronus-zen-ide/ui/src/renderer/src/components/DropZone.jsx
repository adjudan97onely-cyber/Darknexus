/**
 * DropZone — Zone de dépôt de fichiers GPC
 *
 * Affichée dans l'éditeur quand aucun script n'est sélectionné.
 * Accepte le drag-and-drop de fichiers ET le clic (file picker natif).
 *
 * Délègue toute la logique d'import au hook useFileImport via la prop onDrop.
 *
 * Props :
 *  onDrop    : (files: FileList) => void
 *  onPicker  : () => void   — déclenche le file picker natif (Electron dialog)
 */

import { useState, useRef } from 'react';

export default function DropZone({ onDrop, onPicker }) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0); // évite les faux onDragLeave (enfants)

  // ── Drag handlers ─────────────────────────────────────────────────────────

  const onDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      onDrop(e.dataTransfer.files);
    }
  };

  // ── File picker HTML (fallback si Electron dialog non dispo) ──────────────

  const inputRef = useRef(null);

  const handleInputChange = (e) => {
    if (e.target.files.length > 0) {
      onDrop(e.target.files);
      e.target.value = ''; // reset pour permettre re-import du même fichier
    }
  };

  const handleClick = () => {
    // Priorité au dialog Electron natif, sinon input HTML
    if (onPicker) {
      onPicker();
    } else {
      inputRef.current?.click();
    }
  };

  return (
    <div
      className={`drop-zone ${isDragging ? 'drop-zone--active' : ''}`}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      aria-label="Zone de dépôt de fichiers GPC"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".gpc,.txt,.c,.h,text/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      <div className="drop-zone__icon">
        {isDragging ? '⬇' : '⬡'}
      </div>

      <div className="drop-zone__title">
        {isDragging ? 'Relâcher pour importer' : 'Glisser un script ici'}
      </div>

      <div className="drop-zone__sub">
        Accepte .gpc · .txt · .c — ou cliquer pour parcourir
      </div>

      <div className="drop-zone__hint">
        Ou <kbd>Ctrl+V</kbd> pour coller un script depuis le presse-papiers
      </div>
    </div>
  );
}
