<script setup>
import BusyModal from '../../components/BusyModal.vue'
import FeatureSelect from '../../components/FeatureSelect.vue'
// Laboratório (experimental): comparar N grupos — por metadado do corpus ativo ou um grupo por corpus.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { api } from '../../api/index.js'
import { useSession } from '../../stores/session.js'
import HelpTip from '../../components/HelpTip.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'
import ReductionChart from '../../components/charts/ReductionChart.vue'
import { diverging, fmt } from '../../utils/scale.js'
const props = defineProps({ corpus: String })
const { t, locale } = useI18n()
const { corpora, activeCorpus, layer } = storeToRefs(useSession())
const METHODS = ['one_vs_rest', 'pairwise', 'anova', 'profile', 'dendrogram', 'nearest']
const f = ref({ mode: 'metadata', key: '', picked: [], feature: '', method: 'one_vs_rest', metric: 'kfa' })
const data = ref(null)
const error = ref(null)
const busy = ref(false)
const lastParams = ref(null)
const layers = computed(() => [...new Set((activeCorpus.value?.layers ?? []).map((l) => l.tool))])
// a camada é a do topo da tela (seletor global); "automática" cai na primeira camada do corpus
const effectiveLayer = computed(() => (layer.value && layers.value.includes(layer.value) ? layer.value : layers.value[0] ?? ''))
const layerFields = computed(() => activeCorpus.value?.layers?.find((l) => l.tool === effectiveLayer.value)?.fields ?? [])
watch(() => activeCorpus.value?.metadata_keys, (ks) => { if (!f.value.key && ks?.length) f.value.key = ks[0] }, { immediate: true })
const ready = computed(() => effectiveLayer.value && (f.value.mode === 'metadata' ? f.value.key : f.value.picked.length >= 2))

function params() {
  const base = { layer: effectiveLayer.value, method: f.value.method, metric: f.value.metric, feature: f.value.feature || undefined }
  return f.value.mode === 'metadata'
    ? { ...base, corpus: props.corpus, group_by: f.value.key }
    : { ...base, groups: f.value.picked.map((c) => ({ corpus: c, label: c })) }
}
async function run() {
  error.value = null
  busy.value = true
  try {
    data.value = await api.lab.compare({ ...params(), lang: locale.value })
    lastParams.value = { ...params(), groups: data.value.group_specs }
  } catch (err) { error.value = err.message; data.value = null } finally { busy.value = false }
}
const labels = computed(() => data.value?.groups.map((g) => g.label) ?? [])
// dendrograma: icoord/dcoord do scipy → SVG
const dendro = computed(() => {
  const d = data.value
  if (d?.method !== 'dendrogram') return null
  const xs = d.icoord.flat(), ys = d.dcoord.flat()
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)], y1 = Math.max(1e-9, ...ys)
  const W = 560, H = 240, P = 80
  const sx = (x) => P + ((x - x0) / Math.max(1e-9, x1 - x0)) * (W - 2 * P)
  const sy = (y) => H - 40 - (y / y1) * (H - 60)
  return { W, H, paths: d.icoord.map((ic, i) => ic.map((x, j) => `${j ? 'L' : 'M'}${sx(x)},${sy(d.dcoord[i][j])}`).join(' ')),
    leaves: d.order.map((l, i) => ({ l, x: sx(x0 + i * 10), y: H - 22 })) }
})
const exportRows = computed(() => {
  const d = data.value
  if (!d) return []
  if (d.method === 'one_vs_rest') return d.results.flatMap((g) => g.features.map((x) => ({ group: g.label, ...x })))
  if (d.method === 'pairwise') return d.pairs.map(({ features, ...p }) => ({ ...p, features: features.map((x) => x.feature).join(' ') }))
  if (d.method === 'anova') return d.results.map(({ means, ...r }) => ({ ...r, ...means }))
  if (d.method === 'nearest') return d.results.map(({ features, ...r }) => ({ ...r, features: features.map((x) => x.feature).join(' ') }))
  if (d.method === 'profile') return d.reduction.coords
  return d.order.map((g, i) => ({ order: i + 1, group: g }))
})
</script>
<template>
  <section class="flex flex-col gap-3">
    <BusyModal :open="busy" :delay="350" :title="t('compare.calculating')" :message="t('compare.calculating_hint')" />
    <div role="note" class="alert alert-warning py-2 text-sm">{{ t('lab.intro') }}</div>
    <p v-if="!layers.length" class="text-text-muted">{{ t('lab.no_layer') }}</p>
    <form v-else class="flex flex-wrap items-end gap-2" @submit.prevent="run">
      <label class="ttw-field"><span class="ttw-label">{{ t('lab.groups') }}</span>
        <select v-model="f.mode" class="select select-sm"><option value="metadata" :disabled="!activeCorpus?.metadata_keys.length">{{ t('lab.groups.metadata') }}</option>
          <option value="corpora" :disabled="corpora.length < 2">{{ t('lab.groups.corpora') }}</option></select></label>
      <label v-if="f.mode === 'metadata'" class="ttw-field"><span class="ttw-label">{{ t('lab.groups.key') }}</span>
        <select v-model="f.key" class="select select-sm" data-testid="lab-key"><option v-for="k in activeCorpus.metadata_keys" :key="k">{{ k }}</option></select></label>
      <fieldset v-else class="ttw-field"><legend class="ttw-label">{{ t('lab.groups.pick') }}</legend>
        <div class="flex flex-wrap gap-2"><label v-for="c in corpora" :key="c.name" class="label cursor-pointer gap-1 text-sm">
          <input v-model="f.picked" type="checkbox" class="checkbox checkbox-xs" :value="c.name" />{{ c.name }}</label></div></fieldset>
      <FeatureSelect v-model="f.feature" :fields="layerFields" />
      <label class="ttw-field"><span class="ttw-label">{{ t('lab.method') }}</span>
        <select v-model="f.method" class="select select-sm" data-testid="lab-method"><option v-for="m in METHODS" :key="m" :value="m">{{ t(`lab.method.${m}`) }}</option></select></label>
      <label v-if="['one_vs_rest', 'pairwise'].includes(f.method)" class="ttw-field"><span class="ttw-label">{{ t('kfa.metric') }}</span>
        <select v-model="f.metric" class="select select-sm"><option>kfa</option><option>kfa2</option></select></label>
      <button class="btn btn-sm btn-primary" :disabled="!ready || busy" data-testid="lab-run">{{ t('compare.run') }}</button>
      <span class="badge badge-outline" data-testid="lab-layer" :title="t('kfa.layer_hint')">{{ layer ? t('kfa.layer_used', { layer: effectiveLayer }) : t('kfa.layer_auto', { layer: effectiveLayer }) }}</span>
      <HelpTip topic="laboratorio" />
    </form>
    <p class="text-sm opacity-80" data-testid="lab-explain">{{ t(`lab.method.${f.method}.explain`) }}</p>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>

    <template v-if="data">
      <div class="flex flex-wrap gap-2 text-sm"><span v-for="g in data.groups" :key="g.label" class="badge badge-outline">{{ g.label }} · {{ g.n }}</span></div>
      <div v-for="w in data.warnings.filter((x) => x.code !== 'experimental')" :key="w.code" role="alert" class="alert py-1 text-sm"
           :class="w.severity === 'warning' ? 'alert-warning' : 'alert-info'">{{ w.message }}</div>
      <div class="flex gap-1"><CopyCode analysis="lab" :params="lastParams" /><ExportMenu name="laboratorio" :rows="exportRows" /></div>

      <div v-if="data.method === 'one_vs_rest'" class="grid gap-3 md:grid-cols-2" data-testid="lab-result">
        <div v-for="g in data.results" :key="g.label" class="bg-base-100 rounded-box p-3">
          <h3 class="font-bold">{{ g.label }}</h3>
          <table class="table table-xs"><thead><tr><th>{{ t('explore.item') }}</th><th class="text-right">d</th>
            <th class="text-right">{{ t('lab.col.group_mean') }}</th><th class="text-right">{{ t('lab.col.rest_mean') }}</th></tr></thead>
            <tbody><tr v-for="x in g.features" :key="x.feature"><td>{{ x.feature }}</td>
              <td class="text-right tabular-nums" :style="{ background: diverging(x.d ?? 0) }">{{ fmt(x.d) }}</td>
              <td class="text-right tabular-nums">{{ fmt(x.mean_group, 1) }}</td><td class="text-right tabular-nums">{{ fmt(x.mean_rest, 1) }}</td></tr></tbody></table>
        </div>
      </div>

      <div v-else-if="data.method === 'pairwise'" class="flex flex-col gap-3" data-testid="lab-result">
        <div class="overflow-x-auto"><table class="table table-xs w-auto"><thead><tr><th></th><th v-for="l in data.labels" :key="l">{{ l }}</th></tr></thead>
          <tbody><tr v-for="(row, i) in data.distance" :key="i"><th>{{ data.labels[i] }}</th>
            <td v-for="(v, j) in row" :key="j" class="text-right tabular-nums" :style="{ background: i === j ? '' : diverging(v ?? 0) }">{{ i === j ? '·' : fmt(v) }}</td></tr></tbody></table></div>
        <table class="table table-xs"><thead><tr><th>A</th><th>B</th><th class="text-right">|d|</th><th class="text-right">{{ t('lab.col.large') }}</th><th>{{ t('lab.feature') }}</th></tr></thead>
          <tbody><tr v-for="p in data.pairs" :key="p.a + p.b"><td>{{ p.a }}</td><td>{{ p.b }}</td><td class="text-right tabular-nums">{{ fmt(p.mean_abs_d) }}</td>
            <td class="text-right tabular-nums">{{ p.large }}</td><td class="text-xs">{{ p.features.slice(0, 6).map((x) => `${x.feature} (${fmt(x.d, 1)})`).join(', ') }}</td></tr></tbody></table>
      </div>

      <div v-else-if="data.method === 'anova'" class="overflow-x-auto max-h-[60vh]" data-testid="lab-result">
        <table class="table table-xs table-pin-rows"><thead><tr><th>{{ t('explore.item') }}</th><th class="text-right">H</th><th class="text-right">ε²</th><th class="text-right">p corr.</th>
          <th v-for="l in labels" :key="l" class="text-right">{{ l }}</th></tr></thead>
          <tbody><tr v-for="r in data.results" :key="r.feature"><td>{{ r.feature }}</td><td class="text-right tabular-nums">{{ fmt(r.H) }}</td>
            <td class="text-right tabular-nums font-medium">{{ fmt(r.epsilon2) }}</td><td class="text-right tabular-nums" :class="{ 'font-bold': r.p_adj < 0.05 }">{{ r.p_adj.toExponential(1) }}</td>
            <td v-for="l in labels" :key="l" class="text-right tabular-nums">{{ fmt(r.means[l], 1) }}</td></tr></tbody></table>
      </div>

      <ReductionChart v-else-if="data.method === 'profile'" :data="data.reduction" :sides="labels" data-testid="lab-result" />

      <svg v-else-if="dendro" :viewBox="`0 0 ${dendro.W} ${dendro.H}`" class="w-full max-w-2xl" role="img" :aria-label="t('lab.method.dendrogram')" data-testid="lab-result">
        <path v-for="(d, i) in dendro.paths" :key="i" :d="d" fill="none" class="stroke-current" stroke-width="1.5" />
        <text v-for="lf in dendro.leaves" :key="lf.l" :x="lf.x" :y="lf.y" text-anchor="middle" class="fill-current text-[11px]">{{ lf.l }}</text>
      </svg>

      <div v-else-if="data.method === 'nearest'" class="flex flex-col gap-2" data-testid="lab-result">
        <p class="font-medium">{{ t('lab.nearest.closest', { label: data.results[0]?.label ?? '—' }) }} ({{ data.target }})</p>
        <div v-for="r in data.results" :key="r.label" class="bg-base-100 rounded-box p-3">
          <h3 class="font-bold">{{ r.label }} · {{ t('lab.col.distance') }} {{ fmt(r.distance) }}</h3>
          <table class="table table-xs"><thead><tr><th>{{ t('explore.item') }}</th><th class="text-right">z</th><th class="text-right">{{ t('lab.col.value') }}</th><th class="text-right">{{ t('lab.col.ref_mean') }}</th></tr></thead>
            <tbody><tr v-for="x in r.features" :key="x.feature"><td>{{ x.feature }}</td><td class="text-right tabular-nums" :style="{ background: diverging(x.z ?? 0) }">{{ fmt(x.z) }}</td>
              <td class="text-right tabular-nums">{{ fmt(x.value, 1) }}</td><td class="text-right tabular-nums">{{ fmt(x.mean_ref, 1) }}</td></tr></tbody></table>
        </div>
      </div>
    </template>
  </section>
</template>
