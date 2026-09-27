// Fluxo principal: importar → visão geral → etiquetar → KWIC → palavras-chave → KFA,
// com verificação de acessibilidade (axe, WCAG 2.2 AA: sem violações sérias ou críticas).
import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const CORPORA = path.join(ROOT, 'libs/ttwtools/examples/test_corpora')

async function a11y(page, name) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact))
  expect(bad.map((v) => `${name}: ${v.id} (${v.nodes.length}) ${v.help} :: ${v.nodes.slice(0, 5).map((n) => `${n.target} [${n.any?.[0]?.message ?? ""}]`).join(" | ")}`)).toEqual([])
}

async function waitJob(request, id) {
  for (let i = 0; i < 240; i++) {
    const j = await (await request.get(`/api/jobs/${id}`)).json()
    if (!['queued', 'running'].includes(j.status)) return j
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('tarefa não terminou')
}

test('fluxo completo', async ({ page, request }, info) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ttw-e2e-'))
  const project = path.join(dir, `${info.project.name}.ttwa`)
  // projeto novo e um corpus de referência já etiquetado (pela API, para ganhar tempo)
  expect((await request.post('/api/project/create', { data: { path: project } })).ok()).toBeTruthy()
  await request.post('/api/corpora/import', { data: { corpus_name: 'corifa', source: { kind: 'folder', path: path.join(CORPORA, 'CorIFAessaysNE_5') } } })
  const job = await (await request.post('/api/tagging/layers', { data: { corpus: 'corifa', tagger: 'spacy', preset: 'rapido' } })).json()
  expect((await waitJob(request, job.job_id)).status).toBe('done')

  // 1. importar pela interface (assistente)
  await page.goto('/#/corpora')
  await page.getByTestId('add-corpus').click()
  await page.getByTestId('wizard-path').fill(path.join(CORPORA, 'essays_bawe_somentetexto_5'))
  await page.getByTestId('wizard-path').press('Tab')
  await expect(page.getByTestId('wizard-final-name')).toContainText('essays_bawe_somentetexto_5')   // padrão: nome da pasta
  await page.getByTestId('wizard-rename').locator('summary').click()
  await page.getByTestId('wizard-name').fill('bawe')
  await expect(page.getByTestId('wizard-final-name')).toContainText('bawe')
  // informações sobre os textos: painel opcional recolhido, com os pedaços do nome real
  await page.getByTestId('wizard-meta').locator('summary').first().click()
  await page.getByTestId('wizard-piece-0').fill('area')
  await expect(page.getByTestId('wizard-meta').locator('table')).toContainText('AH')
  await a11y(page, 'corpora-assistente-metadados')
  await page.getByTestId('wizard-import').click()
  await expect(page.getByRole('status').filter({ hasText: /5 document.*5/ })).toBeVisible()
  await a11y(page, 'corpora-assistente')

  // 2. etiquetagem: escolher camadas (nada roda ainda) e executar numa etapa só
  await page.getByTestId('wizard-tag').click()
  await expect(page).toHaveURL(/etiquetagem/)
  await expect(page.getByTestId('active-corpus')).toHaveText('bawe')
  await page.getByTestId('add-stats').click()
  await page.getByTestId('preset-spacy-rapido').click()
  await page.getByTestId('add-spacy').click()
  await expect(page.getByTestId('queue-item')).toHaveCount(2)
  await expect(page.getByTestId('pipeline-queue')).toContainText(/5 de 5|5 of 5/)
  await a11y(page, 'etiquetagem')
  await page.getByTestId('pipeline-run').click()
  await expect(page.getByTestId('pipeline-done')).toBeVisible({ timeout: 120_000 })
  await expect(page.getByTestId('pipeline-percent')).toHaveText('100%')
  await expect(page.getByTestId('pipeline-step-0')).toHaveAttribute('data-status', 'done')
  await expect(page.getByTestId('pipeline-step-1')).toHaveAttribute('data-status', 'done')
  await a11y(page, 'etiquetagem-andamento')
  await expect(page.getByTestId('queue-item')).toHaveCount(0)

  // 3. visão geral já calculada, em Corpora
  await page.goto('/#/corpora')
  await expect(page.getByTestId('overview-stats')).toContainText('5')
  await a11y(page, 'corpora-visao-geral')

  // 4. KWIC
  await page.goto('/#/explorar/kwic')
  await page.getByTestId('query-input').fill('the')
  await page.getByTestId('query-go').click()
  await expect(page.getByTestId('kwic-total')).toContainText(/de \d+|of \d+/)
  await a11y(page, 'kwic')

  // 5. palavras-chave contra o outro corpus
  await page.goto('/#/comparar?tool=palavras-chave')
  await page.getByTestId('kw-ref').selectOption('corifa')
  await page.getByTestId('kw-run').click()
  await expect(page.getByTestId('kw-table').locator('tbody tr').first()).toBeVisible()
  await a11y(page, 'palavras-chave')

  // 6. KFA
  await page.goto('/#/comparar?tool=kfa')
  await page.getByTestId('kfa-corpus2').selectOption('corifa')
  await page.getByTestId('kfa-run').click()
  await expect(page.getByRole('status').filter({ hasText: /traços|features/ })).toBeVisible()
  await a11y(page, 'kfa')

  // navegação principal visível na largura certa
  const width = page.viewportSize().width
  const bottomNav = page.locator('nav.fixed')
  if (width < 768) await expect(bottomNav).toBeVisible()
  else await expect(bottomNav).toBeHidden()
})

test('acessibilidade das demais telas, tema escuro e alto contraste', async ({ page }) => {
  for (const theme of ['dark', 'contrast']) {
    await page.goto('/')
    await page.evaluate((t) => localStorage.setItem('ttw.theme', t), theme)
    for (const route of ['/', '/aprender', '/aprender/cohens_d', '/explorar/busca', '/explorar/frequencia',
      '/explorar/colocados', '/explorar/dispersao', '/explorar/leitor', '/comparar', '/modulos', '/etiquetagem']) {
      await page.goto(`/?t=${theme}#${route}`)
      await page.waitForLoadState('networkidle')
      await a11y(page, `${theme} ${route}`)
    }
  }
})

test('tela sob demanda que sumiu (interface recompilada com a janela aberta) recarrega e abre', async ({ page }) => {
  await page.goto('/#/corpora')
  await page.waitForLoadState('networkidle')
  let blocked = 0
  await page.route(/assets\/ExploreView-.*\.js$/, (route) => (blocked++ ? route.continue() : route.fulfill({ status: 404, body: '' })))
  await page.locator('nav:visible').getByRole('link', { name: /Explorar|Explore/ }).click()
  await expect(page).toHaveURL(/explorar/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Explorar|Explore/, { timeout: 15_000 })
  expect(blocked).toBeGreaterThan(1)
})
