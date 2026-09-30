<script setup>
// Médias por atributo (normalizadas pelo maior valor do atributo) dos dois lados.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
const props = defineProps({ rows: Array })
const { t } = useI18n()
const R = 150, C = 190
const rows = computed(() => props.rows.slice(0, 12))
const pt = (i, v) => { const a = (2 * Math.PI * i) / rows.value.length - Math.PI / 2; return [C + Math.cos(a) * R * v, C + Math.sin(a) * R * v] }
const poly = (key) => rows.value.map((r, i) => pt(i, r[key] / Math.max(1e-9, r.Mean_Corpus1, r.Mean_Corpus2)).join(',')).join(' ')
</script>
<template>
  <svg :viewBox="`0 0 ${2 * C} ${2 * C}`" class="w-full max-w-md" role="group" :aria-label="t('gallery.radar')">
    <circle v-for="k in [0.25, 0.5, 0.75, 1]" :key="k" :cx="C" :cy="C" :r="R * k" fill="none" class="stroke-current opacity-15" />
    <g v-for="(r, i) in rows" :key="r.Feature">
      <line :x1="C" :y1="C" :x2="pt(i, 1)[0]" :y2="pt(i, 1)[1]" class="stroke-current opacity-15" />
      <text :x="pt(i, 1.12)[0]" :y="pt(i, 1.12)[1]" text-anchor="middle" class="fill-current text-[9px]">{{ r.Feature }}</text>
    </g>
    <polygon :points="poly('Mean_Corpus1')" class="fill-chart-1 stroke-chart-1" fill-opacity="0.2" stroke-width="2" />
    <polygon :points="poly('Mean_Corpus2')" class="fill-chart-2 stroke-chart-2" fill-opacity="0.2" stroke-width="2" />
  </svg>
</template>
