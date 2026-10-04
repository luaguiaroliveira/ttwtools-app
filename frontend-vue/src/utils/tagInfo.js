// Descrições de etiquetas: quais repertórios (tagsets) explicam cada camada, carga com cache e
// inferência para etiquetas sem descrição própria (marcada como "inferida" na interface).
import { api } from '../api/index.js'

const cache = new Map()   // "id|idioma" → Promise<dados do tagset>
export const loadTagsetData = (id, lang) => {
  const key = `${id}|${lang}`
  if (!cache.has(key)) cache.set(key, api.taggers.tagset(id, lang).catch((e) => { cache.delete(key); throw e }))
  return cache.get(key)
}

// Repertórios de uma camada, do mais específico ao mais geral. `field` (upos, xpos, tags) restringe;
// sem ele, vale para qualquer campo. Camadas MFTE misturam etiquetas do MFTE, do Penn Treebank e do Biber.
export function tagsetIdsFor(tool, field = null) {
  const t = tool || ''
  if (field === 'upos') return ['upos']
  if (field === 'xpos') return ['ptb']
  if (t === 'biberplus') return ['biber']
  if (t.startsWith('mfte')) return field === 'tags' ? ['mfte', 'ptb', 'biber'] : ['mfte', 'ptb', 'upos', 'biber']
  if (field === 'tags') return ['ptb']
  if (t === 'spacy' || t === 'stanza') return ['upos', 'ptb']
  return ['upos', 'ptb', 'mfte', 'biber']
}

// Ids dos repertórios que a configuração atual do tagger produz. `descriptor` é o
// descritor de /taggers/{id}/options e `values` são as opções correntes: só entram as
// colunas cujos componentes estão selecionados (ex.: sem `tag`, não há xpos/ptb) e o
// mapa `tagsets_by_lang` do idioma do corpus (no pt, xpos do Stanza é null → não entra).
const COL_COMPONENTS = {   // componente que produz cada coluna, por tagger
  spacy: { upos: ['pos'], xpos: ['tag'] },
  stanza: { upos: ['pos'], xpos: ['pos'] },
  mfte: { tags: ['morph', 'mfte'], xpos: ['pos'], upos: ['pos'] },
}
export function tagsetIdsForConfig(descriptor, values = {}) {
  if (!descriptor) return []
  const lang = values.lang || descriptor.corpus_lang
  const tagsets = { ...(descriptor.tagsets ?? {}), ...((descriptor.tagsets_by_lang ?? {})[lang] ?? {}) }
  const comps = values.components
  const mapping = COL_COMPONENTS[descriptor.tagger]
  const ids = []
  for (const col of ['tags', 'xpos', 'upos']) {
    const id = tagsets[col]
    if (!id || ids.includes(id)) continue
    if (Array.isArray(comps) && mapping?.[col] && !comps.some((c) => mapping[col].includes(c))) continue
    ids.push(id)
  }
  if (!mapping) for (const id of Object.values(tagsets)) if (id && !ids.includes(id)) ids.push(id)
  return ids
}

// Junta os repertórios: a primeira definição de cada etiqueta vence e guarda de qual repertório veio.
export function mergeTagsets(sets) {
  const defs = {}
  for (const s of sets) for (const x of s.tags ?? []) if (x.definition && !(x.tag in defs)) defs[x.tag] = { text: x.definition, source: s.name ?? '' }
  return defs
}

// Sufixos do MFTE sem descrição própria: "<X>other" (demais casos) e "<X>all" (total das variantes).
const RULES = [[/^(.+?)other$/i, 'taginfo.other'], [/^(.+?)all$/i, 'taginfo.all']]

// { text, source, inferred } ou null. `t` traduz o modelo da descrição inferida.
export function describeTag(tag, defs, t) {
  const hit = defs[tag]
  if (hit) return { ...hit, inferred: false }
  for (const [re, key] of RULES) {
    const m = re.exec(tag)
    const base = m && defs[m[1]]
    if (base) return { text: t(key, { desc: base.text, tag: m[1] }), source: base.source, inferred: true }
  }
  return null
}
