<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useSession } from '../stores/session.js'
const TOOLS = {
  'palavras-chave': defineAsyncComponent(() => import('./compare/KeywordsTool.vue')),
  kfa: defineAsyncComponent(() => import('./compare/KfaTool.vue')),
  faixas: defineAsyncComponent(() => import('./compare/BandsTool.vue')),
  laboratorio: defineAsyncComponent(() => import('./compare/LabTool.vue')),
}
const { t } = useI18n()
const route = useRoute()
const { corpus } = storeToRefs(useSession())
const tool = computed(() => (TOOLS[route.query.tool] ? route.query.tool : 'palavras-chave'))
</script>
<template>
  <div class="flex flex-col gap-3 max-w-6xl">
    <h1 class="text-2xl font-bold">{{ t('compare.title') }}</h1>
    <p v-if="!corpus" class="opacity-70">{{ t('compare.need_corpus') }}</p>
    <template v-else>
      <div role="tablist" class="tabs tabs-box w-fit" data-explain="explain.compare.tabs">
        <RouterLink v-for="(_, id) in TOOLS" :key="id" role="tab" :to="{ path: '/comparar', query: { tool: id } }" class="tab"
                    :class="{ 'tab-active': tool === id }" :aria-selected="tool === id">{{ t(`compare.tool.${id}`) }}<span v-if="id === 'laboratorio'" class="badge badge-warning badge-xs ml-1">{{ t('lab.badge') }}</span></RouterLink>
      </div>
      <KeepAlive><component :is="TOOLS[tool]" :key="tool + corpus" :corpus="corpus" /></KeepAlive>
    </template>
  </div>
</template>
