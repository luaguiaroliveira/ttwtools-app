<script setup>
// Leitor de texto com etiquetas: texto à esquerda e, à direita, a coluna de etiquetas
// (classes UPOS/XPOS ou primeira tag) com seleção múltipla; cada etiqueta marcada é
// marcada no texto com traço à mão (roughjs, o motor do rough-notation), no estilo e na cor
// escolhidos ao lado de cada etiqueta (botão direito também abre o menu). Clicar num
// token mostra etiquetas, lema, traços e a definição do tagset.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import rough from 'roughjs/bundled/rough.esm.js'
import { api } from '../../api/index.js'
import MarkIcon from '../../components/MarkIcon.vue'
import ColorPicker from '../../components/ColorPicker.vue'

const props = defineProps({ corpus: String, layer: String })
const { t, locale } = useI18n()
const route = useRoute()
const files = ref([])
const file = ref(route.query.file || '')
const doc = ref(null)
const colorBy = ref(route.query.color || 'tags')   // padrão: sempre tags, qualquer que seja a camada
const chosen = ref(new Set(route.query.highlight ? [route.query.highlight] : []))
const selected = ref(null)
const tagset = ref({})
const window = globalThis
const tagsOpen = ref(globalThis.matchMedia?.('(min-width: 1024px)').matches ?? true)   // em telas estreitas a lista de etiquetas começa recolhida
const article = ref(null)
const PALETTE = ['#1f77b4', '#d62728', '#2ca02c', '#9467bd', '#ff7f0e', '#17becf', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22',
  '#393b79', '#637939', '#8c6d31', '#843c39', '#7b4173', '#3182bd', '#e6550d']
const MAX_ANNOTATIONS = 2500   // acima disso o SVG pesa: marca só as primeiras

onMounted(async () => {
  files.value = (await api.corpora.documents(props.corpus, { limit: 1000 })).rows.map((r) => r.filename)
  if (!file.value) file.value = files.value[0]
})
watch(() => [file.value, props.layer], async () => {
  if (!file.value) return
  doc.value = await api.corpora.text(props.corpus, file.value, props.layer)
  selected.value = null
  // camada sem `tags` (ex.: só UPOS): cai para UPOS para a lista não ficar vazia
  if (!route.query.color && colorBy.value === 'tags' && !doc.value.tokens.some((x) => x.tags?.length)) colorBy.value = 'upos'
  await loadTagset()
  await nextTick()
  if (route.query.pos) document.querySelector(`[data-start="${route.query.pos}"]`)?.scrollIntoView({ block: 'center' })
}, { immediate: true })

// Repertório que explica as etiquetas mostradas: UPOS → universal; XPOS → Penn Treebank;
// tags → o do etiquetador da camada (BiberPlus, MFTE) ou Penn Treebank (spaCy/Stanza).
const tagsetInfo = ref({ name: '', about: '' })
const tagsetId = () => {
  const tool = doc.value?.layer?.tool
  if (colorBy.value === 'upos') return 'upos'
  if (colorBy.value === 'xpos') return 'ptb'
  return tool === 'biberplus' ? 'biber' : tool === 'mfte' ? 'mfte' : 'ptb'
}
async function loadTagset() {
  if (!doc.value) return
  try {
    const r = await api.taggers.tagset(tagsetId(), locale.value)
    tagset.value = Object.fromEntries(r.tags.map((x) => [x.tag, x.definition]))
    tagsetInfo.value = { name: r.name ?? '', about: r.about ?? '' }
  } catch { tagset.value = {}; tagsetInfo.value = { name: '', about: '' } }
}
watch([colorBy, locale], loadTagset)
const label = (tok) => (colorBy.value === 'upos' ? tok.upos : colorBy.value === 'xpos' ? tok.xpos : tok.tags?.[0]) || null
const classes = computed(() => {
  const counts = {}
  for (const tok of doc.value?.tokens ?? []) { const l = label(tok); if (l) counts[l] = (counts[l] || 0) + 1 }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
})
const custom = ref({})   // etiqueta → cor escolhida pela pessoa
const color = computed(() => Object.fromEntries(classes.value.map(([c], i) => [c, custom.value[c] || PALETTE[i % PALETTE.length]])))
// texto legível (preto ou branco) sobre a cor da etiqueta
const fg = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  const L = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
  return L > 0.4 ? '#111' : '#fff'
}
const palette = ref(false)   // seletor de cor aberto dentro do menu da etiqueta
const menuPos = ref({ x: 0, y: 0 })   // menu e dica são `fixed`: a lista de etiquetas rola sem cortá-los
const tip = ref(null)
let tipTimer
function anchor(el, w) {
  const r = el.getBoundingClientRect()
  return { x: Math.max(8, Math.min(r.left, globalThis.innerWidth - w - 8)), y: r.bottom + 4 }
}
function showTip(c, el) {
  clearTimeout(tipTimer)
  tipTimer = setTimeout(() => { if (!menu.value) tip.value = { c, ...anchor(el, 288) } }, 200)
}
const hideTip = () => { clearTimeout(tipTimer); tip.value = null }
function setColor(c, hex) { custom.value = { ...custom.value, [c]: hex } }
function resetColor(c) { const { [c]: _, ...rest } = custom.value; custom.value = rest }
function openMenu(c, el, withColor = false) {
  hideTip()
  palette.value = withColor
  menuPos.value = anchor(el ?? document.querySelector(`[data-badge="${CSS.escape(c)}"]`) ?? document.body, 232)
  menu.value = c
}
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
function toggle(c) {
  const next = new Set(chosen.value)
  if (next.has(c)) next.delete(c); else next.add(c)
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
// absolutas da página. Só o tamanho do token é medido.
const KINDS = ['highlight', 'box', 'circle', 'underline', 'strike', 'cross']
const kinds = ref({})   // etiqueta → estilo (padrão: marca-texto)
const kindOf = (c) => kinds.value[c] || 'highlight'
const menu = ref(null)  // etiqueta cujo menu de estilos está aberto
function pick(c, k) {   // 'off' = olho fechado: tira a marcação
  menu.value = null
  const next = new Set(chosen.value)
  if (k === 'off') next.delete(c)
  else { kinds.value = { ...kinds.value, [c]: k }; next.add(c) }
  chosen.value = next
}
const closeMenu = (e) => { if (!e.target.closest?.('[data-mark-menu]')) menu.value = null }
const PALETTES = [
  { id: 'default', colors: PALETTE.slice(0, 12) },
  { id: 'safe', colors: ['#000000', '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7'] },   // Okabe-Ito
  { id: 'gray', colors: ['#111111', '#3B3936', '#5E5B57', '#8A8580', '#B5B0A9', '#D9D5CF', '#F2F0EC', '#FFFFFF'] },
]
const SVG_NS = 'http://www.w3.org/2000/svg'
const PAD = 4
function clearAnnotations() { article.value?.querySelectorAll('svg.rn').forEach((n) => n.remove()) }
function shapes(rc, kind, w, h, o) {
  const x0 = PAD, x1 = PAD + w, y0 = PAD, y1 = PAD + h
  switch (kind) {
    case 'highlight': return [rc.rectangle(x0, y0, w, h, { ...o, stroke: 'none', fill: o.stroke, fillStyle: 'solid', roughness: 0.7 })]
    case 'box': return [rc.rectangle(x0 - 2, y0, w + 4, h, o)]
    case 'circle': return [rc.ellipse((x0 + x1) / 2, (y0 + y1) / 2, w + 12, h + 6, o)]
    case 'strike': return [rc.line(x0 - 1, (y0 + y1) / 2, x1 + 1, (y0 + y1) / 2, o)]
    case 'cross': return [rc.line(x0, y0, x1, y1, o), rc.line(x0, y1, x1, y0, o)]
    default: return [rc.line(x0 - 1, y1 + 1, x1 + 1, y1 + 1, o)]
  }
}
// Cada token guarda a assinatura do que foi desenhado (etiqueta, estilo, cor, tamanho); só quem
// mudou é redesenhado. Sem animação: marcar deve ser instantâneo.
function mark(el, c, w, h, sig) {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('class', 'rn')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('viewBox', `0 0 ${w + 2 * PAD} ${h + 2 * PAD}`)
  svg.setAttribute('width', w + 2 * PAD); svg.setAttribute('height', h + 2 * PAD)
  const kind = kindOf(c)
  const rc = rough.svg(svg)
  const g = document.createElementNS(SVG_NS, 'g')
  if (kind === 'highlight') { g.setAttribute('opacity', '0.35'); svg.style.clipPath = `inset(${PAD}px)` }   // não vaza para as palavras vizinhas
  for (const n of shapes(rc, kind, w, h, { stroke: color.value[c], strokeWidth: 2, roughness: 1.2, seed: Number(el.dataset.idx) + 1 })) g.appendChild(n)
  svg.appendChild(g)
  el.querySelector(':scope > svg.rn')?.remove()
  el.appendChild(svg)
  el.dataset.sig = sig
}
function draw() {
  const root = article.value
  if (!root) return
  if (!chosen.value.size) { clearAnnotations(); root.querySelectorAll('[data-sig]').forEach((el) => delete el.dataset.sig); return }
  const todo = []
  let count = 0
  for (const el of root.querySelectorAll('[data-idx]')) {   // primeiro só leituras (um único layout)
    const c = el.dataset.cls
    if (!chosen.value.has(c) || count >= MAX_ANNOTATIONS) {
      if (el.dataset.sig) { el.querySelector(':scope > svg.rn')?.remove(); delete el.dataset.sig }
      continue
    }
    count++
    const w = el.offsetWidth, h = el.offsetHeight
    const sig = `${c}|${kindOf(c)}|${color.value[c]}|${w}x${h}`
    if (w && h && el.dataset.sig !== sig) todo.push([el, c, w, h, sig])
  }
  for (const t of todo) mark(...t)
}
let raf = 0
const redraw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw) }
watch([chosen, classes, pieces, colorBy, kinds, custom], async () => { await nextTick(); redraw() }, { flush: 'post' })
// Na impressão o layout é o mesmo da tela; redesenha por garantia.
const beforePrint = () => draw()
let ro
onMounted(() => {
  globalThis.addEventListener?.('beforeprint', beforePrint)
  globalThis.addEventListener?.('click', closeMenu)
  if (globalThis.ResizeObserver && article.value) { ro = new ResizeObserver(redraw); ro.observe(article.value) } })
onBeforeUnmount(() => { globalThis.removeEventListener?.('beforeprint', beforePrint); globalThis.removeEventListener?.('click', closeMenu); ro?.disconnect(); cancelAnimationFrame(raf); clearAnnotations() })
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
    <p v-if="doc && !doc.layer" class="text-sm text-text-muted print:hidden">{{ t('reader.no_layer') }}</p>
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
                @click="selected = p.tok" @contextmenu="label(p.tok) && ($event.preventDefault(), selected = p.tok, openMenu(label(p.tok), null, true))">{{ p.text }}</span></template>
          </article>
          <footer v-if="chosen.size" class="reader-legend">
            <span v-for="[c, n] in classes.filter(([c]) => chosen.has(c))" :key="c">
              <b :style="{ borderBottom: `2px solid ${color[c]}` }">{{ c }}</b> {{ tagset[c] }} ({{ n }})
            </span>
          </footer>
        </div>
      </div>
      <aside class="flex flex-col gap-3 lg:sticky lg:top-16 lg:max-h-[calc(100dvh-5rem)] print:hidden" aria-live="polite">
        <div v-if="classes.length" class="bg-base-200 rounded-box p-3 flex flex-col gap-2 min-h-0 lg:flex-1" role="group" :aria-label="t('reader.tags_title')">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-sm">{{ t('reader.tags_title') }}</h3>
            <button v-if="chosen.size" class="btn btn-xs btn-ghost ml-auto" @click="chosen = new Set()">{{ t('reader.clear') }}</button>
            <button type="button" class="btn btn-xs btn-ghost lg:hidden" :class="{ 'ml-auto': !chosen.size }" :aria-expanded="tagsOpen" data-testid="reader-tags-toggle"
                    @click="tagsOpen = !tagsOpen">{{ tagsOpen ? t('reader.collapse') : t('reader.expand') }} ({{ classes.length }})</button>
          </div>
          <div class="flex-col gap-2 min-h-0 flex-1" :class="tagsOpen ? 'flex' : 'hidden lg:flex'">
            <p class="text-xs text-text-muted">{{ t('reader.tags_hint') }}</p>
            <div class="ttw-tag-scroll flex flex-wrap content-start gap-1.5 overflow-y-auto min-h-0 max-h-72 lg:max-h-none lg:flex-1 pr-1" data-testid="reader-tag-list"
                 @scroll.passive="hideTip(); menu = null">
              <span v-for="[c, n] in classes" :key="c" class="relative inline-flex" data-mark-menu :data-badge="c">
                <span class="badge badge-lg p-0 gap-0 overflow-visible" :class="{ 'badge-outline': !chosen.has(c) }"
                      :style="{ borderColor: color[c], color: chosen.has(c) ? fg(color[c]) : color[c], background: chosen.has(c) ? color[c] : '' }"
                      @contextmenu.prevent="openMenu(c, $event.currentTarget, true)">
                  <button type="button" class="pl-2.5 pr-1.5 h-full cursor-pointer" :aria-pressed="chosen.has(c)" :aria-describedby="tip?.c === c ? 'reader-tip' : undefined"
                          @click="toggle(c)" @mouseenter="showTip(c, $event.currentTarget)" @mouseleave="hideTip" @focus="showTip(c, $event.currentTarget)" @blur="hideTip">
                    {{ c }} <span class="text-text-muted">{{ n }}</span></button>
                  <button type="button" class="pr-2 pl-1 h-full cursor-pointer border-l border-current/30" :aria-label="`${t('reader.mark')}: ${c}`"
                          :aria-expanded="menu === c" :title="t('reader.mark')" @click.stop="menu === c ? (menu = null) : openMenu(c, $event.currentTarget.parentElement)">
                    <MarkIcon :kind="chosen.has(c) ? kindOf(c) : 'off'" /></button>
                </span>
              </span>
            </div>
            <div v-if="chosen.size" class="flex gap-2">
              <button class="btn btn-xs" @click="step(-1)">{{ t('reader.prev') }}</button>
              <button class="btn btn-xs" @click="step(1)">{{ t('reader.next') }}</button>
            </div>
          </div>
        </div>
        <div class="bg-base-200 rounded-box p-3 text-sm max-h-60 overflow-y-auto shrink-0">
          <h3 class="font-bold mb-1">{{ t('reader.token') }}</h3>
          <dl v-if="selected" class="grid grid-cols-[auto_1fr] gap-x-2">
            <dt>word</dt><dd class="font-bold">{{ selected.word }}</dd>
            <template v-for="k in ['lemma', 'upos', 'xpos', 'feats']" :key="k"><template v-if="selected[k]"><dt>{{ k }}</dt><dd class="break-all">{{ selected[k] }}</dd></template></template>
            <template v-if="selected.tags?.length"><dt>tags</dt><dd>{{ selected.tags.join(' ') }}</dd></template>
            <dt>def.</dt><dd>{{ tagset[label(selected)] || '—' }}</dd>
          </dl>
        </div>
      </aside>
      <!-- dica da etiqueta (passar o mouse ou focar): definição segundo o repertório do etiquetador -->
      <div v-if="tip" id="reader-tip" role="tooltip" class="fixed z-50 w-72 max-w-[calc(100vw-1rem)] p-2.5 rounded-box bg-neutral text-neutral-content text-xs shadow-lg pointer-events-none"
           :style="{ left: `${tip.x}px`, top: `${tip.y}px` }">
        <p class="font-bold text-sm">{{ tip.c }}<span v-if="tagsetInfo.name" class="font-normal opacity-80"> · {{ tagsetInfo.name }}</span></p>
        <p>{{ tagset[tip.c] || t('reader.no_definition') }}</p>
        <p v-if="doc?.layer" class="opacity-70 mt-1">{{ t('reader.tip_from', { tool: doc.layer.tool }) }}</p>
      </div>
      <!-- menu da etiqueta: estilo e cor (botão direito na etiqueta ou no token abre já com o seletor) -->
      <div v-if="menu" role="menu" data-mark-menu class="fixed z-50 flex flex-col gap-2 p-2 rounded-box bg-base-100 border border-base-300 shadow-lg text-base-content overflow-y-auto"
           :style="{ left: `${menuPos.x}px`, top: `${menuPos.y}px`, maxHeight: `calc(100dvh - ${menuPos.y}px - 8px)` }" data-testid="reader-mark-menu">
        <div class="flex gap-0.5 items-center">
          <button v-for="k in ['off', ...KINDS]" :key="k" type="button" role="menuitem" class="btn btn-square btn-xs"
                  :class="{ 'btn-active': (chosen.has(menu) ? kindOf(menu) : 'off') === k }" :title="t(`reader.mark.${k}`)"
                  :aria-label="t(`reader.mark.${k}`)" @click="pick(menu, k)"><MarkIcon :kind="k" /></button>
          <button type="button" role="menuitem" class="btn btn-square btn-xs" :class="{ 'btn-active': palette }" :title="t('reader.color')"
                  :aria-label="t('reader.color')" :aria-expanded="palette" data-testid="reader-color-btn" @click.stop="palette = !palette">
            <span class="block w-3.5 h-3.5 rounded-full border border-base-content/40" :style="{ background: color[menu] }" /></button>
        </div>
        <ColorPicker v-if="palette" :model-value="color[menu]" :palettes="PALETTES" @update:model-value="setColor(menu, $event)">
          <button type="button" class="btn btn-xs btn-ghost ml-auto" :disabled="!custom[menu]" @click="resetColor(menu)">{{ t('reader.color_reset') }}</button>
        </ColorPicker>
      </div>
    </div>
  </section>
</template>
