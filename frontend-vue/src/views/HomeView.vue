<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useSession } from '../stores/session.js'
import { useJob } from '../composables/useJob.js'
import { post } from '../api/client.js'
import Collapsible from '../components/Collapsible.vue'
import JobProgress from '../components/JobProgress.vue'

const { t } = useI18n()
const { version } = storeToRefs(useSession())
const demo = useJob('demo')
onMounted(() => demo.resume())
const runDemo = () => demo.start(() => post('/api/jobs/demo', undefined, { steps: 20, delay: 0.25 }))
</script>

<template>
  <section class="flex flex-col gap-4 max-w-3xl">
    <h1 class="text-2xl font-bold">{{ t('home.welcome') }}</h1>
    <p v-if="version" data-testid="version">{{ t('home.version', { app: version.app, ttwtools: version.ttwtools }) }}</p>
    <p v-else>{{ t('common.loading') }}</p>
    <Collapsible :title="t('home.diagnostics')">
      <div class="flex flex-col gap-3">
        <button class="btn btn-sm btn-primary w-fit" data-testid="demo-start" @click="runDemo">{{ t('home.demo_job') }}</button>
        <JobProgress :job="demo.job.value" @cancel="demo.cancel" />
      </div>
    </Collapsible>
  </section>
</template>
