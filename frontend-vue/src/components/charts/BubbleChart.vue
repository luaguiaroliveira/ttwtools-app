<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { extent, linear } from '../../utils/scale.js'
const props = defineProps({ rows: Array })
const { t } = useI18n()
const W = 520, H = 360, P = 40
const sx = computed(() => { const [a, b] = extent(props.rows.map((r) => r.Difference)); const m = Math.max(Math.abs(a), Math.abs(b)); return linear([-m, m], [P, W - 10]) })
const sy = computed(() => { const [a, b] = extent(props.rows.map((r) => r.Effect_Size)); const m = Math.max(Math.abs(a), Math.abs(b)); return linear([-m, m], [H - P, 10]) })
const sr = computed(() => { const s = props.rows.map((r) => Math.sqrt((r.Std_Corpus1 ** 2 + r.Std_Corpus2 ** 2) / 2)); return linear(extent(s), [4, 18]) })
</script>
<template>
  <svg :viewBox="`0 0 ${W} ${H}`" class="w-full max-w-2xl" role="group" :aria-label="t('gallery.bubble')">
    <line :x1="sx(0)" :x2="sx(0)" y1="10" :y2="H - P" class="stroke-current opacity-30" />
    <line :x1="P" :x2="W - 10" :y1="sy(0)" :y2="sy(0)" class="stroke-current opacity-30" />
    <text :x="W / 2" :y="H - 8" text-anchor="middle" class="fill-current text-[11px]">Δ ({{ t('kfa.mean') }})</text>
    <text x="12" :y="H / 2" :transform="`rotate(-90 12 ${H / 2})`" text-anchor="middle" class="fill-current text-[11px]">d</text>
    <g v-for="r in rows" :key="r.Feature">
      <circle :cx="sx(r.Difference)" :cy="sy(r.Effect_Size)" :r="sr(Math.sqrt((r.Std_Corpus1 ** 2 + r.Std_Corpus2 ** 2) / 2))"
              :class="r.Effect_Size >= 0 ? 'fill-primary' : 'fill-secondary'" opacity="0.45"><title>{{ r.Feature }}: d {{ r.Effect_Size.toFixed(2) }}</title></circle>
      <text :x="sx(r.Difference)" :y="sy(r.Effect_Size) + 3" text-anchor="middle" class="fill-current text-[9px]">{{ r.Feature }}</text>
    </g>
  </svg>
</template>
