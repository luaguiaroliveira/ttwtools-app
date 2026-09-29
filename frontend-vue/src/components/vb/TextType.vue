<script setup>
// Inspirado em Vue Bits (TextType; o original usa gsap): digitação letra a letra, UMA vez ao aparecer,
// com cursor piscando só enquanto digita. Texto completo em aria-label; sem animação com
// prefers-reduced-motion. `parts` = [{ text, class }] permite cores diferentes por trecho.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
const props = defineProps({ parts: { type: Array, required: true }, speed: { type: Number, default: 90 }, delay: { type: Number, default: 250 } })
const full = computed(() => props.parts.map((p) => p.text).join(''))
const count = ref(0)
const typing = ref(false)
let timer
onMounted(() => {
  if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { count.value = full.value.length; return }
  typing.value = true
  timer = setTimeout(function step() {
    if (++count.value >= full.value.length) { typing.value = false; return }
    timer = setTimeout(step, props.speed)
  }, props.delay)
})
onBeforeUnmount(() => clearTimeout(timer))
const shown = computed(() => {
  let left = count.value
  return props.parts.map((p) => { const s = p.text.slice(0, left); left = Math.max(0, left - p.text.length); return { ...p, text: s } })
})
</script>
<template>
  <span :aria-label="full" role="text">
    <span aria-hidden="true" class="inline-block" :style="{ minWidth: `${full.length * 0.6}ch` }">
      <span v-for="(p, i) in shown" :key="i" :class="p.class">{{ p.text }}</span><span v-if="typing" class="vb-cursor">|</span>
    </span>
  </span>
</template>
<style>
.vb-cursor { font-weight: 300; margin-left: 1px; animation: vb-blink .5s steps(1) infinite; }
@keyframes vb-blink { 50% { opacity: 0; } }
</style>
