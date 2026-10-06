import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { markdown } from '../utils/markdown.js'

// Todos os verbetes: nada de destaque quebrado ("]{...}" literal) e nenhuma fórmula fora do KaTeX
const DIR = join(__dirname, '../../../libs/ttwtools/ttwtools/data/help')
const files = ['pt', 'en'].flatMap((l) => readdirSync(join(DIR, l), { withFileTypes: true }).filter((d) => d.isDirectory())
  .flatMap((d) => readdirSync(join(DIR, l, d.name)).filter((f) => f.endsWith('.md')).map((f) => join(DIR, l, d.name, f))))

describe('verbetes de Aprender', () => {
  it.each(files.map((f) => [f.split('help/')[1], f]))('%s: destaques e fórmulas', (_n, f) => {
    const html = markdown(readFileSync(f, 'utf-8').split('\n---\n').slice(1).join('\n---\n'))
    expect(html).not.toMatch(/\]\{[^}]*\}/)
    expect(html).not.toMatch(/<code>[^<]*(√|Σ|[A-Za-z]\s=\s[^<]*\/)[^<]*<\/code>/)
    expect(html).not.toContain('<pre')   // fórmula em bloco de código: use $$...$$
    expect(html).toContain('class="hl"')
  })
})
