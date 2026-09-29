<script setup>
// Dica global das etiquetas: qualquer elemento `.pos-tag` ou com `data-tag="X"` mostra a descrição
// ao passar o mouse (ou focar), segundo os repertórios da camada ativa. Uma só instância no App.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useSession } from '../stores/session.js'
import { describeTag, loadTagsetData, mergeTagsets, tagsetIdsFor } from '../utils/tagInfo.js'
const { t, locale } = useI18n()
const { layer, layers } = storeToRefs(useSession())
const tip = ref(null)
let timer, current
const SEL = '[data-tag], .pos-tag'
async function describe(tag) {
  // camada "automática": a mais recente do corpus; sem ela, tenta todos os repertórios
  const tool = layer.value || layers.value?.[layers.value.length - 1]?.tool || null
  const sets = (await Promise.all(tagsetIdsFor(tool).map((id) => loadTagsetData(id, locale.value).catch(() => null)))).filter(Boolean)
  return describeTag(tag, mergeTagsets(sets), t)
}
function over(e) {
  const el = e.target.closest?.(SEL)
  if (!el || el === current) return
  hide()
  current = el
  const tag = (el.dataset.tag || el.textContent || '').trim()
  if (!tag) return
  timer = setTimeout(async () => {
    const info = await describe(tag)
    if (current !== el || !info) return
    const r = el.getBoundingClientRect()
    tip.value = { tag, ...info, x: Math.max(8, Math.min(r.left, globalThis.innerWidth - 300)), y: r.bottom + 6 }
  }, 250)
}
function hide() { clearTimeout(timer); tip.value = null; current = null }
const out = (e) => { if (!e.relatedTarget || !current?.contains(e.relatedTarget)) hide() }
onMounted(() => { document.addEventListener('mouseover', over); document.addEventListener('focusin', over); document.addEventListener('mouseout', out); document.addEventListener('focusout', hide); document.addEventListener('scroll', hide, true) })
onBeforeUnmount(() => { document.removeEventListener('mouseover', over); document.removeEventListener('focusin', over); document.removeEventListener('mouseout', out); document.removeEventListener('focusout', hide); document.removeEventListener('scroll', hide, true); clearTimeout(timer) })
</script>
<template>
  <div v-if="tip" role="tooltip" class="fixed z-50 w-72 max-w-[calc(100vw-1rem)] p-2.5 rounded-box bg-neutral text-neutral-content text-xs shadow-lg pointer-events-none"
       :style="{ left: `${tip.x}px`, top: `${tip.y}px` }" data-testid="tag-tip">
    <p class="font-bold text-sm">{{ tip.tag }}<span v-if="tip.source" class="font-normal opacity-80"> · {{ tip.source }}</span></p>
    <p>{{ tip.text }}</p>
    <p v-if="tip.inferred" class="opacity-70 italic mt-1">{{ t('taginfo.inferred') }}</p>
  </div>
</template>
