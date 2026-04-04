import { useState, useEffect } from 'react';

/**
 * Editor
 *
 * Zone d'édition du contenu d'un script GPC.
 *
 * Fonctionnalités :
 *  - Synchronisation avec le script sélectionné (prop)
 *  - Détection de modifications non sauvegardées (dirty state)
 *  - Sauvegarde via Ctrl+S ou bouton
 *  - Touche Tab → 2 espaces (comportement IDE)
 *
 * Props :
 *  - script : Script | null
 *  - onSave : (content: string) => void
 */
export default function Editor({ script, onSave }) {
  const [content, setContent] = useState('');
  const [dirty,   setDirty]   = useState(false);

  // Réinitialiser quand le script sélectionné change
  useEffect(() => {
    setContent(script?.content ?? '');
    setDirty(false);
  }, [script?.id]);

  const handleChange = (e) => {
    setContent(e.target.value);
    setDirty(true);
  };

  const handleSave = () => {
    onSave(content);
    setDirty(false);
  };

  const handleKeyDown = (e) => {
    // Ctrl+S / Cmd+S → sauvegarde
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (dirty) handleSave();
      return;
    }

    // Tab → 2 espaces (sans perdre le focus)
    if (e.key === 'Tab') {
      e.preventDefault();
      const el    = e.target;
      const start = el.selectionStart;
      const end   = el.selectionEnd;
      const next  = content.slice(0, start) + '  ' + content.slice(end);
      setContent(next);
      setDirty(true);
      requestAnimationFrame(() => {
        el.selectionStart = start + 2;
        el.selectionEnd   = start + 2;
      });
    }
  };

  if (!script) {
    return (
      <div className="editor editor-empty">
        <p>Sélectionnez un script pour l'éditer.</p>
      </div>
    );
  }

  return (
    <div className="editor">
      <div className="editor-header">
        <span className="editor-filename">{script.name}</span>
        <span className="editor-meta">
          Modifié le {new Date(script.updatedAt).toLocaleString('fr-FR')}
        </span>
        <button
          className={`btn-save ${dirty ? 'dirty' : ''}`}
          onClick={handleSave}
          disabled={!dirty}
          title="Ctrl+S"
        >
          {dirty ? '● Sauvegarder' : '✓ Sauvegardé'}
        </button>
      </div>

      <textarea
        className="editor-textarea"
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        placeholder="// Écrire le script GPC ici…"
      />
    </div>
  );
}
