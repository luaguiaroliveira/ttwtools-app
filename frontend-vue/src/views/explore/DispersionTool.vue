<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { api } from '../../api/index.js'
import QueryBox from './QueryBox.vue'
import HelpTip from '../../components/HelpTip.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'
import { distinctLabels } from '../../utils/labels.js'
import { bandAlpha, bandCounts, clauseOf, combinedDensity, queryColor } from '../../utils/dispersion.js'
const fig = ref(null)
const props = defineProps({ corpus: String, layer: String })
const { t } = useI18n()
const router = useRouter()
const rowH = ref(14)      // altura de cada linha (px): menor = mais textos visíveis de uma vez
const nBands = ref(10)    // faixas de posição (5 a 20); 10 = deciles
const step = computed(() => 100 / nBands.value)
const view = ref('heat')  // 'heat' (mapa de calor) | 'bars' (código de barras) | 'table'
const fontPx = computed(() => Math.max(8, Math.min(12, rowH.value - 3)))
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

// Linhas = textos (mesma ordem em todas as consultas); `cells` = o documento em cada consulta.
const rows = computed(() => {
  const base = data.value?.[0]?.per_document ?? []
  const maps = data.value.map((r) => new Map(r.per_document.map((d) => [d.filename, d])))
  return base.map((d) => ({ filename: d.filename, size: d.size,
    cells: maps.map((m) => m.get(d.filename) ?? { positions: [], freq: 0, size: d.size }) }))
})
const labels = computed(() => distinctLabels(rows.value.map((r) => r.filename), 26))
// Fundo: densidade por 1000 tokens somada entre as consultas.
const heat = computed(() => combinedDensity(
  data.value.map((_, qi) => rows.value.map((r) => bandCounts(r.cells[qi].positions, nBands.value))),
  rows.value.map((r) => r.size), nBands.value))
// Traços: cada ocorrência na cor da sua consulta.
const ticksOf = (i) => rows.value[i].cells.flatMap((c, qi) =>
  c.positions.map((p) => ({ p, color: queries.value[qi].color }))).sort((a, b) => a.p - b.p)
const totalFreq = (i) => rows.value[i].cells.reduce((s, c) => s + c.freq, 0)
const tableColumns = computed(() => ['file', ...queries.value.map((c) => c.q), 'total'])
const tableRows = computed(() => rows.value.map((r) => {
  const o = { file: r.filename }
  r.cells.forEach((c, qi) => { o[queries.value[qi].q] = c.freq })
  o.total = r.cells.reduce((s, c) => s + c.freq, 0)
  return o
}))
const copyItems = computed(() => queries.value.map((c) => ({ label: c.q, params: { corpus: props.corpus, query: c.q, layer: props.layer } })))
const ROW = 13
const f3 = (v) => (v === null || v === undefined ? '—' : v.toFixed(3))
</script>
<template>
  <section class="flex flex-col gap-3">
    <QueryBox :busy="busy" :corpus="corpus" :layer="layer" tags @submit="addQuery" />
    <div v-if="queries.length" class="flex flex-wrap items-center gap-1 text-xs" data-testid="disp-queries">
      <span class="text-text-muted mr-1">{{ t('explore.disp_queries') }}:</span>
      <span v-for="(c, i) in queries" :key="`${c.q}-${i}`" class="badge badge-ghost gap-1 font-mono">
        <span class="inline-block w-2.5 h-2.5 rounded-full border border-base-300" :style="{ background: c.color }" aria-hidden="true" />{{ c.q }}
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
          <ExportMenu :name="`dispersao_${queries[0]?.q ?? ''}`" :rows="tableRows" :columns="tableColumns" :svg-root="view === 'table' ? null : fig" /></div>
      </div>
      <figure ref="fig" class="flex flex-col gap-1">
        <figcaption v-if="view === 'table'" class="text-sm">{{ t('explore.disp_table') }}</figcaption>
        <figcaption v-else class="text-sm">{{ view === 'heat' ? t('explore.disp_heat_caption') : t('explore.barcode') }}</figcaption>
        <table v-if="view === 'table'" class="table table-xs"><thead><tr><th>{{ t('explore.file') }}</th><th v-for="r in data" :key="`h-${r.query}`" class="text-right"><span class="inline-block w-2 h-2 rounded-full mr-1" :style="{ background: queries[data.indexOf(r)].color }" aria-hidden="true" />{{ r.query }}</th><th class="text-right">{{ t('explore.total_label') }}</th></tr></thead>
          <tbody><tr v-for="(r, i) in rows" :key="r.filename"><td>{{ r.filename }}</td><td v-for="(c, qi) in r.cells" :key="`c-${qi}`" class="text-right">{{ c.freq }}</td><td class="text-right">{{ totalFreq(i) }}</td></tr></tbody></table>
        <ul v-else class="ttw-scroll rounded-box border border-base-300 p-1" data-testid="disp-rows">
          <li v-for="(d, i) in rows" :key="d.filename">
            <button type="button" class="disp-row" :style="{ height: `${rowH}px`, fontSize: `${fontPx}px` }" :title="`${d.filename}: ${totalFreq(i)}`"
                    :aria-label="`${t('explore.open_text')}: ${d.filename} (${totalFreq(i)})`" @click="openInReader(d.filename)">
              <span class="disp-label">{{ labels[i] }}</span>
              <span class="disp-strip">
                <template v-if="view === 'heat'">
                  <i v-for="(v, b) in heat.rows[i]" v-show="v > 0" :key="`b-${b}`" class="disp-band"
                     :style="{ left: `${b * step}%`, width: `${step}%`, opacity: bandAlpha(v, heat.max) }" />
                </template>
                <i v-for="(tk, k) in ticksOf(i)" :key="`t-${k}`" class="disp-tick" :style="{ left: `${tk.p * 100}%`, background: tk.color }" />
              </span>
              <span class="disp-n">{{ totalFreq(i) }}</span>
            </button>
          </li>
        </ul>
        <!-- cópia em SVG só para exportar (SVG/PNG); fora da tela e escondida dos leitores de tela -->
        <div v-if="view !== 'table'" class="absolute w-0 h-0 overflow-hidden invisible" aria-hidden="true">
          <svg :viewBox="`0 0 640 ${rows.length * ROW + 4}`" width="640" :height="rows.length * ROW + 4">
            <g v-for="(d, i) in rows" :key="d.filename" :transform="`translate(0 ${i * ROW + 2})`">
              <text x="200" :y="ROW - 4" text-anchor="end" class="fill-current text-[10px]">{{ labels[i] }}</text>
              <rect x="208" y="1" width="424" :height="ROW - 3" class="fill-base-200" />
              <template v-if="view === 'heat'">
                <rect v-for="(v, b) in heat.rows[i]" v-show="v > 0" :key="`sb-${b}`" :x="208 + b * (424 / nBands)" y="1" :width="424 / nBands" :height="ROW - 3"
                      class="fill-current" :opacity="bandAlpha(v, heat.max)" />
              </template>
              <rect v-for="(tk, k) in ticksOf(i)" :key="`st-${k}`" :x="208 + tk.p * 424" y="1" width="1.500" :height="ROW - 3" :fill="tk.color" />
            </g>
          </svg>
        </div>
      </figure>
    </template>
  </section>
</template>
