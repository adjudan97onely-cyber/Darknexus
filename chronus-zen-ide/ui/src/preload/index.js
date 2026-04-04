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

    /** @returns {Promise<{ok: boolean}>} */
    delete: (id) =>
      ipcRenderer.invoke('scripts:delete', { id }),

    /** @returns {Promise<{ok: boolean, filePath?: string, error?: string}>} */
    exportGpc: (id) =>
      ipcRenderer.invoke('scripts:exportGpc', { id }),
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
});
