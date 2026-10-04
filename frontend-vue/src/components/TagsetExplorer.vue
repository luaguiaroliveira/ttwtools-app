<script setup>
// Repertório(s) de um etiquetador para a configuração atual: seletor (quando a configuração
// produz mais de um, ex.: upos e ptb) + a tabela de tags.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { loadTagsetData, tagsetIdsForConfig } from '../utils/tagInfo.js'
import TagsetTable from './TagsetTable.vue'
const props = defineProps({
  tagger: { type: String, required: true },
  descriptor: { type: Object, default: null },   // descritor de opções (define os repertórios da config)
  values: { type: Object, default: () => ({}) }, // opções correntes do tagger
})
const { t, locale } = useI18n()
const loaded = ref([])       // [{ id, data }] na ordem da configuração
const selected = ref('')
const ids = computed(() => {
  const list = tagsetIdsForConfig(props.descriptor, props.values)
  return list.length ? list : [props.tagger]
})
watch(() => [props.tagger, locale.value, JSON.stringify(props.values ?? {}), props.descriptor], async () => {
  const sets = await Promise.all(ids.value.map(async (id) => ({ id, data: await loadTagsetData(id, locale.value).catch(() => null) })))
  loaded.value = sets.filter((x) => x.data)
  if (!loaded.value.some((x) => x.id === selected.value)) selected.value = loaded.value[0]?.id ?? ''
}, { immediate: true })
const data = computed(() => loaded.value.find((x) => x.id === selected.value)?.data ?? null)
</script>
<template>
  <div class="flex flex-col gap-3">
    <label v-if="loaded.length > 1" class="flex items-center gap-2 text-sm">
      <span>{{ t('tagset.choose') }}</span>
      <select v-model="selected" class="select select-sm" :aria-label="t('tagset.choose')" data-testid="tagset-choice">
        <option v-for="s in loaded" :key="s.id" :value="s.id">{{ s.data.name }}</option>
      </select>
    </label>
    <template v-if="data">
      <p class="text-sm opacity-80">{{ data.about }}</p>
      <p v-if="data.source" class="text-xs text-text-muted">{{ t('tagset.source') }}: {{ data.source }}</p>
      <TagsetTable :data="data" />
    </template>
    <p v-else class="text-sm text-text-muted">{{ t('tagset.empty') }}</p>
  </div>
</template>
