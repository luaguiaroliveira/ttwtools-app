<script setup>
// Painel recolhível acessível (details/summary nativo): recolhido por padrão.
defineProps({ title: { type: String, required: true }, open: { type: Boolean, default: false } })
</script>
<template>
  <details class="collapse collapse-arrow bg-base-200 border border-base-300" :open="open">
    <summary class="collapse-title font-medium">{{ title }}</summary>
    <div class="collapse-content"><slot /></div>
  </details>
</template>
