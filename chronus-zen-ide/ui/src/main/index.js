/**
 * Main Process — Electron
 *
 * Responsabilités :
 *  1. Charger le backend (ProjectManager) via import() dynamique
 *     → le chemin est calculé à l'exécution pour préserver import.meta.url
 *       dans StorageManager (les données JSON restent au bon endroit)
 *  2. Enregistrer les handlers IPC (un par opération backend)
 *  3. Créer la BrowserWindow
 *
 * Flux : Renderer → Preload (contextBridge) → IPC → ici → ProjectManager
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path                                      = require('path');
const { pathToFileURL }                         = require('url');
const fs                                        = require('fs');

// ── Backend ───────────────────────────────────────────────────────────────────
// __dirname en dev/build = ui/out/main/
// 3 niveaux plus haut    = chronus-zen-ide/

let projectManager;

async function loadBackend() {
  const ideRoot = path.join(__dirname, '../../..');
  const entry   = path.join(ideRoot, 'src', 'core', 'ProjectManager.js');
  const mod     = await import(pathToFileURL(entry).href);
  projectManager = mod.projectManager;
}

// ── IPC Handlers ──────────────────────────────────────────────────────────────

function registerIpc() {
  // ── Scripts ──────────────────────────────────────────────────────────────
  ipcMain.handle('scripts:getAll', () =>
    projectManager.getAllScripts().map(s => s.toJSON())
  );

  ipcMain.handle('scripts:create', (_, { name, content }) => {
    const script = projectManager.createScript(name, content);
    return script.toJSON();
  });

  ipcMain.handle('scripts:update', (_, { id, content }) => {
    const script = projectManager.updateScript(id, content);
    return script.toJSON();
  });

  ipcMain.handle('scripts:delete', (_, { id }) => {
    projectManager.deleteScript(id);
    return { ok: true };
  });

  // ── Slots ─────────────────────────────────────────────────────────────────
  ipcMain.handle('slots:getAll', () =>
    projectManager.getSlots().map(sl => ({
      slotNumber: sl.slotNumber,
      scriptId:   sl.scriptId,
      script:     sl.script ? sl.script.toJSON() : null,
    }))
  );

  ipcMain.handle('slots:assign', (_, { slotNumber, scriptId }) => {
    const { slot, analysis } = projectManager.assignScriptToSlot(slotNumber, scriptId);
    return {
      slot: slot.toJSON(),
      analysis,
    };
  });

  // ── Analyse ───────────────────────────────────────────────────────────────
  ipcMain.handle('analysis:get', (_, { scriptId }) =>
    projectManager.getScriptAnalysis(scriptId)
  );

  // ── Export .gpc ───────────────────────────────────────────────────────────
  ipcMain.handle('scripts:exportGpc', async (_, { id }) => {
    const script = projectManager.getScriptById(id);
    if (!script) return { ok: false, error: 'Script introuvable' };

    const { canceled, filePath } = await dialog.showSaveDialog({
      title:       'Exporter le script GPC',
      defaultPath: `${script.name}.gpc`,
      filters:     [{ name: 'Fichier GPC', extensions: ['gpc'] }],
    });

    if (canceled || !filePath) return { ok: false, error: 'Annulé' };

    fs.writeFileSync(filePath, script.content, 'utf8');
    return { ok: true, filePath };
  });
}

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow() {
  const win = new BrowserWindow({
    width:           1280,
    height:          800,
    minWidth:        900,
    minHeight:       600,
    title:           'Chronus Zen IDE',
    backgroundColor: '#0f0f1a',
    webPreferences: {
      preload:          path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
    },
  });

  // En dev, electron-vite injecte ELECTRON_RENDERER_URL
  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL']);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

// ── Startup ───────────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  await loadBackend();
  registerIpc();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
