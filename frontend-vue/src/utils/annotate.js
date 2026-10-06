// Desenha o destaque de um trecho com traço à mão (roughjs), em SVG, com animação de "escrever".
// Só dois tipos: `highlight` (marca-texto) e `underline` (caneta). O traço é pouco torto de propósito.
// O SVG é absoluto (top/left 0): precisa de um ancestral posicionado que role junto com o texto.
import rough from 'roughjs/bundled/rough.esm.js'

const NS = 'http://www.w3.org/2000/svg'
const gen = rough.generator()
// poucas ondulações: aspecto de caneta, sem ficar torto
const WOBBLE = { roughness: 0.45, bowing: 0.6, maxRandomnessOffset: 1.2, disableMultiStroke: true }

export function annotate(el, { type, color, animate = true }) {
  let svg = null
  const seed = Math.floor(Math.random() * 2 ** 31)

  const attach = () => {
    if (svg || !el.parentElement) return
    svg = document.createElementNS(NS, 'svg')
    svg.setAttribute('class', 'rough-annotation')
    svg.setAttribute('aria-hidden', 'true')
    Object.assign(svg.style, { position: 'absolute', top: '0', left: '0', width: '100px', height: '100px', overflow: 'visible', pointerEvents: 'none' })
    if (type === 'highlight') {
      el.insertAdjacentElement('beforebegin', svg)   // atrás do texto
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative'
    } else el.insertAdjacentElement('afterend', svg)
  }

  const draw = (animated) => {
    while (svg.lastChild) svg.removeChild(svg.lastChild)
    const origin = svg.getBoundingClientRect()
    const rects = [...el.getClientRects()].filter((r) => r.width > 1)
    const total = rects.reduce((n, r) => n + r.width, 0) || 1
    let delay = 0
    for (const r of rects) {
      const x = r.left - origin.left
      const y = r.top - origin.top
      const line = type === 'highlight'
        ? gen.line(x - 2, y + r.height / 2, x + r.width + 2, y + r.height / 2, { ...WOBBLE, roughness: 0.3, bowing: 0.3, seed })
        : gen.line(x, y + r.height + 1, x + r.width, y + r.height + 1, { ...WOBBLE, seed })
      const width = type === 'highlight' ? r.height * 0.92 : 1.8
      const ms = 700 * (r.width / total)
      for (const info of gen.toPaths(line)) {
        const path = document.createElementNS(NS, 'path')
        path.setAttribute('d', info.d)
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke', color)
        path.setAttribute('stroke-width', String(width))
        path.setAttribute('stroke-linecap', type === 'highlight' ? 'butt' : 'round')
        if (type === 'highlight') path.setAttribute('stroke-opacity', '0.45')
        svg.appendChild(path)
        if (animated) {
          const len = path.getTotalLength()
          path.style.strokeDasharray = String(len)
          path.style.strokeDashoffset = String(len)
          path.style.animation = `ttw-hl-draw ${ms}ms ease-out ${delay}ms forwards`
        }
      }
      delay += ms
    }
  }

  return {
    show(animated = animate) { attach(); if (svg) draw(animated) },
    remove() { svg?.remove(); svg = null },
  }
}
