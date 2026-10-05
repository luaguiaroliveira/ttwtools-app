import { describe, expect, it } from 'vitest'
import { bandAlpha, bandCounts, clauseOf, combinedDensity, countsMatrix, density, queryColor } from '../utils/dispersion.js'

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
  it('cor categórica estável por consulta', () => {
    expect(queryColor(0)).toBe('var(--chart-1)')
    expect(queryColor(8)).toBe('var(--chart-1)')
    expect(queryColor(2)).toBe('var(--chart-3)')
  })
})
