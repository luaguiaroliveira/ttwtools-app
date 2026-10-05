<script setup>
// Duas áreas lado a lado com divisória arrastável (mouse, toque e teclado). A largura da esquerda
// vem em `v-model` (porcentagem) e pode ser escondida num dos lados sem recalcular o conteúdo.
// Em telas estreitas (até 1023px) as áreas empilham — gráfico em cima, tabela embaixo — sem divisória.
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SplitHandle from './SplitHandle.vue'

const props = defineProps({
  modelValue: { type: Number, default: 50 },
  showLeft: { type: Boolean, default: true },
  showRight: { type: Boolean, default: true },
  min: { type: Number, default: 20 },
  max: { type: Number, default: 80 },
  fill: { type: Boolean, default: false },   // ocupa toda a altura e deixa cada lado rolar (telas largas)
})
const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()
const root = ref(null)
const clamp = (v) => Math.max(props.min, Math.min(props.max, Math.round(v * 100) / 100))
const split = computed({
  get: () => clamp(props.modelValue),
  set: (v) => emit('update:modelValue', clamp(v)),
})
const both = computed(() => props.showLeft && props.showRight)
const style = computed(() => (both.value ? { '--split': `${split.value}%`, gridTemplateColumns: `${split.value}% 0.5rem minmax(0, 1fr)` } : {}))

let dragging = false
function onMove(e) {
  if (!dragging || !root.value) return
  const r = root.value.getBoundingClientRect()
  split.value = ((e.clientX - r.left) / r.width) * 100
}
function onUp() {
  dragging = false
  globalThis.removeEventListener('pointermove', onMove)
  globalThis.removeEventListener('pointerup', onUp)
}
function onDown(e) {
  dragging = true
  e.preventDefault()
  globalThis.addEventListener('pointermove', onMove)
  globalThis.addEventListener('pointerup', onUp)
}
function onKey(e) {
  const step = e.shiftKey ? 10 : 2
  if (e.key === 'ArrowLeft') split.value = split.value - step
  else if (e.key === 'ArrowRight') split.value = split.value + step
  else if (e.key === 'Home') split.value = props.min
  else if (e.key === 'End') split.value = props.max
  else return
  e.preventDefault()
}
onBeforeUnmount(onUp)
</script>
<template>
  <div ref="root" class="ttw-split w-full" :class="{ 'is-fill': fill }" :style="style" data-testid="split-pane">
    <div v-if="showLeft" class="min-w-0 flex flex-col gap-3">
      <slot />
    </div>
    <SplitHandle v-if="both" :label="t('analysis.divider')" :now="split" :min="min" :max="max"
                 @down="onDown" @key="onKey" />
    <div v-if="showRight" class="min-w-0 flex flex-col gap-3">
      <slot name="right" />
    </div>
  </div>
</template>
<style scoped>
.ttw-split { display: grid; grid-template-columns: minmax(0, 1fr); align-items: start; }
@media (max-width: 1023px) {
  .ttw-split { grid-template-columns: minmax(0, 1fr) !important; }
  .ttw-split-handle { display: none !important; }
}
@media (min-width: 1024px) {
  .ttw-split.is-fill { height: 100%; align-items: stretch; }
  .ttw-split.is-fill > div { height: 100%; min-height: 0; overflow: auto; }
}
</style>
