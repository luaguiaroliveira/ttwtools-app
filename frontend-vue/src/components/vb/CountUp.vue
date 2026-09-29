<script setup>
// Adaptado de Vue Bits (CountUp): porte para JS, sem dependências. Conta até `to` com mola ao
// montar (e quando `to` muda); a formatação (idioma, casas) vem de `format`.
// Sem animação com prefers-reduced-motion.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
const props = defineProps({ to: { type: Number, required: true }, format: { type: Function, default: (v) => String(Math.round(v)) }, duration: { type: Number, default: 1.2 } })
const shown = ref(props.format(0))
let cur = 0, vel = 0, raf = 0
const still = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches
function tick() {
  const k = 100 / props.duration, d = 20 + 40 / props.duration
  const scale = Math.max(1, Math.abs(props.to))
  vel += ((props.to - cur) * k - vel * d) * 0.016
  cur += vel * 0.016
  const done = Math.abs(props.to - cur) < 0.005 * scale && Math.abs(vel) < 0.01 * scale
  shown.value = props.format(done ? props.to : cur)
  raf = done ? 0 : requestAnimationFrame(tick)
}
function go() {
  cancelAnimationFrame(raf)
  if (still() || !Number.isFinite(props.to)) { cur = props.to; shown.value = props.format(props.to); return }
  vel = 0
  raf = requestAnimationFrame(tick)
}
onMounted(go)
watch(() => props.to, go)
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>
<template><span class="tabular-nums">{{ shown }}</span></template>
