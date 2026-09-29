<script setup>
// PCA 3D com Plotly, carregado só quando este gráfico é aberto (pesado: ~1 MB).
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
const props = defineProps({ data: Object, sides: Array })
const { t } = useI18n()
const el = ref(null)
const loading = ref(true)
let Plotly = null
onMounted(async () => {
  Plotly = (await import('plotly.js-dist-min')).default
  loading.value = false
  const colors = ['#605dff', '#f43098', '#00d3bb']
  const traces = props.sides.map((s, i) => {
    const pts = props.data.coords.filter((c) => c.side === s)
    return { type: 'scatter3d', mode: 'markers', name: s, x: pts.map((p) => p.x), y: pts.map((p) => p.y), z: pts.map((p) => p.z),
      text: pts.map((p) => p.filename), marker: { size: 4, color: colors[i % 3] } }
  })
  Plotly.newPlot(el.value, traces, { margin: { l: 0, r: 0, t: 0, b: 0 }, height: 460, paper_bgcolor: 'rgba(0,0,0,0)' }, { responsive: true, displaylogo: false })
})
onBeforeUnmount(() => { if (Plotly && el.value) Plotly.purge(el.value) })
</script>
<template>
  <div><p v-if="loading" class="text-sm text-text-muted">{{ t('gallery.loading') }}</p><div ref="el" class="w-full" :aria-label="t('gallery.pca3d')" role="img" /></div>
</template>
