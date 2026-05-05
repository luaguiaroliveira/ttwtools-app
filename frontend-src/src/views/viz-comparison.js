/**
 * viz-comparison.js — Visualizações da aba "Comparação"
 *
 * Implementado:
 *   - renderScatter(suffix, rows, topN)  — Scatter C1×C2, cor = d_biber
 *   - renderBubble(suffix, rows, topN, sizeEncoding) — Bubble chart
 *   - renderStrip(suffix, rawData, rows, topN) — Strip/jitter por feature
 *
 * Em desenvolvimento:
 *   - Parallel coordinates (requer estruturação adicional de dados)
 */

import Plotly from 'plotly.js-dist-min'

// ── Constantes de cor (alinhadas com o resto da app) ─────────────────────────
const C1_COLOR = '#e07b39'   // laranja corpus 1
const C2_COLOR = '#5b9cf6'   // azul corpus 2

// ── Helpers ──────────────────────────────────────────────────────────────────

function _theme() {
  const dark = document.documentElement.dataset.theme !== 'ttwlight'
  return {
    paper_bgcolor: dark ? '#1e2232' : '#ffffff',
    plot_bgcolor:  dark ? '#1e2232' : '#f8f9fb',
    font_color:    dark ? '#cdd1e0' : '#1a1c26',
    grid_color:    dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    zero_color:    dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)',
  }
}

/**
 * Ordena por |d_biber| e retorna as top-N features.
 */
function _topN(rows, n) {
  if (!rows || rows.length === 0) return []
  return rows
    .slice()
    .sort((a, b) => Math.abs(b.d_biber ?? 0) - Math.abs(a.d_biber ?? 0))
    .slice(0, n)
}

/** Configuração padrão do modebar Plotly (sem logo, sem editar) */
const PLOTLY_CONFIG = {
  displaylogo: false,
  responsive: true,
  modeBarButtonsToRemove: ['sendDataToCloud', 'editInChartStudio', 'lasso2d'],
}

// ── Scatter C1×C2 ─────────────────────────────────────────────────────────────

/**
 * Renderiza o scatter de médias (Corpus 1 × Corpus 2).
 *
 * @param {string} suffix  — 'standalone' ou '' (inline)
 * @param {Array}  rows    — state.kfaData.results
 * @param {number} topN    — máximo de features a exibir
 * @param {string} c1Name  — nome do corpus 1
 * @param {string} c2Name  — nome do corpus 2
 */
export function renderScatter(suffix, rows, topN = 20, c1Name = 'Corpus 1', c2Name = 'Corpus 2') {
  const el = document.getElementById(`plotly-scatter-${suffix}`)
  if (!el) return

  const r = _topN(rows, topN)
  if (r.length === 0) {
    el.innerHTML = '<p class="p-6 text-sm text-center opacity-50">Sem dados. Selecione uma análise KFA primeiro.</p>'
    return
  }

  const t = _theme()
  const dVals = r.map(x => x.d_biber ?? 0)
  const maxD  = Math.max(...dVals.map(Math.abs), 0.01)

  const xVals = r.map(x => x.Mean_Corpus1 ?? 0)
  const yVals = r.map(x => x.Mean_Corpus2 ?? 0)
  const allVals = [...xVals, ...yVals]
  const minV = Math.min(...allVals)
  const maxV = Math.max(...allVals)
  const pad  = (maxV - minV) * 0.05

  const trace = {
    x: xVals,
    y: yVals,
    mode: 'markers+text',
    type: 'scatter',
    text: r.map(x => x.Feature),
    textposition: 'top center',
    textfont: { size: 9, color: t.font_color },
    marker: {
      size: 9,
      color: dVals,
      colorscale: [
        [0,   C2_COLOR],
        [0.5, '#9da3b4'],
        [1,   C1_COLOR],
      ],
      cmin: -maxD,
      cmax:  maxD,
      colorbar: {
        title: { text: 'd (Biber)', side: 'right', font: { size: 10, color: t.font_color } },
        thickness: 12,
        len: 0.65,
        tickfont: { size: 9, color: t.font_color },
        outlinewidth: 0,
      },
      line: { width: 0.5, color: 'rgba(0,0,0,0.25)' },
    },
    customdata: r.map(x => ({
      feature: x.Feature,
      d: (x.d_biber ?? 0).toFixed(3),
      m1: (x.Mean_Corpus1 ?? 0).toFixed(3),
      m2: (x.Mean_Corpus2 ?? 0).toFixed(3),
      sd1: (x.Std_Corpus1 ?? 0).toFixed(3),
      sd2: (x.Std_Corpus2 ?? 0).toFixed(3),
    })),
    hovertemplate:
      '<b>%{customdata.feature}</b><br>' +
      `${c1Name}: %{customdata.m1} (DP %{customdata.sd1})<br>` +
      `${c2Name}: %{customdata.m2} (DP %{customdata.sd2})<br>` +
      'd (Biber): %{customdata.d}' +
      '<extra></extra>',
  }

  const layout = {
    paper_bgcolor: t.paper_bgcolor,
    plot_bgcolor:  t.plot_bgcolor,
    font: { color: t.font_color, family: 'inherit', size: 11 },
    xaxis: {
      title: { text: `Média — ${c1Name}`, font: { size: 10 } },
      gridcolor: t.grid_color,
      zerolinecolor: t.zero_color,
      tickfont: { size: 9 },
      range: [minV - pad, maxV + pad],
    },
    yaxis: {
      title: { text: `Média — ${c2Name}`, font: { size: 10 } },
      gridcolor: t.grid_color,
      zerolinecolor: t.zero_color,
      tickfont: { size: 9 },
      range: [minV - pad, maxV + pad],
    },
    shapes: [{
      type: 'line',
      x0: minV - pad, y0: minV - pad,
      x1: maxV + pad, y1: maxV + pad,
      line: { color: 'rgba(160,160,160,0.35)', dash: 'dot', width: 1.2 },
    }],
    annotations: [{
      x: maxV + pad * 0.6,
      y: maxV + pad * 0.6,
      xref: 'x', yref: 'y',
      text: 'y = x',
      showarrow: false,
      font: { size: 8, color: t.font_color + '60' },
    }],
    margin: { l: 55, r: 90, t: 20, b: 55 },
    height: 480,
    hovermode: 'closest',
  }

  Plotly.react(el, [trace], layout, PLOTLY_CONFIG)
}

// ── Bubble chart ──────────────────────────────────────────────────────────────

/**
 * Renderiza o bubble chart (scatter + tamanho como terceira dimensão).
 *
 * @param {string} sizeEncoding — 'std' (DP médio) | 'n' (N total de textos)
 */
export function renderBubble(suffix, rows, topN = 20, sizeEncoding = 'std', c1Name = 'Corpus 1', c2Name = 'Corpus 2') {
  const el = document.getElementById(`plotly-bubble-${suffix}`)
  if (!el) return

  const r = _topN(rows, topN)
  if (r.length === 0) {
    el.innerHTML = '<p class="p-6 text-sm text-center opacity-50">Sem dados. Selecione uma análise KFA primeiro.</p>'
    return
  }

  const t = _theme()
  const dVals = r.map(x => x.d_biber ?? 0)
  const maxD  = Math.max(...dVals.map(Math.abs), 0.01)

  // Compute raw size values then normalize to [8, 36] px
  const rawSizes = r.map(x => {
    if (sizeEncoding === 'std') return ((x.Std_Corpus1 ?? 0) + (x.Std_Corpus2 ?? 0)) / 2
    return (x.N_Corpus1 ?? 0) + (x.N_Corpus2 ?? 0)
  })
  const maxSize = Math.max(...rawSizes, 1)
  const sizes   = rawSizes.map(s => 8 + (s / maxSize) * 28)

  const xVals   = r.map(x => x.Mean_Corpus1 ?? 0)
  const yVals   = r.map(x => x.Mean_Corpus2 ?? 0)
  const allVals = [...xVals, ...yVals]
  const minV    = Math.min(...allVals)
  const maxV    = Math.max(...allVals)
  const pad     = (maxV - minV) * 0.05

  const sizeLabel = sizeEncoding === 'std' ? 'DP médio' : 'N total de textos'

  const trace = {
    x: xVals,
    y: yVals,
    mode: 'markers+text',
    type: 'scatter',
    text: r.map(x => x.Feature),
    textposition: 'top center',
    textfont: { size: 9, color: t.font_color },
    marker: {
      size: sizes,
      sizemode: 'diameter',
      color: dVals,
      colorscale: [
        [0,   C2_COLOR],
        [0.5, '#9da3b4'],
        [1,   C1_COLOR],
      ],
      cmin: -maxD,
      cmax:  maxD,
      opacity: 0.78,
      colorbar: {
        title: { text: 'd (Biber)', side: 'right', font: { size: 10, color: t.font_color } },
        thickness: 12,
        len: 0.65,
        tickfont: { size: 9, color: t.font_color },
        outlinewidth: 0,
      },
      line: { width: 0.5, color: 'rgba(0,0,0,0.2)' },
    },
    customdata: r.map((x, i) => ({
      feature: x.Feature,
      d: (x.d_biber ?? 0).toFixed(3),
      m1: (x.Mean_Corpus1 ?? 0).toFixed(3),
      m2: (x.Mean_Corpus2 ?? 0).toFixed(3),
      rawSize: rawSizes[i].toFixed(2),
    })),
    hovertemplate:
      '<b>%{customdata.feature}</b><br>' +
      `${c1Name}: %{customdata.m1}<br>` +
      `${c2Name}: %{customdata.m2}<br>` +
      'd (Biber): %{customdata.d}<br>' +
      `${sizeLabel}: %{customdata.rawSize}` +
      '<extra></extra>',
  }

  const layout = {
    paper_bgcolor: t.paper_bgcolor,
    plot_bgcolor:  t.plot_bgcolor,
    font: { color: t.font_color, family: 'inherit', size: 11 },
    xaxis: {
      title: { text: `Média — ${c1Name}`, font: { size: 10 } },
      gridcolor: t.grid_color,
      zerolinecolor: t.zero_color,
      tickfont: { size: 9 },
      range: [minV - pad, maxV + pad],
    },
    yaxis: {
      title: { text: `Média — ${c2Name}`, font: { size: 10 } },
      gridcolor: t.grid_color,
      zerolinecolor: t.zero_color,
      tickfont: { size: 9 },
      range: [minV - pad, maxV + pad],
    },
    shapes: [{
      type: 'line',
      x0: minV - pad, y0: minV - pad,
      x1: maxV + pad, y1: maxV + pad,
      line: { color: 'rgba(160,160,160,0.35)', dash: 'dot', width: 1.2 },
    }],
    annotations: [{
      x: 0.02, y: 0.02,
      xref: 'paper', yref: 'paper',
      text: `● tamanho = ${sizeLabel}`,
      showarrow: false,
      font: { size: 9, color: t.font_color + '70' },
    }],
    margin: { l: 55, r: 90, t: 20, b: 55 },
    height: 480,
    hovermode: 'closest',
  }

  Plotly.react(el, [trace], layout, PLOTLY_CONFIG)
}

// ── Strip / Jitter plot ───────────────────────────────────────────────────────

/**
 * Renderiza o strip/jitter plot — todos os documentos como pontos individuais,
 * organizados por feature (top-N por |d_biber|), C1 e C2 em lados opostos.
 *
 * @param {string} suffix   — 'standalone'
 * @param {object} rawData  — resposta de /api/viz/rawdata
 * @param {Array}  rows     — state.kfaData.results (para ordenar por |d|)
 * @param {number} topN     — máximo de features
 * @param {string} c1Name   — nome do corpus 1
 * @param {string} c2Name   — nome do corpus 2
 */
export function renderStrip(suffix, rawData, rows, topN = 20, c1Name = 'Corpus 1', c2Name = 'Corpus 2', onPointClick = null) {
  const el = document.getElementById(`plotly-strip-${suffix}`)
  if (!el) return

  if (!rawData?.features?.length) {
    el.innerHTML = '<p class="p-6 text-sm text-center opacity-50">Sem dados brutos. Aguarde o carregamento.</p>'
    return
  }

  const topFeatures = _topN(rows, topN).map(r => r.Feature)
    .filter(f => rawData.features.includes(f))

  if (topFeatures.length === 0) {
    el.innerHTML = '<p class="p-6 text-sm text-center opacity-50">Nenhuma feature comum encontrada.</p>'
    return
  }

  const t = _theme()

  function _buildTrace(corpusData, color, name, pointPos) {
    const xArr = [], yArr = [], textArr = []
    for (const feat of topFeatures) {
      for (const doc of corpusData.docs) {
        xArr.push(feat)
        yArr.push(doc[feat] ?? 0)
        textArr.push(doc.filename ?? '')
      }
    }
    return {
      type: 'box',
      x: xArr,
      y: yArr,
      text: textArr,
      customdata: textArr,
      name,
      boxpoints: 'all',
      jitter: 0.35,
      pointpos: pointPos,
      marker: { color, opacity: 0.55, size: 6, line: { width: 0 },
                symbol: onPointClick ? 'circle' : 'circle' },
      line: { color: 'transparent' },
      fillcolor: 'transparent',
      whiskerwidth: 0,
      showlegend: true,
      hovertemplate: '<b>%{x}</b><br>' + name + ': %{y:.3f}<br><span style="font-size:0.75em;opacity:0.7">%{customdata}</span>' +
        (onPointClick ? '<br><i style="font-size:0.7em">clique para abrir</i>' : '') + '<extra></extra>',
    }
  }

  const layout = {
    paper_bgcolor: t.paper_bgcolor,
    plot_bgcolor:  t.plot_bgcolor,
    font: { color: t.font_color, family: 'inherit', size: 11 },
    xaxis: {
      title: { text: 'Feature (ordem por |d|)', font: { size: 10 } },
      tickangle: -35,
      tickfont: { size: 8 },
      gridcolor: t.grid_color,
      zeroline: false,
    },
    yaxis: {
      title: { text: 'Valor norm/1000', font: { size: 10 } },
      gridcolor: t.grid_color,
      zerolinecolor: t.zero_color,
      tickfont: { size: 9 },
    },
    boxmode: 'overlay',
    legend: {
      font: { size: 10, color: t.font_color },
      bgcolor: 'transparent',
      borderwidth: 0,
      orientation: 'h',
      x: 0.5, xanchor: 'center',
      y: 1.02, yanchor: 'bottom',
    },
    margin: { l: 55, r: 20, t: 40, b: 120 },
    height: 500,
    hovermode: 'closest',
  }

  const traces = [_buildTrace(rawData.corpus1, C1_COLOR, c1Name, -0.45),
                  _buildTrace(rawData.corpus2, C2_COLOR, c2Name,  0.45)]

  Plotly.react(el, traces, layout, PLOTLY_CONFIG)

  if (onPointClick) {
    el.on('plotly_click', data => {
      const pt = data?.points?.[0]
      if (!pt) return
      const filename = pt.customdata
      const corpusName = pt.data.name
      const featureName = pt.x
      onPointClick(filename, corpusName, featureName)
    })
  }
}

// ── Heatmap comparativo (ambos os corpora) ────────────────────────────────────

/**
 * renderHeatmapComparison — heatmap com textos dos DOIS corpora clusterizados juntos.
 * Usa uma faixa lateral estreita (trace separado, xaxis2) para identificar o corpus de cada texto.
 *
 * @param {string} suffix
 * @param {object} data — resposta de GET /api/viz/heatmap_combined
 */
export function renderHeatmapComparison(suffix, data) {
  const el = document.getElementById(suffix ? `plotly-heatmap-${suffix}` : 'plotly-heatmap')
  if (!el) return

  const t = _theme()
  const { z, x, y, corpus_labels, c1_name, c2_name } = data

  const corpusZ = corpus_labels.map(l => [l === c1_name ? 0 : 1])
  const fontSizeY = Math.max(6, Math.min(10, Math.floor(500 / (y?.length || 30))))
  const fontSizeX = Math.max(6, Math.min(10, Math.floor(800 / (x?.length || 30))))

  // Faixa lateral: 1 coluna, colorscale bicolor (C1 / C2)
  const traceStrip = {
    type: 'heatmap',
    z: corpusZ,
    y,
    x: [''],
    xaxis: 'x2',
    colorscale: [[0, C1_COLOR], [1, C2_COLOR]],
    showscale: false,
    hovertemplate: '%{y}<br>%{customdata}<extra></extra>',
    customdata: corpus_labels.map(l => [l]),
    zmin: 0, zmax: 1,
  }

  // Heatmap principal: features × textos
  const traceMain = {
    type: 'heatmap',
    z, x, y,
    colorscale: 'RdBu',
    reversescale: true,
    zmid: 0,
    colorbar: {
      title: { text: 'norm/1000', font: { size: 10, color: t.font_color } },
      tickfont: { size: 9, color: t.font_color },
      len: 0.7,
      x: 1.02,
    },
    hovertemplate: '<b>%{y}</b><br><b>%{x}</b><br>%{z:.2f}<extra></extra>',
  }

  Plotly.react(el, [traceStrip, traceMain], {
    paper_bgcolor: t.paper_bgcolor,
    plot_bgcolor:  t.plot_bgcolor,
    font: { color: t.font_color, family: 'inherit', size: 10 },
    xaxis: {
      domain: [0.06, 1],
      tickangle: -45,
      tickfont: { size: fontSizeX },
      gridcolor: t.grid_color,
      tickcolor: t.font_color,
    },
    xaxis2: {
      domain: [0, 0.045],
      tickfont: { size: 0 },
      showticklabels: false,
      fixedrange: true,
    },
    yaxis: {
      tickfont: { size: fontSizeY },
      autorange: 'reversed',
      tickcolor: t.font_color,
      domain: [0, 1],
    },
    // Legenda manual via anotações
    annotations: [
      { x: 0.022, y: 1.04, xref: 'paper', yref: 'paper', text: `■ ${c1_name}`,
        font: { color: C1_COLOR, size: 10 }, showarrow: false, xanchor: 'center' },
      { x: 0.022, y: 1.01, xref: 'paper', yref: 'paper', text: `■ ${c2_name}`,
        font: { color: C2_COLOR, size: 10 }, showarrow: false, xanchor: 'center' },
    ],
    margin: { l: 130, r: 80, t: 50, b: 120 },
    height: Math.max(400, Math.min(900, (y?.length || 30) * 18 + 200)),
    hovermode: 'closest',
  }, PLOTLY_CONFIG)
}

/**
 * renderParcoords — exibe os textos dos dois corpora como linhas em um
 * gráfico de coordenadas paralelas (eixo por feature linguística).
 *
 * @param {string}  suffix     — 'standalone' | null (inline quickrun)
 * @param {object}  rawData    — resposta de /api/viz/rawdata
 * @param {array}   rows       — lista de features da tabela KFA
 * @param {number}  topN       — top-N features a exibir
 * @param {string}  c1Name, c2Name — nomes dos corpora
 */
export function renderParcoords(suffix, rawData, rows, topN = 20, c1Name = 'Corpus 1', c2Name = 'Corpus 2') {
  const el = document.getElementById(suffix ? `plotly-parcoords-${suffix}` : 'plotly-parcoords')
  if (!el) return

  const t = _theme()
  const topFeats = rows.slice(0, topN).map(r => r.feature)

  // Combine docs de ambos os corpora; color por corpus (0 = C1, 1 = C2)
  const docs1 = rawData.corpus1?.docs ?? []
  const docs2 = rawData.corpus2?.docs ?? []
  const allDocs  = [...docs1.map(d => ({ ...d, _c: 0 })), ...docs2.map(d => ({ ...d, _c: 1 }))]

  const colorScale = [[0, C1_COLOR], [1, C2_COLOR]]

  const dimensions = topFeats.map(feat => {
    const vals = allDocs.map(d => Number(d[feat]) || 0)
    return {
      label: feat,
      values: vals,
      range: [Math.min(...vals), Math.max(...vals)],
    }
  })

  const trace = {
    type: 'parcoords',
    line: {
      color:       allDocs.map(d => d._c),
      colorscale:  colorScale,
      showscale:   false,
      opacity:     0.45,
    },
    dimensions,
  }

  // Legend synthetic traces
  const legendTraces = [c1Name, c2Name].map((name, i) => ({
    type: 'scatter', mode: 'markers', name,
    x: [null], y: [null],
    marker: { color: i === 0 ? C1_COLOR : C2_COLOR, size: 8 },
    showlegend: true,
  }))

  Plotly.react(el, [trace, ...legendTraces], {
    paper_bgcolor: t.paper_bgcolor,
    plot_bgcolor:  t.plot_bgcolor,
    font: { color: t.font_color, family: 'inherit', size: 10 },
    legend: {
      font: { size: 10, color: t.font_color }, bgcolor: 'transparent', borderwidth: 0,
      orientation: 'h', x: 0.5, xanchor: 'center', y: 1.03, yanchor: 'bottom',
    },
    margin: { l: 60, r: 60, t: 50, b: 30 },
    height: 500,
  }, PLOTLY_CONFIG)
}
