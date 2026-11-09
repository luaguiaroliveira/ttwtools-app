<script setup>
// Andamento de "Executar análise e etiquetagem": barra geral (porcentagem, passo, tempo
// decorrido e estimativa) e uma linha por tarefa, com situação, barra e porcentagem próprias.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({ job: { type: Object, required: true } })
const emit = defineEmits(['cancel'])
const { t } = useI18n()
const ACTIVE = ['queued', 'running']
const active = computed(() => ACTIVE.includes(props.job.status))
const steps = computed(() => props.job.steps ?? [])

// relógio para o tempo decorrido (só enquanto roda)
const now = ref(Date.now() / 1000)
let timer = null
watch(active, (on) => {
  clearInterval(timer)
  if (on) timer = setInterval(() => { now.value = Date.now() / 1000 }, 1000)
}, { immediate: true })
onBeforeUnmount(() => clearInterval(timer))

const overall = computed(() => {
  if (props.job.status === 'done') return 100
  return props.job.total ? Math.min(100, Math.floor((100 * (props.job.done ?? 0)) / props.job.total)) : 0
})
const stepPct = (s) => (s.status === 'done' ? 100 : s.status === 'running' && s.total ? Math.floor((100 * (s.done ?? 0)) / s.total) : 0)
const current = computed(() => {
  const i = steps.value.findIndex((s) => s.status === 'running')
  return i >= 0 ? i + 1 : steps.value.filter((s) => s.status === 'done').length
})
const elapsed = computed(() => Math.max(0, (props.job.finished_at ?? now.value) - (props.job.started_at ?? now.value)))
const remaining = computed(() => (active.value && overall.value >= 5 ? (elapsed.value * (100 - overall.value)) / overall.value : null))
function fmt(sec) {
  const s = Math.round(sec)
  if (s < 60) return t('pipeline.seconds', { s })
  const m = Math.floor(s / 60)
  return m < 60 ? t('pipeline.minutes', { m, s: s % 60 }) : t('pipeline.hours', { h: Math.floor(m / 60), m: m % 60 })
}
const headline = computed(() => ({ queued: 'pipeline.running', running: 'pipeline.running', done: 'pipeline.finished',
  cancelled: 'pipeline.cancelled', error: 'pipeline.failed' })[props.job.status] ?? 'pipeline.running')
const name = (s) => (s.kind === 'stats' ? t('pipeline.stats_title') : t(`tagger.${s.tagger}.name`))
const counter = (s) => (s.status === 'running' && s.total
  ? t(s.kind === 'tag' ? 'pipeline.texts' : 'pipeline.parts', { done: s.done ?? 0, total: s.total }) : t(`pipeline.state.${s.status}`))
</script>

<template>
  <section class="rounded-box border border-base-300 bg-base-100 p-4 flex flex-col gap-4" data-testid="pipeline-progress"
           :aria-label="t(headline)">
    <!-- geral -->
    <div class="flex flex-col gap-2">
      <div class="flex flex-wrap items-end gap-x-4 gap-y-1">
        <span class="text-4xl font-bold tabular-nums leading-none" data-testid="pipeline-percent">{{ overall }}%</span>
        <div class="flex flex-col min-w-0">
          <span class="font-medium flex items-center gap-1">
            <span v-if="job.status === 'done'" class="badge badge-success badge-sm" aria-hidden="true">✓</span>
            <span v-else-if="job.status === 'error'" class="badge badge-error badge-sm" aria-hidden="true">✕</span>{{ t(headline) }}</span>
          <span class="text-xs text-text-muted tabular-nums">
            {{ t('pipeline.step_of', { n: current, total: steps.length }) }} · {{ t('pipeline.elapsed', { t: fmt(elapsed) }) }}<template
              v-if="remaining !== null"> · {{ t('pipeline.remaining', { t: fmt(remaining) }) }}</template></span>
        </div>
        <button v-if="active" class="btn btn-sm btn-outline ml-auto" data-testid="job-cancel" @click="emit('cancel')">{{ t('job.cancel') }}</button>
      </div>
      <div class="h-3 w-full rounded-full bg-base-300 overflow-hidden" role="progressbar" :aria-valuenow="overall"
           aria-valuemin="0" aria-valuemax="100" :aria-label="t(headline)">
        <div class="h-full rounded-full transition-[width] duration-500 ease-out"
             :class="job.status === 'error' ? 'bg-error' : job.status === 'done' ? 'bg-success' : 'bg-primary'"
             :style="{ width: `${overall}%` }" />
      </div>
      <p class="sr-only" aria-live="polite">{{ t(headline) }} {{ overall }}%</p>
    </div>

    <!-- por tarefa -->
    <ol class="flex flex-col gap-2">
      <li v-for="(s, i) in steps" :key="i" class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 items-center rounded-box p-2"
          :class="{ 'bg-base-200': s.status === 'running' }" :data-testid="`pipeline-step-${i}`" :data-status="s.status">
        <span class="w-7 h-7 rounded-full grid place-items-center text-xs font-bold shrink-0" aria-hidden="true"
              :class="{ 'bg-success text-success-content': s.status === 'done', 'bg-error text-error-content': s.status === 'error',
                        'bg-primary text-primary-content': s.status === 'running', 'bg-base-300': s.status === 'queued' }">
          <span v-if="s.status === 'done'">✓</span><span v-else-if="s.status === 'error'">✕</span>
          <span v-else-if="s.status === 'running'" class="loading loading-spinner loading-xs" /><span v-else>{{ i + 1 }}</span>
        </span>
        <div class="flex flex-wrap items-baseline gap-x-2 min-w-0">
          <span v-if="s.corpus" class="badge badge-sm badge-neutral" data-testid="progress-corpus">{{ s.corpus }}</span>
          <span class="font-medium">{{ name(s) }}</span>
          <span class="text-xs text-text-muted">{{ counter(s) }}</span>
          <span class="ml-auto text-sm font-medium tabular-nums">{{ stepPct(s) }}%</span>
        </div>
        <span />
        <div class="flex flex-col gap-1 min-w-0">
          <div class="h-1.5 w-full rounded-full bg-base-300 overflow-hidden" role="progressbar" :aria-valuenow="stepPct(s)"
               aria-valuemin="0" aria-valuemax="100" :aria-label="name(s)">
            <div class="h-full rounded-full transition-[width] duration-300 ease-out"
                 :class="s.status === 'error' ? 'bg-error' : s.status === 'done' ? 'bg-success' : 'bg-primary'" :style="{ width: `${stepPct(s)}%` }" />
          </div>
          <span v-if="s.status === 'running' && s.item" class="text-xs text-text-muted truncate" :title="s.item">{{ s.item }}</span>
        </div>
      </li>
    </ol>
    <p v-if="job.status === 'error'" role="alert" class="text-error text-sm">{{ job.error }}</p>
  </section>
</template>
