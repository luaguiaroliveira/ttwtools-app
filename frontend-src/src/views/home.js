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

export function initHome({ loadCorpusList, refreshCorpusSelects, refreshKfaSelect }) {
  async function doNewProject() {
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

  async function doOpenProject() {
    const confirmed = await Modal.show({
      titleText: 'Abrir projeto .ttwa',
      bodyHTML: `
        <label>Arquivo <code>.ttwa</code>
          <div class="input-browse" style="margin-top:.35rem">
            <input type="text" id="modal-open-path" placeholder="/caminho/meu_projeto.ttwa" />
            <button type="button" id="btn-modal-browse" class="btn-browse" title="Procurar arquivo">📁</button>
          </div>
        </label>`,
      confirmLabel: 'Abrir',
      onMount: () => {
        document.getElementById('btn-modal-browse')?.addEventListener('click', async () => {
          const btn = document.getElementById('btn-modal-browse')
          btn.disabled = true; btn.textContent = '…'
          try {
            const res = await api.utils.pickFile()
            if (res?.path) document.getElementById('modal-open-path').value = res.path
          } catch (_) {}
          btn.textContent = '📁'; btn.disabled = false
        })
      },
    })
    if (!confirmed) return

    const path = document.getElementById('modal-open-path')?.value?.trim()
    if (!path) { showToast('Informe o caminho.', 'error'); return }

    try {
      await api.project.open({ path })
      showToast('Projeto aberto.')
      await _afterProjectOpened(loadCorpusList, refreshCorpusSelects, refreshKfaSelect)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  // Nav buttons
  document.getElementById('btn-home-open')?.addEventListener('click',    () => doOpenProject())
  document.getElementById('btn-new-project')?.addEventListener('click',  () => doNewProject())
  document.getElementById('btn-open-project')?.addEventListener('click', () => doOpenProject())
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
