<script setup>
defineProps({ d: { type: String, required: true } })
</script>
<template>
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor"><path :d="d" /></svg>
</template>
