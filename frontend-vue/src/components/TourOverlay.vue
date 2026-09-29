<script setup>
// Overlay do tour: escurece a tela, recorta o elemento alvo e mostra o balão ao lado.
// Teclado: Esc fecha, setas avançam/voltam. Sem biblioteca externa.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { stepTour, stopTour, tour } from '../composables/useTour.js'
const { t } = useI18n()
const router = useRouter()
const rect = ref(null)
const step = computed(() => (tour.active ? tour.data.steps[tour.index] : null))

async function locate() {
  rect.value = null
  if (!step.value) return
  if (step.value.route && router.currentRoute.value.path !== step.value.route) await router.push(step.value.route)
  for (let i = 0; i < 30; i++) {           // espera a tela carregar (até ~3 s)
    await nextTick()
    const el = document.querySelector(step.value.target)
    if (el) {
      el.scrollIntoView({ block: 'center' })
      await new Promise((r) => setTimeout(r, 60))
      const r = el.getBoundingClientRect()
      rect.value = { x: r.left - 6, y: r.top - 6, w: r.width + 12, h: r.height + 12 }
      document.querySelector('[data-testid=tour-next]')?.focus()
      return
    }
    await new Promise((r) => setTimeout(r, 100))
  }
}
watch(() => [tour.active, tour.index], locate)
const key = (e) => {
  if (!tour.active) return
  if (e.key === 'Escape') stopTour()
  if (e.key === 'ArrowRight') stepTour(1)
  if (e.key === 'ArrowLeft') stepTour(-1)
}
onMounted(() => { window.addEventListener('keydown', key); window.addEventListener('resize', locate) })
onBeforeUnmount(() => { window.removeEventListener('keydown', key); window.removeEventListener('resize', locate) })
const balloon = computed(() => {
  if (!rect.value) return { top: '40%', left: '50%', transform: 'translateX(-50%)' }
  const below = rect.value.y + rect.value.h + 180 < window.innerHeight
  return { top: `${below ? rect.value.y + rect.value.h + 10 : Math.max(10, rect.value.y - 170)}px`,
    left: `${Math.min(Math.max(10, rect.value.x), window.innerWidth - 330)}px` }
})
</script>
<template>
  <div v-if="step" class="fixed inset-0 z-50" role="dialog" aria-modal="true" :aria-label="tour.data.title">
    <div v-if="rect" class="absolute rounded-lg pointer-events-none transition-all"
         :style="{ left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.w}px`, height: `${rect.h}px`, boxShadow: '0 0 0 9999px rgba(0,0,0,.55)', outline: '3px solid var(--color-primary)' }" />
    <div v-else class="absolute inset-0 bg-black/55" />
    <div class="absolute w-80 bg-base-100 text-base-content rounded-box shadow-xl p-4 flex flex-col gap-2" :style="balloon" data-testid="tour-balloon">
      <span class="text-xs text-text-muted">{{ t('tour.step', { n: tour.index + 1, total: tour.data.steps.length }) }}</span>
      <h2 class="font-bold">{{ step.title }}</h2>
      <p class="text-sm">{{ step.text }}</p>
      <RouterLink :to="`/aprender/${step.topic}`" class="link text-xs" @click="stopTour">{{ t('tour.more') }}</RouterLink>
      <div class="flex gap-2 mt-1">
        <button class="btn btn-xs" :disabled="tour.index === 0" @click="stepTour(-1)">{{ t('tour.prev') }}</button>
        <button class="btn btn-xs btn-primary" data-testid="tour-next" @click="stepTour(1)">
          {{ tour.index + 1 === tour.data.steps.length ? t('tour.finish') : t('tour.next') }}</button>
        <button class="btn btn-xs btn-ghost ml-auto" @click="stopTour">{{ t('tour.close') }}</button>
      </div>
    </div>
  </div>
</template>
