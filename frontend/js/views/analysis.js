/**
 * views/analysis.js — Formulário de KFA.
 */

document.getElementById('form-kfa').addEventListener('submit', async e => {
  e.preventDefault();

  const c1     = document.getElementById('kfa-corpus1').value;
  const c2     = document.getElementById('kfa-corpus2').value;
  const effect = parseFloat(document.getElementById('kfa-effect').value);
  const join   = document.getElementById('kfa-join').value;

  if (!c1 || !c2)    { showToast('Selecione os dois corpora.', 'error'); return; }
  if (c1 === c2)     { showToast('Os corpora devem ser diferentes.', 'error'); return; }
  if (isNaN(effect)) { showToast('Effect size inválido.', 'error'); return; }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Executando…';

  try {
    const result = await API.analysis.runKfa({
      corpus1_name:    c1,
      corpus2_name:    c2,
      min_effect_size: effect,
      join,
      save_to_project: true,
    });
    showToast(`KFA concluída: ${result.n_features} features com |d| ≥ ${effect}.`);
    await refreshKfaSelect();
    showView('results');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Executar KFA';
  }
});
