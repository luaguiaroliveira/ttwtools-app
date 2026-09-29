import { describe, expect, it } from 'vitest'
import { describeTag, mergeTagsets, tagsetIdsFor } from '../utils/tagInfo.js'

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
})
