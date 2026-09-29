<script setup>
// Modelos de etiquetagem (ttwtools.models.list_models): ficha curta por modelo, detalhes recolhidos.
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { get, post } from '../api/client.js'
import { useJob } from '../composables/useJob.js'
import JobProgress from './JobProgress.vue'

const { t, locale } = useI18n()
const models = ref([])
const error = ref(null)
const job = useJob('model_download')
async function load() {
  try { models.value = (await get('/api/models', { lang: locale.value })).models } catch (err) { error.value = err.message }
}
onMounted(load)
watch(locale, load)
const byLang = computed(() => {
  const groups = {}
  for (const m of models.value) (groups[m.lang] ||= []).push(m)
  return Object.entries(groups)
})
const busy = computed(() => ['queued', 'running'].includes(job.job.value?.status))
watch(() => job.job.value?.status, (s) => {
  if (s === 'error') error.value = job.job.value.error
  if (s && !['queued', 'running'].includes(s)) load()
})
function download(id) {
  error.value = null
  job.start(() => post('/api/models/download', { name: id }))
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm opacity-80">{{ t('modules.models_intro') }}</p>
    <JobProgress :job="job.job.value" @cancel="job.cancel" />
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <section v-for="[lang, list] in byLang" :key="lang" class="flex flex-col gap-2">
      <h3 class="font-bold capitalize">{{ t('model.lang.' + lang) }}</h3>
      <ul class="grid gap-2 lg:grid-cols-2">
        <li v-for="m in list" :key="m.id" class="bg-base-100 rounded-box p-3 flex flex-col gap-1" :data-testid="`model-${m.id}`">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-medium">{{ m.name }}</span>
            <span v-if="m.download_mb" class="badge badge-ghost badge-sm">{{ t('modules.size_mb', { n: m.download_mb }) }}</span>
            <span class="badge badge-outline badge-sm">{{ m.license }}</span>
            <span v-if="m.installed" class="badge badge-success badge-sm ml-auto">{{ t('catalog.model_ok') }}</span>
            <span v-else-if="!m.available" class="badge badge-warning badge-sm ml-auto">{{ t('modules.unavailable') }}</span>
            <button v-else class="btn btn-xs btn-primary ml-auto" :disabled="busy" @click="download(m.id)">{{ t('catalog.download') }}</button>
          </div>
          <p class="text-sm">{{ m.about }}</p>
          <p v-if="m.reason" class="text-xs text-warning">{{ m.reason }}</p>
          <details class="text-xs">
            <summary class="cursor-pointer opacity-80">{{ t('modules.details') }}</summary>
            <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mt-1">
              <dt class="text-text-muted">{{ t('modules.id') }}</dt><dd><code>{{ m.id }}</code></dd>
              <dt class="text-text-muted">{{ t('catalog.source') }}</dt><dd><a class="link" :href="m.source_url" target="_blank" rel="noopener">{{ m.source }}</a></dd>
              <dt class="text-text-muted">{{ t('modules.download_from') }}</dt><dd>{{ m.download_from }}</dd>
              <dt class="text-text-muted">{{ t('catalog.license') }}</dt><dd><a class="link" :href="m.license_url" target="_blank" rel="noopener">{{ m.license }}</a></dd>
              <dt class="text-text-muted">{{ t('modules.trained_on') }}</dt><dd>{{ m.trained_on.join(' · ') }}</dd>
            </dl>
          </details>
        </li>
      </ul>
    </section>
  </div>
</template>
