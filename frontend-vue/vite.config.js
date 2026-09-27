import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Saída em ../frontend (fora do git), que o servidor serve e o build/build.py empacota.
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: './',
  build: {
    outDir: '../frontend',
    emptyOutDir: true,
    target: 'safari16',          // WebKit do macOS 12 (Safari 17.6)
    chunkSizeWarningLimit: 300,
  },
  server: {
    proxy: { '/api': 'http://127.0.0.1:8765' },   // python -m app --mode web
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js'],   // e2e/ é do Playwright (npm run e2e)
  },
})
