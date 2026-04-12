/**
 * views/corpus.js — Lógica da tela de Corpora.
 */

async function loadCorpusList() {
  const container = document.getElementById('corpus-list');
  try {
    const { corpora } = await API.corpus.list();
    if (!corpora.length) {
      container.innerHTML = '<p class="placeholder">Nenhum corpus carregado.</p>';
      return corpora;
    }

    const rows = await Promise.all(corpora.map(async name => {
      const { files } = await API.corpus.files(name);
      return { name, count: files.length };
    }));

    container.innerHTML = rows.map(r => `
      <div class="corpus-item">
        <span class="corpus-name">${r.name}</span>
        <span class="corpus-meta">${r.count} arquivo(s)</span>
      </div>`).join('');

    return corpora;
  } catch (e) {
    container.innerHTML = `<p class="placeholder">Erro: ${e.message}</p>`;
    return [];
  }
}

// Importar pasta
document.getElementById('btn-import-folder').addEventListener('click', async () => {
  const confirmed = await Modal.show({
    titleText: 'Importar pasta de corpus',
    bodyHTML: `
      <label>Nome do corpus
        <input type="text" id="modal-corpus-name" placeholder="ex: corpus_A" />
      </label>
      <label>Caminho da pasta no disco
        <input type="text" id="modal-folder-path" placeholder="/caminho/para/pasta" />
      </label>`,
    confirmLabel: 'Importar',
  });

  if (!confirmed) return;

  const name   = document.getElementById('modal-corpus-name')?.value?.trim();
  const folder = document.getElementById('modal-folder-path')?.value?.trim();

  if (!name || !folder) { showToast('Preencha todos os campos.', 'error'); return; }

  try {
    const { imported } = await API.corpus.importFolder({ corpus_name: name, folder_path: folder });
    showToast(`${imported} arquivo(s) importados para '${name}'.`);
    await loadCorpusList();
    await refreshCorpusSelects();
  } catch (e) {
    showToast(e.message, 'error');
  }
});

// Upload de arquivo único
document.getElementById('btn-upload-file').addEventListener('click', async () => {
  const confirmed = await Modal.show({
    titleText: 'Upload de arquivo .txt',
    bodyHTML: `
      <label>Nome do corpus
        <input type="text" id="modal-up-corpus" placeholder="ex: corpus_A" />
      </label>
      <label>Arquivo
        <input type="file" id="modal-up-file" accept=".txt" />
      </label>`,
    confirmLabel: 'Enviar',
  });

  if (!confirmed) return;

  const name = document.getElementById('modal-up-corpus')?.value?.trim();
  const file = document.getElementById('modal-up-file')?.files?.[0];

  if (!name || !file) { showToast('Selecione um corpus e um arquivo.', 'error'); return; }

  try {
    await API.corpus.uploadFile(name, file);
    showToast(`'${file.name}' enviado para '${name}'.`);
    await loadCorpusList();
    await refreshCorpusSelects();
  } catch (e) {
    showToast(e.message, 'error');
  }
});

// Atualiza todos os <select> de corpus nas outras views
async function refreshCorpusSelects() {
  try {
    const { corpora } = await API.corpus.list();
    populateSelect(document.getElementById('tag-corpus-select'),  corpora, '-- selecione --');
    populateSelect(document.getElementById('kfa-corpus1'),         corpora, '-- selecione --');
    populateSelect(document.getElementById('kfa-corpus2'),         corpora, '-- selecione --');
  } catch (_) {}
}
