<script setup>
// Assistente "Adicionar corpus": 1) origem  2) metadados e grupos  3) o que fazer agora.
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/index.js'

const emit = defineEmits(['done', 'overview', 'tag'])
const { t } = useI18n()
const step = ref(1)
const form = reactive({ name: '', kind: 'folder', format: 'txt', path: '', text: '', fields: '', delimiter: '_', metaCsv: '' })
const result = ref(null)
const error = ref(null)
const busy = ref(false)

async function chooseFolder() {
  const r = await api.utils.pickFolder().catch(() => null)
  if (r?.path) {
    form.path = r.path
    if (!form.name) form.name = r.path.split(/[\\/]/).filter(Boolean).pop()
  }
}
const canContinue = () => form.name && (form.kind === 'folder' ? form.path : form.kind === 'text' ? form.text : false)

async function doImport() {
  error.value = null
  busy.value = true
  try {
    result.value = await api.corpora.import({
      corpus_name: form.name,
      source: form.kind === 'folder' ? { kind: 'folder', path: form.path, format: form.format } : { kind: 'text', text: form.text },
      filename_fields: form.fields ? form.fields.split(',').map((s) => s.trim()).filter(Boolean) : null,
      delimiter: form.delimiter || '_',
      metadata_csv: form.metaCsv || null,
    })
    step.value = 3
    emit('done', form.name)
  } catch (err) {
    error.value = err.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="flex flex-col gap-3" :aria-label="t('corpora.add')">
    <ul class="steps steps-horizontal w-full text-xs">
      <li class="step" :class="{ 'step-primary': step >= 1 }">{{ t('wizard.step_source') }}</li>
      <li class="step" :class="{ 'step-primary': step >= 2 }">{{ t('wizard.step_meta') }}</li>
      <li class="step" :class="{ 'step-primary': step >= 3 }">{{ t('wizard.step_next') }}</li>
    </ul>

    <div v-if="step === 1" class="flex flex-col gap-2">
      <label class="form-control"><span class="label-text">{{ t('wizard.name') }}</span>
        <input v-model="form.name" class="input input-sm" data-testid="wizard-name" /></label>
      <fieldset class="flex flex-wrap gap-3">
        <label v-for="k in ['folder', 'text', 'catalog']" :key="k" class="flex items-center gap-1">
          <input v-model="form.kind" type="radio" class="radio radio-sm" :value="k" :disabled="k === 'catalog'" />
          {{ t(`wizard.kind.${k}`) }}
        </label>
      </fieldset>
      <p v-if="form.kind === 'catalog'" class="text-sm opacity-70">{{ t('corpora.catalog_soon') }}</p>
      <div v-if="form.kind === 'folder'" class="flex gap-2">
        <input v-model="form.path" class="input input-sm flex-1" :placeholder="t('wizard.folder')" :aria-label="t('wizard.folder')" data-testid="wizard-path" />
        <button type="button" class="btn btn-sm" @click="chooseFolder">{{ t('wizard.choose_folder') }}</button>
        <select v-model="form.format" class="select select-sm" :aria-label="t('wizard.format')" data-testid="wizard-format">
          <option v-for="fm in ['txt', 'conllu', 'nltk', 'tei', 'graf']" :key="fm" :value="fm">{{ t(`wizard.format.${fm}`) }}</option></select>
      </div>
      <textarea v-if="form.kind === 'text'" v-model="form.text" class="textarea h-32" :aria-label="t('wizard.text')" />
      <button class="btn btn-sm btn-primary w-fit" :disabled="!canContinue()" data-testid="wizard-next" @click="step = 2">{{ t('wizard.next') }}</button>
    </div>

    <div v-else-if="step === 2" class="flex flex-col gap-2">
      <label class="form-control"><span class="label-text">{{ t('wizard.fields') }}</span>
        <input v-model="form.fields" class="input input-sm" data-testid="wizard-fields" />
        <span class="label-text-alt opacity-70">{{ t('wizard.fields_hint') }}</span></label>
      <label class="form-control w-32"><span class="label-text">{{ t('wizard.delimiter') }}</span>
        <input v-model="form.delimiter" class="input input-sm" maxlength="3" /></label>
      <label class="form-control"><span class="label-text">{{ t('wizard.meta_csv') }}</span>
        <input v-model="form.metaCsv" class="input input-sm" /></label>
      <div class="flex gap-2">
        <button class="btn btn-sm" @click="step = 1">{{ t('wizard.back') }}</button>
        <button class="btn btn-sm btn-primary" :disabled="busy" data-testid="wizard-import" @click="doImport">{{ t('wizard.import') }}</button>
      </div>
      <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    </div>

    <div v-else class="flex flex-col gap-2">
      <p role="status">{{ t('wizard.imported', { n: result.imported, m: result.metadata_applied ?? 0 }) }}</p>
      <div class="flex gap-2">
        <button class="btn btn-sm btn-primary" data-testid="wizard-overview" @click="emit('overview', form.name)">{{ t('wizard.see_overview') }}</button>
        <button class="btn btn-sm" @click="emit('tag', form.name)">{{ t('wizard.tag_now') }}</button>
      </div>
    </div>
  </section>
</template>
