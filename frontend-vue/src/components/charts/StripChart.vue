<script setup>
// Um ponto por texto e por atributo, lados em cores diferentes (valor por 1000 palavras).
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SIDE_CLASS, linear } from '../../utils/scale.js'
const props = defineProps({ matrix: Object })
const emit = defineEmits(['open'])
const { t } = useI18n()
const W = 600, ROW = 26
const sides = computed(() => props.matrix.sides)
</script>
<template>
  <svg :viewBox="`0 0 ${W} ${matrix.features.length * ROW + 20}`" class="w-full max-w-3xl" role="group" :aria-label="t('gallery.strip')">
    <g v-for="(f, i) in matrix.features" :key="f" :transform="`translate(0 ${i * ROW + 10})`">
      <text x="110" y="10" text-anchor="end" class="fill-current text-[10px]">{{ f }}</text>
      <line x1="120" :x2="W - 10" y1="6" y2="6" class="stroke-current opacity-15" />
      <template v-for="r in matrix.rows" :key="r.filename + f">
        <circle :cx="linear([0, Math.max(1e-9, ...matrix.rows.map((x) => x.values[f] ?? 0))], [120, W - 10])(r.values[f] ?? 0)"
                :cy="sides.indexOf(r.side) === 0 ? 2 : 10" r="3" :class="SIDE_CLASS[Math.max(0, sides.indexOf(r.side))]" opacity="0.6" class="cursor-pointer" tabindex="0" role="link" :aria-label="t('gallery.open_text', { file: r.filename })"
                @click="emit('open', r)" @keydown.enter="emit('open', r)"><title>{{ r.filename }}: {{ (r.values[f] ?? 0).toFixed(2) }}</title></circle>
      </template>
    </g>
  </svg>
</template>
