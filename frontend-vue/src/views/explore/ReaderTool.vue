<script setup>
// Leitor de texto com etiquetas: texto à esquerda e, à direita, a coluna de etiquetas
// (classes UPOS/XPOS ou primeira tag) com seleção múltipla; cada etiqueta marcada é
// marcada no texto com traço à mão (roughjs, o motor do rough-notation), no estilo e na cor
// escolhidos ao lado de cada etiqueta (botão direito também abre o menu). Clicar num
// token mostra etiquetas, lema, traços e a definição do tagset.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import rough from 'roughjs/bundled/rough.esm.js'
import { api } from '../../api/index.js'
import MarkIcon from '../../components/MarkIcon.vue'
import ColorPicker from '../../components/ColorPicker.vue'
import TagDoc from '../../components/TagDoc.vue'
import { describeTag, loadTagsetData, mergeTagsets, tagsetIdsFor } from '../../utils/tagInfo.js'

const props = defineProps({ corpus: String, layer: String })
const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
// voltar/avançar no histórico (ex.: KWIC → leitor → volta ao KWIC); habilitados só se houver para onde ir
const hist = ref({ back: false, forward: false })
const updateHist = () => setTimeout(() => { const st = globalThis.history?.state ?? {}; hist.value = { back: Boolean(st.back), forward: Boolean(st.forward) } }, 0)
watch(() => route.fullPath, updateHist, { immediate: true })
const files = ref([])
const file = ref(route.query.file || '')
const doc = ref(null)
const colorBy = ref(route.query.color || 'tags')   // padrão: sempre tags, qualquer que seja a camada
const chosen = ref(new Set(route.query.highlight ? [route.query.highlight] : []))
const selected = ref(null)
const tagset = ref({})
const window = globalThis
// Telas estreitas ou baixas: o painel de etiquetas vira uma gaveta à direita, por cima do texto, aberta por uma alça
const mq = globalThis.matchMedia?.('(max-width: 1023px), (max-height: 700px)')
const overlay = ref(mq?.matches ?? false)
const panelOpen = ref(false)
const onMq = (e) => { overlay.value = e.matches; if (!e.matches) panelOpen.value = false }
const pref = (() => { try { return JSON.parse(localStorage.getItem('ttw.reader.prefs') || '{}') } catch { return {} } })()
const sortBy = ref(['text', 'corpus', 'alpha', 'group'].includes(pref.sort) ? pref.sort : 'text')
// folha: zoom (largura, margens e fonte juntos), tamanho da fonte (pt) e justificação
const zoom = ref(Number(pref.zoom) >= 0.5 && Number(pref.zoom) <= 2 ? Number(pref.zoom) : 1)
const fontPt = ref(Number(pref.font) >= 8 && Number(pref.font) <= 20 ? Number(pref.font) : 12)
const justify = ref(Boolean(pref.justify))
const ZOOMS = [0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2]
const stepZoom = (d) => { const i = ZOOMS.findIndex((z) => z >= zoom.value - 1e-6); zoom.value = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, (i < 0 ? ZOOMS.length - 1 : i) + d))] }
watch([sortBy, zoom, fontPt, justify], () => {
  try { localStorage.setItem('ttw.reader.prefs', JSON.stringify({ sort: sortBy.value, zoom: zoom.value, font: fontPt.value, justify: justify.value })) } catch { /* */ }
})
const corpusCounts = ref({})   // ocorrências de cada etiqueta no corpus todo (calculadas no servidor)
let countsKey = ''
async function loadCounts() {
  const key = `${props.corpus}|${doc.value?.layer?.tool ?? ''}|${colorBy.value}`
  if (!doc.value?.layer || key === countsKey) return
  countsKey = key
  try { corpusCounts.value = (await api.corpora.tagCounts(props.corpus, doc.value.layer.tool, colorBy.value)).counts } catch { corpusCounts.value = {}; countsKey = '' }
}
const tagGroup = ref({})     // etiqueta → id do grupo
const tagDoc = ref({})       // etiqueta → documentação oficial (MFTE)
const docVersion = ref('')
const groups = ref([])       // [{ id, label }] na ordem do repertório
const hasGroups = computed(() => groups.value.length > 0 && Object.keys(tagGroup.value).length > 0)
watch(hasGroups, (v) => { if (!v && sortBy.value === 'group') sortBy.value = 'text' })
const sortedClasses = computed(() => {
  const arr = [...classes.value]
  const alpha = (a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })
  const by = { text: (a, b) => b[1] - a[1] || alpha(a, b), corpus: (a, b) => (corpusCounts.value[b[0]] ?? 0) - (corpusCounts.value[a[0]] ?? 0) || b[1] - a[1] || alpha(a, b), alpha }
  if (sortBy.value === 'group') {
    const order = Object.fromEntries(groups.value.map((g, i) => [g.id, i]))
    const gi = (c) => order[tagGroup.value[c]] ?? groups.value.length
    return arr.sort((a, b) => gi(a[0]) - gi(b[0]) || b[1] - a[1] || alpha(a, b))
  }
  return arr.sort(by[sortBy.value])
})
const groupLabel = (c) => groups.value.find((g) => g.id === tagGroup.value[c])?.label ?? t('reader.group_other')
const fmtN = (n) => (n ?? 0).toLocaleString(locale.value === 'pt' ? 'pt-BR' : 'en')
const article = ref(null)
const PALETTE = ['#1f77b4', '#d62728', '#2ca02c', '#9467bd', '#ff7f0e', '#17becf', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22',
  '#393b79', '#637939', '#8c6d31', '#843c39', '#7b4173', '#3182bd', '#e6550d']
const MAX_ANNOTATIONS = 2500   // acima disso o SVG pesa: marca só as primeiras

onMounted(async () => {
  files.value = (await api.corpora.documents(props.corpus, { limit: 1000 })).rows.map((r) => r.filename)
  if (!file.value) file.value = files.value[0]
  else if (!files.value.includes(file.value)) files.value = [file.value, ...files.value]   // a lista traz só os primeiros 1000
})
watch(() => route.query.file, (f) => { if (f) file.value = String(f) })   // a Dispersão abre um texto aqui
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
const tagDefs = ref({})   // etiqueta → { text, source } (repertórios da camada, do mais específico ao mais geral)
async function loadTagset() {
  if (!doc.value) return
  try {
    const ids = tagsetIdsFor(doc.value.layer?.tool, colorBy.value)
    const sets = (await Promise.all(ids.map((id) => loadTagsetData(id, locale.value).catch(() => null)))).filter(Boolean)
    const r = sets[0] ?? {}
    tagDefs.value = mergeTagsets(sets)
    tagset.value = Object.fromEntries(Object.entries(tagDefs.value).map(([k, v]) => [k, v.text]))
    tagsetInfo.value = { name: r.name ?? '', about: r.about ?? '' }
    tagGroup.value = Object.fromEntries((r.tags ?? []).filter((x) => x.group).map((x) => [x.tag, x.group]))
    tagDoc.value = Object.fromEntries(sets.flatMap((st) => (st.tags ?? []).filter((x) => x.doc).map((x) => [x.tag, x.doc])))
    docVersion.value = sets.find((st) => st.doc_version)?.doc_version ?? ''
    groups.value = (r.groups ?? []).map((g) => ({ id: g.id, label: g.label }))
  } catch { tagDefs.value = {}; tagset.value = {}; tagsetInfo.value = { name: '', about: '' }; tagGroup.value = {}; tagDoc.value = {}; groups.value = [] }
  loadCounts()
}
// descrição de uma etiqueta (própria ou inferida) — { text, source, inferred } ou null
const info = (tag) => describeTag(tag, tagDefs.value, t)
watch([colorBy, locale], loadTagset)
watch(() => props.corpus, () => { countsKey = ''; corpusCounts.value = {} })
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
// Esc fecha primeiro o menu da etiqueta (se aberto); só depois a gaveta
const onKey = (e) => {
  if (e.key !== 'Escape') return
  if (menu.value) { menu.value = null; palette.value = false } else if (panelOpen.value) panelOpen.value = false
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
watch([chosen, classes, pieces, colorBy, kinds, custom, zoom, fontPt, justify], async () => { await nextTick(); redraw() }, { flush: 'post' })
// Na impressão o layout é o mesmo da tela; redesenha por garantia.
const beforePrint = () => draw()
let ro
onMounted(() => {
  globalThis.addEventListener?.('beforeprint', beforePrint)
  globalThis.addEventListener?.('keydown', onKey)
  mq?.addEventListener?.('change', onMq)
  globalThis.addEventListener?.('click', closeMenu)
  if (globalThis.ResizeObserver && article.value) { ro = new ResizeObserver(redraw); ro.observe(article.value) } })
onBeforeUnmount(() => { globalThis.removeEventListener?.('beforeprint', beforePrint); globalThis.removeEventListener?.('keydown', onKey); mq?.removeEventListener?.('change', onMq); globalThis.removeEventListener?.('click', closeMenu); ro?.disconnect(); cancelAnimationFrame(raf); clearAnnotations() })
</script>

<template>
  <section class="flex flex-col gap-3">
    <div class="ttw-form print:hidden">
      <div class="ttw-field" role="group" :aria-label="t('reader.history')"><span class="ttw-label">{{ t('reader.history') }}</span>
        <div class="flex gap-1">
          <button type="button" class="btn btn-sm btn-square" :disabled="!hist.back" :aria-label="t('reader.back')" :title="t('reader.back')" data-testid="reader-back" @click="router.back()">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg></button>
          <button type="button" class="btn btn-sm btn-square" :disabled="!hist.forward" :aria-label="t('reader.forward')" :title="t('reader.forward')" data-testid="reader-forward" @click="router.forward()">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg></button>
        </div></div>
      <label class="ttw-field"><span class="ttw-label">{{ t('reader.document') }}</span>
        <select v-model="file" class="select select-sm max-w-xs" data-testid="reader-file"><option v-for="f in files" :key="f">{{ f }}</option></select></label>
      <label class="ttw-field"><span class="ttw-label">{{ t('reader.color_by') }}</span>
        <select v-model="colorBy" class="select select-sm" @change="chosen = new Set()"><option value="upos">UPOS</option><option value="xpos">XPOS</option><option value="tags">tags</option></select></label>
      <span v-if="doc?.layer" class="badge badge-ghost h-8">{{ doc.layer.tool }} · {{ doc.layer.model }}</span>
      <div class="ttw-field" role="group" :aria-label="t('reader.sheet')"><span class="ttw-label">{{ t('reader.sheet') }}</span>
        <div class="flex items-center gap-1">
          <button type="button" class="btn btn-sm btn-square" :aria-label="t('reader.zoom_out')" :title="t('reader.zoom_out')" :disabled="zoom <= ZOOMS[0]" data-testid="reader-zoom-out" @click="stepZoom(-1)">−</button>
          <select v-model.number="zoom" class="select select-sm w-24" :aria-label="t('reader.zoom')" data-testid="reader-zoom">
            <option v-for="z in ZOOMS" :key="z" :value="z">{{ Math.round(z * 100) }}%</option></select>
          <button type="button" class="btn btn-sm btn-square" :aria-label="t('reader.zoom_in')" :title="t('reader.zoom_in')" :disabled="zoom >= ZOOMS[ZOOMS.length - 1]" data-testid="reader-zoom-in" @click="stepZoom(1)">+</button>
          <select v-model.number="fontPt" class="select select-sm w-20" :aria-label="t('reader.font_size')" :title="t('reader.font_size')" data-testid="reader-font">
            <option v-for="n in [9, 10, 11, 12, 13, 14, 16, 18]" :key="n" :value="n">{{ n }} pt</option></select>
          <button type="button" class="btn btn-sm btn-square" :class="{ 'btn-active': justify }" :aria-pressed="justify" :aria-label="t('reader.justify')" :title="t('reader.justify')" data-testid="reader-justify" @click="justify = !justify">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M2 3.500h12M2 6.500h12M2 9.500h12M2 12.500h12" /></svg></button>
        </div></div>
      <button class="btn btn-sm ml-auto" @click="window.print()">{{ t('reader.print') }}</button>
    </div>
    <p v-if="doc && !doc.layer" class="text-sm text-text-muted print:hidden">{{ t('reader.no_layer') }}</p>
    <p v-if="doc && doc.text === null" role="alert" class="alert alert-warning text-sm">{{ t('reader.no_text') }}</p>
    <div class="grid gap-4 items-start print:block" :class="overlay ? '' : 'grid-cols-[minmax(0,1fr)_20rem]'">
      <!-- A folha: mesma largura, tipografia e quebras de linha na tela e na impressão (A4, margens de 2 cm) -->
      <div class="reader-stage print:overflow-visible" tabindex="0" role="region" :aria-label="t('reader.sheet')">
        <div class="reader-paper" data-testid="reader-paper" :style="{ '--z': zoom, '--fs': `${fontPt}pt` }">
          <header class="reader-sheet-head">
            <h2>{{ file }}</h2>
            <p v-if="doc?.layer">{{ doc.layer.tool }} · {{ doc.layer.model }} · {{ colorBy.toUpperCase() }}</p>
          </header>
          <article ref="article" class="reader-text ttw-annot" :class="{ 'is-justified': justify }" data-testid="reader-text">
            <template v-for="(p, i) in pieces" :key="i"><span v-if="!p.tok">{{ p.text }}</span><span v-else :data-idx="p.tok.idx"
                :data-start="p.tok.start_char" :data-cls="label(p.tok)" class="reader-tok"
                :class="{ 'is-selected': selected?.idx === p.tok.idx, 'is-hit': hit(p.tok) }"
                @click="selected = p.tok" @contextmenu="label(p.tok) && ($event.preventDefault(), selected = p.tok, openMenu(label(p.tok), null, true))">{{ p.text }}</span></template>
          </article>
          <footer v-if="chosen.size" class="reader-legend">
            <span v-for="[c, n] in classes.filter(([c]) => chosen.has(c))" :key="c">
              <b :style="{ borderBottom: `2px solid ${color[c]}` }">{{ c }}</b> {{ info(c)?.text }} ({{ n }})
            </span>
          </footer>
        </div>
      </div>
      <button v-if="overlay && classes.length" type="button" class="ttw-tag-handle print:hidden" :aria-expanded="panelOpen" aria-controls="reader-aside"
              data-testid="reader-panel-toggle" @click="panelOpen = !panelOpen">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3.500 12.500V4.500a1 1 0 0 1 1-1h8l8 8a1.500 1.500 0 0 1 0 2.100l-6.300 6.300a1.500 1.500 0 0 1-2.100 0z" /><circle cx="8" cy="8" r="1.300" /></svg>
        <span>{{ panelOpen ? t('reader.collapse') : t('reader.tags_title') }}</span>
      </button>
      <aside id="reader-aside" class="flex flex-col gap-3 print:hidden" aria-live="polite"
             :class="overlay ? ['ttw-tag-drawer', panelOpen ? 'is-open' : ''] : 'sticky top-16 max-h-[calc(100dvh-5rem)]'" :inert="overlay && !panelOpen">
        <div v-if="classes.length" class="bg-base-200 rounded-box p-3 flex flex-col gap-2 min-h-0 flex-1" role="group" :aria-label="t('reader.tags_title')">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-sm">{{ t('reader.tags_title') }}</h3>
            <button v-if="chosen.size" class="btn btn-xs btn-ghost ml-auto" @click="chosen = new Set()">{{ t('reader.clear') }}</button>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-text-muted" for="reader-sort">{{ t('reader.sort') }}</label>
            <select id="reader-sort" v-model="sortBy" class="select select-xs flex-1" data-testid="reader-sort">
              <option value="text">{{ t('reader.sort.text') }}</option>
              <option value="corpus">{{ t('reader.sort.corpus') }}</option>
              <option value="alpha">{{ t('reader.sort.alpha') }}</option>
              <option v-if="hasGroups" value="group">{{ t('reader.sort.group') }}</option>
            </select>
          </div>
          <p class="text-xs text-text-muted">{{ t('reader.tags_hint') }}</p>
          <div class="flex items-center gap-2 text-[0.7rem] text-text-muted px-1" aria-hidden="true">
            <span class="flex-1">{{ t('reader.col.tag') }}</span><span class="w-12 text-right">{{ t('reader.col.text') }}</span><span class="w-14 text-right">{{ t('reader.col.corpus') }}</span>
          </div>
          <ul class="flex flex-col gap-1 overflow-y-auto min-h-0 flex-1 pr-1 max-h-[60dvh]" :class="{ 'lg:max-h-none': !overlay }" data-testid="reader-tag-list" @scroll.passive="hideTip(); menu = null">
            <template v-for="([c, n], i) in sortedClasses" :key="c">
              <li v-if="sortBy === 'group' && (i === 0 || groupLabel(sortedClasses[i - 1][0]) !== groupLabel(c))" class="text-xs font-bold text-text-muted pt-2 sticky top-0 bg-base-200">{{ groupLabel(c) }}</li>
              <li class="flex items-center gap-2" data-mark-menu :data-badge="c">
                <span class="badge badge-lg p-0 gap-0 overflow-visible flex-1 justify-between min-w-0" :class="{ 'badge-outline': !chosen.has(c) }"
                      :style="{ borderColor: color[c], borderWidth: '2px', color: chosen.has(c) ? fg(color[c]) : 'var(--color-base-content)', background: chosen.has(c) ? color[c] : '' }"
                      @contextmenu.prevent="openMenu(c, $event.currentTarget, true)">
                  <button type="button" class="pl-2.5 pr-1.5 h-full cursor-pointer flex-1 text-left truncate" :aria-pressed="chosen.has(c)" :aria-describedby="tip?.c === c ? 'reader-tip' : undefined"
                          @click="toggle(c)" @mouseenter="showTip(c, $event.currentTarget)" @mouseleave="hideTip" @focus="showTip(c, $event.currentTarget)" @blur="hideTip"><span class="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle border" :style="{ background: color[c], borderColor: chosen.has(c) ? fg(color[c]) : color[c] }" aria-hidden="true" />{{ c }}</button>
                  <button type="button" class="pr-2 pl-1 h-full cursor-pointer border-l border-current/30" :aria-label="`${t('reader.mark')}: ${c}`"
                          :aria-expanded="menu === c" :title="t('reader.mark')" @click.stop="menu === c ? (menu = null) : openMenu(c, $event.currentTarget.parentElement)">
                    <MarkIcon :kind="chosen.has(c) ? kindOf(c) : 'off'" /></button>
                </span>
                <span class="w-12 text-right text-sm tabular-nums" :title="t('reader.col.text')">{{ fmtN(n) }}</span>
                <span class="w-14 text-right text-sm tabular-nums text-text-muted" :title="t('reader.col.corpus')">{{ corpusCounts[c] !== undefined ? fmtN(corpusCounts[c]) : '…' }}</span>
              </li>
            </template>
          </ul>
          <div v-if="chosen.size" class="flex gap-2">
            <button class="btn btn-xs" @click="step(-1)">{{ t('reader.prev') }}</button>
            <button class="btn btn-xs" @click="step(1)">{{ t('reader.next') }}</button>
          </div>
        </div>
        <div class="bg-base-200 rounded-box p-3 text-sm max-h-60 overflow-y-auto shrink-0">
          <h3 class="font-bold mb-1">{{ t('reader.token') }}</h3>
          <dl v-if="selected" class="grid grid-cols-[auto_1fr] gap-x-2">
            <dt>word</dt><dd class="font-bold">{{ selected.word }}</dd>
            <template v-for="k in ['lemma', 'upos', 'xpos', 'feats']" :key="k"><template v-if="selected[k]"><dt>{{ k }}</dt><dd class="break-all" :data-tag="k === 'upos' || k === 'xpos' ? selected[k] : null">{{ selected[k] }}</dd></template></template>
            <template v-if="selected.tags?.length"><dt>tags</dt><dd>{{ selected.tags.join(' ') }}</dd></template>
            <dt>def.</dt><dd>{{ info(label(selected))?.text || '—' }}<span v-if="info(label(selected))?.inferred" class="block text-xs text-text-muted italic">{{ t('taginfo.inferred') }}</span></dd>
          </dl>
          <TagDoc v-if="selected" :doc="tagDoc[label(selected)]" :version="docVersion" />
        </div>
      </aside>
      <!-- dica da etiqueta (passar o mouse ou focar): definição segundo o repertório do etiquetador -->
      <div v-if="tip" id="reader-tip" role="tooltip" class="fixed z-50 w-72 max-w-[calc(100vw-1rem)] p-2.5 rounded-box bg-neutral text-neutral-content text-xs shadow-lg pointer-events-none"
           :style="{ left: `${tip.x}px`, top: `${tip.y}px` }">
        <p class="font-bold text-sm">{{ tip.c }}<span v-if="info(tip.c)?.source || tagsetInfo.name" class="font-normal opacity-80"> · {{ info(tip.c)?.source || tagsetInfo.name }}</span></p>
        <p>{{ info(tip.c)?.text || t('reader.no_definition') }}</p>
        <p v-if="info(tip.c)?.inferred" class="opacity-70 italic">{{ t('taginfo.inferred') }}</p>
        <template v-if="tagDoc[tip.c]">
          <p class="mt-1"><span class="opacity-70">{{ t('tagdoc.feature') }}:</span> {{ tagDoc[tip.c].feature }}</p>
          <p v-if="tagDoc[tip.c].examples" class="italic opacity-90 line-clamp-2">“{{ tagDoc[tip.c].examples }}”</p>
          <p v-if="tagDoc[tip.c].unit && tagDoc[tip.c].unit !== 'NA'" class="opacity-70">{{ t('tagdoc.unit') }}: {{ tagDoc[tip.c].unit }}</p>
        </template>
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
