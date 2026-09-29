<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import GradientText from '../components/vb/GradientText.vue'
import { useSession } from '../stores/session.js'
const TOOLS = {
  'palavras-chave': defineAsyncComponent(() => import('./compare/KeywordsTool.vue')),
  kfa: defineAsyncComponent(() => import('./compare/KfaTool.vue')),
  faixas: defineAsyncComponent(() => import('./compare/BandsTool.vue')),
  laboratorio: defineAsyncComponent(() => import('./compare/LabTool.vue')),
}
const { t } = useI18n()
const route = useRoute()
const session = useSession()
const { corpus, corpora } = storeToRefs(session)
const tool = computed(() => (TOOLS[route.query.tool] ? route.query.tool : 'palavras-chave'))
</script>
<template>
  <div class="flex flex-col gap-3 max-w-[96rem]">
    <h1 class="text-xl font-bold"><GradientText>{{ t('compare.title') }}</GradientText></h1>
    <div v-if="!corpus" class="flex flex-wrap items-center gap-2 opacity-90">
      <span>{{ t('compare.need_corpus') }}</span>
      <select v-if="corpora.length" class="select select-sm" data-testid="compare-corpus" :value="corpus || ''"
              :aria-label="t('header.active_corpus')" @change="session.setCorpus($event.target.value || null)">
        <option value="">{{ t('header.select_corpus') }}</option>
        <option v-for="c in corpora" :key="c.name" :value="c.name">{{ c.name }}</option>
      </select>
    </div>
    <template v-else>
      <div role="tablist" class="tabs tabs-box w-fit" data-explain="explain.compare.tabs">
        <RouterLink v-for="(_, id) in TOOLS" :key="id" role="tab" :to="{ path: '/comparar', query: { tool: id } }" class="tab"
                    :class="{ 'tab-active': tool === id }" :aria-selected="tool === id">{{ t(`compare.tool.${id}`) }}<span v-if="id === 'laboratorio'" class="badge badge-warning badge-xs ml-1">{{ t('lab.badge') }}</span></RouterLink>
      </div>
      <KeepAlive><component :is="TOOLS[tool]" :key="tool + corpus" :corpus="corpus" /></KeepAlive>
    </template>
  </div>
</template>
