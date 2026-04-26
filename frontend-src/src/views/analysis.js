/**
 * views/analysis.js — KFA form.
 */

import { api }                    from '../api.js'
import { showToast, showView }    from '../ui.js'

export function initAnalysis({ refreshKfaSelect }) {
  document.getElementById('form-kfa')?.addEventListener('submit', async e => {
    e.preventDefault()

    const c1   = document.getElementById('kfa-corpus1').value
    const c2   = document.getElementById('kfa-corpus2').value
    const t1   = document.getElementById('kfa-tagger1').value
    const t2   = document.getElementById('kfa-tagger2').value
    const join = document.getElementById('kfa-join').value

    if (!c1 || !c2) { showToast('Selecione os dois corpora.', 'error'); return }
    if (c1 === c2)  { showToast('Os corpora devem ser diferentes.', 'error'); return }

    const btn = e.target.querySelector('button[type="submit"]')
    btn.disabled    = true
    btn.textContent = 'Executando…'

    try {
      const result = await api.analysis.runKfa({
        corpus1_name:    c1,
        corpus2_name:    c2,
        min_effect_size: 0,
        join,
        save_to_project: true,
        tagger1:         t1,
        tagger2:         t2,
      })
      showToast(`KFA concluída: ${result.n_features} features calculadas.`)
      await refreshKfaSelect()
      showView('results')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      btn.disabled    = false
      btn.textContent = 'Executar KFA'
    }
  })
}
