/**
 * views/home.js — Home page, project open/create, boot check.
 */

import { api }       from '../api.js'
import { showView, showToast, Modal } from '../ui.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _hasOpenProject() {
  return document.getElementById('project-label')?.textContent?.trim() !== 'Nenhum projeto'
}

async function _confirmCloseAnalysis(action = 'abrir outro projeto') {
  return Modal.show({
    titleText: 'Análise já aberta',
    bodyHTML: `<p>Você tem uma análise aberta. Deseja fechá-la para <strong>${action}</strong>?</p>`,
    confirmLabel: 'Fechar e continuar',
    cancelLabel: 'Cancelar',
  })
}

function _showOpenOverlay(title, subtitle) {
  const overlay    = document.getElementById('open-overlay')
  const titleEl    = document.getElementById('open-title')
  const subtitleEl = document.getElementById('open-subtitle')
  const pctEl      = document.getElementById('open-pct')
  const msgEl      = document.getElementById('open-msg')
  const bar        = document.getElementById('open-bar')
  if (titleEl)    titleEl.textContent    = title
  if (subtitleEl) subtitleEl.textContent = subtitle
  if (pctEl)      pctEl.textContent      = ''
  if (msgEl)      msgEl.textContent      = 'Aguarde…'
  if (bar)        bar.value              = 0
  overlay.classList.remove('hidden')
}

function _hideOpenOverlay() {
  document.getElementById('open-overlay')?.classList.add('hidden')
}

// Exposed so other views can call it after project changes
export async function updateProjectLabel() {
  try {
    const { display_path } = await api.project.current()
    const label = document.getElementById('project-label')
    if (display_path) {
      const parts = display_path.replace(/\\/g, '/').split('/')
      label.textContent = parts[parts.length - 1]
      label.title = display_path
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

  if (_hasOpenProject()) {
    const ok = await _confirmCloseAnalysis('abrir outro projeto')
    if (!ok) return
  }

  let path = null
  try {
    const res = await api.utils.pickFile()
    path = res?.path ?? null
  } catch (_) {
    path = await new Promise(resolve => {
      const fi = document.createElement('input')
      fi.type = 'file'; fi.accept = '.ttwa,.ttwt'
      fi.style.cssText = 'position:fixed;opacity:0;width:1px;height:1px;top:0;left:0'
      document.body.appendChild(fi)
      const cleanup = () => { try { document.body.removeChild(fi) } catch (_) {} }
      fi.addEventListener('change', () => { cleanup(); resolve(fi.files?.[0]?.path || fi.files?.[0]?.name || null) })
      fi.addEventListener('cancel', () => { cleanup(); resolve(null) })
      fi.click()
    })
  }
  if (!path) return

  // Mostra overlay imediatamente — antes mesmo do parse/decompression
  _showOpenOverlay('Abrindo arquivo…', 'Carregando projeto…')

  try {
    const res = await api.project.open({ path })

    if (res?.status === 'decompressing') {
      // .ttwt — atualiza overlay para progresso de descompressão
      const titleEl    = document.getElementById('open-title')
      const subtitleEl = document.getElementById('open-subtitle')
      const pctEl      = document.getElementById('open-pct')
      const bar        = document.getElementById('open-bar')
      if (titleEl)    titleEl.textContent    = 'Abrindo arquivo .ttwt'
      if (subtitleEl) subtitleEl.textContent = 'Descomprimindo para memória de trabalho…'
      if (pctEl)      pctEl.textContent      = '0%'
      if (bar)        bar.value              = 0
      const job = await _showOpenProgressModal(res.job_id)
      if (!job) return
      showToast('Arquivo .ttwt aberto.')
      await _afterProjectOpened(loadCorpusList, refreshCorpusSelects, refreshKfaSelect)
      if (job.result?.schema_version && job.result.schema_version < '0.2') {
        _showUpgradeModal()
      }
    } else {
      _hideOpenOverlay()
      showToast('Projeto aberto.')
      await _afterProjectOpened(loadCorpusList, refreshCorpusSelects, refreshKfaSelect)
      if (res?.schema_version && res.schema_version < '0.2') {
        _showUpgradeModal()
      }
    }
  } catch (err) {
    _hideOpenOverlay()
    showToast(err.message, 'error')
  }
}

export async function startNewAnalysis() {
  if (_hasOpenProject()) {
    const ok = await _confirmCloseAnalysis('iniciar uma nova análise')
    if (!ok) return
  }
  showView('quickrun')
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
  document.getElementById('btn-home-newanalysis')?.addEventListener('click', () => startNewAnalysis())

  // Save as
  document.getElementById('mnu-saveas')?.addEventListener('click', () => _showSaveAsModal())

  // macOS runtime: when the window regains focus, check if macOS sent an
  // 'odoc' Apple Event while the app was in the background (user opened a
  // second file from Finder).
  window.addEventListener('focus', async () => {
    try {
      const { path } = await api.project.pendingOpen()
      if (path) await _handlePendingOpen(path)
    } catch (_) {}
  })
}

// ---------------------------------------------------------------------------
// Boot: check for an already-open project (--open flag or previous session)
// ---------------------------------------------------------------------------

export async function checkInitialProject({ loadCorpusList, refreshCorpusSelects, refreshKfaSelect }) {
  await updateProjectLabel()
  try {
    // Check for a file queued by Apple Event (macOS file association) or --open .ttwt
    const { path: pending } = await api.project.pendingOpen()
    if (pending) {
      _sharedCallbacks = _sharedCallbacks || { loadCorpusList, refreshCorpusSelects, refreshKfaSelect }
      await _handlePendingOpen(pending)
      return
    }
    // Normal startup: check if a project is already open
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
// Open-progress modal (.ttwt decompression)
// ---------------------------------------------------------------------------

/** Handle a file path that arrived via Apple Event (pending-open). */
async function _handlePendingOpen(path) {
  if (!_sharedCallbacks) return
  const { loadCorpusList, refreshCorpusSelects, refreshKfaSelect } = _sharedCallbacks

  _showOpenOverlay('Abrindo arquivo…', 'Carregando projeto…')

  try {
    const res = await api.project.open({ path })
    if (res?.status === 'decompressing') {
      const titleEl    = document.getElementById('open-title')
      const subtitleEl = document.getElementById('open-subtitle')
      const pctEl      = document.getElementById('open-pct')
      const bar        = document.getElementById('open-bar')
      if (titleEl)    titleEl.textContent    = 'Abrindo arquivo .ttwt'
      if (subtitleEl) subtitleEl.textContent = 'Descomprimindo para memória de trabalho…'
      if (pctEl)      pctEl.textContent      = '0%'
      if (bar)        bar.value              = 0
      const job = await _showOpenProgressModal(res.job_id)
      if (!job) return
      showToast('Arquivo .ttwt aberto.')
      await _afterProjectOpened(loadCorpusList, refreshCorpusSelects, refreshKfaSelect)
      if (job.result?.schema_version && job.result.schema_version < '0.2') _showUpgradeModal()
    } else {
      _hideOpenOverlay()
      showToast('Projeto aberto.')
      await _afterProjectOpened(loadCorpusList, refreshCorpusSelects, refreshKfaSelect)
      if (res?.schema_version && res.schema_version < '0.2') _showUpgradeModal()
    }
  } catch (err) {
    _hideOpenOverlay()
    showToast(err.message, 'error')
  }
}

/** Returns the completed job object or null if cancelled/errored. */
async function _showOpenProgressModal(jobId) {
  const overlay = document.getElementById('open-overlay')
  const bar     = document.getElementById('open-bar')
  const pctEl   = document.getElementById('open-pct')
  const msgEl   = document.getElementById('open-msg')

  bar.value = 0; pctEl.textContent = '0%'; msgEl.textContent = 'Iniciando…'
  overlay.classList.remove('hidden')

  return new Promise(resolve => {
    const timer = setInterval(async () => {
      try {
        const job = await api.project.openStatus(jobId)
        const pct = job.total > 0 ? Math.round((job.done / job.total) * 100) : 0
        bar.value = pct; pctEl.textContent = pct + '%'
        msgEl.textContent = job.message || ''

        if (job.status === 'done') {
          clearInterval(timer)
          bar.value = 100; pctEl.textContent = '100%'
          overlay.classList.add('hidden')
          resolve(job)
        } else if (job.status === 'error') {
          clearInterval(timer)
          overlay.classList.add('hidden')
          showToast(job.error || 'Erro ao abrir .ttwt.', 'error')
          resolve(null)
        }
      } catch (_) {}
    }, 500)
  })
}

// ---------------------------------------------------------------------------
// Save-as modal
// ---------------------------------------------------------------------------

function _showSaveAsModal() {
  const overlay   = document.getElementById('saveas-overlay')
  const form      = document.getElementById('saveas-form')
  const pathInput = document.getElementById('saveas-path')
  const pickBtn   = document.getElementById('saveas-pick-btn')
  const progressW = document.getElementById('saveas-progress-wrap')
  const bar       = document.getElementById('saveas-bar')
  const pctEl     = document.getElementById('saveas-pct')
  const msgEl     = document.getElementById('saveas-msg')
  const resultEl  = document.getElementById('saveas-result')
  const btns      = document.getElementById('saveas-btns')
  const cancelBtn = document.getElementById('saveas-cancel-btn')
  const okBtn     = document.getElementById('saveas-ok-btn')

  // Reset
  form.classList.remove('hidden')
  progressW.classList.add('hidden')
  resultEl.classList.add('hidden')
  resultEl.textContent = ''
  btns.classList.remove('hidden')
  cancelBtn.textContent = 'Cancelar'
  okBtn.classList.remove('hidden')
  bar.value = 0; pctEl.textContent = '0%'; msgEl.textContent = 'Iniciando…'
  overlay.classList.remove('hidden')

  // Pre-fill extension based on selected format
  const _syncExt = () => {
    const fmt = document.querySelector('input[name="saveas-fmt"]:checked')?.value || 'ttwt'
    const cur = pathInput.value.trim()
    if (!cur) return
    const base = cur.replace(/\.(ttwt|ttwa)$/i, '')
    pathInput.value = base + '.' + fmt
  }
  document.querySelectorAll('input[name="saveas-fmt"]').forEach(r => r.addEventListener('change', _syncExt))

  pickBtn.onclick = async () => {
    try {
      const res = await api.utils.pickFolder()
      if (res?.path) pathInput.value = res.path.replace(/\/$/,'') + '/'
    } catch (_) {}
  }

  let _pollTimer = null
  const _close = () => { overlay.classList.add('hidden'); if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null } }
  cancelBtn.onclick = _close

  okBtn.onclick = async () => {
    const path = pathInput.value.trim()
    if (!path) { showToast('Informe o caminho de saída.', 'error'); return }
    const fmt = document.querySelector('input[name="saveas-fmt"]:checked')?.value || 'ttwt'
    // Ensure correct extension
    const outPath = path.replace(/\.(ttwt|ttwa)$/i, '') + '.' + fmt

    form.classList.add('hidden')
    btns.classList.add('hidden')
    progressW.classList.remove('hidden')
    msgEl.textContent = 'Iniciando…'
    bar.value = 0; pctEl.textContent = '0%'

    let jobId
    try {
      const res = await api.project.saveAs({ path: outPath, format: fmt })
      jobId = res.job_id
    } catch (err) {
      showToast(err.message, 'error'); _close(); return
    }

    _pollTimer = setInterval(async () => {
      try {
        const job = await api.project.saveAsStatus(jobId)
        const pct = job.total > 0 ? Math.round((job.done / job.total) * 100) : 0
        bar.value = pct; pctEl.textContent = pct + '%'
        msgEl.textContent = job.message || ''

        if (job.status === 'done') {
          clearInterval(_pollTimer); _pollTimer = null
          bar.value = 100; pctEl.textContent = '100%'
          progressW.classList.add('hidden')
          resultEl.classList.remove('hidden')
          const sz = job.result?.size ? (job.result.size / 1024 / 1024).toFixed(1) + ' MB' : ''
          const p  = job.result?.path || outPath
          resultEl.innerHTML = `<p class="text-success font-medium">Salvo com sucesso!</p><p class="text-xs text-base-content/60 mt-1 break-all">${p}${sz ? ' — ' + sz : ''}</p>`
          btns.classList.remove('hidden')
          cancelBtn.textContent = 'Fechar'
          okBtn.classList.add('hidden')
        } else if (job.status === 'error') {
          clearInterval(_pollTimer); _pollTimer = null
          showToast(job.error || 'Erro ao salvar.', 'error'); _close()
        }
      } catch (_) {}
    }, 400)
  }
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
