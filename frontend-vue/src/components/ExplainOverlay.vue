<script setup>
// "Explicar esta tela": marca cada área com data-explain="chave" e mostra a explicação ao lado.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
const emit = defineEmits(['close'])
const { t } = useI18n()
const notes = ref([])
function collect() {
  notes.value = [...document.querySelectorAll('main [data-explain]')].map((el) => {
    const r = el.getBoundingClientRect()
    return { key: el.dataset.explain, x: r.left, y: r.top, w: r.width, h: r.height }
  }).filter((n) => n.w && n.h && n.y < window.innerHeight && n.y + n.h > 0)
}
const key = (e) => { if (e.key === 'Escape') emit('close') }
onMounted(() => { collect(); window.addEventListener('scroll', collect, true); window.addEventListener('resize', collect); window.addEventListener('keydown', key) })
onBeforeUnmount(() => { window.removeEventListener('scroll', collect, true); window.removeEventListener('resize', collect); window.removeEventListener('keydown', key) })
</script>
<template>
  <div class="fixed inset-0 z-40 pointer-events-none" role="region" :aria-label="t('explain.button')">
    <div class="absolute inset-0 bg-black/30" />
    <template v-for="n in notes" :key="n.key">
      <div class="absolute rounded-lg border-2 border-dashed border-warning" :style="{ left: `${n.x - 4}px`, top: `${n.y - 4}px`, width: `${n.w + 8}px`, height: `${n.h + 8}px` }" />
      <p class="absolute max-w-xs bg-warning text-warning-content text-sm rounded p-2 shadow" data-testid="explain-note"
         :style="{ left: `${Math.min(n.x, innerWidth - 330)}px`, top: `${Math.max(4, n.y - 8)}px`, transform: 'translateY(-100%)' }">{{ t(n.key) }}</p>
    </template>
    <button class="btn btn-sm btn-warning absolute bottom-24 md:bottom-6 right-6 pointer-events-auto" autofocus @click="emit('close')">{{ t('explain.close') }}</button>
  </div>
</template>
