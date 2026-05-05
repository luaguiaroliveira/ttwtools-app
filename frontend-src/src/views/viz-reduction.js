/**
 * viz-reduction.js — Aba "Redução dimensional"
 *
 * Interface de controles completa com parâmetros dinâmicos por método.
 * O backend endpoint /api/viz/reduction ainda não existe — o botão
 * "Calcular" exibe um aviso informativo até que seja implementado.
 *
 * Métodos previstos:
 *   pca2d  — PCA 2D (biplot)        | sklearn.decomposition.PCA
 *   pca3d  — PCA 3D interativo       | sklearn.decomposition.PCA
 *   tsne   — t-SNE                   | sklearn.manifold.TSNE
 *   umap   — UMAP                    | umap-learn
 *   mds    — MDS                     | sklearn.manifold.MDS
 *   force  — Force-directed graph    | D3 (frontend) + cosine similarity (backend)
 */

// ── Definição dos parâmetros por método ──────────────────────────────────────

const METHOD_LABELS = {
  pca2d: 'PCA 2D (biplot)',
  pca3d: 'PCA 3D interativo',
  tsne:  't-SNE',
  umap:  'UMAP',
  mds:   'MDS',
  force: 'Force-directed graph',
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
  force:
    'Textos como nós; arestas ponderadas por similaridade de cosseno. ' +
    'Textos do mesmo corpus tendem a se agrupar no layout força-dirigida.',
}

/** Parâmetros extras exibidos para cada método. */
const METHOD_PARAMS = {
  pca2d:  [],
  pca3d:  [],
  tsne: [
    { id: 'perplexity', label: 'Perplexity',  type: 'number', default: 30,   min: 5,   max: 100  },
    { id: 'n_iter',     label: 'Iterações',   type: 'number', default: 1000, min: 250, max: 5000 },
    { id: 'random_state', label: 'Seed',      type: 'number', default: 42,   min: 0,   max: 9999 },
  ],
  umap: [
    { id: 'n_neighbors', label: 'n_neighbors', type: 'number', default: 15,  min: 2,  max: 100  },
    { id: 'min_dist',    label: 'min_dist',    type: 'number', default: 0.1, min: 0,  max: 1, step: 0.05 },
    { id: 'random_state', label: 'Seed',       type: 'number', default: 42,  min: 0,  max: 9999 },
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
  force: [
    { id: 'top_k_edges', label: 'Vizinhos (K)', type: 'number', default: 5, min: 1, max: 30 },
    {
      id: 'metric', label: 'Métrica', type: 'select',
      options: [
        { value: 'cosine',    label: 'Cosseno'    },
        { value: 'euclidean', label: 'Euclidiana' },
      ],
    },
  ],
}

// ── Helpers de DOM ───────────────────────────────────────────────────────────

function _id(base, suffix) {
  return suffix ? `${base}-${suffix}` : base
}

function _el(base, suffix) {
  return document.getElementById(_id(base, suffix))
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

/** Atualiza a nota informativa do método. */
function _renderMethodNote(suffix, method) {
  const el = _el('reduction-status', suffix)
  if (!el) return
  const note = METHOD_NOTES[method] || ''
  if (note) {
    el.textContent = note
    el.classList.remove('hidden')
  } else {
    el.classList.add('hidden')
  }
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
  _renderMethodNote(suffix, methodSel.value)

  methodSel.addEventListener('change', () => {
    _renderParamControls(suffix, methodSel.value)
    _renderMethodNote(suffix, methodSel.value)
  })

  // Botão "Calcular" — exibe aviso informativo até o endpoint estar disponível
  _el('btn-reduction-calc', suffix)?.addEventListener('click', () => {
    const statusEl = _el('reduction-status', suffix)
    if (statusEl) {
      statusEl.textContent =
        '⚠ Endpoint /api/viz/reduction ainda não implementado. ' +
        'Os controles acima já estão prontos — aguardando integração com o backend.'
      statusEl.classList.remove('hidden')
    }
  })
}

/**
 * Habilita/desabilita o botão "Calcular" conforme disponibilidade dos dados.
 * Chame com ready=true após kfaData ser carregado.
 */
export function setReductionReady(suffix, ready) {
  const btn = _el('btn-reduction-calc', suffix)
  if (btn) btn.disabled = !ready
}
