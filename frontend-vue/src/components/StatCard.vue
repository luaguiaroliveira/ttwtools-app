<script setup>
import HelpTip from './HelpTip.vue'
import SpotlightCard from './vb/SpotlightCard.vue'
import CountUp from './vb/CountUp.vue'
// `count` (número) faz o valor contar até ele, formatado por `format`; sem `count`, mostra `value` como veio
defineProps({ label: String, value: [String, Number], help: String, count: Number, format: Function })
</script>
<template>
  <SpotlightCard class="stat ttw-rise bg-base-200 rounded-box p-3">
    <div class="stat-title text-xs flex items-center gap-1">{{ label }}<HelpTip v-if="help" :topic="help" /></div>
    <div class="stat-value text-2xl tabular-nums"><CountUp v-if="count !== undefined && count !== null" :to="count" :format="format" /><template v-else>{{ value ?? '—' }}</template></div>
  </SpotlightCard>
</template>
