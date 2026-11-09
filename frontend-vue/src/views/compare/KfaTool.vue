<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { api } from '../../api/index.js'
import { useSession } from '../../stores/session.js'
import { useCompare } from '../../stores/compare.js'
import { galleryMemory, kfaMemory } from '../../utils/memory.js'
import ChartGallery from '../../components/ChartGallery.vue'
import SplitPane from '../../components/SplitPane.vue'
import HelpTip from '../../components/HelpTip.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'
import BusyModal from '../../components/BusyModal.vue'
import FeatureSelect from '../../components/FeatureSelect.vue'
import TagsetInfoButton from '../../components/TagsetInfoButton.vue'
const props = defineProps({ corpus: String })
const mem = kfaMemory.value?.corpus === props.corpus ? kfaMemory.value : null     // volta do Leitor: restaura
const lastParams = ref(mem?.lastParams ?? null)
const { t } = useI18n()
const { activeCorpus, layer } = storeToRefs(useSession())
const cmp = useCompare()
const f = ref(mem?.f ?? { feature: '', min_effect: 0.2 })
const data = ref(mem?.data ?? null)
const error = ref(null)
const detail = ref(mem?.detail ?? null)
const busy = ref(false)
const job = ref(null)          // andamento da tarefa (etapa e documentos contados) para a barra
let jobId = null
const layers = computed(() => [...new Set((activeCorpus.value?.layers ?? []).map((l) => l.tool))])
// a camada é a do topo da tela (seletor global); "automática" cai na primeira camada do corpus
const effectiveLayer = computed(() => (layer.value && layers.value.includes(layer.value) ? layer.value : layers.value[0] ?? ''))
const layerFields = computed(() => activeCorpus.value?.layers?.find((l) => l.tool === effectiveLayer.value)?.fields ?? [])
const keptFor = ref(mem?.keptFor ?? '')                                    // camada para a qual o usuário escolheu manter o resultado antigo
const setupSig = computed(() => JSON.stringify([cmp.sides(props.corpus).map((x) => [x.corpus, x.where]), cmp.metric]))
const stale = computed(() => Boolean(data.value && lastParams.value && (lastParams.value.setupSig !== setupSig.value || lastParams.value.layer !== effectiveLayer.value || (lastParams.value.requestedFeature ?? '') !== (layerFields.value.includes('upos') && layerFields.value.includes('xpos') ? f.value.feature : '')) && keptFor.value !== `${effectiveLayer.value}/${f.value.feature}/${setupSig.value}`))
const side = (n) => cmp.sides(props.corpus)[n - 1]
async function run() {
  error.value = null
  keptFor.value = ''
  detail.value = null
  const s1 = side(1), s2 = side(2)
  lastParams.value = { corpus: s1.corpus, corpus2: s2.corpus, layer: effectiveLayer.value, feature: f.value.feature || undefined, requestedFeature: f.value.feature, metric: cmp.metric, setupSig: setupSig.value, min_effect: f.value.min_effect,
    where: s1.where, where2: s2.where, label1: s1.label, label2: s2.label }
  busy.value = true
  try {
    data.value = await api.compare.kfa({ corpus1: s1.corpus, corpus2: s2.corpus, where1: s1.where, where2: s2.where,
      layer: effectiveLayer.value, feature: f.value.feature || undefined, metric: cmp.metric, min_effect: 0 }, { onJob: (j) => { job.value = j; jobId = j.id } })
    openAnalysis()
  } catch (err) { if (err?.name !== 'AbortError') error.value = err.message } finally { busy.value = false; job.value = null; jobId = null }
}
const maxD = computed(() => {
  const m = Math.max(0, ...(data.value?.rows ?? []).map((r) => Math.abs(r.Effect_Size)))
  // O máximo do controle é o maior |d| do resultado. Arredondar para cima fazia o extremo do
  // slider esconder até o atributo mais forte (ex.: máximo real 1,422 e slider em 1,5).
  return m >= 0.01 ? Math.floor(m * 100) / 100 : 0.01
})
watch([maxD, () => f.value.min_effect], ([m, v]) => {
  if (Number(v) > m) f.value.min_effect = m       // valor antigo/typed acima do máximo: limita ao maior |d|
})
watch([data, lastParams, f, detail, keptFor], () => { kfaMemory.value = { corpus: props.corpus, data: data.value, lastParams: lastParams.value, f: f.value, detail: detail.value, keptFor: keptFor.value } }, { deep: false })
watch(f, () => { if (kfaMemory.value) kfaMemory.value.f = f.value }, { deep: true })
const minD = computed(() => Number(f.value.min_effect) || 0)
// o |d| mínimo só filtra o que já foi calculado (a tabela completa vem do servidor): mudar o valor não recalcula nada
const shown = computed(() => (data.value ? { ...data.value, rows: data.value.rows.filter((r) => Math.abs(r.Effect_Size) >= minD.value) } : null))
const copyParams = computed(() => (lastParams.value ? { ...lastParams.value, min_effect: minD.value } : null))
const gallerySides = computed(() => (lastParams.value ? [{ corpus: lastParams.value.corpus, where: lastParams.value.where, label: lastParams.value.label1 }, { corpus: lastParams.value.corpus2, where: lastParams.value.where2, label: lastParams.value.label2 }] : cmp.sides(props.corpus)))
// Linha de resumo do resultado (mostrada na configuração e na tela de análise)
const resultLine = computed(() => (data.value
  ? `${t('kfa.results', { n: shown.value.rows.length, n1: data.value.n1, n2: data.value.n2 })} · ${t('kfa.result_layer', { layer: lastParams.value?.layer })} · ${t('kfa.result_feature', { feature: data.value.feature })}`
  : ''))

// Tela de análise isolada, em rota própria (`/comparar?tool=kfa&view=analise`): o resultado
// calculado fica em `kfaMemory`, então abrir a análise e voltar não recalcula nada.
const route = useRoute()
const router = useRouter()
const analyzing = computed(() => route.query.view === 'analise')
function openAnalysis() { if (data.value) router.push({ path: '/comparar', query: { ...route.query, tool: 'kfa', view: 'analise' } }) }
function backToSetup() { const q = { ...route.query }; delete q.view; router.push({ path: '/comparar', query: q }) }

// Gráfico à esquerda + tabela à direita: a divisória arrastável e os botões de ocultar ficam
// guardados em `galleryMemory`, então voltar do Leitor restaura o arranjo escolhido.
const showChart = ref(galleryMemory.showChart ?? true)
const showTable = ref(galleryMemory.showTable ?? true)
const split = ref(galleryMemory.split ?? 50)
// Ordenação única (gráfico e tabela se afetam): a chave é a coluna; a direção vale para os dois.
const sortKey = ref(galleryMemory.sortKey ?? 'Effect_Size')
const sortDir = ref(galleryMemory.sortDir ?? galleryMemory.order ?? 'asc')
watch([showChart, showTable, split], () => Object.assign(galleryMemory, { showChart: showChart.value, showTable: showTable.value, split: split.value }))
watch([sortKey, sortDir], () => Object.assign(galleryMemory, { sortKey: sortKey.value, sortDir: sortDir.value, order: sortDir.value }))
const ACCESSORS = {
  Feature: (r) => r.Feature, Effect_Size: (r) => r.Effect_Size,
  Count_Corpus1: (r) => r.Count_Corpus1, Count_Corpus2: (r) => r.Count_Corpus2,
  Mean_Corpus1: (r) => r.Mean_Corpus1, Mean_Corpus2: (r) => r.Mean_Corpus2,
}
function compareRows(a, b) {
  const va = ACCESSORS[sortKey.value](a) ?? 0; const vb = ACCESSORS[sortKey.value](b) ?? 0
  if (typeof va === 'string' || typeof vb === 'string') return String(va).localeCompare(String(vb))
  if (sortDir.value === 'abs') return Math.abs(vb) - Math.abs(va)
  return sortDir.value === 'asc' ? va - vb : vb - va
}
const tableRows = computed(() => (shown.value ? [...shown.value.rows].sort(compareRows) : []))
// Clicar no cabeçalho escolhe a coluna e alterna a direção; em d, passa também pelo módulo (↑ → ↓ → |·|).
function sortBy(key) {
  if (sortKey.value !== key) { sortKey.value = key; sortDir.value = 'asc'; return }
  if (key === 'Effect_Size') sortDir.value = sortDir.value === 'asc' ? 'desc' : sortDir.value === 'desc' ? 'abs' : 'asc'
  else sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
}
const arrow = (key) => (sortKey.value !== key ? '' : sortDir.value === 'asc' ? '↑' : sortDir.value === 'desc' ? '↓' : '|·|')
function setOrder(dir) { sortKey.value = 'Effect_Size'; sortDir.value = dir }

// Clicar num atributo (barra do gráfico ou linha da tabela) abre a gaveta com os textos em que ele
// ocorre, em ordem decrescente de frequência (arquivo + ocorrências por 1000 e absolutas). O atributo
// escolhido fica na URL (`textos=<atributo>`): o botão voltar (e o do navegador) fecha a gaveta sem
// recalcular a análise.
const textsFeature = computed(() => route.query.textos ?? '')
const textsOpen = computed(() => Boolean(analyzing.value && data.value && textsFeature.value))
async function loadDetail(name) {
  if (!data.value || detail.value?.name === name) return
  detail.value = null
  const [a, b] = await Promise.all([1, 2].map((n) => { const s = gallerySides.value[n - 1]; return api.compare.feature({ corpus: s.corpus, where: s.where, layer: lastParams.value?.layer ?? effectiveLayer.value, feature: data.value.feature, name }) }))
  const row = data.value.rows.find((r) => r.Feature === name)
  detail.value = { name, row, v1: a.values, v2: b.values }
}
function openTexts(name) {
  router.push({ path: '/comparar', query: { ...route.query, tool: 'kfa', view: 'analise', textos: name } })
}
function closeTexts() { const q = { ...route.query }; delete q.textos; router.push({ path: '/comparar', query: q }) }
watch(textsFeature, (name) => { if (name) loadDetail(name) })
// Lista única dos textos do atributo (os dois lados juntos), em ordem decrescente de frequência por
// 1000 palavras. Cada linha traz o lado pelo quadrado na cor do comparador (o título nomeia o corpus).
const texts = computed(() => {
  if (!detail.value) return []
  const all = []
  gallerySides.value.forEach((s, i) => {
    for (const v of (detail.value[i ? 'v2' : 'v1'] ?? [])) {
      if (v.count > 0 || v.value > 0) all.push({ ...v, side: i, label: s.label, corpus: s.corpus })
    }
  })
  return all.sort((a, b) => b.value - a.value)
})
// Clicar num texto abre-o no Leitor; o botão voltar do Leitor retorna à lista (o estado da gaveta fica na URL).
function readerTarget(v) {
  return { path: '/leitor', query: { corpus: v.corpus, layer: lastParams.value?.layer ?? effectiveLayer.value, file: v.filename, color: data.value?.feature ?? 'tags', highlight: textsFeature.value } }
}
function openReader(v) { router.push(readerTarget(v)) }
</script>
<template>
  <section class="flex flex-col gap-3">
    <BusyModal :open="busy" :delay="350" :title="t('compare.calculating')" :message="t('compare.calculating_hint')" :job="job" @cancel="jobId && api.jobs.cancel(jobId)" />
    <!-- Análise isolada: painel de tela cheia que desliza da direita (abre ao calcular). -->
    <template v-if="analyzing && data">
    <Transition name="ttw-slide">
      <div class="fixed inset-0 z-30 bg-base-100 flex flex-col" role="region"
           :aria-label="t('kfa.view_analysis')" data-testid="kfa-analysis">
      <header class="shrink-0 flex flex-col gap-2 border-b border-base-300 p-3 bg-base-100">
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" class="btn btn-sm" data-testid="kfa-back" @click="backToSetup">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
          {{ t('kfa.back_to_setup') }}
        </button>
        <p role="status" class="text-sm" data-testid="kfa-results">{{ resultLine }}</p>
      </div>
      <div class="flex flex-wrap items-end gap-2">
      <label class="ttw-field w-28"><span class="ttw-label flex items-center gap-1"><HelpTip term="cohens_d">{{ t('kfa.min_effect') }}</HelpTip></span><input v-model.number="f.min_effect" type="number" step="0.01" min="0" :max="maxD" class="input input-sm" data-testid="kfa-min-effect" /></label>
      <label class="ttw-field w-56"><span class="ttw-label">{{ t('kfa.min_effect_slider') }}</span><input v-model.number="f.min_effect" type="range" min="0" :max="maxD" step="0.01" class="range range-xs range-primary" data-testid="kfa-min-effect-slider" :aria-label="t('kfa.min_effect_slider')" /></label>
        <span class="text-xs text-text-muted pb-2">{{ t('kfa.min_effect_filter') }}</span>
        <CopyCode analysis="kfa" :params="copyParams" /><ExportMenu name="kfa" :rows="tableRows" />
        <button type="button" class="btn btn-sm" :aria-pressed="showChart" data-testid="analysis-toggle-chart" @click="showChart = !showChart">{{ showChart ? t('analysis.hide_chart') : t('analysis.show_chart') }}</button>
        <button type="button" class="btn btn-sm" :aria-pressed="showTable" data-testid="analysis-toggle-table" @click="showTable = !showTable">{{ showTable ? t('analysis.hide_table') : t('analysis.show_table') }}</button></div>
      </header>
      <div class="flex-1 min-h-0 p-3 overflow-auto lg:overflow-hidden">
      <SplitPane v-model="split" :show-left="showChart" :show-right="showTable" fill>
        <ChartGallery :kfa="shown" :layer="lastParams?.layer ?? effectiveLayer" :feature="data.feature" :sides="gallerySides" :order="sortDir" @update:order="setOrder" @select="openTexts" />
        <template #right>
          <div class="ttw-scroll" data-testid="kfa-table">
            <table class="table table-xs table-pin-rows"><thead>
              <tr>
                <th rowspan="2" class="text-left align-bottom"><button type="button" class="cursor-pointer font-bold" data-testid="kfa-sort-feature" @click="sortBy('Feature')">{{ t('kfa.feature') }} {{ arrow('Feature') }}</button></th>
                <th rowspan="2" class="text-right align-bottom"><button type="button" class="cursor-pointer font-bold" data-testid="kfa-sort-d" @click="sortBy('Effect_Size')">d {{ arrow('Effect_Size') }}</button></th>
                <th colspan="2" class="text-center whitespace-nowrap">{{ gallerySides[0].label }}</th>
                <th colspan="2" class="text-center whitespace-nowrap">{{ gallerySides[1].label }}</th>
              </tr>
              <tr>
                <th class="text-right" :title="t('kfa.raw_count')"><button type="button" class="cursor-pointer font-bold" data-testid="kfa-sort-count1" @click="sortBy('Count_Corpus1')">{{ t('kfa.col_raw') }} {{ arrow('Count_Corpus1') }}</button></th>
                <th class="text-right" :title="t('kfa.per_1000')"><button type="button" class="cursor-pointer font-bold" data-testid="kfa-sort-mean1" @click="sortBy('Mean_Corpus1')">{{ t('kfa.col_per1000') }} {{ arrow('Mean_Corpus1') }}</button></th>
                <th class="text-right" :title="t('kfa.raw_count')"><button type="button" class="cursor-pointer font-bold" data-testid="kfa-sort-count2" @click="sortBy('Count_Corpus2')">{{ t('kfa.col_raw') }} {{ arrow('Count_Corpus2') }}</button></th>
                <th class="text-right" :title="t('kfa.per_1000')"><button type="button" class="cursor-pointer font-bold" data-testid="kfa-sort-mean2" @click="sortBy('Mean_Corpus2')">{{ t('kfa.col_per1000') }} {{ arrow('Mean_Corpus2') }}</button></th>
              </tr>
              </thead>
              <tbody><tr v-for="r in tableRows" :key="r.Feature" class="hover cursor-pointer" tabindex="0" @click="openTexts(r.Feature)" @keydown.enter="openTexts(r.Feature)">
                <td>{{ r.Feature }}</td>
                <td class="text-right tabular-nums">{{ r.Effect_Size.toFixed(3) }}</td>
                <td class="text-right tabular-nums">{{ r.Count_Corpus1 }}</td>
                <td class="text-right tabular-nums">{{ r.Mean_Corpus1.toFixed(2) }}</td>
                <td class="text-right tabular-nums">{{ r.Count_Corpus2 }}</td>
                <td class="text-right tabular-nums">{{ r.Mean_Corpus2.toFixed(2) }}</td>
              </tr></tbody></table>
          </div>
        </template>
      </SplitPane>
      </div>
      <!-- Gaveta dos textos do atributo: desliza à direita, sempre com botão de voltar (e Esc). -->
      <Transition name="ttw-texts">
        <div v-if="textsOpen" class="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true"
             :aria-label="t('kfa.tag_texts', { feature: textsFeature })" @keydown.esc="closeTexts">
          <div class="absolute inset-0 bg-black/40" @click="closeTexts" />
          <aside class="relative bg-base-100 w-full max-w-xl h-full overflow-auto p-4 flex flex-col gap-3 shadow-xl" data-testid="kfa-texts">
            <div class="flex items-start gap-1">
              <div class="flex flex-col gap-0.5 min-w-0">
                <h2 class="text-lg font-bold leading-tight truncate">{{ t('kfa.tag_texts', { feature: textsFeature }) }}</h2>
                <p class="text-xs text-text-muted">{{ t('kfa.texts_tagger', { tagger: effectiveLayer }) }}</p>
              </div>
              <TagsetInfoButton v-if="effectiveLayer" :tagger="effectiveLayer" :corpus="props.corpus" :label="effectiveLayer" />
              <button type="button" class="btn btn-sm btn-square ml-auto" autofocus data-testid="kfa-texts-back" :aria-label="t('kfa.back')" :title="t('kfa.back')" @click="closeTexts">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
              </button>
            </div>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span class="text-xs text-text-muted">{{ t('kfa.texts_compare') }}</span>
              <span v-for="(s, i) in gallerySides" :key="i" class="flex items-center gap-1.5">
                <span class="inline-block w-3 h-3 rounded-sm border border-base-content/20" :style="{ background: cmp.colors[i] }" aria-hidden="true" />
                {{ s.label }}
              </span>
            </div>
            <p v-if="!detail || detail.name !== textsFeature" class="text-sm text-text-muted" role="status">{{ t('gallery.loading') }}</p>
            <template v-else>
              <p class="text-xs text-text-muted">{{ t('kfa.texts_hint') }}</p>
              <p v-if="!texts.length" class="text-text-muted">{{ t('kfa.no_texts') }}</p>
              <template v-else>
                <div class="ttw-scroll" tabindex="0" role="region" :aria-label="t('kfa.tag_texts', { feature: textsFeature })">
                  <table class="table table-xs">
                    <thead><tr><th>{{ t('kfa.text_column') }}</th><th class="text-right" :title="t('kfa.freq_per_1000')">{{ t('kfa.col_per1000') }}</th><th class="text-right" :title="t('kfa.freq_abs')">{{ t('kfa.col_raw') }}</th></tr></thead>
                    <tbody>
                      <tr v-for="v in texts" :key="`${v.side}|${v.filename}`" class="hover cursor-pointer" @click="openReader(v)">
                        <td class="break-all">
                          <span class="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle" :style="{ background: cmp.colors[v.side] }" :title="v.label" role="img" :aria-label="v.label" />
                          <RouterLink class="link" :to="readerTarget(v)" @click.stop>{{ v.filename }}</RouterLink>
                        </td>
                        <td class="text-right tabular-nums">{{ v.value.toFixed(2) }}</td>
                        <td class="text-right tabular-nums">{{ v.count }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p class="text-xs text-text-muted">{{ t('kfa.open_text_hint') }}</p>
              </template>
            </template>
          </aside>
        </div>
      </Transition>
      </div>
    </Transition>
    </template>

    <!-- Configuração e execução: rodata a KFA e abre a análise. -->
    <template v-else>
    <p v-if="!layers.length" class="text-text-muted">{{ t('kfa.no_layer') }}</p>
    <form v-else class="flex flex-wrap items-end gap-2" @submit.prevent="run">
      <FeatureSelect v-model="f.feature" :fields="layerFields" />
      <button class="btn btn-sm btn-primary" data-testid="kfa-run">{{ t('compare.run') }}</button>
      <span class="badge badge-outline" data-testid="kfa-layer" :title="t('kfa.layer_hint')">{{ layer ? t('kfa.layer_used', { layer: effectiveLayer }) : t('kfa.layer_auto', { layer: effectiveLayer }) }}</span>
      <TagsetInfoButton v-if="effectiveLayer" class="mb-0.5" :tagger="effectiveLayer" :corpus="props.corpus" :label="effectiveLayer" />
      <HelpTip term="kfa" />
    </form>
    <div v-if="stale" role="alert" class="alert alert-warning text-sm flex flex-wrap items-center gap-2" data-testid="kfa-stale">
      <span>{{ lastParams.setupSig !== setupSig ? t('kfa.setup_changed') : lastParams.layer !== effectiveLayer ? t('kfa.layer_changed', { old: lastParams.layer, new: effectiveLayer }) : t('kfa.feature_changed') }}</span>
      <button class="btn btn-sm btn-primary" data-testid="kfa-recalc" @click="run">{{ t('kfa.recalc', { layer: effectiveLayer }) }}</button>
      <button class="btn btn-sm btn-ghost" data-testid="kfa-keep" @click="keptFor = `${effectiveLayer}/${f.feature}/${setupSig}`">{{ t('kfa.keep') }}</button>
    </div>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="data">
      <p role="status" class="text-sm" data-testid="kfa-results">{{ resultLine }}</p>
      <button type="button" class="btn btn-sm btn-primary w-fit" data-testid="kfa-view-analysis" @click="openAnalysis">{{ t('kfa.view_analysis') }}</button>
    </template>
    </template>
  </section>
</template>
<style scoped>
/* A gaveta dos textos desliza da direita; sem animação para quem pede menos movimento. */
.ttw-texts-enter-active, .ttw-texts-leave-active { transition: opacity 0.2s ease; }
.ttw-texts-enter-active aside, .ttw-texts-leave-active aside { transition: transform 0.2s ease; }
.ttw-texts-enter-from, .ttw-texts-leave-to { opacity: 0; }
.ttw-texts-enter-from aside, .ttw-texts-leave-to aside { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) {
  .ttw-texts-enter-active, .ttw-texts-leave-active,
  .ttw-texts-enter-active aside, .ttw-texts-leave-active aside { transition: none; }
}
/* A análise entra deslizando da direita (tela cheia, sem rolagem da página atrás). */
.ttw-slide-enter-active, .ttw-slide-leave-active { transition: transform 0.22s ease; }
.ttw-slide-enter-from, .ttw-slide-leave-to { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) { .ttw-slide-enter-active, .ttw-slide-leave-active { transition: none; } }
/* Em telas largas a tabela ocupa a altura toda do painel (a coluna rola, sem cap de 70dvh). */
@media (min-width: 1024px) { :deep([data-testid="kfa-table"]) { max-height: none; height: 100%; } }
</style>
