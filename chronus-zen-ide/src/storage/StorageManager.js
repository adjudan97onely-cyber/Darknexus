/**
 * StorageManager
 *
 * Gestion de la persistance locale en JSON.
 *
 * Responsabilités :
 *  - Créer le répertoire data/ s'il n'existe pas
 *  - Charger un fichier JSON (retourne une valeur par défaut si absent ou corrompu)
 *  - Sauvegarder de façon atomique (écriture complète du fichier)
 *
 * Ce module ne connaît pas les modèles — il manipule uniquement du JSON brut.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname }                                       from 'path';
import { fileURLToPath }                                       from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Répertoire de persistance — à côté de ce fichier */
const DATA_DIR = join(__dirname, 'data');

class StorageManager {
  constructor() {
    this._ensureDataDir();
  }

  // ─── Privé ───────────────────────────────────────────────────────────────

  _ensureDataDir() {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  _resolvePath(filename) {
    return join(DATA_DIR, filename);
  }

  // ─── API publique ─────────────────────────────────────────────────────────

  /**
   * Charge un fichier JSON.
   * @param {string} filename       - ex: 'scripts.json'
   * @param {*}      defaultValue   - valeur retournée si fichier absent/invalide
   * @returns {*}
   */
  load(filename, defaultValue = []) {
    const filepath = this._resolvePath(filename);
    if (!existsSync(filepath)) {
      return defaultValue;
    }
    try {
      const raw = readFileSync(filepath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      // Fichier corrompu → on repart de zéro sans crasher
      console.warn(`[StorageManager] Impossible de lire "${filename}", réinitialisation.`);
      return defaultValue;
    }
  }

  /**
   * Sauvegarde des données dans un fichier JSON.
   * @param {string} filename
   * @param {*}      data
   */
  save(filename, data) {
    const filepath = this._resolvePath(filename);
    writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  }
}

/** Singleton partagé entre tous les modules */
export const storage = new StorageManager();
