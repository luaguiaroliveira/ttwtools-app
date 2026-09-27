<script setup>
// Visão geral do corpus (§12): guardada (GET) ou calculada numa tarefa (POST).
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/index.js'
import { useJob } from '../composables/useJob.js'
import StatCard from './StatCard.vue'
import BarChart from './BarChart.vue'
import JobProgress from './JobProgress.vue'

const props = defineProps({ corpus: { type: String, required: true }, layer: { type: String, default: null } })
const { t, locale } = useI18n()
const data = ref(null)
const hideStop = ref(false)
const job = useJob(`overview.${props.corpus}`)
const params = computed(() => ({ layer: props.layer, hide_stopwords: hideStop.value }))

async function load() {
  data.value = null
  try { data.value = await api.corpora.overview(props.corpus, params.value) } catch { data.value = null }
}
async function compute() {
  await job.start(() => api.corpora.computeOverview(props.corpus, params.value))
  if (job.job.value?.status === 'done') data.value = job.job.value.result
}
watch(() => [props.corpus, props.layer, hideStop.value], load, { immediate: true })
watch(() => job.job.value?.status, (s) => { if (s === 'done') data.value = job.job.value.result })

const n = (v, d = 0) => (v === null || v === undefined ? '—' : Number(v).toLocaleString(locale.value === 'pt' ? 'pt-BR' : 'en', { maximumFractionDigits: d }))
</script>

<template>
  <section class="flex flex-col gap-4" :aria-label="t('overview.title')">
    <div class="flex items-center gap-2">
      <h2 class="text-xl font-bold">{{ t('overview.title') }}: {{ corpus }}</h2>
      <label class="ml-auto flex items-center gap-2 text-sm"><input v-model="hideStop" type="checkbox" class="checkbox checkbox-sm" />{{ t('overview.hide_stopwords') }}</label>
      <button class="btn btn-sm btn-primary" data-testid="overview-compute" @click="compute">{{ data ? t('overview.recompute') : t('overview.compute') }}</button>
    </div>
    <JobProgress v-if="job.job.value && job.job.value.status !== 'done'" :job="job.job.value" @cancel="job.cancel" />
    <template v-if="data">
      <p class="text-sm opacity-70">{{ t('overview.estimates') }}</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2" data-testid="overview-stats">
        <StatCard :label="t('overview.documents')" :value="n(data.text.documents)" />
        <StatCard :label="t('overview.tokens')" :value="n(data.text.tokens)" help="normalizacao_por_mil" />
        <StatCard :label="t('overview.types')" :value="n(data.text.types)" />
        <StatCard :label="t('overview.hapax')" :value="n(data.text.hapax)" />
        <StatCard :label="t('overview.ttr')" :value="n(data.text.ttr, 3)" />
        <StatCard :label="t('overview.sttr')" :value="n(data.text.sttr, 3)" />
        <StatCard :label="t('overview.mattr')" :value="n(data.text.mattr, 3)" />
        <StatCard :label="t('overview.word_length')" :value="n(data.text.mean_word_length, 2)" />
        <StatCard :label="t('overview.sentences')" :value="n(data.text.sentences)" />
      </div>
      <p class="text-sm">{{ t('overview.doc_sizes') }}: {{ n(data.text.document_tokens.min) }} · {{ n(data.text.document_tokens.median) }} · {{ n(data.text.document_tokens.max) }}</p>
      <BarChart :title="t('overview.top_words')" :items="data.text.top_words.map((w) => ({ label: w.word, value: w.freq }))" value-label="freq" />
      <div v-if="data.layer" class="flex flex-col gap-3">
        <h3 class="font-bold">{{ t('overview.layer_level', { layer: data.layer.layer }) }}</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <StatCard :label="t('overview.lexical_density')" :value="n(data.layer.lexical_density, 3)" />
          <StatCard :label="t('overview.sentence_length')" :value="n(data.layer.sentence_length.mean, 1)" />
        </div>
        <BarChart v-if="Object.keys(data.layer.upos).length" :title="t('overview.upos')"
                  :items="Object.entries(data.layer.upos).map(([k, v]) => ({ label: k, value: v }))" value-label="freq" />
      </div>
    </template>
  </section>
</template>
