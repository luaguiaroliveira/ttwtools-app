import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: '../frontend',
    emptyOutDir: true,
  },
  plugins: [],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8765',
        changeOrigin: true,
      },
    },
  },
})
