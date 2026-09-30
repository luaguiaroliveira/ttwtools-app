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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Cálculo longo como tarefa (`?async=1`): inicia, acompanha por /api/jobs/{id} e devolve o resultado.
 * Uma requisição parada por mais de ~60 s é derrubada pelo WebKit ("sem conexão com o servidor");
 * aqui cada consulta ao andamento é curta. Falhas de rede isoladas na consulta são repetidas (a tarefa
 * continua no servidor). `onJob(job)` recebe cada estado (etapa, feitos/total) para a barra de progresso.
 * @param {string} path  @param {any} body
 * @param {{onJob?: (job: any) => void, signal?: AbortSignal, interval?: number, retries?: number}} [opts]
 */
export async function postJob(path, body, { onJob, signal, interval = 500, retries = 5 } = {}) {
  const { job_id } = await request('POST', path, { body, params: { async: 1 }, signal })
  let failures = 0
  for (;;) {
    if (signal?.aborted) throw new DOMException('cancelado', 'AbortError')
    let job
    try {
      job = await request('GET', `/api/jobs/${job_id}`, { signal })
      failures = 0
    } catch (err) {
      if (err?.name === 'AbortError' || !(err instanceof ApiError) || err.status !== 0 || ++failures > retries) throw err
      await sleep(Math.min(4000, interval * 2 ** failures))
      continue
    }
    onJob?.(job)
    if (job.status === 'done') return job.result
    if (job.status === 'error') {
      const detail = job.error_code ? { code: job.error_code, ...(job.error_params ?? {}) } : String(job.error ?? '').replace(/^\w+(Error|Exception): /, '')
      throw new ApiError(422, detail)
    }
    if (job.status === 'cancelled') throw new DOMException('cancelado', 'AbortError')
    await sleep(interval)
  }
}
