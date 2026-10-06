// Destaques animados (rough-notation) sobre os <span class="hl"> de um verbete.
// Cada destaque se desenha quando entra na tela; ao mudar o tamanho da área, abrir um bloco recolhível
// ou trocar o tema, tudo é redesenhado sem animação. O olho (on) liga/desliga; a escolha fica guardada.
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { annotate } from 'rough-notation'
import { HL_COLORS } from '../utils/highlights.js'

const STORAGE = 'ttw.highlights'

export function hexToRgba(hex, alpha) {
  const h = hex.trim().replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(h)) return hex.trim()
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function useHighlights(container) {
  let saved = true
  try { saved = localStorage.getItem(STORAGE) !== '0' } catch { /* */ }
  const on = ref(saved)
  const count = ref(0)
  let items = []
  let io = null
  let ro = null
  let mo = null
  let timer = null

  const reduced = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const color = (name, type) => {
    const css = getComputedStyle(document.documentElement)
    const raw = css.getPropertyValue(name ? HL_COLORS[name] : '--ttw-orange-text').trim() || '#B8460A'
    return type === 'highlight' ? hexToRgba(raw, 0.38) : raw
  }
  const clear = () => {
    io?.disconnect(); io = null
    for (const a of items) a.remove()
    items = []
  }
  const build = (animated) => {
    clear()
    const els = [...(container.value?.querySelectorAll('.hl') ?? [])]
    count.value = els.length
    if (!on.value || !els.length) return
    const animate = animated && !reduced()
    const made = els.map((el) => {
      const type = el.dataset.hl
      return annotate(el, { type, color: color(el.dataset.hlColor, type), animate, animationDuration: 700, multiline: true,
        strokeWidth: type === 'highlight' ? 1 : 2, padding: type === 'box' || type === 'circle' ? 4 : 2, iterations: type === 'highlight' ? 1 : 2 })
    })
    items = made
    if (!animate) { made.forEach((a) => a.show()); return }
    // desenha ao entrar na tela (a ordem do texto dá o escalonamento)
    const byEl = new Map(els.map((el, i) => [el, made[i]]))
    io = new IntersectionObserver((entries) => {
      let n = 0
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const a = byEl.get(e.target)
        setTimeout(() => a.show(), 250 * n++)
        io.unobserve(e.target)
      }
    }, { threshold: 0.6 })
    els.forEach((el) => io.observe(el))
  }
  const rebuildSoon = () => { clearTimeout(timer); timer = setTimeout(() => build(false), 150) }

  const start = async () => {
    await nextTick()
    build(true)
    ro?.disconnect(); mo?.disconnect()
    if (container.value) {
      ro = new ResizeObserver(rebuildSoon); ro.observe(container.value)
      container.value.addEventListener('toggle', rebuildSoon, true)
    }
    mo = new MutationObserver(rebuildSoon)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'data-theme', 'data-btn'] })
  }
  watch(on, (v) => {
    try { localStorage.setItem(STORAGE, v ? '1' : '0') } catch { /* */ }
    build(true)
  })
  onBeforeUnmount(() => { clear(); ro?.disconnect(); mo?.disconnect(); clearTimeout(timer) })
  return { on, count, start }
}
