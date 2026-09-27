<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { SIDE_CLASS } from '../../utils/scale.js'
const props = defineProps({ matrix: Object })
const { t } = useI18n()
const feature = ref(props.matrix.features[0])
const BINS = 12, W = 520, H = 240
const bins = computed(() => {
  const vals = props.matrix.rows.map((r) => r.values[feature.value] ?? 0)
  const max = Math.max(1e-9, ...vals)
  return props.matrix.sides.map((s) => {
    const c = Array(BINS).fill(0)
    for (const r of props.matrix.rows.filter((x) => x.side === s)) c[Math.min(BINS - 1, Math.floor(((r.values[feature.value] ?? 0) / max) * BINS))]++
    return c
  })
})
const top = computed(() => Math.max(1, ...bins.value.flat()))
</script>
<template>
  <div class="flex flex-col gap-1">
    <label class="text-sm flex items-center gap-2">{{ t('gallery.feature') }}
      <select v-model="feature" class="select select-xs"><option v-for="f in matrix.features" :key="f">{{ f }}</option></select></label>
    <svg :viewBox="`0 0 ${W} ${H}`" class="w-full max-w-2xl" role="group" :aria-label="t('gallery.histogram')">
      <g v-for="(c, s) in bins.slice(0, 2)" :key="s">
        <rect v-for="(n, i) in c" :key="i" :x="20 + i * ((W - 30) / BINS) + s * ((W - 30) / BINS / 2)" :y="H - 20 - (n / top) * (H - 40)"
              :width="(W - 30) / BINS / 2 - 2" :height="(n / top) * (H - 40)" :class="SIDE_CLASS[s]" opacity="0.7"><title>{{ matrix.sides[s] }}: {{ n }}</title></rect>
      </g>
      <line x1="20" :x2="W - 10" :y1="H - 20" :y2="H - 20" class="stroke-current opacity-40" />
    </svg>
  </div>
</template>
