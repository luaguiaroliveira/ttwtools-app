<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SIDE_CLASS } from '../../utils/scale.js'
const props = defineProps({ matrix: Object })
const { t } = useI18n()
const H = 280, P = 20
const W = computed(() => Math.max(400, props.matrix.features.length * 70))
const x = (j) => P + (j * (W.value - 2 * P)) / Math.max(1, props.matrix.features.length - 1)
const max = computed(() => Object.fromEntries(props.matrix.features.map((f) => [f, Math.max(1e-9, ...props.matrix.rows.map((r) => r.values[f] ?? 0))])))
const line = (r) => props.matrix.features.map((f, j) => `${x(j)},${H - 30 - ((r.values[f] ?? 0) / max.value[f]) * (H - 50)}`).join(' ')
</script>
<template>
  <svg :viewBox="`0 0 ${W} ${H}`" class="w-full" role="group" :aria-label="t('gallery.parcoords')">
    <g v-for="(f, j) in matrix.features" :key="f"><line :x1="x(j)" :x2="x(j)" y1="20" :y2="H - 30" class="stroke-current opacity-30" />
      <text :x="x(j)" :y="H - 12" text-anchor="middle" class="fill-current text-[9px]">{{ f }}</text></g>
    <polyline v-for="r in matrix.rows" :key="r.filename" :points="line(r)" fill="none" :class="SIDE_CLASS[Math.max(0, matrix.sides.indexOf(r.side))]" stroke-opacity="0.35"><title>{{ r.filename }}</title></polyline>
  </svg>
</template>
