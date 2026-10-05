import { describe, expect, it } from 'vitest'
import { describeTag, isPlausibleTag, mergeTagsets, tagsetIdsFor, tagsetIdsForConfig } from '../utils/tagInfo.js'

const t = (key, p = {}) => `${key}:${p.tag ?? ''}:${p.desc ?? ''}`
const sets = [
  { name: 'MFTE', tags: [{ tag: 'IN', definition: 'preposição' }, { tag: 'PASS', definition: 'voz passiva' }] },
  { name: 'Penn Treebank', tags: [{ tag: 'IN', definition: 'outra definição de IN' }, { tag: 'NN', definition: 'substantivo' }] },
]

describe('tagInfo', () => {
  it('a primeira definição vence e guarda o repertório de origem', () => {
    const defs = mergeTagsets(sets)
    expect(defs.IN).toEqual({ text: 'preposição', source: 'MFTE' })
    expect(defs.NN.source).toBe('Penn Treebank')
  })
  it('infere sufixos other/all a partir da etiqueta base e marca como inferida', () => {
    const defs = mergeTagsets(sets)
    expect(describeTag('PASS', defs, t)).toMatchObject({ text: 'voz passiva', inferred: false })
    expect(describeTag('INother', defs, t)).toMatchObject({ inferred: true, source: 'MFTE', text: 'taginfo.other:IN:preposição' })
    expect(describeTag('PASSall', defs, t)).toMatchObject({ inferred: true, text: 'taginfo.all:PASS:voz passiva' })
    expect(describeTag('XYZother', defs, t)).toBeNull()
  })
  it('camadas MFTE combinam MFTE, Penn Treebank e Biber', () => {
    expect(tagsetIdsFor('mfte_ext', 'tags')).toEqual(['mfte', 'ptb', 'biber'])
    expect(tagsetIdsFor('biberplus')).toEqual(['biber'])
    expect(tagsetIdsFor('stanza', 'upos')).toEqual(['upos'])
  })
  it('repertórios seguem os componentes escolhidos na configuração', () => {
    const spacy = { tagger: 'spacy', tagsets: { upos: 'upos', xpos: 'ptb' } }
    expect(tagsetIdsForConfig(spacy, { components: ['lemma', 'morph', 'pos', 'tag'] })).toEqual(['ptb', 'upos'])
    expect(tagsetIdsForConfig(spacy, { components: ['pos'] })).toEqual(['upos'])
    expect(tagsetIdsForConfig(spacy, { components: [] })).toEqual([])
    const stanza = { tagger: 'stanza', tagsets: { upos: 'upos', xpos: 'ptb' }, tagsets_by_lang: { pt: { upos: 'upos', xpos: null } } }
    expect(tagsetIdsForConfig(stanza, { lang: 'en', components: ['morph', 'pos'] })).toEqual(['ptb', 'upos'])
    expect(tagsetIdsForConfig(stanza, { lang: 'pt', components: ['morph', 'pos'] })).toEqual(['upos'])
    const mfte = { tagger: 'mfte', tagsets: { tags: 'mfte', xpos: 'ptb', upos: 'upos' } }
    expect(tagsetIdsForConfig(mfte, { components: ['mfte', 'morph', 'pos'] })).toEqual(['mfte', 'ptb', 'upos'])
    expect(tagsetIdsForConfig({ tagger: 'biberplus', tagsets: { tags: 'biber' } }, {})).toEqual(['biber'])
  })
  it('reconhece etiquetas plausíveis e esconde lixo da camada', () => {
    for (const ok of ['NN', 'NNother', 'JJATDother', 'NNMention', 'WQ', 'VBDd', '_SP', 'PASS', 'URL'])
      expect(isPlausibleTag(ok), ok).toBe(true)
    for (const bad of ['', '/getamp/frames.htm?mapAction=gaz&gazName=p&gazString=Avebury_URL', 'cit_NN',
                       'NNother=args._NN', 'a b', 'x'.repeat(21), 'foo/bar', 'a&b'])
      expect(isPlausibleTag(bad), bad).toBe(false)
  })
})
