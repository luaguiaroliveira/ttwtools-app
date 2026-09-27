<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useSession } from '../stores/session.js'
import { api } from '../api/index.js'

const { t } = useI18n()
const session = useSession()
const { project } = storeToRefs(session)
const path = ref('')
const error = ref(null)
const busy = ref(false)

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
  <section class="flex flex-col gap-2 bg-base-200 rounded-box p-3">
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
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
  </section>
</template>
