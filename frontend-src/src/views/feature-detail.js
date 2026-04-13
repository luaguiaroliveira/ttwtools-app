/**
 * views/feature-detail.js — Detalhamento: file ranking per feature + feature switcher sidebar.
 */

import * as d3   from 'd3'
import { api }      from '../api.js'
import { showView } from '../ui.js'
import { state }    from '../state.js'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Navigate to feature-detail view for the given feature tag.
 * Called from results.js when the user clicks on a bar/row.
 */
export async function showFeatureDetail(feature) {
  if (!state.kfaData || !state.kfaC1 || !state.kfaC2) return

  state.currentFeature = feature
  showView('feature-detail')

  // Header
  document.getElementById('fd-feature-name').textContent = feature
  document.getElementById('fd-feature-def').textContent  = state.tagDefs[feature] || ''

  // Sidebar + file table (sidebar is fast, table may need a fetch)
  renderSidebar(feature)
  await loadFileTable(feature)
}

// ---------------------------------------------------------------------------
// Sidebar: D3 bidirectional bar chart matching the main KFA chart style
// ---------------------------------------------------------------------------

function renderSidebar(activeFeature) {
  const container = document.getElementById('fd-feat-list')
  if (!container || !state.kfaData) return

  // Sort descending by Effect_Size (positive first → negative last)
  const rows = state.kfaData.results.slice()
    .sort((a, b) => b.Effect_Size - a.Effect_Size)

  drawSidebarChart(container, rows, activeFeature, (feat) => {
    if (feat !== state.currentFeature) showFeatureDetail(feat)
  })
}

function drawSidebarChart(container, rows, activeFeature, onFeatureClick) {
  container.innerHTML = ''
  if (!rows.length) return

  const maxAbs   = Math.max(...rows.map(r => Math.abs(r.Effect_Size)), 1)
  const pad      = maxAbs * 0.06
  const margin   = { top: 2, right: 34, bottom: 20, left: 52 }
  const totalW   = Math.max(container.getBoundingClientRect().width || 220, 160)
  const w        = totalW - margin.left - margin.right
  const rowH     = 20
  const h        = rows.length * rowH
  const totalH   = h + margin.top + margin.bottom

  const x = d3.scaleLinear()
    .domain([-(maxAbs + pad), maxAbs + pad])
    .range([0, w])

  const y = d3.scaleBand()
    .domain(rows.map(r => r.Feature))
    .range([0, h])
    .padding(0.18)

  const svg = d3.select(container)
    .append('svg')
    .attr('width', totalW)
    .attr('height', totalH)
    .style('display', 'block')

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Row highlight for active feature (full width including margin)
  g.selectAll('.row-bg')
    .data(rows)
    .join('rect')
    .attr('class', 'row-bg')
    .attr('x', -margin.left)
    .attr('y', d => y(d.Feature) - (y.step() - y.bandwidth()) / 2)
    .attr('width', totalW)
    .attr('height', y.step())
    .attr('fill', d => d.Feature === activeFeature ? '#2c3040' : 'transparent')
    .style('cursor', 'pointer')
    .on('click', (_, d) => onFeatureClick(d.Feature))

  // Active feature left-border accent
  g.selectAll('.active-bar')
    .data(rows.filter(r => r.Feature === activeFeature))
    .join('rect')
    .attr('class', 'active-bar')
    .attr('x', -margin.left)
    .attr('y', d => y(d.Feature) - (y.step() - y.bandwidth()) / 2)
    .attr('width', 3)
    .attr('height', y.step())
    .attr('fill', '#e07b39')

  // Grid lines (behind bars)
  g.append('g')
    .attr('transform', `translate(0,${h})`)
    .call(d3.axisBottom(x).ticks(4).tickSize(-h).tickFormat(''))
    .call(sel => sel.select('.domain').remove())
    .call(sel => sel.selectAll('line').attr('stroke', '#2a2f3a').attr('stroke-dasharray', '3,2'))

  // Bars
  g.selectAll('.bar')
    .data(rows)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', d => x(Math.min(0, d.Effect_Size)))
    .attr('y', d => y(d.Feature))
    .attr('width', d => Math.max(0, Math.abs(x(d.Effect_Size) - x(0))))
    .attr('height', y.bandwidth())
    .attr('fill', d => d.Effect_Size >= 0 ? '#e07b39' : '#5b9cf6')
    .attr('rx', 2)
    .attr('opacity', d => d.Feature === activeFeature ? 1 : 0.72)
    .style('cursor', 'pointer')
    .on('click', (_, d) => onFeatureClick(d.Feature))

  // Zero line
  g.append('line')
    .attr('x1', x(0)).attr('x2', x(0))
    .attr('y1', 0).attr('y2', h)
    .attr('stroke', '#5a6070')
    .attr('stroke-width', 1.2)

  // X axis
  g.append('g')
    .attr('transform', `translate(0,${h})`)
    .call(d3.axisBottom(x).ticks(4).tickSize(4))
    .call(sel => sel.select('.domain').attr('stroke', '#363b4a'))
    .call(sel => sel.selectAll('text').attr('fill', '#8892a4').attr('font-size', '9px'))
    .call(sel => sel.selectAll('line').attr('stroke', '#363b4a'))

  // Y axis (feature names — click to switch)
  const yAxisG = g.append('g')
    .call(d3.axisLeft(y).tickSize(0))
    .call(sel => sel.select('.domain').remove())

  yAxisG.selectAll('.tick text')
    .attr('fill', d => d === activeFeature ? '#e07b39' : '#c8cdd9')
    .attr('font-size', '11px')
    .attr('font-weight', d => d === activeFeature ? '700' : '400')
    .attr('dx', '-4px')

  yAxisG.selectAll('.tick')
    .style('cursor', 'pointer')
    .on('click', (_, feat) => onFeatureClick(feat))

  // Value labels at bar end
  g.selectAll('.val-label')
    .data(rows)
    .join('text')
    .attr('class', 'val-label')
    .attr('x', d => d.Effect_Size >= 0 ? x(d.Effect_Size) + 3 : x(d.Effect_Size) - 3)
    .attr('y', d => y(d.Feature) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', d => d.Effect_Size >= 0 ? 'start' : 'end')
    .attr('fill', '#8892a4')
    .attr('font-size', '9px')
    .text(d => d.Effect_Size.toFixed(2))
}

// ---------------------------------------------------------------------------
// Main table: files ranked by feature value, with pagination
// ---------------------------------------------------------------------------

// Pagination state (reset on each new feature load)
let _fdAllFiles = []
let _fdPage     = 0

export function initFeatureDetail() {
  document.getElementById('btn-back-results')?.addEventListener('click', () => {
    showView('results')
  })

  document.getElementById('fd-perpage')?.addEventListener('change', () => {
    _fdPage = 0
    renderFileTable()
  })

  document.getElementById('fd-prev')?.addEventListener('click', () => {
    if (_fdPage > 0) { _fdPage--; renderFileTable() }
  })

  document.getElementById('fd-next')?.addEventListener('click', () => {
    const perPage = _getPerPage()
    const pages   = Math.ceil(_fdAllFiles.length / perPage)
    if (_fdPage < pages - 1) { _fdPage++; renderFileTable() }
  })
}

function _getPerPage() {
  return parseInt(document.getElementById('fd-perpage')?.value || '25', 10)
}

async function loadFileTable(feature) {
  const tbody = document.querySelector('#fd-table tbody')
  if (!tbody) return

  tbody.innerHTML = `<tr><td colspan="3" class="placeholder" style="padding:.75rem 1rem">Carregando…</td></tr>`
  document.getElementById('fd-count-label').textContent = ''
  document.getElementById('fd-page-label').textContent  = ''

  try {
    const { files } = await api.analysis.featureFiles(state.kfaC1, state.kfaC2, feature)
    _fdAllFiles = files
    _fdPage     = 0
    renderFileTable()
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="3" class="placeholder" style="padding:.75rem 1rem;color:var(--error)">Erro: ${e.message}</td></tr>`
  }
}

function renderFileTable() {
  const tbody  = document.querySelector('#fd-table tbody')
  if (!tbody) return

  const perPage = _getPerPage()
  const total   = _fdAllFiles.length
  const pages   = Math.max(1, Math.ceil(total / perPage))
  _fdPage       = Math.min(_fdPage, pages - 1)

  const slice = _fdAllFiles.slice(_fdPage * perPage, (_fdPage + 1) * perPage)

  // Count label
  document.getElementById('fd-count-label').textContent =
    total ? `${total} arquivo${total !== 1 ? 's' : ''}` : ''

  // Page label
  document.getElementById('fd-page-label').textContent =
    pages > 1 ? `${_fdPage + 1} / ${pages}` : ''

  // Prev / next state
  const btnPrev = document.getElementById('fd-prev')
  const btnNext = document.getElementById('fd-next')
  if (btnPrev) btnPrev.disabled = (_fdPage === 0)
  if (btnNext) btnNext.disabled = (_fdPage >= pages - 1)

  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="placeholder" style="padding:.75rem 1rem">Nenhum resultado.</td></tr>`
    return
  }

  tbody.innerHTML = slice.map(f => {
    const cls = f.corpus === state.kfaC1 ? 'fd-corpus1' : 'fd-corpus2'
    return `<tr>
      <td style="font-size:.8rem">${f.filename}</td>
      <td class="${cls}">${f.corpus}</td>
      <td>${f.value.toFixed(3)}</td>
    </tr>`
  }).join('')
}
