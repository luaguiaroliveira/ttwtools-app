<script setup>
// Mostrado quando o arquivo de uma ferramenta não carrega (interface recompilada com a janela aberta, ou rede local caiu).
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const reload = () => globalThis.location.reload()
</script>
<template>
  <div role="alert" class="alert alert-warning flex flex-wrap items-center gap-2" data-testid="tool-load-error">
    <span>{{ t('app.tool_load_failed') }}</span>
    <button type="button" class="btn btn-sm" @click="reload">{{ t('app.reload') }}</button>
  </div>
</template>
