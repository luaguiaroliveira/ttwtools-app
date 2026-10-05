// Painel lateral direito redimensionável (arrastar a divisória), com colapso ao chegar perto da borda
// direita e reabertura arrastando de volta. Largura opcionalmente persistida. Serve à Dispersão
// (painel de etiquetas) e ao Leitor (painel de etiquetas), no mesmo padrão do `SplitPane`.
import { onBeforeUnmount, ref } from 'vue'

export function useResizablePane({ min = 200, max = 640, initial = 336, collapseAt = 120, storageKey = '' } = {}) {
  const stored = (() => { try { return Number(JSON.parse(localStorage.getItem(storageKey) || '{}').width) } catch { return 0 } })()
  const width = ref(Math.max(min, Math.min(max, stored || initial)))
  const open = ref(true)
  let box = null
  let dragging = false
  let startX = 0
  let moved = false
  const clamp = (v) => Math.max(min, Math.min(max, Math.round(v)))
  function persist() { if (storageKey) { try { localStorage.setItem(storageKey, JSON.stringify({ width: width.value })) } catch { /* */ } } }
  function onMove(e) {
    if (!dragging || !box) return
    if (Math.abs(e.clientX - startX) > 3) moved = true
    const w = box.getBoundingClientRect().right - e.clientX
    if (w <= collapseAt) { open.value = false } else { open.value = true; width.value = clamp(w) }
  }
  function onUp() {
    if (!dragging) return
    dragging = false
    globalThis.removeEventListener('pointermove', onMove)
    globalThis.removeEventListener('pointerup', onUp)
    if (!moved) { open.value = !open.value; if (open.value) width.value = clamp(width.value || min) }   // clique sem arrastar abre/fecha
    persist()
  }
  function onDown(e, containerEl) {
    box = containerEl
    dragging = true
    startX = e.clientX
    moved = false
    e.preventDefault()
    globalThis.addEventListener('pointermove', onMove)
    globalThis.addEventListener('pointerup', onUp)
  }
  function onKey(e) {
    const step = e.shiftKey ? 40 : 8
    if (e.key === 'ArrowLeft') {
      if (!open.value) { open.value = true; width.value = min } else width.value = clamp(width.value + step)
    } else if (e.key === 'ArrowRight') {
      if (!open.value) return
      const w = width.value - step
      if (w <= collapseAt) open.value = false; else width.value = clamp(w)
    } else if (e.key === 'Home') { open.value = true; width.value = max }
    else if (e.key === 'End') { open.value = false }
    else return
    e.preventDefault()
    persist()
  }
  onBeforeUnmount(onUp)
  return { width, open, onDown, onKey, min, max, collapseAt, persist }
}
