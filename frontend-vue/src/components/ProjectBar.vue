<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useSession } from '../stores/session.js'
import { api } from '../api/index.js'
import { useJob } from '../composables/useJob.js'
import JobProgress from './JobProgress.vue'
import Collapsible from './Collapsible.vue'

const { t } = useI18n()
const session = useSession()
const { project } = storeToRefs(session)
const path = ref('')
const error = ref(null)
const busy = ref(false)
const saveAsPath = ref('')
const saveAsFormat = ref('ttwt')
const exportDest = ref('')
const done = ref('')
const saveJob = useJob('saveas')
const { opening } = storeToRefs(session)
async function saveAs() {
  done.value = ''
  await saveJob.start(() => api.project.saveAs(saveAsPath.value, saveAsFormat.value))
  if (saveJob.job.value?.status === 'done') done.value = t('project.saved', { path: saveAsPath.value })
}
const exportAll = () => act(async () => {
  const r = await api.project.exportAll(exportDest.value)
  done.value = t('project.exported', { n: ['corpora', 'tagged', 'tables', 'kfa'].reduce((a, k) => a + (r[k] ?? 0), 0), dest: r.dest })
})

async function act(fn) {
  error.value = null
  busy.value = true
  try { await fn() } catch (err) { error.value = err.message } finally { busy.value = false }
}
const open = () => act(() => session.openProject(path.value))
const create = () => act(() => session.createProject(path.value))
const choose = () => act(async () => { const r = await api.utils.pickFile(); if (r?.path) { path.value = r.path; await open() } })
const convert = (to) => act(async () => { await api.project.convert(to); await session.refresh() })
const exportCorpus = () => act(async () => { await api.project.exportCorpus(); await session.refresh() })
</script>

<template>
  <section class="flex flex-col gap-2 bg-base-200 rounded-box p-3" data-explain="explain.corpora.project">
    <div v-if="project" class="flex flex-wrap items-center gap-2 text-sm">
      <span class="font-medium">{{ project.name }}</span>
      <span class="badge badge-outline">{{ t(`project.kind.${project.kind}`) }}</span>
      <span class="opacity-60 truncate max-w-full">{{ project.path }}</span>
      <div class="ml-auto flex gap-1">
        <button v-if="project.kind === 'ttwa'" class="btn btn-xs" :disabled="busy" @click="convert('ttwl')">{{ t('project.to_ttwl') }}</button>
        <button v-else class="btn btn-xs" :disabled="busy" @click="convert('ttwa')">{{ t('project.to_ttwa') }}</button>
        <button class="btn btn-xs" :disabled="busy" @click="exportCorpus">{{ t('project.export_corpus') }}</button>
      </div>
      <p v-if="project.kind === 'ttwl' && (project.corpus_status.missing || project.corpus_status.changed)" role="alert"
         class="alert alert-warning w-full text-sm py-1">
        {{ t('project.corpus_missing', { missing: project.corpus_status.missing, changed: project.corpus_status.changed }) }}
      </p>
    </div>
    <p v-else class="text-sm">{{ t('project.none') }}</p>
    <form class="flex flex-wrap gap-2" @submit.prevent="open">
      <label class="sr-only" for="project-path">{{ t('project.path') }}</label>
      <input id="project-path" v-model="path" class="input input-sm flex-1 min-w-48" :placeholder="t('project.path')" data-testid="project-path" />
      <button type="button" class="btn btn-sm" :disabled="busy" @click="choose">{{ t('project.choose_file') }}</button>
      <button type="submit" class="btn btn-sm btn-primary" :disabled="busy || !path" data-testid="project-open">{{ t('project.open') }}</button>
      <button type="button" class="btn btn-sm" :disabled="busy || !path" data-testid="project-create" @click="create">{{ t('project.create') }}</button>
    </form>
    <JobProgress v-if="opening" :job="opening" />
    <Collapsible v-if="project" :title="t('project.save_as') + ' · ' + t('project.export_all')">
      <div class="flex flex-col gap-3">
        <form class="flex flex-wrap gap-2 items-end" @submit.prevent="saveAs">
          <label class="form-control flex-1 min-w-48"><span class="label-text">{{ t('project.save_as_path') }}</span>
            <input v-model="saveAsPath" class="input input-sm" data-testid="saveas-path" /></label>
          <select v-model="saveAsFormat" class="select select-sm" :aria-label="t('project.save_as')">
            <option value="ttwt">{{ t('project.format.ttwt') }}</option><option value="ttwa">{{ t('project.format.ttwa') }}</option></select>
          <button class="btn btn-sm" :disabled="!saveAsPath" data-testid="saveas-go">{{ t('project.save') }}</button>
        </form>
        <JobProgress :job="saveJob.job.value" @cancel="saveJob.cancel" />
        <form class="flex flex-wrap gap-2 items-end" @submit.prevent="exportAll">
          <label class="form-control flex-1 min-w-48"><span class="label-text">{{ t('project.export_dest') }}</span>
            <input v-model="exportDest" class="input input-sm" /></label>
          <button class="btn btn-sm" :disabled="busy">{{ t('project.export_all') }}</button>
        </form>
        <p v-if="done" role="status" class="text-sm text-success">{{ done }}</p>
      </div>
    </Collapsible>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
  </section>
</template>
