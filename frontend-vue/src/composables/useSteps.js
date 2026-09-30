// Etapas de uma tarefa longa (abrir, salvar): a tarefa informa uma etapa por vez (`stage`, `done`, `total`);
// aqui guardamos as já vistas, cada uma com a sua barra, e calculamos o andamento geral. `plan` lista as
// etapas que ainda podem vir (o que a tarefa pular não conta); os pesos são estimativas de duração relativa.
export const STAGE_WEIGHT = {
  decompress: 2, migrate: 6, search: 3, indexes: 1, idx_read: 3, idx_words: 1, idx_lemmas: 1, idx_doc: 1, idx_upos: 1,
  idx_xpos: 1, copy: 2, pack: 3, save: 2, vacuum: 2,
}
export const OPEN_PLAN = ['decompress', 'migrate', 'search', 'indexes', 'idx_read', 'idx_words', 'idx_lemmas', 'idx_doc', 'idx_upos', 'idx_xpos']
export const SAVE_PLAN = ['copy', 'pack', 'save', 'vacuum']

const weight = (stage) => STAGE_WEIGHT[stage] ?? 1
const fraction = (s) => (s.total ? Math.min(1, (s.done ?? 0) / s.total) : 0)

export function emptySteps() {
  return { id: null, steps: [], finished: false }
}

/** Atualiza `state` (mutando) com o estado mais recente da tarefa. */
export function advance(state, job) {
  if (!job) return state
  if (job.id && state.id && job.id !== state.id) Object.assign(state, emptySteps())
  if (job.id) state.id = job.id
  const stage = job.stage
  if (stage && stage !== 'done') {
    const last = state.steps[state.steps.length - 1]
    if (!last || last.stage !== stage) {
      if (last) last.state = 'done'
      state.steps.push({ stage, done: 0, total: 0, state: 'running' })
    }
    const cur = state.steps[state.steps.length - 1]
    cur.done = job.done ?? 0
    cur.total = job.total ?? 0
  }
  if (job.status === 'done') {
    state.finished = true
    state.steps.forEach((s) => { s.state = 'done'; if (s.total) s.done = s.total })
  }
  return state
}

/** Percentual de uma etapa (null = andamento desconhecido). */
export function stepPercent(step) {
  if (step.state === 'done') return 100
  return step.total ? Math.round(100 * fraction(step)) : null
}

/** Andamento geral (0–100): etapas vistas + as do `plan` que ainda podem vir depois da atual. */
export function overallPercent(state, plan = []) {
  if (state.finished) return 100
  const steps = state.steps
  if (!steps.length) return 0
  const cur = steps[steps.length - 1]
  const seen = new Set(steps.map((s) => s.stage))
  const at = plan.indexOf(cur.stage)
  const ahead = at >= 0 ? plan.slice(at + 1).filter((s) => !seen.has(s)) : []
  let done = 0
  let total = 0
  for (const s of steps) {
    const w = weight(s.stage)
    total += w
    done += s.state === 'done' ? w : w * fraction(s)
  }
  for (const s of ahead) total += weight(s)
  return total ? Math.round((100 * done) / total) : 0
}
