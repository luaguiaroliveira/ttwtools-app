import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, request } from '../api/client.js'

const respond = (status, body) => vi.fn().mockResolvedValue({
  ok: status < 400, status, statusText: 'x', text: () => Promise.resolve(body === undefined ? '' : JSON.stringify(body)),
})

afterEach(() => vi.restoreAllMocks())

describe('request', () => {
  it('monta a URL com parâmetros, ignorando vazios, e repete listas', async () => {
    globalThis.fetch = respond(200, { ok: 1 })
    const data = await request('GET', '/api/explore/kwic', { params: { corpus: 'c', layer: null, where: ['a=1', 'b=2'] } })
    expect(data).toEqual({ ok: 1 })
    const url = new URL(fetch.mock.calls[0][0])
    expect(url.pathname).toBe('/api/explore/kwic')
    expect(url.searchParams.get('corpus')).toBe('c')
    expect(url.searchParams.has('layer')).toBe(false)
    expect(url.searchParams.getAll('where')).toEqual(['a=1', 'b=2'])
  })

  it('envia JSON no POST', async () => {
    globalThis.fetch = respond(200, { job_id: 'x' })
    await request('POST', '/api/tagging/layers', { body: { corpus: 'c' } })
    const init = fetch.mock.calls[0][1]
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body)).toEqual({ corpus: 'c' })
  })

  it('erro HTTP vira ApiError com status e detail', async () => {
    globalThis.fetch = respond(422, { detail: 'opções inválidas' })
    await expect(request('GET', '/api/x')).rejects.toMatchObject({ name: 'ApiError', status: 422, detail: 'opções inválidas' })
  })

  it('falha de rede vira ApiError status 0', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    const err = await request('GET', '/api/x').catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(0)
  })

  it('resposta vazia vira null', async () => {
    globalThis.fetch = respond(200, undefined)
    expect(await request('POST', '/api/x')).toBeNull()
  })
})
