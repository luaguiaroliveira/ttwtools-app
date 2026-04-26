/**
 * views/quickrun.js — Full pipeline (tagging → normalize → KFA → save .ttwa).
 */

import { api }       from '../api.js'
import { showToast, showView } from '../ui.js'

const QR_STEPS = ['queued', 'tagging', 'normalizing', 'kfa', 'saving', 'done']
let _jobId     = null
let _pollTimer = null

function setStep(step, isError) {
  document.querySelectorAll('.progress-step').forEach(el => {
    const s = el.dataset.step
    el.classList.remove('active', 'done', 'error')
    if (isError && s === step) {
      el.classList.add('error')
    } else if (!isError) {
      const idx = QR_STEPS.indexOf(s)
      const cur = QR_STEPS.indexOf(step)
      if (idx < cur)      el.classList.add('done')
      else if (idx === cur) el.classList.add('active')
    }
  })
}

function setMsg(msg, tqdm) {
  const el = document.getElementById('qr-msg')
  if (el) {
    el.textContent = msg || ''
    if (tqdm) el.textContent += '\n' + tqdm
  }
}

async function poll(refreshKfaSelect) {
  try {
    const r = await api.quickrun.status(_jobId)
    setStep(r.step, r.status === 'error')
    setMsg(r.msg || r.message || '', r.tqdm || '')

    if (r.status === 'done') {
      clearInterval(_pollTimer); _pollTimer = null
      showToast('Análise concluída!')
      // update project label via custom event
      document.dispatchEvent(new CustomEvent('project-changed'))
      try { await refreshKfaSelect() } catch (_) {}
      document.getElementById('btn-qr-results')?.classList.remove('hidden')
      return
    }
    if (r.status === 'error') {
      clearInterval(_pollTimer); _pollTimer = null
      showToast(r.error || 'Erro na análise.', 'error')
    }
  } catch (err) {
    clearInterval(_pollTimer); _pollTimer = null
    showToast(err.message, 'error')
  }
}

export function initQuickrun({ refreshKfaSelect }) {
  // Browse buttons (📁) inside the quickrun form
  document.querySelectorAll('#form-quickrun .btn-browse').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true
      const prev = btn.textContent
      btn.textContent = '…'
      try {
        const res = await api.utils.pickFolder()
        if (res?.path) {
          const targetId = btn.dataset.target
          const input    = document.getElementById(targetId)
          if (input) {
            if (targetId === 'qr-output') {
              const c1 = document.getElementById('qr-c1-name')?.value?.trim() || 'corpus1'
              const c2 = document.getElementById('qr-c2-name')?.value?.trim() || 'corpus2'
              input.value = res.path + '/' + c1 + '_vs_' + c2 + '.ttwa'
            } else {
              input.value = res.path
              
              // Auto-fill corpus name based on folder name
              const nameId = targetId.replace('-folder', '-name')
              const nameInput = document.getElementById(nameId)
              if (nameInput) {
                const folderName = res.path.split(/[/\\]/).filter(Boolean).pop()
                if (folderName) nameInput.value = folderName
              }
            }
            input.dispatchEvent(new Event('change'))
          }
        }
      } catch (_) {}
      btn.textContent = prev
      btn.disabled    = false
    })
  })

  // Form submit
  document.getElementById('form-quickrun')?.addEventListener('submit', async e => {
    e.preventDefault()
    const get = id => document.getElementById(id)?.value?.trim()

    let outputPath = get('qr-output') || ''
    if (outputPath && !outputPath.toLowerCase().endsWith('.ttwa')) {
      outputPath = outputPath.replace(/\/$/, '') + '.ttwa'
    }

    const body = {
      corpus1_name:   get('qr-c1-name'),
      corpus1_folder: get('qr-c1-folder'),
      corpus2_name:   get('qr-c2-name'),
      corpus2_folder: get('qr-c2-folder'),
      output_ttwa:    outputPath,
      mode:           get('qr-mode'),
      tagger:         get('qr-tagger'),
      join:           get('qr-join'),
      min_effect:     parseFloat(get('qr-effect') || '0.2'),
      usenlp:         document.getElementById('qr-usenlp')?.checked ?? false,
      n_processes:    1,
      overwrite:      true,
    }

    const required = ['corpus1_name', 'corpus1_folder', 'corpus2_name', 'corpus2_folder', 'output_ttwa']
    if (required.some(k => !body[k])) {
      showToast('Preencha todos os campos obrigatórios.', 'error')
      return
    }

    // Reset UI
    setStep('queued', false)
    setMsg('Iniciando…')
    document.getElementById('qr-progress')?.classList.remove('hidden')
    document.getElementById('btn-qr-results')?.classList.add('hidden')

    try {
      const { job_id } = await api.quickrun.start(body)
      _jobId      = job_id
      _pollTimer  = setInterval(() => poll(refreshKfaSelect), 1500)
    } catch (err) {
      showToast(err.message, 'error')
    }
  })

  // "Ver resultados" button
  document.getElementById('btn-qr-results')?.addEventListener('click', async () => {
    try { await refreshKfaSelect() } catch (_) {}
    showView('results')
  })
}
