<script setup>
// Créditos do TTWtools: autoria, versão, data de publicação e repositório.
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { api } from '../api/index.js'
import { useSession } from '../stores/session.js'
import AppDialog from './AppDialog.vue'
defineProps({ open: Boolean })
defineEmits(['close'])
const { t } = useI18n()
const { version } = storeToRefs(useSession())
const AUTHORS = ['Luciana Aguiar de Oliveira', 'José Henrique Padovani']
const REPO = 'https://github.com/luaguiaroliveira/ttwtools-app'
// na janela do aplicativo o link abre no navegador do sistema
const openRepo = () => api.utils.openUrl(REPO).catch(() => window.open(REPO, '_blank', 'noopener'))
</script>
<template>
  <AppDialog :open="open" title="TTWtools" @close="$emit('close')">
    <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm" data-testid="about">
      <dt class="opacity-70">{{ t('about.authors') }}</dt>
      <dd><span v-for="a in AUTHORS" :key="a" class="block font-medium">{{ a }}</span></dd>
      <dt class="opacity-70">{{ t('about.version') }}</dt>
      <dd>{{ version?.app ?? '…' }} <span class="opacity-60">· ttwtools {{ version?.ttwtools ?? '…' }}</span></dd>
      <dt class="opacity-70">{{ t('about.date') }}</dt>
      <dd>{{ version?.date ?? '—' }}<span v-if="version?.commit" class="opacity-60"> · {{ version.commit }}</span></dd>
      <dt class="opacity-70">{{ t('about.repo') }}</dt>
      <dd><a :href="REPO" class="link link-primary break-all" target="_blank" rel="noopener" @click.prevent="openRepo">{{ REPO.replace('https://', '') }}</a></dd>
    </dl>
  </AppDialog>
</template>
