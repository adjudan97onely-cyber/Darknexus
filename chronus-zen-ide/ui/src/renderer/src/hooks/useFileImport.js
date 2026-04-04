/**
 * useFileImport — Hook de logique d'import de fichiers GPC
 *
 * Responsabilités :
 *  1. Lire le contenu d'un File (FileReader.readAsText — côté renderer, pas Node)
 *  2. Valider le fichier (taille, extension)
 *  3. Créer le script via window.api.scripts.create (IPC existant)
 *  4. Fetcher l'analyse via window.api.analysis.get
 *  5. Retourner le script créé + l'analyse → App.jsx sélectionne + met à jour UI
 *
 * Aucune logique d'affichage ici.
 * Utilisé par App.jsx (events globaux) et DropZone.jsx (zone de dépôt).
 */

import { useCallback } from 'react';

// Extensions acceptées
const ACCEPTED_EXTS = new Set(['.gpc', '.txt', '.c', '.h']);
// Taille max : 2 MB (un script GPC ne dépasse jamais ça)
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

/**
 * Lit un File en texte UTF-8.
 * @param {File} file
 * @returns {Promise<string>}
 */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = ()  => reject(new Error(`Impossible de lire "${file.name}"`));
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * Extrait le nom de base d'un fichier (sans extension).
 * @param {string} filename
 * @returns {string}
 */
function baseName(filename) {
  const last = filename.lastIndexOf('.');
  return last > 0 ? filename.slice(0, last) : filename;
}

/**
 * @param {object} opts
 * @param {(script: object, analysis: object|null) => void} opts.onImported
 *   Callback appelé après import réussi.
 * @param {(msg: string) => void} opts.onError
 *   Callback appelé en cas d'erreur.
 */
export function useFileImport({ onImported, onError }) {

  /**
   * Importe un seul File.
   * @param {File} file
   */
  const importFile = useCallback(async (file) => {
    // ── Validation ──────────────────────────────────────────────────────────
    if (file.size > MAX_SIZE_BYTES) {
      onError(`Fichier trop lourd (max 2 MB) : "${file.name}"`);
      return;
    }

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED_EXTS.has(ext) && !file.type.startsWith('text/')) {
      onError(`Format non supporté : "${file.name}" (accepte .gpc, .txt, .c, .h)`);
      return;
    }

    // ── Lecture ─────────────────────────────────────────────────────────────
    let content;
    try {
      content = await readFileAsText(file);
    } catch (err) {
      onError(err.message);
      return;
    }

    if (!content.trim()) {
      onError(`Fichier vide : "${file.name}"`);
      return;
    }

    // ── Création via IPC existant ────────────────────────────────────────────
    const name = baseName(file.name) || 'Script importé';
    let script;
    try {
      script = await window.api.scripts.create(name, content);
    } catch (err) {
      onError(`Erreur création : ${err.message}`);
      return;
    }

    // ── Analyse immédiate ────────────────────────────────────────────────────
    let analysis = null;
    try {
      analysis = await window.api.analysis.get(script.id);
    } catch {
      /* non bloquant */
    }

    onImported(script, analysis);
  }, [onImported, onError]);

  /**
   * Importe plusieurs fichiers (multi-sélection ou multi-drop).
   * @param {FileList | File[]} files
   */
  const importFiles = useCallback(async (files) => {
    const list = Array.from(files);
    for (const file of list) {
      await importFile(file);
    }
  }, [importFile]);

  /**
   * Importe depuis du texte brut (Ctrl+V).
   * @param {string} text
   * @param {string} [suggestedName]
   */
  const importText = useCallback(async (text, suggestedName = 'Script collé') => {
    const trimmed = text.trim();
    if (trimmed.length < 5) return; // Trop court — probablement pas un script

    let script;
    try {
      script = await window.api.scripts.create(suggestedName, trimmed);
    } catch (err) {
      onError(`Erreur import texte : ${err.message}`);
      return;
    }

    let analysis = null;
    try {
      analysis = await window.api.analysis.get(script.id);
    } catch {
      /* non bloquant */
    }

    onImported(script, analysis);
  }, [onImported, onError]);

  return { importFile, importFiles, importText };
}
