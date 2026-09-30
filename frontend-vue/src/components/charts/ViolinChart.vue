<script setup>
// Densidade (núcleo gaussiano) de cada atributo por lado, espelhada.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SIDE_CLASS } from '../../utils/scale.js'
const props = defineProps({ matrix: Object })
const { t } = useI18n()
const COL = 70, H = 220
const kde = (vals, max) => {
  const n = vals.length || 1
  const sd = Math.sqrt(vals.reduce((a, v) => a + (v - vals.reduce((x, y) => x + y, 0) / n) ** 2, 0) / n) || max / 10 || 1
  const bw = 1.06 * sd * n ** -0.2
  const pts = Array.from({ length: 40 }, (_, i) => (i / 39) * max)
  return pts.map((x) => [x, vals.reduce((a, v) => a + Math.exp(-(((x - v) / bw) ** 2) / 2), 0) / (n * bw)])
}
const shapes = computed(() => props.matrix.features.map((f) => {
  const max = Math.max(1e-9, ...props.matrix.rows.map((r) => r.values[f] ?? 0))
  return { f, sides: props.matrix.sides.map((s) => kde(props.matrix.rows.filter((r) => r.side === s).map((r) => r.values[f] ?? 0), max)), max }
}))
const path = (dens, side) => {
  const peak = Math.max(1e-12, ...dens.map((d) => d[1]))
  const max = dens[dens.length - 1][0] || 1
  const y = (x) => H - 20 - (x / max) * (H - 40)
  const w = (d) => (d / peak) * (COL / 2 - 6) * (side === 0 ? -1 : 1)
  return `M ${COL / 2} ${y(0)} ` + dens.map(([x, d]) => `L ${COL / 2 + w(d)} ${y(x)}`).join(' ') + ` L ${COL / 2} ${y(max)} Z`
}
</script>
<template>
  <svg :viewBox="`0 0 ${matrix.features.length * COL} ${H}`" class="w-full" role="group" :aria-label="t('gallery.violin')">
    <g v-for="(s, i) in shapes" :key="s.f" :transform="`translate(${i * COL} 0)`">
      <path v-for="(d, k) in s.sides.slice(0, 2)" :key="k" :d="path(d, k)" :class="SIDE_CLASS[k]" fill-opacity="0.35" />
      <text :x="COL / 2" :y="H - 5" text-anchor="middle" class="fill-current text-[9px]">{{ s.f }}</text>
    </g>
  </svg>
</template>
