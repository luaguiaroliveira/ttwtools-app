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

const props = defineProps({ kfa: Object, sides: Array, layer: String, feature: String })
const emit = defineEmits(['select'])
const { t } = useI18n()
// Uma linha só: ícones com dica (título) e nome acessível; grupos separados por um traço fino.
const GROUPS = [['bars', 'means', 'bubble'], ['strip', 'violin', 'histogram'], ['heatmap', 'radar', 'parcoords', 'reduction', 'pca3d']]
const KINDS = GROUPS.flat()
const ICONS = {
  bars: '<path d="M4 6h9M4 12h16M4 18h6"/>',
  means: '<path d="M4 20 20 4" stroke-dasharray="2 2"/><circle cx="8" cy="15" r="1.6"/><circle cx="14" cy="9" r="1.6"/><circle cx="17" cy="13" r="1.6"/>',
  bubble: '<circle cx="8" cy="15" r="4"/><circle cx="16" cy="8" r="2.6"/><circle cx="17" cy="16" r="1.6"/>',
  strip: '<path d="M3 6h18M3 12h18M3 18h18" opacity=".3"/><circle cx="7" cy="6" r="1"/><circle cx="14" cy="6" r="1"/><circle cx="10" cy="12" r="1"/><circle cx="17" cy="12" r="1"/><circle cx="6" cy="18" r="1"/><circle cx="12" cy="18" r="1"/>',
  violin: '<path d="M12 3c4 3 4 6 1.5 9 2.5 3 2.5 6-1.5 9-4-3-4-6-1.5-9C8 9 8 6 12 3Z"/>',
  histogram: '<path d="M4 20V13h4v7M8 20V6h4v14M12 20V9h4v11M16 20v-5h4v5"/>',
  heatmap: '<rect x="4" y="4" width="5" height="5"/><rect x="10" y="4" width="5" height="5" fill="currentColor" opacity=".4"/><rect x="16" y="4" width="4" height="5"/><rect x="4" y="10" width="5" height="5" fill="currentColor" opacity=".7"/><rect x="10" y="10" width="5" height="5"/><rect x="16" y="10" width="4" height="5" fill="currentColor" opacity=".3"/><rect x="4" y="16" width="5" height="4"/><rect x="10" y="16" width="5" height="4" fill="currentColor" opacity=".5"/><rect x="16" y="16" width="4" height="4" fill="currentColor" opacity=".8"/>',
  radar: '<path d="M12 3 21 10 17.5 20h-11L3 10Z" opacity=".4"/><path d="M12 8l5 3.5-2 5.5H9l-2-5.5Z"/>',
  parcoords: '<path d="M5 4v16M12 4v16M19 4v16" opacity=".4"/><path d="M5 8 12 16 19 6"/>',
  reduction: '<path d="M4 4v16h16" opacity=".4"/><circle cx="9" cy="14" r="1.3"/><circle cx="11" cy="16" r="1.3"/><circle cx="10" cy="12" r="1.3"/><circle cx="16" cy="7" r="1.3"/><circle cx="18" cy="9" r="1.3"/>',
  pca3d: '<path d="M12 3 20 7.5v9L12 21 4 16.5v-9Z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
}
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

// Gráficos já calculados ficam guardados (por pedido): voltar a um gráfico, ou mexer no |d| mínimo sem mudar os
// atributos usados, não calcula de novo.
const memo = new Map()
async function load() {
  data.value = null
  error.value = null
  const what = needs[kind.value]
  if (!what) return
  const body = { sides: props.sides, layer: props.layer, feature: props.feature, features: what === 'matrix' ? topFeatures.value : null,
    top: nFeatures.value, method: kind.value === 'pca3d' ? 'pca3d' : method.value, perplexity: 5 }
  const key = `${what}|${JSON.stringify(body)}`
  if (memo.has(key)) { data.value = memo.get(key); return }
  busy.value = true
  try {
    data.value = await postJob(`/api/compare/viz/${what}`, body)
    memo.set(key, data.value)
    while (memo.size > 24) memo.delete(memo.keys().next().value)
  } catch (err) { error.value = err.message } finally { busy.value = false }
}
watch([kind, nFeatures, method, topFeatures, () => props.sides, () => props.layer, () => props.feature], load)
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
      <div class="ttw-field"><span class="ttw-label">{{ t('gallery.choose') }}: <span class="font-medium" data-testid="gallery-kind-name">{{ t(`gallery.${kind}`) }}</span></span>
        <div role="tablist" class="flex items-center gap-1" data-testid="gallery-kind" :aria-label="t('gallery.choose')">
          <template v-for="(g, gi) in GROUPS" :key="gi">
            <span v-if="gi" class="mx-1 h-5 w-px bg-base-300" aria-hidden="true"></span>
            <button v-for="k in g" :key="k" type="button" role="tab" class="btn btn-sm btn-square" :class="kind === k ? 'btn-primary' : 'btn-ghost'"
                    :aria-selected="kind === k" :aria-label="t(`gallery.${k}`)" :title="t(`gallery.${k}`)" :data-kind="k" @click="kind = k">
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="ICONS[k]"></svg>
            </button>
          </template></div></div>
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
