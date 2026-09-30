<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { api } from '../../api/index.js'
import { useSession } from '../../stores/session.js'
import ChartGallery from '../../components/ChartGallery.vue'
import HelpTip from '../../components/HelpTip.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'
import BusyModal from '../../components/BusyModal.vue'
import FeatureSelect from '../../components/FeatureSelect.vue'
const lastParams = ref(null)
const props = defineProps({ corpus: String })
const { t } = useI18n()
const { corpora, activeCorpus, layer } = storeToRefs(useSession())
const f = ref({ corpus2: '', groupKey: '', group1: '', group2: '', feature: '', metric: 'kfa', min_effect: 0.2 })
const groups = ref([])
const data = ref(null)
const error = ref(null)
const detail = ref(null)
const busy = ref(false)
const job = ref(null)          // andamento da tarefa (etapa e documentos contados) para a barra
let jobId = null
const layers = computed(() => [...new Set((activeCorpus.value?.layers ?? []).map((l) => l.tool))])
// a camada é a do topo da tela (seletor global); "automática" cai na primeira camada do corpus
const effectiveLayer = computed(() => (layer.value && layers.value.includes(layer.value) ? layer.value : layers.value[0] ?? ''))
const layerFields = computed(() => activeCorpus.value?.layers?.find((l) => l.tool === effectiveLayer.value)?.fields ?? [])
const keptFor = ref('')                                    // camada para a qual o usuário escolheu manter o resultado antigo
const stale = computed(() => Boolean(data.value && lastParams.value && (lastParams.value.layer !== effectiveLayer.value || (lastParams.value.requestedFeature ?? '') !== (layerFields.value.includes('upos') && layerFields.value.includes('xpos') ? f.value.feature : '')) && keptFor.value !== `${effectiveLayer.value}/${f.value.feature}`))
const sameCorpus = computed(() => f.value.corpus2 === '__groups__')
async function loadGroups() {
  groups.value = f.value.groupKey ? [...new Set((await api.corpora.documents(props.corpus, { limit: 1000 })).rows.map((r) => r[f.value.groupKey]))] : []
}
const side = (n) => (sameCorpus.value ? { corpus: props.corpus, where: { [f.value.groupKey]: [f.value[`group${n}`]] } }
  : { corpus: n === 1 ? props.corpus : f.value.corpus2, where: undefined })
async function run() {
  error.value = null
  keptFor.value = ''
  detail.value = null
  const s1 = side(1), s2 = side(2)
  lastParams.value = { corpus: s1.corpus, corpus2: s2.corpus, layer: effectiveLayer.value, feature: f.value.feature || undefined, requestedFeature: f.value.feature, metric: f.value.metric, min_effect: f.value.min_effect,
    where: s1.where, where2: s2.where }
  busy.value = true
  try {
    data.value = await api.compare.kfa({ corpus1: s1.corpus, corpus2: s2.corpus, where1: s1.where, where2: s2.where,
      layer: effectiveLayer.value, feature: f.value.feature || undefined, metric: f.value.metric, min_effect: f.value.min_effect }, { onJob: (j) => { job.value = j; jobId = j.id } })
  } catch (err) { if (err?.name !== 'AbortError') error.value = err.message } finally { busy.value = false; job.value = null; jobId = null }
}
async function select(name) {
  const [a, b] = await Promise.all([1, 2].map((n) => { const s = side(n); return api.compare.feature({ corpus: s.corpus, where: s.where, layer: lastParams.value?.layer ?? effectiveLayer.value, feature: data.value.feature, name }) }))
  const row = data.value.rows.find((r) => r.Feature === name)
  detail.value = { name, row, v1: a.values, v2: b.values }
}
const gallerySides = computed(() => [1, 2].map((n) => { const s = side(n); return { corpus: s.corpus, where: s.where, label: sameCorpus.value ? `${f.value.groupKey}=${f.value[`group${n}`]}` : s.corpus } }))
const maxV = computed(() => Math.max(1, ...[...(detail.value?.v1 ?? []), ...(detail.value?.v2 ?? [])].map((v) => v.value)))
</script>
<template>
  <section class="flex flex-col gap-3">
    <BusyModal :open="busy" :delay="350" :title="t('compare.calculating')" :message="t('compare.calculating_hint')" :job="job" @cancel="jobId && api.jobs.cancel(jobId)" />
    <p v-if="!layers.length" class="text-text-muted">{{ t('kfa.no_layer') }}</p>
    <form v-else class="flex flex-wrap items-end gap-2" @submit.prevent="run">
      <label class="ttw-field"><span class="ttw-label">{{ t('kfa.corpus2') }}</span>
        <select v-model="f.corpus2" class="select select-sm" data-testid="kfa-corpus2">
          <option v-for="c in corpora.filter((c) => c.name !== corpus)" :key="c.name" :value="c.name">{{ c.name }}</option>
          <option value="__groups__" :disabled="!activeCorpus?.metadata_keys.length">{{ t('kfa.same_corpus_groups') }}</option></select></label>
      <template v-if="sameCorpus">
        <label class="ttw-field"><span class="ttw-label">{{ t('compare.group_key') }}</span>
          <select v-model="f.groupKey" class="select select-sm" @change="loadGroups"><option v-for="k in activeCorpus.metadata_keys" :key="k">{{ k }}</option></select></label>
        <label class="ttw-field"><span class="ttw-label">{{ t('kfa.group1') }}</span><select v-model="f.group1" class="select select-sm"><option v-for="g in groups" :key="g">{{ g }}</option></select></label>
        <label class="ttw-field"><span class="ttw-label">{{ t('kfa.group2') }}</span><select v-model="f.group2" class="select select-sm"><option v-for="g in groups" :key="g">{{ g }}</option></select></label>
      </template>
      <FeatureSelect v-model="f.feature" :fields="layerFields" />
      <label class="ttw-field"><span class="ttw-label flex items-center gap-1"><HelpTip term="kfa">{{ t('kfa.metric') }}</HelpTip></span>
        <select v-model="f.metric" class="select select-sm" data-testid="kfa-metric"><option value="kfa">KFA (Biber & Egbert)</option><option value="kfa2">KFA2</option></select></label>
      <label class="ttw-field w-24"><span class="ttw-label flex items-center gap-1"><HelpTip term="cohens_d">{{ t('kfa.min_effect') }}</HelpTip></span><input v-model.number="f.min_effect" type="number" step="0.1" min="0" class="input input-sm" data-testid="kfa-min-effect" /></label>
      <button class="btn btn-sm btn-primary" data-testid="kfa-run">{{ t('compare.run') }}</button>
      <span class="badge badge-outline" data-testid="kfa-layer" :title="t('kfa.layer_hint')">{{ layer ? t('kfa.layer_used', { layer: effectiveLayer }) : t('kfa.layer_auto', { layer: effectiveLayer }) }}</span>
      <HelpTip term="kfa" />
    </form>
    <div v-if="stale" role="alert" class="alert alert-warning text-sm flex flex-wrap items-center gap-2" data-testid="kfa-stale">
      <span>{{ lastParams.layer !== effectiveLayer ? t('kfa.layer_changed', { old: lastParams.layer, new: effectiveLayer }) : t('kfa.feature_changed') }}</span>
      <button class="btn btn-sm btn-primary" data-testid="kfa-recalc" @click="run">{{ t('kfa.recalc', { layer: effectiveLayer }) }}</button>
      <button class="btn btn-sm btn-ghost" data-testid="kfa-keep" @click="keptFor = `${effectiveLayer}/${f.feature}`">{{ t('kfa.keep') }}</button>
    </div>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="data">
      <p role="status" class="text-sm">{{ t('kfa.results', { n: data.rows.length, n1: data.n1, n2: data.n2 }) }} · {{ t('kfa.result_layer', { layer: lastParams?.layer }) }} · {{ t('kfa.result_feature', { feature: data.feature }) }}</p>
      <div class="flex gap-1"><CopyCode analysis="kfa" :params="lastParams" /><ExportMenu name="kfa" :rows="data.rows" /></div>
      <ChartGallery :kfa="data" :layer="lastParams?.layer ?? effectiveLayer" :feature="data.feature" :sides="gallerySides" @select="select" />
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
          <tbody><tr v-for="r in data.rows" :key="r.Feature" class="hover cursor-pointer" @click="select(r.Feature)"><td>{{ r.Feature }}</td><td class="text-right tabular-nums">{{ r.Effect_Size.toFixed(3) }}</td>
            <td class="text-right tabular-nums">{{ r.Mean_Corpus1.toFixed(2) }}</td><td class="text-right tabular-nums">{{ r.Mean_Corpus2.toFixed(2) }}</td></tr></tbody></table>
      </div>
    </template>
  </section>
</template>
