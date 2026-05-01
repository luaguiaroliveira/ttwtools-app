/**
 * main.js — Entry point. Bootstraps all modules.
 */

import './style.css'

import { setupNav }                          from './ui.js'
import { initHome, checkInitialProject }     from './views/home.js'
import { initQuickrun }                      from './views/quickrun.js'
import { initCorpus, loadCorpusList, refreshCorpusSelects } from './views/corpus.js'
import { initTagging }                       from './views/tagging.js'
import { initAnalysis }                      from './views/analysis.js'
import { initResults, refreshKfaSelect }     from './views/results.js'
import { initFeatureDetail }                 from './views/feature-detail.js'
import { initTextViewer }                    from './views/text-viewer.js'
import { initExport }                        from './views/export.js'
import { updateProjectLabel }                from './views/home.js'
import { api }                               from './api.js'
import { state }                             from './state.js'

// Shared callbacks passed to views that need cross-view coordination
const shared = { loadCorpusList, refreshCorpusSelects, refreshKfaSelect }

// Set up sidebar navigation
setupNav()

// Initialize all views
initHome(shared)
initQuickrun(shared)
initCorpus()
initTagging()
initAnalysis(shared)
initResults()
initFeatureDetail()
initTextViewer()
initExport()

// Listen for project-changed event (dispatched by quickrun on completion)
document.addEventListener('project-changed', () => {
  updateProjectLabel()
  // Clear stale KFA data so the Results view doesn't show data from a previous project
  state.kfaData  = null
  state.kfaC1    = ''
  state.kfaC2    = ''
  state.kfaTagger = null
  // Hide chart + table until user explicitly loads a KFA from the new project
  document.getElementById('chart-container')?.classList.add('hidden')
  document.getElementById('table-container')?.classList.add('hidden')
})

// Boot: check if a project is already open (e.g. launched with --open flag)
checkInitialProject(shared)

// Load tag definitions from ttwtools (non-blocking)
api.tags.list().then(list => {
  if (Array.isArray(list)) {
    state.tagDefs = Object.fromEntries(list.map(t => [t.tag, t.definition]))
  }
}).catch(() => {})

// ── Theme toggle ───────────────────────────────────────────────────────────
;(function () {
  const html = document.documentElement
  const btn  = document.getElementById('btn-theme-toggle')
  const saved = localStorage.getItem('ttw-theme') || 'ttwdark'
  html.setAttribute('data-theme', saved)
  if (btn) btn.textContent = saved === 'ttwdark' ? '🌙' : '☀️'
  btn?.addEventListener('click', () => {
    const current = html.getAttribute('data-theme') || 'ttwdark'
    const next    = current === 'ttwdark' ? 'ttwlight' : 'ttwdark'
    html.setAttribute('data-theme', next)
    localStorage.setItem('ttw-theme', next)
    btn.textContent = next === 'ttwdark' ? '🌙' : '☀️'
  })
})()
