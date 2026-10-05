<script setup>
// Campo de consulta + opções da ferramenta (slot) + botão Buscar, tudo na mesma linha;
// abaixo, exemplos de sintaxe clicáveis (inserem no campo) e o indicador de cálculo.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import HelpTip from '../../components/HelpTip.vue'
import BusyBar from '../../components/BusyBar.vue'
import TagPicker from './TagPicker.vue'
const props = defineProps({ initial: { type: String, default: '' }, label: { type: String, default: '' }, busy: Boolean,
  corpus: { type: String, default: '' }, layer: { type: String, default: null }, tags: Boolean })
const emit = defineEmits(['submit'])
const { t } = useI18n()
const q = ref(props.initial)
const input = ref(null)
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
    <details v-if="tags && corpus" class="rounded-box border border-base-300 p-2" data-testid="tag-panel">
      <summary class="text-sm cursor-pointer" data-testid="tag-panel-summary">{{ t('explore.tags_panel') }}</summary>
      <TagPicker class="mt-2" :corpus="corpus" :layer="layer" :query="q" @apply="applyClause" />
    </details>
    <BusyBar :busy="busy" />
  </form>
</template>
