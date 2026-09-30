<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { progressPercent } from '../composables/useJob.js'
import ProgressBar from './ProgressBar.vue'
import { diskText } from '../utils/errors.js'
const props = defineProps({ job: Object })
const emit = defineEmits(['cancel'])
const { t } = useI18n()
const pct = computed(() => progressPercent(props.job))
const active = computed(() => ['queued', 'running'].includes(props.job?.status))
</script>
<template>
  <div v-if="job" class="flex flex-col gap-2" role="status" aria-live="polite">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span class="badge" :class="{ 'badge-error': job.status === 'error', 'badge-success': job.status === 'done' }">
        {{ t(`job.${job.status}`) }}
      </span>
      <span v-if="job.total && !job.stage" class="text-sm">{{ t('job.progress', { done: job.done ?? 0, total: job.total }) }}</span>
      <span v-if="job.stage && job.stage !== 'done'" class="text-sm font-medium">{{ t(`job.stage.${job.stage}`) }}</span>
      <span v-if="pct !== null && active" class="text-sm tabular-nums">{{ pct }}%</span>
      <span class="text-sm text-text-muted truncate">{{ job.message }}</span>
      <button v-if="active" class="btn btn-sm btn-outline ml-auto" data-testid="job-cancel" @click="emit('cancel')">
        {{ t('job.cancel') }}
      </button>
    </div>
    <ProgressBar :value="pct" />
    <p v-if="job.status === 'error'" class="text-error text-sm">{{ job.error_code === 'insufficient_disk_space' ? diskText(job.error_params) : job.error }}</p>
  </div>
</template>
