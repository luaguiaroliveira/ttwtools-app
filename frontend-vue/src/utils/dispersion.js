// Dispersão de Gries: faixas de posição (deciles ajustáveis) e densidade por 1000 tokens.
// Cada texto vira uma matriz documento × faixa; várias consultas se sobrepõem somando as densidades
// do fundo e desenhando os traços na cor de cada consulta.
// Cores categóricas das consultas (mesmas do tema claro: `--chart-1..8`). Guardadas em hex porque
// cada consulta tem um seletor de cor (`<input type="color">`) e a cor escolhida vale no gráfico.
const QUERY_COLORS = ['#C2500C', '#3B3936', '#2F6F9F', '#7A5C99', '#2E8B57', '#B08900', '#A63D6B', '#8A8580']
export const queryColor = (i) => QUERY_COLORS[i % QUERY_COLORS.length]

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

// Parte de um documento no DP de Gries: |o − e| (o = parte das ocorrências, e = parte dos tokens).
export function contribution(freq, totalFreq, size, totalSize) {
  const o = totalFreq ? freq / totalFreq : 0
  const e = totalSize ? size / totalSize : 0
  return Math.abs(o - e)
}

// Ordena as linhas do quadro por nome (`name`), frequência (`freq`) ou DP contribuído (`dp`, decrescente).
// `rows` no formato do DispersionChart (uma consulta por linha: cells[0]).
export function sortRows(rows, by, totalFreq, totalSize) {
  const name = (a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true })
  const arr = [...rows]
  if (by === 'freq') return arr.sort((a, b) => (b.cells[0]?.freq ?? 0) - (a.cells[0]?.freq ?? 0) || name(a, b))
  if (by === 'dp') return arr.sort((a, b) =>
    contribution(b.cells[0]?.freq ?? 0, totalFreq, b.size, totalSize)
    - contribution(a.cells[0]?.freq ?? 0, totalFreq, a.size, totalSize) || name(a, b))
  return arr.sort(name)
}
