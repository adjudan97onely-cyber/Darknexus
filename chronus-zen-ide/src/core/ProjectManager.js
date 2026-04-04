/**
 * ProjectManager — Couche Core
 *
 * Toute la logique métier passe ici. C'est l'unique point d'entrée
 * pour les mutations d'état (scripts, slots).
 *
 * Responsabilités :
 *  - Charger l'état depuis le storage au démarrage
 *  - Exposer les opérations CRUD sur les scripts
 *  - Gérer l'assignation des scripts aux slots
 *  - Persister après chaque mutation
 *
 * Ce module ne connaît pas l'UI.
 */

import { Script }   from '../models/Script.js';
import { Slot }     from '../models/Slot.js';
import { storage }  from '../storage/StorageManager.js';
import { compiler } from '../compiler/GpcCompiler.js';

const SCRIPTS_FILE = 'scripts.json';
const SLOTS_FILE   = 'slots.json';
const MAX_SLOTS    = 8;

class ProjectManager {
  constructor() {
    /** @type {Script[]} */
    this._scripts = [];
    /** @type {Slot[]} */
    this._slots = [];
    /**
     * Cache des résultats d'analyse — scriptId → AnalysisResult.
     * Recalculé à chaque assignation, jamais persisté (dérivé du contenu).
     * @type {Map<string, import('../compiler/GpcCompiler.js').AnalysisResult>}
     */
    this._analysisCache = new Map();

    this._load();
  }

  // ─── Initialisation ───────────────────────────────────────────────────────

  _load() {
    // Scripts
    const rawScripts = storage.load(SCRIPTS_FILE, []);
    this._scripts = rawScripts.map(s => new Script(s));

    // Slots — on garantit toujours les 8 emplacements,
    // même si le fichier est vide ou incomplet.
    const rawSlots = storage.load(SLOTS_FILE, []);
    this._slots = Array.from({ length: MAX_SLOTS }, (_, i) => {
      const slotNumber = i + 1;
      const saved = rawSlots.find(sl => sl.slotNumber === slotNumber);
      return saved ? new Slot(saved) : new Slot({ slotNumber });
    });
  }

  // ─── Persistance ──────────────────────────────────────────────────────────

  _saveScripts() {
    storage.save(SCRIPTS_FILE, this._scripts.map(s => s.toJSON()));
  }

  _saveSlots() {
    storage.save(SLOTS_FILE, this._slots.map(sl => sl.toJSON()));
  }

  // ─── Scripts ──────────────────────────────────────────────────────────────

  /**
   * Crée un nouveau script et le persiste.
   * @param {string} name
   * @param {string} [content='']
   * @returns {Script}
   */
  createScript(name, content = '') {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Le nom du script est obligatoire.');
    }

    const script = Script.create(name, content);
    this._scripts.push(script);
    this._saveScripts();

    return script;
  }

  /**
   * Met à jour le contenu d'un script existant.
   * @param {string} id
   * @param {string} newContent
   * @returns {Script}
   */
  updateScript(id, newContent) {
    const script = this._findScriptOrThrow(id);
    script.content   = newContent;
    script.updatedAt = new Date().toISOString();
    this._saveScripts();

    return script;
  }

  /**
   * Supprime un script.
   * Les slots qui référençaient ce script sont automatiquement libérés.
   * @param {string} id
   */
  deleteScript(id) {
    const index = this._scripts.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error(`Script introuvable : ${id}`);
    }

    this._scripts.splice(index, 1);
    this._analysisCache.delete(id);

    // Libérer les slots qui pointaient vers ce script
    let slotsChanged = false;
    this._slots.forEach(slot => {
      if (slot.scriptId === id) {
        slot.scriptId = null;
        slotsChanged = true;
      }
    });

    this._saveScripts();
    if (slotsChanged) this._saveSlots();
  }

  /**
   * Retourne une copie de la liste de tous les scripts.
   * @returns {Script[]}
   */
  getAllScripts() {
    return [...this._scripts];
  }

  /**
   * Retourne un script par son ID, ou null s'il n'existe pas.
   * @param {string} id
   * @returns {Script|null}
   */
  getScriptById(id) {
    return this._scripts.find(s => s.id === id) ?? null;
  }

  // ─── Slots ────────────────────────────────────────────────────────────────

  /**
   * Assigne un script à un slot (ou libère un slot si scriptId = null).
   * Déclenche automatiquement l'analyse du script assigné.
   *
   * @param {number}      slotNumber  - 1 à 8
   * @param {string|null} scriptId    - null pour vider le slot
   * @returns {{ slot: Slot, analysis: import('../compiler/GpcCompiler.js').AnalysisResult|null }}
   */
  assignScriptToSlot(slotNumber, scriptId) {
    if (!Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > MAX_SLOTS) {
      throw new Error(`Numéro de slot invalide : ${slotNumber}. Doit être entre 1 et ${MAX_SLOTS}.`);
    }

    let analysis = null;

    if (scriptId !== null) {
      const script = this._findScriptOrThrow(scriptId);
      // Auto-compilation : analyse immédiate, résultat mis en cache
      analysis = compiler.analyze(script);
      this._analysisCache.set(scriptId, analysis);
    }

    const slot = this._slots.find(sl => sl.slotNumber === slotNumber);
    slot.scriptId = scriptId;
    this._saveSlots();

    return { slot, analysis };
  }

  /**
   * Retourne les 8 slots enrichis avec le script associé.
   * @returns {Array<{slotNumber: number, scriptId: string|null, script: Script|null}>}
   */
  getSlots() {
    return this._slots.map(sl => ({
      slotNumber: sl.slotNumber,
      scriptId:   sl.scriptId,
      script:     sl.scriptId ? this.getScriptById(sl.scriptId) : null,
    }));
  }

  // ─── Analyse ───────────────────────────────────────────────────────────────

  /**
   * Retourne le résultat de compilation d'un script.
   * Si le script n'a jamais été assigné à un slot (donc jamais compilé),
   * l'analyse est lancée à la demande et mise en cache.
   *
   * @param {string} scriptId
   * @returns {import('../compiler/GpcCompiler.js').AnalysisResult}
   */
  getScriptAnalysis(scriptId) {
    this._findScriptOrThrow(scriptId); // valide l'existence

    if (!this._analysisCache.has(scriptId)) {
      const script = this.getScriptById(scriptId);
      this._analysisCache.set(scriptId, compiler.analyze(script));
    }

    return this._analysisCache.get(scriptId);
  }

  // ─── Helpers privés ───────────────────────────────────────────────────────

  _findScriptOrThrow(id) {
    const script = this._scripts.find(s => s.id === id);
    if (!script) {
      throw new Error(`Script introuvable : ${id}`);
    }
    return script;
  }
}

/** Singleton partagé dans l'application */
export const projectManager = new ProjectManager();
