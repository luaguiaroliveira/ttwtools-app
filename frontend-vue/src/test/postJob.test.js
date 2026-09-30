import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, postJob } from '../api/client.js'

const res = (status, body) => ({ ok: status < 400, status, statusText: 'x', text: () => Promise.resolve(JSON.stringify(body)) })
// fila de respostas: cada item é uma resposta ou um Error (falha de rede)
const queue = (items) => { globalThis.fetch = vi.fn().mockImplementation(() => { const i = items.shift(); return i instanceof Error ? Promise.reject(i) : Promise.resolve(i) }) }
afterEach(() => vi.restoreAllMocks())

describe('postJob', () => {
  it('inicia com ?async=1, acompanha e devolve o resultado, avisando cada estado', async () => {
    queue([res(200, { job_id: 'j1' }), res(200, { id: 'j1', status: 'running', done: 1, total: 4, stage: 'kfa_count' }),
      res(200, { id: 'j1', status: 'done', result: { rows: [1] } })])
    const seen = []
    const out = await postJob('/api/compare/kfa', { a: 1 }, { interval: 1, onJob: (j) => seen.push(j.status) })
    expect(out).toEqual({ rows: [1] })
    expect(seen).toEqual(['running', 'done'])
    const first = new URL(fetch.mock.calls[0][0])
    expect(first.pathname).toBe('/api/compare/kfa')
    expect(first.searchParams.get('async')).toBe('1')
    expect(new URL(fetch.mock.calls[1][0]).pathname).toBe('/api/jobs/j1')
  })

  it('erro da tarefa vira ApiError sem o nome da exceção; código estável vira objeto', async () => {
    queue([res(200, { job_id: 'j' }), res(200, { status: 'error', error: 'ValueError: cada lado precisa de 2 documentos' })])
    await expect(postJob('/x', {}, { interval: 1 })).rejects.toMatchObject({ status: 422, detail: 'cada lado precisa de 2 documentos' })
    queue([res(200, { job_id: 'j' }), res(200, { status: 'error', error: 'X: y', error_code: 'insufficient_disk_space', error_params: { what: 'save' } })])
    await expect(postJob('/x', {}, { interval: 1 })).rejects.toMatchObject({ detail: { code: 'insufficient_disk_space', what: 'save' } })
  })

  it('falha de rede isolada ao consultar o andamento é repetida; muitas seguidas falham', async () => {
    queue([res(200, { job_id: 'j' }), new TypeError('Load failed'), res(200, { status: 'done', result: 7 })])
    expect(await postJob('/x', {}, { interval: 1 })).toBe(7)
    queue([res(200, { job_id: 'j' }), ...Array(4).fill(new TypeError('Load failed'))])
    await expect(postJob('/x', {}, { interval: 1, retries: 2 })).rejects.toBeInstanceOf(ApiError)
  })

  it('tarefa cancelada vira AbortError', async () => {
    queue([res(200, { job_id: 'j' }), res(200, { status: 'cancelled' })])
    await expect(postJob('/x', {}, { interval: 1 })).rejects.toMatchObject({ name: 'AbortError' })
  })
})
