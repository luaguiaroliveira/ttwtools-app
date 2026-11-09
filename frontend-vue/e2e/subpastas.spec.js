// Importar cada subpasta de uma pasta como um corpus separado (assistente "Adicionar corpus").
import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

test('cada subpasta vira um corpus', async ({ page, request }) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ttw-sub-'))
  const project = path.join(dir, 'turmas.ttwa')
  const parent = path.join(dir, 'turmas')
  const turmas = { A: ['A_01.txt', 'A_02.txt'], B: ['B_01.txt'] }
  for (const [nome, arquivos] of Object.entries(turmas)) {
    fs.mkdirSync(path.join(parent, nome), { recursive: true })
    for (const arquivo of arquivos) fs.writeFileSync(path.join(parent, nome, arquivo), 'The cat sat on the mat.', 'utf8')
  }
  expect((await request.post('/api/project/create', { data: { path: project } })).ok()).toBeTruthy()

  await page.goto('/#/arquivo')
  await page.getByTestId('add-corpus').click()
  await page.getByTestId('wizard-path').fill(parent)
  await page.getByTestId('wizard-path').press('Tab')
  // a opção aparece quando a pasta tem subpastas com .txt
  await expect(page.getByTestId('wizard-subfolders')).toBeVisible()
  await page.getByTestId('wizard-each-subfolder').check()
  await expect(page.getByTestId('wizard-subfolder-list')).toContainText('A')
  await expect(page.getByTestId('wizard-subfolder-list')).toContainText('B')
  await page.getByTestId('wizard-import').click()
  await expect(page.getByTestId('wizard-imported-many')).toContainText('2 corpora importados')
  await expect(page.getByTestId('corpus-list')).toContainText('A')
  await expect(page.getByTestId('corpus-list')).toContainText('B')
  await expect(page.getByTestId('corpus-list')).toContainText('2 documentos')
  await expect(page.getByTestId('corpus-list')).toContainText('1 documentos')
})
