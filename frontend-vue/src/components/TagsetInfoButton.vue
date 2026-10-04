<script setup>
// Ícone de informação ao lado de um etiquetador: abre a gaveta com as tags que ele produz.
// Se o descritor não vier do pai, busca as opções do etiquetador ao abrir (respeita a configuração
// quando o pai passa `descriptor` e `values`).
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/index.js'
import TagsetDrawer from './TagsetDrawer.vue'
const props = defineProps({
  tagger: { type: String, required: true },
  corpus: { type: String, default: null },
  descriptor: { type: Object, default: null },
  values: { type: Object, default: () => ({}) },
  label: { type: String, default: '' },
})
const { t, locale } = useI18n()
const open = ref(false)
const desc = ref(props.descriptor)
watch(() => props.descriptor, (d) => { if (d) desc.value = d })
async function show() {
  if (!desc.value && props.corpus) desc.value = await api.taggers.options(props.tagger, locale.value, props.corpus).catch(() => null)
  open.value = true
}
</script>
<template>
  <button type="button" class="btn btn-xs btn-circle btn-ghost" :title="t('tagset.info_for', { tagger: label || tagger })"
          :aria-label="t('tagset.info_for', { tagger: label || tagger })" :data-testid="`tag-info-${tagger}`" @click="show">
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.6h.01" /></svg>
  </button>
  <TagsetDrawer :open="open" :tagger="tagger" :label="label" :descriptor="desc" :values="values" @close="open = false" />
</template>
