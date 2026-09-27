<script setup>
// Barras divergentes (d de Cohen): positivo à direita, negativo à esquerda; clicável.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
const props = defineProps({ rows: { type: Array, required: true }, title: String, max: { type: Number, default: 30 } })
const emit = defineEmits(['select'])
const { t } = useI18n()
const asTable = ref(false)
const shown = computed(() => props.rows.slice(0, props.max))
const top = computed(() => Math.max(0.5, ...shown.value.map((r) => Math.abs(r.value))))
const x = (v) => 300 + (v / top.value) * 180
</script>
<template>
  <figure class="flex flex-col gap-1">
    <figcaption class="text-sm flex items-center">{{ title }}
      <button class="btn btn-xs btn-ghost ml-auto" @click="asTable = !asTable">{{ asTable ? t('chart.as_chart') : t('chart.as_table') }}</button></figcaption>
    <table v-if="asTable" class="table table-xs"><tbody><tr v-for="r in shown" :key="r.label"><td>{{ r.label }}</td><td class="text-right tabular-nums">{{ r.value.toFixed(3) }}</td></tr></tbody></table>
    <svg v-else :viewBox="`0 0 600 ${shown.length * 18 + 6}`" class="w-full max-w-3xl" role="group" :aria-label="title">
      <line x1="300" x2="300" y1="0" :y2="shown.length * 18 + 6" class="stroke-current opacity-40" />
      <g v-for="(r, i) in shown" :key="r.label" :transform="`translate(0 ${i * 18 + 3})`" class="cursor-pointer" tabindex="0"
         role="button" :aria-label="`${r.label} ${r.value.toFixed(2)}`" @click="emit('select', r.label)" @keydown.enter="emit('select', r.label)">
        <rect :x="Math.min(300, x(r.value))" y="2" :width="Math.abs(x(r.value) - 300)" height="12" :class="r.value >= 0 ? 'fill-primary' : 'fill-secondary'" />
        <text :x="r.value >= 0 ? 294 : 306" y="12" :text-anchor="r.value >= 0 ? 'end' : 'start'" class="fill-current text-[10px]">{{ r.label }}</text>
        <text :x="r.value >= 0 ? x(r.value) + 4 : x(r.value) - 4" y="12" :text-anchor="r.value >= 0 ? 'start' : 'end'" class="fill-current text-[9px] opacity-70">{{ r.value.toFixed(2) }}</text>
      </g>
    </svg>
  </figure>
</template>
