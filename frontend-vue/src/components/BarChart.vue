<script setup>
// Gráfico de barras horizontal em SVG, acessível, com alternativa em tabela.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
const props = defineProps({
  items: { type: Array, required: true },       // [{label, value}]
  title: { type: String, required: true },
  valueLabel: { type: String, default: '' },
  max: { type: Number, default: 20 },
})
const { t } = useI18n()
const asTable = ref(false)
const rows = computed(() => props.items.slice(0, props.max))
const top = computed(() => Math.max(1, ...rows.value.map((r) => r.value)))
const fmt = (v) => (Number.isInteger(v) ? v : v.toFixed(2))
</script>
<template>
  <figure class="flex flex-col gap-2">
    <figcaption class="flex items-center gap-2 font-medium">
      {{ title }}
      <button class="btn btn-xs btn-ghost ml-auto" @click="asTable = !asTable">{{ asTable ? t('chart.as_chart') : t('chart.as_table') }}</button>
    </figcaption>
    <table v-if="asTable" class="table table-xs">
      <thead><tr><th scope="col">{{ title }}</th><th scope="col" class="text-right">{{ valueLabel }}</th></tr></thead>
      <tbody><tr v-for="r in rows" :key="r.label"><td>{{ r.label }}</td><td class="text-right tabular-nums">{{ fmt(r.value) }}</td></tr></tbody>
    </table>
    <svg v-else :viewBox="`0 0 400 ${rows.length * 20 + 4}`" role="img" :aria-label="title" class="w-full max-w-xl">
      <g v-for="(r, i) in rows" :key="r.label" :transform="`translate(0 ${i * 20 + 2})`">
        <text x="110" y="13" text-anchor="end" class="fill-current text-[11px]">{{ r.label }}</text>
        <rect x="116" y="3" :width="Math.max(1, (r.value / top) * 240)" height="13" class="fill-primary" rx="2" />
        <text :x="120 + (r.value / top) * 240" y="13" class="fill-current text-[10px] opacity-70">{{ fmt(r.value) }}</text>
      </g>
    </svg>
  </figure>
</template>
