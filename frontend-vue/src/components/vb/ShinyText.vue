<script setup>
// Inspirado em Vue Bits (ShinyText), reescrito só com CSS (o original usa motion-v).
// Brilho que passa pelo texto; parado com prefers-reduced-motion. Cores dos tokens (AA nos 3 temas).
defineProps({ tag: { type: String, default: 'span' }, speed: { type: Number, default: 3 } })
</script>
<template><component :is="tag" class="vb-shiny" :style="{ '--vb-speed': `${speed}s` }"><slot /></component></template>
<style>
.vb-shiny { background: linear-gradient(110deg, var(--ttw-orange-text) 35%, var(--color-base-content) 50%, var(--ttw-orange-text) 65%) 100% 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; animation: vb-shine var(--vb-speed) linear infinite; }
@keyframes vb-shine { to { background-position: -50% 0; } }
@media (prefers-reduced-motion: reduce) { .vb-shiny { animation: none; background: none; -webkit-text-fill-color: currentColor; color: var(--ttw-orange-text); } }
</style>
