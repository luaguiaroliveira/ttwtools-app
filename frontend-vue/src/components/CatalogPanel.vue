<script setup>
// Catálogo de corpora (instalar, ver a ficha, abrir, remover) e modelos baixáveis.
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { get, post } from '../api/client.js'
import { useJob } from '../composables/useJob.js'
import { useSession } from '../stores/session.js'
import JobProgress from './JobProgress.vue'

const { t } = useI18n()
const session = useSession()
const view = ref(null)
const url = ref('')
const models = ref([])
const job = useJob('catalog')
async function load() {
  view.value = await get('/api/catalog')
  url.value = view.value.url || ''
  models.value = (await get('/api/models')).spacy
}
onMounted(load)
async function saveUrl() { await post('/api/catalog/url', { url: url.value }); await load() }
async function install(id) { await job.start(() => post('/api/catalog/install', { id })); await load() }
async function remove(id) { await post('/api/catalog/remove', { id }); await load() }
async function download(name) { await job.start(() => post('/api/models/download', { name })); await load() }
const installedIds = () => new Set((view.value?.installed ?? []).map((i) => `${i.id}@${i.version}`))
</script>
<template>
  <div class="flex flex-col gap-3" v-if="view">
    <form class="flex flex-wrap gap-2 items-end" @submit.prevent="saveUrl">
      <label class="form-control flex-1 min-w-56"><span class="label-text">{{ t('catalog.url') }}</span>
        <input v-model="url" class="input input-sm" data-testid="catalog-url" /></label>
      <button class="btn btn-sm">{{ t('catalog.save_url') }}</button>
    </form>
    <p v-if="!view.url" class="text-sm opacity-70">{{ t('catalog.no_url') }} {{ t('corpora.catalog_soon') }}</p>
    <p v-if="view.error" role="alert" class="text-error text-sm">{{ view.error }}</p>
    <ul class="flex flex-col gap-2">
      <li v-for="p in view.packages" :key="p.id + p.version" class="bg-base-100 rounded-box p-3 flex flex-col gap-1">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-medium">{{ p.ficha.name }}</span><span class="badge badge-ghost">{{ p.version }}</span>
          <span class="badge badge-outline">{{ p.ficha.lang }}{{ p.ficha.variety ? ' · ' + p.ficha.variety : '' }}</span>
          <span v-if="p.ficha.size" class="text-xs opacity-70">{{ t('catalog.words', { n: p.ficha.size.words }) }}</span>
          <button v-if="(p.kind || 'package') === 'package' && !installedIds().has(`${p.id}@${p.version}`)" class="btn btn-xs btn-primary ml-auto"
                  :data-testid="`install-${p.id}`" @click="install(p.id)">{{ t('catalog.install') }}</button>
          <span v-else-if="p.kind === 'recipe'" class="text-xs ml-auto opacity-70">{{ t('catalog.recipe') }}</span>
        </div>
        <p class="text-xs opacity-80">{{ t('catalog.license') }}: {{ p.ficha.license.name }} · {{ t('catalog.source') }}: {{ p.ficha.source.citation || p.ficha.source.url }}
          <span v-if="p.ficha.period"> · {{ p.ficha.period }}</span><span v-if="p.ficha.genres"> · {{ p.ficha.genres.join(', ') }}</span></p>
      </li>
    </ul>
    <JobProgress :job="job.job.value" @cancel="job.cancel" />
    <template v-if="view.installed.length">
      <h3 class="font-bold text-sm">{{ t('catalog.installed') }}</h3>
      <ul class="flex flex-col gap-1">
        <li v-for="i in view.installed" :key="i.path" class="flex flex-wrap items-center gap-2 text-sm">
          {{ i.ficha.name }} <span class="badge badge-ghost">{{ i.version }}</span>
          <span v-for="u in view.updates ?? []" :key="u.id"><span v-if="u.id === i.id" class="badge badge-warning">{{ t('catalog.update', { v: u.latest }) }}</span></span>
          <button v-if="i.project" class="btn btn-xs ml-auto" @click="session.openProject(i.project)">{{ t('catalog.open') }}</button>
          <button class="btn btn-xs btn-ghost" @click="remove(i.id)">{{ t('catalog.remove') }}</button>
        </li>
      </ul>
    </template>
    <h3 class="font-bold text-sm">{{ t('catalog.models') }}</h3>
    <ul class="flex flex-wrap gap-2">
      <li v-for="m in models" :key="m.name" class="badge badge-lg gap-2">{{ m.name }}
        <span v-if="m.installed" class="text-success text-xs">{{ t('catalog.model_ok') }}</span>
        <button v-else class="btn btn-xs" @click="download(m.name)">{{ t('catalog.download') }}</button></li>
    </ul>
    <p class="text-xs opacity-60">{{ t('catalog.data_dir', { path: view.data_dir }) }}</p>
  </div>
</template>
