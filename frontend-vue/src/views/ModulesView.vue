<script setup>
// Módulos: recursos opcionais baixados sob demanda (modelos de etiquetagem e corpora do catálogo).
import { useI18n } from 'vue-i18n'
import TextType from '../components/vb/TextType.vue'
import ModelsPanel from '../components/ModelsPanel.vue'
import CatalogPanel from '../components/CatalogPanel.vue'
import DiskUsagePanel from '../components/DiskUsagePanel.vue'

const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col gap-6 max-w-5xl" data-explain="explain.modules">
    <div>
      <h1 class="text-2xl font-bold"><TextType :parts="[{ text: t('modules.title'), class: '' }]" /></h1>
      <p class="opacity-80">{{ t('modules.intro') }}</p>
    </div>
    <section class="flex flex-col gap-2" data-testid="modules-models">
      <h2 class="text-xl font-bold">{{ t('modules.models') }}</h2>
      <ModelsPanel />
    </section>
    <section class="flex flex-col gap-2" data-testid="catalog">
      <h2 class="text-xl font-bold">{{ t('modules.corpora') }}</h2>
      <CatalogPanel />
    </section>
    <section class="flex flex-col gap-2" data-testid="modules-disk">
      <h2 class="text-xl font-bold">{{ t('disk.title') }}</h2>
      <DiskUsagePanel />
    </section>
  </div>
</template>
