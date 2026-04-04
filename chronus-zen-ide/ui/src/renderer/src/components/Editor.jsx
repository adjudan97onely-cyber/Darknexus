/**
 * Editor — CodeMirror 6
 *
 * Fonctionnalités :
 *  - Coloration syntaxique GPC (StreamLanguage custom)
 *  - Numérotation des lignes
 *  - Highlight des erreurs / warnings du compiler (lintGutter + soulignement)
 *  - Auto-sauvegarde avec debounce 800 ms → fetch analyse → lint refresh
 *  - Sauvegarde manuelle Ctrl+S
 *  - Export .gpc
 *
 * Props :
 *  - script           : Script | null
 *  - onSave           : (content: string) => void
 *  - onAnalysisUpdate : (analysis) => void  — remonte l'analyse à AnalysisPanel
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import CodeMirror                                              from '@uiw/react-codemirror';
import { syntaxHighlighting }                                 from '@codemirror/language';
import { linter, lintGutter, forceLinting }                   from '@codemirror/lint';
import { oneDark }                                            from '@codemirror/theme-one-dark';
import { keymap }                                             from '@codemirror/view';
import { defaultKeymap }                                      from '@codemirror/commands';
import { gpcLanguage, gpcHighlightStyle }                     from '../lib/gpcLanguage';

// ── Debounce ──────────────────────────────────────────────────────────────────

function useDebounce(fn, delay) {
  const timerRef = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

// ── Composant ─────────────────────────────────────────────────────────────────

export default function Editor({ script, onSave, onAnalysisUpdate }) {
  const [dirty,        setDirty]        = useState(false);
  const [saveStatus,   setSaveStatus]   = useState('saved'); // 'saved' | 'dirty' | 'saving'
  const [exportStatus, setExportStatus] = useState(null);    // null | 'ok' | 'err'

  const contentRef  = useRef(script?.content ?? '');  // contenu courant (pas de re-render)
  const viewRef     = useRef(null);                    // instance CodeMirror View
  const analysisRef = useRef(null);                    // analyse courante (lue par linter)

  // Réinitialiser quand le script change (ID différent)
  useEffect(() => {
    contentRef.current  = script?.content ?? '';
    analysisRef.current = null;
    setDirty(false);
    setSaveStatus('saved');
  }, [script?.id]);

  // Synchroniser un changement de contenu externe (ex: auto-fix) dans CodeMirror
  // Ne s'applique que si le contenu du store diffère de ce qu'affiche l'éditeur
  useEffect(() => {
    if (!viewRef.current || !script) return;
    const editorDoc = viewRef.current.state.doc.toString();
    if (editorDoc !== script.content) {
      viewRef.current.dispatch({
        changes: { from: 0, to: editorDoc.length, insert: script.content },
      });
      contentRef.current = script.content;
      setDirty(false);
      setSaveStatus('saved');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script?.content]);

  // ── Auto-sauvegarde + analyse ─────────────────────────────────────────────

  const doSaveAndAnalyze = useCallback(async (content) => {
    if (!script) return;
    setSaveStatus('saving');
    try {
      await window.api.scripts.update(script.id, content);
      const analysis      = await window.api.analysis.get(script.id);
      analysisRef.current = analysis;
      onAnalysisUpdate?.(analysis);
      if (viewRef.current) forceLinting(viewRef.current);
    } catch {
      /* silencieux */
    } finally {
      setSaveStatus('saved');
      setDirty(false);
    }
  }, [script, onAnalysisUpdate]);

  const debouncedSave = useDebounce(doSaveAndAnalyze, 800);

  const handleChange = useCallback((value) => {
    contentRef.current = value;
    setDirty(true);
    setSaveStatus('dirty');
    debouncedSave(value);
  }, [debouncedSave]);

  const handleManualSave = useCallback(() => {
    onSave(contentRef.current);
    doSaveAndAnalyze(contentRef.current);
  }, [onSave, doSaveAndAnalyze]);

  const handleExport = useCallback(async () => {
    if (!script) return;
    const res = await window.api.scripts.exportGpc(script.id);
    setExportStatus(res.ok ? 'ok' : 'err');
    setTimeout(() => setExportStatus(null), 2500);
  }, [script]);

  // ── Linter CodeMirror ─────────────────────────────────────────────────────
  // Lit analysisRef.current (ref → pas de dépendance stale)

  const gpcLinter = useMemo(() => linter((view) => {
    const analysis = analysisRef.current;
    if (!analysis?.issues) return [];

    return analysis.issues
      .filter(i => i.line != null && i.line > 0)
      .map(i => {
        const lineNum = Math.max(1, Math.min(i.line, view.state.doc.lines));
        const line    = view.state.doc.line(lineNum);
        return {
          from:     line.from,
          to:       line.to,
          severity: i.severity === 'error' ? 'error' : 'warning',
          message:  i.message,
        };
      });
  }, { delay: 0 }), []);

  // Ctrl+S dans CodeMirror
  const saveKeymap = useMemo(() => keymap.of([{
    key: 'Mod-s',
    run: () => { handleManualSave(); return true; },
  }]), [handleManualSave]);

  const extensions = useMemo(() => [
    gpcLanguage,
    syntaxHighlighting(gpcHighlightStyle),
    lintGutter(),
    gpcLinter,
    saveKeymap,
    keymap.of(defaultKeymap),
  ], [gpcLinter, saveKeymap]);

  // ── Rendu ─────────────────────────────────────────────────────────────────

  if (!script) {
    return (
      <div className="editor editor-empty">
        <p>Sélectionnez un script pour l'éditer.</p>
      </div>
    );
  }

  const saveLabel =
    saveStatus === 'saving' ? '⟳ Sauvegarde…'
    : dirty                 ? '● Sauvegarder'
    :                         '✓ Sauvegardé';

  return (
    <div className="editor">
      <div className="editor-header">
        <span className="editor-filename">{script.name}</span>
        <span className="editor-meta">
          {new Date(script.updatedAt).toLocaleString('fr-FR')}
        </span>

        <button
          className={`btn-save ${dirty ? 'dirty' : ''}`}
          onClick={handleManualSave}
          disabled={!dirty && saveStatus !== 'dirty'}
          title="Ctrl+S"
        >
          {saveLabel}
        </button>

        <button
          className="btn-export"
          onClick={handleExport}
          title="Exporter en fichier .gpc (importable dans Zen Studio)"
        >
          {exportStatus === 'ok'  ? '✓ Exporté !'
         : exportStatus === 'err' ? '✗ Erreur'
         :                          '⬇ Export .gpc'}
        </button>
      </div>

      <CodeMirror
        key={script.id}
        value={script.content}
        extensions={extensions}
        theme={oneDark}
        onChange={handleChange}
        onCreateEditor={(view) => { viewRef.current = view; }}
        className="cm-editor-wrap"
        basicSetup={{
          lineNumbers:               true,
          foldGutter:                true,
          highlightActiveLine:       true,
          highlightSelectionMatches: true,
          autocompletion:            false,
          bracketMatching:           true,
          closeBrackets:             true,
          indentOnInput:             true,
          tabSize:                   2,
        }}
      />
    </div>
  );
}
