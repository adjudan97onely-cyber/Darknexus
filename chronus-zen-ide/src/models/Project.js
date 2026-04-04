/**
 * Modèle Project
 *
 * Conteneur racine — agrège la liste des scripts et des slots.
 * Utilisé pour sérialiser / désérialiser l'état complet en une seule passe
 * (utile pour export/import futur).
 *
 * Le Project n'est PAS le point d'entrée pour les mutations :
 * celles-ci passent toujours par ProjectManager (core).
 */

import { Script } from './Script.js';
import { Slot }   from './Slot.js';

export class Project {
  /**
   * @param {object}   data
   * @param {object[]} data.scripts
   * @param {object[]} data.slots
   */
  constructor({ scripts = [], slots = [] } = {}) {
    this.scripts = scripts.map(s  => new Script(s));
    this.slots   = slots.map(sl  => new Slot(sl));
  }

  /** Sérialisation complète (export/sauvegarde unifiée future) */
  toJSON() {
    return {
      scripts: this.scripts.map(s  => s.toJSON()),
      slots:   this.slots.map(sl => sl.toJSON()),
    };
  }
}
