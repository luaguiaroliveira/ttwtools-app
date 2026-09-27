<script setup>
// Leitor de texto com etiquetas: cada token colorido pela classe (UPOS/XPOS) ou pela
// primeira tag; legenda clicável destaca uma classe; clicar num token (ou navegar pelos
// destacados com os botões) mostra etiquetas, lema, traços e a definição do tagset.
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { api } from '../../api/index.js'

const props = defineProps({ corpus: String, layer: String })
const { t, locale } = useI18n()
const route = useRoute()
const files = ref([])
const file = ref(route.query.file || '')
const doc = ref(null)
const colorBy = ref(route.query.color || 'upos')
const highlight = ref(route.query.highlight || null)
const selected = ref(null)
const tagset = ref({})
const PALETTE = ['#1f77b4', '#d62728', '#2ca02c', '#9467bd', '#ff7f0e', '#17becf', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22',
  '#393b79', '#637939', '#8c6d31', '#843c39', '#7b4173', '#3182bd', '#e6550d']

onMounted(async () => {
  files.value = (await api.corpora.documents(props.corpus, { limit: 1000 })).rows.map((r) => r.filename)
  if (!file.value) file.value = files.value[0]
})
watch(() => [file.value, props.layer], async () => {
  if (!file.value) return
  doc.value = await api.corpora.text(props.corpus, file.value, props.layer)
  selected.value = null
  const tool = doc.value.layer?.tool
  const id = tool === 'biberplus' ? 'biberplus' : tool === 'mfte' ? 'mfte' : 'upos'
  try { tagset.value = Object.fromEntries((await api.taggers.tagset(id, locale.value)).tags.map((x) => [x.tag, x.definition])) } catch { tagset.value = {} }
  await nextTick()
  if (route.query.pos) document.querySelector(`[data-start="${route.query.pos}"]`)?.scrollIntoView({ block: 'center' })
}, { immediate: true })

const label = (tok) => (colorBy.value === 'upos' ? tok.upos : colorBy.value === 'xpos' ? tok.xpos : tok.tags?.[0]) || null
const classes = computed(() => {
  const counts = {}
  for (const tok of doc.value?.tokens ?? []) { const l = label(tok); if (l) counts[l] = (counts[l] || 0) + 1 }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
})
const color = computed(() => Object.fromEntries(classes.value.map(([c], i) => [c, PALETTE[i % PALETTE.length]])))
// texto em pedaços: entre tokens (texto puro) e tokens (spans)
const pieces = computed(() => {
  const text = doc.value?.text
  if (!text) return []
  const out = []
  let pos = 0
  for (const tok of doc.value.tokens) {
    if (tok.start_char < pos) continue
    if (tok.start_char > pos) out.push({ text: text.slice(pos, tok.start_char) })
    out.push({ text: text.slice(tok.start_char, tok.end_char), tok })
    pos = tok.end_char
  }
  out.push({ text: text.slice(pos) })
  return out
})
const hit = (tok) => route.query.pos && tok.start_char >= Number(route.query.pos) && tok.end_char <= Number(route.query.end || route.query.pos)
function step(dir) {
  const toks = doc.value.tokens.filter((x) => label(x) === highlight.value)
  if (!toks.length) return
  const i = selected.value ? toks.findIndex((x) => x.idx === selected.value.idx) : -1
  selected.value = toks[(i + dir + toks.length) % toks.length]
  document.querySelector(`[data-idx="${selected.value.idx}"]`)?.scrollIntoView({ block: 'center' })
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <div class="flex flex-wrap items-end gap-2">
      <label class="form-control"><span class="label-text">{{ t('reader.document') }}</span>
        <select v-model="file" class="select select-sm max-w-xs" data-testid="reader-file"><option v-for="f in files" :key="f">{{ f }}</option></select></label>
      <label class="form-control"><span class="label-text">{{ t('reader.color_by') }}</span>
        <select v-model="colorBy" class="select select-sm"><option value="upos">UPOS</option><option value="xpos">XPOS</option><option value="tags">tags</option></select></label>
      <span v-if="doc?.layer" class="badge badge-ghost">{{ doc.layer.tool }} · {{ doc.layer.model }}</span>
    </div>
    <p v-if="doc && !doc.layer" class="text-sm opacity-70">{{ t('reader.no_layer') }}</p>
    <p v-if="doc && doc.text === null" role="alert" class="alert alert-warning text-sm">{{ t('reader.no_text') }}</p>
    <div v-if="classes.length" class="flex flex-col gap-1">
      <span class="text-xs opacity-70">{{ t('reader.legend') }}</span>
      <div class="flex flex-wrap gap-1" role="group" :aria-label="t('reader.legend')">
        <button v-for="[c, n] in classes" :key="c" class="badge gap-1 cursor-pointer" :aria-pressed="highlight === c"
                :class="{ 'badge-outline': highlight !== c }" :style="{ borderColor: color[c], color: highlight === c ? '#fff' : color[c], background: highlight === c ? color[c] : '' }"
                :title="tagset[c]" @click="highlight = highlight === c ? null : c">{{ c }} <span class="opacity-70">{{ n }}</span></button>
      </div>
      <div v-if="highlight" class="flex gap-2">
        <button class="btn btn-xs" @click="step(-1)">{{ t('reader.prev') }}</button>
        <button class="btn btn-xs" @click="step(1)">{{ t('reader.next') }}</button>
        <span class="text-xs opacity-70">{{ tagset[highlight] }}</span>
      </div>
    </div>
    <div class="grid lg:grid-cols-[1fr_16rem] gap-3">
      <article class="bg-base-100 border border-base-300 rounded-box p-4 leading-8 whitespace-pre-wrap max-h-[70vh] overflow-auto" data-testid="reader-text">
        <template v-for="(p, i) in pieces" :key="i"><span v-if="!p.tok">{{ p.text }}</span><span v-else :data-idx="p.tok.idx"
            :data-start="p.tok.start_char" class="cursor-pointer rounded px-px"
            :class="{ 'ring-2 ring-primary': selected?.idx === p.tok.idx, 'bg-warning/40': hit(p.tok) }"
            :style="label(p.tok) && (!highlight || highlight === label(p.tok)) ? { borderBottom: `3px solid ${color[label(p.tok)]}` } : {}"
            @click="selected = p.tok">{{ p.text }}</span></template>
      </article>
      <aside class="bg-base-200 rounded-box p-3 text-sm self-start" aria-live="polite">
        <h3 class="font-bold mb-1">{{ t('reader.token') }}</h3>
        <dl v-if="selected" class="grid grid-cols-[auto_1fr] gap-x-2">
          <dt>word</dt><dd class="font-bold">{{ selected.word }}</dd>
          <template v-for="k in ['lemma', 'upos', 'xpos', 'feats']" :key="k"><template v-if="selected[k]"><dt>{{ k }}</dt><dd class="break-all">{{ selected[k] }}</dd></template></template>
          <template v-if="selected.tags?.length"><dt>tags</dt><dd>{{ selected.tags.join(' ') }}</dd></template>
          <dt>def.</dt><dd>{{ tagset[label(selected)] || '—' }}</dd>
        </dl>
      </aside>
    </div>
  </section>
</template>
