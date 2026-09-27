<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
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
const router = useRouter()
const { corpus, layer } = storeToRefs(useSession())
const tool = computed(() => (TOOLS[route.params.tool] ? route.params.tool : 'kwic'))
</script>

<template>
  <div class="flex flex-col gap-3 max-w-6xl">
    <h1 class="text-2xl font-bold">{{ t('explore.title') }}</h1>
    <p v-if="!corpus" class="opacity-70">{{ t('explore.need_corpus') }} <RouterLink to="/arquivo" class="link">{{ t('nav.corpora') }}</RouterLink></p>
    <template v-else>
      <div role="tablist" :aria-label="t('explore.tools')" class="tabs tabs-box overflow-x-auto flex-nowrap" data-explain="explain.explore.tabs">
        <RouterLink v-for="(_, id) in TOOLS" :key="id" role="tab" :to="`/explorar/${id}`" class="tab whitespace-nowrap"
                    :class="{ 'tab-active': tool === id }" :aria-selected="tool === id">{{ t(`explore.tool.${id}`) }}</RouterLink>
      </div>
      <KeepAlive><component :is="TOOLS[tool]" :key="tool + corpus + (layer || '')" :corpus="corpus" :layer="layer" /></KeepAlive>
    </template>
  </div>
</template>
