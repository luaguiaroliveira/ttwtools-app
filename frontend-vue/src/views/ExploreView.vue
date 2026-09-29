<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import GradientText from '../components/vb/GradientText.vue'
import { useSession } from '../stores/session.js'

const TOOLS = {
  busca: defineAsyncComponent(() => import('./explore/SearchTool.vue')),
  kwic: defineAsyncComponent(() => import('./explore/KwicTool.vue')),
  frequencia: defineAsyncComponent(() => import('./explore/FrequencyTool.vue')),
  colocados: defineAsyncComponent(() => import('./explore/CollocatesTool.vue')),
  dispersao: defineAsyncComponent(() => import('./explore/DispersionTool.vue')),
  leitor: defineAsyncComponent(() => import('./explore/ReaderTool.vue')),
}
const { t } = useI18n()
const route = useRoute()
const session = useSession()
const { corpus, layer, corpora } = storeToRefs(session)
const tool = computed(() => (TOOLS[route.params.tool] ? route.params.tool : 'kwic'))
</script>

<template>
  <div class="flex flex-col gap-3 max-w-[96rem] print:max-w-none">
    <h1 class="text-xl font-bold print:hidden"><GradientText>{{ t('explore.title') }}</GradientText></h1>
    <div v-if="!corpus" class="flex flex-wrap items-center gap-2 opacity-90">
      <span>{{ t('explore.need_corpus') }}</span>
      <select v-if="corpora.length" class="select select-sm" data-testid="explore-corpus" :value="corpus || ''"
              :aria-label="t('header.active_corpus')" @change="session.setCorpus($event.target.value || null)">
        <option value="">{{ t('header.select_corpus') }}</option>
        <option v-for="c in corpora" :key="c.name" :value="c.name">{{ c.name }}</option>
      </select>
    </div>
    <template v-else>
      <div role="tablist" :aria-label="t('explore.tools')" class="tabs tabs-box overflow-x-auto flex-nowrap print:hidden" data-explain="explain.explore.tabs">
        <RouterLink v-for="(_, id) in TOOLS" :key="id" role="tab" :to="`/explorar/${id}`" class="tab whitespace-nowrap"
                    :class="{ 'tab-active': tool === id }" :aria-selected="tool === id">{{ t(`explore.tool.${id}`) }}</RouterLink>
      </div>
      <KeepAlive><component :is="TOOLS[tool]" :key="tool + corpus + (layer || '')" :corpus="corpus" :layer="layer" /></KeepAlive>
    </template>
  </div>
</template>
