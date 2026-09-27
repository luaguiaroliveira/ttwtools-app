<script setup>
import { useI18n } from 'vue-i18n'
import { diverging } from '../../utils/scale.js'
defineProps({ heat: Object })
const { t } = useI18n()
const CW = 22, RH = 8, LEFT = 60
</script>
<template>
  <svg :viewBox="`0 0 ${LEFT + heat.features.length * CW + 10} ${heat.rows.length * RH + 70}`" class="w-full max-w-3xl" role="group" :aria-label="t('gallery.heatmap')">
    <text v-for="(f, j) in heat.features" :key="f" :x="LEFT + j * CW + CW / 2" y="58" :transform="`rotate(-60 ${LEFT + j * CW + CW / 2} 58)`" class="fill-current text-[8px]">{{ f }}</text>
    <g v-for="(r, i) in heat.rows" :key="r.filename" :transform="`translate(0 ${62 + i * RH})`">
      <text v-if="i === 0 || heat.rows[i - 1].side !== r.side" x="0" y="7" class="fill-current text-[8px] font-bold">{{ r.side }}</text>
      <rect v-for="(z, j) in r.z" :key="j" :x="LEFT + j * CW" y="0" :width="CW - 1" :height="RH - 1" :fill="diverging(z ?? 0)"><title>{{ r.filename }} · {{ heat.features[j] }}: z {{ (z ?? 0).toFixed(2) }}</title></rect>
    </g>
  </svg>
</template>
