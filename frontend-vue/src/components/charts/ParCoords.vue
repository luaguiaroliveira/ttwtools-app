<script setup>
// Coordenadas paralelas: uma linha por texto. Controles para enxergar melhor quando há muitas linhas:
// opacidade e espessura, destacar um lado, zoom (roda do mouse ou botões) e arrastar; passar o mouse
// numa linha a destaca e mostra o texto; clicar abre o texto no Leitor.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { sideStroke } from '../../utils/scale.js'
const props = defineProps({ matrix: Object })
const emit = defineEmits(['open'])
const { t } = useI18n()
const H = 280
const W = computed(() => Math.max(400, props.matrix.features.length * 70))
const P = 20
const x = (j) => P + (j * (W.value - 2 * P)) / Math.max(1, props.matrix.features.length - 1)
const max = computed(() => Object.fromEntries(props.matrix.features.map((f) => [f, Math.max(1e-9, ...props.matrix.rows.map((r) => r.values[f] ?? 0))])))
const line = (r) => props.matrix.features.map((f, j) => `${x(j)},${H - 30 - ((r.values[f] ?? 0) / max.value[f]) * (H - 50)}`).join(' ')
const sideIndex = (side) => props.matrix.sides.indexOf(side)
const color = (side) => sideStroke(sideIndex(side))
const legend = computed(() => props.matrix.sides.map((s, i) => ({ side: s, color: sideStroke(i) })))

const alpha = ref(0.25)
const width = ref(1)
const focus = ref(-1)                      // -1 = todos os lados; senão o índice do lado destacado
const hover = ref(null)
const lines = computed(() => props.matrix.rows.map((r) => ({ r, points: line(r), i: sideIndex(r.side) })))
// o lado destacado fica por cima e opaco; os outros esmaecem
const ordered = computed(() => (focus.value < 0 ? lines.value : [...lines.value].sort((a, b) => Number(a.i === focus.value) - Number(b.i === focus.value))))
const opacityOf = (l) => (focus.value < 0 ? alpha.value : l.i === focus.value ? Math.min(1, alpha.value * 1.6) : Math.max(0.02, alpha.value * 0.15))
const hovered = computed(() => lines.value.find((l) => l.r.filename === hover.value && l.r.side === hoverSide.value) ?? null)
const hoverSide = ref(null)

// zoom e deslocamento por viewBox
const view = ref({ x: 0, y: 0, w: W.value, h: H })
const zoomed = computed(() => view.value.w < W.value - 1 || view.value.h < H - 1)
const svg = ref(null)
function zoomAt(factor, cx, cy) {
  const v = view.value
  const w = Math.min(W.value, Math.max(W.value / 12, v.w * factor)), h = Math.min(H, Math.max(H / 12, v.h * factor))
  const nx = cx - ((cx - v.x) / v.w) * w, ny = cy - ((cy - v.y) / v.h) * h
  view.value = { x: Math.min(W.value - w, Math.max(0, nx)), y: Math.min(H - h, Math.max(0, ny)), w, h }
}
function pointer(e) {
  const b = svg.value.getBoundingClientRect(), v = view.value
  return [v.x + ((e.clientX - b.left) / b.width) * v.w, v.y + ((e.clientY - b.top) / b.height) * v.h]
}
const wheel = (e) => { const [cx, cy] = pointer(e); zoomAt(e.deltaY < 0 ? 0.8 : 1.25, cx, cy) }
const zoomBtn = (f) => zoomAt(f, view.value.x + view.value.w / 2, view.value.y + view.value.h / 2)
const reset = () => { view.value = { x: 0, y: 0, w: W.value, h: H } }
let drag = null
const down = (e) => { if (e.target.tagName === 'polyline') return; drag = { cx: e.clientX, cy: e.clientY, v: { ...view.value } }; svg.value.setPointerCapture?.(e.pointerId) }
function move(e) {
  if (!drag) return
  const b = svg.value.getBoundingClientRect(), v = drag.v
  const nx = v.x - ((e.clientX - drag.cx) / b.width) * v.w, ny = v.y - ((e.clientY - drag.cy) / b.height) * v.h
  view.value = { ...v, x: Math.min(W.value - v.w, Math.max(0, nx)), y: Math.min(H - v.h, Math.max(0, ny)) }
}
const up = () => { drag = null }
</script>
<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-end gap-3" data-testid="parcoords-controls">
      <label class="ttw-field w-40"><span class="ttw-label">{{ t('gallery.alpha') }}: {{ Math.round(alpha * 100) }}%</span>
        <input v-model.number="alpha" type="range" min="0.02" max="1" step="0.01" class="range range-xs range-primary" data-testid="parcoords-alpha" :aria-label="t('gallery.alpha')" /></label>
      <label class="ttw-field w-32"><span class="ttw-label">{{ t('gallery.line_width') }}: {{ width.toFixed(1) }}</span>
        <input v-model.number="width" type="range" min="0.5" max="3" step="0.1" class="range range-xs" :aria-label="t('gallery.line_width')" /></label>
      <label class="ttw-field"><span class="ttw-label">{{ t('gallery.focus_side') }}</span>
        <select v-model.number="focus" class="select select-sm" data-testid="parcoords-focus">
          <option :value="-1">{{ t('gallery.focus_all') }}</option><option v-for="(s, i) in matrix.sides" :key="s" :value="i">{{ s }}</option></select></label>
      <div class="flex items-center gap-1" role="group" aria-label="zoom">
        <button type="button" class="btn btn-sm btn-square" :aria-label="'+'" @click="zoomBtn(0.8)">+</button>
        <button type="button" class="btn btn-sm btn-square" :aria-label="'−'" @click="zoomBtn(1.25)">−</button>
        <button type="button" class="btn btn-sm" :disabled="!zoomed" @click="reset">{{ t('gallery.zoom_reset') }}</button></div>
    </div>
    <p class="text-xs text-text-muted">{{ t('gallery.zoom_hint') }} {{ t('gallery.open_reader') }}</p>
    <p class="min-h-5 text-sm" aria-live="polite" data-testid="parcoords-hover">{{ hovered ? `${hovered.r.side} · ${hovered.r.filename}` : '' }}</p>
    <svg ref="svg" :viewBox="`${view.x} ${view.y} ${view.w} ${view.h}`" class="w-full touch-none select-none" :class="zoomed ? 'cursor-grab' : ''" role="group" :aria-label="t('gallery.parcoords')"
         @wheel.prevent="wheel" @pointerdown="down" @pointermove="move" @pointerup="up" @pointerleave="up">
      <g v-for="(f, j) in matrix.features" :key="f"><line :x1="x(j)" :x2="x(j)" y1="20" :y2="H - 30" class="stroke-current opacity-30" vector-effect="non-scaling-stroke" />
        <text :x="x(j)" :y="H - 12" text-anchor="middle" class="fill-current text-[9px]">{{ f }}</text></g>
      <polyline v-for="l in ordered" :key="l.r.side + l.r.filename" :points="l.points" fill="none" :stroke="color(l.r.side)" :stroke-width="width"
                :stroke-opacity="opacityOf(l)" vector-effect="non-scaling-stroke" class="cursor-pointer" style="pointer-events: stroke"
                @mouseenter="hover = l.r.filename; hoverSide = l.r.side" @mouseleave="hover = null" @click="emit('open', { side: l.r.side, filename: l.r.filename })"><title>{{ l.r.filename }}</title></polyline>
      <polyline v-if="hovered" :points="hovered.points" fill="none" :stroke="color(hovered.r.side)" :stroke-width="width + 2.5" stroke-opacity="1" vector-effect="non-scaling-stroke" pointer-events="none" />
    </svg>
    <ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs" :aria-label="t('gallery.legend')">
      <li v-for="l in legend" :key="l.side" class="flex items-center gap-1">
        <span class="inline-block w-3 h-1 rounded" :style="{ background: l.color }" aria-hidden="true"></span>{{ l.side }}
      </li>
    </ul>
  </div>
</template>
