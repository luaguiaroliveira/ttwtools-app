<script setup>
// Andamento de uma tarefa em etapas: uma barra geral e a lista das etapas vistas, cada uma com a sua barra.
import { reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { advance, emptySteps, overallPercent, stepPercent } from '../composables/useSteps.js'
import ProgressBar from './ProgressBar.vue'
const props = defineProps({ job: Object, plan: { type: Array, default: () => [] } })
const { t } = useI18n()
const state = reactive(emptySteps())
watch(() => props.job, (job) => advance(state, job), { immediate: true, deep: true })
const MB = 1024 * 1024
const amount = (s) => (s.stage === 'decompress' ? `${Math.round(s.done / MB)} / ${Math.round(s.total / MB)} MB` : t('job.progress', { done: s.done, total: s.total }))
const overall = computed(() => overallPercent(state, props.plan))
</script>
<template>
  <div class="flex flex-col gap-3" data-testid="step-progress">
    <div>
      <div class="flex items-baseline justify-between text-sm font-medium mb-1">
        <span>{{ t('job.overall') }}</span>
        <span class="tabular-nums" data-testid="overall-pct">{{ overall }}%</span>
      </div>
      <ProgressBar :value="overall" :label="t('job.overall')" />
    </div>
    <ol class="flex flex-col gap-2">
      <li v-for="s in state.steps" :key="s.stage" class="text-sm" :data-testid="`step-${s.stage}`" :data-state="s.state">
        <div class="flex items-center gap-2 mb-1">
          <span v-if="s.state === 'done'" class="text-success" aria-hidden="true">✓</span>
          <span v-else class="loading loading-spinner loading-xs text-primary" aria-hidden="true" />
          <span :class="s.state === 'done' ? 'opacity-70' : 'font-medium'">{{ t(`job.stage.${s.stage}`) }}</span>
          <span v-if="s.state !== 'done' && s.total" class="ml-auto tabular-nums text-text-muted">{{ amount(s) }}</span>
        </div>
        <ProgressBar :value="stepPercent(s)" :label="t(`job.stage.${s.stage}`)" />
      </li>
    </ol>
  </div>
</template>
