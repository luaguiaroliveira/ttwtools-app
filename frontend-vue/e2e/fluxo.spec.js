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
  await page.getByTestId('wizard-name').fill('bawe')
  await page.getByTestId('wizard-path').fill(path.join(CORPORA, 'essays_bawe_somentetexto_5'))
  await page.getByTestId('wizard-path').press('Tab')
  // informações sobre os textos: painel opcional recolhido, com os pedaços do nome real
  await page.getByTestId('wizard-meta').locator('summary').first().click()
  await page.getByTestId('wizard-piece-0').fill('area')
  await expect(page.getByTestId('wizard-meta').locator('table')).toContainText('AH')
  await a11y(page, 'corpora-assistente-metadados')
  await page.getByTestId('wizard-import').click()
  await expect(page.getByRole('status').filter({ hasText: /5 document.*5/ })).toBeVisible()
  await a11y(page, 'corpora-assistente')

  // 2. visão geral
  await page.getByTestId('wizard-overview').click()
  await page.getByTestId('overview-compute').click()
  await expect(page.getByTestId('overview-stats')).toContainText('5')
  await expect(page.getByTestId('active-corpus')).toHaveText('bawe')

  // 3. etiquetar (spaCy, predefinição rápida)
  await page.getByTestId('tagger-select').selectOption('spacy')
  await page.getByTestId('preset-rapido').click()
  await expect(page.getByTestId('tag-plan')).toContainText('5')
  await page.getByTestId('tag-run').click()
  await expect(page.locator('#tagger-panel [role=status]').filter({ hasText: /5 etiquetados|5 tagged/ })).toBeVisible({ timeout: 120_000 })
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
      '/explorar/colocados', '/explorar/dispersao', '/explorar/leitor', '/comparar', '/modulos']) {
      await page.goto(`/?t=${theme}#${route}`)
      await page.waitForLoadState('networkidle')
      await a11y(page, `${theme} ${route}`)
    }
  }
})
