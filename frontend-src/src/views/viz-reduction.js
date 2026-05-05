/**
 * viz-reduction.js — Aba "Redução dimensional"
 *
 * Métodos implementados:
 *   pca2d  — PCA 2D (biplot com loadings) | sklearn.decomposition.PCA
 *   pca3d  — PCA 3D interativo             | sklearn.decomposition.PCA
 *   tsne   — t-SNE                         | sklearn.manifold.TSNE
 *   umap   — UMAP                          | umap-learn
 *   mds    — MDS                           | sklearn.manifold.MDS
 */

import Plotly   from 'plotly.js-dist-min'
import { api }  from '../api.js'
import { state } from '../state.js'
import { showToast } from '../ui.js'

// ── Cores ─────────────────────────────────────────────────────────────────────
const C1_COLOR  = '#e07b39'
const C2_COLOR  = '#5b9cf6'
const C1_FILL   = 'rgba(224,123,57,0.55)'
const C2_FILL   = 'rgba(91,156,246,0.45)'

const PLOTLY_CONFIG = {
  displaylogo: false,
  responsive: true,
  modeBarButtonsToRemove: ['sendDataToCloud', 'editInChartStudio'],
}

// ── Definição dos parâmetros por método ──────────────────────────────────────

const METHOD_LABELS = {
  pca2d: 'PCA 2D (biplot)',
  pca3d: 'PCA 3D interativo',
  tsne:  't-SNE',
  umap:  'UMAP',
  mds:   'MDS',
}

const METHOD_NOTES = {
  pca2d:
    'Projeta os textos nos dois primeiros componentes principais. ' +
    'Vetores de loading mostram a contribuição de cada feature. ' +
    'Eixos indicam a % de variância explicada.',
  pca3d:
    'Mesmo que PCA 2D, mas com três componentes — gráfico 3D rotacionável.',
  tsne:
    '⚠ Redução não-linear que preserva vizinhanças locais. ' +
    'Bom para revelar clusters, mas distâncias entre clusters não são interpretáveis. ' +
    'Resultados variam entre execuções (fixar random_state para reprodutibilidade).',
  umap:
    'Alternativa ao t-SNE — mais rápido e com melhor preservação de estrutura global. ' +
    'Requer o pacote Python umap-learn.',
  mds:
    'Escalonamento multidimensional a partir de matriz de distâncias entre textos. ' +
    'Preserva distâncias globais — mais interpretável que t-SNE.',
}

/** Parâmetros extras exibidos para cada método. */
const METHOD_PARAMS = {
  pca2d:  [],
  pca3d:  [],
  tsne: [
    { id: 'perplexity',   label: 'Perplexity', type: 'number', default: 30,   min: 5,   max: 100  },
    { id: 'n_iter',       label: 'Iterações',  type: 'number', default: 1000, min: 250, max: 5000 },
    { id: 'random_state', label: 'Seed',       type: 'number', default: 42,   min: 0,   max: 9999 },
  ],
  umap: [
    { id: 'n_neighbors',  label: 'n_neighbors', type: 'number', default: 15,  min: 2,  max: 100  },
    { id: 'min_dist',     label: 'min_dist',    type: 'number', default: 0.1, min: 0,  max: 1, step: 0.05 },
    { id: 'random_state', label: 'Seed',        type: 'number', default: 42,  min: 0,  max: 9999 },
  ],
  mds: [
    {
      id: 'metric', label: 'Métrica', type: 'select',
      options: [
        { value: 'euclidean', label: 'Euclidiana' },
        { value: 'cosine',    label: 'Cosseno'    },
      ],
    },
  ],
}

// ── Theme helper ─────────────────────────────────────────────────────────────

function _theme() {
  const dark = document.documentElement.dataset.theme !== 'ttwlight'
  return {
    paper_bgcolor: dark ? '#1e2232' : '#ffffff',
    plot_bgcolor:  dark ? '#1e2232' : '#f8f9fb',
    font_color:    dark ? '#cdd1e0' : '#1a1c26',
    grid_color:    dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    scene_bgcolor: dark ? '#1e2232' : '#f8f9fb',
  }
}

// ── Helpers de DOM ───────────────────────────────────────────────────────────

function _el(base, suffix) {
  return document.getElementById(suffix ? `${base}-${suffix}` : base)
}

function _paramVal(id, suffix) {
  const el = document.getElementById(`reduction-param-${id}-${suffix || 'inline'}`)
  if (!el) return undefined
  if (el.tagName === 'SELECT') return el.value
  return el.type === 'number' ? Number(el.value) : el.value
}

/** Renderiza os controles dinâmicos de parâmetros para o método selecionado. */
function _renderParamControls(suffix, method) {
  const container = _el('reduction-params', suffix)
  if (!container) return
  container.innerHTML = ''

  const params = METHOD_PARAMS[method] || []
  params.forEach(p => {
    const wrap = document.createElement('label')
    wrap.className = 'form-control'

    const span = document.createElement('span')
    span.className = 'label-text text-xs font-semibold text-base-content mb-1 block'
    span.textContent = p.label
    wrap.appendChild(span)

    let input
    if (p.type === 'select') {
      input = document.createElement('select')
      input.className = 'select select-bordered select-xs'
      p.options.forEach(o => {
        const opt = document.createElement('option')
        opt.value = o.value
        opt.textContent = o.label
        input.appendChild(opt)
      })
    } else {
      input = document.createElement('input')
      input.type = 'number'
      input.className = 'input input-bordered input-xs w-24'
      input.value = p.default ?? ''
      if (p.min  !== undefined) input.min  = p.min
      if (p.max  !== undefined) input.max  = p.max
      if (p.step !== undefined) input.step = p.step
    }

    input.id   = `reduction-param-${p.id}-${suffix || 'inline'}`
    input.name = p.id
    wrap.appendChild(input)
    container.appendChild(wrap)
  })
}

function _setStatus(suffix, msg, type = 'info') {
  const el = _el('reduction-status', suffix)
  if (!el) return
  el.textContent = msg
  if (!msg) { el.classList.add('hidden'); return }
  el.classList.remove('hidden')
  el.className = 'text-xs rounded p-2 mb-3 max-w-xl ' +
    (type === 'error'
      ? 'bg-error/20 text-error'
      : 'bg-base-200 text-base-content/60')
}

// ── Renderers ─────────────────────────────────────────────────────────────────

function _baseTraces(coords, c1Name, c2Name) {
  const byCorpus = {}
  coords.forEach(p => { (byCorpus[p.corpus] = byCorpus[p.corpus] || []).push(p) })
  return [c1Name, c2Name].map((name, idx) => {
    const pts   = byCorpus[name] || []
    const color = idx === 0 ? C1_COLOR : C2_COLOR
    const fill  = idx === 0 ? C1_FILL  : C2_FILL
    return {
      type: 'scatter', mode: 'markers', name,
      x: pts.map(p => p.x),
      y: pts.map(p => p.y),
      text: pts.map(p => p.filename),
      marker: { color: fill, line: { color, width: 1 }, size: 7, opacity: 0.85 },
    }
  })
}

function _renderPCA2D(el, result, c1Name, c2Name) {
  const t   = _theme()
  const exp = (result.explained_variance || []).map(v => (v * 100).toFixed(1) + '%')

  const traces = _baseTraces(result.coords, c1Name, c2Name).map(tr => ({
    ...tr,
    hovertemplate: '<b>%{text}</b><br>PC1: %{x:.3f}<br>PC2: %{y:.3f}<extra></extra>',
  }))

  const shapes = []
  if (result.loadings?.length) {
    const xs = result.coords.map(p => p.x)
    const ys = result.coords.map(p => p.y)
    const scale = Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 0.35

    const loadX = result.loadings.map(l => l.pc1 * scale)
    const loadY = result.loadings.map(l => l.pc2 * scale)

    traces.push({
      type: 'scatter', mode: 'text+markers', name: 'Loadings', showlegend: false,
      x: loadX, y: loadY, text: result.loadings.map(l => l.feature),
      textfont: { size: 8, color: t.font_color + '90' },
      textposition: 'top center',
      marker: { size: 4, color: t.font_color + '50' },
      hovertemplate: '<b>%{text}</b><br>PC1: %{x:.3f}<br>PC2: %{y:.3f}<extra></extra>',
    })

    result.loadings.forEach((_, i) => {
      shapes.push({
        type: 'line', x0: 0, y0: 0, x1: loadX[i], y1: loadY[i],
        line: { color: t.font_color + '30', width: 1, dash: 'dot' },
      })
    })
  }

  Plotly.react(el, traces, {
    paper_bgcolor: t.paper_bgcolor, plot_bgcolor: t.plot_bgcolor,
    font: { color: t.font_color, family: 'inherit', size: 11 },
    xaxis: { title: { text: `PC1 (${exp[0] || '?'})`, font: { size: 10 } }, gridcolor: t.grid_color, zerolinecolor: t.grid_color, tickfont: { size: 9 } },
    yaxis: { title: { text: `PC2 (${exp[1] || '?'})`, font: { size: 10 } }, gridcolor: t.grid_color, zerolinecolor: t.grid_color, tickfont: { size: 9 } },
    legend: { font: { size: 10, color: t.font_color }, bgcolor: 'transparent', borderwidth: 0 },
    shapes, margin: { l: 55, r: 20, t: 20, b: 55 }, height: 500, hovermode: 'closest',
  }, PLOTLY_CONFIG)
}

function _renderPCA3D(el, result, c1Name, c2Name) {
  const t   = _theme()
  const exp = (result.explained_variance || []).map(v => (v * 100).toFixed(1) + '%')
  const byCorpus = {}
  result.coords.forEach(p => { (byCorpus[p.corpus] = byCorpus[p.corpus] || []).push(p) })

  const traces = [c1Name, c2Name].map((name, idx) => {
    const pts = byCorpus[name] || []
    return {
      type: 'scatter3d', mode: 'markers', name,
      x: pts.map(p => p.x), y: pts.map(p => p.y), z: pts.map(p => p.z ?? 0),
      text: pts.map(p => p.filename),
      hovertemplate: '<b>%{text}</b><br>PC1: %{x:.3f}<br>PC2: %{y:.3f}<br>PC3: %{z:.3f}<extra></extra>',
      marker: { color: idx === 0 ? C1_FILL : C2_FILL, line: { color: idx === 0 ? C1_COLOR : C2_COLOR, width: 0.5 }, size: 5, opacity: 0.85 },
    }
  })

  Plotly.react(el, traces, {
    paper_bgcolor: t.paper_bgcolor, font: { color: t.font_color, family: 'inherit', size: 11 },
    scene: {
      bgcolor: t.scene_bgcolor,
      xaxis: { title: `PC1 (${exp[0] || '?'})`, tickfont: { size: 8 } },
      yaxis: { title: `PC2 (${exp[1] || '?'})`, tickfont: { size: 8 } },
      zaxis: { title: `PC3 (${exp[2] || '?'})`, tickfont: { size: 8 } },
    },
    legend: { font: { size: 10, color: t.font_color }, bgcolor: 'transparent', borderwidth: 0 },
    margin: { l: 0, r: 0, t: 10, b: 0 }, height: 520,
  }, PLOTLY_CONFIG)
}

function _renderScatter2D(el, result, c1Name, c2Name, ax1 = 'Dim 1', ax2 = 'Dim 2') {
  const t = _theme()
  const traces = _baseTraces(result.coords, c1Name, c2Name).map(tr => ({
    ...tr,
    hovertemplate: `<b>%{text}</b><br>${ax1}: %{x:.3f}<br>${ax2}: %{y:.3f}<extra></extra>`,
  }))

  Plotly.react(el, traces, {
    paper_bgcolor: t.paper_bgcolor, plot_bgcolor: t.plot_bgcolor,
    font: { color: t.font_color, family: 'inherit', size: 11 },
    xaxis: { title: { text: ax1, font: { size: 10 } }, gridcolor: t.grid_color, zerolinecolor: t.grid_color, tickfont: { size: 9 } },
    yaxis: { title: { text: ax2, font: { size: 10 } }, gridcolor: t.grid_color, zerolinecolor: t.grid_color, tickfont: { size: 9 } },
    legend: { font: { size: 10, color: t.font_color }, bgcolor: 'transparent', borderwidth: 0 },
    margin: { l: 55, r: 20, t: 20, b: 55 }, height: 500, hovermode: 'closest',
  }, PLOTLY_CONFIG)
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Inicializa a aba de redução dimensional para o suffix indicado.
 * Deve ser chamado uma vez por `suffix` no initResults().
 */
export function initReduction(suffix) {
  const methodSel = _el('reduction-method', suffix)
  if (!methodSel) return

  // Popula as opções de método
  methodSel.innerHTML = Object.entries(METHOD_LABELS)
    .map(([v, l]) => `<option value="${v}">${l}</option>`)
    .join('')

  _renderParamControls(suffix, methodSel.value)
  _setStatus(suffix, METHOD_NOTES[methodSel.value] || '')

  methodSel.addEventListener('change', () => {
    _renderParamControls(suffix, methodSel.value)
    _setStatus(suffix, METHOD_NOTES[methodSel.value] || '')
  })

  // Botão Calcular
  _el('btn-reduction-calc', suffix)?.addEventListener('click', async () => {
    const method = _el('reduction-method', suffix)?.value || 'pca2d'
    const btn    = _el('btn-reduction-calc', suffix)

    if (!state.kfaData) {
      _setStatus(suffix, '⚠ Carregue uma análise KFA primeiro.', 'error'); return
    }

    btn.disabled  = true
    btn.textContent = 'Calculando…'
    _setStatus(suffix, '⏳ Calculando — aguarde…')

    const body = {
      corpus1_name:  state.kfaC1,
      corpus2_name:  state.kfaC2,
      tagger1:       state.kfaTagger,
      tagger2:       state.kfaTagger,
      method,
      top_n_features: state.topN || 30,
      perplexity:    _paramVal('perplexity',   suffix) ?? 30,
      n_iter:        _paramVal('n_iter',        suffix) ?? 1000,
      n_neighbors:   _paramVal('n_neighbors',   suffix) ?? 15,
      min_dist:      _paramVal('min_dist',      suffix) ?? 0.1,
      metric:        _paramVal('metric',        suffix) ?? 'euclidean',
      random_state:  _paramVal('random_state',  suffix) ?? 42,
    }

    try {
      const result = await api.viz.reduction(body)
      const plotEl = _el('plotly-reduction', suffix)
      if (!plotEl) return

      const c1 = state.kfaC1, c2 = state.kfaC2
      const pct = (result.explained_variance || []).map(v => (v * 100).toFixed(1) + '%').join(' + ')

      if (method === 'pca2d') {
        _renderPCA2D(plotEl, result, c1, c2)
        _setStatus(suffix, `PCA 2D — variância explicada: ${pct}. Features usadas: ${result.n_features_used}.`)
      } else if (method === 'pca3d') {
        _renderPCA3D(plotEl, result, c1, c2)
        _setStatus(suffix, `PCA 3D — variância explicada: ${pct}. Features usadas: ${result.n_features_used}.`)
      } else if (method === 'tsne') {
        _renderScatter2D(plotEl, result, c1, c2, 't-SNE 1', 't-SNE 2')
        _setStatus(suffix, `t-SNE — ${result.n_features_used} features. ⚠ Distâncias entre clusters não são interpretáveis.`)
      } else if (method === 'umap') {
        _renderScatter2D(plotEl, result, c1, c2, 'UMAP 1', 'UMAP 2')
        _setStatus(suffix, `UMAP — ${result.n_features_used} features usadas.`)
      } else if (method === 'mds') {
        _renderScatter2D(plotEl, result, c1, c2, 'MDS 1', 'MDS 2')
        _setStatus(suffix, `MDS — ${result.n_features_used} features, métrica: ${body.metric}.`)
      }
    } catch (err) {
      _setStatus(suffix, `Erro: ${err.message}`, 'error')
      showToast?.(`Redução dimensional: ${err.message}`, 'error')
    } finally {
      btn.disabled    = false
      btn.textContent = 'Calcular'
    }
  })
}

/**
 * Habilita/desabilita o botão "Calcular" conforme disponibilidade dos dados.
 */
export function setReductionReady(suffix, ready) {
  const btn = _el('btn-reduction-calc', suffix)
  if (btn) btn.disabled = !ready
}
