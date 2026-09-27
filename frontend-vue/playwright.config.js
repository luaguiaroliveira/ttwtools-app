// Testes de ponta a ponta nas três larguras, com o Chrome instalado (sem baixar navegadores).
// O servidor Python sobe sozinho servindo ../frontend (rode `npm run build` antes).
import { defineConfig } from '@playwright/test'

const PORT = 8792
export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  workers: 1,                    // um servidor e um projeto aberto por vez
  reporter: [['list']],
  use: { baseURL: `http://127.0.0.1:${PORT}`, channel: 'chrome', headless: true, trace: 'retain-on-failure' },
  projects: [
    { name: 'celular-390', use: { viewport: { width: 390, height: 844 } } },
    { name: 'tablet-768', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'computador-1280', use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: `${process.env.PYTHON || 'python'} -m app --mode web --port ${PORT}`,
    cwd: '..',
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
