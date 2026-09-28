<script setup>
// Escrita (experimental): compara UM texto com um corpus de referência. A saída é
// descritiva/exploratória — o texto é uma unidade, não uma amostra representativa.
// Ver novodesenho/plano_escrita.md.
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useSession } from '../stores/session.js'
import { api } from '../api/index.js'
import Collapsible from '../components/Collapsible.vue'
import HelpTip from '../components/HelpTip.vue'
import ExportMenu from '../components/ExportMenu.vue'

const { t, locale } = useI18n()
const session = useSession()
const { corpora, hasProject } = storeToRefs(session)
const text = ref('')
const file = ref(null)               // {name, content_b64}
const reference = ref('')
const catalogRefs = ref([])
const f = ref({ unit: 'form', n: 2, measure: 'log_ratio', min_freq: 2, correction: 'fdr', top: 100 })
const data = ref(null)
const error = ref(null)
const busy = ref(false)
const textarea = ref(null)

const refs = computed(() => [
  ...corpora.value.map((c) => ({ value: c.name, label: `${c.name} (${t('writing.ref_project')})` })),
  ...catalogRefs.value.map((r) => ({ value: r.ref, label: `${r.name} · ${r.version} (${t('writing.ref_catalog')})` })),
])
onMounted(async () => {
  try { catalogRefs.value = (await api.compare.references()).references } catch { /* sem catálogo */ }
})
// o projeto abre de forma assíncrona: escolhe a primeira referência quando ela aparecer
watch(refs, (r) => { if (!reference.value && r.length) reference.value = r[0].value }, { immediate: true })

function b64encode(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}
async function onFile(ev) {
  const f0 = ev.target.files?.[0]
  if (!f0) return
  file.value = await new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res({ name: f0.name, content_b64: String(r.result).split(',')[1] || '' })
    r.onerror = rej
    r.readAsDataURL(f0)
  })
  text.value = ''
  error.value = null
}
function clearFile() { file.value = null }

const canRun = computed(() => (text.value.trim() || file.value) && reference.value && !busy.value)
async function run() {
  error.value = null
  data.value = null
  if (!text.value.trim() && !file.value) { error.value = t('writing.need_text'); return }
  if (!reference.value) { error.value = t('writing.need_reference'); return }
  busy.value = true
  try {
    const body = file.value
      ? { filename: file.value.name, content_b64: file.value.content_b64 }
      : { filename: 'texto_colado.txt', content_b64: b64encode(text.value) }
    data.value = await api.writing.analyze({ ...body, reference: reference.value, lang: locale.value, ...f.value })
  } catch (err) { error.value = err.message } finally { busy.value = false }
}

const fmt = (v, d = 2) => (v === null || v === undefined ? '—' : Number(v).toFixed(d))
const OVER = { '+': 'text-success', '-': 'text-error' }
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
      <div class="grid gap-4 lg:grid-cols-2">
        <!-- entrada do texto -->
        <section class="panel flex flex-col gap-2">
          <label class="label-text font-medium" for="writing-text">{{ t('writing.paste') }}</label>
          <textarea id="writing-text" ref="textarea" v-model="text" rows="10" class="textarea textarea-bordered w-full"
                    :placeholder="t('writing.placeholder')" data-testid="writing-text" @input="clearFile" />
          <div class="flex flex-wrap items-center gap-2">
            <label class="btn btn-outline btn-sm">
              {{ t('writing.upload') }}
              <input type="file" class="hidden" accept=".txt,.text,.md,.markdown,.docx,.odt,.pdf" @change="onFile" data-testid="writing-file" />
            </label>
            <span v-if="file" class="badge badge-ghost">{{ file.name }}
              <button class="ml-1" :aria-label="t('common.cancel')" @click="clearFile">×</button></span>
            <span class="field-help">{{ t('writing.formats') }}</span>
          </div>
        </section>

        <!-- referência e opções -->
        <section class="panel flex flex-col gap-3">
          <p v-if="!refs.length" class="opacity-80">{{ t('writing.ref_none') }}
            <RouterLink to="/modulos" class="link">{{ t('nav.modules') }}</RouterLink></p>
          <template v-else>
            <label class="form-control"><span class="label-text">{{ t('writing.reference') }}</span>
              <select v-model="reference" class="select select-sm" data-testid="writing-reference">
                <option v-for="r in refs" :key="r.value" :value="r.value">{{ r.label }}</option>
              </select></label>
            <p class="field-help">{{ t('writing.reference') }} — {{ t('writing.about_disp') }}</p>
          </template>
          <Collapsible :title="t('writing.advanced')">
            <div class="flex flex-wrap items-end gap-2 pt-2">
              <label class="form-control"><span class="label-text">{{ t('explore.unit') }}</span>
                <select v-model="f.unit" class="select select-sm"><option value="form">{{ t('explore.unit.form') }}</option>
                  <option value="ngram">{{ t('explore.unit.ngram') }}</option></select></label>
              <label v-if="f.unit === 'ngram'" class="form-control w-16"><span class="label-text">{{ t('explore.n') }}</span>
                <input v-model.number="f.n" type="number" min="2" max="6" class="input input-sm" /></label>
              <label class="form-control"><span class="label-text">{{ t('explore.measure') }}</span>
                <select v-model="f.measure" class="select select-sm"><option value="ll">log-likelihood</option>
                  <option value="log_ratio">log ratio</option><option value="pct_diff">%DIFF</option>
                  <option value="log_odds">log-odds</option></select></label>
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
        <button class="btn btn-primary" :disabled="!canRun" data-testid="writing-run" @click="run">{{ t('writing.run') }}</button>
        <ExportMenu v-if="data" name="escrita" :rows="data.rows" />
      </div>
      <p v-if="error" role="alert" class="alert alert-error text-sm">{{ error }}</p>

      <template v-if="data">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <span class="font-medium">{{ t('writing.text_words', { n: data.target_words }) }}</span>
          <span class="opacity-70">{{ t('writing.ref_words', { name: data.reference, n: data.reference_words }) }}</span>
          <span class="badge badge-outline badge-sm">{{ data.unit }}</span>
          <span v-for="code in data.reliability" :key="code" class="badge badge-warning badge-sm">{{ t(`writing.flag.${code}`) }}</span>
        </div>
        <div v-for="w in data.warnings" :key="w.code" role="alert" class="alert py-1 text-sm"
             :class="{ 'alert-warning': w.severity === 'warning', 'alert-error': w.severity === 'error', 'alert-info': w.severity === 'info' }">{{ w.message }}</div>

        <p v-if="!data.rows.length" class="opacity-70">{{ t('writing.no_results') }}</p>
        <div v-else class="table-scroll overflow-x-auto" data-testid="writing-table">
          <table class="table table-xs">
            <thead><tr>
              <th>{{ t('writing.col_item') }}</th><th>{{ t('writing.direction') }}</th>
              <th class="text-right">{{ t('explore.freq') }}</th><th class="text-right">{{ t('explore.per_1000') }}</th>
              <th class="text-right whitespace-nowrap">LL <HelpTip term="ll" /></th>
              <th class="text-right whitespace-nowrap">p corr.</th>
              <th class="text-right whitespace-nowrap">log ratio <HelpTip term="log_ratio" /></th>
              <th class="text-right whitespace-nowrap">%DIFF <HelpTip term="percent_diff" /></th>
              <th class="text-right whitespace-nowrap">{{ t('writing.dispersion') }}</th>
              <th>{{ t('writing.reliability') }}</th>
            </tr></thead>
            <tbody><tr v-for="r in data.rows" :key="r.item + r.direction">
              <td class="font-medium">{{ r.item }}</td>
              <td :class="OVER[r.direction]">{{ r.direction === '+' ? t('writing.over') : t('writing.under') }}</td>
              <td class="text-right tabular-nums">{{ r.freq_target }}</td>
              <td class="text-right tabular-nums">{{ fmt(r.per_1000_target, 1) }}</td>
              <td class="text-right tabular-nums">{{ fmt(r.ll, 1) }}</td>
              <td class="text-right tabular-nums" :class="{ 'font-bold': r.significant }">{{ r.p_adj.toExponential(1) }}</td>
              <td class="text-right tabular-nums">{{ fmt(r.log_ratio) }}</td>
              <td class="text-right tabular-nums">{{ r.pct_diff === null ? '—' : fmt(r.pct_diff, 0) }}</td>
              <td class="text-right tabular-nums">{{ r.range_reference_pct === null ? '—' : fmt(r.range_reference_pct, 0) + '%' }}</td>
              <td><span v-for="fl in r.flags" :key="fl" class="badge badge-ghost badge-xs mr-1">{{ t(`writing.flag.${fl}`) }}</span></td>
            </tr></tbody>
          </table>
        </div>
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
