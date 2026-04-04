/**
 * Modèle Slot
 *
 * Représente un emplacement de chargement sur le Chronus Zen.
 * Slots numérotés de 1 à 8. Un slot peut être vide (scriptId = null).
 */

export class Slot {
  /**
   * @param {object} data
   * @param {number} data.slotNumber  - 1 à 8
   * @param {string|null} data.scriptId
   */
  constructor({ slotNumber, scriptId = null }) {
    this.slotNumber = slotNumber;
    this.scriptId   = scriptId;
  }

  get isEmpty() {
    return this.scriptId === null;
  }

  /** Sérialisation pour JSON.stringify */
  toJSON() {
    return {
      slotNumber: this.slotNumber,
      scriptId:   this.scriptId,
    };
  }
}
