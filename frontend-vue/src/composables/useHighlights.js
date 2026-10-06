// Destaques animados (utils/annotate.js) sobre os <span class="hl"> de um verbete.
// Cada destaque se desenha quando entra na tela; ao mudar o tamanho da área, abrir um bloco recolhível
// ou trocar o tema, tudo é redesenhado sem animação. O olho (on) liga/desliga; cada verbete abre com os
// destaques OCULTOS.
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { annotate } from '../utils/annotate.js'
import { penColor } from '../utils/highlights.js'

export function useHighlights(container) {
  const on = ref(false)
  const count = ref(0)
  let items = []
  let io = null
  let ro = null
  let mo = null
  let timer = null

  const reduced = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const dark = () => getComputedStyle(document.documentElement).colorScheme.includes('dark')
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
      return annotate(el, { type, color: penColor(type, el.dataset.hlColor, dark()), animate })
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
    on.value = false
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
  watch(on, () => build(true))
  onBeforeUnmount(() => { clear(); ro?.disconnect(); mo?.disconnect(); clearTimeout(timer) })
  return { on, count, start }
}
