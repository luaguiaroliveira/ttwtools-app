<script setup>
// Traço contado nas comparações (KFA, galeria, Laboratório). O padrão é `tags`, em qualquer camada; só as
// camadas que também têm `upos` e `xpos` (spaCy, Stanza) oferecem a escolha.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
const props = defineProps({ modelValue: { type: String, default: '' }, fields: { type: Array, default: () => [] } })
const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()
const offered = computed(() => props.fields.includes('upos') && props.fields.includes('xpos'))
</script>
<template>
  <label v-if="offered" class="ttw-field"><span class="ttw-label">{{ t('feature.label') }}</span>
    <select :value="modelValue" class="select select-sm" data-testid="feature-select" @change="emit('update:modelValue', $event.target.value)">
      <option value="">{{ t('feature.tags') }}</option>
      <option value="upos">{{ t('feature.upos') }}</option>
      <option value="xpos">{{ t('feature.xpos') }}</option>
    </select></label>
</template>
