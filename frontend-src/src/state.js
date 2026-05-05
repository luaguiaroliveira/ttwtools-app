/**
 * state.js — Shared mutable state (single source of truth for results view).
 */

export const state = {
  currentProject: null,

  // KFA results
  kfaData:    null,
  kfaC1:      '',
  kfaC2:      '',
  kfaTagger:  null,   // tagger_type salvo com a KFA (null = auto-detect)

  // Chart options (bar chart existente)
  chartMetric: 'd_biber',
  barHeight:   18,
  palette:     'biber',

  // Table sort/filter
  sortCol:   'd_biber',
  sortDir:   -1,
  filter:    '',
  minEffect: 0,

  // Tag definitions from ttwtools (tag → definition string)
  tagDefs: {},

  // Feature detail drill-down
  currentFeature: '',

  // Text viewer
  tvFiles:   [],
  tvIndex:   0,
  tvFeature: '',

  // ── Novas visualizações ──────────────────────────────────────────
  // Número máximo de features exibidas em visualizações densas
  topN: 20,

  // Aba principal ativa em #view-results (comparison | single | reduction)
  activeResultsTab: 'comparison',

  // Sub-aba ativa em cada aba principal
  compViz:      'barchart',   // barchart | scatter | bubble | parcoords | strip
  singleViz:    'radar',      // radar | violin | heatmap | histogram
  reductionViz: 'pca2d',      // pca2d | pca3d | tsne | umap | mds | force

  // Corpus selecionado na aba "Corpus individual" ('c1' | 'c2')
  singleCorpus: 'c1',

  // Opções do radar chart
  radarBoth: true,   // true = sobrepor ambos os corpora

  // Opção do bubble chart
  bubbleSizeEnc: 'std',   // 'std' (DP médio) | 'n' (N total)

  // Cache dos dados brutos por documento (carregado sob demanda)
  rawData: null,

  // Feature selecionada no histograma
  histogramFeature: null,
}

