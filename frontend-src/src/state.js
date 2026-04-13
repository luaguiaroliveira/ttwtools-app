/**
 * state.js — Shared mutable state (single source of truth for results view).
 */

export const state = {
  currentProject: null,

  // KFA results
  kfaData:    null,
  kfaC1:      '',
  kfaC2:      '',

  // Chart options
  chartMetric: 'Effect_Size',
  barHeight:   18,
  palette:     'biber',

  // Table sort/filter
  sortCol: 'Effect_Size',
  sortDir: -1,
  filter:  '',

  // Tag definitions from ttwtools (tag → definition string)
  tagDefs: {},

  // Feature detail drill-down
  currentFeature: '',

  // Text viewer
  tvFiles:   [],
  tvIndex:   0,
  tvFeature: '',
}
