<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { api } from '../../api/index.js'
import { useSession } from '../../stores/session.js'
import HelpTip from '../../components/HelpTip.vue'
import Collapsible from '../../components/Collapsible.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'
import BusyModal from '../../components/BusyModal.vue'
import { useTopLayer } from '../../composables/useTopLayer.js'
import { useCompare } from '../../stores/compare.js'
const lastParams = ref(null)
const props = defineProps({ corpus: String })
const { t, locale } = useI18n()
const router = useRouter()
const session = useSession()
const { corpora, activeCorpus, layer } = storeToRefs(session)
const cmp = useCompare()
const f = ref({ refKind: 'bar', refCorpus: '', groupKey: '', groupValue: '', listPath: '', catalogRef: '', unit: 'form', measure: 'll', min_freq: 5, min_range: 1, correction: 'bonferroni' })
const groups = ref([])
const data = ref(null)
const topLayer = useTopLayer(computed(() => f.value.unit), lastParams)
const error = ref(null)
const busy = ref(false)
const others = computed(() => corpora.value.filter((c) => c.name !== props.corpus))
const catalogRefs = ref([])
onMounted(async () => {
  const seen = new Map((await api.compare.references()).references.map((r) => [r.ref, r]))
  catalogRefs.value = [...seen.values()]
})
async function loadGroups() {
  groups.value = f.value.groupKey ? [...new Set((await api.corpora.documents(props.corpus, { limit: 1000 })).rows.map((r) => r[f.value.groupKey]))] : []
}
async function run() {
  error.value = null
  const bar = f.value.refKind === 'bar' ? cmp.sides(props.corpus) : null     // corpus 2 (ou dois grupos) da barra de comparação
  const reference = bar ? bar[1].corpus : f.value.refKind === 'corpus' ? f.value.refCorpus : f.value.refKind === 'rest' ? `rest:${f.value.groupKey}` : f.value.refKind === 'catalog' ? f.value.catalogRef : f.value.listPath
  const where = bar ? bar[0].where : f.value.refKind === 'rest' ? { [f.value.groupKey]: [f.value.groupValue] } : undefined
  const reference_where = bar ? bar[1].where : undefined
  lastParams.value = { corpus: props.corpus, reference, where, reference_where, unit: f.value.unit, measure: f.value.measure, layer: layer.value,
    min_freq: f.value.min_freq, min_range: f.value.min_range, correction: f.value.correction }
  busy.value = true
  try {
    data.value = await api.compare.keywords({ corpus: props.corpus, reference, where, reference_where, unit: f.value.unit, measure: f.value.measure,
      min_freq: f.value.min_freq, min_range: f.value.min_range, correction: f.value.correction, layer: layer.value, lang: locale.value })
  } catch (err) { error.value = err.message } finally { busy.value = false }
}
const fx = (v, d = 2) => (v === null || v === undefined ? '∞' : v.toFixed(d))
const kwic = (item) => router.push({ path: '/explorar/kwic', query: { q: item } })
</script>
<template>
  <section class="flex flex-col gap-3">
    <BusyModal :open="busy" :delay="350" :title="t('compare.calculating')" :message="t('compare.calculating_hint')" />
    <form id="palavras-chave" class="flex flex-wrap items-end gap-2" @submit.prevent="run">
      <label class="ttw-field"><span class="ttw-label">{{ t('compare.reference') }}</span>
        <select v-model="f.refKind" class="select select-sm" data-testid="kw-refkind"><option value="bar">{{ t('compare.ref.bar') }}</option><option value="corpus">{{ t('compare.ref.corpus') }}</option>
          <option value="rest" :disabled="!activeCorpus?.metadata_keys.length">{{ t('compare.ref.rest') }}</option><option value="catalog" :disabled="!catalogRefs.length">{{ t('compare.ref.catalog') }}</option><option value="list">{{ t('compare.ref.list') }}</option></select></label>
      <label v-if="f.refKind === 'catalog'" class="ttw-field"><span class="ttw-label">{{ t('compare.ref.catalog') }}</span>
        <select v-model="f.catalogRef" class="select select-sm" data-testid="kw-catalog"><option v-for="r in catalogRefs" :key="r.ref" :value="r.ref">{{ r.name }} · {{ r.version }}</option></select></label>
      <label v-if="f.refKind === 'corpus'" class="ttw-field"><span class="ttw-label">{{ t('compare.ref.corpus') }}</span>
        <select v-model="f.refCorpus" class="select select-sm" data-testid="kw-ref"><option v-for="c in others" :key="c.name">{{ c.name }}</option></select></label>
      <template v-if="f.refKind === 'rest'">
        <label class="ttw-field"><span class="ttw-label">{{ t('compare.group_key') }}</span>
          <select v-model="f.groupKey" class="select select-sm" @change="loadGroups"><option v-for="k in activeCorpus.metadata_keys" :key="k">{{ k }}</option></select></label>
        <label class="ttw-field"><span class="ttw-label">{{ t('compare.group_value') }}</span>
          <select v-model="f.groupValue" class="select select-sm"><option v-for="g in groups" :key="g">{{ g }}</option></select></label>
      </template>
      <label v-if="f.refKind === 'list'" class="ttw-field flex-1 min-w-48"><span class="ttw-label">{{ t('compare.list_path') }}</span>
        <input v-model="f.listPath" class="input input-sm" /></label>
      <button class="btn btn-sm btn-primary" data-testid="kw-run">{{ t('compare.run') }}</button>
      <span class="badge badge-outline" data-testid="kw-layer" :title="t('compare.layer_auto_hint')">{{ layer ? t('kfa.layer_used', { layer }) : t('compare.layer_auto') }}</span>
      <HelpTip term="keyness" />
    </form>
    <div v-if="topLayer.missing.value" role="alert" class="alert alert-warning py-1 text-sm" data-testid="kw-unit-needs">{{ t('compare.unit_needs', { layer, field: topLayer.missing.value, unit: t(`explore.unit.${f.unit}`) }) }}</div>
    <div v-if="data && topLayer.stale.value" role="alert" class="alert alert-warning text-sm flex flex-wrap items-center gap-2" data-testid="kw-stale">
      <span>{{ lastParams.layer && layer ? t('compare.layer_changed', { old: lastParams.layer, new: layer }) : t('compare.layer_changed_auto') }}</span>
      <button class="btn btn-sm btn-primary" type="button" data-testid="kw-recalc" @click="run">{{ t('compare.recalc') }}</button>
      <button class="btn btn-sm btn-ghost" type="button" @click="topLayer.keep()">{{ t('compare.keep') }}</button>
    </div>
    <div class="w-full">
      <Collapsible :title="t('compare.advanced')">
        <div class="flex flex-wrap items-end gap-2 pt-2">
          <label class="ttw-field"><span class="ttw-label flex items-center gap-1"><HelpTip term="lemma">{{ t('explore.unit') }}</HelpTip></span>
            <select v-model="f.unit" class="select select-sm"><option v-for="u in ['form', 'lemma', 'pos', 'word_pos', 'ngram']" :key="u" :value="u">{{ t(`explore.unit.${u}`) }}</option></select></label>
          <label class="ttw-field"><span class="ttw-label flex items-center gap-1"><HelpTip term="ll">{{ t('explore.measure') }}</HelpTip></span>
            <select v-model="f.measure" class="select select-sm"><option value="ll">log-likelihood</option><option value="log_ratio">log ratio</option><option value="pct_diff">%DIFF</option><option value="log_odds">log-odds</option></select></label>
          <label class="ttw-field w-20"><span class="ttw-label">{{ t('explore.min_freq') }}</span><input v-model.number="f.min_freq" type="number" min="1" class="input input-sm" /></label>
          <label class="ttw-field w-20"><span class="ttw-label">{{ t('compare.min_range') }}</span><input v-model.number="f.min_range" type="number" min="1" class="input input-sm" /></label>
          <label class="ttw-field"><span class="ttw-label">{{ t('compare.correction') }}</span>
            <select v-model="f.correction" class="select select-sm"><option>bonferroni</option><option>fdr</option><option>none</option></select></label>
        </div>
      </Collapsible>
    </div>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="data">
      <p class="text-sm font-medium">{{ t('compare.words', { target: data.target, tw: data.target_words, reference: data.reference, rw: data.reference_words }) }}<span v-if="data.reference_card?.tool"> · {{ t('compare.result_layer', { layer: data.reference_card.tool }) }}</span></p>
      <div class="flex gap-1"><CopyCode analysis="keywords" :params="lastParams" /><ExportMenu name="palavras-chave" :rows="data.rows" /></div>
      <div v-for="w in data.warnings" :key="w.code" role="alert" class="alert py-1 text-sm"
           :class="{ 'alert-error': w.severity === 'error', 'alert-warning': w.severity === 'warning', 'alert-info': w.severity === 'info' }">{{ w.message }}</div>
      <div class="ttw-scroll">
        <table class="table table-xs table-pin-rows" data-testid="kw-table">
          <thead><tr><th>{{ t('explore.item') }}</th><th>{{ t('compare.direction') }}</th><th class="text-right">{{ t('compare.target') }}</th><th class="text-right">{{ t('compare.reference') }}</th>
            <th class="text-right whitespace-nowrap"><HelpTip term="ll">LL</HelpTip></th><th class="text-right whitespace-nowrap"><HelpTip term="log_ratio">log ratio</HelpTip></th><th class="text-right whitespace-nowrap"><HelpTip term="percent_diff">%DIFF</HelpTip></th><th class="text-right">p corr.</th><th class="text-right whitespace-nowrap">range <HelpTip term="range" /></th></tr></thead>
          <tbody><tr v-for="r in data.rows" :key="r.item + r.direction" class="hover cursor-pointer" tabindex="0" @click="kwic(r.item)" @keydown.enter="kwic(r.item)">
            <td class="font-medium">{{ r.item }}</td><td :class="r.direction === '+' ? 'text-success' : 'text-error'">{{ r.direction }}</td>
            <td class="text-right tabular-nums">{{ r.freq_target }}</td><td class="text-right tabular-nums">{{ r.freq_reference }}</td>
            <td class="text-right tabular-nums">{{ fx(r.ll) }}</td><td class="text-right tabular-nums">{{ fx(r.log_ratio) }}</td>
            <td class="text-right tabular-nums">{{ fx(r.pct_diff, 0) }}</td><td class="text-right tabular-nums" :class="{ 'font-bold': r.significant }">{{ r.p_adj.toExponential(1) }}</td>
            <td class="text-right tabular-nums">{{ r.range_target }}</td></tr></tbody>
        </table>
      </div>
    </template>
  </section>
</template>
