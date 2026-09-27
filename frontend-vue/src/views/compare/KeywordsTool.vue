<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { api } from '../../api/index.js'
import { useSession } from '../../stores/session.js'
import HelpTip from '../../components/HelpTip.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'
const lastParams = ref(null)
const props = defineProps({ corpus: String })
const { t, locale } = useI18n()
const router = useRouter()
const session = useSession()
const { corpora, activeCorpus, layer } = storeToRefs(session)
const f = ref({ refKind: 'corpus', refCorpus: '', groupKey: '', groupValue: '', listPath: '', catalogRef: '', unit: 'form', measure: 'll', min_freq: 5, min_range: 1, correction: 'bonferroni' })
const groups = ref([])
const data = ref(null)
const error = ref(null)
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
  const reference = f.value.refKind === 'corpus' ? f.value.refCorpus : f.value.refKind === 'rest' ? `rest:${f.value.groupKey}` : f.value.refKind === 'catalog' ? f.value.catalogRef : f.value.listPath
  const where = f.value.refKind === 'rest' ? { [f.value.groupKey]: [f.value.groupValue] } : undefined
  lastParams.value = { corpus: props.corpus, reference, where, unit: f.value.unit, measure: f.value.measure, layer: layer.value,
    min_freq: f.value.min_freq, min_range: f.value.min_range, correction: f.value.correction }
  try {
    data.value = await api.compare.keywords({ corpus: props.corpus, reference, where, unit: f.value.unit, measure: f.value.measure,
      min_freq: f.value.min_freq, min_range: f.value.min_range, correction: f.value.correction, layer: layer.value, lang: locale.value })
  } catch (err) { error.value = err.message }
}
const fx = (v, d = 2) => (v === null || v === undefined ? '∞' : v.toFixed(d))
const kwic = (item) => router.push({ path: '/explorar/kwic', query: { q: item } })
</script>
<template>
  <section class="flex flex-col gap-3">
    <form id="palavras-chave" class="flex flex-wrap items-end gap-2" @submit.prevent="run">
      <label class="form-control"><span class="label-text">{{ t('compare.reference') }}</span>
        <select v-model="f.refKind" class="select select-sm"><option value="corpus">{{ t('compare.ref.corpus') }}</option>
          <option value="rest" :disabled="!activeCorpus?.metadata_keys.length">{{ t('compare.ref.rest') }}</option><option value="catalog" :disabled="!catalogRefs.length">{{ t('compare.ref.catalog') }}</option><option value="list">{{ t('compare.ref.list') }}</option></select></label>
      <label v-if="f.refKind === 'catalog'" class="form-control"><span class="label-text">{{ t('compare.ref.catalog') }}</span>
        <select v-model="f.catalogRef" class="select select-sm" data-testid="kw-catalog"><option v-for="r in catalogRefs" :key="r.ref" :value="r.ref">{{ r.name }} · {{ r.version }}</option></select></label>
      <label v-if="f.refKind === 'corpus'" class="form-control"><span class="label-text">{{ t('compare.ref.corpus') }}</span>
        <select v-model="f.refCorpus" class="select select-sm" data-testid="kw-ref"><option v-for="c in others" :key="c.name">{{ c.name }}</option></select></label>
      <template v-if="f.refKind === 'rest'">
        <label class="form-control"><span class="label-text">{{ t('compare.group_key') }}</span>
          <select v-model="f.groupKey" class="select select-sm" @change="loadGroups"><option v-for="k in activeCorpus.metadata_keys" :key="k">{{ k }}</option></select></label>
        <label class="form-control"><span class="label-text">{{ t('compare.group_value') }}</span>
          <select v-model="f.groupValue" class="select select-sm"><option v-for="g in groups" :key="g">{{ g }}</option></select></label>
      </template>
      <label v-if="f.refKind === 'list'" class="form-control flex-1 min-w-48"><span class="label-text">{{ t('compare.list_path') }}</span>
        <input v-model="f.listPath" class="input input-sm" /></label>
      <label class="form-control"><span class="label-text">{{ t('explore.unit') }}</span>
        <select v-model="f.unit" class="select select-sm"><option v-for="u in ['form', 'lemma', 'pos', 'word_pos', 'ngram']" :key="u" :value="u">{{ t(`explore.unit.${u}`) }}</option></select></label>
      <label class="form-control"><span class="label-text">{{ t('explore.measure') }}</span>
        <select v-model="f.measure" class="select select-sm"><option value="ll">log-likelihood</option><option value="log_ratio">log ratio</option><option value="pct_diff">%DIFF</option><option value="log_odds">log-odds</option></select></label>
      <label class="form-control w-20"><span class="label-text">{{ t('explore.min_freq') }}</span><input v-model.number="f.min_freq" type="number" min="1" class="input input-sm" /></label>
      <label class="form-control w-20"><span class="label-text">{{ t('compare.min_range') }}</span><input v-model.number="f.min_range" type="number" min="1" class="input input-sm" /></label>
      <label class="form-control"><span class="label-text">{{ t('compare.correction') }}</span>
        <select v-model="f.correction" class="select select-sm"><option>bonferroni</option><option>fdr</option><option>none</option></select></label>
      <button class="btn btn-sm btn-primary" data-testid="kw-run">{{ t('compare.run') }}</button>
      <HelpTip topic="keyness" />
    </form>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="data">
      <p class="text-sm font-medium">{{ t('compare.words', { target: data.target, tw: data.target_words, reference: data.reference, rw: data.reference_words }) }}</p>
      <div class="flex gap-1"><CopyCode analysis="keywords" :params="lastParams" /><ExportMenu name="palavras-chave" :rows="data.rows" /></div>
      <div v-for="w in data.warnings" :key="w.code" role="alert" class="alert py-1 text-sm"
           :class="{ 'alert-error': w.severity === 'error', 'alert-warning': w.severity === 'warning', 'alert-info': w.severity === 'info' }">{{ w.message }}</div>
      <div class="overflow-x-auto max-h-[60vh]">
        <table class="table table-xs table-pin-rows" data-testid="kw-table">
          <thead><tr><th>{{ t('explore.item') }}</th><th>{{ t('compare.direction') }}</th><th class="text-right">{{ t('compare.target') }}</th><th class="text-right">{{ t('compare.reference') }}</th>
            <th class="text-right">LL</th><th class="text-right">log ratio</th><th class="text-right">%DIFF</th><th class="text-right">p corr.</th><th class="text-right">range</th></tr></thead>
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
