<script setup>
// Visual interativo do d de Cohen: duas curvas normais (desvio 1) e um controle
// que afasta as médias; mostra d e a sobreposição (2·Φ(−|d|/2)).
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
const props = defineProps({ initial: { type: Number, default: 0.8 }, compact: Boolean })
const { t } = useI18n()
const d = ref(props.initial)
const erf = (x) => { const s = Math.sign(x); x = Math.abs(x); const t1 = 1 / (1 + 0.3275911 * x)
  return s * (1 - (((((1.061405429 * t1 - 1.453152027) * t1) + 1.421413741) * t1 - 0.284496736) * t1 + 0.254829592) * t1 * Math.exp(-x * x)) }
const phi = (x) => 0.5 * (1 + erf(x / Math.SQRT2))
const overlap = computed(() => Math.round(200 * phi(-Math.abs(d.value) / 2)))
const W = 320, H = 110
const curve = (mu) => {
  const pts = []
  for (let i = 0; i <= 120; i++) {
    const x = -4 + (i / 120) * 11
    const y = Math.exp(-((x - mu) ** 2) / 2)
    pts.push(`${((x + 4) / 11) * W},${H - 10 - y * (H - 20)}`)
  }
  return pts.join(' ')
}
</script>
<template>
  <figure class="flex flex-col gap-1" :class="compact ? 'text-xs' : 'text-sm'">
    <figcaption class="font-medium">{{ t('cohen.title') }}</figcaption>
    <svg :viewBox="`0 0 ${W} ${H}`" class="w-full max-w-md" role="img" :aria-label="t('cohen.value', { d: d.toFixed(1), overlap })">
      <polyline :points="curve(0)" fill="none" class="stroke-chart-1" stroke-width="2" />
      <polyline :points="curve(d)" fill="none" class="stroke-chart-2" stroke-width="2" />
      <text x="4" y="12" class="fill-chart-1 text-[10px]">{{ t('cohen.group1') }}</text>
      <text :x="W - 50" y="12" class="fill-chart-2 text-[10px]">{{ t('cohen.group2') }}</text>
    </svg>
    <label class="flex items-center gap-2">{{ t('cohen.slider') }}
      <input v-model.number="d" type="range" min="0" max="3" step="0.1" class="range range-xs flex-1" data-testid="cohen-slider" /></label>
    <p aria-live="polite" data-testid="cohen-value">{{ t('cohen.value', { d: d.toFixed(1), overlap }) }}</p>
  </figure>
</template>
