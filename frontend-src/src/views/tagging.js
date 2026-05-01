/**
 * views/tagging.js — BiberPlus tagging form + job polling.
 */

import { api }       from '../api.js'
import { showToast } from '../ui.js'
import { loadCorpusList } from './corpus.js'

let _jobId     = null
let _pollTimer = null

function setStatus(stateName, msg) {
  const box = document.getElementById('tagging-status')
  box.className = `status-box ${stateName}`
  box.textContent = msg
  box.classList.remove('hidden')
}

async function pollJob() {
  if (!_jobId) return
  try {
    const job = await api.tagging.status(_jobId)
    if (job.status === 'done') {
      clearInterval(_pollTimer); _pollTimer = null
      setStatus('done', 'Tagging concluído com sucesso!')
      showToast('Tagging concluído!')
      await loadCorpusList()
    } else if (job.status === 'error') {
      clearInterval(_pollTimer); _pollTimer = null
      setStatus('error', `Erro: ${job.error}`)
      showToast(job.error, 'error')
    } else {
      let disp = job.msg || `Status: ${job.status}…`
      if (job.tqdm) disp += '\n' + job.tqdm
      setStatus('running', disp)
    }
  } catch (err) {
    clearInterval(_pollTimer); _pollTimer = null
    setStatus('error', `Falha: ${err.message}`)
  }
}

export function initTagging() {
  // Show "Usar spaCy" option only when BiberPlus is selected
  const taggerSelect  = document.getElementById('tag-tagger-select')
  const usenlpWrap    = document.getElementById('tag-usenlp-wrap')

  function _syncUsenlp() {
    if (!usenlpWrap) return
    const isBiber = taggerSelect?.value === 'biberplus'
    usenlpWrap.style.display = isBiber ? '' : 'none'
    if (!isBiber) {
      const cb = document.getElementById('tag-usenlp')
      if (cb) cb.checked = false
    }
  }

  taggerSelect?.addEventListener('change', _syncUsenlp)
  _syncUsenlp()

  document.getElementById('form-tagging')?.addEventListener('submit', async e => {
    e.preventDefault()

    const corpus = document.getElementById('tag-corpus-select').value
    if (!corpus) { showToast('Selecione um corpus.', 'error'); return }

    const body = {
      corpus_name:    corpus,
      source:         'project',
      tagger:         document.getElementById('tag-tagger-select').value,
      usenlp:         document.getElementById('tag-usenlp').checked,
      save_tagged:    document.getElementById('tag-save-tagged').checked,
      n_processes:    parseInt(document.getElementById('tag-nprocesses').value, 10),
      function_words: false,
    }

    try {
      const { job_id } = await api.tagging.run(body)
      _jobId     = job_id
      if (_pollTimer) clearInterval(_pollTimer)
      setStatus('running', `Job iniciado (${job_id.slice(0, 8)}…). Aguardando…`)
      _pollTimer = setInterval(pollJob, 2000)
    } catch (err) {
      showToast(err.message, 'error')
    }
  })
}
