/**
 * views/tagging.js — Tagging form with tagger tree + done badges.
 *
 * Shows a tree of taggers (like quickrun) with green ✓ for already-completed
 * taggers. Allows selecting multiple corpora from the project.
 */

import { api }       from '../api.js'
import { showToast } from '../ui.js'
import { loadCorpusList } from './corpus.js'

let _jobId     = null
let _pollTimer = null
let _projectManifest = null

// ── Status box ──────────────────────────────────────────────────────────────

function setStatus(stateName, msg) {
  const box = document.getElementById('tagging-status')
  box.className = `status-box ${stateName}`
  box.textContent = msg
  box.classList.remove('hidden')
}

// ── Sync Project State & Populate Corpora ───────────────────────────────────

async function _syncProjectState() {
  const noProj = document.getElementById('tag-no-project')
  const form   = document.getElementById('form-tagging')

  try {
    const { path } = await api.project.current()
    if (path) {
      noProj?.classList.add('hidden')
      form?.classList.remove('hidden')
      await _loadProjectData()
    } else {
      noProj?.classList.remove('hidden')
      form?.classList.add('hidden')
    }
  } catch (_) {
    noProj?.classList.remove('hidden')
    form?.classList.add('hidden')
  }
}

async function _loadProjectData() {
  try {
    const { items } = await api.project.manifest()
    _projectManifest = items

    // Extract unique corpora
    const corpora = [...new Set(
      items.filter(i => i.category === 'corpora').map(i => i.corpus)
    )].sort()

    const listContainer = document.getElementById('tag-corpus-list')
    if (!listContainer) return

    if (corpora.length === 0) {
      listContainer.innerHTML = '<div class="text-base-content/50">Nenhum corpus no projeto.</div>'
      return
    }

    // Preserve selection
    const previouslySelected = Array.from(
      document.querySelectorAll('.tag-corpus-cb:checked')
    ).map(cb => cb.value)

    listContainer.innerHTML = corpora.map(c => {
      const checked = previouslySelected.includes(c) || previouslySelected.length === 0 ? 'checked' : ''
      return `
        <label class="flex items-center gap-2 cursor-pointer py-0.5">
          <input type="checkbox" class="tag-corpus-cb checkbox checkbox-sm" value="${c}" ${checked} />
          <span class="text-sm font-semibold text-base-content">${c}</span>
        </label>
      `
    }).join('')

    // Listen to corpus changes to update done badges
    document.querySelectorAll('.tag-corpus-cb').forEach(cb => {
      cb.addEventListener('change', _refreshDoneBadges)
    })

    _refreshDoneBadges()
  } catch (e) {
    console.error('Failed to load project manifest', e)
  }
}

// ── Done badges ─────────────────────────────────────────────────────────────

function _refreshDoneBadges() {
  if (!_projectManifest) return

  const selectedCorpora = Array.from(
    document.querySelectorAll('.tag-corpus-cb:checked')
  ).map(cb => cb.value)

  const allBadges = document.querySelectorAll('#tag-tagger-tree .tag-done-badge')
  // Reset all badges
  allBadges.forEach(b => b.classList.add('hidden'))

  if (selectedCorpora.length === 0) return

  // Find taggers that are done for ALL selected corpora
  const taggersDone = new Set()

  document.querySelectorAll('#tag-tagger-tree .tag-tagger-cb').forEach(cb => {
    const tagger = cb.value
    // Check if this tagger exists in tagged items for EVERY selected corpus
    const isDoneForAll = selectedCorpora.every(corpus => {
      return _projectManifest.some(i => i.category === 'tagged' && i.corpus === corpus && i.tagger_type === tagger)
    })
    if (isDoneForAll) taggersDone.add(tagger)
  })

  // Show badges for done taggers
  document.querySelectorAll('#tag-tagger-tree .tag-tagger-cb').forEach(cb => {
    if (taggersDone.has(cb.value)) {
      const badge = cb.closest('label')?.querySelector('.tag-done-badge')
      if (badge) badge.classList.remove('hidden')
    }
  })
}

// ── Checkbox tree logic ─────────────────────────────────────────────────────

function _setupTreeCheckboxes() {
  const allCb     = document.querySelector('.tag-all-cb')
  const groupCbs  = document.querySelectorAll('.tag-group-cb')
  const taggerCbs = document.querySelectorAll('.tag-tagger-cb')

  // "Todos" checkbox — check/uncheck all
  allCb?.addEventListener('change', () => {
    const checked = allCb.checked
    groupCbs.forEach(cb => { cb.checked = checked })
    taggerCbs.forEach(cb => { cb.checked = checked })
  })

  // Group checkbox — check/uncheck children
  groupCbs.forEach(gcb => {
    gcb.addEventListener('change', () => {
      const group = gcb.dataset.group
      document.querySelectorAll(`.tag-tagger-cb[data-group="${group}"]`).forEach(cb => {
        cb.checked = gcb.checked
      })
      _syncAllCb()
    })
  })

  // Individual tagger checkbox — sync group and "Todos"
  taggerCbs.forEach(cb => {
    cb.addEventListener('change', () => {
      _syncGroupCb(cb.dataset.group)
      _syncAllCb()
    })
  })

  function _syncGroupCb(group) {
    if (!group) return
    const gcb = document.querySelector(`.tag-group-cb[data-group="${group}"]`)
    if (!gcb) return
    const children = document.querySelectorAll(`.tag-tagger-cb[data-group="${group}"]`)
    gcb.checked = Array.from(children).every(c => c.checked)
    gcb.indeterminate = !gcb.checked && Array.from(children).some(c => c.checked)
  }

  function _syncAllCb() {
    if (!allCb) return
    const all = Array.from(taggerCbs)
    allCb.checked = all.every(c => c.checked)
    allCb.indeterminate = !allCb.checked && all.some(c => c.checked)
  }
}

// ── Init ────────────────────────────────────────────────────────────────────

export function initTagging() {
  _setupTreeCheckboxes()

  // Show/hide BiberPlus NLP options based on biberplus checkbox
  const biberCb = document.querySelector('.tag-tagger-cb[value="biberplus"]')
  const nlpWrap = document.getElementById('tag-usenlp-wrap')

  function _syncBiberNlp() {
    if (!nlpWrap) return
    nlpWrap.style.display = biberCb?.checked ? '' : 'none'
  }

  biberCb?.addEventListener('change', _syncBiberNlp)
  _syncBiberNlp()

  // Refresh project state when the tagging view becomes visible
  const observer = new MutationObserver(() => {
    const view = document.getElementById('view-tagging')
    if (view?.classList.contains('active')) {
      _syncProjectState()
    }
  })
  const taggingView = document.getElementById('view-tagging')
  if (taggingView) {
    observer.observe(taggingView, { attributes: true, attributeFilter: ['class'] })
  }

  // Form submit — run tagging for each selected corpus and tagger sequentially
  document.getElementById('form-tagging')?.addEventListener('submit', async e => {
    e.preventDefault()

    const selectedCorpora = Array.from(
      document.querySelectorAll('.tag-corpus-cb:checked')
    ).map(cb => cb.value)

    if (selectedCorpora.length === 0) {
      showToast('Selecione ao menos um corpus.', 'error')
      return
    }

    // Gather selected taggers
    const selectedTaggers = Array.from(
      document.querySelectorAll('#tag-tagger-tree .tag-tagger-cb:checked')
    ).map(cb => cb.value)

    if (!selectedTaggers.length) {
      showToast('Selecione ao menos um tagger.', 'error')
      return
    }

    const usenlp = document.querySelector('input[name="tag-biber-mode"]:checked')?.value === 'use_nlp'
    const saveTagged = document.getElementById('tag-save-tagged').checked
    const nProcesses = parseInt(document.getElementById('tag-nprocesses').value, 10)

    // Run pairs one by one
    for (const corpus of selectedCorpora) {
      for (const tagger of selectedTaggers) {
        const body = {
          corpus_name:    corpus,
          source:         'project',
          tagger,
          usenlp:         tagger === 'biberplus' ? usenlp : false,
          save_tagged:    saveTagged,
          n_processes:    nProcesses,
          function_words: false,
        }

        try {
          setStatus('running', `Iniciando ${tagger} em ${corpus}…`)
          const { job_id } = await api.tagging.run(body)
          _jobId = job_id

          // Poll until done
          await new Promise((resolve, reject) => {
            if (_pollTimer) clearInterval(_pollTimer)
            _pollTimer = setInterval(async () => {
              try {
                const job = await api.tagging.status(_jobId)
                if (job.status === 'done') {
                  clearInterval(_pollTimer); _pollTimer = null
                  resolve()
                } else if (job.status === 'error') {
                  clearInterval(_pollTimer); _pollTimer = null
                  reject(new Error(job.error))
                } else {
                  let disp = `[${corpus}] ${tagger}: ${job.msg || job.status}…`
                  if (job.tqdm) disp += '\n' + job.tqdm
                  setStatus('running', disp)
                }
              } catch (err) {
                clearInterval(_pollTimer); _pollTimer = null
                reject(err)
              }
            }, 2000)
          })
        } catch (err) {
          setStatus('error', `Erro em ${tagger} (${corpus}): ${err.message}`)
          showToast(`Erro em ${tagger} (${corpus}): ${err.message}`, 'error')
          return   // stop on first error
        }
      }
    }

    // All done
    setStatus('done', `Tagging concluído!`)
    showToast('Tagging concluído!')
    await loadCorpusList()
    await _loadProjectData() // refresh manifest and badges
  })
}
