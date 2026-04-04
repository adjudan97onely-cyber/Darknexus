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

// ── Chargement du .env (lecture manuelle, sans dépendance dotenv) ─────────────
// Cherche .env dans la racine de l'IDE (3 niveaux au-dessus du main compilé)
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '../../../.env');
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx < 1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !(key in process.env)) process.env[key] = val;
    }
  } catch { /* .env absent ou illisible — pas bloquant */ }
}
loadEnvFile();

// ── Backend ───────────────────────────────────────────────────────────────────
// __dirname en dev/build = ui/out/main/
// 3 niveaux plus haut    = chronus-zen-ide/

let projectManager;
let scriptParser;
let featureDetector;
let scriptExplainer;
let compiler;

async function loadBackend() {
  const ideRoot = path.join(__dirname, '../../..');

  const pmEntry = path.join(ideRoot, 'src', 'core', 'ProjectManager.js');
  const pmMod   = await import(pathToFileURL(pmEntry).href);
  projectManager = pmMod.projectManager;

  const spEntry = path.join(ideRoot, 'src', 'compiler', 'ScriptParser.js');
  const spMod   = await import(pathToFileURL(spEntry).href);
  scriptParser  = spMod.scriptParser;

  const fdEntry = path.join(ideRoot, 'src', 'compiler', 'FeatureDetector.js');
  const fdMod   = await import(pathToFileURL(fdEntry).href);
  featureDetector = fdMod.featureDetector;

  const seEntry = path.join(ideRoot, 'src', 'compiler', 'ScriptExplainer.js');
  const seMod   = await import(pathToFileURL(seEntry).href);
  scriptExplainer = seMod.scriptExplainer;

  const gcEntry = path.join(ideRoot, 'src', 'compiler', 'GpcCompiler.js');
  const gcMod   = await import(pathToFileURL(gcEntry).href);
  compiler = gcMod.compiler;
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

  ipcMain.handle('scripts:rename', (_, { id, name }) => {
    const script = projectManager.renameScript(id, name);
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

  // ── Analyse GPC ──────────────────────────────────────────────────────────
  ipcMain.handle('analysis:get', (_, { scriptId }) =>
    projectManager.getScriptAnalysis(scriptId)
  );

  // ── Correction automatique E002 (GpcCompiler.fix) ─────────────────────────
  ipcMain.handle('compiler:fix', (_, { content }) =>
    compiler.fix(content)
  );

  // ── Analyse structurelle (ScriptParser) ──────────────────────────────────
  ipcMain.handle('parser:parse', (_, { content }) =>
    scriptParser.parse(content)
  );

  // ── Détection de fonctionnalités (FeatureDetector) ─────────────────────────
  ipcMain.handle('features:detect', (_, { content, parsedData }) =>
    featureDetector.detectFeatures(content, parsedData ?? null)
  );

  // ── Explication IA (ScriptExplainer) ──────────────────────────────────
  ipcMain.handle('explain:script', (_, { content, structure, features }) =>
    scriptExplainer.explainScript({ content, structure, features })
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

  // ── Import .gpc ───────────────────────────────────────────────────────────
  ipcMain.handle('scripts:importGpc', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title:       'Importer un script GPC',
      filters:     [{ name: 'Fichier GPC', extensions: ['gpc', 'txt'] }],
      properties:  ['openFile', 'multiSelections'],
    });

    if (canceled || filePaths.length === 0) return { ok: false, error: 'Annulé' };

    const imported = [];
    for (const fp of filePaths) {
      const content  = fs.readFileSync(fp, 'utf8');
      const baseName = require('path').basename(fp, require('path').extname(fp));
      const script   = projectManager.createScript(baseName, content);
      imported.push(script.toJSON());
    }

    return { ok: true, scripts: imported };
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
