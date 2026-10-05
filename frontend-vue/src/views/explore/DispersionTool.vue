<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { api } from '../../api/index.js'
import QueryBox from './QueryBox.vue'
import HelpTip from '../../components/HelpTip.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'
import DispersionChart from '../../components/charts/DispersionChart.vue'
import { clauseOf, queryColor } from '../../utils/dispersion.js'
const props = defineProps({ corpus: String, layer: String })
const { t } = useI18n()
const router = useRouter()
const chart = ref(null)
const rowH = ref(14)      // altura de cada linha (px): menor = mais textos visíveis de uma vez
const nBands = ref(10)    // faixas de posição (5 a 20); 10 = deciles
const view = ref('heat')  // 'heat' (mapa de calor) | 'bars' (código de barras) | 'table'
const data = ref(null)
const queries = ref([])   // [{ q, color }] — cada busca acrescenta uma consulta ao mesmo mapa
let seq = 0
const error = ref(null)
const busy = ref(false)

// clicar num texto abre o leitor nele; consultas de etiqueta/classe vão destacadas
const openInReader = (filename) => {
  const params = { file: filename }
  const highlights = queries.value.map((c) => clauseOf(c.q)).filter(Boolean)
  if (highlights.length) {
    params.highlight = highlights.map((h) => h.value)
    if (highlights[0].kind === 'pos') params.color = 'upos'
  }
  const word = queries.value.find((c) => !clauseOf(c.q))
  if (word) params.q = word.q
  router.push({ path: '/leitor', query: params })
}

async function load() {
  if (!queries.value.length) { data.value = null; return }
  error.value = null
  busy.value = true
  try {
    data.value = await Promise.all(queries.value.map((c) =>
      api.explore.dispersion({ corpus: props.corpus, layer: props.layer, query: c.q })))
  } catch (err) { error.value = err.message; data.value = null }
  finally { busy.value = false }
}
function addQuery(q) {
  const v = q.trim()
  if (!v) return
  if (!queries.value.some((c) => c.q === v)) queries.value.push({ q: v, color: queryColor(seq++) })
  load()
}
function removeQuery(i) { queries.value.splice(i, 1); load() }
function clearQueries() { queries.value = []; data.value = null; error.value = null }
function setColor(i, value) { queries.value[i].color = value }
// Clicar numa etiqueta do painel liga/desliga ela como uma consulta própria (uma cor por etiqueta).
function toggleTag({ tag, key }) {
  const q = `${key}=${tag}`
  const i = queries.value.findIndex((c) => c.q === q)
  if (i >= 0) removeQuery(i); else addQuery(q)
}
const selectedTags = computed(() => queries.value.flatMap((c) => {
  const cl = clauseOf(c.q)
  return cl ? cl.value.split('|').filter(Boolean) : []
}))

// Linhas = textos (mesma ordem em todas as consultas); `cells` = o documento em cada consulta.
const rows = computed(() => {
  const base = data.value?.[0]?.per_document ?? []
  const maps = (data.value ?? []).map((r) => new Map(r.per_document.map((d) => [d.filename, d])))
  return base.map((d) => ({ filename: d.filename, size: d.size,
    cells: maps.map((m) => m.get(d.filename) ?? { positions: [], freq: 0, size: d.size }) }))
})
const colors = computed(() => queries.value.map((c) => c.color))
const tableColumns = computed(() => ['file', ...queries.value.map((c) => c.q), 'total'])
const tableRows = computed(() => rows.value.map((r) => {
  const o = { file: r.filename }
  r.cells.forEach((c, qi) => { o[queries.value[qi].q] = c.freq })
  o.total = r.cells.reduce((s, c) => s + c.freq, 0)
  return o
}))
const copyItems = computed(() => queries.value.map((c) => ({ label: c.q, params: { corpus: props.corpus, query: c.q, layer: props.layer } })))
const f3 = (v) => (v === null || v === undefined ? '—' : v.toFixed(3))
</script>
<template>
  <section class="flex flex-col gap-3">
    <QueryBox :busy="busy" :corpus="corpus" :layer="layer" tags tag-mode="layers" :selected-tags="selectedTags"
              @submit="addQuery" @tag-toggle="toggleTag" />
    <div v-if="queries.length" class="flex flex-wrap items-center gap-1 text-xs" data-testid="disp-queries">
      <span class="text-text-muted mr-1">{{ t('explore.disp_queries') }}:</span>
      <span v-for="(c, i) in queries" :key="`${c.q}-${i}`" class="badge badge-ghost gap-1 font-mono">
        <input type="color" :value="c.color" class="h-4 w-4 shrink-0 cursor-pointer rounded border border-base-300 bg-transparent p-0" :aria-label="t('explore.disp_color', { query: c.q })" :data-testid="`disp-color-${i}`" @input="setColor(i, $event.target.value)" />{{ c.q }}
        <button type="button" class="cursor-pointer text-text-muted hover:text-error" :aria-label="t('explore.disp_remove', { query: c.q })" :data-testid="`disp-remove-${i}`" @click="removeQuery(i)">×</button>
      </span>
      <button type="button" class="btn btn-xs btn-ghost" data-testid="disp-clear" @click="clearQueries">{{ t('explore.disp_clear') }}</button>
      <span class="text-text-muted">{{ t('explore.disp_queries_hint') }}</span>
    </div>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="data && data.length">
      <div class="flex flex-col gap-0.5">
        <p v-for="(r, qi) in data" :key="`dp-${qi}`" role="status" class="font-medium flex items-center gap-1.5">
          <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: queries[qi].color }" aria-hidden="true" />
          <span class="font-mono">{{ r.query }}</span>
          <span>{{ t('explore.dp', { dp: f3(r.dp), dp_norm: f3(r.dp_norm), range: r.range, documents: r.documents }) }}</span>
          <HelpTip v-if="qi === 0" topic="dispersao" />
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="join" role="group" :aria-label="t('explore.disp_view')">
          <button type="button" class="btn btn-xs join-item" :class="{ 'btn-active': view === 'heat' }" :aria-pressed="view === 'heat'" data-testid="disp-view-heat" @click="view = 'heat'">{{ t('explore.disp_heat') }}</button>
          <button type="button" class="btn btn-xs join-item" :class="{ 'btn-active': view === 'bars' }" :aria-pressed="view === 'bars'" data-testid="disp-view-bars" @click="view = 'bars'">{{ t('explore.disp_bars') }}</button>
          <button type="button" class="btn btn-xs join-item" :class="{ 'btn-active': view === 'table' }" :aria-pressed="view === 'table'" data-testid="disp-view-table" @click="view = 'table'">{{ t('explore.disp_table') }}</button>
        </div>
        <label v-if="view !== 'table'" class="flex items-center gap-2 text-xs w-fit">{{ t('explore.disp_bands') }}
          <input v-model.number="nBands" type="range" min="5" max="20" step="1" class="range range-xs range-primary w-28" data-testid="disp-bands" />
          <span class="text-text-muted tabular-nums w-6">{{ nBands }}</span></label>
        <label v-if="view !== 'table'" class="flex items-center gap-2 text-xs w-fit">{{ t('chart.row_height') }}
          <input v-model.number="rowH" type="range" min="6" max="30" step="1" class="range range-xs range-primary w-28" data-testid="disp-row-height" />
          <span class="text-text-muted tabular-nums w-8">{{ rowH }}px</span></label>
        <div class="flex items-center gap-1 ml-auto"><CopyCode analysis="dispersion" :items="copyItems" />
          <ExportMenu :name="`dispersao_${queries[0]?.q ?? ''}`" :rows="tableRows" :columns="tableColumns" :svg-root="view === 'table' ? null : chart" /></div>
      </div>
      <figure class="flex flex-col gap-1">
        <figcaption v-if="view === 'table'" class="text-sm">{{ t('explore.disp_table') }}</figcaption>
        <figcaption v-else class="text-sm">{{ view === 'heat' ? t('explore.disp_heat_caption') : t('explore.barcode') }}</figcaption>
        <table v-if="view === 'table'" class="table table-xs"><thead><tr><th>{{ t('explore.file') }}</th><th v-for="r in data" :key="`h-${r.query}`" class="text-right"><span class="inline-block w-2 h-2 rounded-full mr-1" :style="{ background: queries[data.indexOf(r)].color }" aria-hidden="true" />{{ r.query }}</th><th class="text-right">{{ t('explore.total_label') }}</th></tr></thead>
          <tbody><tr v-for="(r, i) in rows" :key="r.filename"><td>{{ r.filename }}</td><td v-for="(c, qi) in r.cells" :key="`c-${qi}`" class="text-right">{{ c.freq }}</td><td class="text-right">{{ tableRows[i].total }}</td></tr></tbody></table>
        <DispersionChart v-else ref="chart" :rows="rows" :colors="colors" :bands="nBands" :row-h="rowH" :view="view" @open="openInReader" />
      </figure>
    </template>
  </section>
</template>
