import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { advance, emptySteps, OPEN_PLAN, overallPercent, stepPercent } from '../composables/useSteps.js'
import StepProgress from '../components/StepProgress.vue'

describe('useSteps', () => {
  it('cada etapa vista ganha a sua barra; a anterior fecha em 100%', () => {
    const st = emptySteps()
    advance(st, { id: 'a', status: 'running', stage: 'decompress', done: 50, total: 100 })
    expect(st.steps).toHaveLength(1)
    expect(stepPercent(st.steps[0])).toBe(50)
    advance(st, { id: 'a', status: 'running', stage: 'idx_read', done: 1, total: 4 })
    expect(st.steps.map((s) => [s.stage, s.state])).toEqual([['decompress', 'done'], ['idx_read', 'running']])
    expect(stepPercent(st.steps[0])).toBe(100)
    expect(stepPercent(st.steps[1])).toBe(25)
  })
  it('andamento geral sobe sempre, conta as etapas que ainda podem vir e ignora as puladas', () => {
    const st = emptySteps()
    const seen = []
    for (const j of [
      { id: 'a', status: 'running', stage: 'decompress', done: 0, total: 100 },
      { id: 'a', status: 'running', stage: 'decompress', done: 100, total: 100 },
      { id: 'a', status: 'running', stage: 'idx_read', done: 0, total: 10 },
      { id: 'a', status: 'running', stage: 'idx_read', done: 10, total: 10 },
      { id: 'a', status: 'running', stage: 'idx_words', done: 1, total: 4 },
      { id: 'a', status: 'running', stage: 'idx_xpos', done: 4, total: 4 },
    ]) { advance(st, j); seen.push(overallPercent(st, OPEN_PLAN)) }
    expect(seen).toEqual([...seen].sort((a, b) => a - b))
    expect(seen[0]).toBeLessThan(10)
    expect(seen.at(-1)).toBeGreaterThan(80)
    advance(st, { id: 'a', status: 'done', stage: 'done' })
    expect(overallPercent(st, OPEN_PLAN)).toBe(100)
  })
  it('outra tarefa recomeça do zero', () => {
    const st = emptySteps()
    advance(st, { id: 'a', status: 'running', stage: 'copy', done: 1, total: 2 })
    advance(st, { id: 'b', status: 'running', stage: 'pack', done: 0, total: 0 })
    expect(st.steps.map((s) => s.stage)).toEqual(['pack'])
    expect(stepPercent(st.steps[0])).toBeNull()
  })
})

describe('StepProgress', () => {
  it('mostra a barra geral e uma barra por etapa', async () => {
    const i18n = createI18n({ legacy: false, locale: 'pt', messages: { pt: { job: { overall: 'Progresso geral', progress: '{done}/{total}', stage: { decompress: 'Descompactando', idx_read: 'Lendo' } } } } })
    const w = mount(StepProgress, { props: { job: { id: 'a', status: 'running', stage: 'decompress', done: 1048576, total: 2097152 }, plan: OPEN_PLAN }, global: { plugins: [i18n] } })
    await w.setProps({ job: { id: 'a', status: 'running', stage: 'idx_read', done: 1, total: 4 } })
    expect(w.find('[data-testid=step-decompress]').attributes('data-state')).toBe('done')
    expect(w.find('[data-testid=step-idx_read]').attributes('data-state')).toBe('running')
    expect(w.findAll('[role=progressbar]')).toHaveLength(3)        // geral + 2 etapas
  })
})
