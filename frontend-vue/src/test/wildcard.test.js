import { describe, expect, it } from 'vitest'
import { findMatches, wordPattern } from '../utils/wildcard.js'

const toks = 'The cat sat on the mat . Cats sit, cast and CASE'.split(/\s+/).map((word) => ({ word }))
const at = (q) => findMatches(toks, q).map((m) => toks[m.start].word)

describe('busca no leitor', () => {
  it('palavra exata sem distinguir maiúsculas', () => { expect(at('the')).toEqual(['The', 'the']) })
  it('curingas * e ?', () => {
    expect(at('ca*')).toEqual(['cat', 'Cats', 'cast', 'CASE'])
    expect(at('?at')).toEqual(['cat', 'sat', 'mat'])
    expect(at('*at')).toEqual(['cat', 'sat', 'mat'])
    expect(at('s?t')).toEqual(['sat'])                  // 'sit,' tem a vírgula colada: não é 3 letras
  })
  it('regex entre barras e sequência de palavras', () => {
    expect(at('/^c.t$/')).toEqual(['cat'])
    expect(findMatches(toks, 'the mat')).toEqual([{ start: 4, end: 5 }])
    expect(findMatches(toks, 'sat on the')).toEqual([{ start: 2, end: 4 }])
  })
  it('regex inválida, busca vazia e caracteres especiais não quebram', () => {
    expect(wordPattern('/(/')).toBeNull()
    expect(findMatches(toks, '/(/')).toEqual([])
    expect(findMatches(toks, '  ')).toEqual([])
    expect(at('.')).toEqual(['.'])
  })
})

describe('fragmento de palavra', () => {
  it('um fragmento simples casa com qualquer palavra que o contenha; com curinga vale a palavra inteira', () => {
    const t = ['Construction', 'deconstruction', 'constructive', 'cat', 'concat'].map((word) => ({ word }))
    expect(findMatches(t, 'const').map((m) => t[m.start].word)).toEqual(['Construction', 'deconstruction', 'constructive'])
    expect(findMatches(t, 'cat').map((m) => t[m.start].word)).toEqual(['cat', 'concat'])
    expect(findMatches(t, 'cat*').map((m) => t[m.start].word)).toEqual(['cat'])
  })
})
