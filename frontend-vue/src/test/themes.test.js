import { describe, expect, it } from 'vitest'
import { BUTTON_STYLES, FONTS, THEME_DEFS, themeVars } from '../themes.js'

function lum(h) {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

describe('temas', () => {
  it('são 20, com ids únicos e fontes/botões existentes', () => {
    expect(THEME_DEFS).toHaveLength(20)
    expect(new Set(THEME_DEFS.map((d) => d.id)).size).toBe(20)
    for (const d of THEME_DEFS) {
      expect(FONTS[d.font], d.id).toBeTruthy()
      if (d.display) expect(FONTS[d.display], d.id).toBeTruthy()
      expect(BUTTON_STYLES, d.id).toContain(d.btn)
    }
  })
  it.each(THEME_DEFS.map((d) => [d.id, d]))('%s: contrastes (WCAG AA)', (_id, d) => {
    const min = (a, b, n, what) => expect(cr(a, b), `${d.id} ${what}`).toBeGreaterThanOrEqual(n)
    min(d.tx, d.b1, 7, 'texto/página'); min(d.tx, d.b2, 7, 'texto/painel'); min(d.tx, d.b3, 4.5, 'texto/divisória')
    min(d.mu, d.b1, 4.5, 'secundário/página'); min(d.mu, d.b2, 4.5, 'secundário/painel')
    min(d.ink, d.b1, 4.5, 'link/página'); min(d.ink, d.b2, 4.5, 'link/painel')
    min(d.pc, d.pr, 4.5, 'texto do botão'); min(d.sc, d.se, 4.5, 'texto do botão secundário')
    min(d.pr, d.b1, 3, 'botão/página')
    min(d.bd, d.b1, 3, 'borda/página'); min(d.bd, d.b2, 3, 'borda/painel')
    const v = themeVars(d)
    for (const k of ['info', 'success', 'warning', 'error']) {
      min(v[`--color-${k}-content`], v[`--color-${k}`], 4.5, `${k} texto`); min(v[`--color-${k}`], d.b1, 3, `${k}/página`)
    }
  })
})
