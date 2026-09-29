<script setup>
// Corpora do catálogo (instalar, ver a ficha, abrir, remover); endereço do catálogo em "avançado".
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { get, post } from '../api/client.js'
import { useJob } from '../composables/useJob.js'
import { useSession } from '../stores/session.js'
import JobProgress from './JobProgress.vue'
import Collapsible from './Collapsible.vue'

const { t } = useI18n()
const session = useSession()
const view = ref(null)
const url = ref('')
const job = useJob('catalog')
async function load() {
  view.value = await get('/api/catalog')
  url.value = view.value.url || ''
}
onMounted(load)
watch(() => job.job.value?.status, (s) => { if (s && !['queued', 'running'].includes(s)) load() })
async function saveUrl() { await post('/api/catalog/url', { url: url.value }); await load() }
function install(id) { job.start(() => post('/api/catalog/install', { id })) }
async function remove(id) { await post('/api/catalog/remove', { id }); await load() }
const installedIds = () => new Set((view.value?.installed ?? []).map((i) => `${i.id}@${i.version}`))
</script>
<template>
  <div class="flex flex-col gap-3" v-if="view">
    <p class="text-sm opacity-80">{{ t('modules.corpora_intro') }}</p>
    <p v-if="!view.url" class="text-sm text-text-muted">{{ t('catalog.no_url') }} {{ t('corpora.catalog_soon') }}</p>
    <p v-if="view.error" role="alert" class="text-error text-sm">{{ view.error }}</p>
    <ul class="flex flex-col gap-2">
      <li v-for="p in view.packages" :key="p.id + p.version" class="bg-base-100 rounded-box p-3 flex flex-col gap-1">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-medium">{{ p.ficha.name }}</span><span class="badge badge-ghost">{{ p.version }}</span>
          <span class="badge badge-outline">{{ p.ficha.lang }}{{ p.ficha.variety ? ' · ' + p.ficha.variety : '' }}</span>
          <span v-if="p.ficha.size" class="text-xs text-text-muted">{{ t('catalog.words', { n: p.ficha.size.words }) }}</span>
          <span class="badge badge-outline badge-sm">{{ p.ficha.license.name }}</span>
          <button v-if="(p.kind || 'package') === 'package' && !installedIds().has(`${p.id}@${p.version}`)" class="btn btn-xs btn-primary ml-auto"
                  :data-testid="`install-${p.id}`" @click="install(p.id)">{{ t('catalog.install') }}</button>
          <span v-else-if="p.kind === 'recipe'" class="text-xs ml-auto text-text-muted">{{ t('catalog.recipe') }}</span>
        </div>
        <p v-if="p.ficha.description" class="text-sm">{{ p.ficha.description }}</p>
        <details class="text-xs">
          <summary class="cursor-pointer opacity-80">{{ t('modules.details') }}</summary>
          <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mt-1">
            <dt class="text-text-muted">{{ t('catalog.source') }}</dt>
            <dd><a v-if="p.ficha.source.url" class="link" :href="p.ficha.source.url" target="_blank" rel="noopener">{{ p.ficha.source.citation || p.ficha.source.url }}</a>
              <span v-else>{{ p.ficha.source.citation }}</span></dd>
            <dt class="text-text-muted">{{ t('catalog.license') }}</dt>
            <dd><a v-if="p.ficha.license.url" class="link" :href="p.ficha.license.url" target="_blank" rel="noopener">{{ p.ficha.license.name }}</a>
              <span v-else>{{ p.ficha.license.name }}</span></dd>
            <template v-if="p.ficha.period"><dt class="text-text-muted">·</dt><dd>{{ p.ficha.period }}</dd></template>
            <template v-if="p.ficha.genres"><dt class="text-text-muted">·</dt><dd>{{ p.ficha.genres.join(', ') }}</dd></template>
          </dl>
        </details>
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
    <Collapsible :title="t('modules.advanced')">
      <form class="flex flex-wrap gap-2 items-end" @submit.prevent="saveUrl">
        <label class="ttw-field flex-1 min-w-56"><span class="ttw-label">{{ t('catalog.url') }}</span>
          <input v-model="url" class="input input-sm" data-testid="catalog-url" /></label>
        <button class="btn btn-sm">{{ t('catalog.save_url') }}</button>
      </form>
      <p class="text-xs text-text-muted mt-2">{{ t('catalog.data_dir', { path: view.data_dir }) }}</p>
    </Collapsible>
  </div>
</template>
