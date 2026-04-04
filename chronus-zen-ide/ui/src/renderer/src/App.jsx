import { useState, useEffect, useCallback } from 'react';
import SlotSidebar   from './components/SlotSidebar';
import ScriptList    from './components/ScriptList';
import Editor        from './components/Editor';
import AnalysisPanel from './components/AnalysisPanel';

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

  const handleImportGpc = useCallback(async () => {
    try {
      const res = await window.api.scripts.importGpc();
      if (!res.ok) return;
      await loadScripts();
      const count = res.scripts.length;
      flash(`${count} script${count > 1 ? 's' : ''} importé${count > 1 ? 's' : ''}.`);
    } catch (err) {
      flash(`Erreur import : ${err.message}`);
    }
  }, [loadScripts, flash]);

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
    <div className="app">
      <header className="app-header">
        <span className="app-logo">⬡ Chronus Zen IDE</span>
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
          <Editor
            script={selectedScript}
            onSave={handleSaveScript}
            onAnalysisUpdate={setAnalysis}
          />
          <AnalysisPanel analysis={analysis} />
        </div>
      </div>
    </div>
  );
}
