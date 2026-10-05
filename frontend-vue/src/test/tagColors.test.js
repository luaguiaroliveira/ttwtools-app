import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTagColors } from '../stores/tagColors.js'
import { PALETTES, PALETTE, readableOn } from '../utils/colorPalettes.js'

describe('cores das etiquetas', () => {
  beforeEach(() => { setActivePinia(createPinia()); localStorage.clear() })

  it('cor padrão é estável por etiqueta e dentro da paleta categórica', () => {
    const s = useTagColors()
    expect(s.color('NN')).toBe(s.color('NN'))
    expect(s.color('NN')).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('cor escolhida vence e é persistida; reset volta ao padrão', () => {
    const s = useTagColors()
    const before = s.color('JJ')
    s.set('JJ', '#123456')
    expect(s.color('JJ')).toBe('#123456')
    expect(JSON.parse(localStorage.getItem('ttw.tagColors')).JJ).toBe('#123456')
    s.reset('JJ')
    expect(s.color('JJ')).toBe(before)
  })

  it('paletas e cor legível', () => {
    expect(PALETTES[0].colors).toEqual(PALETTE.slice(0, 12))
    expect(readableOn('#ffffff')).toBe('#111')
    expect(readableOn('#000000')).toBe('#fff')
  })
})
