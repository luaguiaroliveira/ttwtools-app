<script setup>
// Mapa de calor da dispersão: uma linha por texto, colunas = faixas de posição (densidade por 1000
// tokens no fundo) e um traço por ocorrência na cor da consulta. Reusado no Explorar (várias consultas
// coloridas) e no Comparar (um quadro por lado, na cor do lado). `view='bars'` esconde as faixas.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { distinctLabels } from '../../utils/labels.js'
import { bandAlpha, bandCounts, combinedDensity } from '../../utils/dispersion.js'
const props = defineProps({
  rows: { type: Array, required: true },     // [{ filename, size, cells: [{ freq, positions }] }]
  colors: { type: Array, required: true },   // cor de cada consulta (mesma ordem das cells)
  bands: { type: Number, default: 10 },
  rowH: { type: Number, default: 14 },
  view: { type: String, default: 'heat' },   // 'heat' | 'bars'
})
const emit = defineEmits(['open'])
const { t } = useI18n()
const ROW = 13
const step = computed(() => 100 / props.bands)
const fontPx = computed(() => Math.max(8, Math.min(12, props.rowH - 3)))
const labels = computed(() => distinctLabels(props.rows.map((r) => r.filename), 26))
const heat = computed(() => combinedDensity(
  props.colors.map((_, qi) => props.rows.map((r) => bandCounts(r.cells[qi]?.positions, props.bands))),
  props.rows.map((r) => r.size), props.bands))
const ticksOf = (i) => props.rows[i].cells.flatMap((c, qi) =>
  (c.positions ?? []).map((p) => ({ p, color: props.colors[qi] }))).sort((a, b) => a.p - b.p)
const totalFreq = (i) => props.rows[i].cells.reduce((s, c) => s + (c.freq ?? 0), 0)
</script>
<template>
  <div class="flex flex-col">
    <ul class="ttw-scroll rounded-box border border-base-300 p-1" data-testid="disp-rows">
      <li v-for="(d, i) in rows" :key="d.filename">
        <button type="button" class="disp-row" :style="{ height: `${rowH}px`, fontSize: `${fontPx}px` }" :title="`${d.filename}: ${totalFreq(i)}`"
                :aria-label="`${t('explore.open_text')}: ${d.filename} (${totalFreq(i)})`" @click="emit('open', d.filename)">
          <span class="disp-label">{{ labels[i] }}</span>
          <span class="disp-strip">
            <template v-if="view === 'heat'">
              <i v-for="(v, b) in heat.rows[i]" v-show="v > 0" :key="`b-${b}`" class="disp-band"
                 :style="{ left: `${b * step}%`, width: `${step}%`, opacity: bandAlpha(v, heat.max) }" />
            </template>
            <i v-for="(tk, k) in ticksOf(i)" :key="`t-${k}`" class="disp-tick" :style="{ left: `${tk.p * 100}%`, background: tk.color }" />
          </span>
          <span class="disp-n">{{ totalFreq(i) }}</span>
        </button>
      </li>
    </ul>
    <!-- cópia em SVG só para exportar (SVG/PNG); fora da tela e escondida dos leitores de tela -->
    <div class="absolute w-0 h-0 overflow-hidden invisible" aria-hidden="true">
      <svg :viewBox="`0 0 640 ${rows.length * ROW + 4}`" width="640" :height="rows.length * ROW + 4">
        <g v-for="(d, i) in rows" :key="d.filename" :transform="`translate(0 ${i * ROW + 2})`">
          <text x="200" :y="ROW - 4" text-anchor="end" class="fill-current text-[10px]">{{ labels[i] }}</text>
          <rect x="208" y="1" width="424" :height="ROW - 3" class="fill-base-200" />
          <template v-if="view === 'heat'">
            <rect v-for="(v, b) in heat.rows[i]" v-show="v > 0" :key="`sb-${b}`" :x="208 + b * (424 / bands)" y="1" :width="424 / bands" :height="ROW - 3"
                  class="disp-svg-band" :opacity="bandAlpha(v, heat.max)" />
          </template>
          <rect v-for="(tk, k) in ticksOf(i)" :key="`st-${k}`" :x="208 + tk.p * 424" y="1" width="1.500" :height="ROW - 3" :fill="tk.color" />
        </g>
      </svg>
    </div>
  </div>
</template>
