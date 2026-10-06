// Leitor de texto: lista de etiquetas (ordenação, contagens), dica, menu de cor, folha (zoom, fonte,
// justificação) e gaveta em telas estreitas, com axe.
import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const CORPORA = path.join(ROOT, 'libs/ttwtools/examples/test_corpora')

async function waitJob(request, id) {
  for (let i = 0; i < 240; i++) {
    const j = await (await request.get(`/api/jobs/${id}`)).json()
    if (!['queued', 'running'].includes(j.status)) return j
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('tarefa não terminou')
}

// O painel de etiquetas abre visível em telas largas e fechado em telas estreitas; abre quando preciso.
async function openTags(page) {
  const list = page.getByTestId('tag-picker-list')
  if (!(await list.isVisible())) await page.getByTestId('tag-panel-toggle').click()
  await expect(list).toBeVisible()
}

test('leitor: etiquetas, cor, folha e gaveta', async ({ page, request }, info) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ttw-e2e-'))
  expect((await request.post('/api/project/create', { data: { path: path.join(dir, `${info.project.name}.ttwa`) } })).ok()).toBeTruthy()
  await request.post('/api/corpora/import', { data: { corpus_name: 'corifa', source: { kind: 'folder', path: path.join(CORPORA, 'CorIFAessaysNE_5') } } })
  const job = await (await request.post('/api/tagging/layers', { data: { corpus: 'corifa', tagger: 'spacy', preset: 'rapido' } })).json()
  expect((await waitJob(request, job.job_id)).status).toBe('done')

  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error' && /TypeError|ReferenceError/.test(m.text())) errors.push(m.text().slice(0, 200)) })   // erros de renderização do Vue
  await page.goto('/#/leitor')
  await page.getByTestId('reader-corpus').selectOption('corifa')
  await expect(page.getByTestId('reader-tag-list').locator('li').first()).toBeAttached({ timeout: 30_000 })
  // ícone de informação ao lado do etiquetador abre a tabela de tags (antes da gaveta: no celular ela cobre a barra do leitor)
  await page.getByTestId('tag-info-spacy').click()
  await expect(page.getByTestId('tagset-table')).toBeVisible()
  await page.getByTestId('tagset-close').click()
  await expect(page.getByTestId('tagset-table')).toBeHidden()
  const narrow = (page.viewportSize()?.width ?? 0) < 1024
  if (narrow) {   // tela estreita: a lista fica numa gaveta aberta pela alça
    await expect(page.getByTestId('reader-tag-list')).toBeHidden()
    await page.getByTestId('reader-panel-toggle').click()
    await expect(page.getByTestId('reader-tag-list')).toBeVisible()
  }
  const first = async () => (await page.getByTestId('reader-tag-list').locator('li').first().innerText()).split('\n')[0].trim()
  const byText = await first()
  await page.getByTestId('reader-sort').selectOption('alpha')
  const alpha = await first()
  expect(alpha.localeCompare(byText, undefined, { numeric: true })).toBeLessThanOrEqual(0)   // alfabética começa antes (ou igual)
  await page.getByTestId('reader-sort').selectOption('corpus')
  await expect(page.getByTestId('reader-tag-list').locator('li').first().locator('span.tabular-nums').last()).not.toHaveText('…', { timeout: 30_000 })

  // dica ao passar o mouse
  await page.getByTestId('reader-tag-list').locator('li button[aria-pressed]').first().hover()
  await expect(page.getByRole('tooltip')).toBeVisible()

  // marcar e abrir o menu de cor com o botão direito
  await page.getByTestId('reader-tag-list').locator('li button[aria-pressed]').first().click()
  await page.getByTestId('reader-tag-list').locator('li .badge').first().click({ button: 'right' })
  await expect(page.getByTestId('color-picker')).toBeVisible()
  await page.getByRole('tab', { name: /Hex/ }).click()
  await page.getByTestId('color-hex').fill('#112233')
  await expect(page.getByTestId('color-hex')).toHaveValue('#112233')
  await page.keyboard.press('Escape')

  // folha: zoom, fonte e justificação
  if (narrow) await page.getByTestId('reader-panel-toggle').click()
  const w0 = (await page.getByTestId('reader-paper').boundingBox()).width
  await page.getByTestId('reader-zoom').selectOption('1.5')
  await expect.poll(async () => (await page.getByTestId('reader-paper').boundingBox()).width).toBeGreaterThan(w0 * 1.3)
  await page.getByTestId('reader-font').selectOption('16')
  await page.getByTestId('reader-justify').click()
  await expect(page.getByTestId('reader-text')).toHaveClass(/is-justified/)

  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(r.violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target).join(' | ')}`)).toEqual([])
  // rota antiga (#/explorar/leitor) redireciona para a seção própria, preservando a consulta
  await page.goto('/#/explorar/leitor?corpus=corifa')
  await expect(page).toHaveURL(/#\/leitor\?corpus=corifa/)
  // tag= cai para a classe em camadas sem tags (spaCy)
  await page.goto('/#/explorar/kwic')
  await page.getByTestId('query-input').fill('tag=NOUN')
  await page.getByTestId('query-go').click()
  await expect(page.getByTestId('kwic-total')).not.toContainText(/de 0$/, { timeout: 30_000 })
  expect(errors).toEqual([])
})

test('dispersão: mapa de calor, várias consultas e clique abre o leitor', async ({ page, request }, info) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ttw-e2e-'))
  expect((await request.post('/api/project/create', { data: { path: path.join(dir, `${info.project.name}.ttwa`) } })).ok()).toBeTruthy()
  await request.post('/api/corpora/import', { data: { corpus_name: 'corifa', source: { kind: 'folder', path: path.join(CORPORA, 'CorIFAessaysNE_5') } } })
  await page.goto('/#/explorar/dispersao')
  await page.getByTestId('explore-corpus').selectOption('corifa')
  await page.getByTestId('query-input').fill('the')
  await page.getByTestId('query-go').click()
  const rows = page.getByTestId('disp-rows').locator('button')
  await expect(rows.first()).toBeVisible({ timeout: 30_000 })
  // camadas é o padrão: as faixas de cada texto são desenhadas em canvas (rápido)
  await expect(page.getByTestId('disp-view-heat')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('canvas.disp-canvas').first()).toBeVisible()
  const h0 = (await rows.first().boundingBox()).height
  await page.getByTestId('disp-row-height').fill('8')
  await expect.poll(async () => (await rows.first().boundingBox()).height).toBeLessThan(h0)
  await page.getByTestId('disp-bands').fill('20')   // faixas ajustáveis
  // segunda consulta: entra como um chip com cor própria, no mesmo mapa
  await page.getByTestId('query-input').fill('of')
  await page.getByTestId('query-go').click()
  await expect(page.getByTestId('disp-queries').locator('.badge')).toHaveCount(2, { timeout: 30_000 })
  await expect(page.locator('canvas.disp-canvas').first()).toBeVisible()
  // código de barras (sem fundo) e tabela continuam disponíveis
  await page.getByTestId('disp-view-bars').click()
  await expect(page.getByTestId('disp-view-bars')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('canvas.disp-canvas').first()).toBeVisible()
  // tabela secundária do relatório de DP (uma linha por consulta)
  await page.getByTestId('disp-view-dp').click()
  await expect(page.getByTestId('disp-report')).toBeVisible()
  await expect(page.getByTestId('disp-report')).toContainText(/DP de Gries|Gries/)
  await expect(page.getByTestId('disp-report')).toContainText(/range/)
  // a exportação acompanha a visão: em "DP de Gries" o CSV traz o relatório por consulta
  await page.locator('details.dropdown').evaluateAll((els) => els.forEach((e) => { e.open = true }))
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-csv').click()])
  const csv = fs.readFileSync(await dl.path(), 'utf8')
  expect(csv).toContain('DP de Gries')
  expect(csv).not.toContain('tokens')
  await page.getByTestId('disp-view-table').click()
  await expect(page.getByTestId('disp-table')).toBeVisible()
  // métricas "por texto" de Gries na tabela (esperado/observado/desvio)
  await expect(page.getByTestId('disp-table')).toContainText(/esperado|expected/)
  await expect(page.getByTestId('disp-table')).toContainText(/\|o−e\|/)
  await page.getByTestId('disp-view-heat').click()
  const name = (await rows.first().getAttribute('title')).split(':')[0]
  await rows.first().click()
  await expect(page).toHaveURL(/#\/leitor/)
  await expect(page.getByTestId('reader-file')).toHaveValue(name, { timeout: 30_000 })
})

test('dispersão comparada: dois quadros, ordenação e clique abre o leitor', async ({ page, request }, info) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ttw-e2e-'))
  expect((await request.post('/api/project/create', { data: { path: path.join(dir, `${info.project.name}.ttwa`) } })).ok()).toBeTruthy()
  await request.post('/api/corpora/import', { data: { corpus_name: 'bawe', source: { kind: 'folder', path: path.join(CORPORA, 'essays_bawe_somentetexto_5') } } })
  await request.post('/api/corpora/import', { data: { corpus_name: 'corifa', source: { kind: 'folder', path: path.join(CORPORA, 'CorIFAessaysNE_5') } } })
  const tagJob = await (await request.post('/api/tagging/layers', { data: { corpus: 'bawe', tagger: 'spacy', preset: 'rapido' } })).json()
  expect((await waitJob(request, tagJob.job_id)).status).toBe('done')
  await page.goto('/#/comparar?tool=dispersao')
  await page.getByTestId('active-corpus').selectOption('bawe')
  await page.getByTestId('query-input').fill('the')
  await page.getByTestId('query-go').click()
  const charts = page.getByTestId('disp-rows')
  await expect(charts).toHaveCount(2, { timeout: 30_000 })          // um quadro por lado
  await expect(charts.first().locator('button').first()).toBeVisible()
  await expect(page.locator('canvas.disp-canvas').first()).toBeVisible()
  await page.getByTestId('disp-compare-order').selectOption('freq')
  await page.getByTestId('disp-compare-order').selectOption('dp')
  // mesma lógica de etiquetas coloridas do Explorar: clicar numa etiqueta vira a consulta e os traços
  // passam a usar a cor dela (o lado fica no fundo/rótulo)
  await openTags(page)
  const tagBtn = page.getByTestId('tag-picker-list').locator('button').first()
  const tag = await tagBtn.getAttribute('data-tag')
  await tagBtn.click()
  await expect(page.getByTestId('query-input')).toHaveValue(`the&pos=${tag}`)
  await page.getByTestId('tag-panel-close').click()          // painel cobre o Buscar nas telas estreitas
  await page.getByTestId('query-go').click()
  await expect(charts.first().locator('button').first()).toBeVisible({ timeout: 30_000 })
  const bg = (loc) => loc.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(await bg(page.getByTestId('disp-compare-stroke').first())).toBe(await bg(page.getByTestId(`tag-color-${tag}`).locator('span').first()))
  // clicar numa linha abre o Leitor no texto, com a etiqueta destacada
  const first = charts.first().locator('button').first()
  const name = (await first.getAttribute('title')).split(':')[0]
  await first.click()
  await expect(page).toHaveURL(/#\/leitor/)
  await expect(page.getByTestId('reader-file')).toHaveValue(name, { timeout: 30_000 })
})

test('explorar com camada só de tags (biberplus) não quebra', async ({ page, request }, info) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ttw-e2e-'))
  expect((await request.post('/api/project/create', { data: { path: path.join(dir, `${info.project.name}.ttwa`) } })).ok()).toBeTruthy()
  await request.post('/api/corpora/import', { data: { corpus_name: 'corifa', source: { kind: 'folder', path: path.join(CORPORA, 'CorIFAessaysNE_5') } } })
  const job = await (await request.post('/api/tagging/layers', { data: { corpus: 'corifa', tagger: 'biberplus', preset: 'rapido' } })).json()
  expect((await waitJob(request, job.job_id)).status).toBe('done')
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error' && /TypeError|ReferenceError/.test(m.text())) errors.push(m.text().slice(0, 200)) })
  await page.goto('/#/explorar/kwic')
  await page.getByTestId('explore-corpus').selectOption('corifa')
  await page.getByTestId('header-layer').selectOption('biberplus')
  await page.getByTestId('query-input').fill('the')
  await page.getByTestId('query-go').click()
  await expect(page.getByTestId('kwic-total')).toContainText(/1\s*[–-]/, { timeout: 30_000 })
  await expect(page.locator('.pos-tag').first()).toBeAttached()   // no celular a tabela fica escondida (cartões)
  if ((page.viewportSize()?.width ?? 0) >= 640) {   // dica global com a descrição da etiqueta
    await page.locator('.pos-tag').first().hover()
    await expect(page.getByTestId('tag-tip')).toBeVisible()
    await expect(page.getByTestId('tag-tip')).not.toHaveText(/^\s*$/)
  }
  await page.goto('/#/explorar/frequencia')
  await page.getByTestId('freq-go').click()
  await expect(page.locator('table.table').first()).toBeVisible({ timeout: 30_000 })
  await page.goto('/#/explorar/dispersao')
  await page.getByTestId('query-input').fill('the')
  await page.getByTestId('query-go').click()
  await expect(page.getByTestId('disp-rows').locator('button').first()).toBeVisible({ timeout: 30_000 })
  // seletor de etiquetas em painel à direita: clicar numa etiqueta vira uma consulta própria colorida
  await openTags(page)
  const tagBtn = page.getByTestId('tag-picker-list').locator('button').first()
  const tag = await tagBtn.getAttribute('data-tag')
  await tagBtn.click()
  // marcar não busca sozinho (a dispersão é lenta): só seleciona; a busca vem do botão
  await expect(page.getByTestId('disp-queries').locator('.badge')).toHaveCount(1)
  await page.getByTestId('disp-tag-search').click()
  const chips = page.getByTestId('disp-queries').locator('.badge')
  await expect(chips).toHaveCount(2, { timeout: 30_000 })          // 'the' + a etiqueta
  // consulta de etiqueta: a cor vem do seletor de etiquetas (bolinha), sem o `<input type=color>` do texto livre
  await expect(chips.nth(1).locator('[data-testid^="disp-dot-"]')).toBeVisible()
  await expect(chips.nth(1).locator('input[type=color]')).toHaveCount(0)
  // o menu da etiqueta oferece só a cor (seletor completo) e o Esc fecha só o menu, mantendo o painel
  await page.getByTestId(`tag-color-${tag}`).click()
  await expect(page.getByTestId('tag-color-menu')).toBeVisible()
  await expect(page.getByTestId('color-picker')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('tag-color-menu')).toHaveCount(0)
  await expect(page.getByTestId('tag-picker-list')).toBeVisible()
  expect(errors).toEqual([])
})

test('ferramenta cujo arquivo sumiu mostra aviso em vez de área em branco; leitor tem voltar/avançar', async ({ page, request }, info) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ttw-e2e-'))
  expect((await request.post('/api/project/create', { data: { path: path.join(dir, `${info.project.name}.ttwa`) } })).ok()).toBeTruthy()
  await request.post('/api/corpora/import', { data: { corpus_name: 'corifa', source: { kind: 'folder', path: path.join(CORPORA, 'CorIFAessaysNE_5') } } })
  await page.goto('/#/explorar/kwic')
  await page.getByTestId('explore-corpus').selectOption('corifa')
  await page.getByTestId('query-input').fill('the')
  await page.getByTestId('query-go').click()
  await expect(page.getByTestId('kwic-total')).toContainText('1', { timeout: 30_000 })
  // KWIC → leitor: o voltar leva de volta e o avançar retorna
  if ((page.viewportSize()?.width ?? 0) >= 640) {
    await page.locator('tbody tr').first().click()
    await expect(page).toHaveURL(/leitor/)
    await expect(page.getByTestId('reader-back')).toBeEnabled()
    await expect(page.getByTestId('reader-forward')).toBeDisabled()
    await page.getByTestId('reader-back').click()
    await expect(page).toHaveURL(/kwic/)
    await page.goForward()
    await expect(page.getByTestId('reader-forward')).toBeDisabled()
  }
  // o arquivo da Frequência "some" (interface recompilada com a janela aberta)
  await page.route('**/assets/FrequencyTool-*.js', (r) => r.fulfill({ status: 404, body: 'nope' }))
  await page.goto('/#/explorar/kwic')   // o Leitor agora é seção própria; volta ao Explorar para achar a aba
  await page.getByRole('tab', { name: /Frequência|Frequency/ }).click()
  await expect(page.getByTestId('tool-load-error')).toBeVisible({ timeout: 30_000 })
})
