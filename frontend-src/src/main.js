/**
 * main.js — Entry point. Bootstraps all modules.
 */

import './style.css'

import { setupNav, showView, renderLucideIcons, showToast } from './ui.js'
import { initHome, checkInitialProject } from './views/home.js'
import { initQuickrun } from './views/quickrun.js'
import { initCorpus, loadCorpusList, refreshCorpusSelects } from './views/corpus.js'
import { initTagging } from './views/tagging.js'
import { initAnalysis } from './views/analysis.js'
import { initResults, refreshKfaSelect, renderResultsData, showSavedBadge, updateActiveTaggerBadge } from './views/results.js'
import { initFeatureDetail } from './views/feature-detail.js'
import { initTextViewer } from './views/text-viewer.js'
import { initExport } from './views/export.js'
import { updateProjectLabel, openProject, newProject, startNewAnalysis } from './views/home.js'
import { api } from './api.js'
import { state } from './state.js'

// Shared callbacks passed to views that need cross-view coordination
const shared = { loadCorpusList, refreshCorpusSelects, refreshKfaSelect, renderResults: renderResultsData, showSavedBadge }

// Set up navigation
setupNav()

// ── Menubar: dropdown open/close + Lucide icons ────────────────────────────
renderLucideIcons()

  ; (function setupMenubar() {
    // Toggle a specific menu open; close others
    function openMenu(id) {
      document.querySelectorAll('.menu-item').forEach(m => m.classList.toggle('open', m.id === id))
    }
    function closeAll() {
      document.querySelectorAll('.menu-item.open').forEach(m => m.classList.remove('open'))
    }

    document.querySelectorAll('.menu-trigger').forEach(btn => {
      const item = btn.closest('.menu-item')
      if (!item) return
      btn.addEventListener('click', e => {
        e.stopPropagation()
        const wasOpen = item.classList.contains('open')
        closeAll()
        if (!wasOpen) openMenu(item.id)
      })
    })

    // Close on outside click
    document.addEventListener('click', closeAll)

    // menu-action items that aren't nav-btn: wire specific handlers
    document.getElementById('mnu-new-analysis')?.addEventListener('click', () => { closeAll(); startNewAnalysis() })
    document.getElementById('mnu-export')?.addEventListener('click', () => { closeAll(); showView('export') })
    document.getElementById('mnu-open-ttwa')?.addEventListener('click', () => { closeAll(); openProject() })
    document.getElementById('mnu-save-ttwa')?.addEventListener('click', async () => {
      closeAll()
      try {
        const { path } = await api.project.current()
        if (!path) { showToast('Nenhum projeto aberto.', 'error'); return }
        showToast('Projeto salvo: ' + path.split('/').pop())
      } catch (err) {
        showToast(err.message, 'error')
      }
    })

    // Close dropdown when any menu-action with data-view is clicked
    document.querySelectorAll('.menu-action.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => closeAll())
    })
  })()

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
  // Refresh corpus selects so KFA / Tagging views show the newly created corpora
  refreshCorpusSelects()
  // Clear stale KFA data so the Results view doesn't show data from a previous project
  state.kfaData = null
  state.kfaC1 = ''
  state.kfaC2 = ''
  state.kfaTagger = null
  updateActiveTaggerBadge(null)
  // Hide chart + table until user explicitly loads a KFA from the new project
  for (const sfx of ['', '-standalone']) {
    document.getElementById('chart-container' + sfx)?.classList.add('hidden')
    document.getElementById('table-container' + sfx)?.classList.add('hidden')
  }
})

// Boot: check if a project is already open (e.g. launched with --open flag)
checkInitialProject(shared)

// Load tag definitions from ttwtools (non-blocking)
api.tags.list().then(list => {
  if (Array.isArray(list)) {
    state.tagDefs = Object.fromEntries(list.map(t => [t.tag, t.definition]))
  }
}).catch(() => { })

  // ── Theme toggle ───────────────────────────────────────────────────────────
  ; (function () {
    const html = document.documentElement
    const btn = document.getElementById('btn-theme-toggle')
    const icon = document.getElementById('theme-icon')

    function _autoTheme() {
      const h = new Date().getHours()
      return (h >= 8 && h < 18) ? 'ttwlight' : 'ttwdark'
    }

    function _setThemeIcon(theme) {
      if (!icon) return
      icon.setAttribute('data-lucide', theme === 'ttwdark' ? 'moon' : 'sun')
      renderLucideIcons()
    }

    const saved = localStorage.getItem('ttw-theme')
    const active = saved || _autoTheme()
    html.setAttribute('data-theme', active)
    _setThemeIcon(active)

    btn?.addEventListener('click', () => {
      const current = html.getAttribute('data-theme') || 'ttwdark'
      const next = current === 'ttwdark' ? 'ttwlight' : 'ttwdark'
      html.setAttribute('data-theme', next)
      localStorage.setItem('ttw-theme', next)
      _setThemeIcon(next)
    })
  })()
