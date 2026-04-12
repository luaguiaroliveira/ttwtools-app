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
import { updateProjectLabel }                from './views/home.js'

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
