/**
 * views/analysis.js — KFA standalone form.
 *
 * When the "KFA" sidebar button is clicked:
 *  1. The corpus selects are auto-populated from existing project KFA results.
 *  2. Features are auto-detected for all taggers that have data for corpus1.
 *  3. A panel per tagger is shown — identical to quickrun step 3.
 *
 * The user can then run a new KFA (adding a new analysis layer) or adjust
 * which tags to include.
 */

import { api }                 from '../api.js'
import { showToast, showView } from '../ui.js'

const ALL_TAGGERS = [
  'biberplus', 'mfte', 'mfte_ext',
  'stanza_upos', 'stanza_xpos',
  'spacy_upos', 'spacy_ptb',
]

function _taggerLabel(t) {
  const map = {
    biberplus: 'BiberPlus', mfte: 'MFTE', mfte_ext: 'MFTE Estendido',
    stanza_upos: 'Stanza UPOS', stanza_xpos: 'Stanza XPOS',
    spacy_upos: 'spaCy UPOS', spacy_ptb: 'spaCy PTB',
  }
  return map[t] || t
}

// ── Build a collapsible tag-selection panel (same style as quickrun step 3) ─
function _buildTagPanel(tagger, features) {
  const div = document.createElement('div')
  div.className = 'kfa-panel'
  div.dataset.tagger = tagger

  div.innerHTML = `
    <div class="kfa-panel-header">
      <span>${_taggerLabel(tagger)}</span>
      <span class="text-xs text-base-content/60">${features.length} features</span>
    </div>
    <div class="kfa-panel-body">
      ${features.map(f => `
        <div class="kfa-tag-row">
          <input type="checkbox" class="kfa-sa-feat-cb checkbox checkbox-xs"
            value="${f.name}" data-tagger="${tagger}" checked />
          <span class="kfa-tag-name">${f.name}</span>
          <span class="kfa-tag-count">${f.total.toLocaleString()}</span>
        </div>`).join('')}
    </div>
    <div class="kfa-panel-actions">
      <button type="button" class="btn btn-xs btn-ghost kfa-sa-all">Todos</button>
      <button type="button" class="btn btn-xs btn-ghost kfa-sa-none">Nenhum</button>
    </div>`

  div.querySelector('.kfa-panel-header').addEventListener('click', () => {
    div.classList.toggle('collapsed')
  })
  div.querySelector('.kfa-sa-all').addEventListener('click', e => {
    e.stopPropagation()
    div.querySelectorAll('.kfa-sa-feat-cb').forEach(cb => (cb.checked = true))
  })
  div.querySelector('.kfa-sa-none').addEventListener('click', e => {
    e.stopPropagation()
    div.querySelectorAll('.kfa-sa-feat-cb').forEach(cb => (cb.checked = false))
  })
  return div
}

// ── Try all taggers for corpus1; show a panel for each with features ─────────
let _loadingFeatures = false
let _activeC1 = null
let _activeC2 = null

async function _loadAllFeatures() {
  const panels = document.getElementById('kfa-feat-panels')
  if (!panels || !_activeC1) return

  if (_loadingFeatures) return
  _loadingFeatures = true

  panels.innerHTML = `
    <div class="text-sm text-base-content/60 italic py-2 flex items-center gap-2">
      <span class="loading loading-spinner loading-xs"></span>
      Detectando taggers disponíveis…
    </div>`

  try {
    const results = []
    for (const tagger of ALL_TAGGERS) {
      try {
        const r = await api.analysis.getRawFeatures(_activeC1, tagger)
        const features = r.features || []
        if (features.length > 0) results.push({ tagger, features })
      } catch (_) { /* tagger not run for this corpus — skip silently */ }
    }

    panels.innerHTML = ''
    if (results.length === 0) {
      panels.innerHTML = `
        <div class="text-sm text-base-content/50 italic py-2">
          Nenhum tagger encontrado para este corpus.<br/>
          Execute o Tagging primeiro (menu lateral "Tagging") para gerar as features.
        </div>`
    } else {
      results.forEach(({ tagger, features }) =>
        panels.appendChild(_buildTagPanel(tagger, features))
      )
    }
  } finally {
    _loadingFeatures = false
  }
}

// ── Auto-populate corpus pair ────────────────────────────────────────────────
async function _autoPopulateFromProject() {
  try {
    // 1. Try from existing KFA results
    const { kfa_results } = await api.analysis.listKfa()
    if (kfa_results && kfa_results.length > 0) {
      _activeC1 = kfa_results[0].corpus1_name
      _activeC2 = kfa_results[0].corpus2_name
    } else {
      // 2. Fallback to project manifest corpora
      const { items } = await api.project.manifest()
      const corpora = [...new Set(items.filter(i => i.category === 'corpora').map(i => i.corpus))].sort()
      if (corpora.length > 0) {
        _activeC1 = corpora[0]
        _activeC2 = corpora.length > 1 ? corpora[1] : corpora[0]
      }
    }

    if (_activeC1 && _activeC2) {
      const wrap = document.getElementById('kfa-corpora-wrap')
      const badge1 = document.getElementById('kfa-badge-c1')
      const badge2 = document.getElementById('kfa-badge-c2')
      if (wrap) wrap.classList.remove('hidden')
      if (badge1) badge1.textContent = _activeC1
      if (badge2) badge2.textContent = _activeC2
      await _loadAllFeatures()
    } else {
      const panels = document.getElementById('kfa-feat-panels')
      if (panels) panels.innerHTML = '<div class="text-sm text-base-content/50 italic py-2">Nenhum corpus encontrado no projeto.</div>'
    }
  } catch (_) { /* no project open yet or error — ignore */ }
}

// ── Public init ──────────────────────────────────────────────────────────────
export function initAnalysis({ refreshKfaSelect }) {
  // When view-analysis becomes visible, auto-populate + load features
  const viewEl = document.getElementById('view-analysis')
  if (viewEl) {
    new MutationObserver(() => {
      if (viewEl.classList.contains('active')) {
        _autoPopulateFromProject()
      }
    }).observe(viewEl, { attributes: true, attributeFilter: ['class'] })
  }

  // Handle form submit
  document.getElementById('form-kfa')?.addEventListener('submit', async e => {
    e.preventDefault()

    const join = document.getElementById('kfa-join')?.value || 'union'
    const name = document.getElementById('kfa-analysis-name')?.value?.trim() || 'default'
    const metricSel = document.getElementById('kfa-metric')?.value || 'both'
    const metrics = metricSel === 'both' ? ['kfa', 'kfa2'] : [metricSel]

    if (!_activeC1 || !_activeC2) { showToast('Corpora não definidos.', 'error'); return }

    // Collect one panel per detected tagger
    const panelEls = document.querySelectorAll('#kfa-feat-panels .kfa-panel')
    if (panelEls.length === 0) {
      showToast('Nenhuma feature disponível.', 'error')
      return
    }

    const btn = e.target.querySelector('button[type="submit"]')
    btn.disabled = true
    btn.textContent = 'Executando…'

    let ran = 0
    try {
      for (const panel of panelEls) {
        const tagger = panel.dataset.tagger
        const checked = Array.from(
          panel.querySelectorAll('.kfa-sa-feat-cb:checked')
        ).map(cb => cb.value)

        if (checked.length === 0) continue  // user deselected everything — skip

        for (const metric of metrics) {
          const res = await api.analysis.runKfa({
            corpus1_name:     _activeC1,
            corpus2_name:     _activeC2,
            min_effect_size:  0,
            join,
            save_to_project:  true,
            tagger1:          tagger,
            tagger2:          tagger,
            analysis_name:    name,
            metric,
            include_features: checked,
          })
          if (res?.skipped) {
            console.warn(`KFA pulada [${tagger}/${metric}]: ${res.reason}`)
          }
        }
        ran++
      }

      if (ran === 0) { showToast('Nenhuma feature selecionada.', 'error'); return }
      showToast(`KFA concluída para ${ran} tagger(s).`)
      await refreshKfaSelect()
      showView('results')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      btn.disabled = false
      btn.textContent = 'Executar KFA'
    }
  })
}
