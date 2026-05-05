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
export function renderStrip(suffix, rawData, rows, topN = 20, c1Name = 'Corpus 1', c2Name = 'Corpus 2') {
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
    const xArr = [], yArr = []
    for (const feat of topFeatures) {
      for (const doc of corpusData.docs) {
        xArr.push(feat)
        yArr.push(doc[feat] ?? 0)
      }
    }
    return {
      type: 'box',
      x: xArr,
      y: yArr,
      name,
      boxpoints: 'all',
      jitter: 0.35,
      pointpos: pointPos,
      marker: { color, opacity: 0.55, size: 4, line: { width: 0 } },
      line: { color: 'transparent' },
      fillcolor: 'transparent',
      whiskerwidth: 0,
      showlegend: true,
      hovertemplate: '<b>%{x}</b><br>' + name + ': %{y:.3f}<extra></extra>',
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

  Plotly.react(el, [_buildTrace(rawData.corpus1, C1_COLOR, c1Name, -0.45),
                    _buildTrace(rawData.corpus2, C2_COLOR, c2Name,  0.45)],
    layout, PLOTLY_CONFIG)
}
