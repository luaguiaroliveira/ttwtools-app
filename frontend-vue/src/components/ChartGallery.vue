<script setup>
// Galeria da KFA: um seletor de gráficos (em vez de sub-abas). Os dados de cada gráfico
// vêm do pacote (/api/compare/viz/*); o Plotly só carrega no PCA 3D.
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { postJob } from '../api/client.js'
import ExportMenu from './ExportMenu.vue'
import BusyModal from './BusyModal.vue'
import SideLegend from './SideLegend.vue'
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
const busy = ref(false)
const box = ref(null)
const labels = computed(() => props.sides.map((s) => s.label))
const topFeatures = computed(() => props.kfa.rows.slice(0, nFeatures.value).map((r) => r.Feature))
const needs = { strip: 'matrix', violin: 'matrix', histogram: 'matrix', parcoords: 'matrix', heatmap: 'heatmap', reduction: 'reduction', pca3d: 'reduction' }

async function load() {
  data.value = null
  error.value = null
  const what = needs[kind.value]
  if (!what) return
  busy.value = true
  try {
    data.value = await postJob(`/api/compare/viz/${what}`, { sides: props.sides, layer: props.layer, features: what === 'matrix' ? topFeatures.value : null,
      top: nFeatures.value, method: kind.value === 'pca3d' ? 'pca3d' : method.value, perplexity: 5 })
  } catch (err) { error.value = err.message } finally { busy.value = false }
}
watch([kind, nFeatures, method, () => props.kfa], load)
// legenda: liga cor e forma ao corpus/grupo (o que a cor significa muda com o gráfico)
const legend = computed(() => {
  const [a, b] = labels.value
  const hi = (side) => t('legend.higher_in', { side })
  if (kind.value === 'bars') return [{ index: 1, shape: 'bar', text: `← ${hi(b)}` }, { index: 0, shape: 'bar', text: `${hi(a)} →` }]
  if (kind.value === 'means') return [{ index: 0, shape: 'dot', text: hi(a) }, { index: 1, shape: 'square', text: hi(b) }]
  if (kind.value === 'bubble') return [{ index: 0, shape: 'dot', text: hi(a) }, { index: 1, shape: 'dot', text: hi(b) }]
  if (kind.value === 'heatmap') return [{ shape: 'heat-hi', text: t('legend.heat_hi') }, { shape: 'heat-lo', text: t('legend.heat_lo') }]
  return labels.value.map((text, index) => ({ index, shape: 'dot', text }))
})
const bars = computed(() => props.kfa.rows.map((r) => ({ label: r.Feature, value: r.Effect_Size })))
</script>
<template>
  <section class="flex flex-col gap-2" :aria-label="t('gallery.title')">
    <div class="flex flex-wrap items-end gap-2">
      <div class="ttw-field"><span class="ttw-label">{{ t('gallery.choose') }}</span>
        <div role="tablist" class="tabs tabs-box flex-wrap w-fit" data-testid="gallery-kind" :aria-label="t('gallery.choose')">
          <button v-for="k in KINDS" :key="k" type="button" role="tab" class="tab" :class="{ 'tab-active': kind === k }" :aria-selected="kind === k"
                  :data-kind="k" @click="kind = k">{{ t(`gallery.${k}`) }}</button></div></div>
      <label v-if="['strip', 'violin', 'histogram', 'parcoords', 'heatmap', 'radar'].includes(kind)" class="ttw-field w-24"><span class="ttw-label">{{ t('gallery.features_n') }}</span>
        <input v-model.number="nFeatures" type="number" min="2" max="40" class="input input-sm" /></label>
      <label v-if="kind === 'reduction'" class="ttw-field"><span class="ttw-label">{{ t('gallery.method') }}</span>
        <select v-model="method" class="select select-sm"><option value="pca2d">PCA</option><option value="tsne">t-SNE</option><option value="umap">UMAP</option><option value="mds">MDS</option></select></label>
      <ExportMenu v-if="kind !== 'pca3d'" :name="`kfa_${kind}`" :svg-root="box" class="ml-auto" />
    </div>
    <BusyModal :open="busy" :delay="350" :title="t('compare.calculating')" :message="t('compare.calculating_hint')" />
    <SideLegend :items="legend" :label="t('legend.title')" />
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
