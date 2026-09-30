import { beforeEach, describe, expect, it } from 'vitest'
import { computed, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useSession } from '../stores/session.js'
import { useTopLayer } from '../composables/useTopLayer.js'

function setup(unit = 'lemma') {
  setActivePinia(createPinia())
  const s = useSession()
  s.corpus = 'a'
  s.corpora = [{ name: 'a', layers: [{ tool: 'biberplus', fields: ['tags'] }, { tool: 'spacy', fields: ['tags', 'upos', 'xpos', 'lemma'] }] }]
  const u = ref(unit)
  const last = ref(null)
  return { s, u, last, top: useTopLayer(computed(() => u.value), last) }
}

describe('useTopLayer', () => {
  beforeEach(() => {})
  it('avisa quando a camada do topo não tem o campo da unidade', () => {
    const { s, u, top } = setup('lemma')
    expect(top.missing.value).toBe(null)            // camada automática: nada a avisar
    s.layer = 'biberplus'
    expect(top.missing.value).toBe('lemma')
    s.layer = 'spacy'
    expect(top.missing.value).toBe(null)
    s.layer = 'biberplus'
    u.value = 'form'
    expect(top.missing.value).toBe(null)
    u.value = 'pos'
    expect(top.missing.value).toBe('upos')
  })
  it('marca o resultado como desatualizado quando a camada muda, até manter', () => {
    const { s, last, top } = setup('form')
    s.layer = 'spacy'
    expect(top.stale.value).toBe(false)             // nada calculado ainda
    last.value = { layer: 'spacy' }
    expect(top.stale.value).toBe(false)
    s.layer = 'biberplus'
    expect(top.stale.value).toBe(true)
    top.keep()
    expect(top.stale.value).toBe(false)
    s.layer = null
    expect(top.stale.value).toBe(true)              // automática também difere de "spacy"
  })
})
