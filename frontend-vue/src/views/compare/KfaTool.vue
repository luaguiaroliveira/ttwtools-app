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
  } catch (err) { if (err?.name !== 'AbortError') error.value = err.message } finally { busy.value = false; job.value = null; jobId = null }
}
const maxD = computed(() => Math.max(1, Math.ceil(Math.max(0, ...(data.value?.rows ?? []).map((r) => Math.abs(r.Effect_Size))) * 10) / 10))
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
watch([showChart, showTable, split], () => Object.assign(galleryMemory, { showChart: showChart.value, showTable: showTable.value, split: split.value }))

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
// Só os textos que têm o atributo, do maior para o menor valor por 1000 palavras, um grupo por lado.
const textsSides = computed(() => (detail.value ? gallerySides.value.map((s, i) => ({ label: s.label, rows: (detail.value[i ? 'v2' : 'v1'] ?? []).filter((v) => v.count > 0 || v.value > 0).sort((a, b) => b.value - a.value) })) : []))
</script>
<template>
  <section class="flex flex-col gap-3">
    <BusyModal :open="busy" :delay="350" :title="t('compare.calculating')" :message="t('compare.calculating_hint')" :job="job" @cancel="jobId && api.jobs.cancel(jobId)" />
    <!-- Tela de análise isolada, em rota própria: só as visualizações, o |d| mínimo e a tabela. -->
    <template v-if="analyzing && data">
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
        <CopyCode analysis="kfa" :params="copyParams" /><ExportMenu name="kfa" :rows="shown.rows" />
        <button type="button" class="btn btn-sm" :aria-pressed="showChart" data-testid="analysis-toggle-chart" @click="showChart = !showChart">{{ showChart ? t('analysis.hide_chart') : t('analysis.show_chart') }}</button>
        <button type="button" class="btn btn-sm" :aria-pressed="showTable" data-testid="analysis-toggle-table" @click="showTable = !showTable">{{ showTable ? t('analysis.hide_table') : t('analysis.show_table') }}</button></div>
      <SplitPane v-model="split" :show-left="showChart" :show-right="showTable">
        <ChartGallery :kfa="shown" :layer="lastParams?.layer ?? effectiveLayer" :feature="data.feature" :sides="gallerySides" @select="openTexts" />
        <template #right>
          <div class="ttw-scroll" data-testid="kfa-table">
            <table class="table table-xs table-pin-rows"><thead><tr><th>{{ t('kfa.feature') }}</th><th class="text-right">d</th><th class="text-right" :title="`${t('kfa.mean')}: ${gallerySides[0].label}`">{{ gallerySides[0].label }}</th><th class="text-right" :title="`${t('kfa.mean')}: ${gallerySides[1].label}`">{{ gallerySides[1].label }}</th></tr></thead>
              <tbody><tr v-for="r in shown.rows" :key="r.Feature" class="hover cursor-pointer" tabindex="0" @click="openTexts(r.Feature)" @keydown.enter="openTexts(r.Feature)"><td>{{ r.Feature }}</td><td class="text-right tabular-nums">{{ r.Effect_Size.toFixed(3) }}</td>
                <td class="text-right tabular-nums">{{ r.Mean_Corpus1.toFixed(2) }}</td><td class="text-right tabular-nums">{{ r.Mean_Corpus2.toFixed(2) }}</td></tr></tbody></table>
          </div>
        </template>
      </SplitPane>
      <!-- Gaveta dos textos do atributo: desliza à direita, sempre com botão de voltar (e Esc). -->
      <Transition name="ttw-texts">
        <div v-if="textsOpen" class="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true"
             :aria-label="t('kfa.tag_texts', { feature: textsFeature })" @keydown.esc="closeTexts">
          <div class="absolute inset-0 bg-black/40" @click="closeTexts" />
          <aside class="relative bg-base-100 w-full max-w-xl h-full overflow-auto p-4 flex flex-col gap-3 shadow-xl" data-testid="kfa-texts">
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-bold">{{ t('kfa.tag_texts', { feature: textsFeature }) }}</h2>
              <button type="button" class="btn btn-sm btn-ghost ml-auto" autofocus data-testid="kfa-texts-back" @click="closeTexts">{{ t('kfa.back') }}</button>
            </div>
            <p v-if="!detail || detail.name !== textsFeature" class="text-sm text-text-muted" role="status">{{ t('gallery.loading') }}</p>
            <template v-else>
              <p class="text-xs text-text-muted">{{ t('kfa.texts_hint') }}</p>
              <p v-if="!textsSides.some((s) => s.rows.length)" class="text-text-muted">{{ t('kfa.no_texts') }}</p>
              <section v-for="(s, i) in textsSides" v-show="s.rows.length" :key="i" class="flex flex-col gap-1">
                <h3 class="font-semibold text-sm">{{ s.label }}</h3>
                <div class="ttw-scroll" tabindex="0" role="region" :aria-label="s.label">
                  <table class="table table-xs">
                    <thead><tr><th>{{ t('kfa.text_column') }}</th><th class="text-right">{{ t('kfa.freq_per_1000') }}</th><th class="text-right">{{ t('kfa.freq_abs') }}</th></tr></thead>
                    <tbody><tr v-for="v in s.rows" :key="v.filename"><td class="break-all">{{ v.filename }}</td><td class="text-right tabular-nums">{{ v.value.toFixed(2) }}</td><td class="text-right tabular-nums">{{ v.count }}</td></tr></tbody>
                  </table>
                </div>
              </section>
            </template>
          </aside>
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
</style>
