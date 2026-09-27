// Tarefa em segundo plano: inicia (a função recebe {job_id}), acompanha o progresso,
// cancela e retoma ao reabrir a tela (o id fica em sessionStorage sob `key`).
import { onBeforeUnmount, ref } from 'vue'
import { api } from '../api/index.js'

const ACTIVE = new Set(['queued', 'running'])

export function useJob(key, { interval = 500 } = {}) {
  const job = ref(null)          // último estado vindo de /api/jobs/{id}
  const error = ref(null)
  let timer = null
  const storageKey = `ttw.job.${key}`

  const stop = () => { if (timer) { clearTimeout(timer); timer = null } }
  const remember = (id) => { try { id ? sessionStorage.setItem(storageKey, id) : sessionStorage.removeItem(storageKey) } catch { /* */ } }

  async function poll(id) {
    try {
      job.value = await api.jobs.get(id)
    } catch (err) {
      error.value = err
      remember(null)
      return
    }
    if (ACTIVE.has(job.value.status)) timer = setTimeout(() => poll(id), interval)
    else remember(null)
  }

  /** @param {() => Promise<{job_id: string}>} starter */
  async function start(starter) {
    stop()
    error.value = null
    job.value = { status: 'queued' }
    try {
      const { job_id } = await starter()
      remember(job_id)
      await poll(job_id)
    } catch (err) {
      error.value = err
      job.value = null
    }
  }

  async function cancel() {
    if (job.value?.id && ACTIVE.has(job.value.status)) await api.jobs.cancel(job.value.id)
  }

  /** Retoma a tarefa guardada (se ainda existir). */
  async function resume() {
    let id = null
    try { id = sessionStorage.getItem(storageKey) } catch { /* */ }
    if (id) await poll(id)
  }

  onBeforeUnmount(stop)
  return { job, error, start, cancel, resume, stop }
}

export function progressPercent(job) {
  if (!job?.total) return null
  return Math.round((100 * (job.done ?? 0)) / job.total)
}
