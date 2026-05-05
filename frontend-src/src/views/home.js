/**
 * views/home.js — Home page, project open/create, boot check.
 */

import { api }       from '../api.js'
import { showView, showToast, Modal } from '../ui.js'

// Exposed so other views can call it after project changes
export async function updateProjectLabel() {
  try {
    const { path } = await api.project.current()
    const label = document.getElementById('project-label')
    if (path) {
      const parts = path.replace(/\\/g, '/').split('/')
      label.textContent = parts[parts.length - 1]
      label.title = path
    } else {
      label.textContent = 'Nenhum projeto'
      label.title = ''
    }
  } catch (_) {}
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

async function _afterProjectOpened(loadCorpusList, refreshCorpusSelects, refreshKfaSelect) {
  await updateProjectLabel()
  await loadCorpusList()
  await refreshCorpusSelects()
  await refreshKfaSelect()
  try {
    const { kfa_results } = await api.analysis.listKfa()
    if (kfa_results && kfa_results.length > 0) {
      showView('results')
      return
    }
  } catch (_) {}
  showView('corpus')
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Public standalone functions (usable from menu bar)
// ---------------------------------------------------------------------------

let _sharedCallbacks = null   // set by initHome

export async function openProject() {
  if (!_sharedCallbacks) return
  const { loadCorpusList, refreshCorpusSelects, refreshKfaSelect } = _sharedCallbacks
  let path = null
  try {
    const res = await api.utils.pickFile()
    path = res?.path ?? null
  } catch (_) {
    path = await new Promise(resolve => {
      const fi = document.createElement('input')
      fi.type = 'file'; fi.accept = '.ttwa'
      fi.style.cssText = 'position:fixed;opacity:0;width:1px;height:1px;top:0;left:0'
      document.body.appendChild(fi)
      const cleanup = () => { try { document.body.removeChild(fi) } catch (_) {} }
      fi.addEventListener('change', () => { cleanup(); resolve(fi.files?.[0]?.path || fi.files?.[0]?.name || null) })
      fi.addEventListener('cancel', () => { cleanup(); resolve(null) })
      fi.click()
    })
  }
  if (!path) return
  try {
    const res = await api.project.open({ path })
    showToast('Projeto aberto.')
    await _afterProjectOpened(loadCorpusList, refreshCorpusSelects, refreshKfaSelect)
    // Offer v0.2 upgrade if file is v0.1
    if (res?.schema_version && res.schema_version < '0.2') {
      _showUpgradeModal()
    }
  } catch (err) {
    showToast(err.message, 'error')
  }
}

export async function newProject() {
  if (!_sharedCallbacks) return
  const { loadCorpusList, refreshCorpusSelects, refreshKfaSelect } = _sharedCallbacks
  const confirmed = await Modal.show({
    titleText: 'Criar novo projeto',
    bodyHTML: `
      <label>Caminho do arquivo <code>.ttwa</code>
        <input type="text" id="modal-new-path" placeholder="/caminho/meu_projeto.ttwa" />
      </label>
      <label>Nome do projeto
        <input type="text" id="modal-new-name" placeholder="Meu Projeto" />
      </label>`,
    confirmLabel: 'Criar',
  })
  if (!confirmed) return
  const path = document.getElementById('modal-new-path')?.value?.trim()
  const name = document.getElementById('modal-new-name')?.value?.trim()
  if (!path) { showToast('Informe o caminho do arquivo.', 'error'); return }
  try {
    await api.project.create({ path, name, overwrite: false })
    showToast(`Projeto '${name || path}' criado.`)
    await _afterProjectOpened(loadCorpusList, refreshCorpusSelects, refreshKfaSelect)
  } catch (err) {
    showToast(err.message, 'error')
  }
}

export function initHome({ loadCorpusList, refreshCorpusSelects, refreshKfaSelect }) {
  _sharedCallbacks = { loadCorpusList, refreshCorpusSelects, refreshKfaSelect }

  // Nav buttons
  document.getElementById('btn-home-open')?.addEventListener('click',    () => openProject())
  document.getElementById('btn-new-project')?.addEventListener('click',  () => newProject())
  document.getElementById('btn-open-project')?.addEventListener('click', () => openProject())
  document.getElementById('btn-home-newanalysis')?.addEventListener('click', () => showView('quickrun'))
}

// ---------------------------------------------------------------------------
// Boot: check for an already-open project (--open flag or previous session)
// ---------------------------------------------------------------------------

export async function checkInitialProject({ loadCorpusList, refreshCorpusSelects, refreshKfaSelect }) {
  await updateProjectLabel()
  try {
    const { path } = await api.project.current()
    if (path) {
      await loadCorpusList()
      await refreshCorpusSelects()
      await refreshKfaSelect()
      showView('corpus')
    }
  } catch (_) {}
}

// ---------------------------------------------------------------------------
// Upgrade modal (v0.1 → v0.2)
// ---------------------------------------------------------------------------

function _showUpgradeModal() {
  const overlay  = document.getElementById('upgrade-overlay')
  const startBtn = document.getElementById('upgrade-start-btn')
  const cancelBtn= document.getElementById('upgrade-cancel-btn')
  const compressCb = document.getElementById('upgrade-compress-cb')
  const progressWrap = document.getElementById('upgrade-progress-wrap')
  const btns     = document.getElementById('upgrade-btns')
  const bar      = document.getElementById('upgrade-bar')
  const pctEl    = document.getElementById('upgrade-pct')
  const msgEl    = document.getElementById('upgrade-msg')
  const resultEl = document.getElementById('upgrade-result')
  const compressRow = document.getElementById('upgrade-compress-row')

  // Reset state
  progressWrap.classList.add('hidden')
  resultEl.classList.add('hidden')
  resultEl.textContent = ''
  compressRow.classList.remove('hidden')
  btns.classList.remove('hidden')
  bar.value = 0
  pctEl.textContent = '0%'
  msgEl.textContent = 'Iniciando…'
  overlay.classList.remove('hidden')

  let _pollTimer = null

  function _close() {
    overlay.classList.add('hidden')
    if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null }
  }

  cancelBtn.onclick = _close

  startBtn.onclick = async () => {
    const compress = compressCb.checked
    compressRow.classList.add('hidden')
    btns.classList.add('hidden')
    progressWrap.classList.remove('hidden')
    msgEl.textContent = 'Iniciando…'
    bar.value = 0; pctEl.textContent = '0%'

    let jobId
    try {
      const res = await api.project.upgrade(compress)
      jobId = res.job_id
    } catch (err) {
      showToast(err.message, 'error')
      _close()
      return
    }

    _pollTimer = setInterval(async () => {
      try {
        const job = await api.project.upgradeStatus(jobId)
        const pct = job.total > 0 ? Math.round((job.done / job.total) * 100) : 0
        bar.value = pct; pctEl.textContent = pct + '%'
        msgEl.textContent = job.message || ''

        if (job.status === 'done') {
          clearInterval(_pollTimer); _pollTimer = null
          bar.value = 100; pctEl.textContent = '100%'
          progressWrap.classList.add('hidden')
          resultEl.classList.remove('hidden')
          const r = job.result || {}
          const before = r.size_before ? (r.size_before / 1024 / 1024).toFixed(0) + ' MB' : '—'
          const after  = r.size_after  ? (r.size_after  / 1024 / 1024).toFixed(0) + ' MB' : '—'
          const dedup  = r.rows_deduped  || 0
          const conv   = r.rows_converted || 0
          resultEl.innerHTML = `
            <p class="text-success font-medium mb-1">Migração concluída!</p>
            <ul class="text-xs text-base-content/70 list-disc pl-4 space-y-0.5">
              <li>Arquivos comprimidos: <strong>${conv}</strong></li>
              <li>Linhas de tagger unificadas: <strong>${dedup}</strong></li>
              <li>Tamanho: <strong>${before}</strong> → <strong>${after}</strong></li>
            </ul>`
          // Show close button
          btns.classList.remove('hidden')
          cancelBtn.textContent = 'Fechar'
          startBtn.classList.add('hidden')
        } else if (job.status === 'error') {
          clearInterval(_pollTimer); _pollTimer = null
          showToast(job.error || 'Erro na migração.', 'error')
          _close()
        }
      } catch (_) {}
    }, 500)
  }
}
