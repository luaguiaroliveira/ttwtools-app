<script setup>
// Campo de consulta + opções da ferramenta (slot) + botão Buscar, tudo na mesma linha; abaixo, exemplos
// de sintaxe clicáveis e o indicador de cálculo. Os resultados entram pelo slot `results`.
// Em telas largas o seletor de etiquetas é uma divisão lateral à direita (redimensionável, colapsável
// na borda); em telas estreitas vira gaveta por cima. Só os painéis rolam (a página não rola).
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import HelpTip from '../../components/HelpTip.vue'
import BusyBar from '../../components/BusyBar.vue'
import SplitHandle from '../../components/SplitHandle.vue'
import TagPicker from './TagPicker.vue'
import { useResizablePane } from '../../composables/useResizablePane.js'
const props = defineProps({ initial: { type: String, default: '' }, label: { type: String, default: '' }, busy: Boolean,
  corpus: { type: String, default: '' }, layer: { type: String, default: null }, tags: Boolean,
  tagMode: { type: String, default: 'query' }, selectedTags: { type: Array, default: () => [] } })
const emit = defineEmits(['submit', 'tag-toggle'])
const { t } = useI18n()
const q = ref(props.initial)
const input = ref(null)
const root = ref(null)

// Telas largas: divisão lateral com alça arrastável (largura persistida); estreitas: gaveta por cima.
const mq = globalThis.matchMedia?.('(min-width: 1024px)')
const wide = ref(mq?.matches ?? true)
const { width: panelW, open: panelOpen, onDown: onDrag, onKey: onResizeKey, min: panelMin, max: panelMax } = useResizablePane({
  min: 200, max: 640, initial: 336, collapseAt: 120, storageKey: 'ttw.explore.tagsPanel',
})
if (!wide.value) panelOpen.value = false
const onMq = (e) => { wide.value = e.matches; if (!e.matches) panelOpen.value = false }
onMounted(() => mq?.addEventListener?.('change', onMq))
const split = computed(() => Boolean(props.tags && props.corpus && wide.value))
const gridStyle = computed(() => ({
  gridTemplateColumns: panelOpen.value ? `minmax(0,1fr) .75rem ${panelW.value}px` : 'minmax(0,1fr) .75rem 0px',
}))

const onKey = (e) => { if (e.key === 'Escape') panelOpen.value = false }
// clique fora fecha a gaveta (telas estreitas); em telas largas a divisão fica até arrastar/fechar
function onDocDown(e) {
  if (wide.value || !panelOpen.value || root.value?.contains(e.target) || e.target?.closest?.('header')) return
  panelOpen.value = false
}
function bind(open) {
  const m = open ? 'addEventListener' : 'removeEventListener'
  globalThis[m]('keydown', onKey)
  globalThis[m]('pointerdown', onDocDown, true)
}
watch(panelOpen, (open) => bind(open), { immediate: true })
onBeforeUnmount(() => { bind(false); mq?.removeEventListener?.('change', onMq) })

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
  <div ref="root" class="min-w-0" :class="split ? 'grid h-full min-h-0' : 'contents'" :style="split ? gridStyle : {}">
    <div :class="split ? 'flex flex-col min-h-0 min-w-0' : 'contents'" :style="split ? { '--ttw-tag-width': `${panelW}px` } : {}">
      <form class="ttw-sticky-form flex flex-col gap-2" :class="split ? 'shrink-0' : ''" @submit.prevent="!busy && q.trim() && emit('submit', q.trim())">
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
      <div :class="split ? 'ttw-scroll flex-1 min-h-0 overflow-y-auto pt-3 flex flex-col gap-3' : 'contents'">
        <slot name="results" />
      </div>
    </div>
    <template v-if="tags && corpus">
      <SplitHandle v-if="split" :expanded="panelOpen" :label="t('explore.tags_panel')" :now="panelW" :min="panelMin" :max="panelMax"
                   @down="onDrag($event, root)" @key="onResizeKey" />
      <button v-else type="button" class="ttw-tag-handle print:hidden" :aria-expanded="panelOpen" aria-controls="explore-tag-aside"
              data-testid="tag-panel-toggle" @click="panelOpen = !panelOpen">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3.500 12.500V4.500a1 1 0 0 1 1-1h8l8 8a1.500 1.500 0 0 1 0 2.100l-6.300 6.300a1.500 1.500 0 0 1-2.100 0z" /><circle cx="8" cy="8" r="1.300" /></svg>
        <span>{{ panelOpen ? t('reader.collapse') : t('explore.tags_panel') }}</span>
      </button>
      <aside id="explore-tag-aside" v-show="!split || panelOpen" class="flex flex-col gap-2 print:hidden"
             :class="split ? 'ttw-scroll min-h-0 overflow-y-auto' : ['ttw-tag-drawer', panelOpen ? 'is-open' : '']"
             :inert="!split && !panelOpen" :aria-label="t('explore.tags_panel')">
        <div class="flex items-center gap-2">
          <h3 class="font-bold text-sm">{{ t('explore.tags_panel') }}</h3>
          <button type="button" class="btn btn-xs btn-ghost ml-auto" data-testid="tag-panel-close"
                  :aria-label="t('reader.collapse')" :title="t('reader.collapse')" @click="panelOpen = false">✕</button>
        </div>
        <TagPicker :corpus="corpus" :layer="layer" :query="q" :mode="tagMode" :selected="selectedTags"
                   @apply="applyClause" @toggle="emit('tag-toggle', $event)" />
      </aside>
    </template>
  </div>
</template>
