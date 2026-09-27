<script setup>
// Janela modal com <dialog> nativo: foco preso, Esc fecha, volta o foco ao fechar.
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
const props = defineProps({ open: Boolean, title: { type: String, required: true } })
const emit = defineEmits(['close'])
const el = ref(null)
const { t } = useI18n()
watch(() => props.open, (v) => { if (!el.value) return; v ? el.value.showModal?.() : el.value.close?.() })
</script>
<template>
  <dialog ref="el" class="modal" :aria-label="title" @close="emit('close')">
    <div class="modal-box">
      <h2 class="font-bold text-lg mb-3">{{ title }}</h2>
      <slot />
      <div class="modal-action"><button class="btn" @click="emit('close')">{{ t('common.close') }}</button></div>
    </div>
  </dialog>
</template>
