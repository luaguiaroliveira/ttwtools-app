<script setup>
// Escolher o tagger, ver as tags, personalizar as opções e etiquetar o corpus ativo.
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/index.js'
import { useJob } from '../composables/useJob.js'
import OptionsForm from './OptionsForm.vue'
import TagsetDrawer from './TagsetDrawer.vue'
import JobProgress from './JobProgress.vue'
import Collapsible from './Collapsible.vue'
import HelpTip from './HelpTip.vue'

const props = defineProps({ corpus: { type: String, required: true } })
const emit = defineEmits(['tagged'])
const { t, locale } = useI18n()
const taggers = ref([])
const tagger = ref('spacy')
const descriptor = ref(null)
const values = ref({})
const plan = ref(null)
const planError = ref(null)
const showTags = ref(false)
const job = useJob(`tag.${props.corpus}`)

onMounted(async () => {
  taggers.value = (await api.taggers.list(locale.value)).taggers
  const first = taggers.value.find((x) => x.disponivel)
  if (first && !taggers.value.find((x) => x.id === tagger.value)?.disponivel) tagger.value = first.id
  job.resume()
})
watch([tagger, locale], async () => {
  descriptor.value = await api.taggers.options(tagger.value, locale.value)
  values.value = {}
}, { immediate: true })

// só as opções diferentes do padrão vão no pedido
const options = computed(() => {
  const out = {}
  for (const o of descriptor.value?.options ?? []) {
    const v = values.value[o.id]
    if (v !== undefined && JSON.stringify(v) !== JSON.stringify(o.padrao)) out[o.id] = v
  }
  return out
})
const summary = computed(() => {
  const d = descriptor.value
  if (!d) return ''
  const eff = Object.fromEntries(d.options.filter((o) => o.afeta_resultado).map((o) => [o.id, values.value[o.id] ?? o.padrao]))
  return `${d.name} · ${Object.entries(eff).map(([k, v]) => `${k}=${Array.isArray(v) ? v.join('+') : v}`).join(' · ')}`
})
const body = computed(() => ({ corpus: props.corpus, tagger: tagger.value, options: options.value }))

let timer = null
watch(body, () => {
  clearTimeout(timer)
  timer = setTimeout(async () => {
    planError.value = null
    try { plan.value = await api.taggers.plan(body.value) } catch (err) { plan.value = null; planError.value = err.message }
  }, 250)
}, { immediate: true, deep: true })

function applyPreset(name) { values.value = { ...descriptor.value.presets[name] } }
async function run() {
  await job.start(() => api.taggers.tag(body.value))
}
watch(() => job.job.value?.status, async (s) => {
  if (s === 'done') { plan.value = await api.taggers.plan(body.value); emit('tagged', tagger.value) }
})
const current = computed(() => taggers.value.find((x) => x.id === tagger.value))
</script>

<template>
  <section class="flex flex-col gap-3 bg-base-200 rounded-box p-3" :aria-label="t('tag.title')" id="tagger-panel" data-explain="explain.corpora.tagger">
    <h2 class="text-xl font-bold">{{ t('tag.title') }}: {{ corpus }}</h2>
    <div class="flex flex-wrap items-end gap-2">
      <label class="form-control">
        <span class="label-text">{{ t('tag.choose') }}</span>
        <select id="botao-tagger" v-model="tagger" class="select select-sm" data-testid="tagger-select">
          <option v-for="tg in taggers" :key="tg.id" :value="tg.id" :disabled="!tg.disponivel">
            {{ tg.id }}{{ tg.disponivel ? '' : ` — ${t('tag.unavailable')}` }}
          </option>
        </select>
      </label>
      <button class="btn btn-sm" data-testid="see-tags" @click="showTags = true">{{ t('tag.see_tags') }}</button>
      <HelpTip topic="tagset_biber" />
      <div class="join">
        <button v-for="p in ['rapido', 'recomendado', 'preciso']" :key="p" class="btn btn-sm join-item"
                :data-testid="`preset-${p}`" @click="applyPreset(p)">{{ t(`tagger.preset.${p}`) }}</button>
      </div>
    </div>
    <p v-if="current && !current.disponivel" role="alert" class="alert alert-warning text-sm py-1">{{ current.motivo }} {{ current.comando }}</p>
    <p class="text-sm opacity-80">{{ descriptor?.about }}</p>
    <p class="text-sm"><span class="font-medium">{{ t('tag.summary') }}:</span> <span data-testid="tag-summary">{{ summary }}</span></p>

    <Collapsible :title="t('tag.customize')">
      <div class="flex flex-col gap-3">
        <OptionsForm v-if="descriptor" v-model="values" :descriptor="descriptor" />
        <button class="btn btn-xs w-fit" @click="values = {}">{{ t('tag.restore') }}</button>
      </div>
    </Collapsible>

    <p v-if="plan" class="text-sm" data-testid="tag-plan">
      {{ plan.to_tag || plan.clonable ? t('tag.plan', plan) : t('tag.nothing_to_do') }}
      <span v-if="plan.clonable"> {{ t('tag.plan_clone', plan) }}</span>
    </p>
    <p v-if="planError" role="alert" class="text-error text-sm">{{ planError }}</p>
    <button class="btn btn-primary btn-sm w-fit" data-testid="tag-run"
            :disabled="!!planError || ['queued', 'running'].includes(job.job.value?.status)" @click="run">{{ t('tag.run') }}</button>
    <JobProgress :job="job.job.value" @cancel="job.cancel" />
    <p v-if="job.job.value?.status === 'done'" role="status" class="text-sm">{{ t('tag.result', job.job.value.result) }}</p>
    <TagsetDrawer :open="showTags" :tagger="tagger" @close="showTags = false" />
  </section>
</template>
