<script setup>
import TextType from '../components/vb/TextType.vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { api } from '../api/index.js'
import { markdown } from '../utils/markdown.js'
import { startTour } from '../composables/useTour.js'
import KfaWidget from '../components/KfaWidget.vue'
import CohenDVisual from '../components/CohenDVisual.vue'
import TaggerTags from '../components/TaggerTags.vue'
const { t, locale } = useI18n()
const route = useRoute()
const q = ref('')
const topics = ref([])
const topic = ref(null)
const TOURS = ['primeiro_corpus']
watch([q, locale], async () => { topics.value = (await api.help.topics(locale.value, q.value || undefined)).topics }, { immediate: true })
watch(() => [route.params.topic, locale.value], async ([id]) => {
  topic.value = id ? await api.help.topic(id, locale.value).catch(() => null) : null
}, { immediate: true })
// O marcador "::cohen-widget::" no corpo do tópico vira o widget interativo da KFA.
const parts = computed(() => (topic.value?.body || '').split(/^::cohen-widget::$/m))
const byArea = computed(() => topics.value.reduce((acc, x) => { (acc[x.area || 'outros'] ||= []).push(x); return acc }, {}))
</script>
<template>
  <div class="flex flex-col gap-4 max-w-4xl">
    <h1 class="text-2xl font-bold"><TextType :parts="[{ text: t('learn.title'), class: '' }]" /></h1>
    <article v-if="topic" class="flex flex-col gap-3" data-testid="help-topic">
      <RouterLink to="/aprender" class="link text-sm">← {{ t('learn.back') }}</RouterLink>
      <h2 class="text-xl font-bold">{{ topic.title }}</h2>
      <p class="opacity-80">{{ topic.summary }}</p>
      <p v-if="topic.fallback" class="alert alert-info text-sm py-1">{{ t('learn.fallback') }}</p>
      <CohenDVisual v-if="topic.id === 'cohens_d'" />
      <template v-for="(part, i) in parts" :key="i">
        <KfaWidget v-if="i > 0" />
        <div class="help-body flex flex-col gap-2" v-html="markdown(part)" />
      </template>
      <TaggerTags v-if="topic.id === 'tags_etiquetadores'" />
      <p v-if="topic.related.length" class="text-sm">{{ t('learn.related') }}:
        <RouterLink v-for="r in topic.related" :key="r" :to="`/aprender/${r}`" class="link mr-2">{{ r }}</RouterLink></p>
    </article>
    <template v-else>
      <input v-model="q" class="input input-sm max-w-md" :placeholder="t('learn.search')" :aria-label="t('learn.search')" data-testid="help-search" />
      <section>
        <h2 class="font-bold mb-2">{{ t('learn.tours') }}</h2>
        <button v-for="id in TOURS" :key="id" class="btn btn-sm btn-primary" data-testid="start-tour" @click="startTour(id, locale)">{{ t('learn.start_tour') }}: {{ t(`tour.${id}.title`) }}</button>
      </section>
      <section v-for="(items, area) in byArea" :key="area">
        <h2 class="font-bold mb-2">{{ t(`learn.area.${area}`) }}</h2>
        <ul class="grid sm:grid-cols-2 gap-2">
          <li v-for="x in items" :key="x.id"><RouterLink :to="`/aprender/${x.id}`" class="card bg-base-200 p-3 hover:bg-base-300 block">
            <span class="font-medium">{{ x.title }}</span><span class="block text-sm text-text-muted">{{ x.summary }}</span></RouterLink></li>
        </ul>
      </section>
    </template>
  </div>
</template>
<style scoped>
.help-body :deep(h3) { font-weight: 700; margin-top: .5rem; }
.help-body :deep(ul) { list-style: disc; padding-left: 1.25rem; }
.help-body :deep(h2) { font-weight: 700; font-size: 1.15rem; margin-top: 1rem; }
.help-body :deep(ol) { list-style: decimal; padding-left: 1.25rem; }
.help-body :deep(blockquote) { border-left: 4px solid var(--color-primary); padding: .25rem .75rem; background: var(--color-base-200); border-radius: 0 .5rem .5rem 0; }
.help-body :deep(table) { border-collapse: collapse; width: 100%; font-size: .9rem; }
.help-body :deep(th), .help-body :deep(td) { border: 1px solid var(--color-base-300); padding: .3rem .5rem; text-align: left; }
.help-body :deep(th) { background: var(--color-base-200); }
.help-body :deep(details) { border: 1px solid var(--color-base-300); border-radius: .5rem; padding: .35rem .75rem; }
.help-body :deep(summary) { cursor: pointer; }
.help-body :deep(hr) { border-color: var(--color-base-300); }
.help-body :deep(pre) { background: var(--color-base-200); padding: .5rem; border-radius: .5rem; overflow-x: auto; }
</style>
