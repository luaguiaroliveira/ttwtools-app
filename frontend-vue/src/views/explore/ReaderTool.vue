<script setup>
// Leitor de texto com etiquetas: texto à esquerda e, à direita, a coluna de etiquetas
// (classes UPOS/XPOS ou primeira tag) com seleção múltipla; cada etiqueta marcada é
// sublinhada no texto com rough-notation (traço à mão, animado ao selecionar). Clicar num
// token mostra etiquetas, lema, traços e a definição do tagset.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { annotate } from 'rough-notation'
import { api } from '../../api/index.js'

const props = defineProps({ corpus: String, layer: String })
const { t, locale } = useI18n()
const route = useRoute()
const files = ref([])
const file = ref(route.query.file || '')
const doc = ref(null)
const colorBy = ref(route.query.color || 'upos')
const chosen = ref(new Set(route.query.highlight ? [route.query.highlight] : []))
const selected = ref(null)
const tagset = ref({})
const window = globalThis
const article = ref(null)
const PALETTE = ['#1f77b4', '#d62728', '#2ca02c', '#9467bd', '#ff7f0e', '#17becf', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22',
  '#393b79', '#637939', '#8c6d31', '#843c39', '#7b4173', '#3182bd', '#e6550d']
const MAX_ANNOTATIONS = 2500   // acima disso o SVG pesa: marca só as primeiras
const STAGGER_MS = 18

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
const isOn = (tok) => chosen.value.has(label(tok))
let justAdded = null
function toggle(c) {
  const next = new Set(chosen.value)
  if (next.has(c)) next.delete(c); else { next.add(c); justAdded = c }
  chosen.value = next
}
function step(dir) {
  const toks = doc.value.tokens.filter(isOn)
  if (!toks.length) return
  const i = selected.value ? toks.findIndex((x) => x.idx === selected.value.idx) : -1
  selected.value = toks[(i + dir + toks.length) % toks.length]
  document.querySelector(`[data-idx="${selected.value.idx}"]`)?.scrollIntoView({ block: 'center' })
}

// --- rough-notation ---------------------------------------------------------------
// Uma anotação por token marcado. Ao marcar uma etiqueta nova, só ela anima (em cascata,
// começando pelos tokens visíveis); as demais e os redesenhos (redimensionar, trocar
// documento) aparecem sem animação. Respeita prefers-reduced-motion.
let annotations = []
const reduceMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches
function clearAnnotations() { annotations.forEach((a) => a.remove()); annotations = [] }
function draw() {
  clearAnnotations()
  const root = article.value
  if (!root || !chosen.value.size) { justAdded = null; return }
  const box = root.getBoundingClientRect()
  const still = reduceMotion()
  let order = 0
  for (const el of root.querySelectorAll('[data-idx]')) {
    if (annotations.length >= MAX_ANNOTATIONS) break
    const c = el.dataset.cls
    if (!chosen.value.has(c)) continue
    const r = el.getBoundingClientRect()
    const visible = r.bottom > box.top && r.top < box.bottom
    const animate = !still && c === justAdded && visible && order < 60
    const a = annotate(el, { type: 'underline', color: color.value[c], strokeWidth: 2, padding: 1, iterations: 1,
      animate, animationDuration: 350, multiline: false })
    annotations.push(a)
    if (animate) setTimeout(() => a.show(), order++ * STAGGER_MS); else a.show()
  }
  justAdded = null
}
let raf = 0
const redraw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw) }
watch([chosen, classes, pieces, colorBy], async () => { await nextTick(); redraw() }, { flush: 'post' })
let ro
onMounted(() => { if (globalThis.ResizeObserver && article.value) { ro = new ResizeObserver(redraw); ro.observe(article.value) } })
onBeforeUnmount(() => { ro?.disconnect(); cancelAnimationFrame(raf); clearAnnotations() })
</script>

<template>
  <section class="flex flex-col gap-3">
    <div class="ttw-form">
      <label class="ttw-field"><span class="ttw-label">{{ t('reader.document') }}</span>
        <select v-model="file" class="select select-sm max-w-xs" data-testid="reader-file"><option v-for="f in files" :key="f">{{ f }}</option></select></label>
      <label class="ttw-field"><span class="ttw-label">{{ t('reader.color_by') }}</span>
        <select v-model="colorBy" class="select select-sm" @change="chosen = new Set()"><option value="upos">UPOS</option><option value="xpos">XPOS</option><option value="tags">tags</option></select></label>
      <span v-if="doc?.layer" class="badge badge-ghost h-8">{{ doc.layer.tool }} · {{ doc.layer.model }}</span>
      <button class="btn btn-sm ml-auto print:hidden" @click="window.print()">{{ t('reader.print') }}</button>
    </div>
    <p v-if="doc && !doc.layer" class="text-sm opacity-70">{{ t('reader.no_layer') }}</p>
    <p v-if="doc && doc.text === null" role="alert" class="alert alert-warning text-sm">{{ t('reader.no_text') }}</p>
    <div class="grid lg:grid-cols-[1fr_18rem] gap-4 items-start">
      <article ref="article" class="reader-print ttw-annot bg-base-100 border border-base-300 rounded-box p-6 leading-9 whitespace-pre-wrap max-h-[75vh] overflow-auto print:max-h-none print:overflow-visible print:border-0" data-testid="reader-text">
        <template v-for="(p, i) in pieces" :key="i"><span v-if="!p.tok">{{ p.text }}</span><span v-else :data-idx="p.tok.idx"
            :data-start="p.tok.start_char" :data-cls="label(p.tok)" class="cursor-pointer rounded"
            :class="{ 'ring-2 ring-primary': selected?.idx === p.tok.idx, 'bg-warning/40': hit(p.tok) }"
            @click="selected = p.tok">{{ p.text }}</span></template>
      </article>
      <aside class="flex flex-col gap-3 lg:sticky lg:top-2 print:hidden" aria-live="polite">
        <div v-if="classes.length" class="bg-base-200 rounded-box p-3 flex flex-col gap-2" role="group" :aria-label="t('reader.tags_title')">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-sm">{{ t('reader.tags_title') }}</h3>
            <button v-if="chosen.size" class="btn btn-xs btn-ghost ml-auto" @click="chosen = new Set()">{{ t('reader.clear') }}</button>
          </div>
          <p class="text-xs opacity-70">{{ t('reader.tags_hint') }}</p>
          <div class="flex flex-wrap gap-1.5 max-h-72 overflow-auto">
            <button v-for="[c, n] in classes" :key="c" type="button" class="badge gap-1 cursor-pointer transition-colors"
                    :aria-pressed="chosen.has(c)" :class="{ 'badge-outline': !chosen.has(c) }"
                    :style="{ borderColor: color[c], color: chosen.has(c) ? '#fff' : color[c], background: chosen.has(c) ? color[c] : '' }"
                    :title="tagset[c]" @click="toggle(c)">{{ c }} <span class="opacity-70">{{ n }}</span></button>
          </div>
          <div v-if="chosen.size" class="flex gap-2">
            <button class="btn btn-xs" @click="step(-1)">{{ t('reader.prev') }}</button>
            <button class="btn btn-xs" @click="step(1)">{{ t('reader.next') }}</button>
          </div>
          <ul v-if="chosen.size" class="text-xs opacity-80 flex flex-col gap-0.5">
            <li v-for="c in chosen" :key="c"><span class="font-bold" :style="{ color: color[c] }">{{ c }}</span> {{ tagset[c] }}</li>
          </ul>
        </div>
        <div class="bg-base-200 rounded-box p-3 text-sm">
          <h3 class="font-bold mb-1">{{ t('reader.token') }}</h3>
          <dl v-if="selected" class="grid grid-cols-[auto_1fr] gap-x-2">
            <dt>word</dt><dd class="font-bold">{{ selected.word }}</dd>
            <template v-for="k in ['lemma', 'upos', 'xpos', 'feats']" :key="k"><template v-if="selected[k]"><dt>{{ k }}</dt><dd class="break-all">{{ selected[k] }}</dd></template></template>
            <template v-if="selected.tags?.length"><dt>tags</dt><dd>{{ selected.tags.join(' ') }}</dd></template>
            <dt>def.</dt><dd>{{ tagset[label(selected)] || '—' }}</dd>
          </dl>
        </div>
      </aside>
    </div>
  </section>
</template>
