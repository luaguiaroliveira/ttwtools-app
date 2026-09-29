<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../../api/index.js'
import QueryBox from './QueryBox.vue'
import HelpTip from '../../components/HelpTip.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'

const props = defineProps({ corpus: String, layer: String })
const { t } = useI18n()
const f = ref({ left: 5, right: 5, unit: 'form', min_freq: 2, sort: 'll' })
const data = ref(null)
const error = ref(null)
const busy = ref(false)
async function run(node) {
  error.value = null
  busy.value = true
  try { data.value = await api.explore.collocates({ corpus: props.corpus, layer: props.layer, node, ...f.value }) }
  catch (err) { error.value = err.message }
  finally { busy.value = false }
}
const fx = (v, d = 2) => (v === null || v === undefined ? '—' : v.toFixed(d))
const sortBy = ref('ll')
const dir = ref(-1)
const sortedRows = computed(() => {
  const rows = [...(data.value?.rows ?? [])]
  rows.sort((a, b) => {
    const x = a[sortBy.value], y = b[sortBy.value]
    const c = typeof x === 'string' ? String(x).localeCompare(String(y)) : (x ?? 0) - (y ?? 0)
    return dir.value * c
  })
  return rows
})
const ariaSort = (k) => (sortBy.value === k ? (dir.value < 0 ? 'descending' : 'ascending') : 'none')
function setSort(k) {
  if (sortBy.value === k) dir.value *= -1
  else { sortBy.value = k; dir.value = k === 'collocate' ? 1 : -1 }
}
</script>
<template>
  <section class="flex flex-col gap-3">
    <QueryBox :label="t('explore.node')" :busy="busy" @submit="run">
      <label class="ttw-field"><span class="ttw-label">{{ t('explore.window') }}</span>
        <span class="flex gap-1"><input v-model.number="f.left" type="number" min="0" max="20" class="input input-sm w-16" :aria-label="t('explore.left')" />
          <input v-model.number="f.right" type="number" min="0" max="20" class="input input-sm w-16" :aria-label="t('explore.right')" /></span></label>
      <label class="ttw-field"><span class="ttw-label">{{ t('explore.unit') }}</span>
        <select v-model="f.unit" class="select select-sm"><option v-for="u in ['form', 'lemma', 'word_pos', 'pos']" :key="u" :value="u">{{ t(`explore.unit.${u}`) }}</option></select></label>
      <label class="ttw-field w-24"><span class="ttw-label">{{ t('explore.min_freq') }}</span>
        <input v-model.number="f.min_freq" type="number" min="1" class="input input-sm" /></label>
      <label class="ttw-field"><span class="ttw-label">{{ t('explore.measure') }}</span>
        <select v-model="f.sort" class="select select-sm"><option value="ll">log-likelihood</option><option value="mi">MI</option><option value="t">T-score</option><option value="freq">freq</option></select></label>
    </QueryBox>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <div v-if="data" class="overflow-x-auto">
      <p class="text-sm mb-1 flex items-center gap-1">{{ data.node }} · {{ data.node_freq }}× <HelpTip term="collocate" />
        <span class="ml-auto flex gap-1"><CopyCode analysis="collocates" :params="{ corpus, node: data.node, layer, ...f }" />
          <ExportMenu :name="`colocados_${data.node}`" :rows="data.rows" /></span></p>
      <table class="table table-xs"><thead><tr>
        <th :aria-sort="ariaSort('collocate')"><button type="button" class="inline-flex items-center gap-1" @click="setSort('collocate')">{{ t('explore.collocate') }}<span aria-hidden="true">{{ sortBy === 'collocate' ? (dir < 0 ? '▾' : '▴') : '↕' }}</span></button></th>
        <th class="text-right" :aria-sort="ariaSort('freq')"><button type="button" class="inline-flex items-center gap-1" @click="setSort('freq')">{{ t('explore.freq') }}<span aria-hidden="true">{{ sortBy === 'freq' ? (dir < 0 ? '▾' : '▴') : '↕' }}</span></button></th>
        <th class="text-right whitespace-nowrap" :aria-sort="ariaSort('ll')"><button type="button" class="inline-flex items-center gap-1" @click="setSort('ll')"><HelpTip term="ll">LL</HelpTip> <span aria-hidden="true">{{ sortBy === 'll' ? (dir < 0 ? '▾' : '▴') : '↕' }}</span></button></th>
        <th class="text-right whitespace-nowrap" :aria-sort="ariaSort('mi')"><button type="button" class="inline-flex items-center gap-1" @click="setSort('mi')"><HelpTip term="mi">MI</HelpTip> <span aria-hidden="true">{{ sortBy === 'mi' ? (dir < 0 ? '▾' : '▴') : '↕' }}</span></button></th>
        <th class="text-right whitespace-nowrap" :aria-sort="ariaSort('t_score')"><button type="button" class="inline-flex items-center gap-1" @click="setSort('t_score')"><HelpTip term="t_score">T</HelpTip> <span aria-hidden="true">{{ sortBy === 't_score' ? (dir < 0 ? '▾' : '▴') : '↕' }}</span></button></th>
        <th>{{ t('explore.position') }}</th></tr></thead>
        <tbody><tr v-for="r in sortedRows" :key="r.collocate"><td>{{ r.collocate }}</td><td class="text-right tabular-nums">{{ r.freq }}</td>
          <td class="text-right tabular-nums">{{ fx(r.ll) }}</td><td class="text-right tabular-nums">{{ fx(r.mi) }}</td>
          <td class="text-right tabular-nums">{{ fx(r.t_score) }}</td><td>{{ r.position }}</td></tr></tbody></table>
    </div>
  </section>
</template>
