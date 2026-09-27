<script setup>
// "Exportar": tabela (CSV, TXT) e/ou o gráfico SVG mais próximo (SVG, PNG).
import { useI18n } from 'vue-i18n'
import { download, exportPng, exportSvg, tableToCsv, tableToTxt } from '../utils/export.js'
const props = defineProps({
  name: { type: String, default: 'ttwtools' },
  rows: { type: Array, default: null },
  columns: { type: Array, default: null },
  svgRoot: { type: Object, default: null },     // ref de um elemento que contém o <svg>
})
const { t } = useI18n()
const svg = () => props.svgRoot?.querySelector?.('svg') ?? props.svgRoot?.$el?.querySelector?.('svg')
</script>
<template>
  <details class="dropdown dropdown-end">
    <summary class="btn btn-xs">{{ t('export.button') }}</summary>
    <ul class="dropdown-content menu bg-base-200 rounded-box z-20 w-40 p-1 shadow">
      <template v-if="rows?.length">
        <li><button data-testid="export-csv" @click="download(`${name}.csv`, tableToCsv(rows, columns), 'text/csv;charset=utf-8')">CSV</button></li>
        <li><button @click="download(`${name}.txt`, tableToTxt(rows, columns))">TXT</button></li>
      </template>
      <template v-if="svgRoot">
        <li><button @click="exportSvg(svg(), `${name}.svg`)">SVG</button></li>
        <li><button @click="exportPng(svg(), `${name}.png`)">PNG</button></li>
      </template>
    </ul>
  </details>
</template>
