<script setup>
// Modal de cálculo em andamento (abrir, salvar, comparar): bloqueia a tela para deixar claro que algo
// está sendo processado. Esc não fecha. Com `job`, mostra o progresso da tarefa (e Cancelar); sem ele,
// uma barra indeterminada com `message`. `delay` (ms) evita que o modal pisque em cálculos rápidos.
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import JobProgress from './JobProgress.vue'
const props = defineProps({ open: Boolean, title: { type: String, required: true }, job: Object, message: { type: String, default: '' }, delay: { type: Number, default: 0 } })
const emit = defineEmits(['cancel'])
const el = ref(null)
const shown = ref(false)
let timer
const sync = () => { if (!el.value) return; shown.value ? (!el.value.open && el.value.showModal?.()) : el.value.close?.() }
watch(() => props.open, (v) => {
  clearTimeout(timer)
  if (!v) shown.value = false
  else if (props.delay > 0) timer = setTimeout(() => { shown.value = true }, props.delay)
  else shown.value = true
}, { immediate: true })
watch(shown, () => nextTick(sync))
onMounted(sync)
onBeforeUnmount(() => clearTimeout(timer))
</script>
<template>
  <dialog ref="el" class="modal" :aria-label="title" data-testid="busy-modal" @cancel.prevent>
    <div class="modal-box max-w-md">
      <h2 class="font-bold text-lg mb-3">{{ title }}</h2>
      <JobProgress v-if="job" :job="job" @cancel="emit('cancel')" />
      <div v-else class="flex flex-col gap-2" role="status" aria-live="polite">
        <p v-if="message" class="text-sm">{{ message }}</p>
        <progress class="progress progress-primary w-full" />
      </div>
      <slot />
    </div>
  </dialog>
</template>
