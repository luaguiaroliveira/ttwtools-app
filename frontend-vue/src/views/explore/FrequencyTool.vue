<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { api } from '../../api/index.js'
import { useSession } from '../../stores/session.js'
import BarChart from '../../components/BarChart.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'
const chart = ref(null)
const props = defineProps({ corpus: String, layer: String })
const { t } = useI18n()
const { activeCorpus } = storeToRefs(useSession())
const f = ref({ unit: 'form', n: 2, by: 'corpus', top: 50, hide_stopwords: false })
const data = ref(null)
const error = ref(null)
async function run() {
  error.value = null
  try { data.value = await api.explore.frequency({ corpus: props.corpus, layer: props.layer, ...f.value }) }
  catch (err) { error.value = err.message }
}
</script>
<template>
  <section class="flex flex-col gap-3">
    <form class="flex flex-wrap items-end gap-2" @submit.prevent="run">
      <label class="form-control"><span class="label-text">{{ t('explore.unit') }}</span>
        <select v-model="f.unit" class="select select-sm"><option v-for="u in ['form', 'lemma', 'word_pos', 'pos', 'ngram']" :key="u" :value="u">{{ t(`explore.unit.${u}`) }}</option></select></label>
      <label v-if="f.unit === 'ngram'" class="form-control w-16"><span class="label-text">{{ t('explore.n') }}</span>
        <input v-model.number="f.n" type="number" min="2" max="6" class="input input-sm" /></label>
      <label class="form-control"><span class="label-text">{{ t('explore.by') }}</span>
        <select v-model="f.by" class="select select-sm"><option value="corpus">{{ t('explore.by.corpus') }}</option><option value="document">{{ t('explore.by_document') }}</option>
          <option v-for="k in activeCorpus?.metadata_keys ?? []" :key="k" :value="k">{{ k }}</option></select></label>
      <label class="flex items-center gap-2 text-sm"><input v-model="f.hide_stopwords" type="checkbox" class="checkbox checkbox-sm" />{{ t('overview.hide_stopwords') }}</label>
      <button class="btn btn-sm btn-primary" data-testid="freq-go">{{ t('explore.go') }}</button>
    </form>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="data">
      <div class="flex gap-1"><CopyCode analysis="frequency" :params="{ corpus, layer, unit: f.unit, n: f.unit === 'ngram' ? f.n : null, by: f.by, top: f.top }" />
        <ExportMenu :name="`frequencia_${f.unit}`" :rows="data.rows" :svg-root="f.by === 'corpus' ? chart : null" /></div>
      <BarChart v-if="f.by === 'corpus'" ref="chart" :title="t(`explore.unit.${data.unit}`)" :items="data.rows.map((r) => ({ label: r.item, value: r.freq }))" value-label="freq" :max="25" />
      <div class="overflow-x-auto max-h-96">
        <table class="table table-xs"><thead><tr><th v-if="f.by !== 'corpus'">{{ t('explore.by') }}</th><th>{{ t('explore.item') }}</th><th class="text-right">{{ t('explore.freq') }}</th><th class="text-right">{{ t('explore.per_1000') }}</th></tr></thead>
          <tbody><tr v-for="(r, i) in data.rows" :key="i"><td v-if="f.by !== 'corpus'">{{ r.group }}</td><td>{{ r.item }}</td>
            <td class="text-right tabular-nums">{{ r.freq }}</td><td class="text-right tabular-nums">{{ r.per_1000?.toFixed(2) }}</td></tr></tbody></table>
      </div>
    </template>
  </section>
</template>
