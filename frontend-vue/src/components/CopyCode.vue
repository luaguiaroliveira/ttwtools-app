<script setup>
// "Copiar como código": o comando `ttwtools ...` e o trecho Python da análise (POST /api/code).
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/index.js'
import AppDialog from './AppDialog.vue'
// `params` = uma análise só; `items` = várias ([{ label, params }], ex.: uma consulta por cor na Dispersão).
const props = defineProps({ analysis: { type: String, required: true }, params: { type: Object, default: null },
  items: { type: Array, default: null } })
const { t } = useI18n()
const open = ref(false)
const codes = ref([])
const copied = ref('')
const clean = (p) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== ''))
async function show() {
  const list = props.items?.length ? props.items : [{ label: '', params: props.params ?? {} }]
  codes.value = await Promise.all(list.map(async (it) => ({ label: it.label, ...(await api.code(props.analysis, clean(it.params))) })))
  open.value = true
}
async function copy(i, kind) {
  try { await navigator.clipboard.writeText(codes.value[i][kind]); copied.value = `${i}-${kind}` } catch { copied.value = '' }
}
</script>
<template>
  <button class="btn btn-xs" data-testid="copy-code" @click="show">{{ t('code.button') }}</button>
  <AppDialog :open="open" :title="t('code.title')" @close="open = false">
    <div v-if="codes.length" class="flex flex-col gap-4">
      <div v-for="(c, i) in codes" :key="i" class="flex flex-col gap-3" :class="{ 'border-t border-base-300 pt-3': i > 0 }">
        <p v-if="c.label" class="font-mono text-sm">{{ c.label }}</p>
        <div><div class="flex items-center"><span class="font-medium text-sm">{{ t('code.cli') }}</span>
          <button class="btn btn-xs ml-auto" @click="copy(i, 'cli')">{{ copied === `${i}-cli` ? t('code.copied') : t('code.copy') }}</button></div>
          <pre class="bg-base-200 p-2 rounded text-xs whitespace-pre-wrap break-all" :data-testid="codes.length === 1 ? 'code-cli' : undefined">{{ c.cli }}</pre></div>
        <div><div class="flex items-center"><span class="font-medium text-sm">Python</span>
          <button class="btn btn-xs ml-auto" @click="copy(i, 'python')">{{ copied === `${i}-python` ? t('code.copied') : t('code.copy') }}</button></div>
          <pre class="bg-base-200 p-2 rounded text-xs whitespace-pre-wrap">{{ c.python }}</pre></div>
      </div>
    </div>
  </AppDialog>
</template>
