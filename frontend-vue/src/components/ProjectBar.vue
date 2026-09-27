<script setup>
// Projeto: Novo, Abrir e Salvar cópia pelos diálogos do sistema; o resto em "Mais opções".
// O .ttwa grava sozinho (SQLite), por isso não há "Salvar": "Salvar cópia" gera outro arquivo.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useSession } from '../stores/session.js'
import { api } from '../api/index.js'
import { useJob } from '../composables/useJob.js'
import JobProgress from './JobProgress.vue'
import Collapsible from './Collapsible.vue'

const { t } = useI18n()
const session = useSession()
const { project, opening } = storeToRefs(session)
const path = ref('')
const error = ref(null)
const busy = ref(false)
const saveAsFormat = ref('ttwt')
const exportDest = ref('')
const done = ref('')
const saveJob = useJob('saveas')
const stem = computed(() => (project.value?.path || 'projeto').split(/[\\/]/).pop().replace(/\.[^.]+$/, ''))

async function act(fn) {
  error.value = null
  done.value = ''
  busy.value = true
  try { await fn() } catch (err) { error.value = err.message } finally { busy.value = false }
}
// o diálogo de salvar do sistema já pergunta se pode substituir: aqui não se pergunta de novo
const newProject = () => act(async () => {
  const r = await api.utils.pickSave('novo_projeto.ttwa')
  if (r?.path) await session.createProject(r.path, true)
})
const openProject = () => act(async () => {
  const r = await api.utils.pickFile()
  if (r?.path) await session.openProject(r.path)
})
const saveCopy = () => act(async () => {
  const r = await api.utils.pickSave(`${stem.value}.${saveAsFormat.value}`)
  if (!r?.path) return
  const format = r.path.toLowerCase().endsWith('.ttwa') ? 'ttwa' : 'ttwt'
  savingTo.value = r.path
  await saveJob.start(() => api.project.saveAs(r.path, format))
})
const savingTo = ref('')
watch(() => saveJob.job.value?.status, (s) => { if (s === 'done') done.value = t('project.saved', { path: savingTo.value }) })
const openTyped = () => act(() => session.openProject(path.value))
// caminho digitado: se já existe, avisa e oferece "Substituir"
const exists = ref(false)
const createTyped = (overwrite = false) => act(async () => {
  exists.value = false
  try { await session.createProject(path.value, overwrite) } catch (err) {
    if (err.status === 409) { exists.value = true; return }
    throw err
  }
})
const convert = (to) => act(async () => { await api.project.convert(to); await session.refresh() })
const exportCorpus = () => act(async () => { await api.project.exportCorpus(); await session.refresh() })
const exportAll = () => act(async () => {
  const r = await api.project.exportAll(exportDest.value)
  done.value = t('project.exported', { n: ['corpora', 'tagged', 'tables', 'kfa'].reduce((a, k) => a + (r[k] ?? 0), 0), dest: r.dest })
})
</script>

<template>
  <section class="flex flex-col gap-2 bg-base-200 rounded-box p-3" data-explain="explain.corpora.project">
    <div class="flex flex-wrap items-center gap-2">
      <div v-if="project" class="flex flex-wrap items-center gap-2 text-sm min-w-0 flex-1">
        <span class="font-medium">{{ project.name }}</span>
        <span class="badge badge-outline">{{ t(`project.kind.${project.kind}`) }}</span>
        <span class="opacity-60 truncate max-w-full" data-testid="project-current-path">{{ project.path }}</span>
      </div>
      <p v-else class="text-sm flex-1 min-w-48">{{ t('project.intro') }}</p>
      <div class="flex flex-wrap gap-1" role="group" :aria-label="t('corpora.title')">
        <button class="btn btn-sm" :class="{ 'btn-primary': !project }" :disabled="busy" data-testid="project-new" @click="newProject">{{ t('project.new') }}</button>
        <button class="btn btn-sm" :class="{ 'btn-primary': !project }" :disabled="busy" data-testid="project-open-dialog" @click="openProject">{{ t('project.open_dialog') }}</button>
        <button v-if="project" class="btn btn-sm" :disabled="busy" data-testid="project-save-copy" @click="saveCopy">{{ t('project.save_copy') }}</button>
      </div>
    </div>
    <p v-if="project" class="text-xs opacity-70">{{ t('project.autosave') }}</p>
    <p v-if="project?.kind === 'ttwl' && (project.corpus_status.missing || project.corpus_status.changed)" role="alert"
       class="alert alert-warning w-full text-sm py-1">
      {{ t('project.corpus_missing', { missing: project.corpus_status.missing, changed: project.corpus_status.changed }) }}
    </p>
    <JobProgress v-if="opening" :job="opening" @cancel="api.jobs.cancel(opening.id)" />
    <p v-if="opening?.stage === 'migrate'" class="text-xs opacity-70">{{ t('project.migrate_hint') }}</p>
    <JobProgress :job="saveJob.job.value" @cancel="saveJob.cancel" />
    <p v-if="done" role="status" class="text-sm flex items-center gap-1"><span class="badge badge-success badge-sm" aria-hidden="true">✓</span>{{ done }}</p>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <Collapsible :title="project ? t('project.more') : t('project.type_path')">
      <div class="flex flex-col gap-3">
        <form class="flex flex-col gap-1" @submit.prevent="openTyped">
          <label class="label-text" for="project-path">{{ t('project.type_path') }}</label>
          <div class="flex flex-wrap gap-2">
            <input id="project-path" v-model="path" class="input input-sm flex-1 min-w-48" :placeholder="t('project.path')" data-testid="project-path" />
            <button type="submit" class="btn btn-sm" :disabled="busy || !path" data-testid="project-open">{{ t('project.open') }}</button>
            <button type="button" class="btn btn-sm" :disabled="busy || !path" data-testid="project-create" @click="createTyped()">{{ t('project.create') }}</button>
          </div>
          <p v-if="exists" role="alert" class="text-sm text-warning flex flex-wrap items-center gap-2">{{ t('project.exists') }}
            <button type="button" class="btn btn-xs btn-warning" data-testid="project-overwrite" @click="createTyped(true)">{{ t('project.overwrite') }}</button></p>
          <span class="text-xs opacity-70">{{ t('project.type_path_hint') }}</span>
        </form>
        <template v-if="project">
          <label class="form-control max-w-xs"><span class="label-text">{{ t('project.copy_format') }}</span>
            <select v-model="saveAsFormat" class="select select-sm">
              <option value="ttwt">{{ t('project.format.ttwt') }}</option><option value="ttwa">{{ t('project.format.ttwa') }}</option></select></label>
          <div class="flex flex-wrap gap-1">
            <button v-if="project.kind === 'ttwa'" class="btn btn-xs" :disabled="busy" @click="convert('ttwl')">{{ t('project.to_ttwl') }}</button>
            <button v-else class="btn btn-xs" :disabled="busy" @click="convert('ttwa')">{{ t('project.to_ttwa') }}</button>
            <button class="btn btn-xs" :disabled="busy" @click="exportCorpus">{{ t('project.export_corpus') }}</button>
          </div>
          <form class="flex flex-wrap gap-2 items-end" @submit.prevent="exportAll">
            <label class="form-control flex-1 min-w-48"><span class="label-text">{{ t('project.export_dest') }}</span>
              <input v-model="exportDest" class="input input-sm" /></label>
            <button class="btn btn-sm" :disabled="busy">{{ t('project.export_all') }}</button>
          </form>
        </template>
      </div>
    </Collapsible>
  </section>
</template>
