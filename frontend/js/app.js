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
document.getElementById('btn-home-new').addEventListener('click', doNewProject);
document.getElementById('btn-home-open').addEventListener('click', doOpenProject);
document.getElementById('btn-new-project').addEventListener('click', doNewProject);
document.getElementById('btn-open-project').addEventListener('click', doOpenProject);

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
