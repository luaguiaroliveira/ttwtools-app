<script setup>
// Documentação oficial de uma etiqueta (hoje: MFTE, lista de traços do MFTE): nome do traço, categoria,
// exemplos, unidade de normalização, autoria e operacionalização. O texto é o da fonte, em inglês.
import { useI18n } from 'vue-i18n'
defineProps({ doc: { type: Object, default: null }, version: { type: String, default: '' } })
const { t } = useI18n()
</script>
<template>
  <details v-if="doc" class="text-xs mt-1" data-testid="tag-doc">
    <summary class="cursor-pointer font-medium">{{ t('tagdoc.title', { version }) }}</summary>
    <dl class="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 mt-1">
      <dt class="text-text-muted">{{ t('tagdoc.feature') }}</dt><dd class="font-medium">{{ doc.feature }}</dd>
      <template v-if="doc.category"><dt class="text-text-muted">{{ t('tagdoc.category') }}</dt><dd>{{ doc.category }}</dd></template>
      <template v-if="doc.examples"><dt class="text-text-muted">{{ t('tagdoc.examples') }}</dt><dd class="italic">{{ doc.examples }}</dd></template>
      <template v-if="doc.unit && doc.unit !== 'NA'"><dt class="text-text-muted">{{ t('tagdoc.unit') }}</dt><dd>{{ doc.unit }}</dd></template>
      <template v-if="doc.by"><dt class="text-text-muted">{{ t('tagdoc.by') }}</dt><dd>{{ doc.by }}</dd></template>
    </dl>
    <template v-if="doc.operationalisation">
      <p class="text-text-muted mt-1">{{ t('tagdoc.operationalisation') }} <span class="opacity-80">({{ t('tagdoc.original') }})</span></p>
      <p class="max-h-40 overflow-y-auto whitespace-pre-line pr-1" tabindex="0" role="region" :aria-label="t('tagdoc.operationalisation')">{{ doc.operationalisation }}</p>
    </template>
  </details>
</template>
