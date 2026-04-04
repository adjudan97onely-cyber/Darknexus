import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

/**
 * electron-vite config
 *
 * - main    → compilé en CJS dans out/main/
 * - preload → compilé en CJS dans out/preload/
 * - renderer → Vite + React, dev server ou out/renderer/
 *
 * Le main process charge le backend via import() dynamique à l'exécution :
 * rollup ne bundle PAS ces fichiers → import.meta.url du StorageManager reste correct.
 */
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    plugins: [react()],
  },
});
