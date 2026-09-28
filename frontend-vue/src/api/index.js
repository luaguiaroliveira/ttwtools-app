// Endpoints usados pela interface (um lugar só para os caminhos).
import { get, post } from './client.js'

const where = (w) => (w ? Object.entries(w).flatMap(([k, vs]) => [].concat(vs).map((v) => `${k}=${v}`)) : undefined)

export const api = {
  version: () => get('/api/version'),
  health: () => get('/api/health'),
  i18n: (lang) => get(`/api/i18n/${lang}`),
  jobs: {
    get: (id) => get(`/api/jobs/${id}`),
    cancel: (id) => post(`/api/jobs/${id}/cancel`),
    list: (params) => get('/api/jobs', params),
  },
  project: {
    current: () => get('/api/project/current'),
    info: () => get('/api/project/info'),
    open: (path) => post('/api/project/open', { path }),
    create: (path, overwrite = false) => post('/api/project/create', { path, overwrite }),
    convert: (to, dest) => post('/api/project/convert', { to, dest }),
    exportCorpus: (folder) => post('/api/project/export-corpus', { folder }),
    exportAll: (dest_folder) => post('/api/project/export', { items: null, dest_folder: dest_folder || null }),
    saveAs: (path, opts = {}) => post('/api/project/saveas', { path, ...opts }),
    save: () => post('/api/project/save'),
    unsaved: () => get('/api/project/unsaved'),
    setSaveOptions: (opts) => post('/api/project/save-options', opts),
    pendingOpen: () => get('/api/project/pending-open'),
    summary: () => get('/api/project/summary'),
  },
  utils: {
    pickFolder: (default_location) => get('/api/utils/pick-folder', { default_location }),
    pickFile: (default_location, kind) => get('/api/utils/pick-file', { default_location, kind }),
    pickSave: (suggested, default_location) => get('/api/utils/pick-save', { suggested, default_location }),
  },
  corpora: {
    list: () => get('/api/corpora'),
    documents: (corpus, params) => get(`/api/corpora/${encodeURIComponent(corpus)}/documents`, { ...params, where: where(params?.where) }),
    layers: (corpus) => get(`/api/corpora/${encodeURIComponent(corpus)}/layers`),
    text: (corpus, filename, layer) => get(`/api/corpora/${encodeURIComponent(corpus)}/text/${encodeURIComponent(filename)}`, { layer }),
    import: (body) => post('/api/corpora/import', body),
    previewNames: (path, delimiter, fields) => get('/api/corpora/preview-names', { path, delimiter, fields }),
    overview: (corpus, params) => get(`/api/corpora/${encodeURIComponent(corpus)}/overview`, params),
    computeOverview: (corpus, body) => post(`/api/corpora/${encodeURIComponent(corpus)}/overview`, body),
  },
  taggers: {
    list: (lang) => get('/api/taggers', { lang }),
    options: (id, lang, corpus) => get(`/api/taggers/${id}/options`, { lang, corpus }),
    tagset: (id, lang, group) => get(`/api/taggers/${id}/tagset`, { lang, group }),
    tag: (body) => post('/api/tagging/layers', body),
    plan: (body) => post('/api/tagging/plan', body),
  },
  explore: {
    search: (p) => get('/api/explore/search', { ...p, where: where(p.where) }),
    kwic: (p, signal) => get('/api/explore/kwic', { ...p, where: where(p.where) }, signal),
    frequency: (p) => get('/api/explore/frequency', { ...p, where: where(p.where) }),
    collocates: (p) => get('/api/explore/collocates', { ...p, where: where(p.where) }),
    dispersion: (p) => get('/api/explore/dispersion', { ...p, where: where(p.where) }),
  },
  compare: {
    keywords: (body) => post('/api/compare/keywords', body),
    bands: (body) => post('/api/compare/bands', body),
    kfa: (body) => post('/api/compare/kfa', body),
    feature: (p) => get('/api/compare/feature', { ...p, where: where(p.where) }),
    references: () => get('/api/references'),
  },
  lab: {
    compare: (body) => post('/api/lab/compare', body),
  },
  writing: {
    analyze: (body) => post('/api/writing/analyze', body),
  },
  help: {
    topics: (lang, q) => get('/api/help', { lang, q }),
    topic: (id, lang) => get(`/api/help/${id}`, { lang }),
    tour: (id, lang) => get(`/api/help/tours/${id}`, { lang }),
  },
  code: (analysis, params) => post('/api/code', { analysis, params }),
}
