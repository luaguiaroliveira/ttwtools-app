<script setup>
// Divisória discreta entre duas áreas: três pontinhos (agarrar e arrastar) quando aberta e uma seta
// apontando para a esquerda quando a área da direita está colapsada (arrastar/clicar reabre).
import { useI18n } from 'vue-i18n'
defineProps({
  expanded: { type: Boolean, default: true }, label: { type: String, default: '' },
  now: { type: Number, default: 0 }, min: { type: Number, default: 0 }, max: { type: Number, default: 0 },
})
defineEmits(['down', 'key'])
const { t } = useI18n()
</script>
<template>
  <div class="ttw-split-handle" role="separator" aria-orientation="vertical" tabindex="0"
       :aria-label="label || t('analysis.divider')" :aria-valuemin="min" :aria-valuemax="max" :aria-valuenow="Math.round(now)"
       data-testid="split-handle" @pointerdown="$emit('down', $event)" @keydown="$emit('key', $event)">
    <span class="ttw-split-grip" aria-hidden="true">
      <template v-if="expanded"><i /><i /><i /></template>
      <svg v-else viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3.500 5.500 8l4.500 4.500" /></svg>
    </span>
  </div>
</template>
