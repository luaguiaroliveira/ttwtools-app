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
  // a análise (visualizações, |d| mínimo e tabela) abre em painel de tela cheia, deslizando da direita
  await expect(page).toHaveURL(/view=analise/)
  await expect(page.getByTestId('kfa-analysis')).toBeVisible()
  await expect(page.getByTestId('kfa-results')).toContainText(/atributos|features/)
  // gráfico à esquerda + tabela à direita: botões ocultam/mostram cada lado
  await expect(page.getByTestId('kfa-table')).toBeVisible()
  await page.getByTestId('analysis-toggle-table').click()
  await expect(page.getByTestId('kfa-table')).toHaveCount(0)
  await page.getByTestId('analysis-toggle-table').click()
  await expect(page.getByTestId('kfa-table')).toBeVisible()
  // realce da linha inteira ao passar o mouse, inclusive a 1ª coluna fixa, nos três temas
  {
    const row = page.getByTestId('kfa-table').locator('tbody tr').first()
    const firstCell = row.locator('td').first()
    const bg = (loc) => loc.evaluate((el) => getComputedStyle(el).backgroundColor)
    for (const theme of ['light', 'dark', 'contrast']) {
      await page.evaluate((th) => document.documentElement.setAttribute('data-theme', th), theme)
      await page.mouse.move(2, 2)
      const rowBefore = await bg(row)
      const cellBefore = await bg(firstCell)
      await row.hover()
      expect(await bg(row), `${theme}: linha`).not.toBe(rowBefore)
      expect(await bg(firstCell), `${theme}: 1ª célula`).not.toBe(cellBefore)
    }
    await page.evaluate(() => { document.documentElement.removeAttribute('data-theme'); localStorage.removeItem('ttw.theme') })
  }
  await page.getByTestId('analysis-toggle-chart').click()
  await expect(page.getByTestId('gallery-chart')).toHaveCount(0)
  await page.getByTestId('analysis-toggle-chart').click()
  await expect(page.getByTestId('gallery-chart')).toBeVisible()
  // divisória arrastável (teclado) só nas larguras largas; nas estreitas empilha sem divisória
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    const sep = page.getByTestId('split-divider')
    await expect(sep).toBeVisible()
    await sep.focus()
    await page.keyboard.press('ArrowRight')
    await expect(sep).toHaveAttribute('aria-valuenow', '52')
  } else {
    await expect(page.getByTestId('split-divider')).toBeHidden()
  }
  // a legenda liga cada cor ao nome do corpus (nos três tipos de gráfico: sinal, por lado e mapa de calor)
  await expect(page.getByTestId('side-legend')).toContainText('bawe')
  await expect(page.getByTestId('side-legend')).toContainText('corifa')
  await page.locator('[data-testid=gallery-kind] [data-kind=radar]').click()
  await expect(page.getByTestId('side-legend')).toContainText('bawe')
  await a11y(page, 'kfa')
  // barras do d: setas de ordenação (crescente, decrescente, módulo) sempre visíveis, sem dropdown
  await page.locator('[data-testid=gallery-kind] [data-kind=bars]').click()
  const firstLabel = () => page.locator('[data-testid=gallery-chart] svg text').first().textContent()
  const firstTableFeature = () => page.getByTestId('kfa-table').locator('tbody tr').first().locator('td').first().textContent()
  await expect(page.getByTestId('gallery-order-asc')).toHaveAttribute('aria-pressed', 'true')
  const asc = await firstLabel()
  await page.getByTestId('gallery-order-desc').click()
  const desc = await firstLabel()
  // gráfico e tabela se afetam: a 1ª linha da tabela é o 1º atributo das barras
  expect((await firstTableFeature()).trim()).toBe(desc.trim())
  await page.getByTestId('gallery-order-abs').click()
  const byAbs = await firstLabel()
  expect(new Set([asc, desc, byAbs]).size).toBeGreaterThan(1)
  await page.getByTestId('gallery-order-asc').click()
  // ordenar a tabela por uma coluna de contagem também funciona (cabeçalho clicável)
  const countHeader = page.getByTestId('kfa-sort-count1')
  await countHeader.click()
  const firstCount = async () => Number((await page.getByTestId('kfa-table').locator('tbody tr').first().locator('td').nth(2).textContent()).trim())
  const c1 = await firstCount()
  await countHeader.click()
  expect(await firstCount()).toBeGreaterThanOrEqual(c1)   // mesma coluna: asc → desc
  await page.getByTestId('gallery-order-asc').click()   // volta a ordenar por d
  // barras: a altura e a quantidade são controláveis e a área rola (nada de atributo cortado)
  const nBars = () => page.locator('[data-testid=bars-scroll] g[role=button]').count()
  const all = await nBars()
  await page.getByTestId('bars-limit').selectOption('20')
  expect(await nBars()).toBeLessThanOrEqual(20)
  await page.getByTestId('bars-limit').selectOption('0')
  expect(await nBars()).toBe(all)
  const vb = () => page.locator('[data-testid=bars-scroll] svg').getAttribute('viewBox')
  const before = await vb()
  await page.getByTestId('bars-height').fill('8')
  expect(await vb()).not.toBe(before)
  // 6. clicar num atributo (barra) abre a gaveta dos textos, em ordem decrescente; o botão voltar fecha
  const firstBar = page.locator('[data-testid=bars-scroll] g[role=button]').first()
  await firstBar.click()
  await expect(page).toHaveURL(/textos=/)
  const drawer = page.getByTestId('kfa-texts')
  await expect(drawer).toBeVisible()
  // no alto: o etiquetador e a etiqueta; abaixo, os corpora comparados com as cores
  await expect(drawer).toContainText(/Etiquetador|Tagger/)
  await expect(drawer).toContainText('bawe')
  await expect(drawer).toContainText('corifa')
  // lista única (os dois lados juntos): 1º texto com frequência (por 1000) ≥ a do 2º
  const drawerRows = drawer.locator('tbody tr')
  if ((await drawerRows.count()) > 1) {
    const per1 = Number((await drawerRows.nth(0).locator('td').nth(1).textContent()))
    const per2 = Number((await drawerRows.nth(1).locator('td').nth(1).textContent()))
    expect(per1).toBeGreaterThanOrEqual(per2)
  }
  // o quadrado de cada texto tem a cor do lado no comparador e nomeia o corpus
  const square = drawerRows.first().locator('td').first().locator('[role=img]')
  await expect(square).toHaveAttribute('aria-label', /bawe|corifa|=/)
  await a11y(page, 'kfa-textos')
  // clicar no texto abre o Leitor; o voltar do Leitor traz de volta a lista do atributo
  await drawerRows.first().locator('a.link').click()
  await expect(page).toHaveURL(/leitor.*corpus=.*file=/)
  await expect(page.getByTestId('reader-back')).toBeEnabled()
  await page.getByTestId('reader-back').click()
  await expect(page.getByTestId('kfa-texts')).toBeVisible()
  await page.getByTestId('kfa-texts-back').click()
  await expect(drawer).toHaveCount(0)
  // clicar numa linha da tabela abre a mesma lista
  await page.getByTestId('kfa-table').locator('tbody tr').first().click()
  await expect(page.getByTestId('kfa-texts')).toBeVisible()
  await page.getByTestId('kfa-texts-back').click()
  await expect(page.getByTestId('kfa-texts')).toHaveCount(0)
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
      '/explorar/colocados', '/explorar/dispersao', '/leitor', '/comparar', '/escrita', '/modulos', '/etiquetagem']) {
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
