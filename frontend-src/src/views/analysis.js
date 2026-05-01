/**
 * views/analysis.js — KFA standalone form.
 * Auto-detects which taggers are available for corpus1 and shows
 * a tag-selection panel per tagger — identical to quickrun step 3.
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
    div.querySelector('.kfa-panel-body')?.classList.toggle('collapsed')
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
async function _loadAllFeatures() {
  const panels = document.getElementById('kfa-feat-panels')
  if (!panels) return

  const c1 = document.getElementById('kfa-corpus1')?.value
  if (!c1) { panels.innerHTML = ''; return }

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
        const r = await api.analysis.getRawFeatures(c1, tagger)
        const features = r.features || []
        if (features.length > 0) results.push({ tagger, features })
      } catch (_) { /* tagger not run for this corpus — skip */ }
    }

    panels.innerHTML = ''
    if (results.length === 0) {
      panels.innerHTML = `
        <div class="text-sm text-base-content/50 italic py-2">
          Nenhum tagger encontrado para este corpus. O corpus foi tagueado?
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

// ── Public init ──────────────────────────────────────────────────────────────
export function initAnalysis({ refreshKfaSelect }) {
  // Reload panels when corpus1 changes
  document.getElementById('kfa-corpus1')?.addEventListener('change', _loadAllFeatures)

  // When view-analysis becomes visible, auto-load if corpus1 is already set
  const viewEl = document.getElementById('view-analysis')
  if (viewEl) {
    new MutationObserver(() => {
      if (viewEl.classList.contains('active')) {
        const c1 = document.getElementById('kfa-corpus1')?.value
        if (c1) _loadAllFeatures()
      }
    }).observe(viewEl, { attributes: true, attributeFilter: ['class'] })
  }

  // Handle form submit
  document.getElementById('form-kfa')?.addEventListener('submit', async e => {
    e.preventDefault()

    const c1   = document.getElementById('kfa-corpus1')?.value
    const c2   = document.getElementById('kfa-corpus2')?.value
    const join = document.getElementById('kfa-join')?.value || 'union'
    const name = document.getElementById('kfa-analysis-name')?.value?.trim() || 'default'

    if (!c1 || !c2) { showToast('Selecione os dois corpora.', 'error'); return }
    if (c1 === c2)  { showToast('Os corpora devem ser diferentes.', 'error'); return }

    // Collect panels (one per detected tagger)
    const panels = document.querySelectorAll('#kfa-feat-panels .kfa-panel')
    if (panels.length === 0) {
      showToast('Nenhuma feature disponível. Selecione um corpus tagueado.', 'error')
      return
    }

    const btn = e.target.querySelector('button[type="submit"]')
    btn.disabled = true
    btn.textContent = 'Executando…'

    let ran = 0
    try {
      for (const panel of panels) {
        const tagger = panel.dataset.tagger
        const checked = Array.from(
          panel.querySelectorAll('.kfa-sa-feat-cb:checked')
        ).map(cb => cb.value)

        if (checked.length === 0) continue // skip if user deselected all

        await api.analysis.runKfa({
          corpus1_name:     c1,
          corpus2_name:     c2,
          min_effect_size:  0,
          join,
          save_to_project:  true,
          tagger1:          tagger,
          tagger2:          tagger,
          analysis_name:    name,
          include_features: checked,
        })
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
