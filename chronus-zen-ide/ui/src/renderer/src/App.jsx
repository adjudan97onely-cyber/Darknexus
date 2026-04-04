import { useState, useEffect, useCallback, useRef } from 'react';
import SlotSidebar      from './components/SlotSidebar';
import ScriptList       from './components/ScriptList';
import Editor           from './components/Editor';
import AnalysisPanel    from './components/AnalysisPanel';
import StructurePanel   from './components/StructurePanel';
import FeaturesPanel    from './components/FeaturesPanel';
import ExplanationPanel from './components/ExplanationPanel';
import DropZone         from './components/DropZone';
import { useFileImport } from './hooks/useFileImport';

/**
 * App — composant racine
 *
 * Gère l'état global et orchestre le flux de données.
 * Aucune logique métier ici : tout passe par window.api (preload bridge).
 *
 * Layout :
 *  ┌────────────┬───────────────┬───────────────────┐
 *  │ SlotSidebar│  ScriptList   │  Editor           │
 *  │  (190px)   │   (220px)     │  + AnalysisPanel  │
 *  └────────────┴───────────────┴───────────────────┘
 */
export default function App() {
  const [scripts,        setScripts]        = useState([]);
  const [slots,          setSlots]          = useState([]);
  const [selectedScript, setSelectedScript] = useState(null);
  const [analysis,       setAnalysis]       = useState(null);
  const [statusMsg,      setStatusMsg]      = useState('');
  const [globalDrag,     setGlobalDrag]     = useState(false); // overlay drag toute la fenêtre
  const [structure,      setStructure]      = useState(null);  // résultat ScriptParser
  const [showStructure,  setShowStructure]  = useState(false); // panneau structure visible
  const [featuresResult, setFeaturesResult] = useState(null);  // résultat FeatureDetector
  const [showFeatures,   setShowFeatures]   = useState(false); // panneau features visible
  const [explanation,    setExplanation]    = useState(null);  // résultat ScriptExplainer
  const [explainLoading, setExplainLoading] = useState(false); // loader appel IA
  const [showExplan,     setShowExplan]     = useState(false); // panneau explication visible
  const globalDragCounter                   = useRef(0);

  // ── Chargement initial ───────────────────────────────────────────────────

  const loadScripts = useCallback(async () => {
    const data = await window.api.scripts.getAll();
    setScripts(data);
  }, []);

  const loadSlots = useCallback(async () => {
    const data = await window.api.slots.getAll();
    setSlots(data);
  }, []);

  useEffect(() => {
    loadScripts();
    loadSlots();
  }, [loadScripts, loadSlots]);

  // ── Statut auto-effaçant ─────────────────────────────────────────────────

  const flash = useCallback((msg) => {
    setStatusMsg(msg);
    const t = setTimeout(() => setStatusMsg(''), 3000);
    return () => clearTimeout(t);
  }, []);

  // ── Actions scripts ──────────────────────────────────────────────────────

  const handleSelectScript = useCallback(async (script) => {
    setSelectedScript(script);
    try {
      const result = await window.api.analysis.get(script.id);
      setAnalysis(result);
    } catch {
      setAnalysis(null);
    }
  }, []);

  const handleCreateScript = useCallback(async (name) => {
    try {
      const script = await window.api.scripts.create(name, '');
      await loadScripts();
      setSelectedScript(script);
      setAnalysis(null);
      flash(`Script "${name}" créé.`);
    } catch (err) {
      flash(`Erreur : ${err.message}`);
    }
  }, [loadScripts, flash]);

  const handleSaveScript = useCallback(async (content) => {
    if (!selectedScript) return;
    try {
      const updated = await window.api.scripts.update(selectedScript.id, content);
      setSelectedScript(updated);
      await loadScripts();
      // Mettre à jour l'analyse après sauvegarde
      const result = await window.api.analysis.get(updated.id);
      setAnalysis(result);
      flash('Script sauvegardé.');
    } catch (err) {
      flash(`Erreur : ${err.message}`);
    }
  }, [selectedScript, loadScripts, flash]);

  const handleDeleteScript = useCallback(async (id) => {
    try {
      await window.api.scripts.delete(id);
      if (selectedScript?.id === id) {
        setSelectedScript(null);
        setAnalysis(null);
      }
      await loadScripts();
      await loadSlots();
      flash('Script supprimé.');
    } catch (err) {
      flash(`Erreur : ${err.message}`);
    }
  }, [selectedScript, loadScripts, loadSlots, flash]);

  const handleRenameScript = useCallback(async (id, name) => {
    try {
      const updated = await window.api.scripts.rename(id, name);
      if (selectedScript?.id === id) setSelectedScript(updated);
      await loadScripts();
      flash(`Script renommé en "${name}".`);
    } catch (err) {
      flash(`Erreur : ${err.message}`);
    }
  }, [selectedScript, loadScripts, flash]);
  // ── Analyse structurelle (ScriptParser) ──────────────────────────────────

  const handleAnalyzeStructure = useCallback(async () => {
    if (!selectedScript) return;
    try {
      const result = await window.api.parser.parse(selectedScript.content);
      setStructure(result);
      setShowStructure(true);
      setShowFeatures(false);
      setShowExplan(false);
    } catch (err) {
      flash(`Erreur structure : ${err.message}`);
    }
  }, [selectedScript, flash]);

  // ── Détection de fonctionnalités (FeatureDetector) ───────────────────────

  const handleDetectFeatures = useCallback(async () => {
    if (!selectedScript) return;
    try {
      const parsed = structure?.ok ? structure : null;
      const result = await window.api.features.detect(selectedScript.content, parsed);
      setFeaturesResult(result);
      setShowFeatures(true);
      setShowStructure(false);
      setShowExplan(false);
    } catch (err) {
      flash(`Erreur détection : ${err.message}`);
    }
  }, [selectedScript, structure, flash]);

  // ── Explication IA (ScriptExplainer) ─────────────────────────────────────

  const handleExplainScript = useCallback(async () => {
    if (!selectedScript) return;
    setShowExplan(true);
    setShowStructure(false);
    setShowFeatures(false);
    setExplainLoading(true);
    setExplanation(null);
    try {
      const parsed   = structure?.ok       ? structure       : null;
      const detected = featuresResult?.features ? featuresResult : null;
      const result   = await window.api.explainScript(
        selectedScript.content, parsed, detected
      );
      setExplanation(result);
    } catch (err) {
      setExplanation({ ok: false, error: err.message });
    } finally {
      setExplainLoading(false);
    }
  }, [selectedScript, structure, featuresResult]);

  // ── Import via dialog Electron (bouton ⬆ dans ScriptList) ─────────────────
  const handleImportGpc = useCallback(async () => {
    try {
      const res = await window.api.scripts.importGpc();
      if (!res.ok) return;
      await loadScripts();
      const count = res.scripts.length;
      flash(`${count} script${count > 1 ? 's' : ''} importé${count > 1 ? 's' : ''}.`);
      // Sélectionner le dernier script importé
      if (res.scripts.length > 0) {
        const last     = res.scripts[res.scripts.length - 1];
        const analysis = await window.api.analysis.get(last.id).catch(() => null);
        setSelectedScript(last);
        setAnalysis(analysis);
      }
    } catch (err) {
      flash(`Erreur import : ${err.message}`);
    }
  }, [loadScripts, flash]);

  // ── Callback partagé après import réussi (hook useFileImport) ───────────────
  const handleImported = useCallback(async (script, analysis) => {
    await loadScripts();
    setSelectedScript(script);
    setAnalysis(analysis);
    flash(`✓ Script importé : "${script.name}"`);
  }, [loadScripts, flash]);

  const handleImportError = useCallback((msg) => {
    flash(`✗ ${msg}`);
  }, [flash]);

  const { importFiles, importText } = useFileImport({
    onImported: handleImported,
    onError:    handleImportError,
  });

  // ── Ctrl+V global — coller un script depuis le presse-papiers ───────────
  useEffect(() => {
    const handlePaste = (e) => {
      // Ne pas intercepter si l'utilisateur colle dans un champ texte / CodeMirror
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const text = e.clipboardData?.getData('text/plain') ?? '';
      if (text.trim().length >= 5) {
        importText(text, 'Script collé');
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [importText]);

  // ── Drag global sur toute la fenêtre — affiche l'overlay DropZone ────────
  const handleGlobalDragEnter = useCallback((e) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    globalDragCounter.current++;
    setGlobalDrag(true);
  }, []);

  const handleGlobalDragLeave = useCallback((e) => {
    globalDragCounter.current--;
    if (globalDragCounter.current === 0) setGlobalDrag(false);
  }, []);

  const handleGlobalDragOver = useCallback((e) => {
    if (e.dataTransfer.types.includes('Files')) e.preventDefault();
  }, []);

  const handleGlobalDrop = useCallback((e) => {
    e.preventDefault();
    globalDragCounter.current = 0;
    setGlobalDrag(false);
    if (e.dataTransfer.files.length > 0) {
      importFiles(e.dataTransfer.files);
    }
  }, [importFiles]);

  // ── Actions slots ────────────────────────────────────────────────────────

  const handleAssignToSlot = useCallback(async (slotNumber, scriptId) => {
    try {
      const { analysis: a } = await window.api.slots.assign(slotNumber, scriptId);
      await loadSlots();
      if (a) setAnalysis(a);
      flash(
        scriptId
          ? `Script assigné au slot ${slotNumber}.`
          : `Slot ${slotNumber} libéré.`
      );
    } catch (err) {
      flash(`Erreur : ${err.message}`);
    }
  }, [loadSlots, flash]);

  // ── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div
      className="app"
      onDragEnter={handleGlobalDragEnter}
      onDragLeave={handleGlobalDragLeave}
      onDragOver={handleGlobalDragOver}
      onDrop={handleGlobalDrop}
    >
      <header className="app-header">
        <span className="app-logo">⬡ Chronus Zen IDE</span>

        {selectedScript && (
          <div className="app-header-actions">
            <button
              className={`btn-structure${showStructure ? ' btn-structure--active' : ''}`}
              onClick={showStructure ? () => setShowStructure(false) : handleAnalyzeStructure}
              title={showStructure ? 'Masquer la structure' : 'Analyser la structure du script'}
            >
              ⬡ Structure
            </button>
            <button
              className={`btn-structure${showFeatures ? ' btn-structure--active' : ''}`}
              onClick={showFeatures ? () => setShowFeatures(false) : handleDetectFeatures}
              title={showFeatures ? 'Masquer les fonctionnalités' : 'Détecter les fonctionnalités'}
            >
              ⊕ Features
            </button>
            <button
              className={`btn-structure btn-structure--explain${showExplan ? ' btn-structure--active' : ''}`}
              onClick={showExplan ? () => setShowExplan(false) : handleExplainScript}
              title={showExplan ? 'Masquer l\'explication' : 'Expliquer le script via IA'}
              disabled={explainLoading}
            >
              {explainLoading ? '⧙ IA...' : '⬡ Expliquer'}
            </button>
          </div>
        )}

        {statusMsg && <span className="app-status">{statusMsg}</span>}
      </header>

      <div className="app-layout">
        <SlotSidebar
          slots={slots}
          scripts={scripts}
          onAssign={handleAssignToSlot}
        />

        <ScriptList
          scripts={scripts}
          selectedId={selectedScript?.id}
          onSelect={handleSelectScript}
          onCreate={handleCreateScript}
          onDelete={handleDeleteScript}
          onRename={handleRenameScript}
          onImport={handleImportGpc}
        />

        <div className="main-panel">
          {selectedScript ? (
            <>
              <Editor
                script={selectedScript}
                onSave={handleSaveScript}
                onAnalysisUpdate={setAnalysis}
              />
              {showStructure && structure ? (
                <StructurePanel
                  result={structure}
                  onClose={() => setShowStructure(false)}
                />
              ) : showFeatures && featuresResult ? (
                <FeaturesPanel
                  result={featuresResult}
                  onClose={() => setShowFeatures(false)}
                />
              ) : showExplan ? (
                <ExplanationPanel
                  result={explanation}
                  loading={explainLoading}
                  onClose={() => setShowExplan(false)}
                />
              ) : (
                <AnalysisPanel analysis={analysis} />
              )}
            </>
          ) : (
            <DropZone
              onDrop={importFiles}
              onPicker={handleImportGpc}
            />
          )}
        </div>
      </div>

      {/* Overlay plein écran quand un fichier est glissé sur la fenêtre */}
      {globalDrag && (
        <div className="global-drop-overlay">
          <div className="global-drop-overlay__inner">
            <div className="global-drop-overlay__icon">⬇</div>
            <div className="global-drop-overlay__label">Déposer le fichier GPC</div>
          </div>
        </div>
      )}
    </div>
  );
}
