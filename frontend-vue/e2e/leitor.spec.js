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

test('leitor: etiquetas, cor, folha e gaveta', async ({ page, request }, info) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ttw-e2e-'))
  expect((await request.post('/api/project/create', { data: { path: path.join(dir, `${info.project.name}.ttwa`) } })).ok()).toBeTruthy()
  await request.post('/api/corpora/import', { data: { corpus_name: 'corifa', source: { kind: 'folder', path: path.join(CORPORA, 'CorIFAessaysNE_5') } } })
  const job = await (await request.post('/api/tagging/layers', { data: { corpus: 'corifa', tagger: 'spacy', preset: 'rapido' } })).json()
  expect((await waitJob(request, job.job_id)).status).toBe('done')

  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error' && /TypeError|ReferenceError/.test(m.text())) errors.push(m.text().slice(0, 200)) })   // erros de renderização do Vue
  await page.goto('/#/explorar/leitor')
  await page.getByTestId('explore-corpus').selectOption('corifa')
  await expect(page.getByTestId('reader-tag-list').locator('li').first()).toBeAttached({ timeout: 30_000 })
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
  expect(errors).toEqual([])
})

test('dispersão: linhas compactas e clique abre o leitor', async ({ page, request }, info) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ttw-e2e-'))
  expect((await request.post('/api/project/create', { data: { path: path.join(dir, `${info.project.name}.ttwa`) } })).ok()).toBeTruthy()
  await request.post('/api/corpora/import', { data: { corpus_name: 'corifa', source: { kind: 'folder', path: path.join(CORPORA, 'CorIFAessaysNE_5') } } })
  await page.goto('/#/explorar/dispersao')
  await page.getByTestId('explore-corpus').selectOption('corifa')
  await page.getByTestId('query-input').fill('the')
  await page.getByTestId('query-go').click()
  const rows = page.getByTestId('disp-rows').locator('button')
  await expect(rows.first()).toBeVisible({ timeout: 30_000 })
  const h0 = (await rows.first().boundingBox()).height
  await page.getByTestId('disp-row-height').fill('8')
  await expect.poll(async () => (await rows.first().boundingBox()).height).toBeLessThan(h0)
  const name = (await rows.first().getAttribute('title')).split(':')[0]
  await rows.first().click()
  await expect(page).toHaveURL(/explorar\/leitor/)
  await expect(page.getByTestId('reader-file')).toHaveValue(name, { timeout: 30_000 })
})
