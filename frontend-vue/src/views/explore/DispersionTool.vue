<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../../api/index.js'
import QueryBox from './QueryBox.vue'
import HelpTip from '../../components/HelpTip.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'
import { distinctLabels } from '../../utils/labels.js'
const fig = ref(null)
const props = defineProps({ corpus: String, layer: String })
const { t } = useI18n()
const data = ref(null)
const error = ref(null)
const busy = ref(false)
const asTable = ref(false)
const labels = computed(() => distinctLabels(data.value?.per_document.map((d) => d.filename) ?? [], 26))
async function run(query) {
  error.value = null
  busy.value = true
  try { data.value = await api.explore.dispersion({ corpus: props.corpus, layer: props.layer, query }) }
  catch (err) { error.value = err.message }
  finally { busy.value = false }
}
const ROW = 13
const f3 = (v) => (v === null || v === undefined ? '—' : v.toFixed(3))
</script>
<template>
  <section class="flex flex-col gap-3">
    <QueryBox :busy="busy" @submit="run" />
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="data">
      <p role="status" class="font-medium">{{ t('explore.dp', { dp: f3(data.dp), dp_norm: f3(data.dp_norm), range: data.range, documents: data.documents }) }}
        <HelpTip topic="dispersao" /></p>
      <div class="flex items-center gap-1"><CopyCode analysis="dispersion" :params="{ corpus, query: data.query, layer }" />
        <ExportMenu :name="`dispersao_${data.query}`" :rows="data.per_document.map(({ positions, ...r }) => r)" :svg-root="fig" /></div>
      <figure ref="fig" class="flex flex-col gap-1">
        <figcaption class="text-sm flex items-center">{{ t('explore.barcode') }}
          <button class="btn btn-xs btn-ghost ml-auto" @click="asTable = !asTable">{{ asTable ? t('chart.as_chart') : t('chart.as_table') }}</button></figcaption>
        <table v-if="asTable" class="table table-xs"><thead><tr><th>{{ t('explore.file') }}</th><th class="text-right">{{ t('explore.freq') }}</th><th class="text-right">tokens</th></tr></thead>
          <tbody><tr v-for="d in data.per_document" :key="d.filename"><td>{{ d.filename }}</td><td class="text-right">{{ d.freq }}</td><td class="text-right">{{ d.size }}</td></tr></tbody></table>
        <div v-else class="ttw-scroll rounded-box border border-base-300 p-2">
          <svg :viewBox="`0 0 640 ${data.per_document.length * ROW + 4}`" class="w-full" role="img" :aria-label="t('explore.barcode')">
            <g v-for="(d, i) in data.per_document" :key="d.filename" :transform="`translate(0 ${i * ROW + 2})`">
              <title>{{ d.filename }}: {{ d.freq }}</title>
              <text x="200" :y="ROW - 4" text-anchor="end" class="fill-current text-[10px]">{{ labels[i] }}</text>
              <rect x="208" y="1" width="424" :height="ROW - 3" class="fill-base-200" />
              <rect v-for="(p, j) in d.positions" :key="j" :x="208 + p * 424" y="1" width="1.500" :height="ROW - 3" class="fill-orange-text" />
            </g>
          </svg>
        </div>
      </figure>
    </template>
  </section>
</template>
