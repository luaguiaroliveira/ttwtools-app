<script setup>
// Visão geral do corpus (§12): só mostra o que já foi calculado; o cálculo é o passo
// "Estatísticas básicas" da tela Etiquetagem.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/index.js'
import StatCard from './StatCard.vue'
import BarChart from './BarChart.vue'
import CopyCode from './CopyCode.vue'
import ExportMenu from './ExportMenu.vue'


const props = defineProps({ corpus: { type: String, required: true }, layer: { type: String, default: null } })
const { t, locale } = useI18n()
const data = ref(null)
const hideStop = ref(false)
const params = computed(() => ({ layer: props.layer, hide_stopwords: hideStop.value }))

async function load() {
  data.value = null
  try { data.value = await api.corpora.overview(props.corpus, params.value) } catch { data.value = null }
}
watch(() => [props.corpus, props.layer, hideStop.value], load, { immediate: true })

const n = (v, d = 0) => (v === null || v === undefined ? '—' : Number(v).toLocaleString(locale.value === 'pt' ? 'pt-BR' : 'en', { maximumFractionDigits: d }))
</script>

<template>
  <section class="flex flex-col gap-4" :aria-label="t('overview.title')" data-explain="explain.corpora.overview">
    <div class="flex items-center gap-2">
      <h2 class="text-xl font-bold">{{ t('overview.title') }}: {{ corpus }}</h2>
      <label class="ml-auto flex items-center gap-2 text-sm"><input v-model="hideStop" type="checkbox" class="checkbox checkbox-sm" />{{ t('overview.hide_stopwords') }}</label>
    </div>
    <p v-if="!data" class="text-sm opacity-80" data-testid="overview-missing">{{ t('overview.not_computed') }}
      <RouterLink to="/etiquetagem" class="link">{{ t('nav.tagging') }}</RouterLink></p>
    <template v-if="data">
      <div class="flex gap-1"><CopyCode analysis="describe" :params="{ corpus, layer, hide_stopwords: hideStop || null }" />
        <ExportMenu :name="`visao_geral_${corpus}`" :rows="data.text.per_document" /></div>
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
