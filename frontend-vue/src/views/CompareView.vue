<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import TextType from '../components/vb/TextType.vue'
import { lazyTool } from '../utils/lazy.js'
import { useSession } from '../stores/session.js'
import { useCompare } from '../stores/compare.js'
const TOOLS = {
  'palavras-chave': lazyTool(() => import('./compare/KeywordsTool.vue')),
  kfa: lazyTool(() => import('./compare/KfaTool.vue')),
  faixas: lazyTool(() => import('./compare/BandsTool.vue')),
  dispersao: lazyTool(() => import('./compare/DispersionCompareTool.vue')),
  laboratorio: lazyTool(() => import('./compare/LabTool.vue')),
}
const { t } = useI18n()
const route = useRoute()
const session = useSession()
const { corpus, corpora, activeCorpus } = storeToRefs(session)
const cmp = useCompare()
const keys = computed(() => activeCorpus.value?.metadata_keys ?? [])
watch([corpus, corpora, keys], () => { if (corpus.value) cmp.ensure(corpus.value, corpora.value, keys.value) }, { immediate: true, deep: true })
watch(() => [cmp.corpus2, cmp.groupKey, corpus.value], () => { if (cmp.sameCorpus && corpus.value) cmp.loadGroups(corpus.value) }, { immediate: true })
const usesMetric = computed(() => ['kfa', 'laboratorio'].includes(route.query.tool))
const tool = computed(() => (TOOLS[route.query.tool] ? route.query.tool : 'palavras-chave'))
</script>
<template>
  <div class="flex flex-col gap-3 max-w-[96rem]" :style="cmp.cssVars">
    <h1 class="sr-only"><TextType :parts="[{ text: t('compare.title'), class: '' }]" /></h1>
    <div v-if="!corpus" class="flex flex-wrap items-center gap-2 opacity-90">
      <span>{{ t('compare.need_corpus') }}</span>
      <select v-if="corpora.length" class="select select-sm" data-testid="compare-corpus" :value="corpus || ''"
              :aria-label="t('header.active_corpus')" @change="session.setCorpus($event.target.value || null)">
        <option value="">{{ t('header.select_corpus') }}</option>
        <option v-for="c in corpora" :key="c.name" :value="c.name">{{ c.name }}</option>
      </select>
    </div>
    <template v-else>
      <section class="rounded-box border border-base-300 bg-base-200/40 p-2 flex flex-wrap items-end gap-3" :aria-label="t('compare.setup')" data-testid="compare-setup">
        <div class="ttw-field"><span class="ttw-label">{{ t('compare.side1') }}</span>
          <div class="flex items-center gap-1"><input type="color" :value="cmp.colors[0]" class="h-8 w-8 cursor-pointer rounded border border-base-300 bg-transparent p-0.5" :aria-label="t('compare.color_of', { side: corpus })" :title="t('compare.color_of', { side: corpus })" data-testid="cmp-color1" @input="cmp.setColor(0, $event.target.value)" />
            <span class="font-medium text-sm">{{ cmp.sameCorpus ? corpus : corpus }}</span></div></div>
        <span class="pb-2 text-text-muted" aria-hidden="true">×</span>
        <label class="ttw-field"><span class="ttw-label">{{ t('compare.side2') }}</span>
          <div class="flex items-center gap-1"><input type="color" :value="cmp.colors[1]" class="h-8 w-8 cursor-pointer rounded border border-base-300 bg-transparent p-0.5" :aria-label="t('compare.color_of', { side: cmp.corpus2 })" :title="t('compare.color_of', { side: cmp.corpus2 })" data-testid="cmp-color2" @input="cmp.setColor(1, $event.target.value)" />
            <select v-model="cmp.corpus2" class="select select-sm" data-testid="cmp-corpus2">
              <option v-for="c in corpora.filter((c) => c.name !== corpus)" :key="c.name" :value="c.name">{{ c.name }}</option>
              <option value="__groups__" :disabled="!keys.length">{{ t('kfa.same_corpus_groups') }}</option></select></div></label>
        <template v-if="cmp.sameCorpus">
          <label class="ttw-field"><span class="ttw-label">{{ t('compare.group_key') }}</span>
            <select v-model="cmp.groupKey" class="select select-sm"><option v-for="k in keys" :key="k">{{ k }}</option></select></label>
          <label class="ttw-field"><span class="ttw-label">{{ t('kfa.group1') }}</span><select v-model="cmp.group1" class="select select-sm" data-testid="cmp-group1"><option v-for="g in cmp.groups" :key="g">{{ g }}</option></select></label>
          <label class="ttw-field"><span class="ttw-label">{{ t('kfa.group2') }}</span><select v-model="cmp.group2" class="select select-sm" data-testid="cmp-group2"><option v-for="g in cmp.groups" :key="g">{{ g }}</option></select></label>
        </template>
        <label v-if="usesMetric" class="ttw-field"><span class="ttw-label">{{ t('kfa.metric') }}</span>
          <select :value="cmp.metric" class="select select-sm" data-testid="kfa-metric" @change="cmp.setMetric($event.target.value)">
            <option value="kfa" :title="t('kfa.metric_kfa_hint')">{{ t('kfa.metric_kfa') }}</option><option value="kfa2" :title="t('kfa.metric_kfa2_hint')">{{ t('kfa.metric_kfa2') }}</option></select></label>
        <button type="button" class="btn btn-xs btn-ghost" @click="cmp.resetColors()">{{ t('compare.reset_colors') }}</button>
        <p class="basis-full text-xs text-text-muted">{{ t('compare.setup_hint') }}</p>
      </section>
      <div role="tablist" class="tabs tabs-box w-fit" data-explain="explain.compare.tabs">
        <RouterLink v-for="(_, id) in TOOLS" :key="id" role="tab" :to="{ path: '/comparar', query: { tool: id } }" class="tab"
                    :class="{ 'tab-active': tool === id }" :aria-selected="tool === id">{{ t(`compare.tool.${id}`) }}<span v-if="id === 'laboratorio'" class="badge badge-warning badge-xs ml-1">{{ t('lab.badge') }}</span></RouterLink>
      </div>
      <KeepAlive><component :is="TOOLS[tool]" :key="tool + corpus" :corpus="corpus" /></KeepAlive>
    </template>
  </div>
</template>
