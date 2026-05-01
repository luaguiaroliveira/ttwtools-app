/**
 * views/results.js — KFA results: D3 bar chart + sortable table.
 * Supports two instances: inline (step-3 in quickrun) and standalone (#view-results).
 */

import { api }              from '../api.js'
import { showToast }        from '../ui.js'
import { state }            from '../state.js'
import { drawChart, PALETTES } from '../chart.js'
import { showFeatureDetail } from './feature-detail.js'

// Column definitions
const COLS = [
  { key: 'Feature',      label: () => 'Feature' },
  { key: 'Effect_Size',  label: () => 'Effect size (d)' },
  { key: 'Mean_Corpus1', label: () => `Média ${state.kfaC1}` },
  { key: 'Mean_Corpus2', label: () => `Média ${state.kfaC2}` },
  { key: 'Std_Corpus1',  label: () => `DP ${state.kfaC1}` },
  { key: 'Std_Corpus2',  label: () => `DP ${state.kfaC2}` },
  { key: 'N_Corpus1',    label: () => `N ${state.kfaC1}` },
  { key: 'N_Corpus2',    label: () => `N ${state.kfaC2}` },
]

function visibleRows() {
  if (!state.kfaData) return []
  let rows = state.kfaData.results.slice()
  if (state.filter)    rows = rows.filter(r => r.Feature.toLowerCase().includes(state.filter))
  if (state.minEffect) rows = rows.filter(r => Math.abs(r.Effect_Size) >= state.minEffect)
  rows.sort((a, b) => {
    const av = a[state.sortCol], bv = b[state.sortCol]
    if (typeof av === 'string') return state.sortDir * av.localeCompare(bv)
    return state.sortDir * (av - bv)
  })
  return rows
}

// ── Render helpers that work with either suffix ─────────────────────────────
function _id(base, suffix) { return base + (suffix ? '-' + suffix : '') }

function renderChartIn(suffix) {
  const wrapper = document.getElementById(_id('chart-wrapper', suffix))
  if (!wrapper) return

  // If the wrapper has no width (view is hidden / display:none parent),
  // defer the render to the next animation frame so the layout is computed.
  if (wrapper.getBoundingClientRect().width === 0) {
    requestAnimationFrame(() => { if (state.kfaData) renderChartIn(suffix) })
    return
  }

  drawChart(wrapper, visibleRows(), {
    metric:      state.chartMetric,
    barHeight:   state.barHeight,
    c1:          state.kfaC1,
    c2:          state.kfaC2,
    palette:     state.palette,
    tagDefs:     state.tagDefs,
    onBarClick:  (row) => showFeatureDetail(row.Feature),
  })
}

function renderTableIn(suffix) {
  const tableContainer = document.getElementById(_id('table-container', suffix))
  if (tableContainer) tableContainer.classList.remove('hidden')
  const tableId = _id('kfa-table', suffix)

  const thead = document.querySelector(`#${tableId} thead tr`)
  if (!thead) return
  thead.innerHTML = COLS.map(c => {
    const cls = c.key === state.sortCol
      ? (state.sortDir === -1 ? 'sort-desc' : 'sort-asc') : ''
    return `<th class="${cls}" data-col="${c.key}">${c.label()}</th>`
  }).join('')

  thead.querySelectorAll('th').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col
      if (state.sortCol === col) state.sortDir *= -1
      else { state.sortCol = col; state.sortDir = col === 'Feature' ? 1 : -1 }
      renderTableIn(suffix); renderChartIn(suffix)
    })
  })

  const rows = visibleRows()
  const tbody = document.querySelector(`#${tableId} tbody`)
  if (!tbody) return
  tbody.innerHTML = rows.map(r => {
    const cls  = r.Effect_Size >= 0 ? 'effect-positive' : 'effect-negative'
    const def  = state.tagDefs[r.Feature]
    const title = def ? ` title="${def.replace(/"/g, "'")}"` : ''
    return `<tr>
      <td class="feature-link" data-feature="${r.Feature}"${title}>${r.Feature}</td>
      <td class="${cls}">${r.Effect_Size.toFixed(3)}</td>
      <td>${r.Mean_Corpus1.toFixed(3)}</td>
      <td>${r.Mean_Corpus2.toFixed(3)}</td>
      <td>${r.Std_Corpus1.toFixed(3)}</td>
      <td>${r.Std_Corpus2.toFixed(3)}</td>
      <td>${r.N_Corpus1}</td>
      <td>${r.N_Corpus2}</td>
    </tr>`
  }).join('')
}

function renderResultsIn(suffix) {
  const cc = document.getElementById(_id('chart-container', suffix))
  if (cc) cc.classList.remove('hidden')
  renderChartIn(suffix)
  renderTableIn(suffix)
}

// ── Load a KFA result and display in a given suffix context ─────────────────
async function loadKfa(optStr, suffix) {
  const { c1, c2, d, join, tagger, analysis_name, features_meta } = JSON.parse(optStr)
  try {
    const data = await api.analysis.getKfa(c1, c2, d || 0, join, tagger, analysis_name)
    state.kfaData     = data
    state.kfaC1       = c1
    state.kfaC2       = c2
    state.kfaTagger   = tagger || null
    state.sortCol     = 'Effect_Size'
    state.sortDir     = -1
    state.filter      = ''
    state.minEffect   = 0
    state.chartMetric = 'Effect_Size'

    const sfx = suffix ? '-' + suffix : ''
    const filterEl = document.getElementById(`results-filter${sfx}`)
    const metricEl = document.getElementById(`chart-metric${sfx}`)
    const minDEl   = document.getElementById(`results-min-d${sfx}`)
    if (filterEl) filterEl.value = ''
    if (metricEl) metricEl.value = 'Effect_Size'
    if (minDEl)   minDEl.value   = '0'

    // Populate info box
    const nameSfx = sfx
    const infoName  = document.getElementById(`results-info-name${nameSfx}`)
    const infoTagg  = document.getElementById(`results-info-tagger${nameSfx}`)
    const infoFeats = document.getElementById(`results-info-features${nameSfx}`)
    if (infoName)  infoName.textContent  = analysis_name || 'default'
    if (infoTagg)  infoTagg.textContent  = tagger || 'biberplus'
    if (infoFeats) {
      const fm = features_meta || []
      infoFeats.textContent = fm.length > 0
        ? `${fm.length}: ${fm.slice(0,8).join(', ')}${fm.length > 8 ? '…' : ''}`
        : 'Todos'
    }

    renderResultsIn(suffix)
  } catch (err) {
    showToast(err.message, 'error')
  }
}

// ── Tagger label helper ─────────────────────────────────────────────────────
function _taggerLabel(t) {
  const map = { biberplus:'BiberPlus', mfte:'MFTE', mfte_ext:'MFTE Estendido',
    stanza_upos:'Stanza UPOS', stanza_xpos:'Stanza XPOS',
    spacy_upos:'spaCy UPOS', spacy_ptb:'spaCy PTB' }
  return map[t] || t
}

// ── Refresh both sidebar instances ──────────────────────────────────────────
export async function refreshKfaSelect() {
  try {
    const { kfa_results } = await api.analysis.listKfa()
    await _populateSidebar(kfa_results, null)
    await _populateSidebar(kfa_results, 'standalone')
  } catch (_) {}
}

// ── Show "💾 .ttwa" badge for a brief moment ────────────────────────────────
export function showSavedBadge(suffix) {
  const sfx = suffix ? '-' + suffix : ''
  const badge = document.getElementById(`results-saved-badge${sfx}`)
  if (!badge) return
  badge.classList.remove('hidden')
  setTimeout(() => badge.classList.add('hidden'), 4000)
}

// ── Populate sidebar tagger dropdown + analyses list ────────────────────────
async function _populateSidebar(kfa_results, suffix) {
  const sfx = suffix ? '-' + suffix : ''
  const taggerSel = document.getElementById(`results-tagger-sel${sfx}`)
  if (!taggerSel) return

  // Group by tagger
  const byTagger = {}
  kfa_results.forEach(r => {
    const t = r.tagger_type || 'biberplus'
    if (!byTagger[t]) byTagger[t] = []
    byTagger[t].push(r)
  })
  const taggers = Object.keys(byTagger).sort()

  // Store for tagger-change handler
  taggerSel._kfaByTagger = byTagger

  // Preserve selection if still valid
  const prevTagger = taggerSel.value
  taggerSel.innerHTML = taggers.length === 0 ? '<option value="">-- nenhum tagger --</option>' : ''
  taggers.forEach(t => {
    const opt = document.createElement('option')
    opt.value = t; opt.textContent = _taggerLabel(t)
    taggerSel.appendChild(opt)
  })
  if (prevTagger && taggers.includes(prevTagger)) taggerSel.value = prevTagger
  else if (taggers.length > 0) taggerSel.value = taggers[0]

  // Populate analyses list for selected tagger
  await _populateAnalysesList(suffix, byTagger, taggerSel.value, true)
}

// ── Populate the analyses list (radio buttons) for one tagger ──────────────
async function _populateAnalysesList(suffix, byTagger, tagger, autoLoad) {
  const sfx = suffix ? '-' + suffix : ''
  const list = document.getElementById(`results-analyses-list${sfx}`)
  if (!list) return

  const analyses = byTagger[tagger] || []
  if (analyses.length === 0) {
    list.innerHTML = '<div class="analyses-empty">Nenhuma análise para este tagger.</div>'
    return
  }

  list.innerHTML = ''
  analyses.forEach((r, i) => {
    const name = r.analysis_name || 'default'
    const fm   = Array.isArray(r.features_meta) ? r.features_meta : []
    const tagsLabel = fm.length > 0 ? `${fm.length} tags` : 'todos'
    const tagsDetail = fm.length > 0
      ? fm.slice(0, 15).join(', ') + (fm.length > 15 ? `… (+${fm.length - 15})` : '')
      : 'Todos os tags incluídos'

    const optVal = JSON.stringify({
      c1: r.corpus1_name, c2: r.corpus2_name,
      d: r.min_effect, join: r.join_method, tagger: r.tagger_type,
      analysis_name: r.analysis_name, features_meta: fm
    })

    const item = document.createElement('div')
    item.className = 'analysis-item' + (i === 0 ? ' active' : '')
    item.dataset.value = optVal

    item.innerHTML = `
      <input type="radio" name="results-analysis${sfx}" class="radio radio-xs shrink-0"${i === 0 ? ' checked' : ''} />
      <span class="analysis-item-name" title="${name}">${name}</span>
      <span class="analysis-item-tags">${tagsLabel}</span>
      <span class="analysis-item-info" title="${tagsDetail}">ℹ</span>`

    const radio   = item.querySelector('input[type=radio]')
    const infoBtn = item.querySelector('.analysis-item-info')

    infoBtn.addEventListener('click', e => {
      e.stopPropagation()
      const ib = document.getElementById(`results-info-box${sfx}`)
      if (!ib) return
      const showing = !ib.classList.contains('hidden')
      // Toggle off if same, otherwise show for this analysis
      ib.classList.add('hidden')
      if (!showing || ib._activeVal !== optVal) {
        const infoName  = document.getElementById(`results-info-name${sfx}`)
        const infoTagg  = document.getElementById(`results-info-tagger${sfx}`)
        const infoFeats = document.getElementById(`results-info-features${sfx}`)
        if (infoName)  infoName.textContent  = name
        if (infoTagg)  infoTagg.textContent  = r.tagger_type || 'biberplus'
        if (infoFeats) infoFeats.textContent = fm.length > 0
          ? `${fm.length} tags: ${fm.join(', ')}`
          : 'Todos os tags'
        ib._activeVal = optVal
        ib.classList.remove('hidden')
      }
    })

    item.addEventListener('click', async () => {
      list.querySelectorAll('.analysis-item').forEach(el => {
        el.classList.remove('active')
        el.querySelector('input[type=radio]').checked = false
      })
      item.classList.add('active')
      radio.checked = true
      await loadKfa(optVal, suffix)
    })

    list.appendChild(item)
  })

  if (autoLoad && analyses.length > 0) {
    await loadKfa(list.querySelector('.analysis-item').dataset.value, suffix)
  }
}

// ── Bind controls for one suffix ───────────────────────────────────────────
function _bindControls(suffix) {
  const sfx = suffix ? '-' + suffix : ''

  // Tagger select change → repopulate analyses list
  document.getElementById(`results-tagger-sel${sfx}`)?.addEventListener('change', async function() {
    const byTagger = this._kfaByTagger || {}
    await _populateAnalysesList(suffix, byTagger, this.value, true)
  })

  // Feature name filter
  document.getElementById(`results-filter${sfx}`)?.addEventListener('input', e => {
    state.filter = e.target.value.trim().toLowerCase()
    if (state.kfaData) { renderTableIn(suffix); renderChartIn(suffix) }
  })

  // Min |d| filter
  document.getElementById(`results-min-d${sfx}`)?.addEventListener('input', e => {
    state.minEffect = parseFloat(e.target.value) || 0
    if (state.kfaData) { renderTableIn(suffix); renderChartIn(suffix) }
  })

  // Chart metric selector
  document.getElementById(`chart-metric${sfx}`)?.addEventListener('change', e => {
    state.chartMetric = e.target.value
    if (state.kfaData) renderChartIn(suffix)
  })

  // Bar thickness slider
  document.getElementById(`chart-thickness${sfx}`)?.addEventListener('input', e => {
    state.barHeight = parseInt(e.target.value, 10)
    const lbl = document.getElementById(`chart-thickness-val${sfx}`)
    if (lbl) lbl.textContent = state.barHeight
    if (state.kfaData) renderChartIn(suffix)
  })

  // Palette selector
  document.getElementById(`chart-palette${sfx}`)?.addEventListener('change', e => {
    state.palette = e.target.value
    if (state.kfaData) renderChartIn(suffix)
  })

  // Feature row click → detail view
  document.getElementById(`kfa-table${sfx}`)?.addEventListener('click', e => {
    const td = e.target.closest('td.feature-link')
    if (td) showFeatureDetail(td.dataset.feature)
  })

  // Populate palette select
  const paletteSelect = document.getElementById(`chart-palette${sfx}`)
  if (paletteSelect && paletteSelect.children.length === 0) {
    Object.entries(PALETTES).forEach(([key, { label }]) => {
      const opt = document.createElement('option')
      opt.value = key; opt.textContent = label
      paletteSelect.appendChild(opt)
    })
    paletteSelect.value = state.palette
  }

  // ResizeObserver — re-render when chart-container changes width
  const chartContainer = document.getElementById(`chart-container${sfx}`)
  if (chartContainer) {
    let _prevW = 0
    const ro = new ResizeObserver(entries => {
      const newW = entries[0].contentRect.width
      if (Math.abs(newW - _prevW) > 2) { _prevW = newW; if (state.kfaData) renderChartIn(suffix) }
    })
    ro.observe(chartContainer)
  }

  // MutationObserver — re-render when the view/step becomes active.
  // Fixes the "squeezed chart on first open" bug: the chart was drawn while
  // the container was display:none, so getBoundingClientRect() returned width=0.
  if (suffix === 'standalone') {
    // Sidebar "Resultados" view
    const viewEl = document.getElementById('view-results')
    if (viewEl) {
      const mo = new MutationObserver(() => {
        if (viewEl.classList.contains('active') && state.kfaData) {
          requestAnimationFrame(() => renderChartIn(suffix))
        }
      })
      mo.observe(viewEl, { attributes: true, attributeFilter: ['class'] })
    }
  } else {
    // Quickrun step-3 panel (inline, no suffix)
    const stepEl = document.getElementById('qr-step-3')
    if (stepEl) {
      const mo = new MutationObserver(() => {
        if (stepEl.classList.contains('active') && state.kfaData) {
          requestAnimationFrame(() => renderChartIn(suffix))
        }
      })
      mo.observe(stepEl, { attributes: true, attributeFilter: ['class'] })
    }
  }
}

// ── Public API ──────────────────────────────────────────────────────────────
/**
 * Programmatically render KFA data into the inline (step-3) panel.
 * Called from quickrun.js after loading a result.
 */
export function renderResultsData(data, c1, c2) {
  state.kfaData = data; state.kfaC1 = c1; state.kfaC2 = c2
  state.sortCol = 'Effect_Size'; state.sortDir = -1
  state.filter = ''; state.minEffect = 0; state.chartMetric = 'Effect_Size'
  renderResultsIn(null)  // inline = no suffix
}

export function initResults() {
  // Standalone view
  _bindControls('standalone')
  // Inline step-3 panel (no suffix)
  _bindControls(null)
}
