/**
 * api.js — API wrapper (ES module).
 */

const BASE = ''

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(BASE + path, opts)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`)
  return data
}

async function upload(path, formData) {
  const res = await fetch(BASE + path, { method: 'POST', body: formData })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`)
  return data
}

export const api = {
  project: {
    current:  ()     => request('GET',  '/api/project/current'),
    create:   body   => request('POST', '/api/project/create', body),
    open:     body   => request('POST', '/api/project/open',   body),
    summary:  ()     => request('GET',  '/api/project/summary'),
    meta:     ()     => request('GET',  '/api/project/meta'),
    manifest: ()     => request('GET',  '/api/project/manifest'),
    export:   body   => request('POST', '/api/project/export', body),
  },

  corpus: {
    list:          ()             => request('GET',  '/api/corpus/list'),
    files:         name          => request('GET',  `/api/corpus/${encodeURIComponent(name)}/files`),
    taggedTokens:  (corpus, fn, tagger) => {
      const suffix = tagger ? `?tagger_type=${encodeURIComponent(tagger)}` : ''
      return request('GET',  `/api/corpus/${encodeURIComponent(corpus)}/tagged-tokens/${encodeURIComponent(fn)}${suffix}`)
    },
    importFolder:  body         => request('POST', '/api/corpus/import-folder', body),
    importTagged:  body         => request('POST', '/api/corpus/import-tagged', body),
    uploadFile:    (name, file) => {
      const fd = new FormData()
      fd.append('corpus_name', name)
      fd.append('file', file)
      return upload('/api/corpus/upload', fd)
    },
  },

  tagging: {
    run:    body  => request('POST', '/api/tagging/run', body),
    status: jobId => request('GET',  `/api/tagging/status/${jobId}`),
  },

  utils: {
    pickFolder: (opts = {}) => {
      const qs = opts.defaultLocation ? `?default_location=${encodeURIComponent(opts.defaultLocation)}` : ''
      return request('GET', `/api/utils/pick-folder${qs}`)
    },
    pickFile:   () => request('GET', '/api/utils/pick-file'),
  },

  quickrun: {
    start:  body  => request('POST', '/api/quickrun/start',           body),
    status: jobId => request('GET',  `/api/quickrun/status/${jobId}`),
  },

  tags: {
    list: () => request('GET', '/api/tags'),
  },

  analysis: {
    runKfa:       body              => request('POST', '/api/analysis/kfa', body),
    listKfa:      ()                => request('GET',  '/api/analysis/kfa/list'),
    getKfa:       (c1, c2, d, join, tagger, analysisName, metric) => {
      let url = `/api/analysis/kfa/${encodeURIComponent(c1)}/${encodeURIComponent(c2)}?min_effect=${d}&join=${join}`
      if (tagger)       url += `&tagger=${encodeURIComponent(tagger)}`
      if (analysisName) url += `&analysis_name=${encodeURIComponent(analysisName)}`
      if (metric)       url += `&metric=${encodeURIComponent(metric)}`
      return request('GET', url)
    },
    getRawFeatures: (corpusName, taggerType) =>
      request('GET', `/api/analysis/rawfeatures/${encodeURIComponent(corpusName)}${taggerType ? '?tagger_type=' + encodeURIComponent(taggerType) : ''}`),
    featureFiles: (c1, c2, feature, tagger1, tagger2) => {
      let url = `/api/analysis/feature-files/${encodeURIComponent(c1)}/${encodeURIComponent(c2)}/${encodeURIComponent(feature)}`
      const params = []
      if (tagger1) params.push(`tagger1=${encodeURIComponent(tagger1)}`)
      if (tagger2) params.push(`tagger2=${encodeURIComponent(tagger2)}`)
      if (params.length) url += '?' + params.join('&')
      return request('GET', url)
    },
    featureTable: (name, type)      =>
      request('GET', `/api/analysis/features/${encodeURIComponent(name)}/${type}`),
    listFeatures: ()                => request('GET',  '/api/analysis/features/list'),
  },
}
