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

  // Chart options
  chartMetric: 'Effect_Size',
  barHeight:   18,
  palette:     'biber',

  // Table sort/filter
  sortCol:   'Effect_Size',
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
}
