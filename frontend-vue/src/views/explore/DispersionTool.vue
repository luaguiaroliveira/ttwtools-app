<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { api } from '../../api/index.js'
import QueryBox from './QueryBox.vue'
import HelpTip from '../../components/HelpTip.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'
import DispersionChart from '../../components/charts/DispersionChart.vue'
import { useTagColors } from '../../stores/tagColors.js'
import { clauseOf, queryColor, tagOf } from '../../utils/dispersion.js'
const props = defineProps({ corpus: String, layer: String })
const { t } = useI18n()
const router = useRouter()
const tagColors = useTagColors()
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

const cache = new Map()   // consulta → resultado: só busca o que ainda não foi buscado
watch(() => [props.corpus, props.layer], () => cache.clear())
async function load() {
  if (!queries.value.length) { data.value = null; return }
  error.value = null
  busy.value = true
  try {
    // uma só chamada, só com as consultas que faltam (o servidor abre o projeto e decodifica a camada uma vez)
    const missing = queries.value.map((c) => c.q).filter((q) => !cache.has(q))
    if (missing.length) {
      const res = await api.explore.dispersionMulti({ corpus: props.corpus, layer: props.layer, queries: missing })
      for (const r of res.queries) cache.set(r.query, r)
    }
    data.value = queries.value.map((c) => cache.get(c.q))
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
function clearQueries() { queries.value = []; pending.value = []; data.value = null; error.value = null }
function setColor(i, value) { queries.value[i].color = value }
// Etiquetas: marcar/desmarcar é só seleção; a busca roda ao clicar em "Buscar etiquetas". É proposital:
// a dispersão de cada etiqueta varre o corpus (é lenta), diferente do Leitor, onde marcar é instantâneo.
const pending = ref([])      // etiquetas marcadas, ainda sem buscar
let pendingKey = 'pos'
function toggleTag({ tag, key }) {
  const i = pending.value.indexOf(tag)
  if (i >= 0) pending.value.splice(i, 1); else pending.value.push(tag)
  if (key) pendingKey = key
}
function applyTags() {
  const wanted = pending.value.map((tag) => `${pendingKey}=${tag}`)
  // reconstrói só as consultas de etiqueta; consultas de texto livre ficam
  queries.value = [...queries.value.filter((c) => !tagOf(c.q)), ...wanted.map((q) => ({ q, color: queryColor(seq++) }))]
  load()
}
const selectedTags = computed(() => pending.value)

// Linhas = textos (mesma ordem em todas as consultas); `cells` = o documento em cada consulta, com as
// métricas "por texto" de Gries (esperado eᵢ, observado oᵢ e desvio |oᵢ−eᵢ|) calculadas no servidor.
const rows = computed(() => {
  const base = data.value?.[0]?.per_document ?? []
  const maps = (data.value ?? []).map((r) => new Map(r.per_document.map((d) => [d.filename, d])))
  return base.map((d) => ({ filename: d.filename, size: d.size,
    cells: maps.map((m) => m.get(d.filename) ?? { positions: [], freq: 0, size: d.size, expected: 0, observed: 0, deviation: 0 }) }))
})
// Uma etiqueta = uma consulta/camada: quando a consulta é a etiqueta (sem `|`), a cor vem do
// seletor de etiquetas; consultas de texto livre mantêm a cor categórica própria.
const colors = computed(() => queries.value.map((c) => { const tg = tagOf(c.q); return tg ? tagColors.color(tg) : c.color }))
const tableColumns = computed(() => ['file', 'tokens',
  ...queries.value.flatMap((c) => [`${c.q} freq`, `${c.q} esp.`, `${c.q} obs.`, `${c.q} |o-e|`]), 'total'])
const tableRows = computed(() => rows.value.map((r) => {
  const o = { file: r.filename, tokens: r.size }
  r.cells.forEach((c, qi) => {
    const q = queries.value[qi].q
    o[`${q} freq`] = c.freq
    o[`${q} esp.`] = c.expected
    o[`${q} obs.`] = c.observed
    o[`${q} |o-e|`] = c.deviation
  })
  o.total = r.cells.reduce((s, c) => s + c.freq, 0)
  return o
}))
const copyItems = computed(() => queries.value.map((c) => ({ label: c.q, params: { corpus: props.corpus, query: c.q, layer: props.layer } })))
const f3 = (v) => (v === null || v === undefined ? '—' : v.toFixed(3))
const f4 = (v) => (v === null || v === undefined ? '—' : v.toFixed(4))
</script>
<template>
  <section class="flex flex-col gap-3 h-full min-h-0">
    <QueryBox class="flex-1 min-h-0" fit :busy="busy" :corpus="corpus" :layer="layer" tags tag-mode="layers" :selected-tags="selectedTags"
              @submit="addQuery" @tag-toggle="toggleTag">
    <template #results>
    <div class="flex flex-col gap-3 shrink-0">
    <div v-if="queries.length" class="flex flex-wrap items-center gap-1 text-xs" data-testid="disp-queries">
      <span class="text-text-muted mr-1">{{ t('explore.disp_queries') }}:</span>
      <span v-for="(c, i) in queries" :key="`${c.q}-${i}`" class="badge badge-ghost gap-1 font-mono">
        <input v-if="!tagOf(c.q)" type="color" :value="c.color" class="h-4 w-4 shrink-0 cursor-pointer rounded border border-base-300 bg-transparent p-0" :aria-label="t('explore.disp_color', { query: c.q })" :data-testid="`disp-color-${i}`" @input="setColor(i, $event.target.value)" />
        <span v-else class="inline-block w-3.5 h-3.5 shrink-0 rounded-full border border-base-300" :style="{ background: colors[i] }" :title="t('reader.color')" :data-testid="`disp-dot-${i}`" />{{ c.q }}
        <button type="button" class="cursor-pointer text-text-muted hover:text-error" :aria-label="t('explore.disp_remove', { query: c.q })" :data-testid="`disp-remove-${i}`" @click="removeQuery(i)">×</button>
      </span>
      <button type="button" class="btn btn-xs btn-ghost" data-testid="disp-clear" @click="clearQueries">{{ t('explore.disp_clear') }}</button>
      <span class="text-text-muted">{{ t('explore.disp_queries_hint') }}</span>
    </div>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="data && data.length">
      <div class="flex flex-wrap items-center gap-2">
        <div class="join" role="group" :aria-label="t('explore.disp_view')">
          <button type="button" class="btn btn-xs join-item" :class="{ 'btn-active': view === 'heat' }" :aria-pressed="view === 'heat'" data-testid="disp-view-heat" @click="view = 'heat'">{{ t('explore.disp_heat') }}</button>
          <button type="button" class="btn btn-xs join-item" :class="{ 'btn-active': view === 'bars' }" :aria-pressed="view === 'bars'" data-testid="disp-view-bars" @click="view = 'bars'">{{ t('explore.disp_bars') }}</button>
          <button type="button" class="btn btn-xs join-item" :class="{ 'btn-active': view === 'dp' }" :aria-pressed="view === 'dp'" data-testid="disp-view-dp" @click="view = 'dp'">{{ t('explore.disp_dp') }}</button>
          <button type="button" class="btn btn-xs join-item" :class="{ 'btn-active': view === 'table' }" :aria-pressed="view === 'table'" data-testid="disp-view-table" @click="view = 'table'">{{ t('explore.disp_table') }}</button>
        </div>
        <label v-if="view === 'heat' || view === 'bars'" class="flex items-center gap-2 text-xs w-fit">{{ t('explore.disp_bands') }}
          <input v-model.number="nBands" type="range" min="5" max="20" step="1" class="range range-xs range-primary w-28" data-testid="disp-bands" />
          <span class="text-text-muted tabular-nums w-6">{{ nBands }}</span></label>
        <label v-if="view === 'heat' || view === 'bars'" class="flex items-center gap-2 text-xs w-fit">{{ t('chart.row_height') }}
          <input v-model.number="rowH" type="range" min="6" max="30" step="1" class="range range-xs range-primary w-28" data-testid="disp-row-height" />
          <span class="text-text-muted tabular-nums w-8">{{ rowH }}px</span></label>
        <div class="flex items-center gap-1 ml-auto"><CopyCode analysis="dispersion" :items="copyItems" />
          <ExportMenu :name="`dispersao_${queries[0]?.q ?? ''}`" :rows="tableRows" :columns="tableColumns" :canvas-root="view === 'heat' || view === 'bars' ? chart : null" /></div>
      </div>
      </template>
    </div>
    <figure v-if="data && data.length" class="flex flex-col gap-1 flex-1 min-h-0">
        <figcaption v-if="view === 'table'" class="text-sm">{{ t('explore.disp_table') }}</figcaption>
        <figcaption v-else-if="view === 'dp'" class="text-sm">{{ t('explore.disp_report') }}</figcaption>
        <figcaption v-else class="text-sm">{{ view === 'heat' ? t('explore.disp_heat_caption') : t('explore.barcode') }}</figcaption>
        <div v-if="view === 'table'" class="ttw-scroll ttw-scroll-fit flex-1 min-h-0">
          <table class="table table-xs" data-testid="disp-table"><thead>
            <tr>
              <th rowspan="2" class="text-left align-bottom">{{ t('explore.file') }}</th>
              <th rowspan="2" class="text-right align-bottom">{{ t('explore.tokens') }}</th>
              <th v-for="(r, qi) in data" :key="`h-${r.query}`" colspan="4" class="text-center border-l">
                <span class="inline-block w-2 h-2 rounded-full mr-1" :style="{ background: colors[qi] }" aria-hidden="true" />{{ r.query }}</th>
              <th rowspan="2" class="text-right align-bottom">{{ t('explore.total_label') }}</th>
            </tr>
            <tr>
              <template v-for="(r, qi) in data" :key="`m-${r.query}`">
                <th class="text-right border-l">{{ t('explore.disp_freq') }}</th>
                <th class="text-right" :title="t('explore.disp_expected')">{{ t('explore.disp_expected') }}</th>
                <th class="text-right" :title="t('explore.disp_observed')">{{ t('explore.disp_observed') }}</th>
                <th class="text-right" :title="t('explore.disp_deviation')">{{ t('explore.disp_deviation') }}</th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in rows" :key="row.filename">
              <td>{{ row.filename }}</td>
              <td class="text-right tabular-nums">{{ row.size }}</td>
              <template v-for="(c, qi) in row.cells" :key="`c-${qi}`">
                <td class="text-right border-l">{{ c.freq }}</td>
                <td class="text-right tabular-nums">{{ f4(c.expected) }}</td>
                <td class="text-right tabular-nums">{{ f4(c.observed) }}</td>
                <td class="text-right tabular-nums">{{ f4(c.deviation) }}</td>
              </template>
              <td class="text-right">{{ tableRows[i].total }}</td>
            </tr>
          </tbody></table>
        </div>
        <div v-else-if="view === 'dp'" class="ttw-scroll ttw-scroll-fit flex-1 min-h-0">
          <table class="table table-xs" data-testid="disp-report" :aria-label="t('explore.disp_report')">
            <thead><tr>
              <th class="text-left">{{ t('explore.query') }}</th>
              <th class="text-right whitespace-nowrap">{{ t('explore.disp_dp') }} <HelpTip topic="dispersao" /></th>
              <th class="text-right whitespace-nowrap">{{ t('explore.disp_dp_norm') }}</th>
              <th class="text-right whitespace-nowrap">{{ t('explore.disp_range') }}</th>
            </tr></thead>
            <tbody>
              <tr v-for="(r, qi) in data" :key="`dp-${qi}`">
                <td class="text-left whitespace-nowrap max-w-[16rem] truncate" :title="r.query"><span class="inline-block w-2.5 h-2.5 rounded-full mr-1 align-middle" :style="{ background: colors[qi] }" aria-hidden="true" /><span class="font-mono">{{ r.query }}</span></td>
                <td class="text-right tabular-nums">{{ f3(r.dp) }}</td>
                <td class="text-right tabular-nums">{{ f3(r.dp_norm) }}</td>
                <td class="text-right tabular-nums">{{ r.range }}/{{ r.documents }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <DispersionChart v-else ref="chart" :rows="rows" :colors="colors" :bands="nBands" :row-h="rowH" :view="view" fit @open="openInReader" />
      </figure>
    </template>
    <template #tag-actions>
      <button type="button" class="btn btn-sm btn-primary w-full" :disabled="busy" data-testid="disp-tag-search" @click="applyTags">
        <span v-if="busy" class="loading loading-spinner loading-xs" aria-hidden="true" />{{ t('explore.tags_search') }}
      </button>
    </template>
    </QueryBox>
  </section>
</template>
