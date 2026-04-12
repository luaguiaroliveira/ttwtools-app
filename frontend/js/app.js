/**
 * app.js — Inicialização e lógica global (projeto novo/abrir).
 */

// ---------------------------------------------------------------------------
// Utilitário de projeto
// ---------------------------------------------------------------------------

async function _updateProjectLabel() {
  try {
    const { path } = await API.project.current();
    const label = document.getElementById('project-label');
    if (path) {
      const parts = path.replace(/\\/g, '/').split('/');
      label.textContent = parts[parts.length - 1];
      label.title = path;
    } else {
      label.textContent = 'Nenhum projeto';
      label.title = '';
    }
  } catch (_) {}
}

async function _afterProjectOpened() {
  await _updateProjectLabel();
  await loadCorpusList();
  await refreshCorpusSelects();
  await refreshKfaSelect();
  showView('corpus');
}

// ---------------------------------------------------------------------------
// Novo projeto
// ---------------------------------------------------------------------------

async function doNewProject() {
  const confirmed = await Modal.show({
    titleText: 'Criar novo projeto',
    bodyHTML: `
      <label>Caminho do arquivo <code>.ttwa</code>
        <input type="text" id="modal-new-path" placeholder="/caminho/meu_projeto.ttwa" />
      </label>
      <label>Nome do projeto
        <input type="text" id="modal-new-name" placeholder="Meu Projeto" />
      </label>`,
    confirmLabel: 'Criar',
  });
  if (!confirmed) return;

  const path = document.getElementById('modal-new-path')?.value?.trim();
  const name = document.getElementById('modal-new-name')?.value?.trim();

  if (!path) { showToast('Informe o caminho do arquivo.', 'error'); return; }

  try {
    await API.project.create({ path, name, overwrite: false });
    showToast(`Projeto '${name || path}' criado.`);
    await _afterProjectOpened();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ---------------------------------------------------------------------------
// Abrir projeto
// ---------------------------------------------------------------------------

async function doOpenProject() {
  const confirmed = await Modal.show({
    titleText: 'Abrir projeto .ttwa',
    bodyHTML: `
      <label>Caminho do arquivo <code>.ttwa</code>
        <input type="text" id="modal-open-path" placeholder="/caminho/meu_projeto.ttwa" />
      </label>`,
    confirmLabel: 'Abrir',
  });
  if (!confirmed) return;

  const path = document.getElementById('modal-open-path')?.value?.trim();
  if (!path) { showToast('Informe o caminho.', 'error'); return; }

  try {
    await API.project.open({ path });
    showToast('Projeto aberto.');
    await _afterProjectOpened();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Botões home + sidebar
document.getElementById('btn-home-open')?.addEventListener('click', () => doOpenProject());
document.getElementById('btn-new-project')?.addEventListener('click', doNewProject);
document.getElementById('btn-open-project')?.addEventListener('click', doOpenProject);

// Home cards
const _btnHomeNew = document.getElementById('btn-home-newanalysis');
if (_btnHomeNew) _btnHomeNew.addEventListener('click', () => showView('quickrun'));

// ---------------------------------------------------------------------------
// Folder picker (botões 📁)
// ---------------------------------------------------------------------------

document.querySelectorAll('.btn-browse').forEach(btn => {
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const prev = btn.textContent;
    btn.textContent = '…';
    try {
      const res = await API.utils.pickFolder();
      if (res?.path) {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        if (input) {
          // Para o campo de output_ttwa: sugere pasta + nome automático
          if (targetId === 'qr-output') {
            const c1 = document.getElementById('qr-c1-name')?.value?.trim() || 'corpus1';
            const c2 = document.getElementById('qr-c2-name')?.value?.trim() || 'corpus2';
            input.value = res.path + '/' + c1 + '_vs_' + c2 + '.ttwa';
          } else {
            input.value = res.path;
          }
          input.dispatchEvent(new Event('change'));
        }
      }
    } catch (_) {
      // usuário cancelou ou erro — silencioso
    } finally {
      btn.textContent = prev;
      btn.disabled = false;
    }
  });
});

// ---------------------------------------------------------------------------
// Quickrun
// ---------------------------------------------------------------------------

const QR_STEPS = ['queued', 'tagging', 'normalizing', 'kfa', 'saving', 'done'];
let _qrJobId = null;
let _qrPollTimer = null;

function _qrSetStep(step, isError) {
  document.querySelectorAll('.progress-step').forEach(el => {
    const s = el.dataset.step;
    el.classList.remove('active', 'done', 'error');
    if (isError && s === step) {
      el.classList.add('error');
    } else if (!isError) {
      const idx = QR_STEPS.indexOf(s);
      const cur = QR_STEPS.indexOf(step);
      if (idx < cur) el.classList.add('done');
      else if (idx === cur) el.classList.add('active');
    }
  });
}

function _qrMsg(msg) {
  const el = document.getElementById('qr-msg');
  if (el) el.textContent = msg || '';
}

async function _qrPoll() {
  try {
    const r = await API.quickrun.status(_qrJobId);
    _qrSetStep(r.step, r.status === 'error');
    _qrMsg(r.message || '');

    if (r.status === 'done') {
      clearInterval(_qrPollTimer);
      _qrPollTimer = null;
      showToast('Análise concluída!');
      await _updateProjectLabel();
      const btnRes = document.getElementById('btn-qr-results');
      if (btnRes) btnRes.classList.remove('hidden');
      // preload KFA select so results view is ready
      try { await refreshKfaSelect(); } catch (_) {}
      return;
    }
    if (r.status === 'error') {
      clearInterval(_qrPollTimer);
      _qrPollTimer = null;
      showToast(r.error || 'Erro na análise.', 'error');
    }
  } catch (err) {
    clearInterval(_qrPollTimer);
    _qrPollTimer = null;
    showToast(err.message, 'error');
  }
}

document.getElementById('form-quickrun')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const get = id => document.getElementById(id)?.value?.trim();
  // auto-append .ttwa se necessário
  let outputPath = get('qr-output') || '';
  if (outputPath && !outputPath.toLowerCase().endsWith('.ttwa')) {
    outputPath = outputPath.replace(/\/$/, '') + '.ttwa';
  }
  const body = {
    corpus1_name:   get('qr-c1-name'),
    corpus1_folder: get('qr-c1-folder'),
    corpus2_name:   get('qr-c2-name'),
    corpus2_folder: get('qr-c2-folder'),
    output_ttwa:    outputPath,
    mode:           get('qr-mode'),
    join:           get('qr-join'),
    min_effect:     parseFloat(get('qr-effect') || '0.2'),
    usenlp:         document.getElementById('qr-usenlp')?.checked ?? true,
    n_processes:    1,
    overwrite:      true,
  };

  if (!body.corpus1_name || !body.corpus1_folder || !body.corpus2_name || !body.corpus2_folder || !body.output_ttwa) {
    showToast('Preencha todos os campos obrigatórios.', 'error');
    return;
  }

  // reset UI
  _qrSetStep('queued', false);
  _qrMsg('Iniciando…');
  const progress = document.getElementById('qr-progress');
  if (progress) progress.classList.remove('hidden');
  const btnRes = document.getElementById('btn-qr-results');
  if (btnRes) btnRes.classList.add('hidden');

  try {
    const { job_id } = await API.quickrun.start(body);
    _qrJobId = job_id;
    _qrPollTimer = setInterval(_qrPoll, 1500);
  } catch (err) {
    showToast(err.message, 'error');
  }
});

document.getElementById('btn-qr-results')?.addEventListener('click', async () => {
  try { await refreshKfaSelect(); } catch (_) {}
  showView('results');
});

// ---------------------------------------------------------------------------
// Boot: verifica se já há projeto aberto (iniciado via --open)
// ---------------------------------------------------------------------------

(async () => {
  await _updateProjectLabel();
  const { path } = await API.project.current().catch(() => ({ path: null }));
  if (path) {
    await loadCorpusList();
    await refreshCorpusSelects();
    await refreshKfaSelect();
    showView('corpus');
  }
})();
