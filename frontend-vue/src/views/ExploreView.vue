<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
<template>
  <section>
    <h1 class="text-2xl font-bold mb-2">{{ t('explore.title') }}</h1>
    <p class="opacity-70">{{ t('explore.empty') }}</p>
  </section>
</template>
