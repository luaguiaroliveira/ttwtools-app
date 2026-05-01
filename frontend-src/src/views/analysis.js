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

// ── Auto-populate corpus pair from the first existing KFA result ─────────────
async function _autoPopulateFromProject() {
  try {
    const { kfa_results } = await api.analysis.listKfa()
    if (!kfa_results || kfa_results.length === 0) return

    const first = kfa_results[0]
    const c1Sel = document.getElementById('kfa-corpus1')
    const c2Sel = document.getElementById('kfa-corpus2')

    // Only set if not already chosen
    if (c1Sel && !c1Sel.value && first.corpus1_name) {
      const opt = Array.from(c1Sel.options).find(o => o.value === first.corpus1_name)
      if (opt) c1Sel.value = first.corpus1_name
    }
    if (c2Sel && !c2Sel.value && first.corpus2_name) {
      const opt = Array.from(c2Sel.options).find(o => o.value === first.corpus2_name)
      if (opt) c2Sel.value = first.corpus2_name
    }

    // Now load features for the auto-selected corpus1
    if (document.getElementById('kfa-corpus1')?.value) {
      await _loadAllFeatures()
    }
  } catch (_) { /* no project open yet — ignore */ }
}

// ── Public init ──────────────────────────────────────────────────────────────
export function initAnalysis({ refreshKfaSelect }) {
  // Reload panels when corpus1 changes
  document.getElementById('kfa-corpus1')?.addEventListener('change', _loadAllFeatures)

  // When view-analysis becomes visible, auto-populate + load features
  const viewEl = document.getElementById('view-analysis')
  if (viewEl) {
    new MutationObserver(() => {
      if (viewEl.classList.contains('active')) {
        const c1 = document.getElementById('kfa-corpus1')?.value
        if (c1) {
          // corpus already selected → just refresh panels
          _loadAllFeatures()
        } else {
          // try to pre-fill from existing project results
          _autoPopulateFromProject()
        }
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

    // Collect one panel per detected tagger
    const panelEls = document.querySelectorAll('#kfa-feat-panels .kfa-panel')
    if (panelEls.length === 0) {
      showToast('Nenhuma feature disponível. Selecione um corpus tagueado.', 'error')
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
