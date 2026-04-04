/**
 * Point d'entrée public du module chronus-zen-ide
 *
 * Importer depuis ici pour accéder à l'API sans dépendre des chemins internes.
 *
 * Exemple d'utilisation future (UI / Electron) :
 *   import { projectManager, compiler } from './chronus-zen-ide/index.js';
 */

export { projectManager } from './src/core/ProjectManager.js';
export { compiler }       from './src/compiler/GpcCompiler.js';
