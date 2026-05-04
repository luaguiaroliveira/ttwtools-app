/**
 * chart.js — D3 horizontal bar chart.
 *
 * drawChart(wrapper, rows, opts)
 *   wrapper: HTMLElement — cleared and filled with an <svg>
 *   rows:    array of KFA result objects
 *   opts:    { metric, barHeight, c1, c2, palette }
 *
 * Pure function — no internal state, safe to call on every update.
 */

import * as d3 from 'd3'

// ---------------------------------------------------------------------------
// Palettes
// ---------------------------------------------------------------------------

/**
 * Each palette is a function (rows, metric) → string[]  (one color per row).
 * Export the metadata so the UI can build the <select> dynamically.
 */
export const PALETTES = {
  biber: {
    label: 'Biber (padrão)',
    fn: (rows, metric) => {
      const isEffect = metric === 'Effect_Size' || metric === 'd_biber' || metric === 'd_pond'
      return rows.map(r =>
        isEffect ? (r[metric] >= 0 ? '#e07b39' : '#5b9cf6') : '#e07b39'
      )
    },
  },
  tableau: {
    label: 'Tableau (10 cores)',
    fn: (rows) => rows.map((_, i) => d3.schemeTableau10[i % 10]),
  },
  pastel: {
    label: 'Pastel (Set3)',
    fn: (rows) => rows.map((_, i) => d3.schemeSet3[i % 12]),
  },
  paired: {
    label: 'Pareado',
    fn: (rows) => rows.map((_, i) => d3.schemePaired[i % 12]),
  },
  vivid: {
    label: 'Vívido',
    fn: (rows) => {
      const c = ['#e63946','#f4a261','#2a9d8f','#457b9d','#e9c46a',
                 '#6a4c93','#1982c4','#8ac926','#ff595e','#ffca3a',
                 '#9b5de5','#52b788']
      return rows.map((_, i) => c[i % c.length])
    },
  },
  accessible: {
    label: 'Acessível (Okabe-Ito)',
    fn: (rows) => {
      // 8-color Okabe-Ito palette — safe for the three most common color vision deficiencies
      const c = ['#E69F00','#56B4E9','#009E73','#F0E442',
                 '#0072B2','#D55E00','#CC79A7','#555555']
      return rows.map((_, i) => c[i % c.length])
    },
  },
}

export function drawChart(wrapper, rows, { metric, barHeight, c1 = '', c2 = '', palette = 'biber', tagDefs = {}, onBarClick = null }) {
  wrapper.innerHTML = ''

  if (!rows || rows.length === 0) return

  // Tooltip div (shared, appended to wrapper)
  const tip = document.createElement('div')
  tip.className = 'chart-tooltip'
  wrapper.appendChild(tip)

  function showTip(event, d) {
    const def = tagDefs[d.Feature]
    if (!def) return
    const val = typeof d[metric] === 'number'
      ? (Number.isInteger(d[metric]) ? d[metric] : d[metric].toFixed(3))
      : d[metric]
    tip.innerHTML = `<strong>${d.Feature}</strong>: ${def}<br><span class="tip-val">${metric.replace(/_/g,' ')}: ${val}</span>`
    tip.style.display = 'block'
    moveTip(event)
  }

  function moveTip(event) {
    const rect = wrapper.getBoundingClientRect()
    const mx = event.clientX - rect.left
    const my = event.clientY - rect.top
    const tipW = tip.offsetWidth || 260
    const left = mx + 14 + tipW > rect.width ? mx - tipW - 8 : mx + 14
    tip.style.left = left + 'px'
    tip.style.top  = (my - 10) + 'px'
  }

  function hideTip() { tip.style.display = 'none' }

  // Read computed colors from probe elements — SVG needs rgb() not oklch()
  const _probe = document.createElement('span')
  _probe.className = 'text-base-content'
  _probe.style.cssText = 'position:absolute;opacity:0;pointer-events:none'
  document.body.appendChild(_probe)  // attach to body, not hidden wrapper, to ensure computed styles work
  const _rawBcColor = getComputedStyle(_probe).color
  document.body.removeChild(_probe)
  // Fallback based on current theme if probe returns transparent or empty
  const _isDarkTheme = document.documentElement.dataset.theme !== 'ttwlight'
  const _fallbackColor = _isDarkTheme ? 'rgb(220, 218, 230)' : 'rgb(30, 30, 40)'
  const _bcColor = (_rawBcColor && _rawBcColor !== 'rgba(0, 0, 0, 0)' && _rawBcColor !== 'rgba(0,0,0,0)')
    ? _rawBcColor : _fallbackColor

  // Convert rgb(...) → rgba(..., alpha) for lines/grid
  const _rgba = (rgb, a) => rgb.startsWith('rgb(')
    ? rgb.replace('rgb(', 'rgba(').replace(')', `, ${a})`)
    : rgb
  const _axisLineColor = _rgba(_bcColor, 0.20)
  const _gridLineColor = _rgba(_bcColor, 0.10)

  const isEffect = metric === 'Effect_Size' || metric === 'd_biber' || metric === 'd_pond'
  const margin   = { top: 6, right: 28, bottom: 32, left: 170 }
  const totalW   = Math.max(wrapper.getBoundingClientRect().width || 600, 320)
  const w        = totalW - margin.left - margin.right
  const rowH     = barHeight + 4
  const h        = rows.length * rowH
  const totalH   = h + margin.top + margin.bottom

  const svg = d3.select(wrapper)
    .append('svg')
    .attr('width',  totalW)
    .attr('height', totalH)
    .style('display', 'block')
    .style('overflow', 'visible')

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Scales
  const values = rows.map(r => r[metric])
  const valMin = d3.min(values) ?? 0
  const valMax = d3.max(values) ?? 1
  const xMin   = isEffect ? Math.min(valMin, 0) : 0
  const xMax   = Math.max(valMax, 0)
  const pad    = Math.max((xMax - xMin) * 0.04, 0.02)

  const x = d3.scaleLinear()
    .domain([xMin - pad, xMax + pad])
    .range([0, w])

  const y = d3.scaleBand()
    .domain(rows.map(r => r.Feature))
    .range([0, h])
    .padding(0.18)

  // Palette colors (one per row)
  const paletteColors = (PALETTES[palette] || PALETTES.biber).fn(rows, metric)

  // Grid lines (vertical, behind bars)
  g.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0,${h})`)
    .call(
      d3.axisBottom(x)
        .ticks(6)
        .tickSize(-h)
        .tickFormat('')
    )
    .call(sel => sel.select('.domain').remove())
    .call(sel => sel.selectAll('line')
      .attr('stroke', _gridLineColor)
      .attr('stroke-dasharray', '3,3'))

  // Bars
  g.selectAll('.bar')
    .data(rows)
    .join('rect')
    .attr('class', 'bar')
    .attr('x',      d => x(Math.min(0, d[metric])))
    .attr('y',      d => y(d.Feature))
    .attr('width',  d => Math.max(0, Math.abs(x(d[metric]) - x(0))))
    .attr('height', y.bandwidth())
    .attr('fill',   (_, i) => paletteColors[i])
    .attr('rx', 3)
    .attr('opacity', 0.88)
    .style('cursor', d => onBarClick ? 'pointer' : (tagDefs[d.Feature] ? 'help' : 'default'))
    .on('mouseover', (event, d) => { showTip(event, d); d3.select(event.currentTarget).attr('opacity', 1) })
    .on('mousemove', (event)    => { moveTip(event) })
    .on('mouseout',  (event)    => { hideTip();        d3.select(event.currentTarget).attr('opacity', 0.88) })
    .on('click',     (event, d) => { if (onBarClick) onBarClick(d) })

  // Zero line
  if (xMin < 0 || (isEffect && valMax > 0 && valMin < 0)) {
    g.append('line')
      .attr('x1', x(0)).attr('x2', x(0))
      .attr('y1', 0).attr('y2', h)
      .attr('stroke', _axisLineColor)
      .attr('stroke-width', 1.5)
  }

  // X axis
  g.append('g')
    .attr('transform', `translate(0,${h})`)
    .call(d3.axisBottom(x).ticks(6).tickSize(4))
    .call(sel => sel.select('.domain').attr('stroke', _axisLineColor))
    .call(sel => sel.selectAll('text').attr('fill', _bcColor).attr('font-size', '11px'))
    .call(sel => sel.selectAll('line').attr('stroke', _axisLineColor))

  // Y axis
  const yAxisG = g.append('g')
    .call(d3.axisLeft(y).tickSize(3))
    .call(sel => sel.select('.domain').attr('stroke', _axisLineColor))
    .call(sel => sel.selectAll('line').attr('stroke', _axisLineColor))

  yAxisG.selectAll('.tick text')
    .attr('fill', _bcColor)
    .attr('font-size', '11px')
    .attr('dy', '0.32em')

  // Tooltip on y-axis tick labels (feature names)
  yAxisG.selectAll('.tick')
    .style('cursor', feat => onBarClick ? 'pointer' : (tagDefs[feat] ? 'help' : 'default'))
    .on('click',     (event, feat) => {
      if (onBarClick) {
        const row = rows.find(r => r.Feature === feat)
        if (row) onBarClick(row)
      }
    })
    .on('mouseover', (event, feat) => {
      const row = rows.find(r => r.Feature === feat)
      if (row) showTip(event, row)
    })
    .on('mousemove', (event) => moveTip(event))
    .on('mouseout', () => hideTip())
}
