<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useSession } from '../stores/session.js'
import ProjectBar from '../components/ProjectBar.vue'
import AddCorpusWizard from '../components/AddCorpusWizard.vue'
import CorpusOverview from '../components/CorpusOverview.vue'

const { t } = useI18n()
const session = useSession()
const { corpora, corpus, layer, hasProject } = storeToRefs(session)
const adding = ref(false)
const wizardKey = ref(0)
const router = useRouter()
function tagNow(name) {
  session.setCorpus(name)
  adding.value = false
  router.push('/etiquetagem')
}

async function afterImport(name) {
  await session.refresh()
  session.setCorpus(name)
}
function showOverview(name) { session.setCorpus(name); adding.value = false }
function startAdd() { wizardKey.value++; adding.value = true }
</script>

<template>
  <div class="flex flex-col gap-4 max-w-5xl">
    <h1 class="text-2xl font-bold">{{ t('corpora.title') }}</h1>
    <ProjectBar />
    <template v-if="hasProject">
      <div class="flex items-center gap-2" data-explain="explain.corpora.library">
        <h2 class="text-xl font-bold">{{ t('corpora.library') }}</h2>
        <button id="importar-corpus" class="btn btn-sm btn-primary ml-auto" data-testid="add-corpus"
                :disabled="session.project?.single_corpus && corpora.length > 0" @click="startAdd">{{ t('corpora.add') }}</button>
      </div>
      <AddCorpusWizard v-if="adding" :key="wizardKey" @done="afterImport" @overview="showOverview"
                       @tag="tagNow" />
      <p v-if="!corpora.length && !adding" class="opacity-70">{{ t('corpora.none') }}</p>
      <p v-if="session.project?.single_corpus && corpora.length" class="text-xs opacity-70">{{ t('corpora.single_hint') }}</p>
      <ul class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" data-testid="corpus-list">
        <li v-for="c in corpora" :key="c.name">
          <button class="card bg-base-200 w-full text-left p-3 hover:bg-base-300" :class="{ 'ring-2 ring-primary': c.name === corpus }"
                  :aria-pressed="c.name === corpus" @click="session.setCorpus(c.name)">
            <span class="font-medium">{{ c.name }}</span>
            <span class="text-sm opacity-70">{{ t('corpora.documents', { n: c.documents }) }} · {{ c.layers.length }} {{ t('layers.title').toLowerCase() }}</span>
            <span v-if="c.name === corpus" class="badge badge-primary badge-sm mt-1">{{ t('corpora.active') }}</span>
          </button>
        </li>
      </ul>
      <template v-if="corpus">
        <div class="flex flex-wrap items-center gap-2 bg-base-200 rounded-box p-3">
          <p class="text-sm flex-1 min-w-64">{{ t('corpora.layers_hint') }}</p>
          <RouterLink to="/etiquetagem" class="btn btn-sm btn-primary" data-testid="go-tagging">{{ t('corpora.go_tagging') }}</RouterLink>
        </div>
        <CorpusOverview :corpus="corpus" :layer="layer" />
      </template>
    </template>
    <p class="text-sm opacity-80 flex flex-wrap items-center gap-2">{{ t('corpora.modules_hint') }}
      <RouterLink to="/modulos" class="btn btn-xs" data-testid="go-modules">{{ t('corpora.go_modules') }}</RouterLink></p>
  </div>
</template>
