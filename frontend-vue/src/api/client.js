// Cliente único da API local (rotas finas do pacote ttwtools).
// Erros viram ApiError com status e detail; as telas mostram err.message traduzido.

export class ApiError extends Error {
  /** Tradução opcional, instalada em main.js (`utils/errors.js`), para `err.message`. */
  static translateFn = null
  /** @param {number} status @param {any} detail */
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : JSON.stringify(detail))
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
    if (ApiError.translateFn) this.message = ApiError.translateFn(status, detail)
  }
}

let base = ''
/** Base das URLs (vazio = mesmo servidor que serviu a página). */
export function setBase(url) { base = url.replace(/\/$/, '') }

/**
 * @param {'GET'|'POST'|'DELETE'} method
 * @param {string} path  ex.: '/api/explore/kwic'
 * @param {{params?: Record<string, any>, body?: any, signal?: AbortSignal}} [opts]
 */
export async function request(method, path, opts = {}) {
  const url = new URL(base + path, globalThis.location?.href ?? 'http://localhost/')
  for (const [k, v] of Object.entries(opts.params ?? {})) {
    if (v === undefined || v === null || v === '') continue
    if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(k, x))
    else url.searchParams.set(k, String(v))
  }
  let res
  try {
    res = await fetch(url, {
      method,
      headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    throw new ApiError(0, 'network')
  }
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new ApiError(res.status, data?.detail ?? res.statusText)
  return data
}

export const get = (path, params, signal) => request('GET', path, { params, signal })
export const post = (path, body, params) => request('POST', path, { body, params })
