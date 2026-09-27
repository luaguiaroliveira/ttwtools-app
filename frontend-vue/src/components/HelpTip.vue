<script setup>
// Balão de ajuda: "?" ao lado de uma métrica; mostra o resumo do tópico (GET /api/help/{tópico}).
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/index.js'
import CohenDVisual from './CohenDVisual.vue'
const props = defineProps({ topic: { type: String, required: true } })
const { t, locale } = useI18n()
const text = ref('')
const open = ref(false)
async function toggle() {
  open.value = !open.value
  if (open.value && !text.value) text.value = (await api.help.topic(props.topic, locale.value)).summary
}
</script>
<template>
  <span class="relative inline-block">
    <button type="button" class="btn btn-circle btn-xs btn-ghost" :aria-expanded="open" :aria-label="t('common.help')"
            @click="toggle" @keydown.esc="open = false">?</button>
    <span v-if="open" role="tooltip" class="absolute z-30 left-6 top-0 w-64 p-2 rounded-box bg-base-300 text-sm shadow">
      {{ text || t('common.loading') }}
      <CohenDVisual v-if="topic === 'cohens_d'" compact class="mt-2" />
      <RouterLink :to="`/aprender/${topic}`" class="link block mt-1">{{ t('common.help') }} →</RouterLink>
    </span>
  </span>
</template>
