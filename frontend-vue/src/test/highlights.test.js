import { describe, expect, it } from 'vitest'
import { markdown } from '../utils/markdown.js'
import { parseSpec, penColor } from '../utils/highlights.js'

describe('destaques dos verbetes', () => {
  it('interpreta tipo e cor em qualquer ordem, em pt ou en', () => {
    expect(parseSpec('marca')).toEqual({ type: 'highlight', color: '' })
    expect(parseSpec('azul sublinhado')).toEqual({ type: 'underline', color: 'azul' })
    expect(parseSpec('Highlight, yellow')).toEqual({ type: 'highlight', color: 'yellow' })
    expect(parseSpec('marca #E11D48')).toEqual({ type: 'highlight', color: '#e11d48' })
    expect(parseSpec('azul')).toBeNull()
    expect(parseSpec('circulo')).toBeNull()
  })
  it('[texto]{tipo} e ==texto== viram <span class="hl">; especificação inválida fica como texto', () => {
    expect(markdown('veja [o d de Cohen]{sublinhado azul} aqui')).toContain('<span class="hl" data-hl="underline" data-hl-color="azul">o d de Cohen</span>')
    expect(markdown('uma ==ideia central== do texto')).toContain('<span class="hl" data-hl="highlight" data-hl-color="">ideia central</span>')
    expect(markdown('[x]{errado}')).toContain('[x]{errado}')
  })
  it('convive com negrito, itálico e fórmulas', () => {
    const h = markdown('[**forte** e *leve*]{marca verde} e $d=1$')
    expect(h).toContain('<span class="hl" data-hl="highlight"')
    expect(h).toContain('<strong>forte</strong>')
    expect(h).toContain('katex')
  })
  it('cores de caneta: pt e en iguais; padrões; tinta clareia no tema escuro', () => {
    expect(penColor('highlight', 'yellow', false)).toBe(penColor('highlight', 'amarelo', false))
    expect(penColor('highlight', '', false)).toBe('#FFE600')
    expect(penColor('underline', '', false)).toBe('#1D4ED8')
    expect(penColor('underline', 'azul', true)).not.toBe(penColor('underline', 'azul', false))
    expect(penColor('highlight', '#abcdef', true)).toBe('#abcdef')
  })
})
