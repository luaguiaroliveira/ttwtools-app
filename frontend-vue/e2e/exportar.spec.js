// Exportar: um corpus (.ttwc/.ttwcl) ou pacote leve com vários corpora (.ttwal); o seletor de arquivo nativo
// não roda no teste, então aqui se confere o diálogo e a acessibilidade (a gravação tem teste na rota).
import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const CORPORA = path.join(ROOT, 'libs/ttwtools/examples/test_corpora')

test('exportar: formatos e seleção de corpora', async ({ page, request }, info) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ttw-e2e-'))
  expect((await request.post('/api/project/create', { data: { path: path.join(dir, `${info.project.name}.ttwa`) } })).ok()).toBeTruthy()
  await request.post('/api/corpora/import', { data: { corpus_name: 'corifa', source: { kind: 'folder', path: path.join(CORPORA, 'CorIFAessaysNE_5') } } })
  await request.post('/api/corpora/import', { data: { corpus_name: 'bawe', source: { kind: 'folder', path: path.join(CORPORA, 'essays_bawe_somentetexto_5') } } })
  await page.goto('/#/arquivo')
  await page.getByTestId('project-export').click()
  const dlg = page.getByTestId('export-dialog')
  await expect(dlg).toBeVisible()
  // um corpus: escolhe qual
  await expect(page.getByTestId('export-corpus')).toBeVisible()
  await page.getByTestId('export-kind-ttwcl').check()
  await expect(page.getByTestId('export-corpus')).toBeVisible()
  // pacote: caixas de seleção, todos marcados; não deixa exportar sem nenhum
  await page.getByTestId('export-kind-ttwal').check()
  await expect(page.getByTestId('export-corpus')).toBeHidden()
  await expect(page.getByTestId('export-pick-corifa')).toBeChecked()
  await expect(page.getByTestId('export-pick-bawe')).toBeChecked()
  await page.getByTestId('export-pick-corifa').uncheck()
  await page.getByTestId('export-pick-bawe').uncheck()
  await expect(page.getByTestId('export-go')).toBeDisabled()
  await page.getByTestId('export-pick-bawe').check()
  await expect(page.getByTestId('export-go')).toBeEnabled()
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(r.violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target).join(' | ')}`)).toEqual([])
})
