<script setup>
// Widget do d de Cohen na KFA: médias dos dois corpora e desvio-padrão combinado em controles;
// mostra as duas curvas, a sobreposição, o d e sua leitura.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const m1 = ref(50), m2 = ref(65), sd = ref(15)
const XMIN = -20, XMAX = 120, N = 240, YMAX = 1.12
const W = 840, H = 360, padL = 34, padR = 22, padT = 40, padB = 46
const plotW = W - padL - padR, plotH = H - padT - padB
const X = (x) => padL + ((x - XMIN) / (XMAX - XMIN)) * plotW
const Y = (y) => padT + plotH - (y / YMAX) * plotH
const g = (x, mu) => Math.exp(-0.5 * ((x - mu) / sd.value) ** 2)
const xs = Array.from({ length: N + 1 }, (_, i) => XMIN + (i * (XMAX - XMIN)) / N)
const line = (f) => xs.map((x) => `${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`).join(' ')
const area = (f) => `${line(f)} ${X(XMAX)},${Y(0)} ${X(XMIN)},${Y(0)}`
const c1 = computed(() => line((x) => g(x, m1.value)))
const c2 = computed(() => line((x) => g(x, m2.value)))
const a1 = computed(() => area((x) => g(x, m1.value)))
const a2 = computed(() => area((x) => g(x, m2.value)))
const ov = computed(() => area((x) => Math.min(g(x, m1.value), g(x, m2.value))))
const d = computed(() => (m1.value - m2.value) / sd.value)
const overlap = computed(() => {
  let s1 = 0, sm = 0
  for (const x of xs) { s1 += g(x, m1.value); sm += Math.min(g(x, m1.value), g(x, m2.value)) }
  return s1 > 0 ? Math.round((sm / s1) * 100) : 100
})
const reading = computed(() => { const a = Math.abs(d.value); return a < 0.2 ? 'none' : a < 0.5 ? 'small' : a < 0.8 ? 'medium' : 'large' })
const ticks = [0, 20, 40, 60, 80, 100]
</script>
<template>
  <div class="kfa-widget card bg-base-200 p-3 flex flex-col gap-2" data-testid="kfa-widget">
    <div class="grid gap-1">
      <label class="flex items-center gap-2 text-sm"><span class="w-56">{{ t('kfaw.m1') }}</span><output class="w-8 text-right">{{ m1 }}</output>
        <input v-model.number="m1" type="range" min="0" max="100" step="1" class="range range-xs flex-1" :aria-label="t('kfaw.m1')" /></label>
      <label class="flex items-center gap-2 text-sm"><span class="w-56">{{ t('kfaw.m2') }}</span><output class="w-8 text-right">{{ m2 }}</output>
        <input v-model.number="m2" type="range" min="0" max="100" step="1" class="range range-xs flex-1" :aria-label="t('kfaw.m2')" /></label>
      <label class="flex items-center gap-2 text-sm"><span class="w-56">{{ t('kfaw.sd') }}</span><output class="w-8 text-right">{{ sd }}</output>
        <input v-model.number="sd" type="range" min="1" max="40" step="1" class="range range-xs flex-1" :aria-label="t('kfaw.sd')" /></label>
    </div>
    <svg :viewBox="`0 0 ${W} ${H}`" class="w-full bg-base-100 rounded-lg" role="img" :aria-label="t('kfaw.readout', { d: d.toFixed(2), reading: t(`kfaw.read.${reading}`), overlap })">
      <line :x1="padL" :x2="W - padR" :y1="Y(0)" :y2="Y(0)" stroke="currentColor" stroke-opacity=".3" />
      <g v-for="k in ticks" :key="k" font-size="13" text-anchor="middle" fill="currentColor" fill-opacity=".7">
        <line :x1="X(k)" :x2="X(k)" :y1="Y(0)" :y2="Y(0) + 5" stroke="currentColor" stroke-opacity=".3" />
        <text :x="X(k)" :y="Y(0) + 20">{{ k }}</text>
      </g>
      <polygon :points="ov" fill="currentColor" fill-opacity=".25" />
      <polygon :points="a1" fill="#d1495b" fill-opacity=".12" /><polygon :points="a2" fill="#2b7bb9" fill-opacity=".12" />
      <polyline :points="c1" fill="none" stroke="#d1495b" stroke-width="2" /><polyline :points="c2" fill="none" stroke="#2b7bb9" stroke-width="2" />
      <g font-size="13" font-weight="700" text-anchor="middle">
        <line :x1="X(m1)" :x2="X(m1)" :y1="Y(0)" :y2="Y(1)" stroke="#d1495b" stroke-dasharray="5 4" />
        <text :x="X(m1)" :y="Y(1) - 6" fill="#d1495b">M₁ = {{ m1 }}</text>
        <line :x1="X(m2)" :x2="X(m2)" :y1="Y(0)" :y2="Y(1)" stroke="#2b7bb9" stroke-dasharray="5 4" />
        <text :x="X(m2)" :y="m1 === m2 ? Y(1) - 22 : Y(1) - 6" fill="#2b7bb9">M₂ = {{ m2 }}</text>
      </g>
      <g v-if="Math.abs(m1 - m2) > 1" font-size="12" text-anchor="middle" fill="currentColor">
        <line :x1="X(m1)" :x2="X(m2)" :y1="Y(0.52)" :y2="Y(0.52)" stroke="currentColor" stroke-width="1.2" />
        <text :x="(X(m1) + X(m2)) / 2" :y="Y(0.52) - 5">M₁ − M₂ = {{ m1 - m2 }}</text>
      </g>
      <text :x="padL + plotW / 2" :y="H - 8" font-size="12" text-anchor="middle" fill="currentColor" fill-opacity=".7">{{ t('kfaw.xlabel') }}</text>
    </svg>
    <p class="text-xs opacity-70">{{ t('kfaw.caption') }}</p>
    <p class="text-sm text-center" data-testid="kfa-widget-readout"><strong>{{ t('kfaw.d') }}: {{ d >= 0 ? '+' : '' }}{{ d.toFixed(2) }}</strong>
      · {{ t(`kfaw.read.${reading}`) }} · {{ t('kfaw.overlap') }}: {{ overlap }}% · {{ t(m1 >= m2 ? 'kfaw.higher1' : 'kfaw.higher2') }}.</p>
  </div>
</template>
