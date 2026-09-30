// Consultas de exploração já feitas ficam guardadas (mesmos parâmetros = mesma resposta, sem ir ao servidor).
// Limpa ao abrir outro projeto, trocar de camadas ou depois de etiquetar (`clearExploreCache`).
const exploreMemo = new Map()
export const clearExploreCache = () => exploreMemo.clear()
export const memoized = (name, fn) => async (p, signal) => {
  const key = `${name}|${JSON.stringify(p)}`
  if (exploreMemo.has(key)) return structuredClone(exploreMemo.get(key))
  const r = await fn(p, signal)
  exploreMemo.set(key, structuredClone(r))
  while (exploreMemo.size > 80) exploreMemo.delete(exploreMemo.keys().next().value)
  return r
}
