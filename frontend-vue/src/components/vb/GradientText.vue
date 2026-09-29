<script setup>
// Inspirado em Vue Bits (GradientText), reescrito só com CSS (o original usa motion-v).
// Degradê laranja → texto do tema que se desloca devagar; estático com prefers-reduced-motion.
defineProps({ tag: { type: String, default: 'span' } })
</script>
<template><component :is="tag" class="vb-gradient"><slot /></component></template>
<style>
.vb-gradient { background: linear-gradient(90deg, var(--ttw-orange-text), var(--color-base-content) 50%, var(--ttw-orange-text)) 0 0 / 200% 100%;
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; animation: vb-grad 8s ease-in-out infinite alternate; }
@keyframes vb-grad { to { background-position: 100% 0; } }
@media (prefers-reduced-motion: reduce) { .vb-gradient { animation: none; background: none; -webkit-text-fill-color: currentColor; color: var(--ttw-orange-text); } }
</style>
