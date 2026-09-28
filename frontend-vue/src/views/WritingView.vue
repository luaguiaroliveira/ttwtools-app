<script setup>
// Escrita (experimental): compara UM texto com um corpus de referência. Duas lentes:
//  - "Palavras (léxico)": palavras que se distanciam do padrão (com z-score descritivo);
//  - "Construções (classes)": moldes de classes gramaticais (n-gramas de POS).
// Cada resultado é clicável: exemplos no texto e no corpus, com as classes coloridas e o
// acerto destacado (como no Leitor). O estado vive em stores/writing.js para não se perder
// ao navegar (ex.: "ver no corpus" e voltar). Ver novodesenho/plano_escrita.md,
// ferramentaescrita.md.
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSession } from '../stores/session.js'
import { useWriting } from '../stores/writing.js'
import { api } from '../api/index.js'
import { ref } from 'vue'
import Collapsible from '../components/Collapsible.vue'
import HelpTip from '../components/HelpTip.vue'
import ExportMenu from '../components/ExportMenu.vue'
import DivergingBars from '../components/DivergingBars.vue'
import NavIcon from '../components/NavIcon.vue'

const { t, locale } = useI18n()
const session = useSession()
const router = useRouter()
const store = useWriting()
const { mode, text, file, reference, f, colloc, examples, error, busy } = storeToRefs(store)
const { data } = storeToRefs(store)
const { corpora, hasProject } = storeToRefs(session)
const catalogRefs = ref([])
const projectRefs = computed(() => new Set(corpora.value.map((c) => c.name)))
const refs = computed(() => [
  ...corpora.value.map((c) => ({ value: c.name, label: `${c.name} (${t('writing.ref_project')})` })),
  ...catalogRefs.value.map((r) => ({ value: r.ref, label: `${r.name} · ${r.version} (${t('writing.ref_catalog')})` })),
])
onMounted(async () => {
  store.loadPrefs()
  try { catalogRefs.value = (await api.compare.references()).references } catch { /* sem catálogo */ }
})
watch(refs, (r) => { if (!reference.value && r.length) store.reference = r[0].value }, { immediate: true })
watch(reference, () => store.savePrefs())
watch(text, () => store.savePrefs())
watch(f, () => store.savePrefs(), { deep: true })
watch(mode, () => store.savePrefs())

async function onFile(ev) {
  const f0 = ev.target.files?.[0]
  if (!f0) return
  store.file = await new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res({ name: f0.name, content_b64: String(r.result).split(',')[1] || '' })
    r.onerror = rej
    r.readAsDataURL(f0)
  })
  store.text = ''
  store.clearResults()
}
function clearFile() { store.file = null }
function onText() { clearFile() }
const canRun = computed(() => store.hasText && reference.value && !busy.value)

// marcas visuais das classes (como o Leitor)
const PALETTE = ['#1f77b4', '#d62728', '#2ca02c', '#9467bd', '#ff7f0e', '#17becf', '#8c564b', '#e377c2',
  '#7f7f7f', '#bcbd22', '#393b79', '#637939', '#8c6d31', '#843c39', '#7b4173', '#3182bd', '#e6550d']
const clsColor = (cls) => { let h = 0; for (const ch of cls || '') h = (h * 31 + ch.charCodeAt(0)) % 997; return PALETTE[h % PALETTE.length] }

// visual: distância assinada ao padrão da referência (z quando houver; senão, log ratio
// com o sinal da direção, porque a suavização do log ratio engana em textos curtos)
const chartRows = computed(() => (data.value?.rows ?? []).slice(0, 20).map((r) => ({
  label: r.item,
  value: r.z_reference ?? (r.direction === '+' ? 1 : -1) * Math.abs(r.log_ratio ?? 0),
})))
const isPatterns = computed(() => data.value?.kind === 'patterns')
const OVER = { '+': 'text-success', '-': 'text-error' }
const fmt = (v, d = 2) => (v === null || v === undefined ? '—' : Number(v).toFixed(d))

function openResult(item) { data.value?.kind === 'patterns' ? store.showExamples(item, 'pattern') : store.showCollocates(item) }
function seeInCorpus(item) {
  if (!projectRefs.value.has(reference.value)) return
  session.setCorpus(reference.value)
  router.push({ path: '/explorar/kwic', query: { q: item } })
}
</script>
<template>
  <div class="page max-w-6xl">
    <h1 class="page-title flex items-center gap-2">{{ t('writing.title') }}
      <span class="badge badge-warning badge-sm">{{ t('writing.experimental') }}</span>
      <HelpTip topic="keyness" />
    </h1>
    <p class="opacity-80 prose-read">{{ t('writing.subtitle') }}</p>

    <div v-if="!hasProject" class="alert">
      <span>{{ t('api.error.no_project') }}</span>
      <RouterLink to="/arquivo" class="btn btn-sm">{{ t('nav.corpora') }}</RouterLink>
    </div>

    <template v-else>
      <div role="tablist" :aria-label="t('writing.title')" class="tabs tabs-box w-fit">
        <button role="tab" class="tab" :class="{ 'tab-active': mode === 'words' }" :aria-selected="mode === 'words'"
                data-testid="writing-tab-words" @click="mode = 'words'">{{ t('writing.tab_words') }}</button>
        <button role="tab" class="tab" :class="{ 'tab-active': mode === 'patterns' }" :aria-selected="mode === 'patterns'"
                data-testid="writing-tab-patterns" @click="mode = 'patterns'">
          {{ t('writing.tab_patterns') }}<span class="badge badge-warning badge-xs ml-1">{{ t('writing.experimental') }}</span></button>
      </div>
      <p class="field-help">{{ mode === 'words' ? t('writing.tab_words_hint') : t('writing.tab_patterns_hint') }}</p>

      <div class="grid gap-4 lg:grid-cols-2">
        <section class="panel flex flex-col gap-2">
          <label class="label-text font-medium" for="writing-text">{{ t('writing.paste') }}</label>
          <textarea id="writing-text" v-model="text" rows="10" class="textarea textarea-bordered w-full"
                    :placeholder="t('writing.placeholder')" data-testid="writing-text" @input="onText" />
          <div class="flex flex-wrap items-center gap-2">
            <label class="btn btn-outline btn-sm">{{ t('writing.upload') }}
              <input type="file" class="hidden" accept=".txt,.text,.md,.markdown,.docx,.odt,.pdf" @change="onFile" data-testid="writing-file" /></label>
            <span v-if="file" class="badge badge-ghost">{{ file.name }}
              <button class="ml-1" :aria-label="t('common.cancel')" @click="clearFile">×</button></span>
            <span class="field-help">{{ t('writing.formats') }}</span>
          </div>
        </section>

        <section class="panel flex flex-col gap-3">
          <p v-if="!refs.length" class="opacity-80">{{ t('writing.ref_none') }}
            <RouterLink to="/modulos" class="link">{{ t('nav.modules') }}</RouterLink></p>
          <label v-else class="form-control"><span class="label-text">{{ t('writing.reference') }}</span>
            <select v-model="reference" class="select select-sm" data-testid="writing-reference">
              <option v-for="r in refs" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select></label>
          <Collapsible :title="t('writing.advanced')">
            <div class="flex flex-wrap items-end gap-2 pt-2">
              <template v-if="mode === 'words'">
                <label class="form-control"><span class="label-text">{{ t('explore.unit') }}</span>
                  <select v-model="f.unit" class="select select-sm"><option value="form">{{ t('explore.unit.form') }}</option>
                    <option value="ngram">{{ t('explore.unit.ngram') }}</option></select></label>
                <label v-if="f.unit === 'ngram'" class="form-control w-16"><span class="label-text">{{ t('explore.n') }}</span>
                  <input v-model.number="f.n" type="number" min="2" max="6" class="input input-sm" /></label>
              </template>
              <template v-else>
                <label class="form-control"><span class="label-text">{{ t('writing.field') }}</span>
                  <select v-model="f.field" class="select select-sm" data-testid="writing-field">
                    <option value="upos">{{ t('writing.field.upos') }}</option><option value="xpos">{{ t('writing.field.xpos') }}</option></select></label>
                <label class="form-control w-28"><span class="label-text">{{ t('writing.pattern_n') }}</span>
                  <input v-model.number="f.pn" type="number" min="2" max="5" class="input input-sm" data-testid="writing-pattern-n" /></label>
              </template>
              <label class="form-control"><span class="label-text">{{ t('explore.measure') }}</span>
                <select v-model="f.measure" class="select select-sm"><option value="ll">log-likelihood</option>
                  <option value="log_ratio">log ratio</option><option value="pct_diff">%DIFF</option><option value="log_odds">log-odds</option></select></label>
              <label class="form-control"><span class="label-text">{{ t('compare.correction') }}</span>
                <select v-model="f.correction" class="select select-sm"><option value="fdr">FDR (BH)</option>
                  <option value="bonferroni">Bonferroni</option><option value="none">—</option></select></label>
              <label class="form-control w-20"><span class="label-text">{{ t('explore.min_freq') }}</span>
                <input v-model.number="f.min_freq" type="number" min="1" class="input input-sm" /></label>
            </div>
          </Collapsible>
        </section>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button class="btn btn-primary" :disabled="!canRun" data-testid="writing-run" @click="store.run(locale)">{{ t('writing.run') }}</button>
        <ExportMenu v-if="data" name="escrita" :rows="data.rows" />
        <span class="field-help">{{ t('writing.examples_hint') }}</span>
      </div>
      <p v-if="error" role="alert" class="alert alert-error text-sm">{{ error }}</p>

      <template v-if="data">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <span class="font-medium">{{ t('writing.text_words', { n: data.target_words }) }}</span>
          <span class="opacity-70">{{ t('writing.ref_words', { name: data.reference, n: data.reference_words }) }}</span>
          <span class="badge badge-outline badge-sm">{{ isPatterns ? data.field : data.unit }}</span>
          <span v-for="code in data.reliability" :key="code" class="badge badge-warning badge-sm">{{ t(`writing.flag.${code}`) }}</span>
        </div>
        <div v-for="w in data.warnings" :key="w.code" role="alert" class="alert py-1 text-sm"
             :class="{ 'alert-warning': w.severity === 'warning', 'alert-error': w.severity === 'error', 'alert-info': w.severity === 'info' }">{{ w.message }}</div>

        <!-- gráfico: o que mais se distancia -->
        <div v-if="chartRows.length" class="panel">
          <DivergingBars :rows="chartRows" :title="t('writing.chart_title')" @select="openResult" />
          <p class="field-help">{{ t('writing.chart_hint') }}</p>
        </div>

        <!-- riqueza lexical (modo léxico) -->
        <div v-if="data.lexis" class="flex flex-col gap-1">
          <div class="flex flex-wrap gap-2">
            <div class="panel px-3 py-2"><span class="block text-xs opacity-70">{{ t('writing.lexis_ttr') }}</span>
              <span class="font-bold tabular-nums">{{ fmt(data.lexis.ttr, 3) }}</span></div>
            <div class="panel px-3 py-2"><span class="block text-xs opacity-70">{{ t('writing.lexis_guiraud') }}</span>
              <span class="font-bold tabular-nums">{{ fmt(data.lexis.guiraud, 2) }}</span></div>
            <div class="panel px-3 py-2"><span class="block text-xs opacity-70">{{ t('writing.lexis_mtld') }}</span>
              <span class="font-bold tabular-nums">{{ data.lexis.mtld === null ? '—' : fmt(data.lexis.mtld, 1) }}</span></div>
            <div class="panel px-3 py-2"><span class="block text-xs opacity-70">{{ t('writing.lexis_sent') }}</span>
              <span class="font-bold tabular-nums">{{ fmt(data.lexis.mean_sentence_len, 1) }}</span></div>
            <div class="panel px-3 py-2"><span class="block text-xs opacity-70">{{ t('writing.lexis_long') }}</span>
              <span class="font-bold tabular-nums">{{ fmt(data.lexis.long_pct, 0) }}%</span></div>
            <div class="panel px-3 py-2"><span class="block text-xs opacity-70">{{ t('writing.col_item') }}</span>
              <span class="font-bold tabular-nums">{{ t('writing.lexis_words', { types: data.lexis.types, words: data.lexis.words }) }}</span></div>
          </div>
          <p class="field-help">{{ t('writing.lexis_what') }}</p>
        </div>

        <p v-if="isPatterns" class="panel text-sm prose-read">{{ t('writing.patterns_what') }}</p>

        <!-- tabelas -->
        <p v-if="!data.rows.length" class="opacity-70">{{ isPatterns ? t('writing.patterns_no_results') : t('writing.no_results') }}</p>
        <div v-else class="table-scroll overflow-x-auto">
          <table class="table table-xs" :data-testid="isPatterns ? 'writing-patterns-table' : 'writing-table'">
            <thead><tr>
              <th scope="col">{{ isPatterns ? t('writing.col_pattern') : t('writing.col_item') }}</th>
              <th scope="col">{{ t('writing.direction') }}</th>
              <th scope="col" class="text-right">{{ t('explore.freq') }}</th>
              <th scope="col" class="text-right">{{ t('explore.per_1000') }}</th>
              <th scope="col" class="text-right whitespace-nowrap">LL <HelpTip term="ll" /></th>
              <th scope="col" class="text-right whitespace-nowrap">p corr.</th>
              <th scope="col" class="text-right whitespace-nowrap">log ratio <HelpTip term="log_ratio" /></th>
              <th v-if="!isPatterns" scope="col" class="text-right whitespace-nowrap">%DIFF <HelpTip term="percent_diff" /></th>
              <th scope="col" class="text-right whitespace-nowrap">{{ t('writing.col_z') }} <HelpTip term="z_score" /></th>
              <th scope="col" class="text-right whitespace-nowrap">{{ t('writing.dispersion') }}</th>
              <th scope="col">{{ t('writing.reliability') }}</th>
            </tr></thead>
            <tbody><tr v-for="r in data.rows" :key="r.item + r.direction">
              <td class="whitespace-nowrap">
                <button type="button" class="link font-medium text-left" :title="t('writing.examples_hint')"
                        :aria-label="t('writing.examples_title', { item: r.item })" @click="openResult(r.item)">{{ r.item }}</button>
                <button v-if="projectRefs.has(reference) && !isPatterns" type="button" class="btn btn-ghost btn-xs" :title="t('writing.see_in_corpus')"
                        :aria-label="`${t('writing.see_in_corpus')}: ${r.item}`" @click="seeInCorpus(r.item)">
                  <NavIcon d="M10 4a6 6 0 104.47 10.03l4.25 4.25 1.41-1.41-4.25-4.25A6 6 0 0010 4z" class="w-3.5 h-3.5" /></button>
              </td>
              <td :class="OVER[r.direction]">{{ r.direction === '+' ? t('writing.over') : t('writing.under') }}</td>
              <td class="text-right tabular-nums">{{ r.freq_target }}</td>
              <td class="text-right tabular-nums">{{ fmt(r.per_1000_target, 1) }}</td>
              <td class="text-right tabular-nums">{{ fmt(r.ll, 1) }}</td>
              <td class="text-right tabular-nums" :class="{ 'font-bold': r.significant }">{{ r.p_adj.toExponential(1) }}</td>
              <td class="text-right tabular-nums">{{ fmt(r.log_ratio) }}</td>
              <td v-if="!isPatterns" class="text-right tabular-nums">{{ r.pct_diff === null ? '—' : fmt(r.pct_diff, 0) }}</td>
              <td class="text-right tabular-nums" :title="t('writing.about_z')">{{ r.z_reference === null ? '—' : (r.z_reference > 0 ? '+' : '') + fmt(r.z_reference, 1) }}</td>
              <td class="text-right tabular-nums">{{ r.range_reference_pct === null ? '—' : fmt(r.range_reference_pct, 0) + '%' }}</td>
              <td><span v-for="fl in r.flags" :key="fl" class="badge badge-ghost badge-xs mr-1">{{ t(`writing.flag.${fl}`) }}</span></td>
            </tr></tbody>
          </table>
        </div>

        <!-- colocados da palavra clicada -->
        <section v-if="colloc" class="panel flex flex-col gap-2" data-testid="writing-collocates" aria-live="polite">
          <h3 class="section-title flex flex-wrap items-center gap-2">{{ t('writing.collocates_title', { node: colloc.node }) }}
            <span class="badge badge-outline badge-sm">{{ t('writing.node_freq', { n: colloc.node_freq_text, m: colloc.node_freq_reference }) }}</span>
            <button class="btn btn-xs btn-ghost ml-auto" :aria-label="t('common.cancel')" @click="colloc = null">×</button></h3>
          <p class="text-sm prose-read">{{ t('writing.collocates_what') }}</p>
          <p v-if="!colloc.rows.length" class="opacity-70">{{ t('writing.collocates_empty') }}</p>
          <div v-else class="overflow-x-auto">
            <table class="table table-xs">
              <thead><tr><th scope="col">{{ t('writing.col_collocate') }}</th>
                <th scope="col" class="text-right">{{ t('explore.freq') }} ({{ t('writing.text_short') }})</th>
                <th scope="col" class="text-right">{{ t('explore.freq') }} (ref.)</th>
                <th scope="col" class="text-right whitespace-nowrap">log ratio <HelpTip term="log_ratio" /></th>
                <th scope="col">{{ t('writing.reliability') }}</th></tr></thead>
              <tbody><tr v-for="c in colloc.rows" :key="c.collocate">
                <td class="font-medium">{{ c.collocate }}</td>
                <td class="text-right tabular-nums">{{ c.freq_text }}</td>
                <td class="text-right tabular-nums">{{ c.freq_reference }}</td>
                <td class="text-right tabular-nums">{{ fmt(c.log_ratio) }}</td>
                <td><span v-if="c.only_in_text" class="badge badge-warning badge-xs mr-1">{{ t('writing.colloc_flag.only_in_text') }}</span>
                    <span v-if="c.typical_reference" class="badge badge-ghost badge-xs">{{ t('writing.colloc_flag.typical_reference') }}</span></td>
              </tr></tbody>
            </table>
          </div>
        </section>

        <!-- exemplos com marcas (texto e corpus) -->
        <section v-if="examples" class="panel flex flex-col gap-2" data-testid="writing-examples" aria-live="polite">
          <h3 class="section-title flex flex-wrap items-center gap-2">{{ t('writing.examples_title', { item: examples.item }) }}
            <button class="btn btn-xs btn-ghost ml-auto" :aria-label="t('common.cancel')" @click="examples = null">×</button></h3>
          <p class="field-help">{{ t('writing.examples_hint') }}</p>
          <div class="grid gap-3 lg:grid-cols-2">
            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium opacity-80">{{ t('writing.examples_text') }}</span>
              <p v-if="!examples.text.length" class="opacity-70 text-sm">{{ t('writing.examples_none') }}</p>
              <ul v-else class="flex flex-col gap-2 text-sm leading-7">
                <li v-for="(ex, i) in examples.text" :key="i" class="bg-base-200 rounded-box p-2">
                  <span v-for="(tk, j) in ex.tokens" :key="j" class="rounded px-px"
                        :class="{ 'bg-warning/50 font-bold': tk.hit }"
                        :style="tk.cls ? { borderBottom: `3px solid ${clsColor(tk.cls)}` } : {}"
                        :title="tk.cls">{{ tk.w }} </span>
                </li>
              </ul>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium opacity-80">{{ t('writing.examples_corpus') }}</span>
              <p v-if="!examples.corpus.length" class="opacity-70 text-sm">{{ t('writing.reference_not_corpus') }}</p>
              <ul v-else class="flex flex-col gap-2 text-sm leading-7">
                <li v-for="(ex, i) in examples.corpus" :key="i" class="bg-base-200 rounded-box p-2">
                  <span class="text-xs opacity-60 block">{{ ex.filename }}</span>
                  <span v-for="(tk, j) in ex.tokens" :key="j" class="rounded px-px"
                        :class="{ 'bg-warning/50 font-bold': tk.hit }"
                        :style="tk.cls ? { borderBottom: `3px solid ${clsColor(tk.cls)}` } : {}"
                        :title="tk.cls">{{ tk.w }} </span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </template>

      <Collapsible :title="t('writing.limitations_title')" open>
        <ul class="list-disc ml-5 pt-2 flex flex-col gap-1 text-sm">
          <li>{{ t('writing.limit_single') }}</li>
          <li>{{ t('writing.limit_short') }}</li>
          <li>{{ t('writing.limit_autocorr') }}</li>
          <li>{{ t('writing.limit_sig') }}</li>
          <li>{{ t('writing.limit_disp') }}</li>
        </ul>
        <p class="text-xs opacity-70 mt-2">{{ t('writing.references') }}</p>
      </Collapsible>
    </template>
  </div>
</template>
