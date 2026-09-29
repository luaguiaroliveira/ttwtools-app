<script setup>
// Indicador de cálculo em andamento (busca, frequência...): as rotas são síncronas e não
// informam fração concluída, então a barra é indeterminada.
import { useI18n } from 'vue-i18n'
defineProps({ busy: Boolean })
const { t } = useI18n()
</script>
<template>
  <div v-if="busy" class="flex items-center gap-3 text-sm" role="status" aria-live="polite" data-testid="busy-bar">
    <span class="loading loading-spinner loading-sm text-primary" aria-hidden="true" />
    <span class="opacity-80">{{ t('explore.searching') }}</span>
    <progress class="progress progress-primary flex-1 max-w-xs" />
  </div>
</template>
