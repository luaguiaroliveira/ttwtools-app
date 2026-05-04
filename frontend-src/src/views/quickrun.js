/**
 * views/quickrun.js — 4-step workflow:
 *   Step 0: Configure corpora + taggers
 *   Step 1: Tagging progress (per-tagger bars)
 *   Step 2: KFA configuration (tag selection per tagger)
 *   Step 3: Results (auto-load on select)
 */

import { api }       from '../api.js'
import { showToast, showView } from '../ui.js'
// ── State ──────────────────────────────────────────────────────────────────
let _jobId           = null
let _pollTimer       = null
let _isStarting      = false
let _isRunning       = false
let _selectedTaggers = []
let _corpusNames     = { c1: '', c2: '' }
let _joinMethod      = 'intersection'
let _shared          = null  // shared callbacks (refreshKfaSelect, showSavedBadge, etc.)

// ── Fill colours (used as inline styles — no CSS rules touch these) ────────────
const _FILL_ORANGE = 'oklch(72% 0.17 55)'
const _FILL_GREEN  = 'oklch(62% 0.18 150)'
const _FILL_RED    = 'oklch(60% 0.22 25)'
// Once a fill is locked (100% + green/red), it is never touched again.
const _fillLocked  = new Set()

function _applyFill(el, pct, colour) {
  if (!el) return
  if (_fillLocked.has(el.id)) return   // never overwrite a finalised fill
  el.style.width      = pct + '%'
  el.style.background = colour
  if (pct >= 100) _fillLocked.add(el.id)
}

// ── Step navigation ────────────────────────────────────────────────────────
function goStep(n) {
  const steps = document.querySelectorAll('.qr-step')
  const inds  = document.querySelectorAll('#qr-stepper .step-indicator')
  const conns = document.querySelectorAll('#qr-stepper .step-connector')

  steps.forEach((el, i) => el.classList.toggle('active', i === n))
  inds.forEach((el, i) => {
    el.classList.remove('active', 'done')
    if (i < n)        el.classList.add('done')
    else if (i === n) el.classList.add('active')
  })
  conns.forEach((el, i) => {
    el.style.background = i < n ? 'hsl(var(--su))' : ''
  })
}

// ── Per-tagger progress bars ────────────────────────────────────────────────
function _taggerLabel(t) {
  const map = { biberplus:'BiberPlus', mfte:'MFTE', mfte_ext:'MFTE Estendido',
    stanza_upos:'Stanza UPOS', stanza_xpos:'Stanza XPOS',
    spacy_upos:'spaCy UPOS', spacy_ptb:'spaCy PTB' }
  return map[t] || t
}

function initTaggerBars(taggers) {
  const wrap = document.getElementById('qr-tagger-bars')
  if (!wrap) return
  wrap.innerHTML = ''
  _fillLocked.clear()
  taggers.forEach(t => {
    const el = document.createElement('div')
    el.className = 'tagger-bar'
    el.id = `tbar-${t}`
    el.innerHTML = `
      <div class="tagger-bar-label">
        <span>${_taggerLabel(t)}</span>
        <span class="tagger-bar-status" id="tbar-status-${t}">Aguardando…</span>
      </div>
      <div class="tagger-bar-row">
        <span class="tagger-bar-corpus-label">C1</span>
        <div class="tagger-bar-track"><div class="tagger-bar-fill" id="tbar-fill-c1-${t}"></div></div>
      </div>
      <div class="tagger-bar-row">
        <span class="tagger-bar-corpus-label">C2</span>
        <div class="tagger-bar-track"><div class="tagger-bar-fill" id="tbar-fill-c2-${t}"></div></div>
      </div>`
    wrap.appendChild(el)
    // Initialise fills via inline style so the base CSS rule is irrelevant
    _applyFill(document.getElementById(`tbar-fill-c1-${t}`), 0, _FILL_ORANGE)
    _applyFill(document.getElementById(`tbar-fill-c2-${t}`), 0, _FILL_ORANGE)
  })
}

function updateTaggerBar(tagger, status, msg, pct1, pct2, phase) {
  const card   = document.getElementById(`tbar-${tagger}`)
  const statEl = document.getElementById(`tbar-status-${tagger}`)
  const fillC1 = document.getElementById(`tbar-fill-c1-${tagger}`)
  const fillC2 = document.getElementById(`tbar-fill-c2-${tagger}`)
  if (!card) return

  if (status === 'running') {
    card.className = 'tagger-bar running'
    if (phase === 'c2') {
      // C1 is finished — lock it green
      _applyFill(fillC1, 100, _FILL_GREEN)
      // C2 growing orange
      _applyFill(fillC2, pct2 > 0 ? pct2 : 3, _FILL_ORANGE)
    } else {
      // C1 growing orange
      _applyFill(fillC1, pct1 > 0 ? pct1 : 3, _FILL_ORANGE)
    }
    let pctLabel = ''
    if (phase === 'c2') pctLabel = pct2 > 0 ? ` — C2: ${pct2}%` : ' — C2…'
    else if (pct1 > 0) pctLabel = ` — C1: ${pct1}%`
    if (statEl) statEl.textContent = (msg || 'Em andamento') + pctLabel
  } else if (status === 'done') {
    card.className = 'tagger-bar done'
    _applyFill(fillC1, 100, _FILL_GREEN)
    _applyFill(fillC2, 100, _FILL_GREEN)
    if (statEl) statEl.textContent = msg || 'Concluído'
  } else if (status === 'error') {
    card.className = 'tagger-bar error'
    _applyFill(fillC1, 100, _FILL_RED)
    _applyFill(fillC2, 100, _FILL_RED)
    if (statEl) statEl.textContent = msg || 'Erro'
  } else {
    // Waiting / queued — fills stay at 0 from init
    card.className = 'tagger-bar'
    if (statEl) statEl.textContent = msg || 'Aguardando…'
  }
}

// ── Global step badges ─────────────────────────────────────────────────────
const QR_STEPS = ['queued','tagging','normalizing','kfa','saving','done']
function setStep(step, isError) {
  document.querySelectorAll('.progress-step').forEach(el => {
    const s = el.dataset.step
    el.classList.remove('active','done','error')
    if (isError && s === step) el.classList.add('error')
    else if (!isError) {
      const idx = QR_STEPS.indexOf(s), cur = QR_STEPS.indexOf(step)
      if (idx < cur) el.classList.add('done')
      else if (idx === cur) el.classList.add('active')
    }
  })
}

function setMsg(msg, tqdm) {
  const el = document.getElementById('qr-msg')
  if (el) el.textContent = (msg || '') + (tqdm ? '\n' + tqdm : '')
}

function _setRunButtonBusy(isBusy) {
  const btn = document.getElementById('btn-qr-run')
  if (!btn) return
  btn.disabled    = isBusy
  btn.textContent = isBusy ? 'Executando…' : 'Iniciar tagging →'
}

function _getSelectedTaggers() {
  return Array.from(document.querySelectorAll('.qr-tagger-cb'))
    .filter(cb => cb.checked).map(cb => cb.value)
}

// ── Poll tagging job ────────────────────────────────────────────────────────
async function pollTagging() {
  try {
    const r = await api.quickrun.status(_jobId)
    setStep(r.step, r.status === 'error')
    setMsg(r.msg || r.message || '', r.tqdm || '')

    const prog = r.taggers_progress || {}
    Object.entries(prog).forEach(([t, p]) => {
      updateTaggerBar(t, p.status || 'running', p.msg || '', p.pct1 || 0, p.pct2 || 0, p.phase || 'c1')
    })

    if (r.status === 'done') {
      clearInterval(_pollTimer); _pollTimer = null
      _isRunning = false
      _setRunButtonBusy(false)
      document.dispatchEvent(new CustomEvent('project-changed'))
      _selectedTaggers.forEach(t => updateTaggerBar(t, 'done', 'Concluído', 100, 100, 'c2'))
      showToast('Tagging concluído!')

      const kfaAll = document.getElementById('qr-kfa-all')?.checked ?? true
      if (kfaAll) {
        await loadKfaStep(true)   // auto-run KFA with all features
      } else {
        document.getElementById('btn-qr-to-kfa')?.classList.remove('hidden')
      }
      return
    }

    if (r.status === 'error') {
      clearInterval(_pollTimer); _pollTimer = null
      _isRunning = false
      _setRunButtonBusy(false)
      showToast(r.error || 'Erro no tagging.', 'error')
      _selectedTaggers.forEach(t => updateTaggerBar(t, 'error', r.error || 'Erro', 0, 0, 'c1'))
    }
  } catch (err) {
    clearInterval(_pollTimer); _pollTimer = null
    _isRunning = false
    _setRunButtonBusy(false)
    showToast(err.message, 'error')
  }
}

// ── KFA step: load raw features + build tag-selection panels ───────────────
async function loadKfaStep(autoRun) {
  goStep(2)

  const panels = document.getElementById('qr-kfa-panels')
  if (!panels) return
  panels.innerHTML = '<div class="text-sm text-base-content/60 italic">Carregando features…</div>'

  const joinEl = document.getElementById('qr-kfa-join')
  if (joinEl) joinEl.value = _joinMethod

  let existingKfas = []
  try { const { kfa_results } = await api.analysis.listKfa(); existingKfas = kfa_results || [] } catch (_) {}

  const allTagsDone = _selectedTaggers.every(t =>
    existingKfas.some(k => k.tagger_type === t && k.analysis_name === 'default')
  )

  const noteEl = document.getElementById('qr-kfa-all-note')
  if (noteEl) noteEl.classList.toggle('hidden', !allTagsDone)

  panels.innerHTML = ''

  for (const tagger of _selectedTaggers) {
    let features = []
    try {
      const r = await api.analysis.getRawFeatures(_corpusNames.c1, tagger)
      features = r.features || []
    } catch (_) {}
    panels.appendChild(_buildKfaPanel(tagger, features))
  }

  if (autoRun && allTagsDone) return

  if (autoRun) await _runKfa()
}

function _buildKfaPanel(tagger, features) {
  const div = document.createElement('div')
  div.className = 'kfa-panel'
  div.dataset.tagger = tagger
  div.innerHTML = `
    <div class="kfa-panel-header" data-panel="${tagger}">
      <span>${_taggerLabel(tagger)}</span>
      <span class="text-xs text-base-content/60">${features.length} features</span>
    </div>
    <div class="kfa-panel-body" id="kfa-body-${tagger}">
      ${features.map(f => `
        <div class="kfa-tag-row">
          <input type="checkbox" class="kfa-feat-cb checkbox checkbox-xs" value="${f.name}" data-tagger="${tagger}" checked />
          <span class="kfa-tag-name">${f.name}</span>
          <span class="kfa-tag-count">${f.total.toLocaleString()}</span>
        </div>`).join('')}
    </div>
    <div class="kfa-panel-actions">
      <button class="btn btn-xs btn-ghost kfa-select-all" data-tagger="${tagger}">Todos</button>
      <button class="btn btn-xs btn-ghost kfa-select-none" data-tagger="${tagger}">Nenhum</button>
    </div>`
  div.querySelector('.kfa-panel-header').addEventListener('click', () => {
    div.querySelector('.kfa-panel-body')?.classList.toggle('collapsed')
  })
  div.querySelector('.kfa-select-all').addEventListener('click', e => {
    e.stopPropagation()
    div.querySelectorAll('.kfa-feat-cb').forEach(cb => cb.checked = true)
  })
  div.querySelector('.kfa-select-none').addEventListener('click', e => {
    e.stopPropagation()
    div.querySelectorAll('.kfa-feat-cb').forEach(cb => cb.checked = false)
  })
  return div
}

async function _runKfa() {
  const statusEl = document.getElementById('qr-kfa-status')
  if (statusEl) { statusEl.className = 'status-box running'; statusEl.textContent = 'Executando KFA…'; statusEl.classList.remove('hidden') }

  const join = document.getElementById('qr-kfa-join')?.value || _joinMethod
  const name = document.getElementById('qr-kfa-name')?.value?.trim() || 'default'
  const metricSel = document.getElementById('qr-kfa-metric')?.value || 'both'
  const metrics = metricSel === 'both' ? ['kfa', 'kfa2'] : [metricSel]

  for (const tagger of _selectedTaggers) {
    const checked = Array.from(
      document.querySelectorAll(`.kfa-feat-cb[data-tagger="${tagger}"]:checked`)
    ).map(cb => cb.value)

    for (const metric of metrics) {
      try {
        if (statusEl) statusEl.textContent = `KFA [${_taggerLabel(tagger)}] (${metric})…`
        await api.analysis.runKfa({
          corpus1_name: _corpusNames.c1,
          corpus2_name: _corpusNames.c2,
          join, tagger1: tagger, tagger2: tagger,
          save_to_project: true,
          analysis_name: name,
          metric,
          include_features: checked.length > 0 ? checked : null,
        })
      } catch (e) {
        if (statusEl) { statusEl.className = 'status-box error'; statusEl.textContent = `Erro KFA [${tagger}] (${metric}): ${e.message}` }
        showToast(`Erro KFA: ${e.message}`, 'error')
        return
      }
    }
  }

  if (statusEl) { statusEl.className = 'status-box done'; statusEl.textContent = 'KFA concluída! Análises salvas no .ttwa ✓' }
  showToast('KFA concluída e salva no .ttwa!')
  // Show saved badge in the results sidebar
  if (typeof _shared?.showSavedBadge === 'function') {
    _shared.showSavedBadge(null)
  }
  goStep(3)
  await refreshKfaSelectStep3()
}

// ── Results select in step 3 ───────────────────────────────────────────────
export async function refreshKfaSelectStep3() {
  // Delegate to the shared refreshKfaSelect from results.js (passed as prop)
  if (typeof _shared?.refreshKfaSelect === 'function') {
    await _shared.refreshKfaSelect()
  }
}

// ── Init ───────────────────────────────────────────────────────────────────
export function initQuickrun({ refreshKfaSelect, renderResults, showSavedBadge }) {
  _shared = { refreshKfaSelect, renderResults, showSavedBadge }

  // Tagger tree
  const allCb    = document.getElementById('qr-all')
  const groupCbs = Array.from(document.querySelectorAll('.qr-group-cb'))
  const leafCbs  = Array.from(document.querySelectorAll('.qr-tagger-cb'))
  const biberCb  = leafCbs.find(cb => cb.value === 'biberplus')
  const usenlpWrap = document.getElementById('qr-usenlp-wrap')

  const _leafsOf = group => leafCbs.filter(cb => cb.dataset.group === group)
  function _syncGroup(gcb) {
    const lfs = _leafsOf(gcb.dataset.group), n = lfs.filter(c=>c.checked).length
    gcb.checked = n === lfs.length; gcb.indeterminate = n > 0 && n < lfs.length
  }
  function _syncAll() {
    const n = leafCbs.filter(c=>c.checked).length
    allCb.checked = n === leafCbs.length; allCb.indeterminate = n>0 && n<leafCbs.length
  }
  function _syncUsenlp() {
    if (!usenlpWrap) return
    usenlpWrap.style.display = biberCb?.checked ? '' : 'none'
    if (!biberCb?.checked) {
      const r = document.querySelector('input[name="qr-biber-mode"][value="no_nlp"]')
      if (r) r.checked = true
    }
  }

  allCb?.addEventListener('change', () => {
    leafCbs.forEach(cb => cb.checked = allCb.checked)
    groupCbs.forEach(gcb => { gcb.checked = allCb.checked; gcb.indeterminate = false })
    _syncUsenlp()
  })
  groupCbs.forEach(gcb => {
    gcb.addEventListener('change', () => {
      _leafsOf(gcb.dataset.group).forEach(cb => cb.checked = gcb.checked)
      gcb.indeterminate = false; _syncAll(); _syncUsenlp()
    })
  })
  leafCbs.forEach(cb => {
    cb.addEventListener('change', () => {
      const gcb = groupCbs.find(g => g.dataset.group === cb.dataset.group)
      if (gcb) _syncGroup(gcb); _syncAll(); _syncUsenlp()
    })
  })
  groupCbs.forEach(_syncGroup); _syncAll(); _syncUsenlp()

  // Folder browse buttons
  const LS_CORPUS = 'qr_last_corpus_folder', LS_OUTPUT = 'qr_last_output_folder'
  document.querySelectorAll('#form-quickrun .btn-open-folder').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true; const origText = btn.textContent; btn.textContent = '…'
      const isOutput = btn.dataset.lastkey === 'output'
      const storageKey = isOutput ? LS_OUTPUT : LS_CORPUS
      const defaultLocation = localStorage.getItem(storageKey) || ''
      try {
        const res = await api.utils.pickFolder({ defaultLocation })
        if (res?.path) {
          const input = document.getElementById(btn.dataset.target)
          if (input) {
            if (isOutput) {
              const c1 = document.getElementById('qr-c1-name')?.value?.trim() || 'corpus1'
              const c2 = document.getElementById('qr-c2-name')?.value?.trim() || 'corpus2'
              input.value = res.path + '/' + c1 + '_vs_' + c2 + '.ttwa'
              localStorage.setItem(LS_OUTPUT, res.path)
            } else {
              input.value = res.path
              const nameInput = btn.dataset.nameid ? document.getElementById(btn.dataset.nameid) : null
              if (nameInput && !nameInput.value.trim())
                nameInput.value = res.path.split(/[/\\]/).filter(Boolean).pop() || ''
              localStorage.setItem(LS_CORPUS, res.path.split(/[/\\]/).slice(0,-1).join('/') || res.path)
            }
            input.dispatchEvent(new Event('change'))
          }
        }
      } catch (_) {}
      btn.textContent = origText; btn.disabled = false
    })
  })

  // Form submit (step 0 → step 1)
  document.getElementById('form-quickrun')?.addEventListener('submit', async e => {
    e.preventDefault()
    if (_isStarting || _isRunning) return

    const get = id => document.getElementById(id)?.value?.trim()
    let outputPath = get('qr-output') || ''
    if (outputPath && !outputPath.toLowerCase().endsWith('.ttwa'))
      outputPath = outputPath.replace(/\/$/, '') + '.ttwa'

    _selectedTaggers = _getSelectedTaggers()
    _corpusNames     = { c1: get('qr-c1-name'), c2: get('qr-c2-name') }
    _joinMethod      = get('qr-join') || 'intersection'

    const body = {
      corpus1_name:   _corpusNames.c1, corpus1_folder: get('qr-c1-folder'),
      corpus2_name:   _corpusNames.c2, corpus2_folder: get('qr-c2-folder'),
      output_ttwa: outputPath, mode: get('qr-mode'),
      taggers: _selectedTaggers, join: _joinMethod,
      min_effect: 0,
      usenlp: document.querySelector('input[name="qr-biber-mode"]:checked')?.value === 'use_nlp',
      n_processes: 1, overwrite: true, tag_only: true,
    }

    const required = ['corpus1_name','corpus1_folder','corpus2_name','corpus2_folder','output_ttwa']
    if (required.some(k => !body[k])) { showToast('Preencha todos os campos obrigatórios.','error'); return }
    if (!_selectedTaggers.length) { showToast('Selecione pelo menos um tagger.','error'); return }

    _isStarting = true; _setRunButtonBusy(true)
    goStep(1)
    initTaggerBars(_selectedTaggers)
    setStep('queued', false); setMsg('Iniciando…')
    document.getElementById('btn-qr-to-kfa')?.classList.add('hidden')

    try {
      if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null }
      const { job_id } = await api.quickrun.start(body)
      _jobId = job_id; _isRunning = true
      await pollTagging()
      if (_isRunning) _pollTimer = setInterval(pollTagging, 1500)
    } catch (err) {
      _setRunButtonBusy(false); showToast(err.message, 'error'); goStep(0)
    } finally { _isStarting = false }
  })

  // "Configurar KFA →" in step 1
  document.getElementById('btn-qr-to-kfa')?.addEventListener('click', () => loadKfaStep(false))

  // "Executar KFA" in step 2
  document.getElementById('btn-qr-run-kfa')?.addEventListener('click', _runKfa)

  // "Ver resultados existentes" in step 2
  document.getElementById('btn-qr-skip-kfa')?.addEventListener('click', async () => {
    goStep(3); await refreshKfaSelectStep3()
  })
}
