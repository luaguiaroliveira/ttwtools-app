import { describe, expect, it } from 'vitest'
import { markdown } from '../utils/markdown.js'
describe('markdown', () => {
  it('títulos, listas, negrito, código e escape', () => {
    const html = markdown('## Como ler\n- **Sinal:** positivo\n- `d`\n\ntexto <b>x</b>\n\n    d = a / b')
    expect(html).toContain('<h3>Como ler</h3>')
    expect(html).toContain('<li><strong>Sinal:</strong> positivo</li>')
    expect(html).toContain('<li><code>d</code></li>')
    expect(html).toContain('<p>texto &lt;b&gt;x&lt;/b&gt;</p>')
    expect(html).toContain('<pre tabindex="0"><code>d = a / b</code></pre>')
  })
  it('fórmulas KaTeX em linha e em bloco, sem tocar em código com $', () => {
    const html = markdown('Vale $M_1 - M_2$ e `/^run$/`.\n\n$$d = \\frac{a}{b}$$')
    expect(html).toContain('class="katex"')
    expect(html).toContain('<code>/^run$/</code>')
    expect(html).toContain('class="math-block"')
    expect(html).toContain('katex-display')
  })
  // O split das células não pode usar lookbehind `(?<!`)`: o WebKit do macOS 12 (Safari 17.6)
  // recusa a expressão e a tela do tópico fica em branco (por isso a KFA sumia no Tauri).
  it('tabela com pipe escapado e bloco recolhível', () => {
    const html = markdown('| A | B |\n| --- | --- |\n| x \\| y | z |\n\n:::details Título\ncorpo\n:::')
    expect(html).toContain('<table>')
    expect(html).toContain('<td>x | y</td>')
    expect(html).toContain('<td>z</td>')
    expect(html).toContain('<details><summary><strong>Título</strong></summary>')
  })
})
