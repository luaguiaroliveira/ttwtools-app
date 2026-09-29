<script setup>
// Ícones das ações de arquivo: novo, abrir, salvar, salvar como.
defineProps({ name: { type: String, required: true } })
</script>
<template>
  <svg viewBox="0 0 24 24" class="text-primary" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="name === 'new'"><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M12 11v6M9 14h6" /></template>
    <template v-else-if="name === 'open'"><path d="M3 7a1 1 0 0 1 1-1h5l2 2.500h8a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M3 11h18" /></template>
    <template v-else-if="name === 'recent'"><circle cx="12" cy="12" r="8.500" /><path d="M12 7v5l3.500 2" /></template>
    <template v-else-if="name === 'save'"><path d="M5 3h11l3 3v15H5z" /><path d="M8 3v5h7V3" /><rect x="8" y="13" width="8" height="8" rx="1" /></template>
    <template v-else><path d="M5 3h11l3 3v6" /><path d="M8 3v5h7V3" /><path d="M5 3v18h6" /><path d="M14.500 20.500 21 14l1.500 1.500L16 22h-2z" /></template>
  </svg>
</template>
