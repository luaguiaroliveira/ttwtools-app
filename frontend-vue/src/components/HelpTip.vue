<script setup>
// Balão de ajuda. Duas formas:
//  - `topic`: resumo do tópico de ajuda (GET /api/help/{tópico}), com link para Aprender;
//  - `term`: verbete curto do glossário, resolvido por i18n (`glossary.*`), no ponto de uso.
// O texto fica ligado ao botão por `aria-describedby` (funciona no foco e no toque, não só
// no `title` nativo). `Esc` fecha.
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/index.js'
import CohenDVisual from './CohenDVisual.vue'
const props = defineProps({
  topic: { type: String, default: '' },
  term: { type: String, default: '' },
  label: { type: String, default: '' },
})
const { t, locale } = useI18n()
const topicText = ref('')
const open = ref(false)
const id = `help-${useId()}`
const text = computed(() => (props.term ? t(`glossary.${props.term}`) : topicText.value))
async function toggle() {
  open.value = !open.value
  if (open.value && props.topic && !topicText.value) topicText.value = (await api.help.topic(props.topic, locale.value)).summary
}
function show() { open.value = true; if (props.topic && !topicText.value) api.help.topic(props.topic, locale.value).then((r) => { topicText.value = r.summary }) }
function hide() { open.value = false }
</script>
<template>
  <span class="relative inline-flex align-middle">
    <button type="button" class="btn btn-circle btn-xs btn-ghost" :aria-describedby="id"
            :aria-expanded="open" :aria-label="label || t('common.help')"
            @click="toggle" @focus="show" @mouseenter="show" @keydown.esc="hide">{{ term ? '?' : '?' }}</button>
    <span :id="id" role="tooltip"
          :class="open ? 'absolute z-30 left-6 top-0 block w-64 p-2 rounded-box bg-base-300 text-sm shadow' : 'sr-only'">
      {{ text || t('common.loading') }}
      <CohenDVisual v-if="topic === 'cohens_d'" compact class="mt-2" />
      <RouterLink v-if="topic" :to="`/aprender/${topic}`" class="link block mt-1">{{ t('common.help') }} →</RouterLink>
    </span>
  </span>
</template>
