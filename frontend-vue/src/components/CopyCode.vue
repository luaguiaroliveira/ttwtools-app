<script setup>
// "Copiar como código": o comando `ttwtools ...` e o trecho Python da análise (POST /api/code).
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/index.js'
import AppDialog from './AppDialog.vue'
const props = defineProps({ analysis: { type: String, required: true }, params: { type: Object, required: true } })
const { t } = useI18n()
const open = ref(false)
const code = ref(null)
const copied = ref('')
async function show() {
  const clean = Object.fromEntries(Object.entries(props.params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  code.value = await api.code(props.analysis, clean)
  open.value = true
}
async function copy(kind) {
  try { await navigator.clipboard.writeText(code.value[kind]); copied.value = kind } catch { copied.value = '' }
}
</script>
<template>
  <button class="btn btn-xs" data-testid="copy-code" @click="show">{{ t('code.button') }}</button>
  <AppDialog :open="open" :title="t('code.title')" @close="open = false">
    <div v-if="code" class="flex flex-col gap-3">
      <div><div class="flex items-center"><span class="font-medium text-sm">{{ t('code.cli') }}</span>
        <button class="btn btn-xs ml-auto" @click="copy('cli')">{{ copied === 'cli' ? t('code.copied') : t('code.copy') }}</button></div>
        <pre class="bg-base-200 p-2 rounded text-xs whitespace-pre-wrap break-all" data-testid="code-cli">{{ code.cli }}</pre></div>
      <div><div class="flex items-center"><span class="font-medium text-sm">Python</span>
        <button class="btn btn-xs ml-auto" @click="copy('python')">{{ copied === 'python' ? t('code.copied') : t('code.copy') }}</button></div>
        <pre class="bg-base-200 p-2 rounded text-xs whitespace-pre-wrap">{{ code.python }}</pre></div>
    </div>
  </AppDialog>
</template>
