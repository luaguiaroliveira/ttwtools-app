<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import TextType from '../components/vb/TextType.vue'
import { lazyTool } from '../utils/lazy.js'
import { useSession } from '../stores/session.js'

const TOOLS = {
  busca: lazyTool(() => import('./explore/SearchTool.vue')),
  kwic: lazyTool(() => import('./explore/KwicTool.vue')),
  frequencia: lazyTool(() => import('./explore/FrequencyTool.vue')),
  colocados: lazyTool(() => import('./explore/CollocatesTool.vue')),
  dispersao: lazyTool(() => import('./explore/DispersionTool.vue')),
}
const { t } = useI18n()
const route = useRoute()
const session = useSession()
const { corpus, layer, corpora } = storeToRefs(session)
const tool = computed(() => (TOOLS[route.params.tool] ? route.params.tool : 'kwic'))
</script>

<template>
  <div class="flex flex-col gap-3 h-full min-h-0 max-w-[96rem] print:max-w-none">
    <h1 class="text-xl font-bold shrink-0 print:hidden"><TextType :parts="[{ text: t('explore.title'), class: '' }]" /></h1>
    <div v-if="!corpus" class="flex flex-wrap items-center gap-2 opacity-90">
      <span>{{ t('explore.need_corpus') }}</span>
      <select v-if="corpora.length" class="select select-sm" data-testid="explore-corpus" :value="corpus || ''"
              :aria-label="t('header.active_corpus')" @change="session.setCorpus($event.target.value || null)">
        <option value="">{{ t('header.select_corpus') }}</option>
        <option v-for="c in corpora" :key="c.name" :value="c.name">{{ c.name }}</option>
      </select>
    </div>
    <template v-else>
      <div role="tablist" :aria-label="t('explore.tools')" class="tabs tabs-box overflow-x-auto flex-nowrap shrink-0 print:hidden" data-explain="explain.explore.tabs">
        <RouterLink v-for="(_, id) in TOOLS" :key="id" role="tab" :to="`/explorar/${id}`" class="tab whitespace-nowrap"
                    :class="{ 'tab-active': tool === id }" :aria-selected="tool === id">{{ t(`explore.tool.${id}`) }}</RouterLink>
      </div>
      <div class="flex-1 min-h-0 overflow-auto">
        <KeepAlive><component :is="TOOLS[tool]" :key="tool + corpus + (layer || '')" :corpus="corpus" :layer="layer" /></KeepAlive>
      </div>
    </template>
  </div>
</template>
