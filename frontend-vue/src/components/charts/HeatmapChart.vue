<script setup>
// Mapa de calor: uma linha por texto, uma coluna por atributo (z). Zoom global, horizontal e vertical do tamanho
// dos blocos (as letras não mudam de tamanho); a rolagem fica dentro da área do gráfico.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { diverging } from '../../utils/scale.js'
const props = defineProps({ heat: Object })
const emit = defineEmits(['open'])
const { t } = useI18n()
const BASE_W = 22, BASE_H = 8, HEAD = 22, TOP = 70, PAD = 12
const zoom = ref(2.4)        // global
const zx = ref(1)            // só horizontal
const zy = ref(1)            // só vertical
const reset = () => { zoom.value = 2.4; zx.value = 1; zy.value = 1 }
const cw = computed(() => BASE_W * zoom.value * zx.value)
const rh = computed(() => BASE_H * zoom.value * zy.value)
// posição de cada linha; cada lado ganha um título acima dos seus blocos
const layout = computed(() => {
  let y = TOP
  return props.heat.rows.map((r, i) => {
    const first = i === 0 || props.heat.rows[i - 1].side !== r.side
    if (first) y += HEAD
    const out = { r, y, first }
    y += rh.value
    return out
  })
})
const height = computed(() => (layout.value.length ? layout.value[layout.value.length - 1].y + rh.value : TOP) + PAD)
const width = computed(() => PAD + props.heat.features.length * cw.value + PAD)
const labelFont = computed(() => Math.max(9, Math.min(13, cw.value * 0.6)))
</script>
<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-end gap-3" data-testid="heatmap-controls">
      <label class="ttw-field w-40"><span class="ttw-label">{{ t('gallery.zoom_global') }}: {{ Math.round(zoom / 2.4 * 100) }}%</span>
        <input v-model.number="zoom" type="range" min="0.6" max="8" step="0.1" class="range range-xs range-primary" data-testid="heatmap-zoom" :aria-label="t('gallery.zoom_global')" /></label>
      <label class="ttw-field w-36"><span class="ttw-label">{{ t('gallery.zoom_h') }}: {{ Math.round(zx * 100) }}%</span>
        <input v-model.number="zx" type="range" min="0.3" max="4" step="0.05" class="range range-xs" data-testid="heatmap-zoom-x" :aria-label="t('gallery.zoom_h')" /></label>
      <label class="ttw-field w-36"><span class="ttw-label">{{ t('gallery.zoom_v') }}: {{ Math.round(zy * 100) }}%</span>
        <input v-model.number="zy" type="range" min="0.3" max="6" step="0.05" class="range range-xs" data-testid="heatmap-zoom-y" :aria-label="t('gallery.zoom_v')" /></label>
      <button type="button" class="btn btn-sm" @click="reset">{{ t('gallery.zoom_reset') }}</button>
    </div>
    <p class="text-xs text-text-muted">{{ t('gallery.open_reader') }}</p>
    <div class="overflow-auto max-h-[75vh] rounded-box border border-base-300">
      <svg :width="width" :height="height" role="group" :aria-label="t('gallery.heatmap')" style="max-width: none">
        <g v-for="(f, j) in heat.features" :key="f">
          <text :x="PAD + j * cw + cw / 2" :y="TOP - 6" :transform="`rotate(-55 ${PAD + j * cw + cw / 2} ${TOP - 6})`" :font-size="labelFont" class="fill-current">{{ f }}</text>
        </g>
        <g v-for="l in layout" :key="l.r.side + l.r.filename">
          <text v-if="l.first" :x="PAD" :y="l.y - 6" font-size="13" font-weight="bold" class="fill-current">{{ l.r.side }}</text>
          <rect v-for="(z, j) in l.r.z" :key="j" :x="PAD + j * cw" :y="l.y" :width="Math.max(1, cw - 1)" :height="Math.max(1, rh - 1)" :fill="diverging(z ?? 0)"
                class="cursor-pointer" tabindex="0" role="link" :aria-label="t('gallery.open_text', { file: l.r.filename })"
                @click="emit('open', l.r)" @keydown.enter="emit('open', l.r)"><title>{{ l.r.filename }} · {{ heat.features[j] }}: z {{ (z ?? 0).toFixed(2) }}</title></rect>
        </g>
      </svg>
    </div>
  </div>
</template>
