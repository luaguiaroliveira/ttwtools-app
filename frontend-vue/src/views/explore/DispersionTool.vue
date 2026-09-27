<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../../api/index.js'
import QueryBox from './QueryBox.vue'
import HelpTip from '../../components/HelpTip.vue'
const props = defineProps({ corpus: String, layer: String })
const { t } = useI18n()
const data = ref(null)
const error = ref(null)
const asTable = ref(false)
async function run(query) {
  error.value = null
  try { data.value = await api.explore.dispersion({ corpus: props.corpus, layer: props.layer, query }) }
  catch (err) { error.value = err.message }
}
const f3 = (v) => (v === null || v === undefined ? '—' : v.toFixed(3))
</script>
<template>
  <section class="flex flex-col gap-3">
    <QueryBox @submit="run" />
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="data">
      <p role="status" class="font-medium">{{ t('explore.dp', { dp: f3(data.dp), dp_norm: f3(data.dp_norm), range: data.range, documents: data.documents }) }}
        <HelpTip topic="dispersao" /></p>
      <figure class="flex flex-col gap-1">
        <figcaption class="text-sm flex items-center">{{ t('explore.barcode') }}
          <button class="btn btn-xs btn-ghost ml-auto" @click="asTable = !asTable">{{ asTable ? t('chart.as_chart') : t('chart.as_table') }}</button></figcaption>
        <table v-if="asTable" class="table table-xs"><thead><tr><th>{{ t('explore.file') }}</th><th class="text-right">{{ t('explore.freq') }}</th><th class="text-right">tokens</th></tr></thead>
          <tbody><tr v-for="d in data.per_document" :key="d.filename"><td>{{ d.filename }}</td><td class="text-right">{{ d.freq }}</td><td class="text-right">{{ d.size }}</td></tr></tbody></table>
        <svg v-else :viewBox="`0 0 600 ${data.per_document.length * 14 + 4}`" class="w-full" role="img" :aria-label="t('explore.barcode')">
          <g v-for="(d, i) in data.per_document" :key="d.filename" :transform="`translate(0 ${i * 14 + 2})`">
            <title>{{ d.filename }}: {{ d.freq }}</title>
            <text x="175" y="10" text-anchor="end" class="fill-current text-[9px]">{{ d.filename.slice(0, 32) }}</text>
            <rect x="180" y="1" width="410" height="11" class="fill-base-200" />
            <rect v-for="(p, j) in d.positions" :key="j" :x="180 + p * 410" y="1" width="1.5" height="11" class="fill-primary" />
          </g>
        </svg>
      </figure>
    </template>
  </section>
</template>
