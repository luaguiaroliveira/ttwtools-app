/**
 * views/quickrun.js — Full pipeline (tagging → normalize → KFA → save .ttwa).
 */

import { api }       from '../api.js'
import { showToast, showView } from '../ui.js'

const QR_STEPS = ['queued', 'tagging', 'normalizing', 'kfa', 'saving', 'done']
let _jobId     = null
let _pollTimer = null
let _isStarting = false
let _isRunning = false

function _setRunButtonBusy(isBusy) {
  const btn = document.getElementById('btn-qr-run')
  if (!btn) return
  btn.disabled = isBusy
  btn.textContent = isBusy ? 'Executando…' : 'Executar pipeline'
}

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

function _getSelectedTaggers() {
  return Array.from(document.querySelectorAll('.qr-tagger-cb'))
    .filter(cb => cb.checked)
    .map(cb => cb.value)
}

/** Read which categories are checked in the inline export panel */
function _getSelectedCats() {
  return Array.from(document.querySelectorAll('.qr-cat-cb:checked'))
    .map(cb => cb.dataset.cat)
}

/** Export using the pre-selected categories (no modal needed) */
async function _doAutoExport() {
  const selectedCats = _getSelectedCats()
  if (!selectedCats.length) return

  setMsg('Exportando arquivos…')
  try {
    const { items } = await api.project.manifest()
    const filtered = items.filter(i => selectedCats.includes(i.category))
    const body = filtered.length < items.length ? { items: filtered.map(i => i.path) } : {}
    const exp = await api.project.export(body)
    const total = exp.corpora + exp.tagged + exp.tables + exp.kfa
    showToast(`Exportado ${total} arquivo(s) para ${exp.dest}`)
  } catch (e) {
    showToast(`Exportação falhou: ${e.message}`, 'error')
  }
}

async function poll(refreshKfaSelect) {
  try {
    const r = await api.quickrun.status(_jobId)
    setStep(r.step, r.status === 'error')
    setMsg(r.msg || r.message || '', r.tqdm || '')

    if (r.status === 'done') {
      clearInterval(_pollTimer); _pollTimer = null
      _isRunning = false
      _setRunButtonBusy(false)
      // update project label via custom event
      document.dispatchEvent(new CustomEvent('project-changed'))
      try { await refreshKfaSelect() } catch (_) {}

      // Auto-export using the inline category selection
      const autoExport = document.getElementById('qr-auto-export')?.checked
      if (autoExport) {
        await _doAutoExport()
      } else {
        showToast('Análise concluída!')
      }

      document.getElementById('btn-qr-results')?.classList.remove('hidden')
      return
    }
    if (r.status === 'error') {
      clearInterval(_pollTimer); _pollTimer = null
      _isRunning = false
      _setRunButtonBusy(false)
      showToast(r.error || 'Erro na análise.', 'error')
    }
  } catch (err) {
    clearInterval(_pollTimer); _pollTimer = null
    _isRunning = false
    _setRunButtonBusy(false)
    showToast(err.message, 'error')
  }
}

export function initQuickrun({ refreshKfaSelect }) {
  // ── Tagger tree logic ──────────────────────────────────────────────────────
  const allCb      = document.getElementById('qr-all')
  const groupCbs   = Array.from(document.querySelectorAll('.qr-group-cb'))
  const leafCbs    = Array.from(document.querySelectorAll('.qr-tagger-cb'))
  const biberCb    = leafCbs.find(cb => cb.value === 'biberplus')
  const usenlpWrap = document.getElementById('qr-usenlp-wrap')

  function _leafsOfGroup(group) {
    return leafCbs.filter(cb => cb.dataset.group === group)
  }

  function _syncGroupState(groupCb) {
    const leaves = _leafsOfGroup(groupCb.dataset.group)
    const checked = leaves.filter(c => c.checked).length
    if (checked === 0) {
      groupCb.checked = false
      groupCb.indeterminate = false
    } else if (checked === leaves.length) {
      groupCb.checked = true
      groupCb.indeterminate = false
    } else {
      groupCb.checked = false
      groupCb.indeterminate = true
    }
  }

  function _syncAllState() {
    const total    = leafCbs.length
    const checked  = leafCbs.filter(c => c.checked).length
    if (checked === 0) {
      allCb.checked = false
      allCb.indeterminate = false
    } else if (checked === total) {
      allCb.checked = true
      allCb.indeterminate = false
    } else {
      allCb.checked = false
      allCb.indeterminate = true
    }
  }

  function _syncUsenlp() {
    if (!usenlpWrap) return
    const visible = biberCb?.checked ?? false
    usenlpWrap.style.display = visible ? '' : 'none'
    if (!visible) {
      const radio = document.querySelector('input[name="qr-biber-mode"][value="no_nlp"]')
      if (radio) radio.checked = true
    }
  }

  // "Todos" clicked → set all leaves
  allCb?.addEventListener('change', () => {
    const newState = allCb.checked
    leafCbs.forEach(cb => { cb.checked = newState })
    groupCbs.forEach(gcb => {
      gcb.checked = newState
      gcb.indeterminate = false
    })
    _syncUsenlp()
  })

  // Group checkbox clicked → set all children
  groupCbs.forEach(gcb => {
    gcb.addEventListener('change', () => {
      _leafsOfGroup(gcb.dataset.group).forEach(cb => { cb.checked = gcb.checked })
      gcb.indeterminate = false
      _syncAllState()
      _syncUsenlp()
    })
  })

  // Leaf checkbox clicked → update parent group + "Todos"
  leafCbs.forEach(cb => {
    cb.addEventListener('change', () => {
      const group = cb.dataset.group
      if (group) {
        const gcb = groupCbs.find(g => g.dataset.group === group)
        if (gcb) _syncGroupState(gcb)
      }
      _syncAllState()
      _syncUsenlp()
    })
  })

  // Sync initial state
  groupCbs.forEach(gcb => _syncGroupState(gcb))
  _syncAllState()
  _syncUsenlp()

  // ── Toggle category panel ──────────────────────────────────────────────────
  const autoExportCb = document.getElementById('qr-auto-export')
  const catsPanel    = document.getElementById('qr-export-cats')

  function _syncCatsPanel() {
    if (!catsPanel) return
    catsPanel.classList.toggle('qr-export-cats--hidden', !autoExportCb?.checked)
  }

  autoExportCb?.addEventListener('change', _syncCatsPanel)
  _syncCatsPanel()

  // ── Browse / open-folder buttons ───────────────────────────────────────────
  const LS_CORPUS = 'qr_last_corpus_folder'
  const LS_OUTPUT = 'qr_last_output_folder'

  document.querySelectorAll('#form-quickrun .btn-open-folder').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true
      const origText = btn.textContent
      btn.textContent = '…'

      const isOutput = btn.dataset.lastkey === 'output'
      const storageKey = isOutput ? LS_OUTPUT : LS_CORPUS
      const defaultLocation = localStorage.getItem(storageKey) || ''

      try {
        const res = await api.utils.pickFolder({ defaultLocation })
        if (res?.path) {
          const targetId = btn.dataset.target
          const input    = document.getElementById(targetId)
          if (input) {
            if (isOutput) {
              // Suggest a .ttwa file name from corpus names
              const c1 = document.getElementById('qr-c1-name')?.value?.trim() || 'corpus1'
              const c2 = document.getElementById('qr-c2-name')?.value?.trim() || 'corpus2'
              input.value = res.path + '/' + c1 + '_vs_' + c2 + '.ttwa'
              localStorage.setItem(LS_OUTPUT, res.path)
            } else {
              input.value = res.path
              // Auto-fill corpus name from folder name
              const nameId = btn.dataset.nameid
              const nameInput = nameId ? document.getElementById(nameId) : null
              if (nameInput && !nameInput.value.trim()) {
                const folderName = res.path.split(/[/\\]/).filter(Boolean).pop()
                if (folderName) nameInput.value = folderName
              }
              // Remember parent dir as the last corpus location
              const parentDir = res.path.split(/[/\\]/).slice(0, -1).join('/') || res.path
              localStorage.setItem(LS_CORPUS, parentDir)
            }
            input.dispatchEvent(new Event('change'))
          }
        }
      } catch (_) {}

      btn.textContent = origText
      btn.disabled    = false
    })
  })

  // ── Form submit ────────────────────────────────────────────────────────────
  document.getElementById('form-quickrun')?.addEventListener('submit', async e => {
    e.preventDefault()
    if (_isStarting || _isRunning) return

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
      taggers:        _getSelectedTaggers(),
      join:           get('qr-join'),
      min_effect:     0,
      usenlp:         document.querySelector('input[name="qr-biber-mode"]:checked')?.value === 'use_nlp',
      n_processes:    1,
      overwrite:      true,
    }

    const required = ['corpus1_name', 'corpus1_folder', 'corpus2_name', 'corpus2_folder', 'output_ttwa']
    if (required.some(k => !body[k])) {
      showToast('Preencha todos os campos obrigatórios.', 'error')
      return
    }

    if (!body.taggers.length) {
      showToast('Selecione pelo menos um tagger.', 'error')
      return
    }

    // Reset UI
    _isStarting = true
    _setRunButtonBusy(true)
    setStep('queued', false)
    setMsg('Iniciando…')
    document.getElementById('qr-progress')?.classList.remove('hidden')
    document.getElementById('btn-qr-results')?.classList.add('hidden')

    try {
      if (_pollTimer) {
        clearInterval(_pollTimer)
        _pollTimer = null
      }
      const { job_id } = await api.quickrun.start(body)
      _jobId      = job_id
      _isRunning = true
      await poll(refreshKfaSelect)
      if (_isRunning) {
        _pollTimer  = setInterval(() => poll(refreshKfaSelect), 1500)
      }
    } catch (err) {
      _setRunButtonBusy(false)
      showToast(err.message, 'error')
    } finally {
      _isStarting = false
    }
  })

  // "Ver resultados" button
  document.getElementById('btn-qr-results')?.addEventListener('click', async () => {
    try { await refreshKfaSelect() } catch (_) {}
    showView('results')
  })
}
