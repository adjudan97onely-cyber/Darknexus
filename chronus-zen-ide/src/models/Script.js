/**
 * Modèle Script
 *
 * Représente un script GPC éditable.
 * Aucune dépendance externe.
 */

export class Script {
  /**
   * @param {object} data
   * @param {string} data.id
   * @param {string} data.name
   * @param {string} data.content
   * @param {string} data.createdAt  - ISO 8601
   * @param {string} data.updatedAt  - ISO 8601
   */
  constructor({ id, name, content, createdAt, updatedAt }) {
    this.id        = id;
    this.name      = name;
    this.content   = content;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Factory — crée un nouveau Script avec un ID unique.
   * @param {string} name
   * @param {string} content
   * @returns {Script}
   */
  static create(name, content = '') {
    const now = new Date().toISOString();
    return new Script({
      id:        crypto.randomUUID(),
      name:      name.trim(),
      content,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Sérialisation pour JSON.stringify */
  toJSON() {
    return {
      id:        this.id,
      name:      this.name,
      content:   this.content,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
