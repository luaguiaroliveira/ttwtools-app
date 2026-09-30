<script setup>
// Legenda de cores dos gráficos de comparação: cada item liga uma cor (e uma forma, para não depender
// só da cor) ao nome do corpus ou grupo. `index` escolhe a cor da paleta (--chart-1, --chart-2...).
defineProps({ items: { type: Array, required: true }, label: { type: String, default: '' } })   // [{ index, shape: dot|square|bar|heat-hi|heat-lo, text }]
const fill = (it) => (it.shape === 'heat-hi' ? 'rgb(var(--chart-pos))' : it.shape === 'heat-lo' ? 'rgb(var(--chart-neg))' : `var(--chart-${(it.index ?? 0) + 1})`)
</script>
<template>
  <ul class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" :aria-label="label" data-testid="side-legend">
    <li v-for="(it, i) in items" :key="i" class="flex items-center gap-1.5 min-w-0">
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" class="shrink-0">
        <rect v-if="it.shape === 'square' || it.shape === 'heat-hi' || it.shape === 'heat-lo'" x="1.500" y="1.500" width="11" height="11" rx="2" :fill="fill(it)" />
        <rect v-else-if="it.shape === 'bar'" x="1" y="4" width="12" height="6" rx="1.500" :fill="fill(it)" />
        <circle v-else cx="7" cy="7" r="5.500" :fill="fill(it)" />
      </svg>
      <span class="truncate" :title="it.text">{{ it.text }}</span>
    </li>
  </ul>
</template>
