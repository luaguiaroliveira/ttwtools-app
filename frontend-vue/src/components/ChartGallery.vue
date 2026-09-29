<script setup>
// Galeria da KFA: um seletor de gráficos (em vez de sub-abas). Os dados de cada gráfico
// vêm do pacote (/api/compare/viz/*); o Plotly só carrega no PCA 3D.
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { post } from '../api/client.js'
import ExportMenu from './ExportMenu.vue'
import DivergingBars from './DivergingBars.vue'
import MeansScatter from './charts/MeansScatter.vue'
import BubbleChart from './charts/BubbleChart.vue'
import StripChart from './charts/StripChart.vue'
import HeatmapChart from './charts/HeatmapChart.vue'
import RadarChart from './charts/RadarChart.vue'
import ViolinChart from './charts/ViolinChart.vue'
import HistogramChart from './charts/HistogramChart.vue'
import ParCoords from './charts/ParCoords.vue'
import ReductionChart from './charts/ReductionChart.vue'
const Pca3D = defineAsyncComponent(() => import('./charts/Pca3D.vue'))

const props = defineProps({ kfa: Object, sides: Array, layer: String })
const emit = defineEmits(['select'])
const { t } = useI18n()
const KINDS = ['bars', 'means', 'bubble', 'strip', 'heatmap', 'radar', 'violin', 'histogram', 'parcoords', 'reduction', 'pca3d']
const kind = ref('bars')
const nFeatures = ref(10)
const method = ref('pca2d')
const data = ref(null)
const error = ref(null)
const box = ref(null)
const labels = computed(() => props.sides.map((s) => s.label))
const topFeatures = computed(() => props.kfa.rows.slice(0, nFeatures.value).map((r) => r.Feature))
const needs = { strip: 'matrix', violin: 'matrix', histogram: 'matrix', parcoords: 'matrix', heatmap: 'heatmap', reduction: 'reduction', pca3d: 'reduction' }

async function load() {
  data.value = null
  error.value = null
  const what = needs[kind.value]
  if (!what) return
  try {
    data.value = await post(`/api/compare/viz/${what}`, { sides: props.sides, layer: props.layer, features: what === 'matrix' ? topFeatures.value : null,
      top: nFeatures.value, method: kind.value === 'pca3d' ? 'pca3d' : method.value, perplexity: 5 })
  } catch (err) { error.value = err.message }
}
watch([kind, nFeatures, method, () => props.kfa], load)
const bars = computed(() => props.kfa.rows.map((r) => ({ label: r.Feature, value: r.Effect_Size })))
</script>
<template>
  <section class="flex flex-col gap-2" :aria-label="t('gallery.title')">
    <div class="flex flex-wrap items-end gap-2">
      <label class="ttw-field"><span class="ttw-label">{{ t('gallery.choose') }}</span>
        <select v-model="kind" class="select select-sm" data-testid="gallery-kind"><option v-for="k in KINDS" :key="k" :value="k">{{ t(`gallery.${k}`) }}</option></select></label>
      <label v-if="['strip', 'violin', 'histogram', 'parcoords', 'heatmap', 'radar'].includes(kind)" class="ttw-field w-24"><span class="ttw-label">{{ t('gallery.features_n') }}</span>
        <input v-model.number="nFeatures" type="number" min="2" max="40" class="input input-sm" /></label>
      <label v-if="kind === 'reduction'" class="ttw-field"><span class="ttw-label">{{ t('gallery.method') }}</span>
        <select v-model="method" class="select select-sm"><option value="pca2d">PCA</option><option value="tsne">t-SNE</option><option value="umap">UMAP</option><option value="mds">MDS</option></select></label>
      <ExportMenu v-if="kind !== 'pca3d'" :name="`kfa_${kind}`" :svg-root="box" class="ml-auto" />
    </div>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <div ref="box" data-testid="gallery-chart">
      <DivergingBars v-if="kind === 'bars'" :rows="bars" :title="t('kfa.chart')" @select="(f) => emit('select', f)" />
      <MeansScatter v-else-if="kind === 'means'" :rows="kfa.rows" />
      <BubbleChart v-else-if="kind === 'bubble'" :rows="kfa.rows" />
      <RadarChart v-else-if="kind === 'radar'" :rows="kfa.rows.slice(0, nFeatures)" />
      <template v-else-if="data">
        <StripChart v-if="kind === 'strip'" :matrix="data" />
        <ViolinChart v-else-if="kind === 'violin'" :matrix="data" />
        <HistogramChart v-else-if="kind === 'histogram'" :matrix="data" />
        <ParCoords v-else-if="kind === 'parcoords'" :matrix="data" />
        <HeatmapChart v-else-if="kind === 'heatmap'" :heat="data" />
        <ReductionChart v-else-if="kind === 'reduction'" :data="data" :sides="labels" />
        <Pca3D v-else-if="kind === 'pca3d'" :data="data" :sides="labels" />
      </template>
      <p v-else-if="needs[kind] && !error" class="text-sm text-text-muted">{{ t('gallery.loading') }}</p>
    </div>
  </section>
</template>
