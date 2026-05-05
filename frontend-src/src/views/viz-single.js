/**
 * viz-single.js — Visualizações da aba "Corpus individual"
 *
 * Implementado:
 *   - renderRadar(suffix, rows, topN, showBoth, c1Name, c2Name, selected)
 *   - renderViolin(suffix, rawData, rows, topN, c1Name, c2Name)
 *
 * Em desenvolvimento:
 *   - Heatmap texto × feature clusterizado
 *   - Histograma + KDE
 */

import Plotly from 'plotly.js-dist-min'

// ── Constantes de cor ─────────────────────────────────────────────────────────
const C1_FILL = 'rgba(224, 123,  57, 0.55)'
const C1_LINE = '#e07b39'
const C2_FILL = 'rgba( 91, 156, 246, 0.40)'
const C2_LINE = '#5b9cf6'

// ── Helpers ───────────────────────────────────────────────────────────────────

function _theme() {
  const dark = document.documentElement.dataset.theme !== 'ttwlight'
  return {
    paper_bgcolor: dark ? '#1e2232' : '#ffffff',
    font_color:    dark ? '#cdd1e0' : '#1a1c26',
    grid_color:    dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    polar_bgcolor: dark ? '#1e2232' : '#f8f9fb',
  }
}

function _topN(rows, n) {
  if (!rows || rows.length === 0) return []
  return rows
    .slice()
    .sort((a, b) => Math.abs(b.d_biber ?? 0) - Math.abs(a.d_biber ?? 0))
    .slice(0, n)
}

const PLOTLY_CONFIG = {
  displaylogo: false,
  responsive: true,
  modeBarButtonsToRemove: ['sendDataToCloud', 'editInChartStudio', 'lasso2d'],
}

// ── Radar chart ───────────────────────────────────────────────────────────────

/**
 * Radar / spider chart comparando os perfis médios dos dois corpora.
 *
 * Cada eixo radial = uma feature (top-N por |d_biber|).
 * Os valores são normalizados por feature (0–max entre os dois corpora)
 * para tornar a escala dos eixos comparável visualmente.
 * O hover mostra o valor real (não normalizado).
 *
 * @param {string}  suffix    — 'standalone' ou '' (inline)
 * @param {Array}   rows      — state.kfaData.results
 * @param {number}  topN      — número de features/eixos (recomendado: 8–20)
 * @param {boolean} showBoth  — se false, exibe apenas o corpus selecionado
 * @param {string}  c1Name    — nome do corpus 1
 * @param {string}  c2Name    — nome do corpus 2
 * @param {string}  selected  — 'c1' | 'c2' (corpus ativo quando showBoth=false)
 */
export function renderRadar(suffix, rows, topN = 15, showBoth = true, c1Name = 'Corpus 1', c2Name = 'Corpus 2', selected = 'c1') {
  const el = document.getElementById(`plotly-radar-${suffix}`)
  if (!el) return

  const r = _topN(rows, topN)
  if (r.length === 0) {
    el.innerHTML = '<p class="p-6 text-sm text-center opacity-50">Sem dados. Selecione uma análise KFA primeiro.</p>'
    return
  }

  const t = _theme()

  const features  = r.map(x => x.Feature)
  const means1    = r.map(x => x.Mean_Corpus1 ?? 0)
  const means2    = r.map(x => x.Mean_Corpus2 ?? 0)

  // Normalização por feature: divide pelo max entre os dois corpora
  // para que todos os eixos fiquem em [0, 1] — facilita a leitura visual.
  const normFactor = r.map((_, i) => Math.max(means1[i], means2[i], 0.001))
  const norm1 = means1.map((v, i) => v / normFactor[i])
  const norm2 = means2.map((v, i) => v / normFactor[i])

  // Fechar o polígono repetindo o primeiro ponto
  const featLoop  = [...features, features[0]]
  const norm1Loop = [...norm1, norm1[0]]
  const norm2Loop = [...norm2, norm2[0]]
  const raw1Loop  = [...means1, means1[0]]
  const raw2Loop  = [...means2, means2[0]]

  const traces = []

  if (showBoth || selected === 'c1') {
    traces.push({
      type: 'scatterpolar',
      r: norm1Loop,
      theta: featLoop,
      fill: 'toself',
      fillcolor: C1_FILL,
      line: { color: C1_LINE, width: 2 },
      name: c1Name,
      customdata: raw1Loop,
      hovertemplate: '<b>%{theta}</b><br>' + c1Name + ': %{customdata:.3f}<extra></extra>',
    })
  }

  if (showBoth || selected === 'c2') {
    traces.push({
      type: 'scatterpolar',
      r: norm2Loop,
      theta: featLoop,
      fill: 'toself',
      fillcolor: C2_FILL,
      line: { color: C2_LINE, width: 2 },
      name: c2Name,
      customdata: raw2Loop,
      hovertemplate: '<b>%{theta}</b><br>' + c2Name + ': %{customdata:.3f}<extra></extra>',
    })
  }

  const layout = {
    paper_bgcolor: t.paper_bgcolor,
    font: { color: t.font_color, family: 'inherit', size: 11 },
    polar: {
      bgcolor: t.polar_bgcolor,
      angularaxis: {
        tickfont: { size: 9, color: t.font_color },
        gridcolor: t.grid_color,
        linecolor: t.grid_color,
        direction: 'clockwise',
      },
      radialaxis: {
        visible: true,
        range: [0, 1],
        tickfont: { size: 8, color: t.font_color + '70' },
        gridcolor: t.grid_color,
        showticklabels: false,
      },
    },
    legend: {
      font: { size: 10, color: t.font_color },
      bgcolor: 'transparent',
      borderwidth: 0,
      orientation: 'h',
      x: 0.5, xanchor: 'center',
      y: -0.05,
    },
    margin: { l: 60, r: 60, t: 30, b: 60 },
    height: 500,
    showlegend: true,
  }

  Plotly.react(el, traces, layout, PLOTLY_CONFIG)
}

// ── Violin / Box plot ─────────────────────────────────────────────────────────

/**
 * Renderiza violin + box + pontos individuais para os dois corpora,
 * com C1 à esquerda e C2 à direita de cada feature (top-N por |d_biber|).
 *
 * @param {string} suffix   — 'standalone'
 * @param {object} rawData  — resposta de /api/viz/rawdata
 * @param {Array}  rows     — state.kfaData.results (para ordenar por |d|)
 * @param {number} topN     — máximo de features
 * @param {string} c1Name   — nome do corpus 1
 * @param {string} c2Name   — nome do corpus 2
 */
export function renderViolin(suffix, rawData, rows, topN = 15, c1Name = 'Corpus 1', c2Name = 'Corpus 2') {
  const el = document.getElementById(`plotly-violin-${suffix}`)
  if (!el) return

  if (!rawData?.features?.length) {
    el.innerHTML = '<p class="p-6 text-sm text-center opacity-50">Sem dados brutos. Aguarde o carregamento.</p>'
    return
  }

  const topFeatures = rows
    .slice()
    .sort((a, b) => Math.abs(b.d_biber ?? 0) - Math.abs(a.d_biber ?? 0))
    .slice(0, topN)
    .map(r => r.Feature)
    .filter(f => rawData.features.includes(f))

  if (topFeatures.length === 0) {
    el.innerHTML = '<p class="p-6 text-sm text-center opacity-50">Nenhuma feature comum encontrada.</p>'
    return
  }

  const t = _theme()

  function _buildViolin(corpusData, fillColor, lineColor, name, side) {
    const xArr = [], yArr = []
    for (const feat of topFeatures) {
      for (const doc of corpusData.docs) {
        xArr.push(feat)
        yArr.push(doc[feat] ?? 0)
      }
    }
    return {
      type: 'violin',
      x: xArr,
      y: yArr,
      name,
      side,
      box: { visible: true, width: 0.25 },
      meanline: { visible: true, color: lineColor },
      points: 'outliers',
      fillcolor: fillColor,
      line: { color: lineColor, width: 1.5 },
      marker: { color: lineColor, size: 3, opacity: 0.6 },
      opacity: 0.75,
      spanmode: 'soft',
      showlegend: true,
      hovertemplate: '<b>%{x}</b><br>' + name + ': %{y:.3f}<extra></extra>',
    }
  }

  const traces = [
    _buildViolin(rawData.corpus1, C1_FILL, C1_LINE, c1Name, 'negative'),
    _buildViolin(rawData.corpus2, C2_FILL, C2_LINE, c2Name, 'positive'),
  ]

  const layout = {
    paper_bgcolor: t.paper_bgcolor,
    plot_bgcolor:  t.paper_bgcolor,
    font: { color: t.font_color, family: 'inherit', size: 11 },
    violinmode: 'overlay',
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
      tickfont: { size: 9 },
      zeroline: true,
      zerolinecolor: t.grid_color,
    },
    legend: {
      font: { size: 10, color: t.font_color },
      bgcolor: 'transparent',
      borderwidth: 0,
      orientation: 'h',
      x: 0.5, xanchor: 'center',
      y: 1.02, yanchor: 'bottom',
    },
    margin: { l: 55, r: 20, t: 40, b: 120 },
    height: 520,
    hovermode: 'closest',
  }

  Plotly.react(el, traces, layout, PLOTLY_CONFIG)
}
