/**
 * views/results.js — KFA results: D3 bar chart + sortable table + novas visualizações.
 * Supports two instances: inline (step-3 in quickrun) and standalone (#view-results).
 */

import { api }              from '../api.js'
import { showToast }        from '../ui.js'
import { state }            from '../state.js'
import { drawChart, PALETTES } from '../chart.js'
import { showFeatureDetail } from './feature-detail.js'
import { renderScatter, renderBubble, renderStrip, renderHeatmapComparison } from './viz-comparison.js'
import { renderRadar, renderViolin } from './viz-single.js'
import { initReduction, setReductionReady } from './viz-reduction.js'
import { showTextViewer } from './text-viewer.js'

// Column definitions
const COLS = [
  { key: 'Feature',      label: () => 'Feature' },
  { key: 'd_biber',      label: () => 'd (KFA-Biber)' },
  { key: 'd_pond',       label: () => 'd (KFA-pond)' },
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
  if (state.minEffect) rows = rows.filter(r => {
    const val = state.sortCol === 'd_pond' ? r.d_pond : r.d_biber
    return val != null && Math.abs(val) >= state.minEffect
  })
  rows.sort((a, b) => {
    const av = a[state.sortCol], bv = b[state.sortCol]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
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

function _fmt(v) { return v != null ? v.toFixed(3) : '—' }

function renderTableIn(suffix) {
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
      // sync chart metric when sorting by an effect size column
      if (col === 'd_biber' || col === 'd_pond') {
        state.chartMetric = col
        const sfxEl = suffix ? '-' + suffix : ''
        const sel = document.getElementById(`chart-metric${sfxEl}`)
        if (sel) sel.value = col
      }
      renderTableIn(suffix); renderChartIn(suffix)
    })
  })

  const rows = visibleRows()
  const tbody = document.querySelector(`#${tableId} tbody`)
  if (!tbody) return
  tbody.innerHTML = rows.map(r => {
    const clsB = r.d_biber != null ? (r.d_biber >= 0 ? 'effect-positive' : 'effect-negative') : ''
    const clsP = r.d_pond  != null ? (r.d_pond  >= 0 ? 'effect-positive' : 'effect-negative') : ''
    const def  = state.tagDefs[r.Feature]
    const title = def ? ` title="${def.replace(/"/g, "'")}"` : ''
    return `<tr>
      <td class="feature-link" data-feature="${r.Feature}"${title}>${r.Feature}</td>
      <td class="${clsB}">${_fmt(r.d_biber)}</td>
      <td class="${clsP}">${_fmt(r.d_pond)}</td>
      <td>${_fmt(r.Mean_Corpus1)}</td>
      <td>${_fmt(r.Mean_Corpus2)}</td>
      <td>${_fmt(r.Std_Corpus1)}</td>
      <td>${_fmt(r.Std_Corpus2)}</td>
      <td>${r.N_Corpus1 ?? '—'}</td>
      <td>${r.N_Corpus2 ?? '—'}</td>
    </tr>`
  }).join('')
}

function renderResultsIn(suffix) {
  const cc = document.getElementById(_id('chart-container', suffix))
  if (cc) cc.classList.remove('hidden')
  _applyBarchartView(suffix)
  renderChartIn(suffix)
  renderTableIn(suffix)
  // Render the active Plotly visualization (only standalone has tabs)
  if (suffix) {
    setReductionReady(suffix, true)
    // Populate histogram feature selector (sorted by |d_biber|, matching rawData fetch order)
    const sfx = suffix ? `-${suffix}` : ''
    const featSel = document.getElementById(`histogram-feature-sel${sfx}`)
    if (featSel) {
      const rows = state.kfaData?.results || []
      const topFeats = rows
        .slice()
        .sort((a, b) => Math.abs(b.d_biber ?? 0) - Math.abs(a.d_biber ?? 0))
        .slice(0, state.topN)
        .map(r => r.Feature)
        .filter(Boolean)
      featSel.innerHTML = topFeats.map(f => `<option value="${f}">${f}</option>`).join('')
      state.histogramFeature = topFeats[0] || null
    }
    requestAnimationFrame(() => _renderActiveViz(suffix))
  }
}

// ── Merge two KFA result arrays by Feature ──────────────────────────────────
function _mergeMetrics(biber, pond) {
  const byFeature = {}
  ;(biber || []).forEach(r => { byFeature[r.Feature] = { ...r, d_biber: r.Effect_Size } })
  ;(pond  || []).forEach(r => {
    if (byFeature[r.Feature]) {
      byFeature[r.Feature].d_pond = r.Effect_Size
    } else {
      byFeature[r.Feature] = { ...r, d_pond: r.Effect_Size }
    }
  })
  return Object.values(byFeature)
}

// ── Load a KFA result and display in a given suffix context ─────────────────
async function loadKfa(optStr, suffix) {
  const { c1, c2, d, join, tagger, analysis_name, features_meta } = JSON.parse(optStr)
  try {
    // Fetch both metrics in parallel; gracefully handle missing ones
    const [rBiber, rPond] = await Promise.allSettled([
      api.analysis.getKfa(c1, c2, d || 0, join, tagger, analysis_name, 'kfa'),
      api.analysis.getKfa(c1, c2, d || 0, join, tagger, analysis_name, 'kfa2'),
    ])
    const biberResults = rBiber.status === 'fulfilled' ? rBiber.value.results : null
    const pondResults  = rPond.status  === 'fulfilled' ? rPond.value.results  : null

    if (!biberResults && !pondResults) {
      showToast('Nenhum resultado KFA encontrado.', 'error'); return
    }

    const merged = _mergeMetrics(biberResults, pondResults)
    state.kfaData     = { results: merged }
    state.rawData     = null   // invalidate rawdata cache for new KFA result
    // invalidate heatmap caches
    delete state[`heatmap_${c1}`]
    delete state[`heatmap_${c2}`]
    Object.keys(state).filter(k => k.startsWith('heatmap_combined_')).forEach(k => delete state[k])
    state.kfaC1       = c1
    state.kfaC2       = c2
    state.kfaTagger   = tagger || null
    updateActiveTaggerBadge(state.kfaTagger)
    state.sortCol     = 'd_biber'
    state.sortDir     = -1
    state.filter      = ''
    state.minEffect   = 0
    state.chartMetric = 'd_biber'

    const sfx = suffix ? '-' + suffix : ''
    const filterEl = document.getElementById(`results-filter${sfx}`)
    const metricEl = document.getElementById(`chart-metric${sfx}`)
    const minDEl   = document.getElementById(`results-min-d${sfx}`)
    if (filterEl) filterEl.value = ''
    if (metricEl) metricEl.value = 'd_biber'
    if (minDEl)   minDEl.value   = '0'

    // Populate info box
    const infoName  = document.getElementById(`results-info-name${sfx}`)
    const infoTagg  = document.getElementById(`results-info-tagger${sfx}`)
    const infoFeats = document.getElementById(`results-info-features${sfx}`)
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
export function _taggerLabel(t) {
  const map = { biberplus:'BiberPlus', mfte:'MFTE', mfte_ext:'MFTE Estendido',
    stanza_upos:'Stanza UPOS', stanza_xpos:'Stanza XPOS',
    spacy_upos:'spaCy UPOS', spacy_ptb:'spaCy PTB' }
  return map[t] || t
}

/** Update the persistent active-tagger badge in the menubar */
export function updateActiveTaggerBadge(tagger) {
  const badge = document.getElementById('active-tagger-badge')
  const label = document.getElementById('active-tagger-label')
  if (!badge || !label) return
  if (tagger) {
    label.textContent = _taggerLabel(tagger)
    badge.classList.remove('hidden')
  } else {
    badge.classList.add('hidden')
  }
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

  // Group by analysis_name — one item per unique name (metrics merged on load)
  const byName = {}
  analyses.forEach(r => {
    const n = r.analysis_name || 'default'
    if (!byName[n]) byName[n] = { ...r, _metrics: [] }
    byName[n]._metrics.push(r.metric || 'kfa2')
  })
  const uniqueAnalyses = Object.values(byName)

  list.innerHTML = ''
  uniqueAnalyses.forEach((r, i) => {
    const name = r.analysis_name || 'default'
    const fm   = Array.isArray(r.features_meta) ? r.features_meta : []
    const tagsLabel = fm.length > 0 ? `${fm.length} tags` : 'todos'
    const tagsDetail = fm.length > 0
      ? fm.slice(0, 15).join(', ') + (fm.length > 15 ? `… (+${fm.length - 15})` : '')
      : 'Todos os tags incluídos'
    const hasB = r._metrics.includes('kfa')
    const hasP = r._metrics.includes('kfa2')
    const metricBadges = [
      hasB ? '<span class="badge badge-xs badge-outline">KFA-Biber</span>' : '',
      hasP ? '<span class="badge badge-xs badge-outline">KFA-pond</span>'  : '',
    ].filter(Boolean).join(' ')

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
      <span class="analysis-item-name" title="${name}">${name} ${metricBadges}</span>
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

// ── Apply barchart view mode (chart | both | table) ────────────────────────
function _applyBarchartView(suffix) {
  const sfx = suffix ? '-' + suffix : ''
  const chartWrap = document.getElementById(`chart-wrapper${sfx}`)
  const tableWrap = document.getElementById(`table-container${sfx}`)
  const divider   = document.getElementById(`barchart-divider${sfx}`)
  const v = state.barchartView
  if (chartWrap) chartWrap.style.display = (v === 'table')  ? 'none' : ''
  if (tableWrap) tableWrap.style.display  = (v === 'chart')  ? 'none' : ''
  if (divider)   divider.style.display    = (v === 'both')   ? '' : 'none'
  // If just showed chart, re-render (was hidden, width was 0)
  if (v !== 'table' && state.kfaData) requestAnimationFrame(() => renderChartIn(suffix))
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

  // Chart metric selector — re-render chart AND re-sort table by same metric
  document.getElementById(`chart-metric${sfx}`)?.addEventListener('change', e => {
    state.chartMetric = e.target.value
    // Also update table sort column so both stay in sync
    if (['d_biber', 'd_pond', 'Mean_Corpus1', 'Mean_Corpus2', 'Std_Corpus1', 'Std_Corpus2', 'N_Corpus1', 'N_Corpus2'].includes(e.target.value)) {
      state.sortCol = e.target.value
      state.sortDir = -1
    }
    if (state.kfaData) { renderChartIn(suffix); renderTableIn(suffix) }
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

  // Barchart view toggle (chart | both | table)
  const viewToggle = document.getElementById(`barchart-view-toggle${sfx}`)
  if (viewToggle) {
    viewToggle.addEventListener('click', e => {
      const btn = e.target.closest('button[data-view]')
      if (!btn) return
      state.barchartView = btn.dataset.view
      viewToggle.querySelectorAll('button').forEach(b => b.classList.toggle('btn-active', b === btn))
      _applyBarchartView(suffix)
    })
  }

  // Barchart drag-resize divider
  const divider = document.getElementById(`barchart-divider${sfx}`)
  const chartWrap = document.getElementById(`chart-wrapper${sfx}`)
  const tableWrap = document.getElementById(`table-container${sfx}`)
  if (divider && chartWrap && tableWrap) {
    let dragging = false, startX = 0, startCW = 0, startTW = 0
    divider.addEventListener('pointerdown', e => {
      dragging = true
      startX = e.clientX
      startCW = chartWrap.getBoundingClientRect().width
      startTW = tableWrap.getBoundingClientRect().width
      divider.setPointerCapture(e.pointerId)
      e.preventDefault()
    })
    divider.addEventListener('pointermove', e => {
      if (!dragging) return
      const dx = e.clientX - startX
      const totalW = startCW + startTW
      const newCW = Math.max(120, Math.min(totalW - 120, startCW + dx))
      chartWrap.style.flex = `${newCW} 0 0`
      tableWrap.style.flex = `${totalW - newCW} 0 0`
    })
    divider.addEventListener('pointerup', () => { dragging = false })
  }

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

  // ResizeObserver — re-render when chart-wrapper changes width
  // (the wrapper flexes when the table is shown/hidden alongside it)
  const chartWrapperEl = document.getElementById(`chart-wrapper${sfx}`)
  if (chartWrapperEl) {
    let _prevW = 0
    const ro = new ResizeObserver(entries => {
      const newW = entries[0].contentRect.width
      if (Math.abs(newW - _prevW) > 2) { _prevW = newW; if (state.kfaData) renderChartIn(suffix) }
    })
    ro.observe(chartWrapperEl)
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
  state.rawData = null   // invalidate rawdata cache
  // invalidate heatmap caches
  delete state[`heatmap_${c1}`]
  delete state[`heatmap_${c2}`]
  Object.keys(state).filter(k => k.startsWith('heatmap_combined_')).forEach(k => delete state[k])
  updateActiveTaggerBadge(state.kfaTagger)
  state.sortCol = 'Effect_Size'; state.sortDir = -1
  state.filter = ''; state.minEffect = 0; state.chartMetric = 'Effect_Size'
  renderResultsIn(null)  // inline = no suffix
}

// ── Render the active viz in the current tab ─────────────────────────────────

/**
 * Loads rawdata from the backend (once per KFA result) and caches in state.rawData.
 * Calls `onReady(rawData)` when data is available.
 */
function _withRawData(suffix, onReady) {
  if (state.rawData) { onReady(state.rawData); return }

  const tagger1 = state.kfaTagger || null
  const tagger2 = state.kfaTagger || null

  // Build features list from kfa results to keep payload small
  const rows = state.kfaData?.results || []
  const topFeatures = rows
    .slice()
    .sort((a, b) => Math.abs(b.d_biber ?? 0) - Math.abs(a.d_biber ?? 0))
    .slice(0, Math.max(state.topN * 2, 40))   // fetch 2× topN as buffer
    .map(r => r.Feature)

  api.viz.rawdata(state.kfaC1, state.kfaC2, tagger1, tagger2, topFeatures)
    .then(data => {
      state.rawData = data
      // Sync histogram feature selector to actual rawData features
      const sfx = suffix ? `-${suffix}` : ''
      const featSel = document.getElementById(`histogram-feature-sel${sfx}`)
      if (featSel && data.features?.length) {
        const current = state.histogramFeature
        featSel.innerHTML = data.features.map(f => `<option value="${f}">${f}</option>`).join('')
        // Keep current selection if it's still available, else default to first
        if (current && data.features.includes(current)) featSel.value = current
        else state.histogramFeature = data.features[0] || null
      }
      onReady(data)
    })
    .catch(err => {
      showToast(`Erro ao carregar dados brutos: ${err.message}`, 'error')
    })
}

function _withHeatmapData(suffix, corpusKey, onReady) {
  const corpus = corpusKey === 'c1' ? state.kfaC1 : state.kfaC2
  const cacheKey = `heatmap_${corpus}`
  if (state[cacheKey]) { onReady(state[cacheKey]); return }

  api.viz.heatmap(corpus, state.kfaTagger, state.topN)
    .then(data => {
      state[cacheKey] = data
      onReady(data)
    })
    .catch(err => {
      showToast(`Erro ao carregar heatmap: ${err.message}`, 'error')
    })
}

function _withCombinedHeatmapData(suffix, onReady) {
  const cacheKey = `heatmap_combined_${state.kfaC1}_${state.kfaC2}_${state.topN}`
  if (state[cacheKey]) { onReady(state[cacheKey]); return }

  api.viz.heatmapCombined(state.kfaC1, state.kfaC2, state.kfaTagger, state.topN)
    .then(data => {
      state[cacheKey] = data
      onReady(data)
    })
    .catch(err => {
      showToast(`Erro ao carregar heatmap comparativo: ${err.message}`, 'error')
    })
}

// ── Open text viewer from a point click in rawdata charts ───────────────────
function _openTextFromPoint(filename, corpusName, featureName) {
  if (!filename) return
  // Build a minimal file list from rawData so the viewer can navigate
  const rd = state.rawData
  if (!rd) return
  const files = [
    ...(rd.corpus1?.docs ?? []).map(d => ({ filename: d.filename, corpus: state.kfaC1 })),
    ...(rd.corpus2?.docs ?? []).map(d => ({ filename: d.filename, corpus: state.kfaC2 })),
  ]
  const idx = files.findIndex(f => f.filename === filename &&
    (corpusName ? f.corpus === corpusName : true))
  if (idx >= 0) showTextViewer(files, idx, featureName || null, 'results')
}

function _renderActiveViz(suffix) {
  // Only the standalone view has the extra tabs
  if (!suffix) return

  const rows = state.kfaData?.results || []
  const c1 = state.kfaC1, c2 = state.kfaC2

  const tab = state.activeResultsTab
  if (tab === 'comparison') {
    const viz = state.compViz
    if (viz === 'scatter') {
      renderScatter(suffix, rows, state.topN, c1, c2)
    } else if (viz === 'bubble') {
      renderBubble(suffix, rows, state.topN, state.bubbleSizeEnc, c1, c2)
    } else if (viz === 'strip') {
      _withRawData(suffix, rd => renderStrip(suffix, rd, rows, state.topN, c1, c2, _openTextFromPoint))
    } else if (viz === 'heatmap') {
      _withCombinedHeatmapData(suffix, hd => renderHeatmapComparison(suffix, hd))
    }
  } else if (tab === 'single') {
    if (state.singleViz === 'radar') {
      renderRadar(suffix, rows, state.topN, state.radarBoth, c1, c2, state.singleCorpus)
    } else if (state.singleViz === 'violin') {
      _withRawData(suffix, rd => renderViolin(suffix, rd, rows, state.topN, c1, c2))
    }
  }
}

// ── Tab switching helpers ────────────────────────────────────────────────────

/**
 * Switch the main results tab (comparison | single | reduction).
 * Scoped to one suffix so inline and standalone don't interfere.
 */
function _switchMainTab(suffix, tabName) {
  const sfx = suffix ? `-${suffix}` : ''

  // Update tab buttons
  const tabBar = document.getElementById(`res-tabs${sfx}`)
  tabBar?.querySelectorAll('.res-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName)
  })

  // Show/hide panels
  const panelIds = ['comparison', 'single', 'reduction']
  panelIds.forEach(id => {
    const panel = document.getElementById(`res-panel-${id}${sfx}`)
    if (panel) panel.classList.toggle('active', id === tabName)
  })

  state.activeResultsTab = tabName
  _renderActiveViz(suffix)
}

/**
 * Switch a sub-tab within a given group (comp-subtabs | single-subtabs).
 */
function _switchSubtab(subtabsId, panelPrefix, vizName) {
  const bar = document.getElementById(subtabsId)
  bar?.querySelectorAll('.viz-subtab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.viz === vizName)
  })

  // Show/hide viz subpanels based on the active sub-tab bar
  // Panels are siblings of the subtabs bar — find them by ID convention
  const container = bar?.closest('.res-tab-panel')
  if (!container) return

  container.querySelectorAll('.viz-subpanel').forEach(panel => {
    panel.classList.remove('active')
  })
  const active = document.getElementById(`${panelPrefix}-${vizName}-${subtabsId.includes('standalone') ? 'standalone' : ''}`)
  if (active) active.classList.add('active')
}

// ── Bind tab controls for standalone view ────────────────────────────────────
function _bindTabControls(suffix) {
  if (!suffix) return   // inline step-3 has no tabs

  const sfx = `-${suffix}`

  // ── Main tabs ──
  document.getElementById(`res-tabs${sfx}`)?.addEventListener('click', e => {
    const tab = e.target.closest('.res-tab')
    if (!tab || tab.disabled) return
    _switchMainTab(suffix, tab.dataset.tab)
  })

  // ── Comparison sub-tabs ──
  document.getElementById(`comp-subtabs${sfx}`)?.addEventListener('click', e => {
    const btn = e.target.closest('.viz-subtab')
    if (!btn || btn.disabled) return
    const viz = btn.dataset.viz
    state.compViz = viz

    const bar = document.getElementById(`comp-subtabs${sfx}`)
    bar?.querySelectorAll('.viz-subtab').forEach(b => b.classList.toggle('active', b.dataset.viz === viz))

    document.querySelectorAll(`#res-panel-comparison${sfx} .viz-subpanel`).forEach(p => p.classList.remove('active'))
    document.getElementById(`comp-viz-${viz}${sfx}`)?.classList.add('active')

    _renderActiveViz(suffix)
  })

  // ── Single corpus sub-tabs ──
  document.getElementById(`single-subtabs${sfx}`)?.addEventListener('click', e => {
    const btn = e.target.closest('.viz-subtab')
    if (!btn || btn.disabled) return
    const viz = btn.dataset.viz
    state.singleViz = viz

    const bar = document.getElementById(`single-subtabs${sfx}`)
    bar?.querySelectorAll('.viz-subtab').forEach(b => b.classList.toggle('active', b.dataset.viz === viz))

    document.querySelectorAll(`#res-panel-single${sfx} .viz-subpanel`).forEach(p => p.classList.remove('active'))
    document.getElementById(`single-viz-${viz}${sfx}`)?.classList.add('active')

    _renderActiveViz(suffix)
  })

  // ── Top-N control ──
  document.getElementById(`results-topn${sfx}`)?.addEventListener('change', e => {
    state.topN = Math.max(5, parseInt(e.target.value, 10) || 20)
    state.rawData = null   // invalidate rawdata cache (topN changed)
    delete state[`heatmap_${state.kfaC1}`]
    delete state[`heatmap_${state.kfaC2}`]
    _renderActiveViz(suffix)
  })

  // ── Corpus selector (individual tab) ──
  document.getElementById(`single-corpus-sel${sfx}`)?.addEventListener('change', e => {
    state.singleCorpus = e.target.value
    _renderActiveViz(suffix)
  })

  // ── Radar "Sobrepor ambos" toggle ──
  document.getElementById(`radar-both${sfx}`)?.addEventListener('change', e => {
    state.radarBoth = e.target.checked
    _renderActiveViz(suffix)
  })

  // ── Bubble size encoding ──
  document.getElementById(`bubble-size-enc${sfx}`)?.addEventListener('change', e => {
    state.bubbleSizeEnc = e.target.value
    _renderActiveViz(suffix)
  })

  // ── Histogram feature selector — REMOVED (histograma retirado) ──

  // Heatmap combinado: sem seletor de corpus (ambos exibidos juntos)

  // ── MutationObserver: re-render when standalone view becomes active ──
  const viewEl = document.getElementById('view-results')
  if (viewEl) {
    const mo = new MutationObserver(() => {
      if (viewEl.classList.contains('active') && state.kfaData) {
        requestAnimationFrame(() => _renderActiveViz(suffix))
      }
    })
    mo.observe(viewEl, { attributes: true, attributeFilter: ['class'] })
  }
}

export function initResults() {
  // Standalone view
  _bindControls('standalone')
  _bindTabControls('standalone')
  initReduction('standalone')
  // Inline step-3 panel (no suffix)
  _bindControls(null)
}
