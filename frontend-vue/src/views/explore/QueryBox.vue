<script setup>
// Campo de consulta + opções da ferramenta (slot) + botão Buscar, tudo na mesma linha;
// abaixo, exemplos de sintaxe clicáveis (inserem no campo) e o indicador de cálculo.
// O seletor de etiquetas do etiquetador ativo fica num painel lateral à direita, já visível por padrão,
// com botão de abrir/fechar, alça arrastável de largura (padrão do SplitPane) e largura persistida.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import HelpTip from '../../components/HelpTip.vue'
import BusyBar from '../../components/BusyBar.vue'
import TagPicker from './TagPicker.vue'
const props = defineProps({ initial: { type: String, default: '' }, label: { type: String, default: '' }, busy: Boolean,
  corpus: { type: String, default: '' }, layer: { type: String, default: null }, tags: Boolean,
  tagMode: { type: String, default: 'query' }, selectedTags: { type: Array, default: () => [] } })
const emit = defineEmits(['submit', 'tag-toggle'])
const { t } = useI18n()
const q = ref(props.initial)
const input = ref(null)

// A largura do painel é persistida em `localStorage` (como as demais preferências da interface);
// o painel sempre abre visível (o `open` não é guardado, para cada ferramenta abrir com as etiquetas à mão).
const PANEL_KEY = 'ttw.explore.tagsPanel'
const MIN_W = 200, MAX_W = 560
const clampW = (v) => Math.max(MIN_W, Math.min(MAX_W, Math.round(v)))
const prefs = (() => { try { return JSON.parse(localStorage.getItem(PANEL_KEY) || '{}') } catch { return {} } })()
// Em telas largas o painel já abre visível; em telas estreitas fica fechado (aberto, cobriria a ferramenta).
const panelOpen = ref(globalThis.matchMedia?.('(min-width: 1024px)').matches ?? true)
const panelW = ref(clampW(Number(prefs.width) || 336))
const root = ref(null)
function save() { try { localStorage.setItem(PANEL_KEY, JSON.stringify({ width: panelW.value })) } catch { /* */ } }

// Arrastar a alça redimensiona o painel; setas (Home/End) ajustam pelo teclado, como no SplitPane.
let dragging = false
function onMove(e) { if (dragging) panelW.value = clampW(globalThis.innerWidth - e.clientX) }
function onUp() {
  if (!dragging) return
  dragging = false
  globalThis.removeEventListener('pointermove', onMove)
  globalThis.removeEventListener('pointerup', onUp)
  save()
}
function onDown(e) {
  if (!panelOpen.value) return
  dragging = true
  e.preventDefault()
  globalThis.addEventListener('pointermove', onMove)
  globalThis.addEventListener('pointerup', onUp)
}
function onResizeKey(e) {
  const step = e.shiftKey ? 40 : 8
  if (e.key === 'ArrowLeft') panelW.value = clampW(panelW.value + step)
  else if (e.key === 'ArrowRight') panelW.value = clampW(panelW.value - step)
  else if (e.key === 'Home') panelW.value = MAX_W
  else if (e.key === 'End') panelW.value = MIN_W
  else return
  e.preventDefault()
  save()
}
const onKey = (e) => { if (e.key === 'Escape') panelOpen.value = false }
// clique fora fecha; o cabeçalho (camada, corpus, idioma, tema) fica de fora para não fechar sem querer
function onDocDown(e) {
  if (root.value?.contains(e.target) || e.target?.closest?.('header')) return
  panelOpen.value = false
}
function bind(open) {
  const m = open ? 'addEventListener' : 'removeEventListener'
  globalThis[m]('keydown', onKey)
  globalThis[m]('pointerdown', onDocDown, true)
}
watch(panelOpen, (open) => { bind(open); save() }, { immediate: true })
onBeforeUnmount(() => {
  bind(false)
  globalThis.removeEventListener('pointermove', onMove)
  globalThis.removeEventListener('pointerup', onUp)
})

// "casa · cas* · black cat (frase)" → exemplos; o texto inserido não leva o "(frase)" explicativo
const examples = computed(() => t('explore.query_hint').split(' · ')
  .map((s) => ({ shown: s, value: s.replace(/\s*\([^)]*\)$/, '') })))
function insert(value) {
  q.value = q.value.trim() ? `${q.value.trim()} ${value}` : value
  input.value?.focus()
}
// A combinação das etiquetas substitui um trecho só (tag=/pos=) e vai para o campo, editável; o
// `&` junta ao último token (palavra&tag=NN) e o `|` é o "ou" dentro do mesmo campo.
const CLAUSE_RE = /(^|[\s&])(tag|pos)=[^\s&]+/g
function applyClause(clause) {
  let base = q.value.replace(CLAUSE_RE, ' ').replace(/\s+/g, ' ').replace(/&{2,}/g, '&').replace(/^&|&$/g, '').trim()
  q.value = clause ? (base ? `${base}&${clause}` : clause) : base
  input.value?.focus()
}
</script>
<template>
  <div ref="root" class="contents" :style="{ '--ttw-tag-width': `${panelW}px` }">
    <form class="ttw-sticky-form flex flex-col gap-2" @submit.prevent="!busy && q.trim() && emit('submit', q.trim())">
      <div class="ttw-form">
        <label class="ttw-field flex-1 min-w-56 max-w-xl">
          <span class="ttw-label"><HelpTip term="query">{{ label || t('explore.query') }}</HelpTip></span>
          <input ref="input" v-model="q" class="input input-sm w-full" data-testid="query-input" autocomplete="off" />
        </label>
        <slot />
        <button class="btn btn-sm btn-primary" type="submit" :disabled="busy" data-testid="query-go">
          <span v-if="busy" class="loading loading-spinner loading-xs" aria-hidden="true" />{{ t('explore.go') }}
        </button>
      </div>
      <div class="flex flex-wrap items-center gap-1 text-xs" :aria-label="t('explore.examples')">
        <span class="text-text-muted mr-1">{{ t('explore.examples') }}:</span>
        <button v-for="e in examples" :key="e.shown" type="button" class="badge badge-ghost font-mono cursor-pointer hover:badge-primary"
                @click="insert(e.value)">{{ e.shown }}</button>
      </div>
      <BusyBar :busy="busy" />
    </form>
    <template v-if="tags && corpus">
      <button type="button" class="ttw-tag-handle print:hidden" :aria-expanded="panelOpen" aria-controls="explore-tag-aside"
              data-testid="tag-panel-toggle" @click="panelOpen = !panelOpen">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3.500 12.500V4.500a1 1 0 0 1 1-1h8l8 8a1.500 1.500 0 0 1 0 2.100l-6.300 6.300a1.500 1.500 0 0 1-2.100 0z" /><circle cx="8" cy="8" r="1.300" /></svg>
        <span>{{ panelOpen ? t('reader.collapse') : t('explore.tags_panel') }}</span>
      </button>
      <aside id="explore-tag-aside" class="ttw-tag-drawer flex flex-col gap-2 print:hidden" :class="{ 'is-open': panelOpen }"
             :inert="!panelOpen" :aria-label="t('explore.tags_panel')">
        <div class="flex items-center gap-2">
          <h3 class="font-bold text-sm">{{ t('explore.tags_panel') }}</h3>
          <button type="button" class="btn btn-xs btn-ghost ml-auto" data-testid="tag-panel-close"
                  :aria-label="t('reader.collapse')" :title="t('reader.collapse')" @click="panelOpen = false">✕</button>
        </div>
        <TagPicker :corpus="corpus" :layer="layer" :query="q" :mode="tagMode" :selected="selectedTags"
                   @apply="applyClause" @toggle="emit('tag-toggle', $event)" />
      </aside>
      <div v-if="panelOpen" class="ttw-tag-resizer print:hidden" role="separator" aria-orientation="vertical" tabindex="0"
           :aria-label="t('analysis.divider')" :aria-valuemin="MIN_W" :aria-valuemax="MAX_W" :aria-valuenow="panelW"
           data-testid="tag-panel-resizer" @pointerdown="onDown" @keydown="onResizeKey" />
    </template>
  </div>
</template>
