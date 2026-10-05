// Dispersão de Gries: faixas de posição (deciles ajustáveis) e densidade por 1000 tokens.
// Cada texto vira uma matriz documento × faixa; várias consultas se sobrepõem somando as densidades
// do fundo e desenhando os traços na cor de cada consulta.
import { CHART_VARS } from './scale.js'

// Cor categórica estável para cada consulta adicionada.
export const queryColor = (i) => `var(${CHART_VARS[i % CHART_VARS.length]})`

// Cláusula de etiqueta ou classe dentro de uma consulta (para o Leitor destacar o que foi buscado).
export function clauseOf(query) {
  const tag = (query ?? '').match(/(?:^|[\s&])tag=([^\s&]+)/)
  if (tag) return { kind: 'tag', value: tag[1] }
  const pos = (query ?? '').match(/(?:^|[\s&])pos=([^\s&]+)/)
  if (pos) return { kind: 'pos', value: pos[1] }
  return null
}

// Quantas ocorrências caem em cada faixa (posições relativas 0..1).
export function bandCounts(positions, nBands) {
  const out = new Array(Math.max(0, nBands)).fill(0)
  if (!nBands) return out
  for (const p of positions ?? []) {
    let b = Math.floor(p * nBands)
    if (b < 0) b = 0
    if (b >= nBands) b = nBands - 1
    out[b] += 1
  }
  return out
}

// Matriz documento × faixa para uma consulta.
export function countsMatrix(perDocument, nBands) {
  return (perDocument ?? []).map((d) => bandCounts(d.positions, nBands))
}

// Densidade de uma faixa por 1000 tokens (comparável entre textos de tamanhos diferentes).
export function density(count, size, nBands) {
  return size ? (count * nBands * 1000) / size : 0
}

// Matriz documento × faixa somando as consultas; devolve também o maior valor (escala da cor).
export function combinedDensity(matrices, sizes, nBands) {
  const rows = sizes.map((size, i) =>
    Array.from({ length: nBands }, (_, b) => matrices.reduce((s, m) => s + density(m[i]?.[b] ?? 0, size, nBands), 0)))
  let max = 0
  for (const row of rows) for (const v of row) if (v > max) max = v
  return { rows, max }
}

// Opacidade da faixa (0..0,6); raiz quadrada comprime os extremos para o padrão ficar legível.
export function bandAlpha(value, max) {
  if (!max || !value) return 0
  return Math.round(Math.sqrt(value / max) * 60) / 100
}
