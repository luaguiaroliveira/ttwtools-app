<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { api } from '../../api/index.js'
import { useSession } from '../../stores/session.js'
import BarChart from '../../components/BarChart.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'
import BusyBar from '../../components/BusyBar.vue'
import HelpTip from '../../components/HelpTip.vue'
const chart = ref(null)
const props = defineProps({ corpus: String, layer: String })
const { t } = useI18n()
const { activeCorpus } = storeToRefs(useSession())
const f = ref({ unit: 'form', n: 2, by: 'corpus', top: 50, hide_stopwords: false })
const barH = ref(20)   // altura de cada barra (px): menor = mais palavras visíveis de uma vez
const data = ref(null)
const error = ref(null)
const busy = ref(false)
const TOP = [25, 50, 100, 200, 500]
async function run() {
  error.value = null
  busy.value = true
  try { data.value = await api.explore.frequency({ corpus: props.corpus, layer: props.layer, ...f.value }) }
  catch (err) { error.value = err.message }
  finally { busy.value = false }
}
// Depois da primeira busca, mudar qualquer opção refaz a busca sozinho (com pequena espera
// para não disparar a cada tecla); o controle de altura das barras só redesenha.
let timer
watch(() => ({ ...f.value }), () => {
  if (!data.value) return
  clearTimeout(timer)
  const go = () => { busy.value ? (timer = setTimeout(go, 250)) : run() }
  timer = setTimeout(go, 250)
})
onBeforeUnmount(() => clearTimeout(timer))
</script>
<template>
  <section class="flex flex-col gap-3">
    <form class="flex flex-col gap-2" @submit.prevent="!busy && run()"><div class="ttw-form">
      <label class="ttw-field"><span class="ttw-label"><HelpTip term="lemma">{{ t('explore.unit') }}</HelpTip></span>
        <select v-model="f.unit" class="select select-sm" data-testid="freq-unit"><option v-for="u in ['form', 'lemma', 'word_pos', 'pos', 'ngram']" :key="u" :value="u">{{ t(`explore.unit.${u}`) }}</option></select></label>
      <label v-if="f.unit === 'ngram'" class="ttw-field w-16"><span class="ttw-label flex items-center gap-1"><HelpTip term="ngram">{{ t('explore.n') }}</HelpTip></span>
        <input v-model.number="f.n" type="number" min="2" max="6" class="input input-sm" /></label>
      <label class="ttw-field"><span class="ttw-label">{{ t('explore.by') }}</span>
        <select v-model="f.by" class="select select-sm"><option value="corpus">{{ t('explore.by.corpus') }}</option><option value="document">{{ t('explore.by_document') }}</option>
          <option v-for="k in activeCorpus?.metadata_keys ?? []" :key="k" :value="k">{{ k }}</option></select></label>
      <label class="ttw-field w-28"><span class="ttw-label">{{ t('explore.show_top') }}</span>
        <select v-model.number="f.top" class="select select-sm" data-testid="freq-top"><option v-for="n in TOP" :key="n" :value="n">{{ n }}</option></select></label>
      <label class="ttw-check"><input v-model="f.hide_stopwords" type="checkbox" class="checkbox checkbox-sm" /><HelpTip term="stopwords">{{ t('overview.hide_stopwords') }}</HelpTip></label>
      <label v-if="f.by === 'corpus'" class="ttw-field w-44">
        <span class="ttw-label justify-between">{{ t('chart.bar_height') }}<span class="text-text-muted">{{ barH }}px</span></span>
        <span class="flex items-center min-h-8"><input v-model.number="barH" type="range" min="6" max="40" step="2" class="range range-xs range-primary"
               data-testid="freq-bar-height" /></span>
      </label>
      <button class="btn btn-sm btn-primary" data-testid="freq-go" :disabled="busy"><span v-if="busy" class="loading loading-spinner loading-xs" aria-hidden="true" />{{ t('explore.go') }}</button>
    </div>
    <BusyBar :busy="busy" />
    </form>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="data">
      <div class="flex items-center gap-1"><CopyCode analysis="frequency" :params="{ corpus, layer, unit: f.unit, n: f.unit === 'ngram' ? f.n : null, by: f.by, top: f.top }" />
        <ExportMenu :name="`frequencia_${f.unit}`" :rows="data.rows" :svg-root="f.by === 'corpus' ? chart : null" /></div>
      <div v-if="f.by === 'corpus'" class="max-h-96 overflow-auto">
        <BarChart ref="chart" :title="t(`explore.unit.${data.unit}`)" :items="data.rows.map((r) => ({ label: r.item, value: r.freq }))" value-label="freq" :max="f.top" :bar-height="barH" />
      </div>
      <div class="table-scroll overflow-x-auto">
        <table class="table table-xs"><thead><tr><th v-if="f.by !== 'corpus'">{{ t('explore.by') }}</th><th>{{ t('explore.item') }}</th><th class="text-right">{{ t('explore.freq') }}</th>
          <th class="text-right whitespace-nowrap"><HelpTip term="per_1000">{{ t('explore.per_1000') }}</HelpTip></th></tr></thead>
          <tbody><tr v-for="(r, i) in data.rows" :key="i"><td v-if="f.by !== 'corpus'">{{ r.group }}</td><td>{{ r.item }}</td>
            <td class="text-right tabular-nums">{{ r.freq }}</td><td class="text-right tabular-nums">{{ r.per_1000?.toFixed(2) }}</td></tr></tbody></table>
      </div>
    </template>
  </section>
</template>
