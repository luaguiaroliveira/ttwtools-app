<script setup>
// "Exportar": tabela (CSV, TXT) e/ou o gráfico (SVG a partir de um <svg>, ou PNG a partir de um <canvas>
// — os gráficos de dispersão desenham em canvas). Aceita um <svg> (svgRoot) ou um canvas (canvasRoot).
import { useI18n } from 'vue-i18n'
import { download, exportPng, exportPngFromCanvases, exportSvg, tableToCsv, tableToTxt } from '../utils/export.js'
const props = defineProps({
  name: { type: String, default: 'ttwtools' },
  rows: { type: Array, default: null },
  columns: { type: Array, default: null },
  svgRoot: { type: Object, default: null },     // ref de um elemento que contém o <svg>
  canvasRoot: { type: Object, default: null },  // ref de um elemento que contém os <canvas> do gráfico
})
const { t } = useI18n()
const svg = () => props.svgRoot?.querySelector?.('svg') ?? props.svgRoot?.$el?.querySelector?.('svg')
const root = (p) => p?.$el ?? p
const canvases = () => root(props.canvasRoot)?.querySelectorAll?.('canvas') ?? []
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
      <li v-else-if="canvasRoot"><button data-testid="export-png-canvas" @click="exportPngFromCanvases(canvases(), `${name}.png`)">PNG</button></li>
    </ul>
  </details>
</template>
