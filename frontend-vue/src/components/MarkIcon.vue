<script setup>
// Ícones dos estilos de marcação do leitor ('off' = olho fechado, sem marcação).
defineProps({ kind: { type: String, default: 'highlight' } })
</script>
<template>
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="kind === 'off'"><path d="M1.5 8s2.3-4 6.5-4c1 0 1.900.2 2.700.6M14.500 8s-2.300 4-6.500 4c-1 0-1.900-.2-2.700-.6" /><path d="M2 14 14 2" /></template>
    <template v-else-if="kind === 'highlight'"><rect x="1.500" y="4.500" width="13" height="7" rx="2" fill="currentColor" fill-opacity=".45" stroke="none" /><path d="M4 8h8" /></template>
    <rect v-else-if="kind === 'box'" x="2" y="4" width="12" height="8" rx=".5" />
    <ellipse v-else-if="kind === 'circle'" cx="8" cy="8" rx="6.500" ry="4.500" />
    <path v-else-if="kind === 'underline'" d="M2 13h12M4 3v4.500a4 4 0 0 0 8 0V3" />
    <path v-else-if="kind === 'strike'" d="M2 8h12M5 4.500C5.500 3.500 6.500 3 8 3s3 .8 3 2.200M11 11.500C10.500 12.500 9.500 13 8 13s-3-.8-3-2.200" />
    <path v-else d="M3 3l10 10M13 3 3 13" />
  </svg>
</template>
