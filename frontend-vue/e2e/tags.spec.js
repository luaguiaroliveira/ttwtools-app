// Aprender: lista de tags por etiquetador (tabela com definição e exemplo), com axe.
import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('aprender: tags por etiquetador', async ({ page }) => {
  await page.goto('/#/aprender/tags_etiquetadores')
  await expect(page.getByTestId('learn-tagger')).toBeVisible()
  const table = page.getByTestId('tagset-table')
  await expect(table).toBeVisible()
  await expect(table.locator('tbody tr').first()).toBeVisible()
  // trocar de etiquetador troca o repertório
  const firstTag = async () => (await table.locator('tbody tr').first().innerText()).split('\t')[0].trim()
  const before = await firstTag()
  await page.getByTestId('learn-tagger').selectOption('biberplus')
  await expect.poll(firstTag).not.toBe(before)
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(r.violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => v.id)).toEqual([])
})
