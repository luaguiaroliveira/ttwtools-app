<script setup>
// Barra "Arquivo": Novo, Abrir, Salvar e Salvar como, pelos diálogos do sistema; o resto em
// "Mais opções". Os arquivos são salvos compactados por padrão: abertos, ficam numa cópia de
// trabalho e Salvar grava de volta. Sem compressão (opção avançada) o banco grava sozinho.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useSession } from '../stores/session.js'
import { api } from '../api/index.js'
import { useJob } from '../composables/useJob.js'
import JobProgress from './JobProgress.vue'
import BusyModal from './BusyModal.vue'
import Collapsible from './Collapsible.vue'
import FileIcon from './FileIcon.vue'
import RecentList from './RecentList.vue'
import ExportDialog from './ExportDialog.vue'

const { t } = useI18n()
const session = useSession()
const { project, opening, corpora } = storeToRefs(session)
const path = ref('')
const error = ref(null)
const busy = ref(false)
const exportDest = ref('')
const done = ref('')
const saveJob = useJob('save')
const pending = ref(null)          // ação à espera de "salvar antes?" (projeto de .ttwt)
const fromTtwt = computed(() => Boolean(project.value?.compressed))
// opções de gravação do arquivo (lembradas nele): compactar e guardar as tabelas de busca
const opts = computed(() => project.value?.save_options ?? { compress: true, search_tables: true })
const optsNote = ref('')
async function setOption(key, value) {
  optsNote.value = ''
  const r = await api.project.setSaveOptions({ [key]: value })
  await session.refresh()
  if (r.needs_save_as) optsNote.value = t('project.options_need_save_as')
}
const exportOpen = ref(false)
const ext = computed(() => (shown.value || '').split('.').pop().toLowerCase())
const shown = computed(() => project.value?.display_path ?? project.value?.path)
const stem = computed(() => (shown.value || 'projeto').split(/[\\/]/).pop().replace(/\.[^.]+$/, ''))
const saving = computed(() => ['queued', 'running'].includes(saveJob.job.value?.status))

async function act(fn) {
  error.value = null
  done.value = ''
  busy.value = true
  try { await fn() } catch (err) { error.value = err.message } finally { busy.value = false }
}
// o diálogo de salvar do sistema já pergunta se pode substituir: aqui não se pergunta de novo
const doNew = () => act(async () => {
  const r = await api.utils.pickSave('novo_projeto.ttwa')
  if (r?.path) await session.createProject(r.path, true)
})
const doOpen = () => act(async () => {
  const r = await api.utils.pickFile()
  if (r?.path) await session.openProject(r.path)
})
// projeto aberto de um .ttwt: antes de trocar de projeto, oferece salvar (a cópia de trabalho some)
async function guard(action) {
  if (fromTtwt.value) await session.refresh()
  if (project.value?.unsaved) pending.value = action; else action()
}
const newProject = () => guard(doNew)
// recentes: lista guardada pelo servidor (a mesma da linha de comando: `ttwtools recent`)
const recent = ref([])
const recentMenu = ref(null)
const loadRecent = async () => { try { recent.value = (await api.project.recent()).files } catch { recent.value = [] } }
const removeRecent = async (p) => { recent.value = (await api.project.recentRemove(p)).files }
const openRecent = (p) => { if (recentMenu.value) recentMenu.value.open = false; guard(() => act(() => session.openProject(p))) }
watch(() => [project.value?.path, project.value?.display_path], loadRecent, { immediate: true })
const openProject = () => guard(doOpen)
async function resolvePending(saveFirst) {
  const action = pending.value
  pending.value = null
  if (saveFirst) { afterSave.value = action; save(); return }
  action?.()
}

const lastSaved = ref('')
const afterSave = ref(null)
function save() {
  error.value = null
  done.value = ''
  act(async () => {
    const r = await api.project.save()
    if (r.status === 'autosaved') { done.value = t('project.autosaved_now'); return }
    lastSaved.value = shown.value
    saveJob.start(async () => r)
  })
}
const saveAs = () => act(async () => {
  const keep = ['ttwa', 'ttwl'].includes(ext.value) ? ext.value : 'ttwa'
  const r = await api.utils.pickSave(`${stem.value}.${keep}`)
  if (!r?.path) return
  lastSaved.value = r.path
  saveJob.start(() => api.project.saveAs(r.path))
})
// exportar: um corpus (.ttwc/.ttwcl) ou um pacote leve com vários (.ttwal); é uma cópia, o projeto aberto não muda
const exportTo = (opts) => act(async () => {
  exportOpen.value = false
  const { kind, corpus, corpora: picked } = opts
  const base = kind === 'ttwal' ? stem.value : corpus
  const r = await api.utils.pickSave(`${base}.${kind}`)
  if (!r?.path) return
  const path = new RegExp(`\\.${kind}$`, 'i').test(r.path) ? r.path : r.path.replace(/\.[^.\\/]+$/, '') + `.${kind}`
  lastSaved.value = path
  saveJob.start(() => api.project.saveAs(path, kind === 'ttwal' ? { corpora: picked } : { corpus }))
})
watch(() => saveJob.job.value?.status, async (s) => {
  if (s === 'done') {
    done.value = t('project.saved', { path: lastSaved.value })
    await session.refresh()
    const next = afterSave.value
    afterSave.value = null
    next?.()
  }
})

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
    <!-- barra de ações, como num aplicativo comum: sempre visível, à esquerda -->
    <div class="flex flex-wrap items-stretch gap-1 bg-base-100 border border-base-300 rounded-box p-1.5 w-fit max-w-full shadow-sm" role="toolbar" :aria-label="t('nav.corpora')">
      <button class="pbtn" :class="{ 'btn-primary': !project }" :disabled="busy || saving" data-testid="project-new" @click="newProject"><FileIcon name="new" />{{ t('project.new') }}</button>
      <button class="pbtn" :disabled="busy || saving" data-testid="project-open-dialog" @click="openProject"><FileIcon name="open" />{{ t('project.open_dialog') }}</button>
      <details ref="recentMenu" class="dropdown">
        <summary class="pbtn" data-testid="project-recent"><FileIcon name="recent" />{{ t('project.recent') }}</summary>
        <div class="dropdown-content z-30 bg-base-200 border border-base-300 rounded-box shadow-lg p-2 w-96 max-w-[90vw] mt-1">
          <RecentList :files="recent" :disabled="busy || saving" @open="openRecent" @remove="removeRecent" @clear="removeRecent(null)" />
        </div>
      </details>
      <span class="w-px bg-base-300 mx-1 self-stretch" aria-hidden="true" />
      <button class="pbtn" :class="{ 'btn-primary': fromTtwt }" :disabled="!project || busy || saving" data-testid="project-save" @click="save"><FileIcon name="save" />{{ t('project.save') }}</button>
      <button class="pbtn" :disabled="!project || busy || saving" data-testid="project-save-as" @click="saveAs"><FileIcon name="saveas" />{{ t('project.save_as') }}</button>
      <button class="pbtn" :disabled="!project || busy || saving || !corpora.length" data-testid="project-export" @click="exportOpen = true"><FileIcon name="export" />{{ t('project.export') }}</button>
    </div>
    <div v-if="project" class="flex flex-wrap items-center gap-2 text-sm min-w-0">
      <span class="font-medium">{{ project.name }}</span>
      <span class="badge badge-outline" data-testid="project-kind">{{ t(`project.ext.${ext}`) }}</span>
      <span v-if="fromTtwt" class="badge badge-ghost">{{ t('project.compressed') }}</span>
      <span class="text-text-muted truncate max-w-full" data-testid="project-current-path">{{ shown }}</span>
    </div>
    <fieldset v-if="project" class="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm" data-testid="save-options"
              data-explain="explain.corpora.save_options">
      <legend class="sr-only">{{ t('project.options_title') }}</legend>
      <span class="text-xs font-medium opacity-80">{{ t('project.options_title') }}:</span>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="toggle toggle-sm toggle-primary" :checked="opts.compress" data-testid="opt-compress"
               @change="setOption('compress', $event.target.checked)" />
        <span>{{ t('project.opt_compress') }} <span class="text-xs text-text-muted">— {{ opts.compress ? t('project.opt_compress_on') : t('project.opt_compress_off') }}</span></span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="toggle toggle-sm toggle-primary" :checked="opts.search_tables" data-testid="opt-search-tables"
               @change="setOption('search_tables', $event.target.checked)" />
        <span>{{ t('project.opt_search_tables') }} <span class="text-xs text-text-muted">— {{ opts.search_tables ? t('project.opt_search_on') : t('project.opt_search_off') }}</span></span>
      </label>
      <details class="text-xs w-full">
        <summary class="cursor-pointer opacity-80">{{ t('project.options_more') }}</summary>
        <ul class="list-disc ml-5 mt-1 flex flex-col gap-1">
          <li>{{ t('project.options_help_compress') }}</li>
          <li>{{ t('project.options_help_search') }}</li>
          <li>{{ t('project.options_help_example') }}</li>
        </ul>
      </details>
      <p v-if="optsNote" role="status" class="text-xs text-warning w-full">{{ optsNote }}</p>
    </fieldset>
    <p v-if="project && !fromTtwt" class="text-xs text-text-muted flex items-center gap-1" data-testid="autosave-note">
      <span class="badge badge-success badge-xs" aria-hidden="true">✓</span>{{ t('project.autosave') }}</p>
    <p v-if="fromTtwt" class="text-xs opacity-80 flex flex-wrap items-center gap-1" data-testid="ttwt-note">
      <span v-if="project.unsaved" class="badge badge-warning badge-xs" data-testid="unsaved-badge">{{ t('project.unsaved_badge') }}</span>
      <span v-else class="badge badge-success badge-xs" aria-hidden="true">✓</span>{{ t('project.ttwt_working_copy') }}</p>

    <div v-if="pending" role="alertdialog" aria-modal="false" :aria-label="t('project.unsaved_title')"
         class="alert alert-warning flex flex-wrap items-center gap-2 text-sm" data-testid="unsaved-prompt">
      <span class="flex-1 min-w-48">{{ t('project.unsaved_text') }}</span>
      <button class="btn btn-xs btn-primary" data-testid="unsaved-save" @click="resolvePending(true)">{{ t('project.save_and_continue') }}</button>
      <button class="btn btn-xs" data-testid="unsaved-discard" @click="resolvePending(false)">{{ t('project.continue_without_saving') }}</button>
      <button class="btn btn-xs btn-ghost" @click="pending = null">{{ t('project.cancel') }}</button>
    </div>

    <p v-if="project?.kind === 'ttwl' && (project.corpus_status.missing || project.corpus_status.changed)" role="alert"
       class="alert alert-warning w-full text-sm py-1">
      {{ t('project.corpus_missing', { missing: project.corpus_status.missing, changed: project.corpus_status.changed }) }}
    </p>
    <BusyModal :open="Boolean(opening)" :title="t('project.opening_title')" :job="opening" @cancel="api.jobs.cancel(opening.id)">
      <p v-if="opening?.stage === 'migrate'" class="text-xs text-text-muted mt-2">{{ t('project.migrate_hint') }}</p>
    </BusyModal>
    <ExportDialog :open="exportOpen" :corpora="corpora" :busy="busy || saving" @close="exportOpen = false" @export="exportTo" />
    <BusyModal :open="saving" :title="t('project.saving_title')" :job="saveJob.job.value" @cancel="saveJob.cancel" />
    <JobProgress v-if="saveJob.job.value?.status === 'error'" :job="saveJob.job.value" />
    <p v-if="done" role="status" class="text-sm flex items-center gap-1" data-testid="file-done"><span class="badge badge-success badge-sm" aria-hidden="true">✓</span>{{ done }}</p>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <Collapsible v-if="project" :title="t('project.more')">
      <div class="flex flex-col gap-3">
        <form class="flex flex-col gap-1" @submit.prevent="openTyped">
          <label class="ttw-label" for="project-path">{{ t('project.type_path') }}</label>
          <div class="flex flex-wrap gap-2">
            <input id="project-path" v-model="path" class="input input-sm flex-1 min-w-48" :placeholder="t('project.path')" data-testid="project-path" />
            <button type="submit" class="btn btn-sm" :disabled="busy || !path" data-testid="project-open">{{ t('project.open') }}</button>
            <button type="button" class="btn btn-sm" :disabled="busy || !path" data-testid="project-create" @click="createTyped()">{{ t('project.create') }}</button>
          </div>
          <p v-if="exists" role="alert" class="text-sm text-warning flex flex-wrap items-center gap-2">{{ t('project.exists') }}
            <button type="button" class="btn btn-xs btn-warning" data-testid="project-overwrite" @click="createTyped(true)">{{ t('project.overwrite') }}</button></p>
          <span class="text-xs text-text-muted">{{ t('project.type_path_hint') }}</span>
        </form>
        <template v-if="project">
          <p class="text-xs opacity-80">{{ t('project.formats_hint') }}</p>
          <div class="flex flex-wrap gap-1">
            <button v-if="project.kind === 'ttwa'" class="btn btn-xs" :disabled="busy" @click="convert('ttwl')">{{ t('project.to_ttwl') }}</button>
            <button v-else class="btn btn-xs" :disabled="busy" @click="convert('ttwa')">{{ t('project.to_ttwa') }}</button>
            <button class="btn btn-xs" :disabled="busy" @click="exportCorpus">{{ t('project.export_corpus') }}</button>
          </div>
          <form class="flex flex-wrap gap-2 items-end" @submit.prevent="exportAll">
            <label class="ttw-field flex-1 min-w-48"><span class="ttw-label">{{ t('project.export_dest') }}</span>
              <input v-model="exportDest" class="input input-sm" /></label>
            <button class="btn btn-sm" :disabled="busy">{{ t('project.export_all') }}</button>
          </form>
        </template>
      </div>
    </Collapsible>
  </section>
</template>
