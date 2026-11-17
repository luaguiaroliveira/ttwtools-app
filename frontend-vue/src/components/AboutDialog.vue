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
const LICENSE_URL = 'https://www.gnu.org/licenses/gpl-3.0.html'
// na janela do aplicativo o link abre no navegador do sistema
const openRepo = () => api.utils.openUrl(REPO).catch(() => window.open(REPO, '_blank', 'noopener'))
const openLicense = () => api.utils.openUrl(LICENSE_URL).catch(() => window.open(LICENSE_URL, '_blank', 'noopener'))
</script>
<template>
  <AppDialog :open="open" title="TTWtools" @close="$emit('close')">
    <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm" data-testid="about">
      <dt class="text-text-muted">{{ t('about.authors') }}</dt>
      <dd><span v-for="a in AUTHORS" :key="a" class="block font-medium">{{ a }}</span></dd>
      <dt class="text-text-muted">{{ t('about.version') }}</dt>
      <dd>{{ version?.app ?? '…' }} <span class="text-text-muted">· ttwtools {{ version?.ttwtools ?? '…' }}</span></dd>
      <dt class="text-text-muted">{{ t('about.date') }}</dt>
      <dd>{{ version?.date ?? '—' }}<span v-if="version?.commit" class="text-text-muted"> · {{ version.commit }}</span></dd>
      <dt class="text-text-muted">{{ t('about.repo') }}</dt>
      <dd><a :href="REPO" class="link link-primary break-all" target="_blank" rel="noopener" @click.prevent="openRepo">{{ REPO.replace('https://', '') }}</a></dd>
      <dt class="text-text-muted">{{ t('catalog.license') }}</dt>
      <dd><a :href="LICENSE_URL" class="link link-primary" target="_blank" rel="noopener" @click.prevent="openLicense">GNU GPL v3.0+</a></dd>
    </dl>
  </AppDialog>
</template>
