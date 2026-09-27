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
})
