import { describe, expect, it } from 'vitest'
import { bandAlpha, bandCounts, clauseOf, combinedDensity, contribution, countsMatrix, density, queryColor, sortRows, tagOf } from '../utils/dispersion.js'

describe('dispersion', () => {
  it('conta ocorrências por faixa e encaixa 1 na última', () => {
    expect(bandCounts([0, 0.5, 0.99, 1], 10)).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 2])
    expect(bandCounts([], 10)).toEqual(new Array(10).fill(0))
  })
  it('matriz documento × faixa', () => {
    const docs = [{ positions: [0, 0.95] }, { positions: [0.55] }]
    expect(countsMatrix(docs, 10)).toEqual([
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
    ])
  })
  it('densidade por 1000 tokens e soma das consultas', () => {
    expect(density(2, 1000, 10)).toBe(20)
    const m = [[[1], [0]], [[1], [3]]]          // 2 consultas × 2 documentos × 1 faixa
    const { rows, max } = combinedDensity(m, [1000, 1000], 1)   // 1 faixa ⇒ por 1000 = contagem/size×1000
    expect(rows).toEqual([[2], [3]])
    expect(max).toBe(3)
  })
  it('opacidade da faixa: zero sem valor e máxima no maior', () => {
    expect(bandAlpha(0, 10)).toBe(0)
    expect(bandAlpha(10, 10)).toBe(0.6)
    expect(bandAlpha(5, 10)).toBe(0.42)
  })
  it('extrai tag/pos para o Leitor destacar', () => {
    expect(clauseOf('tag=NOUN|VERB')).toEqual({ kind: 'tag', value: 'NOUN|VERB' })
    expect(clauseOf('black cat &tag=NN')).toEqual({ kind: 'tag', value: 'NN' })
    expect(clauseOf('pos=NOUN')).toEqual({ kind: 'pos', value: 'NOUN' })
    expect(clauseOf('the')).toBeNull()
  })
  it('etiqueta única vira a cor da camada; `|` e texto livre não', () => {
    expect(tagOf('pos=NOUN')).toBe('NOUN')
    expect(tagOf('the&tag=NN')).toBe('NN')
    expect(tagOf('tag=NN|JJ')).toBeNull()
    expect(tagOf('the')).toBeNull()
  })
  it('cor categórica estável por consulta', () => {
    expect(queryColor(0)).toBe('#C2500C')
    expect(queryColor(8)).toBe('#C2500C')
    expect(queryColor(2)).toBe('#2F6F9F')
  })
  it('contribuição do documento no DP e ordenação dos quadros', () => {
    expect(contribution(1, 4, 10, 40)).toBeCloseTo(0)          // o = e
    expect(contribution(3, 4, 10, 40)).toBeCloseTo(0.5)
    const rows = [
      { filename: 'b', size: 10, cells: [{ freq: 1 }] },
      { filename: 'a', size: 30, cells: [{ freq: 5 }] },
      { filename: 'c', size: 10, cells: [{ freq: 2 }] },
    ]
    expect(sortRows(rows, 'name').map((r) => r.filename)).toEqual(['a', 'b', 'c'])
    expect(sortRows(rows, 'freq').map((r) => r.filename)).toEqual(['a', 'c', 'b'])
    // DP contribuído: b 0,075 · c 0,05 · a 0,025 (decrescente)
    expect(sortRows(rows, 'dp', 8, 50).map((r) => r.filename)).toEqual(['b', 'c', 'a'])
  })
})
