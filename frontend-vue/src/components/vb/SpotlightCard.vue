<script setup>
// Adaptado de Vue Bits (DavidHDev/vue-bits, SpotlightCard; MIT + Commons Clause): porte para JS,
// sem dependências. Luz laranja que segue o mouse; `tag` permite usar como <li>.
import { ref } from 'vue'
// `in srgb` (e não `in oklab`): o WebKit antigo (Safari 17.6, macOS 12) pinta color-mix fora de srgb errado
// (a mistura com transparente fica opaca). Para cor+transparente o resultado é idêntico.
defineProps({ tag: { type: String, default: 'div' }, color: { type: String, default: 'color-mix(in srgb, var(--ttw-orange-text) 32%, transparent)' } })
const el = ref(null)
const pos = ref({ x: 0, y: 0 })
const opacity = ref(0)
function move(e) {
  const r = el.value?.getBoundingClientRect()
  if (r) pos.value = { x: e.clientX - r.left, y: e.clientY - r.top }
}
</script>
<template>
  <component :is="tag" ref="el" class="relative overflow-hidden" @mousemove="move" @mouseenter="opacity = 0.7" @mouseleave="opacity = 0"
             @focusin="opacity = 0.5" @focusout="opacity = 0">
    <span class="pointer-events-none absolute inset-0 transition-opacity duration-500" aria-hidden="true"
          :style="{ opacity, background: `radial-gradient(circle 160px at ${pos.x}px ${pos.y}px, ${color}, transparent 80%)` }" />
    <slot />
  </component>
</template>
