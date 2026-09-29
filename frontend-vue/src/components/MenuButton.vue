<script setup>
// Botão com menu suspenso que fecha ao escolher, ao clicar fora, com Esc e ao sair com Tab.
// O conteúdo do menu recebe `close` no slot padrão.
import { onBeforeUnmount, ref, watch } from 'vue'
defineProps({ label: { type: String, required: true }, align: { type: String, default: 'end' } })
const open = ref(false)
const root = ref(null)
const btn = ref(null)
const away = (e) => { if (!root.value?.contains(e.target)) open.value = false }
const key = (e) => { if (e.key === 'Escape') { open.value = false; btn.value?.focus() } }
const leave = (e) => { if (open.value && !root.value?.contains(e.relatedTarget)) open.value = false }
watch(open, (v) => {
  const f = v ? 'addEventListener' : 'removeEventListener'
  document[f]('pointerdown', away); document[f]('keydown', key)
})
onBeforeUnmount(() => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', key) })
</script>
<template>
  <div ref="root" class="relative" @focusout="leave">
    <button ref="btn" type="button" class="btn btn-ghost btn-sm gap-1" aria-haspopup="menu" :aria-expanded="open" :aria-label="label" :title="label" @click="open = !open">
      <slot name="button" />
    </button>
    <div v-if="open" role="menu" class="absolute z-40 top-full mt-1 min-w-44 p-1 rounded-box bg-base-100 border border-base-300 shadow-lg flex flex-col"
         :class="align === 'end' ? 'right-0' : 'left-0'">
      <slot :close="() => (open = false)" />
    </div>
  </div>
</template>
