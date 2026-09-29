// Rótulos curtos para gráficos com muitos nomes parecidos (ex.: arquivos de um mesmo corpus).
// Tira o prefixo e o sufixo comuns (em fronteira de . _ - espaço) e, se ainda for longo, corta no meio.
const SEP = /[._\-\s]/
export function middleTruncate(s, max = 28) {
  if (s.length <= max) return s
  const keep = max - 1
  const head = Math.ceil(keep / 2)
  return `${s.slice(0, head)}…${s.slice(s.length - (keep - head))}`
}
export function distinctLabels(names, max = 28) {
  if (names.length < 2) return names.map((n) => middleTruncate(n, max))
  const first = names[0]
  let p = 0
  while (p < first.length && names.every((n) => n[p] === first[p])) p++
  while (p > 0 && !SEP.test(first[p - 1])) p--
  let q = 0
  while (q < first.length - p && names.every((n) => n[n.length - 1 - q] === first[first.length - 1 - q])) q++
  while (q > 0 && !SEP.test(first[first.length - q])) q--
  return names.map((n) => middleTruncate(n.slice(p, n.length - q) || n, max))
}
