/**
 * views/export.js — Export project contents to disk.
 */

import { api }       from '../api.js'
import { showToast } from '../ui.js'

export function initExport() {
  // Browse button for destination folder
  document.getElementById('btn-export-browse')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-export-browse')
    btn.disabled = true
    const prev = btn.textContent
    btn.textContent = '…'
    try {
      const res = await api.utils.pickFolder()
      if (res?.path) {
        document.getElementById('export-dest').value = res.path
      }
    } catch (_) {}
    btn.textContent = prev
    btn.disabled = false
  })

  // Export button
  document.getElementById('btn-export-run')?.addEventListener('click', async () => {
    const statusEl = document.getElementById('export-status')
    statusEl.className = 'status-box running'
    statusEl.textContent = 'Exportando…'
    statusEl.classList.remove('hidden')

    const body = {
      export_corpora: document.getElementById('export-corpora')?.checked ?? true,
      export_tagged:  document.getElementById('export-tagged')?.checked ?? true,
      export_tables:  document.getElementById('export-tables')?.checked ?? true,
      export_kfa:     document.getElementById('export-kfa')?.checked ?? true,
    }

    const dest = document.getElementById('export-dest')?.value?.trim()
    if (dest) body.dest_folder = dest

    try {
      const res = await api.project.export(body)
      statusEl.className = 'status-box done'
      statusEl.textContent =
        `Exportação concluída em:\n${res.dest}\n\n` +
        `• ${res.corpora} arquivo(s) de corpus\n` +
        `• ${res.tagged} arquivo(s) tagueado(s)\n` +
        `• ${res.tables} tabela(s) de features\n` +
        `• ${res.kfa} resultado(s) KFA`
      showToast('Exportação concluída!')
    } catch (err) {
      statusEl.className = 'status-box error'
      statusEl.textContent = `Erro: ${err.message}`
      showToast(err.message, 'error')
    }
  })

  // Update project info when view becomes visible
  const observer = new MutationObserver(() => {
    const el = document.getElementById('view-export')
    if (el?.classList.contains('active')) refreshExportInfo()
  })
  const viewEl = document.getElementById('view-export')
  if (viewEl) observer.observe(viewEl, { attributes: true, attributeFilter: ['class'] })
}

async function refreshExportInfo() {
  const infoEl = document.getElementById('export-project-info')
  if (!infoEl) return
  try {
    const { path } = await api.project.current()
    if (!path) {
      infoEl.textContent = 'Nenhum projeto aberto.'
      return
    }
    const summary = await api.project.summary()
    const corpora = Object.keys(summary.corpora || {})
    const nKfa = (summary.kfa_results || []).length

    const lines = [
      `Projeto: ${path.split('/').pop()}`,
      `Caminho: ${path}`,
      `Corpora: ${corpora.join(', ') || 'nenhum'}`,
    ]
    corpora.forEach(c => {
      const info = summary.corpora[c]
      lines.push(`  • ${c}: ${info.files} texto(s), ${info.tagged} tagueado(s), ${info.feature_tables.length} tabela(s)`)
    })
    lines.push(`KFA: ${nKfa} resultado(s)`)
    infoEl.textContent = lines.join('\n')
  } catch (_) {
    infoEl.textContent = 'Não foi possível carregar informações do projeto.'
  }
}
