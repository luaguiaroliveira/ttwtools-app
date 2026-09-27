import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Saída em dist/ (fora do git). O build/build.py usa esta pasta com TTW_UI=vue;
// no passo 3.11 (fim da interface antiga) passa a ser ../frontend.
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: './',
  build: {
    outDir: 'dist',
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
