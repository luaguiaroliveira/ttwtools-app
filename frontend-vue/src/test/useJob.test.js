import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('../api/index.js', () => ({ api: { jobs: { get: vi.fn(), cancel: vi.fn() } } }))
import { api } from '../api/index.js'
import { progressPercent, useJob } from '../composables/useJob.js'

function withJob(key) {
  let job
  mount(defineComponent({ setup() { job = useJob(key, { interval: 100 }); return () => h('div') } }))
  return job
}

const flush = async () => { for (let i = 0; i < 5; i++) { await Promise.resolve(); await nextTick() } }

beforeEach(() => { vi.useFakeTimers(); sessionStorage.clear() })
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })

describe('useJob', () => {
  it('acompanha o progresso até terminar e esquece o id', async () => {
    const states = [
      { id: 'j1', status: 'running', done: 1, total: 4 },
      { id: 'j1', status: 'running', done: 3, total: 4 },
      { id: 'j1', status: 'done', done: 4, total: 4, result: { ok: true } },
    ]
    api.jobs.get.mockImplementation(() => Promise.resolve(states.shift()))
    const job = withJob('t1')
    await job.start(() => Promise.resolve({ job_id: 'j1' }))
    expect(job.job.value.done).toBe(1)
    expect(sessionStorage.getItem('ttw.job.t1')).toBe('j1')
    await vi.advanceTimersByTimeAsync(100)
    expect(progressPercent(job.job.value)).toBe(75)
    await vi.advanceTimersByTimeAsync(100)
    await flush()
    expect(job.job.value.status).toBe('done')
    expect(sessionStorage.getItem('ttw.job.t1')).toBeNull()
    expect(api.jobs.get).toHaveBeenCalledTimes(3)
  })

  it('cancela a tarefa ativa', async () => {
    api.jobs.get.mockResolvedValue({ id: 'j2', status: 'running', done: 0, total: 10 })
    const job = withJob('t2')
    await job.start(() => Promise.resolve({ job_id: 'j2' }))
    await job.cancel()
    expect(api.jobs.cancel).toHaveBeenCalledWith('j2')
    job.stop()
  })

  it('retoma a tarefa guardada ao reabrir a tela', async () => {
    sessionStorage.setItem('ttw.job.t3', 'j3')
    api.jobs.get.mockResolvedValue({ id: 'j3', status: 'done', result: 1 })
    const job = withJob('t3')
    await job.resume()
    expect(api.jobs.get).toHaveBeenCalledWith('j3')
    expect(job.job.value.status).toBe('done')
  })

  it('erro ao iniciar fica em error', async () => {
    const job = withJob('t4')
    await job.start(() => Promise.reject(new Error('boom')))
    expect(job.error.value.message).toBe('boom')
    expect(job.job.value).toBeNull()
  })
})
