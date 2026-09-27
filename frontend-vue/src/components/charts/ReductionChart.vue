<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SIDE_CLASS, extent, linear } from '../../utils/scale.js'
const props = defineProps({ data: Object, sides: Array })
const { t } = useI18n()
const W = 520, H = 400, P = 20
const sx = computed(() => linear(extent(props.data.coords.map((c) => c.x)), [P, W - P]))
const sy = computed(() => linear(extent(props.data.coords.map((c) => c.y)), [H - P, P]))
</script>
<template>
  <div class="flex flex-col gap-1">
    <p v-if="data.explained_variance" class="text-xs opacity-70">{{ t('gallery.explained', { v: data.explained_variance.map((v) => (v * 100).toFixed(1) + '%').join(' · ') }) }}</p>
    <svg :viewBox="`0 0 ${W} ${H}`" class="w-full max-w-2xl" role="group" :aria-label="t('gallery.reduction')">
      <circle v-for="c in data.coords" :key="c.filename + c.side" :cx="sx(c.x)" :cy="sy(c.y)" r="4" :class="SIDE_CLASS[Math.max(0, sides.indexOf(c.side))]" opacity="0.7"><title>{{ c.side }} · {{ c.filename }}</title></circle>
    </svg>
    <div class="flex gap-3 text-xs"><span v-for="(s, i) in sides" :key="s" class="flex items-center gap-1"><svg width="10" height="10"><circle cx="5" cy="5" r="4" :class="SIDE_CLASS[i]" /></svg>{{ s }}</span></div>
  </div>
</template>
