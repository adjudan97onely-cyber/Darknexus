/**
 * Preload — Bridge sécurisé
 *
 * Expose window.api au renderer via contextBridge.
 * Le renderer ne peut accéder qu'aux méthodes listées ici :
 * aucun accès direct à Node.js ou au système de fichiers.
 *
 * Chaque méthode retourne une Promise (ipcRenderer.invoke).
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  scripts: {
    /** @returns {Promise<Script[]>} */
    getAll: () =>
      ipcRenderer.invoke('scripts:getAll'),

    /** @returns {Promise<Script>} */
    create: (name, content) =>
      ipcRenderer.invoke('scripts:create', { name, content }),

    /** @returns {Promise<Script>} */
    update: (id, content) =>
      ipcRenderer.invoke('scripts:update', { id, content }),

    /** @returns {Promise<Script>} */
    rename: (id, name) =>
      ipcRenderer.invoke('scripts:rename', { id, name }),

    /** @returns {Promise<{ok: boolean}>} */
    delete: (id) =>
      ipcRenderer.invoke('scripts:delete', { id }),

    /** @returns {Promise<{ok: boolean, filePath?: string, error?: string}>} */
    exportGpc: (id) =>
      ipcRenderer.invoke('scripts:exportGpc', { id }),

    /** @returns {Promise<{ok: boolean, scripts?: Script[], error?: string}>} */
    importGpc: () =>
      ipcRenderer.invoke('scripts:importGpc'),
  },

  slots: {
    /** @returns {Promise<SlotView[]>} */
    getAll: () =>
      ipcRenderer.invoke('slots:getAll'),

    /** @returns {Promise<{slot, analysis}>} */
    assign: (slotNumber, scriptId) =>
      ipcRenderer.invoke('slots:assign', { slotNumber, scriptId }),
  },

  analysis: {
    /** @returns {Promise<AnalysisResult>} */
    get: (scriptId) =>
      ipcRenderer.invoke('analysis:get', { scriptId }),
  },

  parser: {
    /**
     * Analyse structurelle d'un script GPC via ScriptParser.
     * @param {string} content
     * @returns {Promise<ParseResult>}
     */
    parse: (content) =>
      ipcRenderer.invoke('parser:parse', { content }),
  },

  features: {
    /**
     * Détection automatique des fonctionnalités via FeatureDetector.
     * @param {string}          content     — contenu brut du script
     * @param {ParseResult|null} parsedData — résultat ScriptParser (optionnel)
     * @returns {Promise<DetectionResult>}
     */
    detect: (content, parsedData = null) =>
      ipcRenderer.invoke('features:detect', { content, parsedData }),
  },

  /**
   * Explication intelligente d'un script via IA (ScriptExplainer).
   * @param {string}               content   — contenu brut
   * @param {ParseResult|null}     structure — résultat ScriptParser
   * @param {DetectionResult|null} features  — résultat FeatureDetector
   * @returns {Promise<ExplanationResult>}
   */
  explainScript: (content, structure = null, features = null) =>
    ipcRenderer.invoke('explain:script', { content, structure, features }),
});
