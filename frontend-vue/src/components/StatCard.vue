<script setup>
defineProps({ label: String, value: [String, Number], help: String })
import HelpTip from './HelpTip.vue'
</script>
<template>
  <div class="stat bg-base-200 rounded-box p-3">
    <div class="stat-title text-xs flex items-center gap-1">{{ label }}<HelpTip v-if="help" :topic="help" /></div>
    <div class="stat-value text-2xl tabular-nums">{{ value ?? '—' }}</div>
  </div>
</template>
