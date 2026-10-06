import { describe, expect, it } from 'vitest'
import { hexToRgba } from '../composables/useHighlights.js'
import { markdown } from '../utils/markdown.js'
import { parseSpec } from '../utils/highlights.js'

describe('destaques dos verbetes', () => {
  it('interpreta tipo e cor em qualquer ordem, em pt ou en', () => {
    expect(parseSpec('circulo')).toEqual({ type: 'circle', color: '' })
    expect(parseSpec('azul sublinhado')).toEqual({ type: 'underline', color: 'azul' })
    expect(parseSpec('Box, green')).toEqual({ type: 'box', color: 'green' })
    expect(parseSpec('marca #E11D48')).toEqual({ type: 'highlight', color: '#e11d48' })
    expect(parseSpec('azul')).toBeNull()
    expect(parseSpec('rodopio')).toBeNull()
  })
  it('[texto]{tipo} e ==texto== viram <span class="hl">; especificação inválida fica como texto', () => {
    expect(markdown('veja [o d de Cohen]{circulo azul} aqui')).toContain('<span class="hl" data-hl="circle" data-hl-color="azul">o d de Cohen</span>')
    expect(markdown('uma ==ideia central== do texto')).toContain('<span class="hl" data-hl="highlight" data-hl-color="">ideia central</span>')
    expect(markdown('[x]{errado}')).toContain('[x]{errado}')
  })
  it('convive com negrito, itálico e fórmulas', () => {
    const h = markdown('[**forte** e *leve*]{caixa} e $d=1$')
    expect(h).toContain('<span class="hl" data-hl="box"')
    expect(h).toContain('<strong>forte</strong>')
    expect(h).toContain('katex')
  })
  it('cor translúcida a partir de hexadecimal', () => {
    expect(hexToRgba('#FF8000', 0.4)).toBe('rgba(255, 128, 0, 0.4)')
  })
})
