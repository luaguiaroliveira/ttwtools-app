<script setup>
// Etiquetagem: acrescentar camadas de informação ao corpus ativo. Escolhe-se agora (lista
// "a executar", guardada no projeto) e calcula-se depois, em "Executar análise e etiquetagem".
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { get, post, request } from '../api/client.js'
import { api } from '../api/index.js'
import { useSession } from '../stores/session.js'
import { useJob } from '../composables/useJob.js'
import TaggerCard from '../components/TaggerCard.vue'
import LayersList from '../components/LayersList.vue'
import PipelineProgress from '../components/PipelineProgress.vue'

const { t, locale } = useI18n()
const session = useSession()
const { corpus, corpora, hasProject } = storeToRefs(session)
const taggers = ref([])
const steps = ref([])
const error = ref(null)
const layersRef = ref(null)
const job = useJob('pipeline')
const enc = (c) => encodeURIComponent(c)

async function loadSteps() {
  if (!corpus.value) { steps.value = []; return }
  try { steps.value = (await get(`/api/corpora/${enc(corpus.value)}/pipeline`)).steps } catch (err) { error.value = err.message }
}
onMounted(async () => {
  taggers.value = (await api.taggers.list(locale.value)).taggers
  job.resume()
})
watch(corpus, loadSteps, { immediate: true })

async function add(step) {
  error.value = null
  try { steps.value = (await post(`/api/corpora/${enc(corpus.value)}/pipeline`, step)).steps } catch (err) { error.value = err.message }
}
async function remove(i) {
  steps.value = (await request('DELETE', `/api/corpora/${enc(corpus.value)}/pipeline/${i}`)).steps
}
const running = computed(() => ['queued', 'running'].includes(job.job.value?.status))
function run() { job.start(() => post(`/api/corpora/${enc(corpus.value)}/pipeline/run`)) }
watch(() => job.job.value?.status, async (s) => {
  if (s && !['queued', 'running'].includes(s)) { await loadSteps(); await session.refresh(); layersRef.value?.reload() }
})
const statsQueued = computed(() => steps.value.some((s) => s.kind === 'stats'))
const tagName = (id) => t(`tagger.${id}.name`)
const optionsText = (o) => Object.entries(o ?? {}).map(([k, v]) => `${k}=${Array.isArray(v) ? v.join('+') : v}`).join(' · ')
</script>

<template>
  <div class="flex flex-col gap-6 max-w-5xl">
    <div>
      <h1 class="text-2xl font-bold">{{ t('pipeline.title') }}</h1>
      <p class="opacity-80">{{ t('pipeline.intro') }}</p>
    </div>
    <p v-if="!hasProject || !corpora.length" class="opacity-70">{{ t('pipeline.need_corpus') }}
      <RouterLink to="/arquivo" class="link">{{ t('nav.corpora') }}</RouterLink></p>
    <template v-else>
      <label class="flex flex-col gap-1 w-fit"><span class="label-text">{{ t('pipeline.corpus') }}</span>
        <select class="select select-sm" :value="corpus" data-testid="pipeline-corpus" @change="session.setCorpus($event.target.value)">
          <option v-if="!corpus" value="" disabled>—</option>
          <option v-for="c in corpora" :key="c.name" :value="c.name">{{ c.name }}</option></select></label>

      <template v-if="corpus">
        <!-- 1. o que o corpus já tem -->
        <section class="flex flex-col gap-2 bg-base-200 rounded-box p-3" data-explain="explain.pipeline.have">
          <LayersList ref="layersRef" :corpus="corpus" :title="t('pipeline.have_title')" />
        </section>

        <!-- 2. acrescentar camadas -->
        <section id="adicionar-camadas" class="flex flex-col gap-4" :aria-label="t('pipeline.add_title')" data-explain="explain.pipeline.add">
          <div>
            <h2 class="text-xl font-bold">{{ t('pipeline.add_title') }}</h2>
            <p class="text-sm opacity-80">{{ t('pipeline.add_intro') }}</p>
          </div>

          <div class="flex flex-col gap-2">
            <h3 class="font-bold">{{ t('pipeline.stats_title') }}</h3>
            <div class="bg-base-100 border border-base-300 rounded-box p-3 flex flex-wrap items-start gap-2">
              <p class="text-sm flex-1 min-w-64">{{ t('pipeline.stats_about') }}</p>
              <button class="btn btn-sm btn-primary" :disabled="statsQueued" data-testid="add-stats"
                      @click="add({ kind: 'stats' })">{{ statsQueued ? t('pipeline.in_list') : t('pipeline.add') }}</button>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <h3 class="font-bold">{{ t('pipeline.tag_title') }}</h3>
            <p class="text-sm opacity-80">{{ t('pipeline.tag_intro') }}</p>
            <ul class="grid gap-2 lg:grid-cols-2">
              <TaggerCard v-for="tg in taggers" :key="tg.id + corpus" :corpus="corpus" :tagger="tg" :queued="steps" @add="add" />
            </ul>
          </div>
          <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
        </section>

        <!-- 3. a executar -->
        <section class="flex flex-col gap-3 bg-base-200 rounded-box p-3 border-2 border-primary" :aria-label="t('pipeline.queue_title')"
                 data-testid="pipeline-queue" data-explain="explain.pipeline.queue">
          <h2 class="text-xl font-bold">{{ t('pipeline.queue_title') }} ({{ steps.length }})</h2>
          <p class="text-sm opacity-80">{{ t('pipeline.queue_intro') }}</p>
          <p v-if="!steps.length" class="text-sm opacity-70">{{ t('pipeline.queue_empty') }}</p>
          <!-- durante a execução, a lista vira o painel de andamento -->
          <PipelineProgress v-if="job.job.value?.steps" :job="job.job.value" @cancel="job.cancel" />
          <ol v-if="!running" class="flex flex-col gap-2">
            <li data-testid="queue-item" v-for="(s, i) in steps" :key="i" class="bg-base-100 rounded-box p-2 flex flex-wrap items-center gap-2">
              <span class="badge badge-neutral badge-sm" aria-hidden="true">{{ i + 1 }}</span>
              <span class="font-medium">{{ s.kind === 'stats' ? t('pipeline.stats_title') : tagName(s.tagger) }}</span>
              <span v-if="s.kind === 'tag' && optionsText(s.options)" class="text-xs opacity-70">{{ optionsText(s.options) }}</span>
              <span v-if="s.plan" class="text-xs">{{ s.plan.to_tag || s.plan.clonable ? t('pipeline.to_process', { n: s.plan.to_tag + (s.plan.clonable || 0), total: s.plan.documents }) : t('pipeline.already') }}</span>
              <span v-if="s.kind === 'stats'" class="text-xs opacity-70">{{ t('pipeline.stats_last') }}</span>
              <span v-if="s.error" class="text-xs text-warning">{{ s.error }}</span>
              <button class="btn btn-xs btn-ghost ml-auto" :disabled="running" :aria-label="t('pipeline.remove') + ' ' + (i + 1)" @click="remove(i)">{{ t('pipeline.remove') }}</button>
            </li>
          </ol>
          <button v-if="!running" class="btn btn-primary w-fit" :disabled="!steps.length" data-testid="pipeline-run" @click="run">{{ t('pipeline.run') }}</button>
          <p v-if="job.job.value?.status === 'done'" role="status" class="text-sm" data-testid="pipeline-done">
            {{ t('pipeline.done', { n: job.job.value.result.done.length }) }}
            <RouterLink to="/arquivo" class="link">{{ t('pipeline.see_overview') }}</RouterLink></p>
        </section>
      </template>
    </template>
  </div>
</template>
