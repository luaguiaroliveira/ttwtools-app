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
    await api.project.open({ path })
    showToast('Projeto aberto.')
    await _afterProjectOpened(loadCorpusList, refreshCorpusSelects, refreshKfaSelect)
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
