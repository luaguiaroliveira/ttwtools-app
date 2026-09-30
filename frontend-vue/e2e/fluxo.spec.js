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
  await page.goto('/#/arquivo')
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
  await expect(page.getByTestId('active-corpus')).toHaveValue('bawe')
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
  await page.goto('/#/arquivo')
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
  await expect(page.getByTestId('cmp-corpus2')).toHaveValue('corifa')     // a barra de comparação já traz o outro corpus
  await page.getByTestId('kw-run').click()
  await expect(page.getByTestId('kw-table').locator('tbody tr').first()).toBeVisible()
  await a11y(page, 'palavras-chave')

  // 6. KFA
  await page.goto('/#/comparar?tool=kfa')
  await page.getByTestId('kfa-run').click()
  await expect(page.getByRole('status').filter({ hasText: /atributos|features/ })).toBeVisible()
  // a legenda liga cada cor ao nome do corpus (nos três tipos de gráfico: sinal, por lado e mapa de calor)
  await expect(page.getByTestId('side-legend')).toContainText('bawe')
  await expect(page.getByTestId('side-legend')).toContainText('corifa')
  await page.locator('[data-testid=gallery-kind] [data-kind=radar]').click()
  await expect(page.getByTestId('side-legend')).toContainText('bawe')
  await a11y(page, 'kfa')
  // barras do d: ordenar por maior módulo, crescente e decrescente
  await page.locator('[data-testid=gallery-kind] [data-kind=bars]').click()
  const firstLabel = () => page.locator('[data-testid=gallery-chart] svg text').first().textContent()
  const byAbs = await firstLabel()
  await page.getByTestId('gallery-order').selectOption('asc')
  const asc = await firstLabel()
  await page.getByTestId('gallery-order').selectOption('desc')
  const desc = await firstLabel()
  expect(new Set([byAbs, asc, desc]).size).toBeGreaterThan(1)
  await page.getByTestId('gallery-order').selectOption('abs')
  // mapa de calor: o zoom horizontal muda a largura do desenho, o vertical a altura
  await page.locator('[data-testid=gallery-kind] [data-kind=heatmap]').click()
  const svg = page.locator('[data-testid=heatmap-controls] ~ div svg')
  await expect(svg).toBeVisible()
  const w0 = Number(await svg.getAttribute('width')), h0 = Number(await svg.getAttribute('height'))
  await page.getByTestId('heatmap-zoom-x').fill('2')
  expect(Number(await svg.getAttribute('width'))).toBeGreaterThan(w0)
  expect(Number(await svg.getAttribute('height'))).toBe(h0)
  await page.getByTestId('heatmap-zoom-y').fill('2')
  expect(Number(await svg.getAttribute('height'))).toBeGreaterThan(h0)
  await page.locator('[data-testid=gallery-kind] [data-kind=radar]').click()
  // coordenadas paralelas: controle de opacidade e clique numa linha abre o texto no Leitor, com volta
  await page.locator('[data-testid=gallery-kind] [data-kind=parcoords]').click()
  await page.getByTestId('parcoords-alpha').fill('0.6')
  await page.locator('svg polyline.cursor-pointer').first().dispatchEvent('click')
  await expect(page).toHaveURL(/leitor.*corpus=/)
  await page.getByTestId('reader-back').click()
  await expect(page).toHaveURL(/comparar\?tool=kfa/)
  await expect(page.getByTestId('parcoords-alpha')).toBeVisible()

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
      '/explorar/colocados', '/explorar/dispersao', '/explorar/leitor', '/comparar', '/escrita', '/modulos', '/etiquetagem']) {
      await page.goto(`/?t=${theme}#${route}`)
      await page.waitForLoadState('networkidle')
      await a11y(page, `${theme} ${route}`)
    }
  }
})

test('tela sob demanda que sumiu (interface recompilada com a janela aberta) recarrega e abre', async ({ page }) => {
  await page.goto('/#/arquivo')
  await page.waitForLoadState('networkidle')
  let blocked = 0
  await page.route(/assets\/ExploreView-.*\.js$/, (route) => (blocked++ ? route.continue() : route.fulfill({ status: 404, body: '' })))
  await page.locator('nav:visible').getByRole('link', { name: /Explorar|Explore/ }).click()
  await expect(page).toHaveURL(/explorar/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Explorar|Explore/, { timeout: 15_000 })
  expect(blocked).toBeGreaterThan(1)
})

test('arquivo compactado: cópia de trabalho, Salvar, "não salvo" e pergunta antes de trocar de projeto', async ({ page, request }, info) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ttw-e2e-'))
  const base = path.join(dir, `${info.project.name}.ttwa`)
  const ttwt = path.join(dir, `${info.project.name}.ttwt`)
  expect((await request.post('/api/project/create', { data: { path: base } })).ok()).toBeTruthy()
  const job = await (await request.post('/api/project/saveas', { data: { path: ttwt, switch: false } })).json()
  expect((await waitJob(request, job.job_id)).status).toBe('done')

  await page.goto('/#/arquivo')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/TTWtools/)
  await page.getByText(/Mais opções do projeto|More project options/).click()
  await page.getByTestId('project-path').fill(ttwt)
  await page.getByTestId('project-open').click()
  await expect(page.getByTestId('ttwt-note')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('project-current-path')).toContainText('.ttwt')
  // opções de gravação visíveis: desligar as tabelas de busca e salvar (fica lembrado no arquivo)
  await expect(page.getByTestId('opt-compress')).toBeChecked()
  await page.getByTestId('opt-search-tables').uncheck()
  await expect(page.getByTestId('opt-search-tables')).not.toBeChecked()
  await page.getByTestId('project-save').click()
  await expect(page.getByTestId('file-done')).toContainText('.ttwt', { timeout: 30_000 })
  expect((await (await request.get('/api/project/save-options')).json()).search_tables).toBe(false)
  // uma alteração → "não salvo" na barra e no cabeçalho; só então Novo… pergunta se quer salvar
  await request.post('/api/corpora/import', { data: { corpus_name: 'colado', source: { kind: 'text', text: 'Olá.' } } })
  await expect(page.getByTestId('header-unsaved')).toBeVisible({ timeout: 10_000 })
  await page.getByTestId('project-new').click()
  await expect(page.getByTestId('unsaved-prompt')).toBeVisible()
  await a11y(page, 'arquivo-ttwt')
  await page.getByRole('button', { name: /^(Cancelar|Cancel)$/ }).click()
  await expect(page.getByTestId('unsaved-prompt')).toHaveCount(0)
})
