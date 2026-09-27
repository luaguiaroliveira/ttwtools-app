<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { extent, linear } from '../../utils/scale.js'
const props = defineProps({ rows: Array })
const { t } = useI18n()
const W = 520, H = 360, P = 40
const all = computed(() => [...props.rows.map((r) => r.Mean_Corpus1), ...props.rows.map((r) => r.Mean_Corpus2)])
const sx = computed(() => linear([0, extent(all.value)[1]], [P, W - 10]))
const sy = computed(() => linear([0, extent(all.value)[1]], [H - P, 10]))
</script>
<template>
  <svg :viewBox="`0 0 ${W} ${H}`" class="w-full max-w-2xl" role="group" :aria-label="t('gallery.means')">
    <line :x1="sx(0)" :y1="sy(0)" :x2="sx(extent(all)[1])" :y2="sy(extent(all)[1])" class="stroke-current opacity-30" stroke-dasharray="4" />
    <text :x="W / 2" :y="H - 8" text-anchor="middle" class="fill-current text-[11px]">{{ t('gallery.x_mean1') }}</text>
    <text x="12" :y="H / 2" :transform="`rotate(-90 12 ${H / 2})`" text-anchor="middle" class="fill-current text-[11px]">{{ t('gallery.y_mean2') }}</text>
    <g v-for="r in rows" :key="r.Feature">
      <circle :cx="sx(r.Mean_Corpus1)" :cy="sy(r.Mean_Corpus2)" r="5" :class="r.Effect_Size >= 0 ? 'fill-primary' : 'fill-secondary'" opacity="0.75"><title>{{ r.Feature }}: {{ r.Mean_Corpus1.toFixed(2) }} × {{ r.Mean_Corpus2.toFixed(2) }} (d {{ r.Effect_Size.toFixed(2) }})</title></circle>
      <text :x="sx(r.Mean_Corpus1) + 7" :y="sy(r.Mean_Corpus2) + 3" class="fill-current text-[9px] opacity-80">{{ r.Feature }}</text>
    </g>
  </svg>
</template>
