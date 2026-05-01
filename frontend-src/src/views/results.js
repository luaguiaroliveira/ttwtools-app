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

// ── Refresh both KFA selects ────────────────────────────────────────────────
export async function refreshKfaSelect() {
  try {
    const { kfa_results } = await api.analysis.listKfa()

    // Both selects: standalone and step-3 inline
    const selIds = ['results-kfa-select-standalone', 'results-kfa-select']
    selIds.forEach(selId => {
      const sel = document.getElementById(selId)
      if (!sel) return
      const prevVal = sel.value
      sel.innerHTML = '<option value="">-- selecione uma KFA --</option>'
      kfa_results.forEach(r => {
        const opt = document.createElement('option')
        const an  = r.analysis_name && r.analysis_name !== 'default' ? ` [${r.analysis_name}]` : ''
        opt.value = JSON.stringify({ c1: r.corpus1_name, c2: r.corpus2_name,
          d: r.min_effect, join: r.join_method, tagger: r.tagger_type,
          analysis_name: r.analysis_name, features_meta: r.features_meta })
        opt.textContent = `${r.corpus1_name} vs ${r.corpus2_name} (${r.join_method}) [${r.tagger_type || 'biberplus'}]${an}`
        sel.appendChild(opt)
      })
      // Restore previous selection if still present
      const still = sel.querySelector(`option[value="${CSS.escape(prevVal)}"]`)
      if (still && prevVal) sel.value = prevVal
    })
  } catch (_) {}
}

// ── Bind controls for one suffix ───────────────────────────────────────────
function _bindControls(suffix) {
  const sfx = suffix ? '-' + suffix : ''

  // Auto-load on select change
  document.getElementById(`results-kfa-select${sfx}`)?.addEventListener('change', async function() {
    if (!this.value) return
    await loadKfa(this.value, suffix)
  })

  // Info icon toggle
  document.getElementById(`btn-results-info${sfx}`)?.addEventListener('click', () => {
    document.getElementById(`results-info-box${sfx}`)?.classList.toggle('hidden')
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

  // ResizeObserver
  const chartContainer = document.getElementById(`chart-container${sfx}`)
  if (chartContainer) {
    let _prevW = 0
    const ro = new ResizeObserver(entries => {
      const newW = entries[0].contentRect.width
      if (Math.abs(newW - _prevW) > 2) { _prevW = newW; if (state.kfaData) renderChartIn(suffix) }
    })
    ro.observe(chartContainer)
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
