<script setup>
// Dispersão: uma linha por texto, desenhada num <canvas> (rápido mesmo com muitas ocorrências).
// Cada consulta vira uma camada de traços translúcidos na sua cor (uma etiqueta = uma camada) sobre
// o fundo de densidade combinada. Reusado no Explorar (várias consultas coloridas) e no Comparar (um
// quadro por lado). `view='bars'` esconde o fundo; `view='heat'` (camadas) mostra o fundo.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { distinctLabels } from '../../utils/labels.js'
import { bandAlpha, bandCounts, combinedDensity } from '../../utils/dispersion.js'
const props = defineProps({
  rows: { type: Array, required: true },     // [{ filename, size, cells: [{ freq, positions }] }]
  colors: { type: Array, required: true },   // cor de cada consulta (mesma ordem das cells)
  bands: { type: Number, default: 10 },
  rowH: { type: Number, default: 14 },
  view: { type: String, default: 'heat' },   // 'heat' (camadas) | 'bars'
})
const emit = defineEmits(['open'])
const { t } = useI18n()
const listEl = ref(null)
const canvases = ref([])
const setCanvas = (el, i) => { canvases.value[i] = el }
const labels = computed(() => distinctLabels(props.rows.map((r) => r.filename), 26))
const totalFreq = (i) => props.rows[i].cells.reduce((s, c) => s + (c.freq ?? 0), 0)
const heat = computed(() => combinedDensity(
  props.colors.map((_, qi) => props.rows.map((r) => bandCounts(r.cells[qi]?.positions, props.bands))),
  props.rows.map((r) => r.size), props.bands))

function bandColor(cv) {
  const cs = globalThis.getComputedStyle?.(cv)
  return (cs?.getPropertyValue('--disp-band').trim()) || (cs?.getPropertyValue('--color-base-content').trim()) || '#333'
}
function drawRow(i) {
  const cv = canvases.value[i]
  if (!cv) return
  const dpr = globalThis.devicePixelRatio || 1
  const w = cv.parentElement?.clientWidth || cv.clientWidth || 0
  const h = props.rowH
  if (!w) return
  cv.width = Math.max(1, Math.round(w * dpr))
  cv.height = Math.max(1, Math.round(h * dpr))
  cv.style.width = `${w}px`
  cv.style.height = `${h}px`
  const ctx = cv.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  const row = props.rows[i]
  if (props.view === 'heat') {                      // fundo: densidade combinada das consultas
    ctx.fillStyle = bandColor(cv)
    const step = w / props.bands
    heat.value.rows[i].forEach((v, b) => {
      const a = bandAlpha(v, heat.value.max)
      if (a > 0) { ctx.globalAlpha = a; ctx.fillRect(b * step, 0, step + 0.5, h) }
    })
  }
  const tw = props.view === 'heat' ? 2.5 : 2     // traços: camadas translúcidas (heat) ou opacos (bars)
  ctx.globalAlpha = props.view === 'heat' ? 0.5 : 0.95
  props.colors.forEach((color, qi) => {
    ctx.fillStyle = color
    for (const p of row.cells[qi]?.positions ?? []) ctx.fillRect(Math.min(w - tw, p * w), 0, tw, h)
  })
  ctx.globalAlpha = 1
}
let raf = 0
function drawAll() {
  canvases.value.length = props.rows.length
  for (let i = 0; i < props.rows.length; i++) drawRow(i)
}
function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(drawAll) }
let ro
onMounted(() => {
  nextTick(drawAll)
  if (listEl.value && globalThis.ResizeObserver) { ro = new ResizeObserver(schedule); ro.observe(listEl.value) }
  globalThis.addEventListener?.('resize', schedule)
})
onBeforeUnmount(() => { ro?.disconnect(); globalThis.removeEventListener?.('resize', schedule); cancelAnimationFrame(raf) })
watch(() => [props.rows, props.colors, props.bands, props.rowH, props.view], () => nextTick(drawAll), { deep: false })
</script>
<template>
  <ul ref="listEl" class="ttw-scroll rounded-box border border-base-300 p-1" data-testid="disp-rows">
    <li v-for="(d, i) in rows" :key="d.filename">
      <button type="button" class="disp-row" :style="{ height: `${rowH}px`, fontSize: `${Math.max(8, Math.min(12, rowH - 3))}px` }"
              :title="`${d.filename}: ${totalFreq(i)}`" :aria-label="`${t('explore.open_text')}: ${d.filename} (${totalFreq(i)})`" @click="emit('open', d.filename)">
        <span class="disp-label">{{ labels[i] }}</span>
        <span class="disp-strip"><canvas :ref="(el) => setCanvas(el, i)" class="disp-canvas" aria-hidden="true" /></span>
        <span class="disp-n">{{ totalFreq(i) }}</span>
      </button>
    </li>
  </ul>
</template>
