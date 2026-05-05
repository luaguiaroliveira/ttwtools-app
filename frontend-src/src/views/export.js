/**
 * views/export.js — Export project contents with tree-based item selection.
 */

import { api }       from '../api.js'
import { showToast } from '../ui.js'

// Category labels for display
const CAT_LABELS = {
  corpora: '📄 Textos originais',
  tagged:  '🏷️ Arquivos tagueados',
  tables:  '📊 Feature tables (CSV)',
  kfa:     '📈 Resultados KFA',
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the checkbox tree from manifest items
// ─────────────────────────────────────────────────────────────────────────────

function buildTree(items) {
  // Group: category → corpus → [items]
  // For tables/kfa there's no sub-corpus grouping, we group flat
  const tree = {}
  items.forEach(it => {
    const cat = it.category
    if (!tree[cat]) tree[cat] = {}
    const group = it.corpus || it.corpus1 || '_root'
    if (!tree[cat][group]) tree[cat][group] = []
    tree[cat][group].push(it)
  })
  return tree
}

function renderTree(container, items, idPrefix = 'exp') {
  container.innerHTML = ''
  if (!items.length) {
    container.innerHTML = '<div style="color:var(--text-muted);padding:.5rem">Nenhum item disponível.</div>'
    return
  }

  const tree = buildTree(items)

  // Select-all root
  const rootId = `${idPrefix}-root`
  const rootLabel = document.createElement('label')
  rootLabel.className = 'exp-tree-root'
  rootLabel.innerHTML = `<input type="checkbox" id="${rootId}" checked> <strong>Selecionar tudo</strong>`
  container.appendChild(rootLabel)

  const rootCb = rootLabel.querySelector('input')
  rootCb.addEventListener('change', () => {
    container.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.checked = rootCb.checked
      cb.indeterminate = false
    })
  })

  // Categories
  const catOrder = ['corpora', 'tagged', 'tables', 'kfa']
  catOrder.forEach(cat => {
    if (!tree[cat]) return
    const groups = tree[cat]

    const catDiv = document.createElement('div')
    catDiv.className = 'exp-tree-cat'

    const catId = `${idPrefix}-cat-${cat}`
    const catLabel = document.createElement('label')
    catLabel.className = 'exp-tree-cat-label'
    catLabel.innerHTML = `<span class="exp-toggle" data-target="${catId}-body">▶</span>
      <input type="checkbox" data-cat="${cat}" id="${catId}" checked>
      ${CAT_LABELS[cat] || cat}`
    catDiv.appendChild(catLabel)

    const catBody = document.createElement('div')
    catBody.id = `${catId}-body`
    catBody.className = 'exp-tree-body'

    const catCb = catLabel.querySelector('input')

    // Track all leaf checkboxes in this category
    const catLeaves = []

    Object.keys(groups).sort().forEach(group => {
      const groupItems = groups[group]

      if (group === '_root' || Object.keys(groups).length === 1) {
        // Flat list (no sub-group)
        groupItems.forEach(it => {
          const leaf = _leafCheckbox(it)
          catBody.appendChild(leaf)
          catLeaves.push(leaf.querySelector('input'))
        })
      } else {
        // Sub-group (corpus name)
        const grpDiv = document.createElement('div')
        grpDiv.className = 'exp-tree-group'

        const grpId = `${idPrefix}-grp-${cat}-${group.replace(/\W/g, '_')}`
        const grpLabel = document.createElement('label')
        grpLabel.className = 'exp-tree-grp-label'
        grpLabel.innerHTML = `<span class="exp-toggle" data-target="${grpId}-body">▶</span>
          <input type="checkbox" data-group="${group}" id="${grpId}" checked>
          ${group} <span class="exp-count">(${groupItems.length})</span>`
        grpDiv.appendChild(grpLabel)

        const grpBody = document.createElement('div')
        grpBody.id = `${grpId}-body`
        grpBody.className = 'exp-tree-body exp-tree-body--collapsed'

        const grpCb = grpLabel.querySelector('input')
        const grpLeaves = []

        groupItems.forEach(it => {
          const leaf = _leafCheckbox(it)
          grpBody.appendChild(leaf)
          const lcb = leaf.querySelector('input')
          grpLeaves.push(lcb)
          catLeaves.push(lcb)
        })

        // Group checkbox cascades
        grpCb.addEventListener('change', () => {
          grpLeaves.forEach(l => { l.checked = grpCb.checked })
          _updateParent(catCb, catLeaves)
          _updateParent(rootCb, _allLeaves(container))
        })
        grpLeaves.forEach(l => l.addEventListener('change', () => {
          _updateParent(grpCb, grpLeaves)
          _updateParent(catCb, catLeaves)
          _updateParent(rootCb, _allLeaves(container))
        }))

        grpDiv.appendChild(grpBody)
        catBody.appendChild(grpDiv)
      }
    })

    // Category checkbox cascades
    catCb.addEventListener('change', () => {
      catLeaves.forEach(l => { l.checked = catCb.checked })
      // Also update group-level checkboxes
      catDiv.querySelectorAll('.exp-tree-grp-label input').forEach(gcb => {
        gcb.checked = catCb.checked
        gcb.indeterminate = false
      })
      _updateParent(rootCb, _allLeaves(container))
    })
    catLeaves.forEach(l => l.addEventListener('change', () => {
      _updateParent(catCb, catLeaves)
      _updateParent(rootCb, _allLeaves(container))
    }))

    catDiv.appendChild(catBody)
    container.appendChild(catDiv)
  })

  // Toggle expand/collapse
  container.addEventListener('click', e => {
    const toggle = e.target.closest('.exp-toggle')
    if (!toggle) return
    e.preventDefault()
    const targetId = toggle.dataset.target
    const body = document.getElementById(targetId)
    if (!body) return
    body.classList.toggle('exp-tree-body--collapsed')
    toggle.textContent = body.classList.contains('exp-tree-body--collapsed') ? '▶' : '▼'
  })
}

/** Public helper: render tree into any container (used by quickrun modal) */
export function renderTreeInto(container, items) {
  renderTree(container, items, 'qrx')
}

function _leafCheckbox(item) {
  const label = document.createElement('label')
  label.className = 'exp-tree-leaf'
  label.innerHTML = `<input type="checkbox" data-path="${item.path}" checked>
    <span class="exp-leaf-name">${item.filename}</span>`
  return label
}

function _allLeaves(container) {
  return Array.from(container.querySelectorAll('input[data-path]'))
}

function _updateParent(parentCb, children) {
  const total = children.length
  const checked = children.filter(c => c.checked).length
  parentCb.checked = checked === total
  parentCb.indeterminate = checked > 0 && checked < total
}

/** Collect selected item paths from the tree */
export function getSelectedPaths(container) {
  return Array.from(container.querySelectorAll('input[data-path]:checked'))
    .map(cb => cb.dataset.path)
}


// ─────────────────────────────────────────────────────────────────────────────
// Refresh + Export logic for the Export page
// ─────────────────────────────────────────────────────────────────────────────

let _cachedItems = []

export async function refreshExportTree() {
  const treeEl = document.getElementById('export-tree')
  if (!treeEl) return
  try {
    const { items } = await api.project.manifest()
    _cachedItems = items
    renderTree(treeEl, items)
  } catch (_) {
    treeEl.innerHTML = '<div style="color:var(--text-muted);padding:.5rem">Abra um projeto para ver os itens exportáveis.</div>'
  }
}

export function initExport() {
  // Browse button for destination folder
  document.getElementById('btn-export-browse')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-export-browse')
    btn.disabled = true
    const prev = btn.textContent
    btn.textContent = '…'
    try {
      const defaultLocation = localStorage.getItem('last_export_folder') || ''
      const res = await api.utils.pickFolder({ defaultLocation })
      if (res?.path) {
        document.getElementById('export-dest').value = res.path
        localStorage.setItem('last_export_folder', res.path)
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

    const treeEl = document.getElementById('export-tree')
    const selectedPaths = getSelectedPaths(treeEl)
    const allPaths = _cachedItems.map(i => i.path)

    // If all selected, pass null (export everything); otherwise pass the list
    const body = {}
    if (selectedPaths.length < allPaths.length) {
      body.items = selectedPaths
    }

    const dest = document.getElementById('export-dest')?.value?.trim()
    if (dest) body.dest_folder = dest

    try {
      const res = await api.project.export(body)
      statusEl.className = 'status-box done'
      const total = res.corpora + res.tagged + res.tables + res.kfa
      statusEl.textContent =
        `Exportação concluída: ${total} arquivo(s)\n${res.dest}\n\n` +
        `• ${res.corpora} texto(s) original(is)\n` +
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

  // Refresh tree when view becomes visible
  const observer = new MutationObserver(() => {
    const el = document.getElementById('view-export')
    if (el?.classList.contains('active')) refreshExportTree()
  })
  const viewEl = document.getElementById('view-export')
  if (viewEl) observer.observe(viewEl, { attributes: true, attributeFilter: ['class'] })
}
