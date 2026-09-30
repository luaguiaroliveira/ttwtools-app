// Busca de palavras no texto do Leitor: um fragmento simples (`const`) casa com qualquer palavra que o contenha
// (construction, deconstruction); com `*` ou `?` o padrão vale para a palavra inteira. `*` (qualquer sequência), `?` (uma letra), /regex/, sem distinguir maiúsculas.
// Várias palavras separadas por espaço formam uma sequência de palavras seguidas (como no KWIC).
const escapeRe = (s) => s.replace(/[.+^${}()|[\]\\]/g, '\\$&')

/** Uma palavra da busca → RegExp (fragmento simples: contém; com curinga: palavra inteira); null se a regex for inválida. */
export function wordPattern(spec) {
  try {
    if (spec.length > 2 && spec.startsWith('/') && spec.endsWith('/')) return new RegExp(spec.slice(1, -1), 'i')
    if (!/[*?]/.test(spec)) return new RegExp(escapeRe(spec), 'iu')
    return new RegExp(`^${escapeRe(spec).replace(/\*/g, '\\S*').replace(/\?/g, '\\S')}$`, 'iu')
  } catch { return null }
}

/** Ocorrências da busca em `tokens` ([{ word }]): lista de { start, end } (posições no vetor, `end` inclusive). */
export function findMatches(tokens, query) {
  const specs = (query ?? '').trim().split(/\s+/).filter(Boolean)
  if (!specs.length || !tokens?.length) return []
  const pats = specs.map(wordPattern)
  if (pats.some((p) => !p)) return []
  const out = []
  for (let i = 0; i + pats.length <= tokens.length; i++) {
    if (pats.every((p, k) => p.test(tokens[i + k].word ?? ''))) out.push({ start: i, end: i + pats.length - 1 })
  }
  return out
}
