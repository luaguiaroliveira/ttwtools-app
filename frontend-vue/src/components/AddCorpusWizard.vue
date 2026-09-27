<script setup>
// Assistente "Adicionar corpus": 1) de onde vêm os textos (renomear e as informações sobre
// os textos ficam em painéis opcionais recolhidos)  2) o que fazer agora.
// O nome do corpus é o da pasta (ou "texto_colado"), salvo se a pessoa renomear.
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/index.js'
import Collapsible from './Collapsible.vue'

const emit = defineEmits(['done', 'overview', 'tag'])
const { t } = useI18n()
const step = ref(1)
const form = reactive({ customName: '', kind: 'folder', format: 'txt', path: '', text: '', delimiter: '_', pieces: [], metaCsv: '' })
const preview = ref(null)
const result = ref(null)
const error = ref(null)
const busy = ref(false)
const SEPARATORS = [['_', 'underscore'], ['-', 'hyphen'], ['.', 'dot'], [' ', 'space']]

async function chooseFolder() {
  const r = await api.utils.pickFolder().catch(() => null)
  if (r?.path) form.path = r.path
}
async function chooseCsv() {
  const r = await api.utils.pickFile(undefined, 'csv').catch(() => null)
  if (r?.path) form.metaCsv = r.path
}
const defaultName = computed(() => (form.kind === 'text' ? 'texto_colado'
  : (form.path.split(/[\\/]/).filter(Boolean).pop() || '').replace(/\.[^.]+$/, '')))
const name = computed(() => form.customName.trim() || defaultName.value)
const canImport = computed(() => name.value && (form.kind === 'folder' ? form.path : form.kind === 'text' ? form.text : false))
const usesNames = computed(() => form.kind === 'folder' && form.format === 'txt')

// um nome por pedaço (a lista inteira, para cada nome valer só para o seu pedaço); vazio = ignorar
const fields = computed(() => {
  const f = form.pieces.map((s) => (s || '').trim())
  return f.some(Boolean) ? f : null
})
async function loadPreview() {
  preview.value = null
  if (!usesNames.value || !form.path) return
  try {
    preview.value = await api.corpora.previewNames(form.path, form.delimiter, fields.value?.join(','))
    if (form.pieces.length !== preview.value.parts) form.pieces = Array.from({ length: preview.value.parts }, (_, i) => form.pieces[i] ?? '')
  } catch { preview.value = null }
}
watch(() => [form.path, form.delimiter, form.format], () => { form.pieces = []; loadPreview() })
let timer = null
watch(fields, () => { clearTimeout(timer); timer = setTimeout(loadPreview, 250) })
const example = computed(() => preview.value?.examples?.[0])

async function doImport() {
  error.value = null
  busy.value = true
  try {
    result.value = await api.corpora.import({
      corpus_name: name.value,
      source: form.kind === 'folder' ? { kind: 'folder', path: form.path, format: form.format } : { kind: 'text', text: form.text },
      filename_fields: usesNames.value ? fields.value : null,
      delimiter: form.delimiter,
      metadata_csv: form.metaCsv || null,
    })
    step.value = 2
    emit('done', name.value)
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
      <li class="step" :class="{ 'step-primary': step >= 2 }">{{ t('wizard.step_next') }}</li>
    </ul>

    <div v-if="step === 1" class="flex flex-col gap-3">
      <fieldset class="flex flex-wrap gap-3">
        <legend class="sr-only">{{ t('wizard.step_source') }}</legend>
        <label v-for="k in ['folder', 'text']" :key="k" class="flex items-center gap-1">
          <input v-model="form.kind" type="radio" class="radio radio-sm" :value="k" />
          {{ t(`wizard.kind.${k}`) }}
        </label>
      </fieldset>
      <div v-if="form.kind === 'folder'" class="flex flex-wrap gap-2">
        <button type="button" class="btn btn-sm btn-primary" data-testid="wizard-choose-folder" @click="chooseFolder">{{ t('wizard.choose_folder') }}</button>
        <input v-model.lazy="form.path" class="input input-sm flex-1 min-w-48" :placeholder="t('wizard.folder_or_type')" :aria-label="t('wizard.folder')" data-testid="wizard-path" />
        <select v-model="form.format" class="select select-sm" :aria-label="t('wizard.format')" data-testid="wizard-format">
          <option v-for="fm in ['txt', 'conllu', 'nltk', 'tei', 'graf']" :key="fm" :value="fm">{{ t(`wizard.format.${fm}`) }}</option></select>
      </div>
      <textarea v-if="form.kind === 'text'" v-model="form.text" class="textarea h-32" :aria-label="t('wizard.text')" />
      <p v-if="name" class="text-sm" data-testid="wizard-final-name">{{ t('wizard.will_be_called') }} <strong>{{ name }}</strong></p>

      <Collapsible :title="t('wizard.rename_title')" data-testid="wizard-rename">
        <label class="flex flex-col gap-1 max-w-md"><span class="label-text">{{ t('wizard.name') }}</span>
          <input v-model="form.customName" class="input input-sm w-full" :placeholder="defaultName" data-testid="wizard-name" />
          <span class="text-xs opacity-70">{{ t('wizard.rename_hint') }}</span></label>
      </Collapsible>

      <Collapsible v-if="usesNames" :title="t('wizard.meta_title')" data-testid="wizard-meta">
        <div class="flex flex-col gap-3">
          <p class="text-sm">{{ t('wizard.meta_intro') }}</p>
          <p v-if="!form.path" class="text-sm opacity-70">{{ t('wizard.pick_folder_first') }}</p>
          <p v-else-if="preview && !preview.total" class="text-sm text-warning">{{ t('wizard.no_files') }}</p>
          <template v-else-if="example">
            <label class="flex flex-col gap-1 w-fit"><span class="label-text">{{ t('wizard.separator') }}</span>
              <select v-model="form.delimiter" class="select select-sm">
                <option v-for="[v, k] in SEPARATORS" :key="k" :value="v">{{ t(`wizard.sep.${k}`) }}</option></select></label>
            <fieldset class="flex flex-col gap-1">
              <legend class="text-sm font-medium">{{ t('wizard.pieces', { file: example.file }) }}</legend>
              <div class="flex flex-wrap gap-2">
                <label v-for="(part, i) in example.parts" :key="i" class="flex flex-col gap-1 w-40">
                  <span class="label-text-alt"><code>{{ part }}</code></span>
                  <input v-model="form.pieces[i]" class="input input-sm" :placeholder="t('wizard.piece_placeholder')"
                         :aria-label="t('wizard.piece', { n: i + 1, value: part })" :data-testid="`wizard-piece-${i}`" />
                </label>
              </div>
              <span class="text-xs opacity-70">{{ t('wizard.pieces_hint') }}</span>
            </fieldset>
            <div v-if="fields" class="overflow-x-auto">
              <table class="table table-xs w-fit">
                <caption class="text-left text-sm font-medium">{{ t('wizard.preview', { n: preview.examples.length, total: preview.total }) }}</caption>
                <thead><tr><th>{{ t('wizard.file') }}</th><th v-for="f in fields.filter(Boolean)" :key="f">{{ f }}</th></tr></thead>
                <tbody><tr v-for="e in preview.examples" :key="e.file"><td>{{ e.file }}</td>
                  <td v-for="f in fields.filter(Boolean)" :key="f">{{ e.meta[f] }}</td></tr></tbody>
              </table>
            </div>
            <p v-if="preview.n_irregular" role="status" class="text-sm text-warning">
              {{ t('wizard.irregular', { n: preview.n_irregular, total: preview.total, ex: preview.irregular.join(', ') }) }}</p>
          </template>

          <details class="border-t border-base-300 pt-2">
            <summary class="cursor-pointer text-sm font-medium">{{ t('wizard.csv_title') }}</summary>
            <div class="flex flex-col gap-2 mt-2">
              <p class="text-sm">{{ t('wizard.csv_intro') }}</p>
              <div class="flex flex-wrap gap-2">
                <input v-model="form.metaCsv" class="input input-sm flex-1 min-w-48" :aria-label="t('wizard.meta_csv')" :placeholder="t('wizard.meta_csv')" />
                <button type="button" class="btn btn-sm" @click="chooseCsv">{{ t('wizard.choose_csv') }}</button>
              </div>
              <details class="text-xs">
                <summary class="cursor-pointer opacity-80">{{ t('wizard.csv_help_title') }}</summary>
                <p class="mt-1">{{ t('wizard.csv_help') }}</p>
                <pre class="bg-base-100 rounded p-2 mt-1">filename,nivel,ano
ana_B1_2024.txt,B1,2024
joao_C1_2023.txt,C1,2023</pre>
              </details>
            </div>
          </details>
        </div>
      </Collapsible>

      <button class="btn btn-sm btn-primary w-fit" :disabled="busy || !canImport" data-testid="wizard-import" @click="doImport">{{ t('wizard.import') }}</button>
      <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    </div>

    <div v-else class="flex flex-col gap-2">
      <p role="status">{{ t('wizard.imported', { n: result.imported, m: result.metadata_applied ?? 0 }) }}</p>
      <div class="flex gap-2">
        <button class="btn btn-sm btn-primary" data-testid="wizard-tag" @click="emit('tag', name)">{{ t('wizard.tag_now') }}</button>
        <button class="btn btn-sm" data-testid="wizard-overview" @click="emit('overview', name)">{{ t('wizard.see_overview') }}</button>
      </div>
    </div>
  </section>
</template>
