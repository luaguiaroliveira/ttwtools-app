/**
 * views/tagging.js — Lógica da tela de Tagging BiberPlus.
 */

let _tagJobId = null;
let _tagPollTimer = null;

document.getElementById('form-tagging').addEventListener('submit', async e => {
  e.preventDefault();

  const corpus = document.getElementById('tag-corpus-select').value;
  if (!corpus) { showToast('Selecione um corpus.', 'error'); return; }

  const body = {
    corpus_name:  corpus,
    source:       'project',
    usenlp:       document.getElementById('tag-usenlp').checked,
    save_tagged:  document.getElementById('tag-save-tagged').checked,
    n_processes:  parseInt(document.getElementById('tag-nprocesses').value, 10),
    function_words: false,
  };

  try {
    const { job_id } = await API.tagging.run(body);
    _tagJobId = job_id;
    _setTagStatus('running', `Job iniciado (${job_id.slice(0,8)}…). Aguardando…`);
    _startPolling();
  } catch (e) {
    showToast(e.message, 'error');
  }
});

function _setTagStatus(state, msg) {
  const box = document.getElementById('tagging-status');
  box.className = `status-box ${state}`;
  box.textContent = msg;
  box.classList.remove('hidden');
}

function _startPolling() {
  if (_tagPollTimer) clearInterval(_tagPollTimer);
  _tagPollTimer = setInterval(_pollTagJob, 2000);
}

async function _pollTagJob() {
  if (!_tagJobId) return;
  try {
    const job = await API.tagging.status(_tagJobId);
    if (job.status === 'done') {
      clearInterval(_tagPollTimer);
      _setTagStatus('done', 'Tagging concluído com sucesso!');
      showToast('Tagging concluído!');
      await loadCorpusList();
    } else if (job.status === 'error') {
      clearInterval(_tagPollTimer);
      _setTagStatus('error', `Erro: ${job.error}`);
      showToast(job.error, 'error');
    } else {
      _setTagStatus('running', `Status: ${job.status}…`);
    }
  } catch (err) {
    clearInterval(_tagPollTimer);
    _setTagStatus('error', `Falha ao consultar status: ${err.message}`);
  }
}
