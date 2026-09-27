<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useSession } from '../stores/session.js'
const TOOLS = {
  'palavras-chave': defineAsyncComponent(() => import('./compare/KeywordsTool.vue')),
  kfa: defineAsyncComponent(() => import('./compare/KfaTool.vue')),
}
const { t } = useI18n()
const route = useRoute()
const { corpus } = storeToRefs(useSession())
const tool = computed(() => (TOOLS[route.query.tool] ? route.query.tool : 'palavras-chave'))
</script>
<template>
  <div class="flex flex-col gap-3 max-w-6xl">
    <h1 class="text-2xl font-bold">{{ t('compare.title') }}</h1>
    <p v-if="!corpus" class="opacity-70">{{ t('compare.need_corpus') }} <RouterLink to="/corpora" class="link">{{ t('nav.corpora') }}</RouterLink></p>
    <template v-else>
      <div role="tablist" class="tabs tabs-box w-fit">
        <RouterLink v-for="(_, id) in TOOLS" :key="id" role="tab" :to="{ path: '/comparar', query: { tool: id } }" class="tab"
                    :class="{ 'tab-active': tool === id }" :aria-selected="tool === id">{{ t(`compare.tool.${id}`) }}</RouterLink>
      </div>
      <KeepAlive><component :is="TOOLS[tool]" :key="tool + corpus" :corpus="corpus" /></KeepAlive>
    </template>
  </div>
</template>
