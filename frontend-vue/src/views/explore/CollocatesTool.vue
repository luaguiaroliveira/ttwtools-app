<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../../api/index.js'
import QueryBox from './QueryBox.vue'
import HelpTip from '../../components/HelpTip.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'

const props = defineProps({ corpus: String, layer: String })
const { t } = useI18n()
const router = useRouter()
// abre o texto do exemplo no Leitor, com o nó marcado (mesma rota do KWIC)
const openInReader = (l) => router.push({ path: '/leitor', query: { file: l.filename, pos: l.start_char, end: l.end_char } })
const f = ref({ left: 5, right: 5, unit: 'form', min_freq: 2, sort: 'll' })
const data = ref(null)
const error = ref(null)
const busy = ref(false)
const lastRun = ref(null)                     // parâmetros da busca que gerou a tabela (os exemplos usam os mesmos)
const chosen = ref(null)                      // colocado cujos exemplos estão abertos
const chosenNode = ref('')                    // forma do nó mostrada na linha escolhida
const ex = ref(null)
const exBusy = ref(false)
const PAGE = 8
async function run(node) {
  error.value = null
  busy.value = true
  closeExamples()
  try {
    data.value = await api.explore.collocates({ corpus: props.corpus, layer: props.layer, node, ...f.value })
    lastRun.value = { corpus: props.corpus, layer: props.layer, node, left: f.value.left, right: f.value.right, unit: f.value.unit }
  } catch (err) { error.value = err.message }
  finally { busy.value = false }
}
async function openExamples(collocate, offset = 0, node = chosenNode.value) {
  if (!lastRun.value) return
  chosen.value = collocate
  chosenNode.value = node
  exBusy.value = true
  try { ex.value = await api.explore.collocateExamples({ ...lastRun.value, collocate, limit: PAGE, offset }) }
  catch (err) { error.value = err.message }
  finally { exBusy.value = false }
}
function closeExamples() { chosen.value = null; ex.value = null }
const exFrom = computed(() => (ex.value?.total ? ex.value.offset + 1 : 0))
const exTo = computed(() => Math.min(ex.value?.total ?? 0, (ex.value?.offset ?? 0) + PAGE))
// com curingas ou regex no nó, mostra a forma real mais frequente com aquele colocado (ex.: making decisions), não a consulta
const nodeOf = (r) => r.node_form || data.value.node
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
    <section v-if="chosen !== null" class="bg-base-200 rounded-box p-3 flex flex-col gap-2" aria-live="polite" data-testid="coll-examples">
      <div class="flex flex-wrap items-center gap-2">
        <h3 class="font-bold">{{ t('explore.examples_title') }}
          <span class="font-normal">{{ chosen }} <span class="text-primary font-semibold">{{ chosenNode || data.node }}</span></span></h3>
        <span v-if="ex" class="text-sm text-text-muted tabular-nums" data-testid="coll-examples-range">{{ t('explore.examples_range', { from: exFrom, to: exTo, total: ex.total }) }}</span>
        <span class="ml-auto flex gap-1">
          <button type="button" class="btn btn-sm" :disabled="!ex || ex.offset === 0 || exBusy" data-testid="coll-prev" @click="openExamples(chosen, Math.max(0, ex.offset - PAGE))">‹ {{ t('explore.prev') }}</button>
          <button type="button" class="btn btn-sm" :disabled="!ex || ex.offset + PAGE >= ex.total || exBusy" data-testid="coll-next" @click="openExamples(chosen, ex.offset + PAGE)">{{ t('explore.next') }} ›</button>
          <button type="button" class="btn btn-sm btn-ghost" @click="closeExamples">{{ t('explore.close') }}</button></span>
      </div>
      <p v-if="ex?.capped" class="text-xs text-warning">{{ t('explore.examples_capped') }}</p>
      <ul v-if="ex" class="flex flex-col gap-1 text-sm">
        <li v-for="l in ex.lines" :key="`${l.filename}:${l.idx}`" class="flex flex-wrap items-baseline gap-x-1 cursor-pointer rounded px-1 hover:bg-base-300" tabindex="0"
            role="link" :title="t('explore.open_in_reader', { file: l.filename })" :aria-label="t('explore.open_in_reader', { file: l.filename })" data-testid="coll-example"
            @click="openInReader(l)" @keydown.enter="openInReader(l)">
          <span v-for="(c, i) in l.left" :key="`l${i}`" :class="c.hit ? 'rounded bg-base-300 px-1 font-medium underline' : ''">{{ c.w }}</span>
          <span class="text-primary font-bold">{{ l.node.map((c) => c.w).join(' ') }}</span>
          <span v-for="(c, i) in l.right" :key="`r${i}`" :class="c.hit ? 'rounded bg-base-300 px-1 font-medium underline' : ''">{{ c.w }}</span>
          <span class="ml-auto text-xs text-text-muted truncate max-w-48 underline decoration-dotted">{{ l.filename }} ↗</span>
        </li>
      </ul>
      <span v-if="exBusy" class="loading loading-dots loading-sm" aria-hidden="true" />
    </section>
    <div v-if="data" class="ttw-scroll">
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
        <tbody><tr v-for="r in sortedRows" :key="r.collocate" class="hover cursor-pointer" :class="{ 'bg-primary/10': chosen === r.collocate }" tabindex="0"
          :aria-label="t('explore.examples_open', { collocate: r.collocate })" data-testid="coll-row" @click="openExamples(r.collocate, 0, nodeOf(r))" @keydown.enter="openExamples(r.collocate, 0, nodeOf(r))">
          <td class="whitespace-nowrap"><template v-if="r.position === 'R'"><span class="text-primary font-semibold">{{ nodeOf(r) }}</span> {{ r.collocate }}</template>
            <template v-else-if="r.position === 'L'">{{ r.collocate }} <span class="text-primary font-semibold">{{ nodeOf(r) }}</span></template>
            <template v-else>{{ r.collocate }} <span class="text-primary font-semibold">{{ nodeOf(r) }}</span> {{ r.collocate }}</template>
            <span v-if="r.node_forms > 1" class="badge badge-ghost badge-xs ml-1" :title="t('explore.node_forms', { n: r.node_forms })">+{{ r.node_forms - 1 }}</span></td><td class="text-right tabular-nums">{{ r.freq }}</td>
          <td class="text-right tabular-nums">{{ fx(r.ll) }}</td><td class="text-right tabular-nums">{{ fx(r.mi) }}</td>
          <td class="text-right tabular-nums">{{ fx(r.t_score) }}</td><td>{{ r.position }}</td></tr></tbody></table>
      <p class="text-xs text-text-muted mt-1">{{ t('explore.examples_hint') }}</p>
    </div>
  </section>
</template>
