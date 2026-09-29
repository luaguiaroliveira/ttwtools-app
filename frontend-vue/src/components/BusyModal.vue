<script setup>
// Modal de cálculo em andamento (abrir, salvar): bloqueia a tela para deixar claro que algo está
// sendo processado. Esc não fecha; a saída é o botão Cancelar do progresso.
import { nextTick, onMounted, ref, watch } from 'vue'
import JobProgress from './JobProgress.vue'
const props = defineProps({ open: Boolean, title: { type: String, required: true }, job: Object })
const emit = defineEmits(['cancel'])
const el = ref(null)
const sync = () => { if (!el.value) return; props.open ? (!el.value.open && el.value.showModal?.()) : el.value.close?.() }
watch(() => props.open, () => nextTick(sync))
onMounted(sync)
</script>
<template>
  <dialog ref="el" class="modal" :aria-label="title" data-testid="busy-modal" @cancel.prevent>
    <div class="modal-box max-w-md">
      <h2 class="font-bold text-lg mb-3">{{ title }}</h2>
      <JobProgress :job="job" @cancel="emit('cancel')" />
      <slot />
    </div>
  </dialog>
</template>
