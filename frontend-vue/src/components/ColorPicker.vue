<script setup>
// Seletor de cor com três métodos: roda (matiz × saturação + luminosidade), paletas e hex/RGB.
// Tudo por teclado; hex e RGB são a alternativa acessível à roda.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { hexToHsl, hexToRgb, hslToHex, isHex, rgbToHex } from '../utils/color.js'
const props = defineProps({ modelValue: { type: String, required: true }, palettes: { type: Array, required: true } })   // palettes: [{ id, colors }]
const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()
const tab = ref('wheel')
const hsl = ref(hexToHsl(props.modelValue))
let last = props.modelValue
watch(() => props.modelValue, (v) => { if (v.toLowerCase() !== last.toLowerCase() && isHex(v)) { hsl.value = hexToHsl(v); last = v } })
function commit() { last = hslToHex(...hsl.value); emit('update:modelValue', last) }
function setHex(v) { if (!isHex(v)) return; hsl.value = hexToHsl(v); last = v.toLowerCase(); emit('update:modelValue', last) }
const R = 70   // raio da roda (px)
const wheel = ref(null)
function fromPointer(e) {
  const b = wheel.value.getBoundingClientRect()
  const dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2)
  hsl.value = [(Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360, Math.min(1, Math.hypot(dx, dy) / (b.width / 2)), hsl.value[2]]
  commit()
}
const down = (e) => { wheel.value.setPointerCapture?.(e.pointerId); fromPointer(e) }
const move = (e) => { if (e.buttons) fromPointer(e) }
function keys(e) {
  const [h, s, l] = hsl.value
  const d = { ArrowLeft: [-6, 0], ArrowRight: [6, 0], ArrowUp: [0, 0.05], ArrowDown: [0, -0.05] }[e.key]
  if (!d) return
  e.preventDefault()
  hsl.value = [(h + d[0] + 360) % 360, Math.max(0, Math.min(1, s + d[1])), l]
  commit()
}
const marker = computed(() => {
  const [h, s] = hsl.value, a = h * Math.PI / 180
  return { left: `${R + Math.sin(a) * s * R}px`, top: `${R - Math.cos(a) * s * R}px` }
})
const L = computed(() => Math.round(hsl.value[2] * 100))
const wheelBg = computed(() => {
  const stops = Array.from({ length: 13 }, (_, i) => `hsl(${i * 30} 100% ${L.value}%)`).join(',')
  return { background: `radial-gradient(circle closest-side, hsl(0 0% ${L.value}%), transparent), conic-gradient(${stops})` }
})
const setL = (e) => { hsl.value = [hsl.value[0], hsl.value[1], Number(e.target.value) / 100]; commit() }
const hex = computed(() => hslToHex(...hsl.value))
const draft = ref(hex.value)
watch(hex, (v) => { draft.value = v })
const rgb = computed(() => hexToRgb(hex.value))
const setChannel = (i, v) => { const c = [...rgb.value]; c[i] = Math.max(0, Math.min(255, Number(v) || 0)); setHex(rgbToHex(...c)) }
const TABS = ['wheel', 'palettes', 'hex']
</script>
<template>
  <div class="flex flex-col gap-2 w-56" data-testid="color-picker">
    <div role="tablist" class="flex gap-1 text-xs">
      <button v-for="k in TABS" :key="k" type="button" role="tab" class="btn btn-xs flex-1" :class="tab === k ? 'btn-active' : 'btn-ghost'"
              :aria-selected="tab === k" @click="tab = k">{{ t(`reader.color_${k}`) }}</button>
    </div>
    <div v-if="tab === 'wheel'" class="flex flex-col items-center gap-2">
      <div ref="wheel" class="relative rounded-full cursor-crosshair touch-none border border-base-300" :style="[{ width: `${2 * R}px`, height: `${2 * R}px` }, wheelBg]"
           tabindex="0" role="application" :aria-label="t('reader.color_wheel_hint')" @pointerdown="down" @pointermove="move" @keydown="keys">
        <span class="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white shadow pointer-events-none ring-1 ring-black/60" :style="[marker, { background: hex }]" />
      </div>
      <label class="flex items-center gap-2 w-full text-xs">{{ t('reader.lightness') }}
        <input type="range" min="5" max="95" :value="L" class="range range-xs flex-1" :aria-valuetext="`${L}%`" @input="setL" /></label>
    </div>
    <div v-else-if="tab === 'palettes'" class="flex flex-col gap-2">
      <div v-for="p in palettes" :key="p.id" class="flex flex-col gap-1">
        <span class="text-xs text-text-muted">{{ t(`reader.palette.${p.id}`) }}</span>
        <div class="flex flex-wrap gap-1">
          <button v-for="c in p.colors" :key="c" type="button" class="w-6 h-6 rounded-full border-2 cursor-pointer" :aria-label="c" :aria-pressed="c.toLowerCase() === hex"
                  :class="c.toLowerCase() === hex ? 'border-base-content' : 'border-base-300'" :style="{ background: c }" @click="setHex(c)" />
        </div>
      </div>
    </div>
    <div v-else class="flex flex-col gap-2">
      <label class="flex items-center gap-2 text-xs">Hex
        <input v-model="draft" class="input input-xs flex-1 font-mono" maxlength="7" spellcheck="false" data-testid="color-hex" :aria-invalid="!isHex(draft)"
               @input="isHex(draft) && setHex(draft)" @blur="draft = hex" /></label>
      <div class="grid grid-cols-3 gap-1">
        <label v-for="(n, i) in ['R', 'G', 'B']" :key="n" class="flex flex-col text-xs">{{ n }}
          <input type="number" min="0" max="255" class="input input-xs" :value="rgb[i]" @input="setChannel(i, $event.target.value)" /></label>
      </div>
    </div>
    <div class="flex items-center gap-2 text-xs"><span class="w-5 h-5 rounded border border-base-300" :style="{ background: hex }" />
      <span class="font-mono">{{ hex }}</span><slot /></div>
  </div>
</template>
