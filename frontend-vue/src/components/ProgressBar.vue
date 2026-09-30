<script setup>
// Barra de progresso própria (div + transform): o <progress> nativo estilizado pelo daisyUI aparece
// como barra cheia e parada em alguns WebKit (macOS 12). `value` de 0 a 100; null = andamento
// desconhecido (faixa deslizante, que respeita "reduzir movimento").
defineProps({ value: { type: Number, default: null }, label: { type: String, default: '' } })
</script>
<template>
  <div class="h-2 w-full overflow-hidden rounded-full bg-base-300" role="progressbar" :aria-label="label || undefined"
       aria-valuemin="0" aria-valuemax="100" :aria-valuenow="value === null ? undefined : Math.round(value)" data-testid="progress-bar">
    <div v-if="value === null" class="ttw-bar-busy h-full w-1/3 rounded-full bg-primary" />
    <div v-else class="h-full rounded-full bg-primary transition-[width] duration-300" :style="{ width: Math.max(0, Math.min(100, value)) + '%' }" />
  </div>
</template>
<style scoped>
.ttw-bar-busy { animation: ttw-bar-slide 1.4s ease-in-out infinite; will-change: transform; }
@keyframes ttw-bar-slide { 0% { transform: translateX(-110%); } 100% { transform: translateX(310%); } }
@media (prefers-reduced-motion: reduce) {
  .ttw-bar-busy { width: 100%; animation: ttw-bar-pulse 2s ease-in-out infinite; }
  @keyframes ttw-bar-pulse { 0%, 100% { opacity: .35; } 50% { opacity: .9; } }
}
</style>
