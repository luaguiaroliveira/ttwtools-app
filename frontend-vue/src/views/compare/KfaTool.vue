<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { api } from '../../api/index.js'
import { useSession } from '../../stores/session.js'
import ChartGallery from '../../components/ChartGallery.vue'
import Collapsible from '../../components/Collapsible.vue'
import HelpTip from '../../components/HelpTip.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'
const lastParams = ref(null)
const props = defineProps({ corpus: String })
const { t } = useI18n()
const { corpora, activeCorpus } = storeToRefs(useSession())
const f = ref({ corpus2: '', groupKey: '', group1: '', group2: '', layer: '', metric: 'kfa', min_effect: 0.2 })
const groups = ref([])
const data = ref(null)
const error = ref(null)
const detail = ref(null)
const layers = computed(() => [...new Set((activeCorpus.value?.layers ?? []).map((l) => l.tool))])
watch(layers, (ls) => { if (!f.value.layer && ls.length) f.value.layer = ls[0] }, { immediate: true })
const sameCorpus = computed(() => f.value.corpus2 === '__groups__')
async function loadGroups() {
  groups.value = f.value.groupKey ? [...new Set((await api.corpora.documents(props.corpus, { limit: 1000 })).rows.map((r) => r[f.value.groupKey]))] : []
}
const side = (n) => (sameCorpus.value ? { corpus: props.corpus, where: { [f.value.groupKey]: [f.value[`group${n}`]] } }
  : { corpus: n === 1 ? props.corpus : f.value.corpus2, where: undefined })
async function run() {
  error.value = null
  detail.value = null
  const s1 = side(1), s2 = side(2)
  lastParams.value = { corpus: s1.corpus, corpus2: s2.corpus, layer: f.value.layer, metric: f.value.metric, min_effect: f.value.min_effect,
    where: s1.where, where2: s2.where }
  try {
    data.value = await api.compare.kfa({ corpus1: s1.corpus, corpus2: s2.corpus, where1: s1.where, where2: s2.where,
      layer: f.value.layer, metric: f.value.metric, min_effect: f.value.min_effect })
  } catch (err) { error.value = err.message }
}
async function select(name) {
  const [a, b] = await Promise.all([1, 2].map((n) => { const s = side(n); return api.compare.feature({ corpus: s.corpus, where: s.where, layer: f.value.layer, name }) }))
  const row = data.value.rows.find((r) => r.Feature === name)
  detail.value = { name, row, v1: a.values, v2: b.values }
}
const gallerySides = computed(() => [1, 2].map((n) => { const s = side(n); return { corpus: s.corpus, where: s.where, label: sameCorpus.value ? `${f.value.groupKey}=${f.value[`group${n}`]}` : s.corpus } }))
const maxV = computed(() => Math.max(1, ...[...(detail.value?.v1 ?? []), ...(detail.value?.v2 ?? [])].map((v) => v.value)))
</script>
<template>
  <section class="flex flex-col gap-3">
    <p v-if="!layers.length" class="opacity-70">{{ t('kfa.no_layer') }}</p>
    <form v-else class="flex flex-wrap items-end gap-2" @submit.prevent="run">
      <label class="form-control"><span class="label-text">{{ t('kfa.corpus2') }}</span>
        <select v-model="f.corpus2" class="select select-sm" data-testid="kfa-corpus2">
          <option v-for="c in corpora.filter((c) => c.name !== corpus)" :key="c.name" :value="c.name">{{ c.name }}</option>
          <option value="__groups__" :disabled="!activeCorpus?.metadata_keys.length">{{ t('kfa.same_corpus_groups') }}</option></select></label>
      <template v-if="sameCorpus">
        <label class="form-control"><span class="label-text">{{ t('compare.group_key') }}</span>
          <select v-model="f.groupKey" class="select select-sm" @change="loadGroups"><option v-for="k in activeCorpus.metadata_keys" :key="k">{{ k }}</option></select></label>
        <label class="form-control"><span class="label-text">{{ t('kfa.group1') }}</span><select v-model="f.group1" class="select select-sm"><option v-for="g in groups" :key="g">{{ g }}</option></select></label>
        <label class="form-control"><span class="label-text">{{ t('kfa.group2') }}</span><select v-model="f.group2" class="select select-sm"><option v-for="g in groups" :key="g">{{ g }}</option></select></label>
      </template>
      <button class="btn btn-sm btn-primary" data-testid="kfa-run">{{ t('compare.run') }}</button>
      <HelpTip term="kfa" />
    </form>
    <div class="w-full">
      <Collapsible :title="t('compare.advanced')">
        <div class="flex flex-wrap items-end gap-2 pt-2">
          <label class="form-control"><span class="label-text">{{ t('kfa.layer') }}</span>
            <select v-model="f.layer" class="select select-sm"><option v-for="l in layers" :key="l">{{ l }}</option></select></label>
          <label class="form-control"><span class="label-text flex items-center gap-1"><HelpTip term="kfa">{{ t('kfa.metric') }}</HelpTip></span>
            <select v-model="f.metric" class="select select-sm"><option value="kfa">KFA (Biber & Egbert)</option><option value="kfa2">KFA2</option></select></label>
          <label class="form-control w-24"><span class="label-text flex items-center gap-1"><HelpTip term="cohens_d">{{ t('kfa.min_effect') }}</HelpTip></span><input v-model.number="f.min_effect" type="number" step="0.1" min="0" class="input input-sm" /></label>
        </div>
      </Collapsible>
    </div>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="data">
      <p role="status" class="text-sm">{{ t('kfa.results', { n: data.rows.length, n1: data.n1, n2: data.n2 }) }}</p>
      <div class="flex gap-1"><CopyCode analysis="kfa" :params="lastParams" /><ExportMenu name="kfa" :rows="data.rows" /></div>
      <ChartGallery :kfa="data" :layer="f.layer" :sides="gallerySides" @select="select" />
      <section v-if="detail" class="bg-base-200 rounded-box p-3 flex flex-col gap-2" aria-live="polite">
        <h3 class="font-bold">{{ t('kfa.detail', { feature: detail.name }) }}</h3>
        <p class="text-sm">d = {{ detail.row.Effect_Size.toFixed(3) }} · {{ t('kfa.mean') }}: {{ detail.row.Mean_Corpus1.toFixed(2) }} × {{ detail.row.Mean_Corpus2.toFixed(2) }}</p>
        <p class="text-xs opacity-70">{{ t('kfa.detail_hint') }}</p>
        <svg viewBox="0 0 600 70" class="w-full max-w-3xl" role="img" :aria-label="detail.name">
          <g v-for="(vals, i) in [detail.v1, detail.v2]" :key="i" :transform="`translate(0 ${i * 32 + 6})`">
            <text x="0" y="14" class="fill-current text-[10px]">{{ t(i ? 'kfa.side2' : 'kfa.side1') }}</text>
            <line x1="70" x2="590" y1="10" y2="10" class="stroke-current opacity-20" />
            <circle v-for="v in vals" :key="v.filename" :cx="70 + (v.value / maxV) * 520" cy="10" r="4" :class="i ? 'fill-secondary' : 'fill-primary'" opacity="0.7"><title>{{ v.filename }}: {{ v.value.toFixed(2) }}</title></circle>
          </g>
        </svg>
        <RouterLink class="link text-sm" :to="{ path: '/explorar/leitor', query: { color: 'tags', highlight: detail.name } }">{{ t('kfa.open_reader') }}</RouterLink>
      </section>
      <div class="overflow-x-auto max-h-80">
        <table class="table table-xs table-pin-rows"><thead><tr><th>{{ t('kfa.feature') }}</th><th class="text-right">d</th><th class="text-right">{{ t('kfa.side1') }}</th><th class="text-right">{{ t('kfa.side2') }}</th></tr></thead>
          <tbody><tr v-for="r in data.rows" :key="r.Feature" class="hover cursor-pointer" @click="select(r.Feature)"><td>{{ r.Feature }}</td><td class="text-right tabular-nums">{{ r.Effect_Size.toFixed(3) }}</td>
            <td class="text-right tabular-nums">{{ r.Mean_Corpus1.toFixed(2) }}</td><td class="text-right tabular-nums">{{ r.Mean_Corpus2.toFixed(2) }}</td></tr></tbody></table>
      </div>
    </template>
  </section>
</template>
