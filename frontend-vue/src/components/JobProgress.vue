<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { progressPercent } from '../composables/useJob.js'
const props = defineProps({ job: Object })
const emit = defineEmits(['cancel'])
const { t } = useI18n()
const pct = computed(() => progressPercent(props.job))
const active = computed(() => ['queued', 'running'].includes(props.job?.status))
</script>
<template>
  <div v-if="job" class="flex flex-col gap-2" role="status" aria-live="polite">
    <div class="flex items-center gap-3">
      <span class="badge" :class="{ 'badge-error': job.status === 'error', 'badge-success': job.status === 'done' }">
        {{ t(`job.${job.status}`) }}
      </span>
      <span v-if="job.total" class="text-sm">{{ t('job.progress', { done: job.done ?? 0, total: job.total }) }}</span>
      <span class="text-sm opacity-70 truncate">{{ job.message }}</span>
      <button v-if="active" class="btn btn-sm btn-outline ml-auto" data-testid="job-cancel" @click="emit('cancel')">
        {{ t('job.cancel') }}
      </button>
    </div>
    <progress class="progress progress-primary w-full" :value="pct ?? undefined" max="100" :aria-valuenow="pct" />
    <p v-if="job.status === 'error'" class="text-error text-sm">{{ job.error }}</p>
  </div>
</template>
