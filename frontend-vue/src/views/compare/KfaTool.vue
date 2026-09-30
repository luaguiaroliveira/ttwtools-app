<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { api } from '../../api/index.js'
import { useSession } from '../../stores/session.js'
import { useCompare } from '../../stores/compare.js'
import { kfaMemory } from '../../utils/memory.js'
import ChartGallery from '../../components/ChartGallery.vue'
import HelpTip from '../../components/HelpTip.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'
import BusyModal from '../../components/BusyModal.vue'
import FeatureSelect from '../../components/FeatureSelect.vue'
const props = defineProps({ corpus: String })
const mem = kfaMemory.value?.corpus === props.corpus ? kfaMemory.value : null     // volta do Leitor: restaura
const lastParams = ref(mem?.lastParams ?? null)
const { t } = useI18n()
const { activeCorpus, layer } = storeToRefs(useSession())
const cmp = useCompare()
const f = ref(mem?.f ?? { feature: '', min_effect: 0.2 })
const data = ref(mem?.data ?? null)
const error = ref(null)
const detail = ref(mem?.detail ?? null)
const busy = ref(false)
const job = ref(null)          // andamento da tarefa (etapa e documentos contados) para a barra
let jobId = null
const layers = computed(() => [...new Set((activeCorpus.value?.layers ?? []).map((l) => l.tool))])
// a camada é a do topo da tela (seletor global); "automática" cai na primeira camada do corpus
const effectiveLayer = computed(() => (layer.value && layers.value.includes(layer.value) ? layer.value : layers.value[0] ?? ''))
const layerFields = computed(() => activeCorpus.value?.layers?.find((l) => l.tool === effectiveLayer.value)?.fields ?? [])
const keptFor = ref(mem?.keptFor ?? '')                                    // camada para a qual o usuário escolheu manter o resultado antigo
const setupSig = computed(() => JSON.stringify([cmp.sides(props.corpus).map((x) => [x.corpus, x.where]), cmp.metric]))
const stale = computed(() => Boolean(data.value && lastParams.value && (lastParams.value.setupSig !== setupSig.value || lastParams.value.layer !== effectiveLayer.value || (lastParams.value.requestedFeature ?? '') !== (layerFields.value.includes('upos') && layerFields.value.includes('xpos') ? f.value.feature : '')) && keptFor.value !== `${effectiveLayer.value}/${f.value.feature}/${setupSig.value}`))
const side = (n) => cmp.sides(props.corpus)[n - 1]
async function run() {
  error.value = null
  keptFor.value = ''
  detail.value = null
  const s1 = side(1), s2 = side(2)
  lastParams.value = { corpus: s1.corpus, corpus2: s2.corpus, layer: effectiveLayer.value, feature: f.value.feature || undefined, requestedFeature: f.value.feature, metric: cmp.metric, setupSig: setupSig.value, min_effect: f.value.min_effect,
    where: s1.where, where2: s2.where, label1: s1.label, label2: s2.label }
  busy.value = true
  try {
    data.value = await api.compare.kfa({ corpus1: s1.corpus, corpus2: s2.corpus, where1: s1.where, where2: s2.where,
      layer: effectiveLayer.value, feature: f.value.feature || undefined, metric: cmp.metric, min_effect: 0 }, { onJob: (j) => { job.value = j; jobId = j.id } })
  } catch (err) { if (err?.name !== 'AbortError') error.value = err.message } finally { busy.value = false; job.value = null; jobId = null }
}
async function select(name) {
  const [a, b] = await Promise.all([1, 2].map((n) => { const s = gallerySides.value[n - 1]; return api.compare.feature({ corpus: s.corpus, where: s.where, layer: lastParams.value?.layer ?? effectiveLayer.value, feature: data.value.feature, name }) }))
  const row = data.value.rows.find((r) => r.Feature === name)
  detail.value = { name, row, v1: a.values, v2: b.values }
}
const maxD = computed(() => Math.max(1, Math.ceil(Math.max(0, ...(data.value?.rows ?? []).map((r) => Math.abs(r.Effect_Size))) * 10) / 10))
watch([data, lastParams, f, detail, keptFor], () => { kfaMemory.value = { corpus: props.corpus, data: data.value, lastParams: lastParams.value, f: f.value, detail: detail.value, keptFor: keptFor.value } }, { deep: false })
watch(f, () => { if (kfaMemory.value) kfaMemory.value.f = f.value }, { deep: true })
const minD = computed(() => Number(f.value.min_effect) || 0)
// o |d| mínimo só filtra o que já foi calculado (a tabela completa vem do servidor): mudar o valor não recalcula nada
const shown = computed(() => (data.value ? { ...data.value, rows: data.value.rows.filter((r) => Math.abs(r.Effect_Size) >= minD.value) } : null))
const copyParams = computed(() => (lastParams.value ? { ...lastParams.value, min_effect: minD.value } : null))
const gallerySides = computed(() => (lastParams.value ? [{ corpus: lastParams.value.corpus, where: lastParams.value.where, label: lastParams.value.label1 }, { corpus: lastParams.value.corpus2, where: lastParams.value.where2, label: lastParams.value.label2 }] : cmp.sides(props.corpus)))
const maxV = computed(() => Math.max(1, ...[...(detail.value?.v1 ?? []), ...(detail.value?.v2 ?? [])].map((v) => v.value)))
</script>
<template>
  <section class="flex flex-col gap-3">
    <BusyModal :open="busy" :delay="350" :title="t('compare.calculating')" :message="t('compare.calculating_hint')" :job="job" @cancel="jobId && api.jobs.cancel(jobId)" />
    <p v-if="!layers.length" class="text-text-muted">{{ t('kfa.no_layer') }}</p>
    <form v-else class="flex flex-wrap items-end gap-2" @submit.prevent="run">
      <FeatureSelect v-model="f.feature" :fields="layerFields" />
      <button class="btn btn-sm btn-primary" data-testid="kfa-run">{{ t('compare.run') }}</button>
      <span class="badge badge-outline" data-testid="kfa-layer" :title="t('kfa.layer_hint')">{{ layer ? t('kfa.layer_used', { layer: effectiveLayer }) : t('kfa.layer_auto', { layer: effectiveLayer }) }}</span>
      <HelpTip term="kfa" />
    </form>
    <div v-if="stale" role="alert" class="alert alert-warning text-sm flex flex-wrap items-center gap-2" data-testid="kfa-stale">
      <span>{{ lastParams.setupSig !== setupSig ? t('kfa.setup_changed') : lastParams.layer !== effectiveLayer ? t('kfa.layer_changed', { old: lastParams.layer, new: effectiveLayer }) : t('kfa.feature_changed') }}</span>
      <button class="btn btn-sm btn-primary" data-testid="kfa-recalc" @click="run">{{ t('kfa.recalc', { layer: effectiveLayer }) }}</button>
      <button class="btn btn-sm btn-ghost" data-testid="kfa-keep" @click="keptFor = `${effectiveLayer}/${f.feature}/${setupSig}`">{{ t('kfa.keep') }}</button>
    </div>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="data">
      <p role="status" class="text-sm">{{ t('kfa.results', { n: shown.rows.length, n1: data.n1, n2: data.n2 }) }} · {{ t('kfa.result_layer', { layer: lastParams?.layer }) }} · {{ t('kfa.result_feature', { feature: data.feature }) }}</p>
      <div class="flex flex-wrap items-end gap-2">
      <label class="ttw-field w-28"><span class="ttw-label flex items-center gap-1"><HelpTip term="cohens_d">{{ t('kfa.min_effect') }}</HelpTip></span><input v-model.number="f.min_effect" type="number" step="0.01" min="0" :max="maxD" class="input input-sm" data-testid="kfa-min-effect" /></label>
      <label class="ttw-field w-56"><span class="ttw-label">{{ t('kfa.min_effect_slider') }}</span><input v-model.number="f.min_effect" type="range" min="0" :max="maxD" step="0.01" class="range range-xs range-primary" data-testid="kfa-min-effect-slider" :aria-label="t('kfa.min_effect_slider')" /></label>
        <span class="text-xs text-text-muted pb-2">{{ t('kfa.min_effect_filter') }}</span>
        <CopyCode analysis="kfa" :params="copyParams" /><ExportMenu name="kfa" :rows="shown.rows" /></div>
      <ChartGallery :kfa="shown" :layer="lastParams?.layer ?? effectiveLayer" :feature="data.feature" :sides="gallerySides" @select="select" />
      <section v-if="detail" class="bg-base-200 rounded-box p-3 flex flex-col gap-2" aria-live="polite">
        <h3 class="font-bold">{{ t('kfa.detail', { feature: detail.name }) }}</h3>
        <p class="text-sm">d = {{ detail.row.Effect_Size.toFixed(3) }} · {{ t('kfa.mean') }}: {{ detail.row.Mean_Corpus1.toFixed(2) }} × {{ detail.row.Mean_Corpus2.toFixed(2) }}</p>
        <p class="text-xs text-text-muted">{{ t('kfa.detail_hint') }}</p>
        <svg viewBox="0 0 600 84" class="w-full max-w-3xl" role="img" :aria-label="detail.name">
          <g v-for="(vals, i) in [detail.v1, detail.v2]" :key="i" :transform="`translate(0 ${i * 40 + 4})`">
            <text x="0" y="8" class="fill-current text-[10px]">{{ gallerySides[i].label }}</text>
            <line x1="10" x2="590" y1="24" y2="24" class="stroke-current opacity-20" />
            <circle v-for="v in vals" :key="v.filename" :cx="10 + (v.value / maxV) * 580" cy="24" r="4" :class="i ? 'fill-chart-2' : 'fill-chart-1'" opacity="0.7"><title>{{ v.filename }}: {{ v.value.toFixed(2) }}</title></circle>
          </g>
        </svg>
        <RouterLink class="link text-sm" :to="{ path: '/explorar/leitor', query: { color: 'tags', highlight: detail.name } }">{{ t('kfa.open_reader') }}</RouterLink>
      </section>
      <div class="ttw-scroll">
        <table class="table table-xs table-pin-rows"><thead><tr><th>{{ t('kfa.feature') }}</th><th class="text-right">d</th><th class="text-right" :title="`${t('kfa.mean')}: ${gallerySides[0].label}`">{{ gallerySides[0].label }}</th><th class="text-right" :title="`${t('kfa.mean')}: ${gallerySides[1].label}`">{{ gallerySides[1].label }}</th></tr></thead>
          <tbody><tr v-for="r in shown.rows" :key="r.Feature" class="hover cursor-pointer" tabindex="0" @click="select(r.Feature)" @keydown.enter="select(r.Feature)"><td>{{ r.Feature }}</td><td class="text-right tabular-nums">{{ r.Effect_Size.toFixed(3) }}</td>
            <td class="text-right tabular-nums">{{ r.Mean_Corpus1.toFixed(2) }}</td><td class="text-right tabular-nums">{{ r.Mean_Corpus2.toFixed(2) }}</td></tr></tbody></table>
      </div>
    </template>
  </section>
</template>
