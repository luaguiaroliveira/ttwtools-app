import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Safari 17.6 (WebKit do macOS 12) tem defeito conhecido no color-mix(): interpolando fora de
// srgb, uma mistura com transparente sai opaca (botão inativo preto, item ativo laranja chapado)
// e uma mistura de duas cores erra o matiz. Tailwind 4 e daisyUI 5 emitem `in oklab`/`in oklch`
// (e testam `in lab` em @supports); trocamos a interpolação por srgb no CSS final. Para
// cor+transparente o resultado é idêntico. Referência: WebKit bug de color-mix em oklch.
function safariColorMix() {
  return {
    name: 'ttw-safari-color-mix',
    generateBundle(_, bundle) {
      for (const asset of Object.values(bundle)) {
        if (asset.type === 'asset' && asset.fileName.endsWith('.css')) {
          asset.source = String(asset.source).replace(/color-mix\(in\s+(?:oklab|oklch|lab|lch)\b/g, 'color-mix(in srgb')
        }
      }
    },
  }
}

// Saída em ../frontend (fora do git), que o servidor serve e o build/build.py empacota.
export default defineConfig({
  plugins: [vue(), tailwindcss(), safariColorMix()],
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
