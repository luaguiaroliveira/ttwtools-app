<script setup>
// Aprender: as tags de cada etiquetador, respeitando a configuração (predefinição recomendada).
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/index.js'
import TagsetExplorer from './TagsetExplorer.vue'
const { t, locale } = useI18n()
const taggers = ref([])
const tagger = ref('')
const descriptor = ref(null)
const values = ref({})
watch(locale, async () => {
  taggers.value = (await api.taggers.list(locale.value)).taggers
  if (!taggers.value.some((x) => x.id === tagger.value)) tagger.value = taggers.value[0]?.id ?? ''
}, { immediate: true })
watch([tagger, locale], async ([id]) => {
  descriptor.value = null          // limpa antes de buscar: o explorador remonta já com o repertório do novo etiquetador
  values.value = {}
  descriptor.value = id ? await api.taggers.options(id, locale.value).catch(() => null) : null
  values.value = descriptor.value?.suggested ?? {}
}, { immediate: true })
</script>
<template>
  <section class="flex flex-col gap-3" data-testid="tagger-tags">
    <label class="flex flex-wrap items-center gap-2">
      <span class="ttw-label">{{ t('tagset.choose_tagger') }}</span>
      <select v-model="tagger" class="select select-sm" data-testid="learn-tagger">
        <option v-for="tg in taggers" :key="tg.id" :value="tg.id">{{ t(`tagger.${tg.id}.name`) }}</option>
      </select>
    </label>
    <p class="text-sm opacity-80">{{ t('tagset.config_note') }}</p>
    <TagsetExplorer v-if="descriptor" :tagger="tagger" :descriptor="descriptor" :values="values" />
  </section>
</template>
