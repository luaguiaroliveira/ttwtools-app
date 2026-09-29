<script setup>
// Campo de consulta + opções da ferramenta (slot) + botão Buscar, tudo na mesma linha;
// abaixo, exemplos de sintaxe clicáveis (inserem no campo) e o indicador de cálculo.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import HelpTip from '../../components/HelpTip.vue'
import BusyBar from '../../components/BusyBar.vue'
const props = defineProps({ initial: { type: String, default: '' }, label: { type: String, default: '' }, busy: Boolean })
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
</script>
<template>
  <form class="flex flex-col gap-2" @submit.prevent="!busy && q.trim() && emit('submit', q.trim())">
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
</template>
