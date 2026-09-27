<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { api } from '../../api/index.js'
import { useSession } from '../../stores/session.js'
import QueryBox from './QueryBox.vue'
import BarChart from '../../components/BarChart.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'
const chart = ref(null)
const lastQuery = ref('')
const props = defineProps({ corpus: String, layer: String })
const { t } = useI18n()
const { activeCorpus } = storeToRefs(useSession())
const groupBy = ref('')
const result = ref(null)
const error = ref(null)
async function run(query) {
  error.value = null
  lastQuery.value = query
  try { result.value = await api.explore.search({ corpus: props.corpus, layer: props.layer, query, group_by: groupBy.value || undefined }) }
  catch (err) { error.value = err.message }
}
const items = computed(() => (result.value?.per_group ?? result.value?.per_document ?? [])
  .map((r) => ({ label: r.group ?? r.filename, value: r.freq })))
</script>
<template>
  <section class="flex flex-col gap-3">
    <QueryBox @submit="run">
      <label class="form-control"><span class="label-text">{{ t('explore.group_by') }}</span>
        <select v-model="groupBy" class="select select-sm"><option value="">{{ t('explore.by_document') }}</option>
          <option v-for="k in activeCorpus?.metadata_keys ?? []" :key="k" :value="k">{{ k }}</option></select></label>
    </QueryBox>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="result">
      <p role="status" class="font-medium">{{ t('explore.total', result) }}</p>
      <div class="flex gap-1"><CopyCode analysis="search" :params="{ corpus, query: lastQuery, layer, group_by: groupBy || null }" />
        <ExportMenu :name="`busca_${lastQuery}`" :rows="result.per_group ?? result.per_document" :svg-root="chart" /></div>
      <BarChart ref="chart" :title="groupBy || t('explore.by_document')" :items="items" value-label="freq" :max="30" />
    </template>
  </section>
</template>
