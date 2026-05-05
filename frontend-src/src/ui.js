/**
 * ui.js — Navigation, toast, modal.
 */

import { createIcons, icons } from 'lucide'

// Render all lucide icons in the document
export function renderLucideIcons() {
  createIcons({ icons })
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

// View order used to determine slide direction
const VIEW_ORDER = ['home', 'quickrun', 'corpus', 'tagging', 'analysis', 'results', 'export', 'feature-detail', 'text-viewer']

export function showView(name) {
  const current = document.querySelector('.view.active')
  const next = document.getElementById(`view-${name}`)
  if (!next || next === current) return

  const curIdx = current ? VIEW_ORDER.indexOf(current.id.replace('view-', '')) : -1
  const nextIdx = VIEW_ORDER.indexOf(name)
  const fromLeft = nextIdx < curIdx

  current?.classList.remove('active')
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))

  next.classList.remove('from-left')
  next.classList.add('active')
  if (fromLeft) next.classList.add('from-left')

  // Highlight all nav buttons (sidebar, menu actions, menu triggers) matching the active view
  document.querySelectorAll('.nav-btn[data-view]').forEach(b => {
    b.classList.toggle('active', b.dataset.view === name)
  })
}

export function setupNav() {
  // nav-btn elements with data-view just call showView
  document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.view))
  })
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

let _toastTimer = null

export function showToast(msg, type = 'success', duration = 3500) {
  const el = document.getElementById('toast')
  el.textContent = msg
  el.className = type
  el.classList.remove('hidden')
  if (_toastTimer) clearTimeout(_toastTimer)
  _toastTimer = setTimeout(() => el.classList.add('hidden'), duration)
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export const Modal = (() => {
  const overlay = document.getElementById('modal-overlay')
  const title = document.getElementById('modal-title')
  const body = document.getElementById('modal-body')
  const btnOk = document.getElementById('modal-confirm')
  const btnCan = document.getElementById('modal-cancel')

  let _resolve = null

  function show({ titleText, bodyHTML, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onMount = null }) {
    title.textContent = titleText
    body.innerHTML = bodyHTML
    btnOk.textContent = confirmLabel
    btnCan.textContent = cancelLabel
    overlay.classList.remove('hidden')
    if (onMount) onMount()
    return new Promise(resolve => { _resolve = resolve })
  }

  function hide(result) {
    overlay.classList.add('hidden')
    if (_resolve) { _resolve(result); _resolve = null }
    setTimeout(() => { body.innerHTML = '' }, 0)
  }

  btnOk.addEventListener('click', () => hide(true))
  btnCan.addEventListener('click', () => hide(false))
  overlay.addEventListener('click', e => { if (e.target === overlay) hide(false) })
  // Enter key confirms; Escape cancels
  document.addEventListener('keydown', e => {
    if (overlay.classList.contains('hidden')) return
    if (e.key === 'Enter' && e.target?.tagName !== 'TEXTAREA') { e.preventDefault(); hide(true) }
    if (e.key === 'Escape') { e.preventDefault(); hide(false) }
  })

  return { show, hide }
})()

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

export function populateSelect(selectEl, items, placeholder = '-- selecione --') {
  selectEl.innerHTML = `<option value="">${placeholder}</option>`
  items.forEach(item => {
    const opt = document.createElement('option')
    opt.value = item
    opt.textContent = item
    selectEl.appendChild(opt)
  })
}
