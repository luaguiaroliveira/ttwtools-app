<script setup>
// Gaveta "ver tags": repertório(s) do etiquetador para a configuração atual, com busca, grupos e a
// documentação de cada tag. O conteúdo fica em `TagsetExplorer` (reutilizado no Aprender).
import { useI18n } from 'vue-i18n'
import TagsetExplorer from './TagsetExplorer.vue'
defineProps({
  open: Boolean,
  tagger: { type: String, required: true },
  label: { type: String, default: '' },
  descriptor: { type: Object, default: null },
  values: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['close'])
const { t } = useI18n()
</script>
<template>
  <div v-if="open" class="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" :aria-label="t('tagset.tags_of', { tagger: label || tagger })"
       @keydown.esc="emit('close')">
    <div class="absolute inset-0 bg-black/40" @click="emit('close')" />
    <aside class="relative bg-base-100 w-full max-w-2xl h-full overflow-auto p-4 flex flex-col gap-3 shadow-xl">
      <div class="flex items-center gap-2">
        <h2 class="text-lg font-bold">{{ t('tagset.tags_of', { tagger: label || tagger }) }}</h2>
        <button class="btn btn-sm btn-ghost ml-auto" autofocus data-testid="tagset-close" @click="emit('close')">{{ t('common.close') }}</button>
      </div>
      <TagsetExplorer :tagger="tagger" :descriptor="descriptor" :values="values" />
    </aside>
  </div>
</template>
