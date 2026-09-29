<script setup>
// Leitor de texto com etiquetas: texto à esquerda e, à direita, a coluna de etiquetas
// (classes UPOS/XPOS ou primeira tag) com seleção múltipla; cada etiqueta marcada é
// marcada no texto com traço à mão (roughjs, o motor do rough-notation), no estilo escolhido
// ao lado de cada etiqueta e animada ao selecionar. Clicar num
// token mostra etiquetas, lema, traços e a definição do tagset.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import rough from 'roughjs/bundled/rough.esm.js'
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

// --- marcações à mão ---------------------------------------------------------------
// Cada token marcado ganha um <svg> DENTRO do próprio span, posicionado em relação a ele:
// as marcas acompanham o texto em qualquer reflow (tela, impressão, PDF), sem coordenadas
// absolutas da página. Só o tamanho do token é medido. Ao marcar uma etiqueta nova, só ela
// anima (em cascata, começando pelos tokens visíveis). Respeita prefers-reduced-motion.
const KINDS = ['underline', 'highlight', 'box', 'circle', 'strike', 'cross']
const kinds = ref({})   // etiqueta → estilo (padrão: sublinhado)
const kindOf = (c) => kinds.value[c] || 'underline'
const SVG_NS = 'http://www.w3.org/2000/svg'
const PAD = 4
const reduceMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches
function clearAnnotations() { article.value?.querySelectorAll('svg.rn').forEach((n) => n.remove()) }
function shapes(rc, kind, w, h, o) {
  const x0 = PAD, x1 = PAD + w, y0 = PAD, y1 = PAD + h
  switch (kind) {
    case 'highlight': return [rc.line(x0 - 2, (y0 + y1) / 2, x1 + 2, (y0 + y1) / 2, { ...o, strokeWidth: h * 0.95, roughness: 1.6 })]
    case 'box': return [rc.rectangle(x0 - 2, y0, w + 4, h, o)]
    case 'circle': return [rc.ellipse((x0 + x1) / 2, (y0 + y1) / 2, w + 12, h + 6, o)]
    case 'strike': return [rc.line(x0 - 1, (y0 + y1) / 2, x1 + 1, (y0 + y1) / 2, o)]
    case 'cross': return [rc.line(x0, y0, x1, y1, o), rc.line(x0, y1, x1, y0, o)]
    default: return [rc.line(x0 - 1, y1 + 1, x1 + 1, y1 + 1, o)]
  }
}
function mark(el, c, animate, delay) {
  const w = el.offsetWidth, h = el.offsetHeight
  if (!w || !h) return
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('class', `rn${animate ? ' rn-anim' : ''}`)
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('viewBox', `0 0 ${w + 2 * PAD} ${h + 2 * PAD}`)
  svg.setAttribute('width', w + 2 * PAD); svg.setAttribute('height', h + 2 * PAD)
  const kind = kindOf(c)
  const rc = rough.svg(svg)
  const g = document.createElementNS(SVG_NS, 'g')
  if (kind === 'highlight') g.setAttribute('opacity', '0.35')
  for (const n of shapes(rc, kind, w, h, { stroke: color.value[c], strokeWidth: 2, roughness: 1.2, seed: Number(el.dataset.idx) + 1 })) g.appendChild(n)
  svg.appendChild(g)
  if (animate) {
    g.querySelectorAll('path').forEach((p) => p.setAttribute('pathLength', '1'))
    svg.style.setProperty('--rn-delay', `${delay}ms`)
  }
  el.appendChild(svg)
}
function draw() {
  clearAnnotations()
  const root = article.value
  if (!root || !chosen.value.size) { justAdded = null; return }
  const box = root.getBoundingClientRect()
  const still = reduceMotion()
  let order = 0, count = 0
  for (const el of root.querySelectorAll('[data-idx]')) {
    if (count >= MAX_ANNOTATIONS) break
    const c = el.dataset.cls
    if (!chosen.value.has(c)) continue
    const r = el.getBoundingClientRect()
    const visible = r.bottom > 0 && r.top < (globalThis.innerHeight || box.bottom)
    const animate = !still && c === justAdded && visible && order < 60
    mark(el, c, animate, order * STAGGER_MS)
    if (animate) order++
    count++
  }
  justAdded = null
}
let raf = 0
const redraw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw) }
watch([chosen, classes, pieces, colorBy, kinds], async () => { await nextTick(); redraw() }, { flush: 'post' })
// Na impressão o layout é o mesmo da tela; redesenha sem animação por garantia.
const beforePrint = () => { justAdded = null; draw() }
let ro
onMounted(() => {
  globalThis.addEventListener?.('beforeprint', beforePrint)
  if (globalThis.ResizeObserver && article.value) { ro = new ResizeObserver(redraw); ro.observe(article.value) } })
onBeforeUnmount(() => { globalThis.removeEventListener?.('beforeprint', beforePrint); ro?.disconnect(); cancelAnimationFrame(raf); clearAnnotations() })
</script>

<template>
  <section class="flex flex-col gap-3">
    <div class="ttw-form print:hidden">
      <label class="ttw-field"><span class="ttw-label">{{ t('reader.document') }}</span>
        <select v-model="file" class="select select-sm max-w-xs" data-testid="reader-file"><option v-for="f in files" :key="f">{{ f }}</option></select></label>
      <label class="ttw-field"><span class="ttw-label">{{ t('reader.color_by') }}</span>
        <select v-model="colorBy" class="select select-sm" @change="chosen = new Set()"><option value="upos">UPOS</option><option value="xpos">XPOS</option><option value="tags">tags</option></select></label>
      <span v-if="doc?.layer" class="badge badge-ghost h-8">{{ doc.layer.tool }} · {{ doc.layer.model }}</span>
      <button class="btn btn-sm ml-auto" @click="window.print()">{{ t('reader.print') }}</button>
    </div>
    <p v-if="doc && !doc.layer" class="text-sm opacity-70 print:hidden">{{ t('reader.no_layer') }}</p>
    <p v-if="doc && doc.text === null" role="alert" class="alert alert-warning text-sm">{{ t('reader.no_text') }}</p>
    <div class="grid lg:grid-cols-[minmax(0,1fr)_18rem] gap-4 items-start print:block">
      <!-- A folha: mesma largura, tipografia e quebras de linha na tela e na impressão (A4, margens de 2 cm) -->
      <div class="reader-stage print:overflow-visible">
        <div class="reader-paper" data-testid="reader-paper">
          <header class="reader-sheet-head">
            <h2>{{ file }}</h2>
            <p v-if="doc?.layer">{{ doc.layer.tool }} · {{ doc.layer.model }} · {{ colorBy.toUpperCase() }}</p>
          </header>
          <article ref="article" class="reader-text ttw-annot" data-testid="reader-text">
            <template v-for="(p, i) in pieces" :key="i"><span v-if="!p.tok">{{ p.text }}</span><span v-else :data-idx="p.tok.idx"
                :data-start="p.tok.start_char" :data-cls="label(p.tok)" class="reader-tok"
                :class="{ 'is-selected': selected?.idx === p.tok.idx, 'is-hit': hit(p.tok) }"
                @click="selected = p.tok">{{ p.text }}</span></template>
          </article>
          <footer v-if="chosen.size" class="reader-legend">
            <span v-for="[c, n] in classes.filter(([c]) => chosen.has(c))" :key="c">
              <b :style="{ borderBottom: `2px solid ${color[c]}` }">{{ c }}</b> {{ tagset[c] }} ({{ n }})
            </span>
          </footer>
        </div>
      </div>
      <aside class="flex flex-col gap-3 lg:sticky lg:top-2 print:hidden" aria-live="polite">
        <div v-if="classes.length" class="bg-base-200 rounded-box p-3 flex flex-col gap-2" role="group" :aria-label="t('reader.tags_title')">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-sm">{{ t('reader.tags_title') }}</h3>
            <button v-if="chosen.size" class="btn btn-xs btn-ghost ml-auto" @click="chosen = new Set()">{{ t('reader.clear') }}</button>
          </div>
          <p class="text-xs opacity-70">{{ t('reader.tags_hint') }}</p>
          <div class="flex flex-wrap gap-x-2 gap-y-1.5 max-h-80 overflow-auto">
            <span v-for="[c, n] in classes" :key="c" class="inline-flex items-center gap-1">
              <button type="button" class="badge gap-1 cursor-pointer transition-colors"
                      :aria-pressed="chosen.has(c)" :class="{ 'badge-outline': !chosen.has(c) }"
                      :style="{ borderColor: color[c], color: chosen.has(c) ? '#fff' : color[c], background: chosen.has(c) ? color[c] : '' }"
                      :title="tagset[c]" @click="toggle(c)">{{ c }} <span class="opacity-70">{{ n }}</span></button>
              <select v-if="chosen.has(c)" class="select select-xs w-auto pe-6" :value="kindOf(c)" @change="kinds = { ...kinds, [c]: $event.target.value }" :aria-label="`${t('reader.mark')}: ${c}`">
                <option v-for="k in KINDS" :key="k" :value="k">{{ t(`reader.mark.${k}`) }}</option></select>
            </span>
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
