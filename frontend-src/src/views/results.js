/**
 * views/results.js — KFA results: D3 bar chart + sortable table.
 */

import { api }          from '../api.js'
import { showToast }    from '../ui.js'
import { state }        from '../state.js'
import { drawChart, PALETTES } from '../chart.js'

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function visibleRows() {
  if (!state.kfaData) return []
  let rows = state.kfaData.results.slice()
  if (state.filter) rows = rows.filter(r => r.Feature.toLowerCase().includes(state.filter))
  rows.sort((a, b) => {
    const av = a[state.sortCol], bv = b[state.sortCol]
    if (typeof av === 'string') return state.sortDir * av.localeCompare(bv)
    return state.sortDir * (av - bv)
  })
  return rows
}

function renderChart() {
  const wrapper = document.getElementById('chart-wrapper')
  drawChart(wrapper, visibleRows(), {
    metric:    state.chartMetric,
    barHeight: state.barHeight,
    c1:        state.kfaC1,
    c2:        state.kfaC2,
    palette:   state.palette,
    tagDefs:   state.tagDefs,
  })
}

function renderTable() {
  document.getElementById('table-container').classList.remove('hidden')

  // Header
  const thead = document.querySelector('#kfa-table thead tr')
  thead.innerHTML = COLS.map(c => {
    const cls = c.key === state.sortCol
      ? (state.sortDir === -1 ? 'sort-desc' : 'sort-asc')
      : ''
    return `<th class="${cls}" data-col="${c.key}">${c.label()}</th>`
  }).join('')

  thead.querySelectorAll('th').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col
      if (state.sortCol === col) {
        state.sortDir *= -1
      } else {
        state.sortCol = col
        state.sortDir = col === 'Feature' ? 1 : -1
      }
      renderTable()
      renderChart()
    })
  })

  // Body
  const rows = visibleRows()
  document.querySelector('#kfa-table tbody').innerHTML = rows.map(r => {
    const cls = r.Effect_Size >= 0 ? 'effect-positive' : 'effect-negative'
    return `<tr>
      <td>${r.Feature}</td>
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

function renderResults() {
  document.getElementById('chart-container').classList.remove('hidden')
  renderChart()
  renderTable()
}

// ---------------------------------------------------------------------------
// KFA select (also called from other views after new KFA)
// ---------------------------------------------------------------------------

export async function refreshKfaSelect() {
  try {
    const { kfa_results } = await api.analysis.listKfa()
    const sel = document.getElementById('results-kfa-select')
    sel.innerHTML = '<option value="">-- selecione uma KFA --</option>'
    kfa_results.forEach(r => {
      const opt = document.createElement('option')
      opt.value = JSON.stringify({ c1: r.corpus1_name, c2: r.corpus2_name, d: r.min_effect, join: r.join_method })
      opt.textContent = `${r.corpus1_name} vs ${r.corpus2_name}  (d≥${r.min_effect}, ${r.join_method})`
      sel.appendChild(opt)
    })
    // Auto-select last result if only one
    if (kfa_results.length === 1) sel.selectedIndex = 1
  } catch (_) {}
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

export function initResults() {
  // Populate palette select from PALETTES definition
  const paletteSelect = document.getElementById('chart-palette')
  Object.entries(PALETTES).forEach(([key, { label }]) => {
    const opt = document.createElement('option')
    opt.value = key
    opt.textContent = label
    if (key === state.palette) opt.selected = true
    paletteSelect.appendChild(opt)
  })

  // Load button
  document.getElementById('btn-load-result')?.addEventListener('click', async () => {
    const sel = document.getElementById('results-kfa-select')
    if (!sel.value) { showToast('Selecione uma KFA.', 'error'); return }
    const { c1, c2, d, join } = JSON.parse(sel.value)
    try {
      const data       = await api.analysis.getKfa(c1, c2, d, join)
      state.kfaData    = data
      state.kfaC1      = c1
      state.kfaC2      = c2
      state.sortCol    = 'Effect_Size'
      state.sortDir    = -1
      state.filter     = ''
      state.chartMetric = 'Effect_Size'
      document.getElementById('results-filter').value = ''
      document.getElementById('chart-metric').value   = 'Effect_Size'
      renderResults()
    } catch (err) {
      showToast(err.message, 'error')
    }
  })

  // Filter
  document.getElementById('results-filter')?.addEventListener('input', e => {
    state.filter = e.target.value.trim().toLowerCase()
    if (state.kfaData) { renderTable(); renderChart() }
  })

  // Metric selector
  document.getElementById('chart-metric')?.addEventListener('change', e => {
    state.chartMetric = e.target.value
    if (state.kfaData) renderChart()
  })

  // Bar thickness slider
  document.getElementById('chart-thickness')?.addEventListener('input', e => {
    state.barHeight = parseInt(e.target.value, 10)
    const lbl = document.getElementById('chart-thickness-val')
    if (lbl) lbl.textContent = state.barHeight
    if (state.kfaData) renderChart()
  })

  // Palette selector
  document.getElementById('chart-palette')?.addEventListener('change', e => {
    state.palette = e.target.value
    if (state.kfaData) renderChart()
  })

  // ResizeObserver: redraw chart when container width changes
  const chartContainer = document.getElementById('chart-container')
  let _prevW = 0
  const ro = new ResizeObserver(entries => {
    const newW = entries[0].contentRect.width
    if (Math.abs(newW - _prevW) > 2) {
      _prevW = newW
      if (state.kfaData) renderChart()
    }
  })
  ro.observe(chartContainer)
}
