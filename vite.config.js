import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: './killagain-food',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5180,
    strictPort: false,
  },
  build: {
    outDir: '../dist',
  }
})
