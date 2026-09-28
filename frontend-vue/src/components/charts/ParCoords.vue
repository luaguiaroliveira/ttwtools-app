<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { sideStroke } from '../../utils/scale.js'
const props = defineProps({ matrix: Object })
const { t } = useI18n()
const H = 280, P = 20
const W = computed(() => Math.max(400, props.matrix.features.length * 70))
const x = (j) => P + (j * (W.value - 2 * P)) / Math.max(1, props.matrix.features.length - 1)
const max = computed(() => Object.fromEntries(props.matrix.features.map((f) => [f, Math.max(1e-9, ...props.matrix.rows.map((r) => r.values[f] ?? 0))])))
const line = (r) => props.matrix.features.map((f, j) => `${x(j)},${H - 30 - ((r.values[f] ?? 0) / max.value[f]) * (H - 50)}`).join(' ')
const color = (side) => sideStroke(props.matrix.sides.indexOf(side))
const legend = computed(() => props.matrix.sides.map((s, i) => ({ side: s, color: sideStroke(i) })))
</script>
<template>
  <div class="flex flex-col gap-2">
    <div class="overflow-x-auto">
      <svg :viewBox="`0 0 ${W} ${H}`" :style="{ width: W + 'px', maxWidth: 'none' }" role="group" :aria-label="t('gallery.parcoords')">
        <g v-for="(f, j) in matrix.features" :key="f"><line :x1="x(j)" :x2="x(j)" y1="20" :y2="H - 30" class="stroke-current opacity-30" />
          <text :x="x(j)" :y="H - 12" text-anchor="middle" class="fill-current text-[9px]">{{ f }}</text></g>
        <polyline v-for="r in matrix.rows" :key="r.filename" :points="line(r)" fill="none" :stroke="color(r.side)" stroke-width="1" stroke-opacity="0.4"><title>{{ r.filename }}</title></polyline>
      </svg>
    </div>
    <ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs" :aria-label="t('gallery.legend')">
      <li v-for="l in legend" :key="l.side" class="flex items-center gap-1">
        <span class="inline-block w-3 h-1 rounded" :style="{ background: l.color }" aria-hidden="true"></span>{{ l.side }}
      </li>
    </ul>
  </div>
</template>
