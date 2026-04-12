/**
 * ui.js — Utilitários de interface (navegação, toast, modal).
 */

// ---------------------------------------------------------------------------
// Navegação entre views
// ---------------------------------------------------------------------------

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const view = document.getElementById(`view-${name}`);
  if (view) view.classList.add('active');
  const btn = document.querySelector(`.nav-btn[data-view="${name}"]`);
  if (btn) btn.classList.add('active');
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

let _toastTimer = null;

function showToast(msg, type = 'success', duration = 3500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = type;
  el.classList.remove('hidden');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add('hidden'), duration);
}

// ---------------------------------------------------------------------------
// Modal genérico
// ---------------------------------------------------------------------------

const Modal = (() => {
  const overlay = document.getElementById('modal-overlay');
  const title   = document.getElementById('modal-title');
  const body    = document.getElementById('modal-body');
  const btnOk   = document.getElementById('modal-confirm');
  const btnCan  = document.getElementById('modal-cancel');

  let _resolve = null;

  function show({ titleText, bodyHTML, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar' }) {
    title.textContent = titleText;
    body.innerHTML    = bodyHTML;
    btnOk.textContent  = confirmLabel;
    btnCan.textContent = cancelLabel;
    overlay.classList.remove('hidden');
    return new Promise(resolve => { _resolve = resolve; });
  }

  function hide(result) {
    overlay.classList.add('hidden');
    body.innerHTML = '';
    if (_resolve) { _resolve(result); _resolve = null; }
  }

  btnOk.addEventListener('click',  () => hide(true));
  btnCan.addEventListener('click', () => hide(false));
  overlay.addEventListener('click', e => { if (e.target === overlay) hide(false); });

  return { show, hide };
})();

// ---------------------------------------------------------------------------
// Helper: preenche um <select> com lista de strings
// ---------------------------------------------------------------------------

function populateSelect(selectEl, items, placeholder = '-- selecione --') {
  selectEl.innerHTML = `<option value="">${placeholder}</option>`;
  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    selectEl.appendChild(opt);
  });
}
