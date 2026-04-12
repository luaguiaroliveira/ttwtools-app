/**
 * ui.js — Navigation, toast, modal.
 */

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
  document.getElementById(`view-${name}`)?.classList.add('active')
  document.querySelector(`.nav-btn[data-view="${name}"]`)?.classList.add('active')
}

export function setupNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
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
  const title   = document.getElementById('modal-title')
  const body    = document.getElementById('modal-body')
  const btnOk   = document.getElementById('modal-confirm')
  const btnCan  = document.getElementById('modal-cancel')

  let _resolve = null

  function show({ titleText, bodyHTML, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onMount = null }) {
    title.textContent  = titleText
    body.innerHTML     = bodyHTML
    btnOk.textContent  = confirmLabel
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

  btnOk.addEventListener('click',  () => hide(true))
  btnCan.addEventListener('click', () => hide(false))
  overlay.addEventListener('click', e => { if (e.target === overlay) hide(false) })

  return { show, hide }
})()

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

export function populateSelect(selectEl, items, placeholder = '-- selecione --') {
  selectEl.innerHTML = ''
  // sl-select uses a placeholder attribute; no blank first option needed
  if (selectEl.tagName.toLowerCase() === 'sl-select') {
    selectEl.placeholder = placeholder
    items.forEach(item => {
      const opt = document.createElement('sl-option')
      opt.value = item
      opt.textContent = item
      selectEl.appendChild(opt)
    })
  } else {
    selectEl.innerHTML = `<option value="">${placeholder}</option>`
    items.forEach(item => {
      const opt = document.createElement('option')
      opt.value = item
      opt.textContent = item
      selectEl.appendChild(opt)
    })
  }
}
