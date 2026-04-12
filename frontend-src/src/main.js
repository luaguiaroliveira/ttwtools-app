/**
 * main.js — Entry point. Bootstraps all modules.
 */

// ---------------------------------------------------------------------------
// Shoelace Web Components — set asset base path BEFORE importing components
// ---------------------------------------------------------------------------
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'
setBasePath('/shoelace')  // served by FastAPI / Vite from the copied assets

import '@shoelace-style/shoelace/dist/themes/dark.css'
import '@shoelace-style/shoelace/dist/components/select/select.js'
import '@shoelace-style/shoelace/dist/components/option/option.js'
import '@shoelace-style/shoelace/dist/components/input/input.js'
import '@shoelace-style/shoelace/dist/components/range/range.js'
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js'

import './style.css'

import { setupNav }                          from './ui.js'
import { initHome, checkInitialProject }     from './views/home.js'
import { initQuickrun }                      from './views/quickrun.js'
import { initCorpus, loadCorpusList, refreshCorpusSelects } from './views/corpus.js'
import { initTagging }                       from './views/tagging.js'
import { initAnalysis }                      from './views/analysis.js'
import { initResults, refreshKfaSelect }     from './views/results.js'
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

// Listen for project-changed event (dispatched by quickrun on completion)
document.addEventListener('project-changed', () => updateProjectLabel())

// Boot: check if a project is already open (e.g. launched with --open flag)
checkInitialProject(shared)

// Load tag definitions from ttwtools (non-blocking)
api.tags.list().then(list => {
  if (Array.isArray(list)) {
    state.tagDefs = Object.fromEntries(list.map(t => [t.tag, t.definition]))
  }
}).catch(() => {})
