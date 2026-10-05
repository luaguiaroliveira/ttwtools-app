<script setup>
// Balão de ajuda. Duas formas:
//  - `topic`: resumo do tópico de ajuda (GET /api/help/{tópico}), com link para Aprender;
//  - `term`: verbete curto do glossário, resolvido por i18n (`glossary.*`), no ponto de uso.
// Com conteúdo no slot (ex.: <HelpTip term="ll">LL</HelpTip>) a própria sigla é o gatilho
// (sublinhado pontilhado, sem "?"); sem slot aparece o botão "?". O balão abre com o mouse
// ou o foco, quebra linhas, e fecha ao sair, com Esc ou ao rolar. Fica em `position: fixed`
// para não ser cortado por tabelas com rolagem. O texto é ligado por `aria-describedby`.
import { computed, onBeforeUnmount, ref, useId, useSlots } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/index.js'
import CohenDVisual from './CohenDVisual.vue'
const props = defineProps({
  topic: { type: String, default: '' },
  term: { type: String, default: '' },
  label: { type: String, default: '' },
})
const { t, locale } = useI18n()
const hasSlot = !!useSlots().default
const topicText = ref('')
const open = ref(false)
const pos = ref({ top: 0, left: 0 })
const trigger = ref(null)
const id = `help-${useId()}`
const W = 256
const text = computed(() => (props.term ? t(`glossary.${props.term}`) : topicText.value))
function place() {
  const r = trigger.value?.getBoundingClientRect()
  if (!r) return
  const left = Math.max(8, Math.min(r.left, window.innerWidth - W - 8))
  const below = r.bottom + 6
  pos.value = { left, top: below, above: below > window.innerHeight - 140 ? window.innerHeight - r.top + 6 : null }
}
function show() {
  place()
  open.value = true
  window.addEventListener('scroll', hide, { capture: true, passive: true })
  if (props.topic && !props.term && !topicText.value) api.help.topic(props.topic, locale.value).then((r) => { topicText.value = r.summary })
}
function hide() { open.value = false; window.removeEventListener('scroll', hide, { capture: true }) }
function toggle() { open.value ? hide() : show() }
onBeforeUnmount(hide)
const style = computed(() => (pos.value.above != null
  ? { left: `${pos.value.left}px`, bottom: `${pos.value.above}px`, width: `${W}px` }
  : { left: `${pos.value.left}px`, top: `${pos.value.top}px`, width: `${W}px` }))
</script>
<template>
  <span class="inline-flex align-middle" @mouseenter="show" @mouseleave="hide">
    <span v-if="hasSlot" ref="trigger" tabindex="0" role="button" class="cursor-help underline decoration-dotted underline-offset-2"
          :aria-describedby="id" :aria-label="label || undefined" @focus="show" @blur="hide" @keydown.esc="hide"><slot /></span>
    <button v-else ref="trigger" type="button" class="btn btn-circle btn-xs btn-ghost" :aria-describedby="id"
            :aria-expanded="open" :aria-label="label || t('common.help')"
            @click="toggle" @focus="show" @blur="hide" @keydown.esc="hide">?</button>
    <span :id="id" role="tooltip"
          :class="open ? 'fixed z-50 block p-2 rounded-box bg-base-300 text-base-content text-sm font-normal normal-case tracking-normal text-left whitespace-normal break-words shadow-lg' : 'sr-only'"
          :style="open ? style : undefined">
      {{ text || t('common.loading') }}
      <CohenDVisual v-if="open && topic === 'cohens_d'" compact class="mt-2" />
      <RouterLink v-if="topic" :to="`/aprender/${topic}`" class="link block mt-1">{{ t('nav.learn') }} →</RouterLink>
    </span>
  </span>
</template>
