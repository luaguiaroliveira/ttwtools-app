<script setup>
// Barras divergentes (d de Cohen): positivo à direita, negativo à esquerda; clicável.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { galleryMemory } from '../utils/memory.js'
const props = defineProps({ rows: { type: Array, required: true }, title: String })
const emit = defineEmits(['select'])
const { t } = useI18n()
const asTable = ref(false)
// altura de cada barra e quantas mostrar: com muitos atributos de d pequeno, barras baixas cabem na tela; a área rola
const rowH = ref(galleryMemory.barH ?? 18)
const limit = ref(galleryMemory.barLimit ?? 0)            // 0 = todas
watch([rowH, limit], () => { galleryMemory.barH = rowH.value; galleryMemory.barLimit = limit.value })
const shown = computed(() => (limit.value ? props.rows.slice(0, limit.value) : props.rows))
const font = computed(() => Math.max(4, Math.min(11, rowH.value * 0.6)))
const barH = computed(() => Math.max(2, rowH.value - 6))
const top = computed(() => Math.max(0.5, ...shown.value.map((r) => Math.abs(r.value))))
const x = (v) => 300 + (v / top.value) * 180
</script>
<template>
  <figure class="flex flex-col gap-1">
    <figcaption class="text-sm flex items-center">{{ title }}
      <button class="btn btn-xs btn-ghost ml-auto" @click="asTable = !asTable">{{ asTable ? t('chart.as_chart') : t('chart.as_table') }}</button></figcaption>
    <div v-if="!asTable" class="flex flex-wrap items-end gap-3" data-testid="bars-controls">
      <label class="ttw-field w-44"><span class="ttw-label">{{ t('gallery.bar_height') }}: {{ rowH }}</span>
        <input v-model.number="rowH" type="range" min="6" max="40" step="1" class="range range-xs range-primary" data-testid="bars-height" :aria-label="t('gallery.bar_height')" /></label>
      <label class="ttw-field"><span class="ttw-label">{{ t('gallery.bar_count') }}</span>
        <select v-model.number="limit" class="select select-sm" data-testid="bars-limit">
          <option :value="0">{{ t('gallery.bar_all', { n: rows.length }) }}</option><option v-for="n in [20, 30, 50, 100]" :key="n" :value="n">{{ n }}</option></select></label>
    </div>
    <table v-if="asTable" class="table table-xs"><tbody><tr v-for="r in shown" :key="r.label"><td>{{ r.label }}</td><td class="text-right tabular-nums">{{ r.value.toFixed(3) }}</td></tr></tbody></table>
    <div v-else class="overflow-y-auto max-h-[70vh] rounded-box border border-base-300" data-testid="bars-scroll">
      <svg :viewBox="`0 0 600 ${shown.length * rowH + 6}`" class="w-full max-w-3xl" role="group" :aria-label="title">
        <line x1="300" x2="300" y1="0" :y2="shown.length * rowH + 6" class="stroke-current opacity-40" />
        <g v-for="(r, i) in shown" :key="r.label" :transform="`translate(0 ${i * rowH + 3})`" class="cursor-pointer" tabindex="0"
           role="button" :aria-label="`${r.label} ${r.value.toFixed(2)}`" @click="emit('select', r.label)" @keydown.enter="emit('select', r.label)">
          <rect :x="Math.min(300, x(r.value))" :y="(rowH - barH) / 2" :width="Math.abs(x(r.value) - 300)" :height="barH" :class="r.value >= 0 ? 'fill-chart-1' : 'fill-chart-2'" />
          <text :x="r.value >= 0 ? 294 : 306" :y="rowH / 2 + font * 0.35" :text-anchor="r.value >= 0 ? 'end' : 'start'" :font-size="font" class="fill-current">{{ r.label }}</text>
          <text :x="r.value >= 0 ? x(r.value) + 4 : x(r.value) - 4" :y="rowH / 2 + font * 0.35" :text-anchor="r.value >= 0 ? 'start' : 'end'" :font-size="font * 0.9" class="fill-current text-text-muted">{{ r.value.toFixed(2) }}</text>
        </g>
      </svg>
    </div>
  </figure>
</template>
